# KATAKURI Implementation Plan — Prediction Market with Stablelayer Integration

## Overview

KATAKURI is a real-time prediction market integrated into combat sports live streams.
By adopting Stablelayer's branded stablecoin `katakuriUSD`, it solves the structural **opportunity cost problem** of prediction markets — funds locked in bets miss out on DeFi yields.

**Approach: Hybrid (Approach C)**
- **Move Contract**: LMSR prediction market specialized for branded stablecoins
- **Frontend / PTB**: Composes USDC-to-katakuriUSD conversion via Stablelayer SDK with market operations

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                     │
│                                                         │
│  ┌─────────────────┐    ┌────────────────────────────┐  │
│  │ Stablelayer SDK  │    │     Sui SDK (PTB Builder)   │  │
│  │ - buildMintTx    │    │  - market::buy             │  │
│  │ - buildBurnTx    │    │  - market::sell            │  │
│  │ - buildClaimTx   │    │  - market::redeem          │  │
│  └────────┬────────┘    └─────────────┬──────────────┘  │
│           │                           │                  │
│           └───────────┬───────────────┘                  │
│                       │                                  │
│              ┌────────▼────────┐                         │
│              │ Compose into a  │                         │
│              │   single PTB    │                         │
│              └────────┬────────┘                         │
└───────────────────────┼─────────────────────────────────┘
                        │
        ════════════════╪══════════════════ Sui Blockchain
                        │
        ┌───────────────┼───────────────┐
        │               │               │
  ┌─────▼─────┐  ┌──────▼──────┐  ┌────▼────────────┐
  │ Stablelayer │  │  KATAKURI   │  │ Bucket Protocol  │
  │ (mint/burn) │  │  Market     │  │ (yield infra)    │
  │             │  │ (LMSR AMM)  │  │                  │
  └─────────────┘  └─────────────┘  └──────────────────┘
```

### Yield Flow

```
User's USDC
    │
    ▼ Stablelayer mint
katakuriUSD (1:1 peg) ──→ Deposited into prediction market
    │
    ▼ Automatically behind the scenes
Bucket Protocol Saving Pool ──→ Yield accrues
    │
    ▼ User can claim anytime
stable_vault_farm::claim ──→ Collect yield
```

---

## Directory Structure

```
contracts/katakuri_market/
├── Move.toml
├── sources/
│   ├── math.move           # Q64 fixed-point arithmetic
│   └── market.move         # LMSR prediction market contract
└── tests/
    └── market_tests.move   # Unit tests
```

---

## Move Contract Detailed Design

### 1. math.move

Reused directly from `docs/lmsr_market/sources/math.move`.

| Function | Description |
|----------|-------------|
| `to_q64(x: u64): u128` | Convert u64 integer to Q64 fixed-point |
| `from_q64(x: u128): u64` | Convert Q64 to u64 (truncating) |
| `mul(x: u128, y: u128): u128` | Q64 multiplication |
| `div(x: u128, y: u128): u128` | Q64 division |
| `ln(x: u128): u128` | Natural logarithm (20-bit precision) |
| `exp(x: u128): u128` | Exponential function (6th-order Taylor series) |

Only change: rename module to `katakuri_market::math`.

### 2. market.move

Built upon `docs/lmsr_market/sources/market.move` with enhancements.

#### Object Definitions

```move
/// Market object (Shared)
public struct Market<phantom T> has key {
    id: UID,
    question: String,
    outcomes: vector<String>,
    b: u64,                     // LMSR liquidity parameter b
    q_values: vector<u64>,      // Outstanding shares per outcome
    balance: Balance<T>,        // Liquidity + user funds
    fee_balance: Balance<T>,    // Accumulated fees
    fee_bps: u64,               // Fee in basis points (100 = 1%)
    resolved: bool,
    winner: Option<u64>,
}

/// Admin capability
public struct AdminCap has key, store {
    id: UID,
    market_id: ID,
}

/// User position
public struct Position has key, store {
    id: UID,
    market_id: ID,
    outcome_index: u64,
    shares: u64,
}
```

#### Existing Functions (Base Logic Preserved)

| Function | Description | Changes |
|----------|-------------|---------|
| `create_market<T>` | Create market. Calculates b from initial funds | Add event |
| `buy<T>` | Buy shares. LMSR price calculation | Add event |
| `sell<T>` | Sell shares. Consumes position | Add event |
| `resolve<T>` | Resolve market. Admin only | Add event |
| `redeem<T>` | Settle winning positions | Add event |
| `claim_fees<T>` | Withdraw fees. Admin only | No change |
| `add_liquidity<T>` | Add liquidity. Admin only | No change |
| `claim_surplus<T>` | Withdraw surplus. Admin only | No change |

#### Events to Add

```move
/// Market creation event
public struct MarketCreated has copy, drop {
    market_id: ID,
    question: String,
    num_outcomes: u64,
    b: u64,
    fee_bps: u64,
}

