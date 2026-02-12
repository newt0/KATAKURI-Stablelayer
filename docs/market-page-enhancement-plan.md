# MarketPage デザイン強化実装計画

## Context（背景）

現在の `dapps/katakuri-app/src/dapp/pages/MarketPage.tsx` は機能的には動作しているものの、視覚的な魅力とユーザー体験に改善の余地があります。`docs/samples/in-fight-amm-frontend` の洗練されたデザインパターンを参考に、以下の課題を解決します：

**現在の課題：**
- シンプルすぎるレイアウトで、市場の活気が伝わりにくい
- Buy/Sell が分離されており、操作が煩雑
- 数量入力がプレーンなフォームで、視覚的フィードバックが少ない
- 価格推移が分からず、市場動向を把握しづらい
- 全体的に静的で、リアルタイム感が不足

**期待される成果：**
- ダークテーマとライムグリーンアクセントによるプロフェッショナルな外観
- Buy/Sell を統合した直感的な取引フォーム
- 価格チャートによる市場動向の可視化
- アニメーションと視覚効果によるリアルタイム感の演出
- 段階的リリースによる安全な導入

---

## 実装アプローチ：段階的リリース

### Phase 1: ダークテーマ基盤整備
**目的：** グローバルなダークテーマを適用し、統一感のある色体系を確立

**作業内容：**
1. Tailwind config にダークテーマカラーを追加
2. グローバルCSSでダークモードを適用
3. 既存コンポーネントのスタイルをダークテーマに対応

**リスク：** 低（CSSのみの変更、ロジックに影響なし）

---

### Phase 2: コアUI改善
**目的：** Buy/Sell統合フォームと+/-数量セレクターを実装

**作業内容：**
1. `BuySharesForm` に Buy/Sell モード切り替えを追加
2. 数量セレクターを +/- ボタン型に変更
3. Sell 機能をフォームに統合
4. 基本的なスタイル改善（カード、バッジ、トランジション）
5. `PositionsList` から Sell ボタンを削除し、折りたたみ機能を追加

**リスク：** 中（既存コンポーネントの大幅な変更、十分なテストが必要）

---

### Phase 3: 高度な視覚機能
**目的：** PriceChart と MarketOverview を追加し、視覚的魅力を最大化

**作業内容：**
1. `PriceChart` コンポーネント作成（Canvas実装）
2. `MarketOverview` コンポーネント作成（複数アウトカム対応）
3. MarketPage にチャートデータ状態管理を追加
4. レイアウトを再構成（区切り線パターン）

**リスク：** 中（新規コンポーネント、Canvas実装の複雑性）

---

## Critical Files（重要ファイル）

実装に最も重要な5つのファイル：

1. **`/Users/air/00_Current/KATAKURI-Stablelayer/dapps/katakuri-app/tailwind.config.mjs`**
   - ダークテーマカラー定義（primary, dark.bg, dark.card, dark.border）

2. **`/Users/air/00_Current/KATAKURI-Stablelayer/dapps/katakuri-app/src/dapp/components/BuySharesForm.tsx`**
   - Buy/Sell統合、+/-セレクター、最も大きな変更

3. **`/Users/air/00_Current/KATAKURI-Stablelayer/dapps/katakuri-app/src/dapp/pages/MarketPage.tsx`**
   - レイアウト再構成、チャートデータ管理

4. **`/Users/air/00_Current/KATAKURI-Stablelayer/dapps/katakuri-app/src/dapp/components/PriceChart.tsx`**（新規作成）
   - Canvas チャート実装

5. **`/Users/air/00_Current/KATAKURI-Stablelayer/dapps/katakuri-app/src/dapp/components/MarketOverview.tsx`**（新規作成）
   - 複数アウトカム対応の市場概要コンポーネント

**参考実装ファイル：**
- `/Users/air/00_Current/KATAKURI-Stablelayer/docs/samples/in-fight-amm-frontend/components/FighterCard.tsx`
- `/Users/air/00_Current/KATAKURI-Stablelayer/docs/samples/in-fight-amm-frontend/components/PriceChart.tsx`
- `/Users/air/00_Current/KATAKURI-Stablelayer/docs/samples/in-fight-amm-frontend/components/MarketOverview.tsx`

---

## Phase 1 詳細: ダークテーマ基盤整備

### 1.1 Tailwind Config 更新

**ファイル:** `tailwind.config.mjs`

```javascript
theme: {
  extend: {
    colors: {
      // 既存の色を維持
      'sds-light': 'var(--sds-light)',
      'sds-dark': 'var(--sds-dark)',
      'sds-pink': 'var(--sds-pink)',
      'sds-blue': 'var(--sds-blue)',
      'sds-accent-a11': 'var(--accent-a11)',

      // 新規: in-fight-amm スタイル
      primary: {
        DEFAULT: '#c8f028',  // ライムグリーン
        dark: '#b0d620',
        light: '#d4f542',
      },
      dark: {
        bg: '#0a0a0a',        // 背景色
        card: '#141414',      // カード背景
        border: '#2a2a2a',    // 境界線
      }
    },
  },
},
```

