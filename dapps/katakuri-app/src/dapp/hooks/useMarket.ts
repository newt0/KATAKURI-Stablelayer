import { useSuiClient } from '@mysten/dapp-kit'
import { useQuery } from '@tanstack/react-query'
import { KATAKURI_PACKAGE_ID, COIN_TYPE, Q64 } from '../config'
import type { MarketInfo } from '~~/types/market'
import { Transaction } from '@mysten/sui/transactions'

/** Fetch full market info by object ID */
export default function useMarket(marketId: string | undefined) {
  const suiClient = useSuiClient()

  return useQuery({
    queryKey: ['market', marketId],
    queryFn: async (): Promise<MarketInfo> => {
      if (!marketId) throw new Error('No marketId')

      const obj = await suiClient.getObject({
        id: marketId,
        options: { showContent: true },
      })

      if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') {
        throw new Error('Market not found')
      }

      const fields = obj.data.content.fields as Record<string, unknown>
      const question = fields.question as string
      const outcomes = fields.outcomes as string[]
      const b = Number(fields.b)
      const resolved = fields.resolved as boolean
      const feeBps = Number(fields.fee_bps)
      const balanceField = fields.balance as Record<string, string>
      const balance = Number(balanceField?.value ?? balanceField ?? 0)
      const winnerField = fields.winner as Record<string, unknown> | null
      const winner =
        winnerField && winnerField.vec && (winnerField.vec as unknown[]).length > 0
          ? Number((winnerField.vec as unknown[])[0])
          : null

      // Fetch probabilities via devInspect
      const probabilities = await fetchProbabilities(
        suiClient,
        marketId,
        outcomes.length,
      )

      return {
        id: marketId,
        question,
        outcomes,
        b,
        resolved,
        winner,
        balance,
        feeBps,
        probabilities,
      }
    },
    enabled: !!marketId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}

async function fetchProbabilities(
  suiClient: ReturnType<typeof useSuiClient>,
  marketId: string,
  numOutcomes: number,
): Promise<number[]> {
  const probabilities: number[] = []
  for (let i = 0; i < numOutcomes; i++) {
    try {
      const tx = new Transaction()
      tx.moveCall({
        package: KATAKURI_PACKAGE_ID,
        module: 'market',
        function: 'get_outcome_probability',
        typeArguments: [COIN_TYPE],
        arguments: [tx.object(marketId), tx.pure.u64(i)],
      })
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      })
      if (
        result.results?.[0]?.returnValues?.[0]
      ) {
        const bytes = result.results[0].returnValues[0][0]
        // u128 LE bytes → BigInt
        const u8arr = new Uint8Array(bytes)
        let val = 0n
        for (let j = u8arr.length - 1; j >= 0; j--) {
          val = (val << 8n) | BigInt(u8arr[j])
        }
        probabilities.push(Number(val) / Number(Q64))
      } else {
        probabilities.push(1 / numOutcomes)
      }
    } catch {
      probabilities.push(1 / numOutcomes)
    }
  }
  return probabilities
}
