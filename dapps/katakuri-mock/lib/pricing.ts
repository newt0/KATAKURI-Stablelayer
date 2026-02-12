/**
 * LMSR-like pricing engine
 * Uses softmax(q / b) to compute normalized probabilities as prices.
 */

export function computePrices(q: number[], b: number): number[] {
  const maxQ = Math.max(...q)
  const exps = q.map((qi) => Math.exp((qi - maxQ) / b))
  const sumExps = exps.reduce((a, c) => a + c, 0)
  return exps.map((e) => e / sumExps)
}

export function buySharesCalc(
  q: number[],
  b: number,
  outcomeIndex: number,
  amount: number
): { newQ: number[]; shares: number; newPrices: number[] } {
  const prices = computePrices(q, b)
  const currentPrice = prices[outcomeIndex]

  // Simulate mild slippage: effective price is slightly higher
  const slippage = 1.005
  const effectivePrice = Math.min(currentPrice * slippage, 0.99)
  const shares = amount / effectivePrice

  const newQ = [...q]
  newQ[outcomeIndex] += shares

  const newPrices = computePrices(newQ, b)

  return { newQ, shares, newPrices }
}

export function sellSharesCalc(
  q: number[],
  b: number,
  outcomeIndex: number,
  sharesToSell: number
): { newQ: number[]; refund: number; newPrices: number[] } {
  const prices = computePrices(q, b)
  const currentPrice = prices[outcomeIndex]

  // Refund based on current price (slight negative slippage for seller)
  const slippage = 0.995
  const refund = sharesToSell * currentPrice * slippage

  const newQ = [...q]
  newQ[outcomeIndex] = Math.max(0, newQ[outcomeIndex] - sharesToSell)

  const newPrices = computePrices(newQ, b)

  return { newQ, refund, newPrices }
}
