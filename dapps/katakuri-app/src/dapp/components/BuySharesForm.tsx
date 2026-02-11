import { FC, useState } from 'react'
import { Card, Flex, Text, TextField, Select, Button } from '@radix-ui/themes'
import type { MarketInfo } from '~~/types/market'
import { COIN_SYMBOL, COIN_DECIMALS } from '../config'
import { buildBuyTx } from '../helpers/transactions'
import useMarketAction from '../hooks/useMarketAction'
import useEstimateCost from '../hooks/useEstimateCost'
import { formatCoinAmount, toCoinUnits } from '../utils'

interface BuySharesFormProps {
  market: MarketInfo
}

const BuySharesForm: FC<BuySharesFormProps> = ({ market }) => {
  const [outcomeIndex, setOutcomeIndex] = useState(0)
  const [amount, setAmount] = useState('')
  const { execute, isPending } = useMarketAction()

  const amountInUnits = amount
    ? Number(toCoinUnits(Number(amount), COIN_DECIMALS))
    : 0
  const { data: estimatedCost } = useEstimateCost(
    market.id,
    outcomeIndex,
    amountInUnits,
  )

  const handleBuy = () => {
    if (!amount || Number(amount) <= 0) return
    const units = toCoinUnits(Number(amount), COIN_DECIMALS)
    const tx = buildBuyTx(market.id, outcomeIndex, units, 0)
    execute(tx)
    setAmount('')
  }

  if (market.resolved) return null

  return (
    <Card size="3" style={{ width: '100%' }}>
      <Flex direction="column" gap="3">
        <Text size="3" weight="bold">
          Buy Shares
        </Text>

        <Flex direction="column" gap="1">
          <Text size="2" color="gray">
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

        <Flex direction="column" gap="1">
          <Text size="2" color="gray">
            Amount ({COIN_SYMBOL})
          </Text>
          <TextField.Root
            placeholder="0.00"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Flex>

        {estimatedCost !== undefined && estimatedCost > 0 && (
          <Card variant="surface">
            <Flex justify="between">
              <Text size="2" color="gray">
                Estimated cost:
              </Text>
              <Text size="2" weight="medium">
                {formatCoinAmount(estimatedCost)} {COIN_SYMBOL}
              </Text>
            </Flex>
          </Card>
        )}

        <Button
          size="3"
          color="blue"
          onClick={handleBuy}
          disabled={!amount || Number(amount) <= 0 || isPending}
          className="cursor-pointer"
        >
          {isPending
            ? 'Processing...'
            : `Buy ${market.outcomes[outcomeIndex]} Shares`}
        </Button>
      </Flex>
    </Card>
  )
}

export default BuySharesForm
