"use client"

import { useCurrentAccount } from "@mysten/dapp-kit"
import useSuiBalance from "@/hooks/sui/use-sui-balance"
import { formatCoinAmount } from "@/lib/sui/utils"

export function OnChainWalletSummary() {
  const account = useCurrentAccount()
  const { data: suiBalance } = useSuiBalance()

  if (!account) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Wallet
        </h3>
        <p className="mt-3 text-sm text-muted-foreground">Connect wallet to see balance</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Wallet
      </h3>
      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">SUI</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatCoinAmount(suiBalance || 0n)}
          </span>
        </div>
      </div>
    </div>
  )
}
