import { FC, useState } from 'react'
import { Card, Flex, Text, Button, Badge } from '@radix-ui/themes'
import type { MarketInfo, PositionInfo } from '~~/types/market'
import { buildRedeemTx } from '../helpers/transactions'
import useMarketAction from '../hooks/useMarketAction'
import { formatCoinAmount } from '../utils'
import { COIN_SYMBOL } from '../config'

interface PositionsListProps {
  market: MarketInfo
  positions: PositionInfo[]
}

const PositionsList: FC<PositionsListProps> = ({ market, positions }) => {
  const [isOpen, setIsOpen] = useState(true)
  const { execute, isPending } = useMarketAction()

  if (positions.length === 0) return null

  const handleRedeem = (position: PositionInfo) => {
    const tx = buildRedeemTx(market.id, position.id)
    execute(tx)
  }

  const isWinner = (pos: PositionInfo) =>
    market.resolved && market.winner === pos.outcomeIndex

  return (
    <div className="bg-dark-card p-4 space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-sm font-semibold text-white hover:text-gray-300 transition-colors"
      >
        <span>Your Positions</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-2">
          {positions.map((pos) => (
            <Card key={pos.id} variant="surface" className="bg-dark-bg/50 border border-dark-border">
              <Flex justify="between" align="center" gap="3">
                <Flex direction="column" gap="1" className="flex-1">
                  <Flex align="center" gap="2">
                    <Text size="2" weight="bold" className="text-white">
                      {market.outcomes[pos.outcomeIndex]}
                    </Text>
                    {isWinner(pos) && (
                      <Badge className="bg-green-500/20 text-green-400 border border-green-500/30" size="1">
                        Winner
                      </Badge>
                    )}
                    {market.resolved && !isWinner(pos) && (
                      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30" size="1">
                        Lost
                      </Badge>
                    )}
                  </Flex>
                  <Text size="1" className="text-gray-400">
                    {formatCoinAmount(pos.shares)} {COIN_SYMBOL} shares
                  </Text>
                </Flex>

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
        </div>
      )}
    </div>
  )
}

export default PositionsList
