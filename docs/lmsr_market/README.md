# LMSR Prediction Market on Sui

A decentralized prediction market implementation using the **LMSR (Logarithmic Market Scoring Rule)** algorithm on the Sui blockchain. This contract allows users to trade shares of future outcomes with dynamic pricing based on market supply and demand.

## Features

- **LMSR AMM**: Automated Market Maker that provides continuous liquidity and automatic price discovery.
- **Flexible Outcomes**: Supports binary (Yes/No) or multi-outcome markets.
- **Universal Token Support**: Works with any Sui `Coin<T>` (e.g., SUI, USDC, etc.).
- **Fee Mechanism**: 1% trading fee (configurable) collected by the market creator.
- **Dynamic Liquidity**: Admin can inject additional liquidity to reduce price slippage ($b$ parameter).
- **Position Objects**: Users receive tradeable `Position` objects representing their shares.

## Prerequisites

1. **Install Sui CLI**: [Installation Guide](https://docs.sui.io/guides/developer/getting-started/sui-install)
2. **Connect to Testnet**:
   ```bash
   sui client switch --env testnet
   # If testnet env is not found:
   # sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
   ```
3. **Get Testnet SUI**:
   Join [Sui Discord](https://discord.gg/sui) to request tokens in the faucet channel, or use:
   ```bash
   sui client faucet
   ```

## Contract Structure

- `sources/market.move`: Core logic (Create, Buy, Sell, Resolve, Redeem).
- `sources/math.move`: High-precision fixed-point math library (ln, exp) required for LMSR cost functions.

## Deployment & Usage

### 1. Build the Project
```bash
cd lmsr_market
sui move build
```

### 2. Deploy to Testnet
Publish the package. Make sure you have enough gas.
```bash
sui client publish --gas-budget 100000000
```

**⚠️ IMPORTANT**: After deployment, look at the console output "Object Changes" section. Save the following IDs:
1. **Package ID**: The ID of the published package (Immutable).
2. **AdminCap ID**: The ID of the `AdminCap` object owned by you.
3. **UpgradeCap ID**: The ID of the `UpgradeCap` object.

### 3. Interactions Guide

In the examples below, replace variables like `$PACKAGE_ID` with your actual IDs. 
For testing, we will use **SUI** as the payment currency (`0x2::sui::SUI`).

#### Step 0: Find your Coin ID
To create a market or buy shares, you need a Coin object ID.
```bash
sui client gas
```
*Pick a Coin ID that has enough balance.*

#### Step 1: Create Market
Create a new market with initial liquidity.
*   **Args**: `Question`, `Outcomes`, `Coin Object ID` (Initial Liquidity), `Fee BPS` (100 = 1%).
*   **Note**: The CLI parses vectors like `['Yes', 'No']`.

```bash
export PACKAGE_ID=0x... # Your Package ID
export COIN_ID=0x...    # A Coin object ID with e.g. 500 SUI

sui client call \
  --package $PACKAGE_ID \
  --module market \
  --function create_market \
  --type_args 0x2::sui::SUI \
  --args "Will BTC hit 100k in 2024?" "[Yes, No]" $COIN_ID 100 \
  --gas-budget 30000000
```
*Save the **Market ID** and **AdminCap ID** from the output.*

#### Step 2: Buy Shares
User buys shares of an outcome.
*   **Args**: `Market ID`, `Outcome Index` (0 for Yes, 1 for No), `Payment Coin ID`, `Min Shares Out` (Slippage protection, 0 for test).

```bash
export MARKET_ID=0x...
export PAYMENT_COIN_ID=0x... # Another Coin object for payment

# Buy 'Yes' (Index 0)
sui client call \
  --package $PACKAGE_ID \
  --module market \
  --function buy \
  --type_args 0x2::sui::SUI \
  --args $MARKET_ID 0 $PAYMENT_COIN_ID 0 \
  --gas-budget 30000000
```
*Check your wallet or explorer to see the new `Position` object.*

#### Step 3: Sell Shares
User sells shares back to the market.
*   **Args**: `Market ID`, `Position Object ID`.

```bash
export POSITION_ID=0x... # ID of the Position object you just bought

sui client call \
  --package $PACKAGE_ID \
  --module market \
  --function sell \
  --type_args 0x2::sui::SUI \
  --args $MARKET_ID $POSITION_ID \
  --gas-budget 30000000
```

#### Step 4: Resolve Market (Admin Only)
The market owner decides the outcome.
*   **Args**: `AdminCap ID`, `Market ID`, `Winner Index`.

```bash
export ADMIN_CAP_ID=0x...

# Set 'No' (Index 1) as winner
sui client call \
  --package $PACKAGE_ID \
  --module market \
  --function resolve \
  --type_args 0x2::sui::SUI \
  --args $ADMIN_CAP_ID $MARKET_ID 1 \
  --gas-budget 30000000
```

#### Step 5: Redeem Winnings
Winners burn their position tokens for payout. Losers get nothing.
*   **Args**: `Market ID`, `Position ID`.

```bash
sui client call \
  --package $PACKAGE_ID \
  --module market \
  --function redeem \
  --type_args 0x2::sui::SUI \
  --args $MARKET_ID $POSITION_ID \
  --gas-budget 30000000
```

#### Step 6: Claim Fees (Admin Only)
Withdraw collected trading fees.

```bash
sui client call \
  --package $PACKAGE_ID \
  --module market \
  --function claim_fees \
  --type_args 0x2::sui::SUI \
  --args $ADMIN_CAP_ID $MARKET_ID \
  --gas-budget 30000000
```

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | `EMarketResolved` | Operation failed because market is already resolved. |
| 2 | `EMarketNotResolved` | Operation failed because market is NOT yet resolved. |
| 4 | `EInsufficientPayment` | Payment too low or slippage limit reached (min_shares_out). |
| 5 | `EEmptyOutcomes` | Market created with fewer than 2 outcomes. |
| 6 | `EOutcomeIndexOutOfBounds` | Selected outcome index does not exist. |
| 7 | `EInvalidPosition` | Position object belongs to a different market. |
| 8 | `EInsufficientLiquidity` | Initial funding is too low to calculate a valid `b` param. |

