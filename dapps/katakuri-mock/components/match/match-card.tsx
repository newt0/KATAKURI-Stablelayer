"use client"

import Link from "next/link"
import type { Match } from "@/types/katakuri"
import { formatMatchTime } from "@/lib/format"
import { cn } from "@/lib/utils"

function StatusBadge({ status }: { status: Match["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "live" && "bg-foreground text-background",
        status === "upcoming" && "bg-muted text-muted-foreground",
        status === "ended" && "bg-muted text-muted-foreground"
      )}
    >
      {status === "live" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-background" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function MatchCard({ match }: { match: Match }) {
  const openMarkets = match.markets.filter((m) => m.status === "open").length

  return (
    <Link href={`/match/${match.id}`} className="group block">
      <div className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/20">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground group-hover:underline">
              {match.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {match.fighters.join(" vs ")}
            </p>
          </div>
          <StatusBadge status={match.status} />
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          {match.status === "live" && (
            <span className="font-mono tabular-nums">
              {formatMatchTime(match.currentTimeSec)}
            </span>
          )}
          <span>
            {openMarkets} {openMarkets === 1 ? "market" : "markets"} open
          </span>
          <span>{match.markets.length} total</span>
        </div>

        {match.status === "live" && match.markets.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {match.markets
              .filter((m) => m.status === "open")
              .slice(0, 3)
              .map((market) => (
                <div
                  key={market.id}
                  className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs text-foreground"
                >
                  {market.title}
                </div>
              ))}
          </div>
        )}
      </div>
    </Link>
  )
}
