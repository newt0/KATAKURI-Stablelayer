import { FC } from 'react'
import { Flex, Text } from '@radix-ui/themes'
import { useCurrentAccount } from '@mysten/dapp-kit'
import Layout from '~~/components/layout/Layout'
import CustomConnectButton from '~~/components/CustomConnectButton'
import NetworkSupportChecker from '~~/components/NetworkSupportChecker'
import CreateMarketForm from '../components/CreateMarketForm'
import ResolveMarketForm from '../components/ResolveMarketForm'

const AdminPage: FC = () => {
  const currentAccount = useCurrentAccount()

  return (
    <Layout>
      <NetworkSupportChecker />
      <div className="flex flex-grow flex-col items-center p-3">
        {!currentAccount ? (
          <CustomConnectButton />
        ) : (
          <div className="w-full max-w-lg space-y-4">
            <Text size="5" weight="bold" className="block text-center">
              Admin Panel
            </Text>

            <Flex direction="column" gap="4">
              <CreateMarketForm />
              <ResolveMarketForm />
            </Flex>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AdminPage
