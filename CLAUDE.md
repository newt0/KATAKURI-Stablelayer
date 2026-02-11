# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KATAKURI is a real-time prediction market for combat sports on Sui blockchain, built for the Sui Vibe Hackathon 2026 (Stablelayer Track + Sui Track). Users predict fight outcomes using `katakuriUSD`, a branded stablecoin minted via Stablelayer from USDC. Funds locked in the market automatically earn yield through Bucket Protocol.

## Repository Layout

The project has three main components under `docs/`:

- **`docs/lmsr_market/`** — Sui Move contract implementing an LMSR (Logarithmic Market Scoring Rule) prediction market AMM. This is the reference/sample contract.
- **`docs/stable-layer-sdk/`** — TypeScript SDK wrapping Stablelayer protocol operations (mint/burn/claim). Published as npm package with dual ESM/CJS.
- **`docs/your-stable-app/`** — React frontend (Vite + React 19 + TailwindCSS + Radix UI). Connects to Sui via `@mysten/dapp-kit`.

Planned but not yet populated:
- **`contracts/`** — Will contain the production `katakuri_market` Move contract (enhanced version of `lmsr_market` with events and getters).
- **`dapps/`** — Future dApp code.

Implementation plans: `docs/implementation-plan.en.md` (English), `docs/implementation-plan.md` (Japanese).

## Commands

### Frontend (`docs/your-stable-app/`)
```bash
pnpm install
pnpm dev          # Vite dev server (auto-opens browser)
pnpm build        # TypeScript check + Vite production build
pnpm lint         # ESLint (ESLINT_USE_FLAT_CONFIG=false)
pnpm format       # Prettier
```

### SDK (`docs/stable-layer-sdk/`)
```bash
pnpm install
pnpm build        # esbuild bundles + tsc declarations
pnpm dev          # tsc --watch (type checking only)
pnpm test         # Vitest (watch mode, requires network — runs against Sui mainnet)
pnpm test -- --run  # Single test run
pnpm clean        # Remove dist/
```

### Move Contract (`docs/lmsr_market/`)
```bash
sui move build
sui client publish --gas-budget 100000000   # Deploy to testnet
```

Package manager is **pnpm** throughout.

## Architecture

### Core Design: PTB Composition

Stablelayer integration happens at the **frontend PTB (Programmable Transaction Block) level**, not inside Move contracts. This is intentional — Stablelayer's mint/burn requires interaction with many external objects (Bucket Protocol treasury, PSM pools, saving pools, price oracles). Embedding these as Move dependencies would be fragile and complex.

The frontend composes Stablelayer SDK calls and market Move calls into a single atomic PTB:
- **Buy flow**: `StableLayerClient.buildMintTx()` (USDC→katakuriUSD) + `market::buy` in one PTB
- **Sell flow**: `market::sell` → user receives katakuriUSD, optionally burns via `StableLayerClient.buildBurnTx()`
- **Redeem flow**: `market::redeem` after market resolution
- **Yield**: `StableLayerClient.buildClaimTx()` claims yield accrued via Bucket Protocol Saving Pool

### Move Contract (`market.move`)

`Market<phantom T>` is generic over any coin type. Key objects:
- `Market` (shared) — holds LMSR state: outcomes, q_values, balance, fees, resolution status
- `AdminCap` — capability object for market admin operations (resolve, claim fees)
- `Position` — user's share position in a specific outcome

LMSR pricing uses Q64 fixed-point arithmetic (`math.move`) with `ln`/`exp` implementations.

### SDK (`StableLayerClient`)

Single public class wrapping Sui transaction building for three operations:
- `buildMintTx()` — USDC → stablecoin mint + vault farm deposit
- `buildBurnTx()` — stablecoin → USDC via burn request + fulfillment
- `buildClaimTx()` — collect accumulated yield

Generated bindings in `src/generated/` (auto-generated, do not edit). On-chain object IDs live in `src/libs/constants.ts`.

### Frontend

React 19 + Vite + TailwindCSS with Shadcn/Radix UI components. Wallet connection via `@mysten/dapp-kit` and `@suiware/kit`. Deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Move Contract Error Codes

| Code | Name | Meaning |
|------|------|---------|
| 1 | `EMarketResolved` | Market already resolved |
| 2 | `EMarketNotResolved` | Market not yet resolved |
| 4 | `EInsufficientPayment` | Payment too low / slippage exceeded |
| 5 | `EEmptyOutcomes` | Fewer than 2 outcomes |
| 6 | `EOutcomeIndexOutOfBounds` | Invalid outcome index |
| 7 | `EInvalidPosition` | Position belongs to different market |
| 8 | `EInsufficientLiquidity` | Initial funding too low |

## Key Conventions

- Move contracts use **Move 2024 syntax** (`edition = "2024.beta"`): `let mut`, `vector[]` literals, etc.
- Blockchain target is **Sui Testnet**.
- The branded stablecoin is called **katakuriUSD** (not FightUSD — a rename was reverted).
- SDK tests (`test/e2e/client.test.ts`) perform dry runs against Sui mainnet — no local chain needed but network access is required.
- Frontend uses `ESLINT_USE_FLAT_CONFIG=false` for ESLint compatibility.