### 1.2 グローバルCSS 更新

**ファイル:** `src/styles/index.css`

```css
:root {
  /* 既存変数を維持 */
  --sds-light: #ffffffde;
  --sds-dark: #011631;
  --sds-pink: #fed5f4;
  --sds-blue: #4da2ff;

  /* 新規: ダークテーマ変数 */
  --dark-bg: #0a0a0a;
  --dark-card: #141414;
  --dark-border: #2a2a2a;
  --primary: #c8f028;

  color-scheme: dark;
}

body, #root {
  background-color: var(--dark-bg);
  color: #ffffff;
}
```

### 1.3 既存コンポーネントの軽微なスタイル調整

- `MarketInfo.tsx`: `bg-dark-card border-dark-border` クラス追加
- `ProbabilityBar.tsx`: `transition-all duration-500` 追加

**検証方法:**
- ページ全体がダークテーマで表示されることを確認
- 既存機能が正常に動作することを確認

---

## Phase 2 詳細: コアUI改善

### 2.1 BuySharesForm の大幅強化

**ファイル:** `src/dapp/components/BuySharesForm.tsx`

**主要変更点:**

1. **Buy/Sell モード切り替え**
```typescript
const [mode, setMode] = useState<'buy' | 'sell'>('buy')

// モード切替ボタン
<div className="flex gap-2">
  <button
    onClick={() => setMode('buy')}
    className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${
      mode === 'buy'
        ? 'bg-green-500/80 text-white hover:bg-green-500'
        : 'bg-transparent border border-dark-border text-gray-400'
    }`}
  >
    Buy
  </button>
  <button
    onClick={() => setMode('sell')}
    className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${
      mode === 'sell'
        ? 'bg-red-500/80 text-white hover:bg-red-500'
        : 'bg-transparent border border-dark-border text-gray-400'
    }`}
  >
    Sell
  </button>
</div>
```

2. **+/- 数量セレクター**
```typescript
const handleQuantityChange = (value: number) => {
  const newQuantity = Math.max(1, amount + value)
  setAmount(newQuantity)
}

<div className="flex items-center gap-2">
  <button
    onClick={() => handleQuantityChange(-1)}
    className="w-8 h-8 flex items-center justify-center bg-dark-border hover:bg-gray-700 rounded text-white transition-colors text-lg"
  >
    −
  </button>
  <input
    type="number"
    value={amount}
    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
    className="w-20 text-center bg-dark-bg border border-dark-border rounded py-2 text-sm text-white focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
  />
  <button
    onClick={() => handleQuantityChange(1)}
    className="w-8 h-8 flex items-center justify-center bg-dark-border hover:bg-gray-700 rounded text-white transition-colors text-lg"
  >
    +
  </button>
  <span className="text-xs text-gray-400">Shares</span>
</div>
```

3. **Sell モード時の処理**
```typescript
const handleSubmit = async () => {
  if (mode === 'sell') {
    // positions から outcomeIndex に一致する position を検索
    const position = positions?.find(p => p.outcomeIndex === outcomeIndex)
    if (!position) {
      toast.error('No position found for this outcome')
      return
    }

    // Sell トランザクション構築
    const tx = buildSellTx(market.id, position.id)
    await execute(tx)
  } else {
    // 既存の Buy 処理
    // ...
  }
}
```

4. **Available Balance/Shares 表示**
```typescript
<div className="text-xs text-gray-400">
  {mode === 'buy' ? (
    <>Available Balance: <span className="text-white">{balance} SUI</span></>
  ) : (
    <>Available to Sell: <span className="text-white">{availableShares} Shares</span></>
  )}
</div>
```

### 2.2 PositionsList の折りたたみ機能追加

**ファイル:** `src/dapp/components/PositionsList.tsx`

```typescript
const [isOpen, setIsOpen] = useState(true)

<div className="bg-dark-card p-4 space-y-3">
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="w-full flex items-center justify-between text-sm font-semibold text-white"
  >
    <span>Your Positions</span>
    <svg
      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {isOpen && (
    <div className="space-y-2">
      {/* 既存のポジション一覧 */}
    </div>
  )}
</div>
```

**注意:** Sell ボタンは削除（BuySharesForm に統合されるため）

### 2.3 MarketInfo のスタイル強化

**ファイル:** `src/dapp/components/MarketInfo.tsx`

- ステータスバッジを半透明背景に変更
- Active: `bg-green-500/20 text-green-400 border border-green-500/30`
- Resolved: `bg-gray-500/20 text-gray-300 border border-gray-500/30`

