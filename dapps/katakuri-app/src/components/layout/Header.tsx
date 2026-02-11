import { ConnectButton } from '@mysten/dapp-kit'
import { Link } from '@radix-ui/themes'
import NetworkType from '@suiware/kit/NetworkType'
import { useNavigate } from 'react-router'

const Header = () => {
  const navigate = useNavigate()
  return (
    <header className="supports-backdrop-blur:bg-white/60 dark:border-slate-50/1 sticky top-0 z-40 flex w-full flex-row flex-wrap items-center justify-center gap-4 bg-white/95 px-3 py-3 backdrop-blur transition-colors duration-500 sm:justify-between sm:gap-3 lg:z-50 lg:border-b lg:border-slate-900/10 dark:bg-transparent">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sds-dark outline-none hover:no-underline dark:text-sds-light"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
          }}
        >
          <div className="text-xl font-bold sm:text-2xl">KATAKURI</div>
        </Link>
        <nav className="flex gap-3">
          <Link
            href="/"
            className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            onClick={(e) => {
              e.preventDefault()
              navigate('/')
            }}
          >
            Markets
          </Link>
          <Link
            href="/admin"
            className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            onClick={(e) => {
              e.preventDefault()
              navigate('/admin')
            }}
          >
            Admin
          </Link>
        </nav>
      </div>

      <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
        <div className="flex flex-row items-center justify-center gap-3">
          <NetworkType />
        </div>
        <div className="sds-connect-button-container">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
export default Header
