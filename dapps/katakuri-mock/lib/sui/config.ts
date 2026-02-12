export const KATAKURI_PACKAGE_ID =
  process.env.NEXT_PUBLIC_CONTRACT_PACKAGE_ID || '0x0'

export const MARKET_MODULE = 'market'

// Using SUI for testnet demo; swap to katakuriUSD type for production
export const COIN_TYPE = '0x2::sui::SUI'
export const COIN_DECIMALS = 9
export const COIN_SYMBOL = 'SUI'

export const MARKET_TYPE = `${KATAKURI_PACKAGE_ID}::market::Market<${COIN_TYPE}>`
export const POSITION_TYPE = `${KATAKURI_PACKAGE_ID}::market::Position`
export const ADMIN_CAP_TYPE = `${KATAKURI_PACKAGE_ID}::market::AdminCap`

export const MARKET_CREATED_EVENT = `${KATAKURI_PACKAGE_ID}::market::MarketCreated`
export const SHARES_BOUGHT_EVENT = `${KATAKURI_PACKAGE_ID}::market::SharesBought`
export const SHARES_SOLD_EVENT = `${KATAKURI_PACKAGE_ID}::market::SharesSold`
export const MARKET_RESOLVED_EVENT = `${KATAKURI_PACKAGE_ID}::market::MarketResolved`
export const POSITION_REDEEMED_EVENT = `${KATAKURI_PACKAGE_ID}::market::PositionRedeemed`

// Q64 constant for converting fixed-point probabilities
export const Q64 = 2n ** 64n
