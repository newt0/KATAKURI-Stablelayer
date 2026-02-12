"use client"

import { useCurrentAccount } from "@mysten/dapp-kit"
import useOnChainPositions from "@/hooks/sui/use-on-chain-positions"
import useOnChainMarket from "@/hooks/sui/use-on-chain-market"
import { useMarketTransaction } from "@/hooks/sui/use-market-transaction"
import { buildSellTx, buildRedeemTx } from "@/lib/sui/transactions"
import { formatCoinAmount } from "@/lib/sui/utils"

export function OnChainPositionsTable({ filter }: { filter: "open" | "settled" }) {
  const account = useCurrentAccount()
  const { data: positions, isLoading } = useOnChainPositions()

  if (!account) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Connect wallet to see positions
      </p>
    )
  }

  if (isLoading) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Loading positions...
      </p>
    )
  }

  if (!positions || positions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No positions found
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
            <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">Probability</th>
            <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <PositionRow
              key={pos.id}
              position={pos}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PositionRow({ position }: { position: ReturnType<typeof useOnChainPositions>['data'][number] }) {
  const { data: market } = useOnChainMarket(position.marketId)
  const { execute, isPending } = useMarketTransaction()

  const handleSell = async () => {
    const tx = buildSellTx(position.marketId, position.id)
    await execute(tx)
  }

  const handleRedeem = async () => {
    const tx = buildRedeemTx(position.marketId, position.id)
    await execute(tx)
  }

  const outcome = market?.outcomes[position.outcomeIndex] || `Outcome ${position.outcomeIndex}`
  const probability = market?.probabilities[position.outcomeIndex] || 0
  const isResolved = market?.resolved || false
  const isWinner = isResolved && market?.winner === position.outcomeIndex

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4 text-foreground">{market?.question || position.marketId.slice(0, 8) + '...'}</td>
      <td className="py-3 pr-4 font-medium text-foreground">{outcome}</td>
      <td className="py-3 pr-4 text-right font-mono tabular-nums text-foreground">
        {formatCoinAmount(position.shares)}
      </td>
      <td className="py-3 pr-4 text-right font-mono tabular-nums text-muted-foreground">
        {(probability * 100).toFixed(1)}%
      </td>
      <td className="py-3 text-right">
        {!isResolved && (
          <button
            onClick={handleSell}
            disabled={isPending}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {isPending ? "..." : "Sell"}
          </button>
        )}
        {isResolved && (
          <button
            onClick={handleRedeem}
            disabled={isPending}
            className="rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "..." : isWinner ? "Redeem (Win)" : "Redeem"}
          </button>
        )}
      </td>
    </tr>
  )
}
