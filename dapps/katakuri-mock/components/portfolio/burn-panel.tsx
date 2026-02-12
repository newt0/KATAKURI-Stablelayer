"use client"

import { useState } from "react"
import { useKatakuriStore } from "@/store/katakuri"
import { formatUsd } from "@/lib/format"

export function BurnPanel() {
  const [amount, setAmount] = useState("")
  const balances = useKatakuriStore((s) => s.balances)
  const burnToUsdc = useKatakuriStore((s) => s.burnToUsdc)
  const claimYield = useKatakuriStore((s) => s.claimYield)

  const numAmount = parseFloat(amount) || 0
  const canBurn = numAmount > 0 && numAmount <= balances.katakuriUsd

  const handleBurn = () => {
    if (!canBurn) return
    burnToUsdc(numAmount)
    setAmount("")
  }

  return (
    <div className="space-y-4">
      {/* Yield Claim */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Yield (Stablelayer Mock)</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          5% APR on katakuriUSD holdings, accrued every 5 seconds
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Claimable</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            ${formatUsd(balances.claimableYield)}
          </span>
        </div>
        <button
          onClick={claimYield}
          disabled={balances.claimableYield < 0.01}
          className="mt-3 w-full rounded-md border border-border bg-background py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Claim Yield to katakuriUSD
        </button>
      </div>

      {/* Burn */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground">Burn katakuriUSD to USDC</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Convert katakuriUSD back to USDC at 1:1 ratio
        </p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">katakuriUSD Balance</span>
          <span className="font-mono font-semibold tabular-nums text-foreground">
            ${formatUsd(balances.katakuriUsd)}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
          <button
            onClick={() => setAmount(String(balances.katakuriUsd))}
            className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Max
          </button>
        </div>
        <button
          onClick={handleBurn}
          disabled={!canBurn}
          className="mt-3 w-full rounded-md bg-foreground py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Burn to USDC
        </button>
      </div>
    </div>
  )
}
