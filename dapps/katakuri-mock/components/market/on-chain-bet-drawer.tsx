"use client"

import { useState } from "react"
import type { MarketInfo } from "@/types/on-chain"
import { useCurrentAccount } from "@mysten/dapp-kit"
import useSuiBalance from "@/hooks/sui/use-sui-balance"
import { useMarketTransaction } from "@/hooks/sui/use-market-transaction"
import { buildBuyTx } from "@/lib/sui/transactions"
import { formatCoinAmount, formatProbability, toCoinUnits } from "@/lib/sui/utils"
import { formatUsd } from "@/lib/format"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface OnChainBetDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  market: MarketInfo
  outcomeIndex: number
}

export function OnChainBetDrawer({ open, onOpenChange, market, outcomeIndex }: OnChainBetDrawerProps) {
  const [amount, setAmount] = useState("")
  const account = useCurrentAccount()
  const { data: suiBalance } = useSuiBalance()
  const { execute, isPending } = useMarketTransaction({
    onSuccess: () => {
      setAmount("")
      onOpenChange(false)
    },
  })

  const outcome = market.outcomes[outcomeIndex]
  const currentPrice = market.probabilities[outcomeIndex]
  const numAmount = parseFloat(amount) || 0
  const estimatedShares = numAmount > 0 ? numAmount / currentPrice : 0
  const potentialPayout = estimatedShares

  const balanceInCoin = suiBalance ? Number(suiBalance) : 0
  const canBet = !!account && numAmount > 0 && toCoinUnits(numAmount) <= BigInt(balanceInCoin)

  const handleBet = async () => {
    if (!canBet) return
    const amountMist = toCoinUnits(numAmount)
    const tx = buildBuyTx(market.id, outcomeIndex, amountMist, 0)
    await execute(tx)
  }

  const presetAmounts = [1, 5, 10, 20, 50]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Buy Shares</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-md border border-border bg-muted p-3">
            <p className="text-xs text-muted-foreground">{market.question}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {outcome}
              <span className="ml-2 font-mono text-muted-foreground">
                {formatProbability(currentPrice)}
              </span>
            </p>
          </div>

          {!account && (
            <div className="rounded-md border border-border bg-muted p-3">
              <p className="text-sm text-muted-foreground">Connect wallet to buy shares</p>
            </div>
          )}

          {account && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Amount (SUI)
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
                      {preset} SUI
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Balance: {formatCoinAmount(balanceInCoin)} SUI
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

              <button
                onClick={handleBet}
                disabled={!canBet || isPending}
                className="w-full rounded-md bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPending
                  ? "Signing..."
                  : canBet
                    ? `Buy for ${numAmount.toFixed(2)} SUI`
                    : numAmount > 0 && toCoinUnits(numAmount) > BigInt(balanceInCoin)
                      ? "Insufficient Balance"
                      : "Enter Amount"}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
