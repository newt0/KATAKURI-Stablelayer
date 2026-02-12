"use client"

import { use } from "react"
import Link from "next/link"
import useOnChainMarket from "@/hooks/sui/use-on-chain-market"
import { OnChainMarketCard } from "@/components/market/on-chain-market-card"
import { OnChainWalletSummary } from "@/components/market/on-chain-wallet-summary"
import { OnChainActivityFeed } from "@/components/market/on-chain-activity-feed"

export default function OnChainMarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: market, isLoading, error } = useOnChainMarket(id)

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Loading market...</p>
      </div>
    )
  }

  if (error || !market) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-lg font-semibold text-foreground">Market not found</h1>
        <Link href="/" className="mt-2 inline-block text-sm text-muted-foreground underline">
          Back to markets
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Markets
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground">{market.question}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Market
          </h2>
          <OnChainMarketCard market={market} />
        </div>

        <div className="space-y-4">
          <OnChainWalletSummary />
          <OnChainActivityFeed />
        </div>
      </div>
    </div>
  )
}
