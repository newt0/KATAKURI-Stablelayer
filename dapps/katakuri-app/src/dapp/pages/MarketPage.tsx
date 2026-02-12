import { FC, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Text, Button } from '@radix-ui/themes'
import { useCurrentAccount } from '@mysten/dapp-kit'
import Layout from '~~/components/layout/Layout'
import CustomConnectButton from '~~/components/CustomConnectButton'
import NetworkSupportChecker from '~~/components/NetworkSupportChecker'
import useMarket from '../hooks/useMarket'
import usePositions from '../hooks/usePositions'
import MarketOverview from '../components/MarketOverview'
import BuySharesForm from '../components/BuySharesForm'
import PositionsList from '../components/PositionsList'
import MarketInfo from '../components/MarketInfo'
import { PROBABILITY_COLORS } from '../components/ProbabilityBar'

const MarketPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentAccount = useCurrentAccount()
  const { data: market, isLoading } = useMarket(id)
  const { data: positions } = usePositions(id)

  // Chart data state management
  const [chartData, setChartData] = useState<Record<number, { time: number; price: number }[]>>({})

  useEffect(() => {
    if (!market) return

    setChartData(prev => {
      const newData = { ...prev }
      market.outcomes.forEach((_, i) => {
        // Initialize with past 20 data points if first time
        const currentData = prev[i] || Array.from({ length: 20 }, (_, j) => ({
          time: Date.now() - (20 - j) * 60000,
          price: market.probabilities[i] || 0
        }))

        // Add new data point, remove oldest
        newData[i] = [
          ...currentData.slice(1),
          { time: Date.now(), price: market.probabilities[i] || 0 }
        ]
      })
      return newData
    })
  }, [market?.probabilities])

  return (
    <Layout>
      <NetworkSupportChecker />
      <div className="flex flex-grow flex-col items-center p-3">
        {!currentAccount ? (
          <CustomConnectButton />
        ) : (
          <div className="w-full max-w-2xl space-y-0">
            <Button
              variant="ghost"
              size="1"
              onClick={() => navigate('/')}
              className="cursor-pointer mb-4"
            >
              &larr; Back to Markets
            </Button>

            {isLoading && (
              <Text size="2" color="gray" className="block text-center">
                Loading market...
              </Text>
            )}

            {market && (
              <>
                <MarketOverview
                  totalPool={market.balance}
                  outcomes={market.outcomes}
                  probabilities={market.probabilities}
                  colors={PROBABILITY_COLORS}
                />

                <div className="h-px bg-dark-border my-0"></div>

                <BuySharesForm
                  market={market}
                  positions={positions}
                  chartData={chartData}
                />

                <div className="h-px bg-dark-border my-0"></div>

                {positions && positions.length > 0 && (
                  <>
                    <PositionsList market={market} positions={positions} />
                    <div className="h-px bg-dark-border my-0"></div>
                  </>
                )}

                <MarketInfo market={market} />
              </>
            )}

            {!isLoading && !market && (
              <Text size="2" color="red" className="block text-center">
                Market not found.
              </Text>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MarketPage
