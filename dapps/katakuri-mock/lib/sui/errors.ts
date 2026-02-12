/** Move error codes from the contract */
const ERROR_CODES: Record<number, string> = {
  1: 'Market already resolved',
  2: 'Market not yet resolved',
  4: 'Insufficient payment or slippage exceeded',
  5: 'Fewer than 2 outcomes required',
  6: 'Invalid outcome index',
  7: 'Invalid position - belongs to different market',
  8: 'Insufficient initial liquidity',
}

/** Parse Move error from transaction error */
export function parseMoveError(error: Error): string {
  const message = error.message || String(error)

  // Try to extract error code from Move abort
  const abortMatch = message.match(/abort (\d+)/)
  if (abortMatch) {
    const code = parseInt(abortMatch[1])
    return ERROR_CODES[code] || `Contract error (code ${code})`
  }

  // Return original message if no specific error found
  return message
}
