import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'
import { ADMIN_CAP_TYPE } from '../config'

interface AdminCapInfo {
  id: string
  marketId: string
}

/** Fetch all AdminCap objects owned by the current user */
export default function useAdminCaps() {
  const suiClient = useSuiClient()
  const account = useCurrentAccount()
  const owner = account?.address

  return useQuery({
    queryKey: ['adminCaps', owner],
    queryFn: async (): Promise<AdminCapInfo[]> => {
      if (!owner) return []

      const { data } = await suiClient.getOwnedObjects({
        owner,
        filter: { StructType: ADMIN_CAP_TYPE },
        options: { showContent: true },
      })

      return data
        .filter(
          (item) =>
            item.data?.content &&
            item.data.content.dataType === 'moveObject',
        )
        .map((item) => {
          const content = item.data!.content!
          if (content.dataType !== 'moveObject') throw new Error('unreachable')
          const fields = content.fields as Record<string, unknown>
          return {
            id: item.data!.objectId,
            marketId: fields.market_id as string,
          }
        })
    },
    enabled: !!owner,
    staleTime: 30_000,
  })
}
