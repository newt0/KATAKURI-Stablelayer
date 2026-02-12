"use client"

import { useState } from "react"
import type { Market } from "@/types/katakuri"
import { useKatakuriStore } from "@/store/katakuri"
import { formatPercent, formatUsd } from "@/lib/format"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BetDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  market: Market
  outcome: string
}

export function BetDrawer({ open, onOpenChange, market, outcome }: BetDrawerProps) {
  const [amount, setAmount] = useState("")
  const mintAndBuy = useKatakuriStore((s) => s.mintAndBuy)
  const balances = useKatakuriStore((s) => s.balances)

  const outcomeIndex = market.outcomes.indexOf(outcome)
  const currentPrice = market.pricing.prices[outcomeIndex]
  const numAmount = parseFloat(amount) || 0
  const estimatedShares = numAmount > 0 ? numAmount / currentPrice : 0
  const potentialPayout = estimatedShares

  const canBet = numAmount > 0 && numAmount <= balances.usdc

  const handleBet = () => {
    if (!canBet) return
    mintAndBuy({ marketId: market.id, outcome, usdcAmount: numAmount })
    setAmount("")
    onOpenChange(false)
  }

  const presetAmounts = [10, 25, 50, 100, 250]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Place Bet</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-md border border-border bg-muted p-3">
            <p className="text-xs text-muted-foreground">{market.title}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {outcome}
              <span className="ml-2 font-mono text-muted-foreground">
                {formatPercent(currentPrice)}
              </span>
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  ${preset}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Balance: ${formatUsd(balances.usdc)} USDC
            </p>
          </div>

          <div className="space-y-2 rounded-md border border-border bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Shares</span>
              <span className="font-mono tabular-nums text-foreground">
                {estimatedShares.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potential Payout</span>
              <span className="font-mono tabular-nums text-foreground">
                ${formatUsd(potentialPayout)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potential Profit</span>
              <span className="font-mono tabular-nums text-foreground">
                ${formatUsd(Math.max(0, potentialPayout - numAmount))}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Atomic: USDC {">"} katakuriUSD {">"} Shares (PTB simulation)
            </p>
            <button
              onClick={handleBet}
              disabled={!canBet}
              className="w-full rounded-md bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {canBet
                ? `Mint & Buy for $${formatUsd(numAmount)}`
                : numAmount > balances.usdc
                  ? "Insufficient Balance"
                  : "Enter Amount"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
