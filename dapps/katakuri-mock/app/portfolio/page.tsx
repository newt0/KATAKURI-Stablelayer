"use client"

import { useState } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import useSuiBalance from "@/hooks/sui/use-sui-balance"
import { formatCoinAmount } from "@/lib/sui/utils"
import { OnChainPositionsTable } from "@/components/portfolio/on-chain-positions-table"
import { cn } from "@/lib/utils"

export default function PortfolioPage() {
  const [tab, setTab] = useState<"open" | "settled">("open")
  const account = useCurrentAccount()
  const { data: suiBalance } = useSuiBalance()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Portfolio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your positions on Sui Testnet
        </p>
      </div>

      {/* Balance overview */}
      {account && (
        <div className="grid gap-4 sm:grid-cols-4">
          <BalanceCard label="SUI Balance" value={formatCoinAmount(suiBalance || 0n)} />
        </div>
      )}

      {/* Positions */}
      <div>
        <div className="flex items-center gap-1 border-b border-border">
          <button
            onClick={() => setTab("open")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              tab === "open"
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Positions
          </button>
        </div>
        <div className="mt-4">
          <OnChainPositionsTable filter={tab} />
        </div>
      </div>

      {/* Coming Soon */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground">Stablelayer Integration Coming Soon</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Yield claiming and katakuriUSD burn features will be available once Stablelayer SDK integration is complete.
        </p>
      </div>
    </div>
  )
}

function BalanceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}
