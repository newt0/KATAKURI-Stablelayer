import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'
import { POSITION_TYPE } from '@/lib/sui/config'
import type { PositionInfo } from '@/types/on-chain'

/** Fetch all Position objects owned by the current user */
export default function useOnChainPositions(marketId?: string) {
  const suiClient = useSuiClient()
  const account = useCurrentAccount()
  const owner = account?.address

  return useQuery({
    queryKey: ['positions', owner, marketId],
    queryFn: async (): Promise<PositionInfo[]> => {
      if (!owner) return []

      const { data } = await suiClient.getOwnedObjects({
        owner,
        filter: { StructType: POSITION_TYPE },
        options: { showContent: true },
      })

      const positions: PositionInfo[] = []
      for (const item of data) {
        if (!item.data?.content || item.data.content.dataType !== 'moveObject')
          continue
        const fields = item.data.content.fields as Record<string, unknown>
        const pos: PositionInfo = {
          id: item.data.objectId,
          marketId: fields.market_id as string,
          outcomeIndex: Number(fields.outcome_index),
          shares: Number(fields.shares),
        }
        if (!marketId || pos.marketId === marketId) {
          positions.push(pos)
        }
      }
      return positions
    },
    enabled: !!owner,
    staleTime: 10_000,
  })
}
