# KATAKURI 実装計画 — Stablelayer統合予測市場

## 概要

KATAKURIは、格闘技のライブストリームに統合されたリアルタイム予測市場である。
Stablelayerのブランドステーブルコイン `FightUSD` を採用し、予測市場の構造的課題である**機会損失問題**（ベットに使用した資金がDeFi利回りを逃す）を解決する。

**アプローチ: ハイブリッド（アプローチC）**
- **Moveコントラクト**: ブランドステーブルコイン専用のLMSR予測市場
- **フロントエンド/PTB**: Stablelayer SDKを使ったUSDC⇄FightUSD変換を市場操作と合成

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                   フロントエンド (Next.js)                 │
│                                                         │
│  ┌─────────────────┐    ┌────────────────────────────┐  │
│  │ Stablelayer SDK  │    │     Sui SDK (PTB構築)       │  │
│  │ - buildMintTx    │    │  - market::buy             │  │
│  │ - buildBurnTx    │    │  - market::sell            │  │
│  │ - buildClaimTx   │    │  - market::redeem          │  │
│  └────────┬────────┘    └─────────────┬──────────────┘  │
│           │                           │                  │
│           └───────────┬───────────────┘                  │
│                       │                                  │
│              ┌────────▼────────┐                         │
│              │   単一PTBに合成   │                         │
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

### 利回りの流れ

```
ユーザーのUSDC
    │
    ▼ Stablelayer mint
FightUSD (1:1ペグ) ──→ 予測市場にデポジット
    │
    ▼ 裏側で自動的に
Bucket Protocol Saving Pool ──→ 利回り発生
    │
    ▼ ユーザーがいつでも
stable_vault_farm::claim ──→ 利回り回収
```

---

## ディレクトリ構成

```
contracts/katakuri_market/
├── Move.toml
├── sources/
│   ├── math.move           # Q64固定小数点演算
│   └── market.move         # LMSR予測市場コントラクト
└── tests/
    └── market_tests.move   # ユニットテスト
```

---

## Moveコントラクト詳細設計

### 1. math.move

既存の `docs/lmsr_market/sources/math.move` をそのまま流用する。

| 関数 | 説明 |
|------|------|
| `to_q64(x: u64): u128` | u64整数 → Q64固定小数点変換 |
| `from_q64(x: u128): u64` | Q64 → u64変換（切り捨て） |
| `mul(x: u128, y: u128): u128` | Q64乗算 |
| `div(x: u128, y: u128): u128` | Q64除算 |
| `ln(x: u128): u128` | 自然対数（20ビット精度） |
| `exp(x: u128): u128` | 指数関数（テイラー展開6次） |

変更点: モジュール名を `katakuri_market::math` に変更するのみ。

### 2. market.move

既存の `docs/lmsr_market/sources/market.move` をベースに改良する。

#### オブジェクト定義

```move
/// 市場オブジェクト (Shared)
public struct Market<phantom T> has key {
    id: UID,
    question: String,
    outcomes: vector<String>,
    b: u64,                     // LMSR流動性パラメータ b
    q_values: vector<u64>,      // 各アウトカムの発行済シェア数
    balance: Balance<T>,        // 流動性 + ユーザー資金
    fee_balance: Balance<T>,    // 蓄積された手数料
    fee_bps: u64,               // 手数料（ベーシスポイント、100 = 1%）
    resolved: bool,
    winner: Option<u64>,
}

/// 管理者権限
public struct AdminCap has key, store {
    id: UID,
    market_id: ID,
}

/// ユーザーポジション
public struct Position has key, store {
    id: UID,
    market_id: ID,
    outcome_index: u64,
    shares: u64,
}
```

#### 既存関数（ベースロジック維持）

| 関数 | 説明 | 変更 |
|------|------|------|
| `create_market<T>` | 市場作成。初期資金から b を計算 | イベント追加 |
| `buy<T>` | シェア購入。LMSR価格計算 | イベント追加 |
| `sell<T>` | シェア売却。ポジション消費 | イベント追加 |
| `resolve<T>` | 市場解決。Admin専用 | イベント追加 |
| `redeem<T>` | 勝利ポジション精算 | イベント追加 |
| `claim_fees<T>` | 手数料引き出し。Admin専用 | 変更なし |
| `add_liquidity<T>` | 流動性追加。Admin専用 | 変更なし |
| `claim_surplus<T>` | 残余資金引き出し。Admin専用 | 変更なし |

