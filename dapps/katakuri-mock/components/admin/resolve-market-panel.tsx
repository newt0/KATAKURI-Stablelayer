"use client"

import { useCurrentAccount } from "@mysten/dapp-kit"
import useAdminCaps from "@/hooks/sui/use-admin-caps"
import useOnChainMarket from "@/hooks/sui/use-on-chain-market"
import { useMarketTransaction } from "@/hooks/sui/use-market-transaction"
import { buildResolveTx, buildClaimFeesTx } from "@/lib/sui/transactions"
import { formatProbability } from "@/lib/sui/utils"
import { cn } from "@/lib/utils"

export function ResolveMarketPanel() {
  const account = useCurrentAccount()
  const { data: adminCaps, isLoading } = useAdminCaps()

  if (!account) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Resolve Markets</h2>
        <p className="mt-2 text-sm text-muted-foreground">Connect wallet to resolve markets</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Resolve Markets</h2>
        <p className="mt-2 text-sm text-muted-foreground">Loading admin capabilities...</p>
      </div>
    )
  }

  if (!adminCaps || adminCaps.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Resolve Markets</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have any admin capabilities. Create a market first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">Resolve Markets</h2>
      {adminCaps.map((cap) => (
        <MarketAdminCard key={cap.id} adminCap={cap} />
      ))}
    </div>
  )
}

function MarketAdminCard({ adminCap }: { adminCap: { id: string; marketId: string } }) {
  const { data: market, isLoading } = useOnChainMarket(adminCap.marketId)
  const { execute, isPending } = useMarketTransaction()

  const handleResolve = async (winnerIndex: number) => {
    const tx = buildResolveTx(adminCap.id, adminCap.marketId, winnerIndex)
    await execute(tx)
  }

  const handleClaimFees = async () => {
    const tx = buildClaimFeesTx(adminCap.id, adminCap.marketId)
    await execute(tx)
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Loading market...</p>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Market not found</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{market.question}</h3>
            <span
              className={cn(
                "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                market.resolved ? "bg-foreground text-background" : "bg-muted text-foreground"
              )}
            >
              {market.resolved ? "Resolved" : "Open"}
            </span>
            {market.resolved && market.winner !== null && (
              <span className="ml-2 text-xs text-muted-foreground">
                Winner: {market.outcomes[market.winner]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {market.outcomes.map((outcome, i) => (
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
        </div>

        {!market.resolved && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Resolve as:</p>
            <div className="flex flex-wrap gap-2">
              {market.outcomes.map((outcome, i) => (
                <button
                  key={i}
                  onClick={() => handleResolve(i)}
                  disabled={isPending}
                  className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "..." : outcome}
                </button>
              ))}
            </div>
          </div>
        )}

        {market.resolved && (
          <button
            onClick={handleClaimFees}
            disabled={isPending}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {isPending ? "..." : "Claim Fees"}
          </button>
        )}
      </div>
    </div>
  )
}
