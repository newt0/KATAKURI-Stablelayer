"use client"

import { useState } from "react"
import { useKatakuriStore } from "@/store/katakuri"
import { formatUsd } from "@/lib/format"
import { PositionsTable } from "@/components/portfolio/positions-table"
import { BurnPanel } from "@/components/portfolio/burn-panel"
import { cn } from "@/lib/utils"

export default function PortfolioPage() {
  const [tab, setTab] = useState<"open" | "settled">("open")
  const balances = useKatakuriStore((s) => s.balances)

  const totalBalance = balances.usdc + balances.katakuriUsd + balances.claimableYield

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Portfolio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your positions, claim yield, and convert tokens
        </p>
      </div>

      {/* Balance overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        <BalanceCard label="Total Value" value={totalBalance} />
        <BalanceCard label="USDC" value={balances.usdc} />
        <BalanceCard label="katakuriUSD" value={balances.katakuriUsd} />
        <BalanceCard label="Claimable Yield" value={balances.claimableYield} />
      </div>

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
            Open Positions
          </button>
          <button
            onClick={() => setTab("settled")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              tab === "settled"
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Settled
          </button>
        </div>
        <div className="mt-4">
          <PositionsTable filter={tab} />
        </div>
      </div>

      {/* Yield & Burn */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BurnPanel />
      </div>
    </div>
  )
}

function BalanceCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold tabular-nums text-foreground">
        ${formatUsd(value)}
      </p>
    </div>
  )
}
