import { FC } from 'react'
import { Flex, Text } from '@radix-ui/themes'
import { useCurrentAccount } from '@mysten/dapp-kit'
import Layout from '~~/components/layout/Layout'
import CustomConnectButton from '~~/components/CustomConnectButton'
import NetworkSupportChecker from '~~/components/NetworkSupportChecker'
import useMarketEvents from '../hooks/useMarketEvents'
import MarketCard from '../components/MarketCard'

const MarketsPage: FC = () => {
  const currentAccount = useCurrentAccount()
  const { data: markets, isLoading } = useMarketEvents()

  return (
    <Layout>
      <NetworkSupportChecker />
      <div className="flex flex-grow flex-col items-center p-3">
        {!currentAccount ? (
          <CustomConnectButton />
        ) : (
          <div className="w-full max-w-lg space-y-4">
            <Text size="5" weight="bold" className="block text-center">
              Prediction Markets
            </Text>

            {isLoading && (
              <Text size="2" color="gray" className="block text-center">
                Loading markets...
              </Text>
            )}

            {markets && markets.length === 0 && (
              <Text size="2" color="gray" className="block text-center">
                No markets found. Create one from the Admin page.
              </Text>
            )}

            <Flex direction="column" gap="3">
              {markets?.map((m) => (
                <MarketCard
                  key={m.marketId}
                  marketId={m.marketId}
                  question={m.question}
                />
              ))}
            </Flex>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default MarketsPage
