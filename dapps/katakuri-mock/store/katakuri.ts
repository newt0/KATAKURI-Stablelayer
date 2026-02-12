"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { KatakuriState, ActivityEvent, Market } from "@/types/katakuri"
import { SEED_MATCHES, INITIAL_BALANCES, INITIAL_POSITIONS, INITIAL_ACTIVITY } from "@/lib/seed"
import { buySharesCalc, sellSharesCalc, computePrices } from "@/lib/pricing"
import { calculateYield } from "@/lib/yield"

function findMarketInMatches(
  matches: KatakuriState["matches"],
  marketId: string
): { matchIndex: number; marketIndex: number; market: Market } | null {
  for (let mi = 0; mi < matches.length; mi++) {
    for (let ki = 0; ki < matches[mi].markets.length; ki++) {
      if (matches[mi].markets[ki].id === marketId) {
        return { matchIndex: mi, marketIndex: ki, market: matches[mi].markets[ki] }
      }
    }
  }
  return null
}

export const useKatakuriStore = create<KatakuriState>()(
  persist(
    (set, get) => ({
      balances: { ...INITIAL_BALANCES },
      positions: [...INITIAL_POSITIONS],
      activityLog: [...INITIAL_ACTIVITY],
      matches: JSON.parse(JSON.stringify(SEED_MATCHES)),

      // ===== Atomic Mint + Buy (PTB simulation) =====
      mintAndBuy: ({ marketId, outcome, usdcAmount }) => {
        const state = get()
        if (usdcAmount <= 0 || state.balances.usdc < usdcAmount) return

        const found = findMarketInMatches(state.matches, marketId)
        if (!found || found.market.status !== "open") return

        const outcomeIndex = found.market.outcomes.indexOf(outcome)
        if (outcomeIndex === -1) return

        // Step 1: Deduct USDC
        const newUsdc = state.balances.usdc - usdcAmount

        // Step 2: Mint katakuriUSD (1:1)
        const newKatakuriUsd = state.balances.katakuriUsd + usdcAmount

        // Step 3: Buy shares using katakuriUSD
        const { newQ, shares, newPrices } = buySharesCalc(
          found.market.pricing.q,
          found.market.pricing.liquidityB,
          outcomeIndex,
          usdcAmount
        )

        // Step 4: Deduct katakuriUSD used for purchase
        const finalKatakuriUsd = newKatakuriUsd - usdcAmount

        // Update positions
        const positions = [...state.positions]
        const existingIdx = positions.findIndex(
          (p) => p.marketId === marketId && p.outcome === outcome && p.status === "open"
        )
        if (existingIdx >= 0) {
          const existing = positions[existingIdx]
          const totalShares = existing.shares + shares
          const totalCost = existing.costBasis + usdcAmount
          positions[existingIdx] = {
            ...existing,
            shares: totalShares,
            avgPrice: totalCost / totalShares,
            costBasis: totalCost,
          }
        } else {
          positions.push({
            marketId,
            outcome,
            shares,
            avgPrice: usdcAmount / shares,
            costBasis: usdcAmount,
            status: "open",
          })
        }

        // Update market pricing
        const newMatches = JSON.parse(JSON.stringify(state.matches))
        newMatches[found.matchIndex].markets[found.marketIndex].pricing.q = newQ
        newMatches[found.matchIndex].markets[found.marketIndex].pricing.prices = newPrices

        const event: ActivityEvent = {
          ts: Date.now(),
          type: "MINT_AND_BUY",
          payload: {
            marketId,
            outcome,
            usdcAmount,
            sharesBought: shares,
            price: newPrices[outcomeIndex],
          },
        }

        set({
          balances: {
            ...state.balances,
            usdc: newUsdc,
            katakuriUsd: finalKatakuriUsd,
          },
          positions,
          matches: newMatches,
          activityLog: [event, ...state.activityLog],
        })
      },

      // ===== Buy Shares (using existing katakuriUSD) =====
      buyShares: ({ marketId, outcome, amount }) => {
        const state = get()
        if (amount <= 0 || state.balances.katakuriUsd < amount) return

        const found = findMarketInMatches(state.matches, marketId)
        if (!found || found.market.status !== "open") return

        const outcomeIndex = found.market.outcomes.indexOf(outcome)
        if (outcomeIndex === -1) return

        const { newQ, shares, newPrices } = buySharesCalc(
          found.market.pricing.q,
          found.market.pricing.liquidityB,
          outcomeIndex,
          amount
        )

        const positions = [...state.positions]
        const existingIdx = positions.findIndex(
          (p) => p.marketId === marketId && p.outcome === outcome && p.status === "open"
        )
        if (existingIdx >= 0) {
          const existing = positions[existingIdx]
          const totalShares = existing.shares + shares
          const totalCost = existing.costBasis + amount
          positions[existingIdx] = {
            ...existing,
            shares: totalShares,
            avgPrice: totalCost / totalShares,
            costBasis: totalCost,
          }
        } else {
          positions.push({
            marketId,
            outcome,
            shares,
            avgPrice: amount / shares,
            costBasis: amount,
            status: "open",
          })
        }

        const newMatches = JSON.parse(JSON.stringify(state.matches))
        newMatches[found.matchIndex].markets[found.marketIndex].pricing.q = newQ
        newMatches[found.matchIndex].markets[found.marketIndex].pricing.prices = newPrices

        const event: ActivityEvent = {
          ts: Date.now(),
          type: "BUY",
          payload: { marketId, outcome, amount, sharesBought: shares },
        }

        set({
          balances: { ...state.balances, katakuriUsd: state.balances.katakuriUsd - amount },
          positions,
          matches: newMatches,
          activityLog: [event, ...state.activityLog],
        })
      },

      // ===== Sell Shares =====
      sellShares: ({ marketId, outcome, shares: sharesToSell }) => {
        const state = get()
        const posIdx = state.positions.findIndex(
          (p) => p.marketId === marketId && p.outcome === outcome && p.status === "open"
        )
        if (posIdx === -1 || state.positions[posIdx].shares < sharesToSell) return

        const found = findMarketInMatches(state.matches, marketId)
        if (!found || found.market.status !== "open") return

        const outcomeIndex = found.market.outcomes.indexOf(outcome)
        if (outcomeIndex === -1) return

        const { newQ, refund, newPrices } = sellSharesCalc(
          found.market.pricing.q,
          found.market.pricing.liquidityB,
          outcomeIndex,
          sharesToSell
        )

        const positions = [...state.positions]
        const remaining = positions[posIdx].shares - sharesToSell
        if (remaining <= 0.001) {
          positions.splice(posIdx, 1)
        } else {
          positions[posIdx] = {
            ...positions[posIdx],
            shares: remaining,
            costBasis: positions[posIdx].costBasis * (remaining / (remaining + sharesToSell)),
          }
        }

        const newMatches = JSON.parse(JSON.stringify(state.matches))
        newMatches[found.matchIndex].markets[found.marketIndex].pricing.q = newQ
        newMatches[found.matchIndex].markets[found.marketIndex].pricing.prices = newPrices

        const event: ActivityEvent = {
          ts: Date.now(),
          type: "SELL",
          payload: { marketId, outcome, sharesSold: sharesToSell, refund },
        }

        set({
          balances: { ...state.balances, katakuriUsd: state.balances.katakuriUsd + refund },
          positions,
          matches: newMatches,
          activityLog: [event, ...state.activityLog],
        })
      },

      // ===== Burn katakuriUSD -> USDC =====
      burnToUsdc: (amount) => {
        const state = get()
        if (amount <= 0 || state.balances.katakuriUsd < amount) return

        const event: ActivityEvent = {
          ts: Date.now(),
          type: "BURN",
          payload: { amount },
        }

        set({
          balances: {
            ...state.balances,
            katakuriUsd: state.balances.katakuriUsd - amount,
            usdc: state.balances.usdc + amount,
          },
          activityLog: [event, ...state.activityLog],
        })
      },

      // ===== Claim Yield =====
      claimYield: () => {
        const state = get()
        if (state.balances.claimableYield <= 0) return

        const claimed = state.balances.claimableYield
        const event: ActivityEvent = {
          ts: Date.now(),
          type: "CLAIM",
          payload: { amount: claimed },
        }

        set({
          balances: {
            ...state.balances,
            katakuriUsd: state.balances.katakuriUsd + claimed,
            claimableYield: 0,
          },
          activityLog: [event, ...state.activityLog],
        })
      },

      // ===== Resolve Market (Admin) =====
      resolveMarket: ({ marketId, outcome }) => {
        const state = get()
        const found = findMarketInMatches(state.matches, marketId)
        if (!found || found.market.status !== "open") return

        const newMatches = JSON.parse(JSON.stringify(state.matches))
        newMatches[found.matchIndex].markets[found.marketIndex].status = "resolved"
        newMatches[found.matchIndex].markets[found.marketIndex].resolution = {
          resolvedOutcome: outcome,
          resolvedAt: Date.now(),
        }

        // Set winning price to 1, losers to 0
        const market = newMatches[found.matchIndex].markets[found.marketIndex]
        market.pricing.prices = market.outcomes.map((o: string) => (o === outcome ? 1 : 0))

        const event: ActivityEvent = {
          ts: Date.now(),
          type: "RESOLVE",
          payload: { marketId, outcome },
        }

        set({
          matches: newMatches,
          activityLog: [event, ...state.activityLog],
        })
      },

      // ===== Settle Market =====
      settleMarket: (marketId) => {
        const state = get()
        const found = findMarketInMatches(state.matches, marketId)
        if (!found || found.market.status !== "resolved" || !found.market.resolution?.resolvedOutcome) return

        const resolvedOutcome = found.market.resolution.resolvedOutcome
        const positions = [...state.positions]
        let totalPayout = 0

        for (let i = 0; i < positions.length; i++) {
          if (positions[i].marketId === marketId && positions[i].status === "open") {
            if (positions[i].outcome === resolvedOutcome) {
              // Winner: payout = shares * 1.0
              totalPayout += positions[i].shares
            }
            positions[i] = { ...positions[i], status: "settled" }
          }
        }

        const event: ActivityEvent = {
          ts: Date.now(),
          type: "SETTLE",
          payload: { marketId, payout: totalPayout },
        }

        set({
          balances: {
            ...state.balances,
            katakuriUsd: state.balances.katakuriUsd + totalPayout,
          },
          positions,
          activityLog: [event, ...state.activityLog],
        })
      },

      // ===== Tick Yield =====
      tickYield: () => {
        const state = get()
        const yieldAmount = calculateYield(state.balances.katakuriUsd)
        if (yieldAmount <= 0) return

        set({
          balances: {
            ...state.balances,
            claimableYield: state.balances.claimableYield + yieldAmount,
          },
        })
      },

      // ===== Admin: Update Match Time =====
      updateMatchTime: (matchId, timeSec) => {
        const state = get()
        const newMatches = JSON.parse(JSON.stringify(state.matches))
        const idx = newMatches.findIndex((m: { id: string }) => m.id === matchId)
        if (idx === -1) return
        newMatches[idx].currentTimeSec = timeSec
        set({ matches: newMatches })
      },

      // ===== Admin: Set Liquidity B =====
      setLiquidityB: (marketId, b) => {
        const state = get()
        const found = findMarketInMatches(state.matches, marketId)
        if (!found) return

        const newMatches = JSON.parse(JSON.stringify(state.matches))
        newMatches[found.matchIndex].markets[found.marketIndex].pricing.liquidityB = b
        const market = newMatches[found.matchIndex].markets[found.marketIndex]
        market.pricing.prices = computePrices(market.pricing.q, b)

        set({ matches: newMatches })
      },

      // ===== Reset All =====
      resetAll: () => {
        set({
          balances: { ...INITIAL_BALANCES },
          positions: [],
          activityLog: [],
          matches: JSON.parse(JSON.stringify(SEED_MATCHES)),
        })
      },
    }),
    {
      name: "katakuri-storage",
    }
  )
)
