import '@mysten/dapp-kit/dist/index.css'
import '@radix-ui/themes/styles.css'
import '@suiware/kit/main.css'
import SuiProvider from '@suiware/kit/SuiProvider'
import { FC, StrictMode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { getThemeSettings } from '~~/helpers/theme'
import useNetworkConfig from '~~/hooks/useNetworkConfig'
import MarketsPage from '~~/dapp/pages/MarketsPage'
import MarketPage from '~~/dapp/pages/MarketPage'
import AdminPage from '~~/dapp/pages/AdminPage'
import ThemeProvider from '~~/providers/ThemeProvider'
import '~~/styles/index.css'
import { ENetwork } from '~~/types/ENetwork'
import { QueryClient } from '@tanstack/react-query'

const themeSettings = getThemeSettings()

const App: FC = () => {
  const { networkConfig } = useNetworkConfig()
  const queryClient = new QueryClient()
  return (
    <StrictMode>
      <ThemeProvider>
        <SuiProvider
          customNetworkConfig={networkConfig}
          defaultNetwork={ENetwork.TESTNET}
          walletAutoConnect={true}
          walletSlushName={'KATAKURI'}
          themeSettings={themeSettings}
          customQueryClient={queryClient}
        >
          <BrowserRouter basename="/">
            <Routes>
              <Route index path="/" element={<MarketsPage />} />
              <Route path="/market/:id" element={<MarketPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </BrowserRouter>
        </SuiProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

export default App
