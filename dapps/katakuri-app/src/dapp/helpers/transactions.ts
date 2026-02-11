import { Transaction } from '@mysten/sui/transactions'
import { bcs } from '@mysten/sui/bcs'
import {
  KATAKURI_PACKAGE_ID,
  MARKET_MODULE,
  COIN_TYPE,
} from '../config'

/** Create a new prediction market */
export function buildCreateMarketTx(
  question: string,
  outcomes: string[],
  fundAmount: bigint,
  feeBps: number,
): Transaction {
  const tx = new Transaction()
  const [fundCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(fundAmount)])
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'create_market',
    typeArguments: [COIN_TYPE],
    arguments: [
      tx.pure(bcs.string().serialize(question).toBytes()),
      tx.pure(
        bcs.vector(bcs.string()).serialize(outcomes).toBytes(),
      ),
      fundCoin,
      tx.pure.u64(feeBps),
    ],
  })
  return tx
}

/** Buy shares on an outcome */
export function buildBuyTx(
  marketId: string,
  outcomeIndex: number,
  amount: bigint,
  minSharesOut: number,
): Transaction {
  const tx = new Transaction()
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'buy',
    typeArguments: [COIN_TYPE],
    arguments: [
      tx.object(marketId),
      tx.pure.u64(outcomeIndex),
      coin,
      tx.pure.u64(minSharesOut),
    ],
  })
  return tx
}

/** Sell a position */
export function buildSellTx(
  marketId: string,
  positionId: string,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'sell',
    typeArguments: [COIN_TYPE],
    arguments: [tx.object(marketId), tx.object(positionId)],
  })
  return tx
}

/** Redeem a winning position */
export function buildRedeemTx(
  marketId: string,
  positionId: string,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'redeem',
    typeArguments: [COIN_TYPE],
    arguments: [tx.object(marketId), tx.object(positionId)],
  })
  return tx
}

/** Resolve a market (admin only) */
export function buildResolveTx(
  adminCapId: string,
  marketId: string,
  winnerIndex: number,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'resolve',
    typeArguments: [COIN_TYPE],
    arguments: [
      tx.object(adminCapId),
      tx.object(marketId),
      tx.pure.u64(winnerIndex),
    ],
  })
  return tx
}

/** Claim accumulated fees (admin only) */
export function buildClaimFeesTx(
  adminCapId: string,
  marketId: string,
): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    package: KATAKURI_PACKAGE_ID,
    module: MARKET_MODULE,
    function: 'claim_fees',
    typeArguments: [COIN_TYPE],
    arguments: [tx.object(adminCapId), tx.object(marketId)],
  })
  return tx
}
