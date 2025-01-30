const {
  ApiV3PoolInfoStandardItem,
  TokenAmount,
  toToken,
  Percent,
  AmmV4Keys,
  AmmV5Keys,
} = require('@raydium-io/raydium-sdk-v2');
const { initSdk, txVersion } = require('./config');
const { isValidAmm } = require('./utils');
const Decimal = require('decimal.js');
const BN = require('bn.js');
const { PublicKey } = require('@solana/web3.js');

const addLiquidity = async () => {
  const raydium = await initSdk();

  // RAY-USDC pool
  const poolId = '6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg';
  let poolKeys;
  let poolInfo;

  if (raydium.cluster === 'mainnet') {
    // Fetch pool info from API
    const data = await raydium.api.fetchPoolById({ ids: poolId });
    poolInfo = data[0];
  } else {
    // Fetch pool info from RPC method for devnet
    const data = await raydium.liquidity.getPoolInfoFromRpc({ poolId });
    poolInfo = data.poolInfo;
    poolKeys = data.poolKeys;
  }

  if (!isValidAmm(poolInfo.programId))
    throw new Error('Target pool is not an AMM pool');

  const inputAmount = '1';
  const r = raydium.liquidity.computePairAmount({
    poolInfo,
    amount: inputAmount,
    baseIn: true,
    slippage: new Percent(1, 100), // 1%
  });

  const { execute } = await raydium.liquidity.addLiquidity({
    poolInfo,
    poolKeys,
    amountInA: new TokenAmount(
      toToken(poolInfo.mintA),
      new Decimal(inputAmount).mul(10 ** poolInfo.mintA.decimals).toFixed(0),
    ),
    amountInB: new TokenAmount(
      toToken(poolInfo.mintB),
      new Decimal(r.maxAnotherAmount.toExact())
        .mul(10 ** poolInfo.mintB.decimals)
        .toFixed(0),
    ),
    otherAmountMin: r.minAnotherAmount,
    fixedSide: 'a',
    txVersion,
  });

  const { txId } = await execute({ sendAndConfirm: true });
  console.log('Liquidity added:', {
    txId: `https://explorer.solana.com/tx/${txId}`,
  });
};

// Uncomment the line below to execute
// addLiquidity();

module.exports = { addLiquidity };
