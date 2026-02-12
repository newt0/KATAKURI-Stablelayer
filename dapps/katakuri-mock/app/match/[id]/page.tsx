"use client"

import { use } from "react"
import Link from "next/link"
import { useKatakuriStore } from "@/store/katakuri"
import { StreamPlaceholder } from "@/components/match/stream-placeholder"
import { MarketCard } from "@/components/match/market-card"
import { WalletSummary } from "@/components/match/wallet-summary"
import { ActivityFeed } from "@/components/match/activity-feed"

export default function MatchRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const matches = useKatakuriStore((s) => s.matches)
  const match = matches.find((m) => m.id === id)

  if (!match) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-lg font-semibold text-foreground">Match not found</h1>
        <Link href="/" className="mt-2 inline-block text-sm text-muted-foreground underline">
          Back to matches
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
          Matches
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium text-foreground">{match.title}</span>
      </div>

      <StreamPlaceholder match={match} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Markets
          </h2>
          {match.markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>

        <div className="space-y-4">
          <WalletSummary />
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
