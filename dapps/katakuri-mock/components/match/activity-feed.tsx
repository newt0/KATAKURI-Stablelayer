"use client"

import { useKatakuriStore } from "@/store/katakuri"
import { formatTimestamp, formatUsd } from "@/lib/format"
import type { ActivityEvent } from "@/types/katakuri"

function eventLabel(event: ActivityEvent): string {
  switch (event.type) {
    case "MINT_AND_BUY":
      return `Mint & Buy: ${event.payload.outcome} on market (${event.payload.sharesBought ? (event.payload.sharesBought as number).toFixed(2) : "?"} shares for $${formatUsd(event.payload.usdcAmount as number)})`
    case "BUY":
      return `Buy: ${event.payload.outcome} (${(event.payload.sharesBought as number).toFixed(2)} shares)`
    case "SELL":
      return `Sell: ${event.payload.outcome} ($${formatUsd(event.payload.refund as number)} refund)`
    case "CLAIM":
      return `Yield Claimed: $${formatUsd(event.payload.amount as number)}`
    case "RESOLVE":
      return `Market Resolved: ${event.payload.outcome}`
    case "SETTLE":
      return `Settled: $${formatUsd(event.payload.payout as number)} payout`
    case "BURN":
      return `Burn: $${formatUsd(event.payload.amount as number)} kUSD to USDC`
    default:
      return event.type
  }
}

export function ActivityFeed() {
  const activityLog = useKatakuriStore((s) => s.activityLog)

  if (activityLog.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Activity
        </h3>
        <p className="mt-3 text-sm text-muted-foreground">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Activity
      </h3>
      <div className="mt-3 space-y-2">
        {activityLog.slice(0, 15).map((event, i) => (
          <div key={`${event.ts}-${i}`} className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-foreground">
              {eventLabel(event)}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatTimestamp(event.ts)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
