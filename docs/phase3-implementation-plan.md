# Phase 3: Frontend Integration — Implementation Plan

## Overview

KATAKURI予測マーケットのフロントエンドを `dapps/katakuri-app/` に構築する。
既存の `docs/your-stable-app/` をベースに、YourStable固有のコードをKATAKURI予測マーケット用に置き換える。

### デプロイ済みコントラクト情報

| Item | Value |
|------|-------|
| Package ID | `0xded795f539f2fea80bb9791e66a294f5541978897508128a8ec71c2a378445c5` |
| Network | Sui Testnet |
| Modules | `market`, `math` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KATAKURI Frontend                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Pages        │  │  Components  │  │  Hooks (React Query)  │  │
│  │  - Market     │  │  - MarketCard│  │  - useMarket          │  │
│  │  - Markets    │  │  - BuyForm   │  │  - useMarketList      │  │
│  │  - Admin      │  │  - SellForm  │  │  - useBuyShares       │  │
│  │               │  │  - Probbar   │  │  - useSellShares      │  │
│  │               │  │  - Positions │  │  - usePositions        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬────────────┘  │
│         └─────────────────┼─────────────────────┘               │
│                           │                                     │
│                  ┌────────▼────────┐                             │
│                  │  PTB Builders   │                             │
│                  │  (transactions) │                             │
│                  └────────┬────────┘                             │
│                           │                                     │
│            ┌──────────────┼──────────────┐                      │
│            │              │              │                       │
│     ┌──────▼──────┐ ┌────▼─────┐ ┌──────▼──────┐               │
│     │ Stablelayer  │ │ Market   │ │ Sui SDK     │               │
│     │ SDK          │ │ moveCall │ │ (dapp-kit)  │               │
│     └─────────────┘ └──────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
dapps/katakuri-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                          # Entry point
│   ├── components/
│   │   ├── App.tsx                       # Root: providers, routing
│   │   ├── layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx                # KATAKURI branding + wallet connect
│   │   │   ├── Body.tsx
│   │   │   └── Footer.tsx
│   │   ├── CustomConnectButton.tsx       # Reuse from your-stable-app
│   │   ├── NetworkSupportChecker.tsx     # Reuse
│   │   └── ThemeSwitcher.tsx             # Reuse
│   ├── dapp/
│   │   ├── pages/
│   │   │   ├── MarketsPage.tsx           # Market一覧ページ
│   │   │   ├── MarketPage.tsx            # 個別マーケットページ（Buy/Sell/Redeem）
│   │   │   └── AdminPage.tsx             # Admin: Create Market / Resolve
│   │   ├── components/
│   │   │   ├── MarketCard.tsx            # マーケット一覧用カード
│   │   │   ├── ProbabilityBar.tsx        # 確率バー表示
│   │   │   ├── BuySharesForm.tsx         # シェア購入フォーム
│   │   │   ├── SellPositionForm.tsx      # ポジション売却フォーム
│   │   │   ├── RedeemForm.tsx            # 精算フォーム
│   │   │   ├── PositionsList.tsx         # 保有ポジション一覧
│   │   │   ├── MarketInfo.tsx            # マーケット情報表示
│   │   │   ├── CreateMarketForm.tsx      # マーケット作成フォーム (Admin)
│   │   │   └── ResolveMarketForm.tsx     # マーケット解決フォーム (Admin)
│   │   ├── hooks/
│   │   │   ├── useMarket.ts              # マーケット情報取得
│   │   │   ├── useMarketEvents.ts        # マーケット一覧（イベントベース）
│   │   │   ├── usePositions.ts           # ユーザーのPosition取得
│   │   │   ├── useBuyShares.ts           # Buy mutation
│   │   │   ├── useSellShares.ts          # Sell mutation
│   │   │   ├── useRedeemPosition.ts      # Redeem mutation
│   │   │   ├── useCreateMarket.ts        # Create Market mutation (Admin)
│   │   │   ├── useResolveMarket.ts       # Resolve mutation (Admin)
│   │   │   └── useEstimateCost.ts        # devInspect for cost estimation
│   │   ├── helpers/
│   │   │   └── transactions.ts           # PTB builders (market ops + Stablelayer)
│   │   └── config/
│   │       └── index.ts                  # Package ID, coin types, constants
│   ├── providers/
│   │   └── ThemeProvider.tsx             # Reuse
│   ├── hooks/
│   │   └── useNetworkConfig.tsx          # Reuse
│   ├── config/
│   │   ├── network.ts                    # Package IDs per network
│   │   └── themes.ts                     # Reuse
│   ├── helpers/
│   │   ├── network.ts                    # Explorer URL helpers
│   │   ├── notification.tsx              # Toast helpers
│   │   └── misc.ts                       # Utilities
│   ├── types/
│   │   ├── ENetwork.ts
│   │   └── market.ts                     # Market, Position, Outcome types
│   └── styles/
│       └── index.css                     # Tailwind + custom styles
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.mjs
├── postcss.config.mjs
├── .eslintrc.cjs
├── .prettierrc.mjs
└── package.json
```

---

## Implementation Steps

### Step 3-1: Project Scaffold

`docs/your-stable-app/` をベースに `dapps/katakuri-app/` を作成する。

**作業内容:**
1. `docs/your-stable-app/` を `dapps/katakuri-app/` にコピー
2. 再利用するファイル（変更なし）:
   - `src/main.tsx`
   - `src/providers/ThemeProvider.tsx`
   - `src/hooks/useNetworkConfig.tsx`
   - `src/config/themes.ts`
   - `src/types/ENetwork.ts`
   - `src/helpers/` (network, theme, notification, misc)
   - `src/components/CustomConnectButton.tsx`
   - `src/components/NetworkSupportChecker.tsx`
   - `src/components/ThemeSwitcher.tsx`
   - `src/components/Loading.tsx`
   - `src/components/Notification.tsx`
   - `src/components/layout/` (Layout, Body, Extra)
   - 設定ファイル群 (vite.config.ts, tsconfig.json, tailwind.config.mjs, postcss, eslint, prettier)
3. 削除するファイル（YourStable固有）:
   - `src/dapp/` ディレクトリ全体
   - `your-stable-sdk` 依存
4. `package.json` を更新:
   - name: `katakuri-app`
   - `your-stable-sdk` を削除
   - `stable-layer-sdk` を追加（ローカルパスまたはnpm）
   - `bucket-protocol-sdk` は残す（yield APY計算用）
5. `.env.local` を作成:
   ```
   VITE_TESTNET_CONTRACT_PACKAGE_ID=0xded795f539f2fea80bb9791e66a294f5541978897508128a8ec71c2a378445c5
   ```

### Step 3-2: 型定義 & コンフィグ

**`src/types/market.ts`** — マーケット関連の型定義

```typescript
export interface MarketInfo {
  id: string
  question: string
  outcomes: string[]
  b: number
  resolved: boolean
  winner: number | null
  balance: number
  probabilities: number[]  // 0-1 の確率
}

