import { FC } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Flex, Text, Button } from '@radix-ui/themes'
import { useCurrentAccount } from '@mysten/dapp-kit'
import Layout from '~~/components/layout/Layout'
import CustomConnectButton from '~~/components/CustomConnectButton'
import NetworkSupportChecker from '~~/components/NetworkSupportChecker'
import useMarket from '../hooks/useMarket'
import usePositions from '../hooks/usePositions'
import ProbabilityBar from '../components/ProbabilityBar'
import BuySharesForm from '../components/BuySharesForm'
import PositionsList from '../components/PositionsList'
import MarketInfo from '../components/MarketInfo'

const MarketPage: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentAccount = useCurrentAccount()
  const { data: market, isLoading } = useMarket(id)
  const { data: positions } = usePositions(id)

  return (
    <Layout>
      <NetworkSupportChecker />
      <div className="flex flex-grow flex-col items-center p-3">
        {!currentAccount ? (
          <CustomConnectButton />
        ) : (
          <div className="w-full max-w-lg space-y-4">
            <Button
              variant="ghost"
              size="1"
              onClick={() => navigate('/')}
              className="cursor-pointer"
            >
              &larr; Back to Markets
            </Button>

            {isLoading && (
              <Text size="2" color="gray" className="block text-center">
                Loading market...
              </Text>
            )}

            {market && (
              <Flex direction="column" gap="4">
                <Text size="5" weight="bold">
                  {market.question}
                </Text>

                <ProbabilityBar
                  outcomes={market.outcomes}
                  probabilities={market.probabilities}
                />

                <BuySharesForm market={market} />

                {positions && positions.length > 0 && (
                  <PositionsList market={market} positions={positions} />
                )}

                <MarketInfo market={market} />
              </Flex>
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
