"use client"

import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Transaction } from '@mysten/sui/transactions'
import { parseMoveError } from '@/lib/sui/errors'

interface UseMarketTransactionOptions {
  onSuccess?: () => void
}

/**
 * Hook for executing market transactions with toast notifications and cache invalidation.
 * Replaces @suiware/kit with direct @mysten/dapp-kit usage for Next.js SSR compatibility.
 */
export function useMarketTransaction(options?: UseMarketTransactionOptions) {
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction()
  const queryClient = useQueryClient()

  const execute = async (tx: Transaction) => {
    const toastId = 'tx'
    toast.loading('Signing transaction...', { id: toastId })

    try {
      await signAndExecute({ transaction: tx })
      toast.success('Transaction successful!', { id: toastId })

      // Invalidate all relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['onChainMarkets'] }),
        queryClient.invalidateQueries({ queryKey: ['market'] }),
        queryClient.invalidateQueries({ queryKey: ['positions'] }),
        queryClient.invalidateQueries({ queryKey: ['suiBalance'] }),
        queryClient.invalidateQueries({ queryKey: ['adminCaps'] }),
        queryClient.invalidateQueries({ queryKey: ['estimateCost'] }),
      ])

      options?.onSuccess?.()
    } catch (e) {
      const errorMessage = parseMoveError(e as Error)
      toast.error(errorMessage, { id: toastId })
      throw e
    }
  }

  return { execute, isPending }
}
