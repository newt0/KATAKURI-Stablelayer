"use client"

import { useState } from "react"
import { useKatakuriStore } from "@/store/katakuri"
import { formatMatchTime } from "@/lib/format"
import type { Market, Match } from "@/types/katakuri"
import { cn } from "@/lib/utils"

export default function AdminPage() {
  const matches = useKatakuriStore((s) => s.matches)
  const resolveMarket = useKatakuriStore((s) => s.resolveMarket)
  const updateMatchTime = useKatakuriStore((s) => s.updateMatchTime)
  const setLiquidityB = useKatakuriStore((s) => s.setLiquidityB)
  const resetAll = useKatakuriStore((s) => s.resetAll)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo control panel for resolving markets, adjusting parameters, and resetting state
          </p>
        </div>
        <button
          onClick={resetAll}
          className="shrink-0 rounded-md border border-destructive bg-background px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          Reset All Data
        </button>
      </div>

      {matches.map((match) => (
        <MatchAdminCard
          key={match.id}
          match={match}
          onResolve={resolveMarket}
          onUpdateTime={updateMatchTime}
          onSetLiquidityB={setLiquidityB}
        />
      ))}
    </div>
  )
}

function MatchAdminCard({
  match,
  onResolve,
  onUpdateTime,
  onSetLiquidityB,
}: {
  match: Match
  onResolve: (params: { marketId: string; outcome: string }) => void
  onUpdateTime: (matchId: string, timeSec: number) => void
  onSetLiquidityB: (marketId: string, b: number) => void
}) {
  const [timeInput, setTimeInput] = useState(String(match.currentTimeSec))

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">{match.title}</h2>
            <p className="text-sm text-muted-foreground">{match.status}</p>
          </div>

          {/* Match time control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Time:</span>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {formatMatchTime(match.currentTimeSec)}
            </span>
            <input
              type="number"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="w-20 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-foreground focus:border-foreground focus:outline-none"
            />
            <button
              onClick={() => onUpdateTime(match.id, parseInt(timeInput) || 0)}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Set
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {match.markets.map((market) => (
          <MarketAdminRow
            key={market.id}
            market={market}
            onResolve={onResolve}
            onSetLiquidityB={onSetLiquidityB}
          />
        ))}
      </div>
    </div>
  )
}

function MarketAdminRow({
  market,
  onResolve,
  onSetLiquidityB,
}: {
  market: Market
  onResolve: (params: { marketId: string; outcome: string }) => void
  onSetLiquidityB: (marketId: string, b: number) => void
}) {
  const [bInput, setBInput] = useState(String(market.pricing.liquidityB))

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">{market.title}</h3>
          <div className="mt-1 flex items-center gap-3">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                market.status === "open" && "bg-muted text-foreground",
                market.status === "resolved" && "bg-foreground text-background"
              )}
            >
              {market.status}
            </span>
            {market.resolution?.resolvedOutcome && (
              <span className="text-xs text-muted-foreground">
                Winner: {market.resolution.resolvedOutcome}
              </span>
            )}
          </div>
        </div>

        {/* Liquidity B control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">B:</span>
          <input
            type="number"
            value={bInput}
            onChange={(e) => setBInput(e.target.value)}
            className="w-20 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-foreground focus:border-foreground focus:outline-none"
          />
          <button
            onClick={() => onSetLiquidityB(market.id, parseFloat(bInput) || 100)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Update
          </button>
        </div>
      </div>

      {/* Prices display */}
      <div className="mt-3 flex flex-wrap gap-2">
        {market.outcomes.map((outcome, i) => (
          <div
            key={outcome}
            className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5"
          >
            <span className="text-xs font-medium text-foreground">{outcome}</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {(market.pricing.prices[i] * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Resolve buttons */}
      {market.status === "open" && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-muted-foreground">Resolve as:</p>
          <div className="flex flex-wrap gap-2">
            {market.outcomes.map((outcome) => (
              <button
                key={outcome}
                onClick={() => onResolve({ marketId: market.id, outcome })}
                className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
              >
                {outcome}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
