import { useSuiClient } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'
import { Transaction } from '@mysten/sui/transactions'
import { KATAKURI_PACKAGE_ID, COIN_TYPE } from '../config'

/** Estimate cost to buy shares via devInspect */
export default function useEstimateCost(
  marketId: string | undefined,
  outcomeIndex: number,
  shares: number,
) {
  const suiClient = useSuiClient()

  return useQuery({
    queryKey: ['estimateCost', marketId, outcomeIndex, shares],
    queryFn: async (): Promise<number> => {
      if (!marketId || shares <= 0) return 0

      const tx = new Transaction()
      tx.moveCall({
        package: KATAKURI_PACKAGE_ID,
        module: 'market',
        function: 'estimate_buy_cost',
        typeArguments: [COIN_TYPE],
        arguments: [
          tx.object(marketId),
          tx.pure.u64(outcomeIndex),
          tx.pure.u64(shares),
        ],
      })

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      })

      if (result.results?.[0]?.returnValues?.[0]) {
        const bytes = result.results[0].returnValues[0][0]
        const u8arr = new Uint8Array(bytes)
        let val = 0n
        for (let j = u8arr.length - 1; j >= 0; j--) {
          val = (val << 8n) | BigInt(u8arr[j])
        }
        return Number(val)
      }
      return 0
    },
    enabled: !!marketId && shares > 0,
    staleTime: 5_000,
  })
}
