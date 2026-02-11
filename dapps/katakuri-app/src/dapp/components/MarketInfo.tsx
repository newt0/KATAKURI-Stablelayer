import { FC } from 'react'
import { Card, Flex, Text, Badge } from '@radix-ui/themes'
import type { MarketInfo as MarketInfoType } from '~~/types/market'
import { formatCoinAmount } from '../utils'
import { COIN_SYMBOL } from '../config'

interface MarketInfoProps {
  market: MarketInfoType
}

const MarketInfo: FC<MarketInfoProps> = ({ market }) => {
  return (
    <Card variant="classic">
      <Flex direction="column" gap="2">
        <Text size="2" weight="bold" color="gray">
          Market Info
        </Text>
        <Flex justify="between">
          <Text size="2">Pool Balance:</Text>
          <Text size="2" weight="medium">
            {formatCoinAmount(market.balance)} {COIN_SYMBOL}
          </Text>
        </Flex>
        <Flex justify="between">
          <Text size="2">Liquidity (b):</Text>
          <Text size="2" weight="medium">
            {market.b.toLocaleString()}
          </Text>
        </Flex>
        <Flex justify="between">
          <Text size="2">Fee:</Text>
          <Text size="2" weight="medium">
            {market.feeBps / 100}%
          </Text>
        </Flex>
        <Flex justify="between">
          <Text size="2">Status:</Text>
          {market.resolved ? (
            <Badge color="gray">
              Resolved — Winner: {market.outcomes[market.winner ?? 0]}
            </Badge>
          ) : (
            <Badge color="green">Active</Badge>
          )}
        </Flex>
      </Flex>
    </Card>
  )
}

export default MarketInfo
