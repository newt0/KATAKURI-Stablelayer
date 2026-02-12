// ===== User =====
export interface UserBalances {
  usdc: number
  katakuriUsd: number
  claimableYield: number
}

// ===== Match =====
export type MatchStatus = "upcoming" | "live" | "ended"

export interface Match {
  id: string
  title: string
  fighters: string[]
  status: MatchStatus
  startAt: number
  currentTimeSec: number
  markets: Market[]
}

// ===== Market =====
export type MarketStatus = "open" | "resolving" | "resolved"
export type MarketType = "binary" | "multi"

export interface MarketPricing {
  prices: number[]
  liquidityB: number
  q: number[]
}

export interface MarketResolution {
  resolvedOutcome?: string
  resolvedAt?: number
}

export interface Market {
  id: string
  matchId: string
  title: string
  type: MarketType
  outcomes: string[]
  status: MarketStatus
  pricing: MarketPricing
  resolution?: MarketResolution
}

// ===== Position =====
export type PositionStatus = "open" | "settled"

export interface Position {
  marketId: string
  outcome: string
  shares: number
  avgPrice: number
  costBasis: number
  status: PositionStatus
}

// ===== Activity =====
export type ActivityType =
  | "MINT_AND_BUY"
  | "BUY"
  | "SELL"
  | "CLAIM"
  | "RESOLVE"
  | "SETTLE"
  | "BURN"

export interface ActivityEvent {
  ts: number
  type: ActivityType
  payload: Record<string, unknown>
}

// ===== Store =====
export interface KatakuriState {
  // User
  balances: UserBalances
  positions: Position[]
  activityLog: ActivityEvent[]

  // Matches
  matches: Match[]

  // Actions
  mintAndBuy: (params: { marketId: string; outcome: string; usdcAmount: number }) => void
  buyShares: (params: { marketId: string; outcome: string; amount: number }) => void
  sellShares: (params: { marketId: string; outcome: string; shares: number }) => void
  burnToUsdc: (amount: number) => void
  claimYield: () => void
  resolveMarket: (params: { marketId: string; outcome: string }) => void
  settleMarket: (marketId: string) => void
  tickYield: () => void
  updateMatchTime: (matchId: string, timeSec: number) => void
  setLiquidityB: (marketId: string, b: number) => void
  resetAll: () => void
}