#### 追加するイベント

```move
/// 市場作成イベント
public struct MarketCreated has copy, drop {
    market_id: ID,
    question: String,
    num_outcomes: u64,
    b: u64,
    fee_bps: u64,
}

/// シェア購入イベント
public struct SharesBought has copy, drop {
    market_id: ID,
    buyer: address,
    outcome_index: u64,
    shares: u64,
    cost: u64,
}

/// シェア売却イベント
public struct SharesSold has copy, drop {
    market_id: ID,
    seller: address,
    outcome_index: u64,
    shares: u64,
    refund: u64,
}

/// 市場解決イベント
public struct MarketResolved has copy, drop {
    market_id: ID,
    winner: u64,
}

/// 精算イベント
public struct PositionRedeemed has copy, drop {
    market_id: ID,
    redeemer: address,
    outcome_index: u64,
    payout: u64,
}
```

#### 追加するgetter関数

```move
/// 各アウトカムの現在確率を取得（LMSR）
public fun get_outcome_probability<T>(market: &Market<T>, outcome_index: u64): u128

/// 指定シェア数の購入コストを見積もり
public fun estimate_buy_cost<T>(market: &Market<T>, outcome_index: u64, shares: u64): u64

/// 市場の基本情報取得
public fun get_market_info<T>(market: &Market<T>): (String, vector<String>, u64, bool, Option<u64>)

/// 市場の残高取得
public fun get_balance<T>(market: &Market<T>): u64
```

### 3. market_tests.move

既存テストをベースに以下のシナリオをカバーする。

| テスト | 説明 |
|--------|------|
| `test_create_market` | 市場作成、AdminCap発行確認 |
| `test_buy_shares` | シェア購入、ポジション発行確認 |
| `test_sell_shares` | シェア売却、返金確認 |
| `test_resolve_and_redeem` | 市場解決→勝利者精算 |
| `test_add_liquidity` | 流動性追加 |
| `test_claim_fees` | 手数料回収 |
| `test_error_cases` | エラーケース（解決済み市場への操作等） |

テストでは `SUI` をモック通貨として使用する（テスト環境でStablelayerは利用不可のため）。

---

## フロントエンドでのStablelayer統合（PTB合成）

Suiの**Programmable Transaction Block (PTB)** を活用し、Stablelayer SDK操作と市場操作を**単一トランザクション**に合成する。

