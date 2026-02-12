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
    <Card variant="classic" className="bg-dark-card border border-dark-border">
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
            <Badge className="bg-gray-500/20 text-gray-300 border border-gray-500/30">
              Resolved — Winner: {market.outcomes[market.winner ?? 0]}
            </Badge>
          ) : (
            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
              Active
            </Badge>
          )}
        </Flex>
      </Flex>
    </Card>
  )
}

export default MarketInfo
