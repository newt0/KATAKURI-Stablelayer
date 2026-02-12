"use client"

import useOnChainMarkets from "@/hooks/sui/use-on-chain-markets"
import { OnChainMarketListCard } from "@/components/market/on-chain-market-list-card"

export default function HomePage() {
  const { data: marketEvents, isLoading, error } = useOnChainMarkets()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Markets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time prediction markets on Sui Testnet
        </p>
      </div>

      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Loading markets...</p>
        </div>
      )}

      {error && (
        <div className="py-12 text-center">
          <p className="text-sm text-destructive">Failed to load markets. Please try again.</p>
        </div>
      )}

      {marketEvents && marketEvents.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            All Markets
          </h2>
          <div className="space-y-3">
            {marketEvents.map((event) => (
              <OnChainMarketListCard key={event.marketId} marketEvent={event} />
            ))}
          </div>
        </section>
      )}

      {marketEvents && marketEvents.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No markets found. Create one from the Admin page!</p>
        </div>
      )}
    </div>
  )
}
