"use client"

import { useState } from "react"
import type { MarketInfo } from "@/types/on-chain"
import { formatProbability } from "@/lib/sui/utils"
import { cn } from "@/lib/utils"
import { OnChainBetDrawer } from "@/components/market/on-chain-bet-drawer"

export function OnChainMarketCard({ market }: { market: MarketInfo }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<number | null>(null)

  const handleOutcomeClick = (index: number) => {
    if (market.resolved) return
    setSelectedOutcomeIndex(index)
    setDrawerOpen(true)
  }

  const isResolved = market.resolved

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">{market.question}</h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              !isResolved && "bg-muted text-foreground",
              isResolved && "bg-foreground text-background"
            )}
          >
            {isResolved ? "Resolved" : "Open"}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {market.outcomes.map((outcome, i) => {
            const probability = market.probabilities[i]
            const isWinner = isResolved && market.winner === i

            return (
              <button
                key={i}
                onClick={() => handleOutcomeClick(i)}
                disabled={isResolved}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm transition-colors",
                  !isResolved
                    ? "border-border bg-background hover:border-foreground/30 hover:bg-muted"
                    : "cursor-default border-border bg-muted",
                  isWinner && "border-foreground bg-foreground text-background"
                )}
              >
                <span className={cn("font-medium", isWinner ? "text-background" : "text-foreground")}>
                  {outcome}
                </span>
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    isWinner ? "text-background" : "text-muted-foreground"
                  )}
                >
                  {formatProbability(probability)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedOutcomeIndex !== null && (
        <OnChainBetDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          market={market}
          outcomeIndex={selectedOutcomeIndex}
        />
      )}
    </>
  )
}
