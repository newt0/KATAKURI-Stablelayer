import { useSuiClient } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'
import { MARKET_CREATED_EVENT } from '@/lib/sui/config'
import type { MarketEvent } from '@/types/on-chain'

/** Fetch all MarketCreated events to build market list */
export default function useOnChainMarkets() {
  const suiClient = useSuiClient()

  return useQuery({
    queryKey: ['onChainMarkets'],
    queryFn: async (): Promise<MarketEvent[]> => {
      const { data } = await suiClient.queryEvents({
        query: { MoveEventType: MARKET_CREATED_EVENT },
        order: 'descending',
        limit: 50,
      })

      return data.map((event) => {
        const json = event.parsedJson as Record<string, string>
        return {
          marketId: json.market_id,
          question: json.question,
          numOutcomes: Number(json.num_outcomes),
          b: Number(json.b),
          feeBps: Number(json.fee_bps),
          txDigest: event.id.txDigest,
        }
      })
    },
    staleTime: 30_000,
  })
}
