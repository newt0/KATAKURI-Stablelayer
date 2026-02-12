import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'
import { COIN_TYPE } from '@/lib/sui/config'

/** Fetch wallet SUI balance */
export default function useSuiBalance() {
  const suiClient = useSuiClient()
  const account = useCurrentAccount()
  const owner = account?.address

  return useQuery({
    queryKey: ['suiBalance', owner],
    queryFn: async (): Promise<bigint> => {
      if (!owner) return 0n

      const { totalBalance } = await suiClient.getBalance({
        owner,
        coinType: COIN_TYPE,
      })

      return BigInt(totalBalance)
    },
    enabled: !!owner,
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}
