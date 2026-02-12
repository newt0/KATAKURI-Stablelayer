"use client"

import type { Match } from "@/types/katakuri"
import { formatMatchTime } from "@/lib/format"

export function StreamPlaceholder({ match }: { match: Match }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-border bg-muted">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {match.status === "live" ? "Live Stream" : match.status === "upcoming" ? "Starting Soon" : "Event Ended"}
        </p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">
          {match.fighters[0]}
          <span className="mx-3 text-lg text-muted-foreground">vs</span>
          {match.fighters[1]}
        </p>
        {match.status === "live" && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
            <span className="font-mono text-lg tabular-nums text-foreground">
              {formatMatchTime(match.currentTimeSec)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
