"use client"

import Link from "next/link"
import type { MarketEvent } from "@/types/on-chain"
import useOnChainMarket from "@/hooks/sui/use-on-chain-market"
import { formatProbability } from "@/lib/sui/utils"
import { cn } from "@/lib/utils"

export function OnChainMarketListCard({ marketEvent }: { marketEvent: MarketEvent }) {
  const { data: market, isLoading } = useOnChainMarket(marketEvent.marketId)

  return (
    <Link href={`/market/${marketEvent.marketId}`} className="group block">
      <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/20">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground group-hover:underline">
              {marketEvent.question}
            </h3>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              market?.resolved ? "bg-muted text-muted-foreground" : "bg-foreground text-background"
            )}
          >
            {market?.resolved ? (
              "Resolved"
            ) : (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-background" />
                Open
              </>
            )}
          </span>
        </div>

        {isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading...</div>
        ) : market ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {market.outcomes.slice(0, 3).map((outcome, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5"
              >
                <span className="text-xs font-medium text-foreground">{outcome}</span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatProbability(market.probabilities[i])}
                </span>
              </div>
            ))}
            {market.outcomes.length > 3 && (
              <div className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                +{market.outcomes.length - 3} more
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Link>
  )
}