### Buy フロー: USDC → FightUSD → シェア購入

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

  // Step 1: Stablelayer mint — USDC → FightUSD
  const fightUsdCoin = await stablelayer.buildMintTx({
    tx,
    stableCoinType: FIGHT_USD_TYPE,
    usdcCoin: coinWithBalance({
      balance: usdcAmount,
      type: USDC_TYPE,
    })(tx),
    amount: usdcAmount,
    autoTransfer: false,  // coinを返してもらう（transferしない）
  });

  // Step 2: KATAKURI Market buy — FightUSD でシェア購入
  tx.moveCall({
    package: KATAKURI_MARKET_PACKAGE,
    module: "market",
    function: "buy",
    typeArguments: [FIGHT_USD_TYPE],
    arguments: [
      tx.object(marketId),
      tx.pure.u64(outcomeIndex),
      fightUsdCoin,      // Step 1で得たcoin
      tx.pure.u64(0),    // min_shares_out（スリッページ保護）
    ],
  });

  return tx;
}
```

### Sell フロー: ポジション売却 → FightUSD → USDC

```typescript
async function sellShares(
  stablelayer: StableLayerClient,
  marketId: string,
  positionId: string,
  sender: string,
) {
  const tx = new Transaction();

  // Step 1: Market sell — ポジション消費 → FightUSD返却
  tx.moveCall({
    package: KATAKURI_MARKET_PACKAGE,
    module: "market",
    function: "sell",
    typeArguments: [FIGHT_USD_TYPE],
    arguments: [
      tx.object(marketId),
      tx.object(positionId),
    ],
  });

  // Step 2: Stablelayer burn — FightUSD → USDC
  // ※ sell後のcoinはユーザーに返却されるので、
  //    次のPTBで改めてburn操作を行う
  // （sell結果のcoinを直接PTB内で受け取る設計も可能）

  return tx;
}
```

### Redeem フロー: 市場解決後の精算

```typescript
async function redeemWinnings(
  stablelayer: StableLayerClient,
  marketId: string,
  positionId: string,
  sender: string,
) {
  const tx = new Transaction();

  // Step 1: Market redeem — 勝利ポジション精算 → FightUSD
  tx.moveCall({
    package: KATAKURI_MARKET_PACKAGE,
    module: "market",
    function: "redeem",
    typeArguments: [FIGHT_USD_TYPE],
    arguments: [
      tx.object(marketId),
      tx.object(positionId),
    ],
  });

  // FightUSDをそのまま保持するか、
  // Stablelayer burnでUSDCに戻すかはユーザー選択

  return tx;
}
```

### Claim Yield フロー: 利回り回収

```typescript
async function claimYield(
  stablelayer: StableLayerClient,
  sender: string,
) {
  const tx = new Transaction();

  // Stablelayerの利回りを回収
  await stablelayer.buildClaimTx({
    tx,
    stableCoinType: FIGHT_USD_TYPE,
    sender,
  });

  return tx;
}
```

---

## 実装ステップ

### Phase 1: Moveコントラクト（コア）

| # | タスク | 詳細 |
|---|--------|------|
| 1-1 | プロジェクト初期化 | `contracts/katakuri_market/` にMove.toml作成、Sui framework依存追加 |
| 1-2 | math.move | 既存math.moveをコピー、モジュール名変更 |
| 1-3 | market.move | 既存market.moveベースに、イベント・getter関数を追加 |
| 1-4 | market_tests.move | テスト作成、全テストパス確認 |
| 1-5 | ビルド確認 | `sui move build` 成功確認 |

### Phase 2: テストネットデプロイ

| # | タスク | 詳細 |
|---|--------|------|
| 2-1 | テストネットデプロイ | `sui client publish` で公開 |
| 2-2 | 動作確認 | CLI経由でcreate_market, buy, sell, resolve, redeemの一連フロー |

### Phase 3: フロントエンド統合（別タスク）

| # | タスク | 詳細 |
|---|--------|------|
| 3-1 | TypeScript SDK | 市場操作のラッパー関数作成 |
| 3-2 | Stablelayer PTB合成 | mint→buy, sell→burn の合成関数 |
| 3-3 | UI | Next.js + TailwindCSS + Shadcn でUI構築 |
| 3-4 | ウォレット接続 | @mysten/dapp-kit でウォレット統合 |

---

## 技術的制約と考慮事項

### Stablelayer統合はなぜMoveレベルではなくPTBレベルか

Stablelayerのmint/burn操作は以下の外部オブジェクトとの対話が必要：

```
stable_layer::mint
    → stable_vault_farm::receive
        → Bucket Protocol Treasury
        → Bucket Protocol PSM Pool
        → Bucket Protocol Saving Pool
        → Yield Vault
        → Price Oracle (aggregate prices)
```

これらをMoveコントラクト内から直接呼ぶと：
1. 全パッケージの依存関係が必要（コンパイル・デプロイが複雑化）
2. Bucket Protocolのアップグレードに脆弱
3. 価格オラクルの呼び出しパターンがSDK前提の設計

SuiのPTBは原子的に複数操作を合成できるため、フロントエンドでの統合が最適解である。

### FightUSD の準備

ブランドステーブルコインの発行にはStablelayerチームとの連携が必要：
1. `FightUSD` の `TreasuryCap` 作成
2. `StableRegistry` への登録（`stable_layer::new` or `stable_layer::default`）
3. `StableVaultFarm` への登録（`addEntity`）

テスト段階では既存のブランドステーブルコイン（例: `BtcUSDC`）を使って動作確認も可能。

### Move 2024構文

- ハッカソン要件で Move 2024 を使用
- 既存コードは既にMove 2024構文（`let mut`, `vector[]` リテラル等）で記述済み
- `edition = "2024.beta"` を Move.toml で指定

---

## エラーコード一覧

| コード | 名前 | 説明 |
|--------|------|------|
| 1 | `EMarketResolved` | 解決済み市場への操作 |
| 2 | `EMarketNotResolved` | 未解決市場での精算操作 |
| 4 | `EInsufficientPayment` | 支払い不足またはスリッページ超過 |
| 5 | `EEmptyOutcomes` | アウトカム数が2未満 |
| 6 | `EOutcomeIndexOutOfBounds` | 存在しないアウトカムインデックス |
| 7 | `EInvalidPosition` | 別の市場のポジション |
| 8 | `EInsufficientLiquidity` | 初期資金不足（b計算不可） |
