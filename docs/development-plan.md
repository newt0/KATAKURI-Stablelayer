# KATAKURI 開発計画書（ハッカソンMVP）

## 目的

- 短期間で「動くデモ＋審査要件充足」を達成する。
- Stablelayer SDKとMove 2024を用い、予測市場の最小MVPをテストネットで公開する。

## 成果物（Definition of Success）

- テストネット公開済みのMoveパッケージ（Package ID明記）。
- 公開デモサイト（ウォレット接続→Mint→Buy→Sell→Resolve→Redeemの一連操作）。
- ルート`README`に起動・デプロイ手順、`.env.example`、テストネットIDを集約。
- AI利用開示ドキュメント（モデル/ツール/主要プロンプト）。
- 審査当日に参照できるDigest/エクスプローラリンクを添付。

## 前提・参照

- フロント: `docs/your-stable-app`（Vite + React 19 + @mysten/dapp-kit + Radix）。
- Move参照実装: `docs/lmsr_market`（Move 2024, Q64実装）。
- 実装方針/背景: `CLAUDE.md`, `docs/hackathon-guide/`。

## スコープ（MVP）

- Move: 既存LMSRを流用し、最小のイベント・簡易getter・入力ガードのみ追加。
  - ガード: `fee_bps <= 10_000`、`b > 0`、`buy(min_shares_out)`
- PTB合成: Buy（mint→buy）は単一PTBで必須。Sell→Burn/ Redeem→BurnはMVPでは分割許容。
- フロント: 予測市場タブを追加し、最小UIで一連操作を実行。
- 代替策: `katakuriUSD`が未準備の場合、既存ブランドコインで代替デモ可。

## タイムライン（目安: 3–3.5日）

- Day 0.5: Phase 0（ドキュメント・提出テンプレ）
- Day 1: Phase 1（Move最小改修・ビルド）
- Day 0.5: Phase 2（テストネットpublish・CLI検証）
- Day 1: Phase 3（フロント統合・PTBユーティリティ・UI）
- Day 0.5: Phase 4–5（デモ磨き・提出準備）

## フェーズ別タスクと受入基準

### Phase 0: デモ成立の土台整備（0.5日）

- タスク
  - 0-1 ドキュメント整合: `docs/implementation-plan.md`（最適化版）と`CLAUDE.md`/フロントREADMEの表記統一（Vite）。
  - 0-2 提出テンプレ: ルート`README`へ起動/デプロイ手順集約、`.env.example`と`docs/AI-DISCLOSURE.md`雛形作成。
- 受入基準
  - 変更がリポに反映され、審査観点（使用SDK/Move 2024/公開要件）が明記されている。

### Phase 1: Moveコントラクト最小改修（1日）

- タスク
  - 1-1 `docs/lmsr_market`をベースに`contracts/katakuri_market`へコピー（必要ならモジュール名変更）。
  - 1-2 入力ガード追加: `fee_bps <= 10_000`、`b>0`、`buy(min_shares_out)`引数。
  - 1-3 イベント/ゲッター: Created/Buy/Sell/Resolved/Redeemed と基本getterの追加。
  - 1-4 ビルド: `sui move build`成功。
- 受入基準
  - ビルドエラーなし。`buy`が`min_shares_out`を取り、イベントがエミットされる。

### Phase 2: テストネットデプロイ（0.5日）

- タスク
  - 2-1 Publish: `sui client publish`でTestnetに公開し、Package IDを控える。
  - 2-2 CLI検証: `create_market→buy→sell→resolve→redeem`を1往復実行し、DigestとObject IDを記録。
- 受入基準
  - READMEにPackage ID/主要Object ID/検証Digestリンクが記載されている。

### Phase 3: フロント統合（1日）

- タスク
  - 3-1 PTBユーティリティ: TypeScriptで`buy(mint→buy)`単一PTBを実装（`min_shares_out`反映）。
  - 3-2 UI最小実装: 予測市場タブに「Market作成/Buy/Sell/Resolve/Redeem」ボタンと入力フォームを配置。
  - 3-3 型/ID連携: `.env`または定数でPackage/Type/Object IDを参照し、Testnet切替を確認。
- 受入基準
  - ブラウザから一連の操作が通り、エクスプローラリンクが表示される。

### Phase 4: デモ磨き（0.5日）

- タスク
  - 4-1 トースト/リンク: 成否トースト、エクスプローラURLの導線。
  - 4-2 ガードUI: スリッページ入力、残高/不足表示、ローディング最小実装。
  - 4-3 デモ動画/GIF: 短い操作動画をREADMEに添付（またはリンク）。
- 受入基準
  - デモの分かりやすさが向上し、審査側が自己完結で操作できる。

### Phase 5: 提出パッケージ（0.5日）

- タスク
  - 5-1 AI開示: `docs/AI-DISCLOSURE.md`にツール/モデル/主要プロンプトを記載。
  - 5-2 提出チェック: 要件自己チェック、デモURL/Digest/環境手順の最終確認。
- 受入基準
  - 審査要件すべてを満たし、リポのみで再現可能。

## リスクと回避策

- `katakuriUSD`未準備
  - 代替: 既存ブランドコイン/USDCでデモ、命名のみ`katakuriUSD`説明を添付。
- ガス/計算コスト増大
  - 代替: アウトカム2〜3に限定し、少額でのデモ。重い関数はキャッシュせず最小呼び出し。
- 時間超過
  - 代替: Sell→Burn、Redeem→Burn単一PTBは後回し（分割処理で十分）。

## 依存関係・環境

- Node.js 20+/pnpm、Sui CLI、Testnetアカウント、@mysten/dapp-kit、Stablelayer SDK。
- `.env.example`（想定）
  - `VITE_SUI_NETWORK=testnet`
  - `VITE_PACKAGE_ID=...`
  - `VITE_MARKET_MODULE=market`
  - `VITE_KATAKURI_USD_TYPE=0x...::katakuri_usd::KatakuriUSD`
  - `VITE_USDC_TYPE=0x...::usdc::USDC`
  - `VITE_EXPLORER_URL=https://explorer.sui.io`

## 実行手順（抜粋）

- Move: `sui move build` → `sui client publish --gas-budget 100000000`
- SDK（任意）: `pnpm -C docs/stable-layer-sdk build`
- フロント: `pnpm -C docs/your-stable-app install && pnpm -C docs/your-stable-app dev`

## 提出チェックリスト

- [ ] Move 2024でビルド/テストネット公開（Package ID記載）
- [ ] 公式SDK使用（`@mysten/dapp-kit`/Stablelayer SDK）
- [ ] 公開デモURL（ウォレット接続→Mint→Buy→Sell→Resolve→Redeem）
- [ ] ルートREADMEに手順・ID・環境変数・リンク集約
- [ ] AI開示（ツール/モデル/主要プロンプト）
- [ ] プロジェクト開始日の要件準拠（コミット/READMEで補足）

（ストレッチ）Sell→Burn/ Redeem→Burnの単一PTB化、数値安定化、無効市場精算の設計深化

