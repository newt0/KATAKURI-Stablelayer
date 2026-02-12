/**
 * Yield simulation for Stablelayer Saving Pool mock.
 * 5% APR annualized, converted to per-second growth.
 */

const APR = 0.05
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60

// Rate per second
export const YIELD_RATE_PER_SECOND = APR / SECONDS_PER_YEAR

// How many seconds each tick simulates (accelerated for demo)
export const TICK_INTERVAL_MS = 5000
export const SIMULATED_SECONDS_PER_TICK = 3600 // 1 hour per tick for visible yield

export function calculateYield(katakuriUsdBalance: number): number {
  return katakuriUsdBalance * YIELD_RATE_PER_SECOND * SIMULATED_SECONDS_PER_TICK
}