**検証方法:**
- Buy モードで購入できることを確認
- Sell モードで売却できることを確認（保有ポジションがある場合）
- +/- ボタンが正常に動作することを確認
- PositionsList の折りたたみが動作することを確認

---

## Phase 3 詳細: 高度な視覚機能

### 3.1 PriceChart コンポーネント作成

**ファイル:** `src/dapp/components/PriceChart.tsx`（新規作成）

**参考実装:** `docs/samples/in-fight-amm-frontend/components/PriceChart.tsx`

**主要機能:**
- Canvas を使った価格推移グラフ
- グラデーション背景（`color + '30'` → `color + '05'`）
- ストロークライン（`lineWidth: 2`）
- Pulsing dot（`animate-pulse`, `boxShadow: 0 0 8px ${color}`）

**実装のポイント:**
```typescript
interface PriceChartProps {
  data: { time: number; price: number }[]
  color: string
}

export default function PriceChart({ data, color }: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Canvas サイズ設定（devicePixelRatio 対応）
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // min/max 計算
    const prices = data.map(d => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    // グラデーション背景描画
    // ...

    // ライン描画
    // ...

    // Pulsing dot 配置
    // ...
  }, [data, color])

  return (
    <div className="relative w-full h-24 bg-dark-card/50 rounded">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div
        ref={dotRef}
        className="absolute w-2 h-2 rounded-full animate-pulse"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`
        }}
      />
    </div>
  )
}
```

### 3.2 MarketOverview コンポーネント作成（複数アウトカム対応）

**ファイル:** `src/dapp/components/MarketOverview.tsx`（新規作成）

**注意:** 参考実装は2ファイター専用だが、KATAKURI は複数アウトカム対応が必要

```typescript
interface MarketOverviewProps {
  totalPool: number
  outcomes: string[]
  probabilities: number[]
  colors: string[]
}

