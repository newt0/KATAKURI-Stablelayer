"use client"

import { useState } from "react"
import type { Market } from "@/types/katakuri"
import { useKatakuriStore } from "@/store/katakuri"
import { formatPercent, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { BetDrawer } from "@/components/match/bet-drawer"

export function MarketCard({ market }: { market: Market }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)

  const handleOutcomeClick = (outcome: string) => {
    if (market.status !== "open") return
    setSelectedOutcome(outcome)
    setDrawerOpen(true)
  }

  const isResolved = market.status === "resolved"
  const resolvedOutcome = market.resolution?.resolvedOutcome

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">{market.title}</h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              market.status === "open" && "bg-muted text-foreground",
              market.status === "resolving" && "bg-muted text-muted-foreground",
              market.status === "resolved" && "bg-foreground text-background"
            )}
          >
            {market.status === "open" ? "Open" : market.status === "resolving" ? "Resolving" : "Resolved"}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {market.outcomes.map((outcome, i) => {
            const price = market.pricing.prices[i]
            const isWinner = isResolved && outcome === resolvedOutcome

            return (
              <button
                key={outcome}
                onClick={() => handleOutcomeClick(outcome)}
                disabled={market.status !== "open"}
                className={cn(
                  "flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm transition-colors",
                  market.status === "open"
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
                  {formatPercent(price)}
                </span>
              </button>
            )
          })}
        </div>

        {market.status === "open" && (
          <div className="mt-3 flex gap-2">
            {[10, 50, 100].map((amount) => (
              <QuickBetButton key={amount} market={market} amount={amount} />
            ))}
          </div>
        )}
      </div>

      {selectedOutcome && (
        <BetDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          market={market}
          outcome={selectedOutcome}
        />
      )}
    </>
  )
}

function QuickBetButton({ market, amount }: { market: Market; amount: number }) {
  const mintAndBuy = useKatakuriStore((s) => s.mintAndBuy)
  const usdc = useKatakuriStore((s) => s.balances.usdc)

  // Default to first outcome for quick bets
  const defaultOutcome = market.outcomes[0]

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        mintAndBuy({ marketId: market.id, outcome: defaultOutcome, usdcAmount: amount })
      }}
      disabled={usdc < amount}
      className="flex-1 rounded-md border border-border bg-background py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      ${amount} {defaultOutcome}
    </button>
  )
}
