"use client"

import { useKatakuriStore } from "@/store/katakuri"
import { formatUsd } from "@/lib/format"
import type { Position, Market } from "@/types/katakuri"

function findMarket(matches: ReturnType<typeof useKatakuriStore.getState>["matches"], marketId: string): Market | null {
  for (const match of matches) {
    for (const market of match.markets) {
      if (market.id === marketId) return market
    }
  }
  return null
}

function getCurrentPrice(market: Market, outcome: string): number {
  const idx = market.outcomes.indexOf(outcome)
  return idx >= 0 ? market.pricing.prices[idx] : 0
}

export function PositionsTable({ filter }: { filter: "open" | "settled" }) {
  const positions = useKatakuriStore((s) => s.positions)
  const matches = useKatakuriStore((s) => s.matches)
  const sellShares = useKatakuriStore((s) => s.sellShares)
  const settleMarket = useKatakuriStore((s) => s.settleMarket)

  const filtered = positions.filter((p) => p.status === filter)

  if (filtered.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No {filter} positions
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Market</th>
            <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Outcome</th>
            <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">Shares</th>
            <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">Avg Price</th>
            <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">Current</th>
            <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">PnL</th>
            <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((pos, i) => (
            <PositionRow
              key={`${pos.marketId}-${pos.outcome}-${i}`}
              position={pos}
              market={findMarket(matches, pos.marketId)}
              onSell={(shares) => sellShares({ marketId: pos.marketId, outcome: pos.outcome, shares })}
              onSettle={() => settleMarket(pos.marketId)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PositionRow({
  position,
  market,
  onSell,
  onSettle,
}: {
  position: Position
  market: Market | null
  onSell: (shares: number) => void
  onSettle: () => void
}) {
  const currentPrice = market ? getCurrentPrice(market, position.outcome) : 0
  const currentValue = position.shares * currentPrice
  const pnl = currentValue - position.costBasis
  const isResolved = market?.status === "resolved"
  const isWinner = isResolved && market?.resolution?.resolvedOutcome === position.outcome

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4 text-foreground">{market?.title || position.marketId}</td>
      <td className="py-3 pr-4 font-medium text-foreground">{position.outcome}</td>
      <td className="py-3 pr-4 text-right font-mono tabular-nums text-foreground">
        {position.shares.toFixed(2)}
      </td>
      <td className="py-3 pr-4 text-right font-mono tabular-nums text-muted-foreground">
        ${position.avgPrice.toFixed(4)}
      </td>
      <td className="py-3 pr-4 text-right font-mono tabular-nums text-muted-foreground">
        ${currentPrice.toFixed(4)}
      </td>
      <td
        className={`py-3 pr-4 text-right font-mono tabular-nums ${
          pnl >= 0 ? "text-foreground" : "text-destructive"
        }`}
      >
        {pnl >= 0 ? "+" : ""}${formatUsd(pnl)}
      </td>
      <td className="py-3 text-right">
        {position.status === "open" && !isResolved && (
          <button
            onClick={() => onSell(position.shares)}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Sell
          </button>
        )}
        {position.status === "open" && isResolved && (
          <button
            onClick={onSettle}
            className="rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            {isWinner ? "Settle (Win)" : "Settle"}
          </button>
        )}
        {position.status === "settled" && (
          <span className="text-xs text-muted-foreground">Settled</span>
        )}
      </td>
    </tr>
  )
}