export default function MarketOverview({
  totalPool,
  outcomes,
  probabilities,
  colors
}: MarketOverviewProps) {
  return (
    <div className="bg-dark-card p-6 space-y-6">
      {/* Total Pool */}
      <div className="text-center py-2">
        <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Total Pool
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {totalPool.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} SUI
        </div>
      </div>

      <div className="h-px bg-dark-border"></div>

      {/* Market Prediction */}
      <div className="space-y-3">
        <div className="text-xs text-gray-500 text-center uppercase tracking-wide mb-3">
          Market Prediction
        </div>

        {/* 各アウトカムの確率表示 */}
        <div className="space-y-2">
          {outcomes.map((outcome, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm text-white font-medium">{outcome}</span>
              <span className={`text-lg font-bold`} style={{ color: colors[i] }}>
                {(probabilities[i] * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>

        {/* プログレスバー（複数色対応） */}
        <div className="flex h-4 rounded-full overflow-hidden shadow-inner">
          {outcomes.map((_, i) => (
            <div
              key={i}
              className="transition-all duration-300"
              style={{
                width: `${probabilities[i] * 100}%`,
                backgroundColor: colors[i]
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 3.3 ProbabilityBar の色定数 export

**ファイル:** `src/dapp/components/ProbabilityBar.tsx`

```typescript
// 色定数を export（他のコンポーネントで使用）
export const PROBABILITY_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#eab308', // yellow
  '#a855f7', // purple
]
```

### 3.4 MarketPage の再構成

**ファイル:** `src/dapp/pages/MarketPage.tsx`

**主要変更点:**

1. **Chart データ状態管理**
```typescript
import { useState, useEffect } from 'react'

const [chartData, setChartData] = useState<Record<number, { time: number; price: number }[]>>({})

useEffect(() => {
  if (!market) return

  setChartData(prev => {
    const newData = { ...prev }
    market.outcomes.forEach((_, i) => {
      // 初回は過去20ポイント分のダミーデータを生成
      const currentData = prev[i] || Array.from({ length: 20 }, (_, j) => ({
        time: Date.now() - (20 - j) * 60000,
        price: market.probabilities[i] || 0
      }))

      // 新しいデータポイントを追加（古いデータを1つ削除）
      newData[i] = [
        ...currentData.slice(1),
        { time: Date.now(), price: market.probabilities[i] || 0 }
      ]
    })
    return newData
  })
}, [market?.probabilities])
```

2. **レイアウト変更**
```tsx
<div className="w-full max-w-2xl space-y-0"> {/* max-w-lg → max-w-2xl */}
  <Button variant="ghost" size="1" onClick={() => navigate('/')}>
    &larr; Back to Markets
  </Button>

  {market && (
    <>
      <MarketOverview
        totalPool={market.balance}
        outcomes={market.outcomes}
        probabilities={market.probabilities}
        colors={PROBABILITY_COLORS}
      />

      <div className="h-px bg-dark-border my-0"></div>

      <BuySharesForm
        market={market}
        positions={positions}
        chartData={chartData}
      />

      <div className="h-px bg-dark-border my-0"></div>

      {positions && positions.length > 0 && (
        <>
          <PositionsList market={market} positions={positions} />
          <div className="h-px bg-dark-border my-0"></div>
        </>
      )}

      <MarketInfo market={market} />
    </>
  )}
</div>
```

3. **Import 追加**
```typescript
import MarketOverview from '../components/MarketOverview'
import PriceChart from '../components/PriceChart'
import { PROBABILITY_COLORS } from '../components/ProbabilityBar'
```

**検証方法:**
- PriceChart が正しく描画されることを確認
- MarketOverview が複数アウトカムに対応していることを確認
- チャートデータが更新されることを確認（refetchInterval: 15秒）
- レイアウトが区切り線で綺麗に分割されていることを確認

---

## 総合検証戦略

### 機能テスト

**Buy フロー:**
1. MarketPage にアクセス
2. Buy モードを選択
3. Outcome を選択
4. +/- ボタンで数量を調整
5. Estimated cost が正しく表示されることを確認
6. Confirm Buy をクリック
7. トランザクションが成功することを確認

**Sell フロー:**
1. 保有ポジションがある状態で MarketPage にアクセス
2. Sell モードに切り替え
3. 保有している Outcome を選択
4. 数量を調整
5. Confirm Sell をクリック
6. トランザクションが成功することを確認

**視覚効果:**
- ダークテーマが正しく適用されているか
- ホバーエフェクトが動作するか
- トランジションがスムーズか
- PriceChart が描画されるか
- MarketOverview の確率表示が正確か
- PositionsList の折りたたみが動作するか

### パフォーマンステスト

- PriceChart の Canvas 描画が 60fps を維持
- chartData の更新（15秒間隔）がスムーズ
- メモリリークが発生しないか（長時間使用テスト）

### レスポンシブテスト

- モバイル（375px）で正しく表示されるか
- タブレット（768px）で正しく表示されるか
- デスクトップ（1024px+）で正しく表示されるか

---

## 懸念事項と対策

### 1. Radix UI Themes との互換性

**問題:** Radix UI の Card, Button 等は独自のスタイルを持つ

**対策:** `className` で Tailwind スタイルを上書き

**代替案:** 必要に応じて `<div>` 等のプレーン要素に置き換え

### 2. Chart データの初期化

**問題:** 初回レンダリング時に chartData が空

**対策:** `useEffect` で market 取得時に過去 20 ポイント分のダミーデータを生成

### 3. Sell モードでの position 特定

**問題:** 複数の outcome で同時に保有している場合の処理

**対策:** 現在選択中の `outcomeIndex` に対応する position を `find` で検索

### 4. モバイル対応

**問題:** in-fight-amm はデスクトップ前提

**対策:** `max-w-2xl` でコンテンツ幅を制限、必要に応じて `sm:` ブレークポイント追加

---

## 実装順序と推奨マイルストーン

### マイルストーン 1: ダークテーマ適用（Phase 1）
- Tailwind config 更新
- グローバル CSS 更新
- 既存コンポーネントの軽微な調整
- **検証:** ダークテーマが適用され、既存機能が動作

### マイルストーン 2: フォーム改善（Phase 2）
- BuySharesForm に Buy/Sell 統合
- +/- 数量セレクター実装
- PositionsList 折りたたみ追加
- **検証:** Buy/Sell フローが正常に動作

### マイルストーン 3: 視覚機能追加（Phase 3）
- PriceChart 作成
- MarketOverview 作成
- MarketPage 再構成
- **検証:** E2E テスト（buy/sell/redeem フロー）

---

## 実装後の期待効果

### ユーザー体験向上
1. **視覚的魅力:** ダークテーマ + ライムグリーンアクセントでプロフェッショナルな印象
2. **操作性:** Buy/Sell 統合フォームで操作ステップ削減
3. **情報密度:** MarketOverview で重要情報を目立たせる
4. **リアルタイム感:** PriceChart とトランジションで市場の動きを直感的に理解

### 開発者体験向上
1. **保守性:** コンポーネント分割により責務が明確
2. **拡張性:** PriceChart は他の画面でも再利用可能
3. **一貫性:** Tailwind config の色定数で統一感維持

---

## 付録: 既存 hooks との互換性

既存の hooks はそのまま利用できます：

- `useMarket(id)`: 市場データ取得（変更なし）
- `usePositions(id)`: ポジション一覧取得（変更なし）
- `useMarketAction()`: トランザクション実行（Sell 処理を追加で利用）
- `useEstimateCost()`: コスト見積もり（変更なし）

新規 hook は不要です。