/// Share purchase event
public struct SharesBought has copy, drop {
    market_id: ID,
    buyer: address,
    outcome_index: u64,
    shares: u64,
    cost: u64,
}

/// Share sale event
public struct SharesSold has copy, drop {
    market_id: ID,
    seller: address,
    outcome_index: u64,
    shares: u64,
    refund: u64,
}

/// Market resolution event
public struct MarketResolved has copy, drop {
    market_id: ID,
    winner: u64,
}

/// Position redemption event
public struct PositionRedeemed has copy, drop {
    market_id: ID,
    redeemer: address,
    outcome_index: u64,
    payout: u64,
}
```

#### Getter Functions to Add

```move
/// Get the current probability of an outcome (LMSR)
public fun get_outcome_probability<T>(market: &Market<T>, outcome_index: u64): u128

/// Estimate the cost to buy a given number of shares
public fun estimate_buy_cost<T>(market: &Market<T>, outcome_index: u64, shares: u64): u64

/// Get basic market info
public fun get_market_info<T>(market: &Market<T>): (String, vector<String>, u64, bool, Option<u64>)

/// Get market balance
public fun get_balance<T>(market: &Market<T>): u64
```

### 3. market_tests.move

Based on existing tests, covering the following scenarios.

| Test | Description |
|------|-------------|
| `test_create_market` | Market creation, AdminCap issuance |
| `test_buy_shares` | Share purchase, Position issuance |
| `test_sell_shares` | Share sale, refund verification |
| `test_resolve_and_redeem` | Market resolution and winner settlement |
| `test_add_liquidity` | Liquidity addition |
| `test_claim_fees` | Fee collection |
| `test_error_cases` | Error cases (e.g., operations on resolved markets) |

Tests use `SUI` as a mock currency (Stablelayer is not available in the test environment).

---

## Stablelayer Integration via Frontend (PTB Composition)

Leveraging Sui's **Programmable Transaction Block (PTB)**, Stablelayer SDK operations and market operations are composed into a **single atomic transaction**.

### Buy Flow: USDC → katakuriUSD → Buy Shares

```typescript
import { StableLayerClient } from "stable-layer-sdk";
import { Transaction } from "@mysten/sui/transactions";

