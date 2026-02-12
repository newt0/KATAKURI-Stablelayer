import { COIN_DECIMALS } from './config'

export function formatCoinAmount(
  amount: number | string | bigint,
  decimals: number = COIN_DECIMALS,
): string {
  const value = Number(amount) / 10 ** decimals
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (value >= 1) return value.toFixed(4)
  if (value > 0) return value.toFixed(6)
  return '0'
}

export function toCoinUnits(
  humanAmount: number,
  decimals: number = COIN_DECIMALS,
): bigint {
  return BigInt(Math.floor(humanAmount * 10 ** decimals))
}

export function formatProbability(p: number): string {
  return `${(p * 100).toFixed(1)}%`
}

export function shortenAddress(addr: string): string {
  if (addr.length <= 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