export interface PositionInfo {
  id: string
  marketId: string
  outcomeIndex: number
  shares: number
}

export interface MarketEvent {
  marketId: string
  question: string
  numOutcomes: number
  b: number
  feeBps: number
  txDigest: string
  timestamp: number
}
```

**`src/dapp/config/index.ts`** — コントラクト定数

```typescript
export const KATAKURI_PACKAGE_ID = import.meta.env.VITE_TESTNET_CONTRACT_PACKAGE_ID
export const MARKET_MODULE = 'market'

// katakuriUSD coin type (テスト時はSUIを使用)
export const KATAKURI_USD_TYPE = '0x2::sui::SUI'

// Market type for queries
export const MARKET_TYPE = `${KATAKURI_PACKAGE_ID}::market::Market<${KATAKURI_USD_TYPE}>`
export const POSITION_TYPE = `${KATAKURI_PACKAGE_ID}::market::Position`
export const ADMIN_CAP_TYPE = `${KATAKURI_PACKAGE_ID}::market::AdminCap`

// Event types
export const MARKET_CREATED_EVENT = `${KATAKURI_PACKAGE_ID}::market::MarketCreated`
export const SHARES_BOUGHT_EVENT = `${KATAKURI_PACKAGE_ID}::market::SharesBought`
export const MARKET_RESOLVED_EVENT = `${KATAKURI_PACKAGE_ID}::market::MarketResolved`
```

### Step 3-3: PTB Transaction Builders

**`src/dapp/helpers/transactions.ts`** — コア取引ロジック

全ての取引をPTBとして構築する。テスト段階ではSUIを直接使用し、本番ではStablelayer SDKを統合してUSDC→katakuriUSD変換をPTB内で合成する。

```typescript
import { Transaction } from '@mysten/sui/transactions'
import { SuiClient } from '@mysten/sui/client'
import { KATAKURI_PACKAGE_ID, MARKET_MODULE, KATAKURI_USD_TYPE } from '../config'

// --- Market操作 ---

