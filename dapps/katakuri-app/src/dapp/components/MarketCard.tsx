import { FC } from 'react'
import { Card, Flex, Text, Badge } from '@radix-ui/themes'
import { useNavigate } from 'react-router'
import useMarket from '../hooks/useMarket'
import ProbabilityBar from './ProbabilityBar'
import { formatCoinAmount } from '../utils'
import { COIN_SYMBOL } from '../config'

interface MarketCardProps {
  marketId: string
  question: string
}

const MarketCard: FC<MarketCardProps> = ({ marketId, question }) => {
  const navigate = useNavigate()
  const { data: market } = useMarket(marketId)

  return (
    <Card
      className="w-full cursor-pointer transition-shadow hover:shadow-lg"
      onClick={() => navigate(`/market/${marketId}`)}
    >
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Text size="3" weight="bold" className="flex-1">
            {question}
          </Text>
          {market?.resolved ? (
            <Badge color="gray" size="1">
              Resolved
            </Badge>
          ) : (
            <Badge color="green" size="1">
              Active
            </Badge>
          )}
        </Flex>

        {market && (
          <>
            <ProbabilityBar
              outcomes={market.outcomes}
              probabilities={market.probabilities}
            />
            <Flex justify="between">
              <Text size="1" color="gray">
                Pool: {formatCoinAmount(market.balance)} {COIN_SYMBOL}
              </Text>
              <Text size="1" color="gray">
                Fee: {market.feeBps / 100}%
              </Text>
            </Flex>
          </>
        )}
      </Flex>
    </Card>
  )
}

export default MarketCard
