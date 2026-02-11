import { FC } from 'react'
import { Card, Flex, Text, Button, Badge } from '@radix-ui/themes'
import type { MarketInfo, PositionInfo } from '~~/types/market'
import { buildSellTx, buildRedeemTx } from '../helpers/transactions'
import useMarketAction from '../hooks/useMarketAction'
import { formatCoinAmount } from '../utils'
import { COIN_SYMBOL } from '../config'

interface PositionsListProps {
  market: MarketInfo
  positions: PositionInfo[]
}

const PositionsList: FC<PositionsListProps> = ({ market, positions }) => {
  const { execute, isPending } = useMarketAction()

  if (positions.length === 0) return null

  const handleSell = (position: PositionInfo) => {
    const tx = buildSellTx(market.id, position.id)
    execute(tx)
  }

  const handleRedeem = (position: PositionInfo) => {
    const tx = buildRedeemTx(market.id, position.id)
    execute(tx)
  }

  const isWinner = (pos: PositionInfo) =>
    market.resolved && market.winner === pos.outcomeIndex

  return (
    <Card size="3" style={{ width: '100%' }}>
      <Flex direction="column" gap="3">
        <Text size="3" weight="bold">
          Your Positions
        </Text>

        {positions.map((pos) => (
          <Card key={pos.id} variant="surface">
            <Flex justify="between" align="center" gap="3">
              <Flex direction="column" gap="1" className="flex-1">
                <Flex align="center" gap="2">
                  <Text size="2" weight="bold">
                    {market.outcomes[pos.outcomeIndex]}
                  </Text>
                  {isWinner(pos) && (
                    <Badge color="green" size="1">
                      Winner
                    </Badge>
                  )}
                  {market.resolved && !isWinner(pos) && (
                    <Badge color="red" size="1">
                      Lost
                    </Badge>
                  )}
                </Flex>
                <Text size="1" color="gray">
                  {formatCoinAmount(pos.shares)} {COIN_SYMBOL} shares
                </Text>
              </Flex>

              {!market.resolved && (
                <Button
                  size="2"
                  variant="soft"
                  color="orange"
                  onClick={() => handleSell(pos)}
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  Sell
                </Button>
              )}

              {market.resolved && isWinner(pos) && (
                <Button
                  size="2"
                  variant="solid"
                  color="green"
                  onClick={() => handleRedeem(pos)}
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  Redeem
                </Button>
              )}
            </Flex>
          </Card>
        ))}
      </Flex>
    </Card>
  )
}

export default PositionsList
