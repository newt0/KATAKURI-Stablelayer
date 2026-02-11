import { useState } from 'react'
import { Transaction } from '@mysten/sui/transactions'
import { SuiSignAndExecuteTransactionOutput } from '@mysten/wallet-standard'
import useTransact from '@suiware/kit/useTransact'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { notification } from '~~/helpers/notification'

interface UseMarketActionOptions {
  onSuccess?: (data: SuiSignAndExecuteTransactionOutput) => void
}

/**
 * Generic hook wrapping useTransact for market operations.
 * Handles loading state, toast notifications, and cache invalidation.
 */
export default function useMarketAction(options?: UseMarketActionOptions) {
  const [isPending, setIsPending] = useState(false)
  const [notificationId, setNotificationId] = useState<string>()
  const queryClient = useQueryClient()

  const { transact } = useTransact({
    onBeforeStart: () => {
      setIsPending(true)
      const nId = notification.txLoading()
      setNotificationId(nId)
    },
    onSuccess: async (data: SuiSignAndExecuteTransactionOutput) => {
      setIsPending(false)
      toast.dismiss(notificationId)
      notification.success('Transaction successful!', notificationId)

      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ['market'] })
      await queryClient.invalidateQueries({ queryKey: ['positions'] })
      await queryClient.invalidateQueries({ queryKey: ['marketEvents'] })
      await queryClient.invalidateQueries({ queryKey: ['adminCaps'] })
      await queryClient.invalidateQueries({ queryKey: ['estimateCost'] })

      options?.onSuccess?.(data)
    },
    onError: (e: Error) => {
      notification.txError(e, null, notificationId)
      setIsPending(false)
    },
  })

  const execute = (tx: Transaction) => {
    transact(tx)
  }

  return { execute, isPending }
}
