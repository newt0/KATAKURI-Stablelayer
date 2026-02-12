import { FC, useState } from 'react'
import { Card, Flex, Text, Select } from '@radix-ui/themes'
import type { MarketInfo, PositionInfo } from '~~/types/market'
import { COIN_SYMBOL, COIN_DECIMALS } from '../config'
import { buildBuyTx, buildSellTx } from '../helpers/transactions'
import useMarketAction from '../hooks/useMarketAction'
import useEstimateCost from '../hooks/useEstimateCost'
import { formatCoinAmount, toCoinUnits } from '../utils'
import { toast } from 'sonner'
import PriceChart from './PriceChart'
import { PROBABILITY_COLORS } from './ProbabilityBar'

interface BuySharesFormProps {
  market: MarketInfo
  positions?: PositionInfo[]
  chartData?: Record<number, { time: number; price: number }[]>
}

const BuySharesForm: FC<BuySharesFormProps> = ({ market, positions, chartData }) => {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [outcomeIndex, setOutcomeIndex] = useState(0)
  const [amount, setAmount] = useState(1)
  const { execute, isPending } = useMarketAction()

  const amountInUnits = Number(toCoinUnits(amount, COIN_DECIMALS))
  const { data: estimatedCost } = useEstimateCost(
    market.id,
    outcomeIndex,
    amountInUnits,
  )

  // Find available shares for sell mode
  const position = positions?.find(p => p.outcomeIndex === outcomeIndex)
  const availableShares = position ? Number(formatCoinAmount(position.shares)) : 0

  const handleQuantityChange = (delta: number) => {
    const newAmount = Math.max(1, amount + delta)
    if (mode === 'sell' && newAmount > availableShares) {
      setAmount(availableShares)
    } else {
      setAmount(newAmount)
    }
  }

  const handleSubmit = async () => {
    if (mode === 'sell') {
      if (!position) {
        toast.error('No position found for this outcome')
        return
      }
      const tx = buildSellTx(market.id, position.id)
      await execute(tx)
    } else {
      if (amount <= 0) return
      const units = toCoinUnits(amount, COIN_DECIMALS)
      const tx = buildBuyTx(market.id, outcomeIndex, units, 0)
      await execute(tx)
    }
    setAmount(1)
  }

  if (market.resolved) return null

  return (
    <Card size="3" style={{ width: '100%' }} className="bg-dark-card border border-dark-border">
      <Flex direction="column" gap="3">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('buy')}
            className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${
              mode === 'buy'
                ? 'bg-green-500/80 text-white hover:bg-green-500'
                : 'bg-transparent border border-dark-border text-gray-400 hover:text-white'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setMode('sell')}
            className={`flex-1 py-2 text-sm font-medium rounded transition-colors ${
              mode === 'sell'
                ? 'bg-red-500/80 text-white hover:bg-red-500'
                : 'bg-transparent border border-dark-border text-gray-400 hover:text-white'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Outcome Selector */}
        <Flex direction="column" gap="1">
          <Text size="2" className="text-gray-400">
            Outcome
          </Text>
          <Select.Root
            value={String(outcomeIndex)}
            onValueChange={(v) => setOutcomeIndex(Number(v))}
          >
            <Select.Trigger className="cursor-pointer" />
            <Select.Content>
              {market.outcomes.map((outcome, i) => (
                <Select.Item
                  key={i}
                  value={String(i)}
                  className="cursor-pointer"
                >
                  {outcome}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        {/* Price Chart */}
        {chartData && chartData[outcomeIndex] && (
          <PriceChart
            data={chartData[outcomeIndex]}
            color={PROBABILITY_COLORS[outcomeIndex % PROBABILITY_COLORS.length]}
          />
        )}

        {/* Quantity Selector */}
        <Flex direction="column" gap="1">
          <Text size="2" className="text-gray-400">
            Quantity
          </Text>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="w-8 h-8 flex items-center justify-center bg-dark-border hover:bg-gray-700 rounded text-white transition-colors text-lg"
            >
              −
            </button>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                const val = Math.max(1, parseInt(e.target.value) || 1)
                if (mode === 'sell' && val > availableShares) {
                  setAmount(availableShares)
                } else {
                  setAmount(val)
                }
              }}
              className="w-20 text-center bg-dark-bg border border-dark-border rounded py-2 text-sm text-white focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => handleQuantityChange(1)}
              className="w-8 h-8 flex items-center justify-center bg-dark-border hover:bg-gray-700 rounded text-white transition-colors text-lg"
            >
              +
            </button>
            <span className="text-xs text-gray-400">Shares</span>
          </div>
          {mode === 'sell' && (
            <div className="text-xs text-gray-400">
              Available to Sell: <span className="text-white">{availableShares.toFixed(2)} Shares</span>
            </div>
          )}
        </Flex>

        {/* Estimated Cost (Buy mode only) */}
        {mode === 'buy' && estimatedCost !== undefined && estimatedCost > 0 && (
          <Card variant="surface" className="bg-dark-bg/50">
            <Flex justify="between">
              <Text size="2" className="text-gray-400">
                Estimated cost:
              </Text>
              <Text size="2" weight="medium" className="text-white">
                {formatCoinAmount(estimatedCost)} {COIN_SYMBOL}
              </Text>
            </Flex>
          </Card>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={
            isPending ||
            amount <= 0 ||
            (mode === 'sell' && (!position || amount > availableShares))
          }
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
            mode === 'buy'
              ? 'bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed'
          }`}
        >
          {isPending
            ? 'Processing...'
            : mode === 'buy'
            ? `Confirm Buy`
            : `Confirm Sell`}
        </button>
      </Flex>
    </Card>
  )
}

export default BuySharesForm
