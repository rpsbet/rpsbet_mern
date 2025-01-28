const assert = require('assert');
const {
  CurrencyAmount,
  jsonInfo2PoolKeys,
  Liquidity,
  Percent,
  Token,
  TokenAmount,
} = require('@raydium-io/raydium-sdk');
const { Keypair } = require('@solana/web3.js');
const Decimal = require('decimal.js');
const {
  connection,
  DEFAULT_TOKEN,
  makeTxVersion,
  wallet,
} = require('./config');
const { formatAmmKeysById } = require('./formatAmmKeysById');
const { buildAndSendTx, getWalletTokenAccount } = require('./util');

async function ammAddLiquidity(input) {
  const targetPoolInfo = await formatAmmKeysById(input.targetPool);
  assert(targetPoolInfo, 'cannot find the target pool');

  // -------- step 1: compute another amount --------
  const poolKeys = jsonInfo2PoolKeys(targetPoolInfo);
  const extraPoolInfo = await Liquidity.fetchInfo({ connection, poolKeys });
  const { maxAnotherAmount, anotherAmount, liquidity } =
    Liquidity.computeAnotherAmount({
      poolKeys,
      poolInfo: { ...targetPoolInfo, ...extraPoolInfo },
      amount: input.inputTokenAmount,
      anotherCurrency: input.quoteToken,
      slippage: input.slippage,
    });

  console.log('will add liquidity info', {
    liquidity: liquidity.toString(),
    liquidityD: new Decimal(liquidity.toString()).div(
      10 ** extraPoolInfo.lpDecimals,
    ),
  });

  // -------- step 2: make instructions --------
  const addLiquidityInstructionResponse =
    await Liquidity.makeAddLiquidityInstructionSimple({
      connection,
      poolKeys,
      userKeys: {
        owner: input.wallet.publicKey,
        payer: input.wallet.publicKey,
        tokenAccounts: input.walletTokenAccounts,
      },
      amountInA: input.inputTokenAmount,
      amountInB: maxAnotherAmount,
      fixedSide: 'a',
      makeTxVersion,
    });

  return {
    txids: await buildAndSendTx(
      addLiquidityInstructionResponse.innerTransactions,
    ),
    anotherAmount,
  };
}

module.exports = { ammAddLiquidity };
