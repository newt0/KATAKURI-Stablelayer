export interface MarketInfo {
  id: string
  question: string
  outcomes: string[]
  b: number
  resolved: boolean
  winner: number | null
  balance: number
  feeBps: number
  probabilities: number[]
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
}
