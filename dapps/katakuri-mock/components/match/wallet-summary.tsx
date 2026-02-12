"use client"

import { useKatakuriStore } from "@/store/katakuri"
import { formatUsd } from "@/lib/format"

export function WalletSummary() {
  const balances = useKatakuriStore((s) => s.balances)
  const claimYield = useKatakuriStore((s) => s.claimYield)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Wallet
      </h3>
      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">USDC</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            ${formatUsd(balances.usdc)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">katakuriUSD</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            ${formatUsd(balances.katakuriUsd)}
          </span>
        </div>
        <div className="border-t border-border pt-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Yield</span>
            <span className="font-mono text-sm tabular-nums text-foreground">
              ${formatUsd(balances.claimableYield)}
            </span>
          </div>
          {balances.claimableYield > 0.01 && (
            <button
              onClick={claimYield}
              className="mt-2 w-full rounded-md border border-border bg-background py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              Claim Yield
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