async function buyShares(
  stablelayer: StableLayerClient,
  marketId: string,
  outcomeIndex: number,
  usdcAmount: bigint,
  sender: string,
) {
  const tx = new Transaction();

  // Step 1: Stablelayer mint — USDC → katakuriUSD
  const katakuriCoin = await stablelayer.buildMintTx({
    tx,
    stableCoinType: KATAKURI_USD_TYPE,
    usdcCoin: coinWithBalance({
      balance: usdcAmount,
      type: USDC_TYPE,
    })(tx),
    amount: usdcAmount,
    autoTransfer: false,  // Return coin instead of transferring
  });

  // Step 2: KATAKURI Market buy — Purchase shares with katakuriUSD
  tx.moveCall({
    package: KATAKURI_MARKET_PACKAGE,
    module: "market",
    function: "buy",
    typeArguments: [KATAKURI_USD_TYPE],
    arguments: [
      tx.object(marketId),
      tx.pure.u64(outcomeIndex),
      katakuriCoin,      // Coin from Step 1
      tx.pure.u64(0),    // min_shares_out (slippage protection)
    ],
  });

  return tx;
}
```

### Sell Flow: Sell Position → katakuriUSD → USDC

```typescript
async function sellShares(
  stablelayer: StableLayerClient,
  marketId: string,
  positionId: string,
  sender: string,
) {
  const tx = new Transaction();

  // Step 1: Market sell — Consume position → katakuriUSD returned
  tx.moveCall({
    package: KATAKURI_MARKET_PACKAGE,
    module: "market",
    function: "sell",
    typeArguments: [KATAKURI_USD_TYPE],
    arguments: [
      tx.object(marketId),
      tx.object(positionId),
    ],
  });

  // Step 2: Stablelayer burn — katakuriUSD → USDC
  // The coin from sell is transferred to the user,
  // so the burn is performed in a subsequent PTB.
  // (Alternatively, design to capture the coin within the same PTB)

  return tx;
}
```

### Redeem Flow: Settlement After Market Resolution

```typescript
async function redeemWinnings(
  stablelayer: StableLayerClient,
  marketId: string,
  positionId: string,
  sender: string,
) {
  const tx = new Transaction();

  // Step 1: Market redeem — Settle winning position → katakuriUSD
  tx.moveCall({
    package: KATAKURI_MARKET_PACKAGE,
    module: "market",
    function: "redeem",
    typeArguments: [KATAKURI_USD_TYPE],
    arguments: [
      tx.object(marketId),
      tx.object(positionId),
    ],
  });

  // User chooses whether to hold katakuriUSD
  // or burn it back to USDC via Stablelayer

  return tx;
}
```

### Claim Yield Flow

```typescript
async function claimYield(
  stablelayer: StableLayerClient,
  sender: string,
) {
  const tx = new Transaction();

  // Collect accumulated yield from Stablelayer
  await stablelayer.buildClaimTx({
    tx,
    stableCoinType: KATAKURI_USD_TYPE,
    sender,
  });

  return tx;
}
```

---

## Implementation Steps

### Phase 1: Move Contract (Core)

| # | Task | Details |
|---|------|---------|
| 1-1 | Project initialization | Create Move.toml in `contracts/katakuri_market/`, add Sui framework dependency |
| 1-2 | math.move | Copy existing math.move, rename module |
| 1-3 | market.move | Based on existing market.move, add events and getter functions |
| 1-4 | market_tests.move | Write tests, verify all tests pass |
| 1-5 | Build verification | Confirm `sui move build` succeeds |

### Phase 2: Testnet Deployment

| # | Task | Details |
|---|------|---------|
| 2-1 | Testnet deploy | Publish via `sui client publish` |
| 2-2 | Verification | End-to-end flow via CLI: create_market, buy, sell, resolve, redeem |

### Phase 3: Frontend Integration (Separate Task)

| # | Task | Details |
|---|------|---------|
| 3-1 | TypeScript SDK | Create wrapper functions for market operations |
| 3-2 | Stablelayer PTB composition | Compose mint→buy and sell→burn flows |
| 3-3 | UI | Build with Next.js + TailwindCSS + Shadcn |
| 3-4 | Wallet connection | Integrate wallet via @mysten/dapp-kit |

---

## Technical Constraints and Considerations

### Why Stablelayer Integration Happens at PTB Level, Not Move Level

Stablelayer's mint/burn operations require interaction with multiple external objects:

```
stable_layer::mint
    → stable_vault_farm::receive
        → Bucket Protocol Treasury
        → Bucket Protocol PSM Pool
        → Bucket Protocol Saving Pool
        → Yield Vault
        → Price Oracle (aggregate prices)
```

Calling these directly from within a Move contract would:
1. Require all package dependencies (complicating compilation and deployment)
2. Be vulnerable to Bucket Protocol upgrades
3. Conflict with price oracle patterns designed around the SDK

Sui's PTB can atomically compose multiple operations, making frontend-level integration the optimal solution.

### Preparing katakuriUSD

Issuing a branded stablecoin requires coordination with the Stablelayer team:
1. Create the `TreasuryCap` for `katakuriUSD`
2. Register with `StableRegistry` (via `stable_layer::new` or `stable_layer::default`)
3. Register with `StableVaultFarm` (via `addEntity`)

During testing, an existing branded stablecoin (e.g., `BtcUSDC`) can be used for verification.

### Move 2024 Syntax

- Hackathon requires Move 2024
- Existing code already uses Move 2024 syntax (`let mut`, `vector[]` literals, etc.)
- `edition = "2024.beta"` specified in Move.toml

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | `EMarketResolved` | Operation on an already resolved market |
| 2 | `EMarketNotResolved` | Settlement operation on an unresolved market |
| 4 | `EInsufficientPayment` | Insufficient payment or slippage limit exceeded |
| 5 | `EEmptyOutcomes` | Fewer than 2 outcomes |
| 6 | `EOutcomeIndexOutOfBounds` | Non-existent outcome index |
| 7 | `EInvalidPosition` | Position belongs to a different market |
| 8 | `EInsufficientLiquidity` | Initial funding too low to calculate b |
