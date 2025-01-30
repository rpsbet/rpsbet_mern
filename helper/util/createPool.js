const {
  MARKET_STATE_LAYOUT_V3,
  AMM_V4,
  OPEN_BOOK_PROGRAM,
  FEE_DESTINATION_ID,
  DEVNET_PROGRAM_ID,
} = require('@raydium-io/raydium-sdk-v2');
const { initSdk, txVersion } = require('./config');
const { PublicKey } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const BN = require('bn.js');

const createAmmPool = async ({ id }) => {
  const raydium = await initSdk();
  const marketId = new PublicKey(id);

  // Get market info
  const marketBufferInfo = await raydium.connection.getAccountInfo(marketId);
  if (!marketBufferInfo) {
    throw new Error('Market info not found');
  }

  const { baseMint, quoteMint } = MARKET_STATE_LAYOUT_V3.decode(
    marketBufferInfo.data,
  );

  // Fetch mint info
  const baseMintInfo = await raydium.token.getTokenInfo(baseMint);
  const quoteMintInfo = await raydium.token.getTokenInfo(quoteMint);
  const baseAmount = new BN(1000);
  const quoteAmount = new BN(1000);

  if (
    baseMintInfo.programId !== TOKEN_PROGRAM_ID.toBase58() ||
    quoteMintInfo.programId !== TOKEN_PROGRAM_ID.toBase58()
  ) {
    throw new Error(
      'AMM pools with OpenBook market only support TOKEN_PROGRAM_ID mints. Use CPMM pool for token-2022.',
    );
  }

  if (
    baseAmount
      .mul(quoteAmount)
      .lte(new BN(1).mul(new BN(10 ** baseMintInfo.decimals)).pow(new BN(2)))
  ) {
    throw new Error(
      'Initial liquidity too low. Try adding more baseAmount/quoteAmount.',
    );
  }

  const { execute, extInfo } = await raydium.liquidity.createPoolV4({
    programId: AMM_V4,
    marketInfo: {
      marketId,
      programId: OPEN_BOOK_PROGRAM,
    },
    baseMintInfo: {
      mint: baseMint,
      decimals: baseMintInfo.decimals,
    },
    quoteMintInfo: {
      mint: quoteMint,
      decimals: quoteMintInfo.decimals,
    },
    baseAmount,
    quoteAmount,
    startTime: new BN(0),
    ownerInfo: {
      useSOLBalance: true,
    },
    associatedOnly: false,
    txVersion,
    feeDestinationId: FEE_DESTINATION_ID,
  });

  // Execute transaction
  const { txId } = await execute({ sendAndConfirm: true });
  console.log(
    'AMM pool created! txId:',
    txId,
    ', poolKeys:',
    Object.keys(extInfo.address).reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: extInfo.address[cur].toBase58(),
      }),
      {},
    ),
  );
};

module.exports = { createAmmPool };