/** マーケット作成 */
export function buildCreateMarketTx(
  question: string,
  outcomes: string[],
  fundCoinId: string,
  feeBps: number,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'create_market',
    typeArguments: [KATAKURI_USD_TYPE],
    arguments: [
      tx.pure.string(question),
      tx.pure(bcs.vector(bcs.string()).serialize(outcomes).toBytes()),
      tx.object(fundCoinId),
      tx.pure.u64(feeBps),
    ],
  })
  return tx
}

/** シェア購入 (SUI直接版) */
export function buildBuyTx(
  marketId: string,
  outcomeIndex: number,
  amount: bigint,
  minSharesOut: number,
): Transaction {
  const tx = new Transaction()
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'buy',
    typeArguments: [KATAKURI_USD_TYPE],
    arguments: [
      tx.object(marketId),
      tx.pure.u64(outcomeIndex),
      coin,
      tx.pure.u64(minSharesOut),
    ],
  })
  return tx
}

/** ポジション売却 */
export function buildSellTx(
  marketId: string,
  positionId: string,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'sell',
    typeArguments: [KATAKURI_USD_TYPE],
    arguments: [
      tx.object(marketId),
      tx.object(positionId),
    ],
  })
  return tx
}

/** 勝利ポジション精算 */
export function buildRedeemTx(
  marketId: string,
  positionId: string,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'redeem',
    typeArguments: [KATAKURI_USD_TYPE],
    arguments: [
      tx.object(marketId),
      tx.object(positionId),
    ],
  })
  return tx
}

/** マーケット解決 (Admin) */
export function buildResolveTx(
  adminCapId: string,
  marketId: string,
  winnerIndex: number,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'resolve',
    typeArguments: [KATAKURI_USD_TYPE],
    arguments: [
      tx.object(adminCapId),
      tx.object(marketId),
      tx.pure.u64(winnerIndex),
    ],
  })
  return tx
}
```

**Stablelayer統合版 (将来のkatakuriUSD版):**

```typescript
// --- Stablelayer PTB合成版 (katakuriUSD使用時) ---

/** USDC → katakuriUSD → Buy Shares (単一PTB) */
export async function buildMintAndBuyTx(
  stablelayer: StableLayerClient,
  marketId: string,
  outcomeIndex: number,
  usdcAmount: bigint,
  minSharesOut: number,
): Promise<Transaction> {
  const tx = new Transaction()

  // Step 1: USDC → katakuriUSD
  const katakuriCoin = await stablelayer.buildMintTx({
    tx,
    stableCoinType: KATAKURI_USD_TYPE,
    usdcCoin: coinWithBalance({ balance: usdcAmount, type: USDC_TYPE })(tx),
    amount: usdcAmount,
    autoTransfer: false,
  })

  // Step 2: katakuriUSD → Buy Shares
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'buy',
    typeArguments: [KATAKURI_USD_TYPE],
    arguments: [
      tx.object(marketId),
      tx.pure.u64(outcomeIndex),
      katakuriCoin!,
      tx.pure.u64(minSharesOut),
    ],
  })

  return tx
}
```

### Step 3-4: React Hooks

**`useMarket.ts`** — マーケット情報取得

```typescript
// suiClient.getObject() でマーケットのオンチェーンデータを取得
// content.fields から question, outcomes, b, resolved, winner, balance を抽出
// devInspect で get_outcome_probability を呼び出し確率を取得
```

**`useMarketEvents.ts`** — マーケット一覧

```typescript
// suiClient.queryEvents() で MarketCreated イベントをクエリ
// 各マーケットのIDと基本情報を取得
// React Query でキャッシュ
```

**`usePositions.ts`** — ユーザー保有ポジション

```typescript
// suiClient.getOwnedObjects() で Position type のオブジェクトをフィルタ
// 各ポジションの market_id, outcome_index, shares を取得
```

**`useBuyShares.ts`** — Buy mutation

```typescript
// useTransact (@suiware/kit) を使用
// buildBuyTx() でトランザクション構築 → 署名・実行
// 成功時にマーケット情報とポジションを再取得
```

**`useEstimateCost.ts`** — コスト見積もり

```typescript
// suiClient.devInspectTransactionBlock() で estimate_buy_cost を呼び出し
// ユーザーにリアルタイムでコスト表示
```

### Step 3-5: UI Pages

#### MarketsPage (マーケット一覧)

```
┌─────────────────────────────────────┐
│  KATAKURI Prediction Market         │
│  ┌─────────────────────────────────┐│
│  │ "Who wins the fight?"           ││
│  │ ┌──────────┐ ┌──────────┐      ││
│  │ │Fighter A │ │Fighter B │      ││
│  │ │  65%     │ │  35%     │      ││
│  │ └──────────┘ └──────────┘      ││
│  │ Balance: 1.5 SUI   [Open →]   ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ "Championship bout"            ││
│  │ ┌──────────┐ ┌──────────┐      ││
│  │ │Champ     │ │Challenger│      ││
│  │ │  52%     │ │  48%     │      ││
│  │ └──────────┘ └──────────┘      ││
│  │ Balance: 0.8 SUI   [Open →]   ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**コンポーネント構成:**
- `MarketsPage` — マーケット一覧ページ
  - `MarketCard` × N — 各マーケットの要約表示
    - `ProbabilityBar` — 確率のビジュアル表示

#### MarketPage (個別マーケット)

```
┌─────────────────────────────────────┐
│  "Who wins the fight?"              │
│  Status: Active / Resolved          │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Probabilities                   ││
│  │ Fighter A  ████████████░░  65%  ││
│  │ Fighter B  █████░░░░░░░░░  35%  ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌──────── Buy Shares ────────────┐ │
│  │ Outcome: [Fighter A ▼]        │ │
│  │ Amount:  [____] SUI            │ │
│  │ Est. Shares: ~1,234            │ │
│  │ Est. Cost: 0.05 SUI            │ │
│  │                                │ │
│  │ [Buy Shares]                   │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌──── Your Positions ────────────┐ │
│  │ Fighter A: 500 shares [Sell]   │ │
│  │ Fighter B: 200 shares [Sell]   │ │
│  └────────────────────────────────┘ │
│                                     │
│  Market Info:                       │
│  • Pool: 1.5 SUI                   │
│  • Liquidity (b): 2,165,042        │
│  • Fee: 1%                         │
└─────────────────────────────────────┘
```

**コンポーネント構成:**
- `MarketPage` — ルートページ（React Routerの `/market/:id`）
  - `MarketInfo` — マーケット基本情報
  - `ProbabilityBar` — 確率バー
  - `BuySharesForm` — 購入フォーム
    - Outcome選択 (Select)
    - Amount入力 (TextField)
    - コスト見積もり表示 (useEstimateCost)
    - Buy ボタン (useBuyShares)
  - `PositionsList` — 保有ポジション一覧
    - 各ポジションに Sell / Redeem ボタン
  - `SellPositionForm` — 売却確認ダイアログ
  - `RedeemForm` — 精算（解決済みマーケットのみ表示）

#### AdminPage (管理者ページ)

```
┌─────────────────────────────────────┐
│  Admin Panel                        │
│                                     │
│  ┌──── Create Market ─────────────┐ │
│  │ Question: [_________________]  │ │
│  │ Outcomes: [Fighter A]          │ │
│  │           [Fighter B]          │ │
│  │           [+ Add Outcome]      │ │
│  │ Initial Fund: [____] SUI      │ │
│  │ Fee: [100] bps                 │ │
│  │ [Create Market]                │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌──── Resolve Market ────────────┐ │
│  │ Your Markets:                  │ │
│  │ • "Who wins?" [Resolve →]      │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**コンポーネント構成:**
- `AdminPage` — 管理者ページ
  - `CreateMarketForm` — マーケット作成フォーム
  - `ResolveMarketForm` — マーケット解決フォーム（AdminCapを所有するマーケットのみ表示）

### Step 3-6: Routing Setup

**`src/components/App.tsx`** の変更:

```typescript
<BrowserRouter basename="/">
  <Routes>
    <Route index path="/" element={<MarketsPage />} />
    <Route path="/market/:id" element={<MarketPage />} />
    <Route path="/admin" element={<AdminPage />} />
  </Routes>
</BrowserRouter>
```

- defaultNetworkを `ENetwork.TESTNET` に変更
- walletSlushNameを `'KATAKURI'` に変更

### Step 3-7: Header Branding

**`src/components/layout/Header.tsx`** の変更:
- ロゴ/タイトルを「KATAKURI」に変更
- ナビゲーションリンク追加: Markets / Admin
- 格闘技テーマのカラーリング（赤/黒基調）

---

## Data Flow

### マーケット一覧の取得フロー

```
1. queryEvents({ MoveEventType: MarketCreated }) → market_id[] 取得
2. 各 market_id に対して getObject() → Market struct fields 取得
3. devInspect(get_outcome_probability) → 各アウトカムの確率計算
4. React Query でキャッシュ（30秒のstaleTime）
```

### Buy フロー

```
User Input (amount, outcome)
    │
    ├─ [テスト] SUI を直接使用:
    │   tx.splitCoins(tx.gas, [amount])
    │   tx.moveCall(market::buy)
    │
    └─ [本番] Stablelayer PTB合成:
        StableLayerClient.buildMintTx(USDC → katakuriUSD, autoTransfer=false)
        tx.moveCall(market::buy, katakuriCoin)
    │
    ▼
useTransact(@suiware/kit) → wallet sign → execute
    │
    ▼
onSuccess → refetch market data, positions
```

### Sell フロー

```
User selects Position → tx.moveCall(market::sell)
    │
    ▼
execute → user receives refund coin
    │
    └─ [Option] Stablelayer burn: katakuriUSD → USDC
```

---

## Dependencies

### 追加するパッケージ

```json
{
  "dependencies": {
    "stable-layer-sdk": "file:../../docs/stable-layer-sdk"
  }
}
```

### 削除するパッケージ

```json
{
  "your-stable-sdk": "削除"
}
```

### 継続利用するパッケージ

| Package | 用途 |
|---------|------|
| `@mysten/dapp-kit` | ウォレット接続、useSuiClient |
| `@mysten/sui` | Transaction, SuiClient |
| `@suiware/kit` | SuiProvider, useTransact |
| `@radix-ui/*` | UIコンポーネント |
| `@tanstack/react-query` | サーバーステート管理 |
| `react-hot-toast` | 通知 |
| `react-router` | ルーティング |
| `tailwindcss` | スタイリング |

---

## Implementation Order

| # | Task | 見積もり | 依存 |
|---|------|---------|------|
| 3-1 | プロジェクトスキャフォルド | — | — |
| 3-2 | 型定義 & コンフィグ (`types/market.ts`, `dapp/config/`) | — | 3-1 |
| 3-3 | PTB Transaction Builders (`dapp/helpers/transactions.ts`) | — | 3-2 |
| 3-4 | データ取得 Hooks (`useMarket`, `useMarketEvents`, `usePositions`, `useEstimateCost`) | — | 3-2 |
| 3-5 | Mutation Hooks (`useBuyShares`, `useSellShares`, `useRedeemPosition`, `useCreateMarket`, `useResolveMarket`) | — | 3-3 |
| 3-6 | `ProbabilityBar` コンポーネント | — | 3-4 |
| 3-7 | `MarketCard` コンポーネント | — | 3-4, 3-6 |
| 3-8 | `MarketsPage` (マーケット一覧) | — | 3-7 |
| 3-9 | `BuySharesForm` + `PositionsList` | — | 3-4, 3-5 |
| 3-10 | `MarketPage` (個別マーケット) | — | 3-6, 3-9 |
| 3-11 | `CreateMarketForm` + `ResolveMarketForm` | — | 3-5 |
| 3-12 | `AdminPage` | — | 3-11 |
| 3-13 | Routing & Header 更新 | — | 3-8, 3-10, 3-12 |
| 3-14 | ビルド検証 (`pnpm build`) | — | 3-13 |
| 3-15 | E2E手動テスト（テストネット） | — | 3-14 |

---

## Key Design Decisions

### 1. テスト時はSUIを直接使用

katakuriUSDの発行にはStablelayerチームとの連携が必要（TreasuryCap作成、StableRegistry登録など）。ハッカソンのデモ段階ではSUIを `Market<SUI>` として直接使用し、Stablelayer統合コードは別ブランチで準備する。

コントラクトは `Market<phantom T>` でジェネリックなので、`T = SUI` でも `T = katakuriUSD` でもフロントのtype引数を変えるだけで対応可能。

### 2. マーケット一覧はイベントベース

オンチェーンにはマーケットのレジストリがないため、`MarketCreated` イベントをクエリしてマーケットIDを収集する。パフォーマンス上の問題がある場合は、パッケージIDでフィルタした `getOwnedObjects` + `getDynamicFields` を検討。

### 3. 確率計算はdevInspect

`get_outcome_probability` はオンチェーンのView関数。`suiClient.devInspectTransactionBlock()` で呼び出し、返り値（Q64固定小数点）をフロントエンドで `Number(result) / 2^64` に変換して表示する。

### 4. フロントエンドは `dapps/katakuri-app/` に配置

`docs/your-stable-app/` はリファレンス実装として残し、新規に `dapps/katakuri-app/` を作成する。これにより既存のSDKドキュメントに影響を与えない。

---

## Verification Criteria

1. `pnpm install && pnpm build` がエラーなく完了する
2. `pnpm dev` でローカルサーバーが起動する
3. ウォレット接続が動作する（テストネット）
4. マーケット一覧ページにデプロイ済みマーケットが表示される
5. シェア購入フローが動作する（SUI使用）
6. 保有ポジションが表示される
7. ポジション売却が動作する
8. マーケット解決 → 勝利ポジション精算が動作する
9. 確率バーがリアルタイムで更新される
10. Admin画面からマーケット作成ができる
