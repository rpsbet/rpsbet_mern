const {
  RAYMint,
  USDCMint,
  OPEN_BOOK_PROGRAM,
  DEVNET_PROGRAM_ID,
  WSOLMint,
} = require('@raydium-io/raydium-sdk-v2');
const { initSdk, txVersion, checkSolBalance } = require('./config');

const createMarket = async (realBasePublicKey, wsolMintPk) => {
  try {
    const raydium = await initSdk();

    // check mint info here: https://api-v3.raydium.io/mint/list
    // or get mint info by api: await raydium.token.getTokenInfo('mint address')
    await checkSolBalance();

    const { execute, extInfo, transactions } = await raydium.marketV2.create({
      baseInfo: {
        // create market doesn't support token 2022
        mint: realBasePublicKey,
        decimals: 9,
      },
      quoteInfo: {
        // create market doesn't support token 2022
        mint: wsolMintPk,
        decimals: 9,
      },
      lotSize: 1,
      tickSize: 0.01,
      dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
      // dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET, // devnet

      txVersion,
      // optional: set up priority fee here
      // computeBudgetConfig: {
      //   units: 600000,
      //   microLamports: 46591500,
      // },
    });

    console.log(
      `Create market total ${transactions.length} txs, market info:`,
      Object.keys(extInfo.address).reduce((acc, cur) => {
        acc[cur] = extInfo.address[cur].toBase58();
        return acc;
      }, {}),
    );

    const txIds = await execute({
      // set sequentially to true means tx will be sent when previous one confirmed
      sequentially: true,
    });

    console.log(
      'Note: Create market does not support token 2022. If you need more detailed error info, set txVersion to TxVersion.LEGACY',
    );
    console.log('Create market txIds:', txIds);
  } catch (error) {
    console.error('Error creating market:', error);
  } finally {
    process.exit();
  }
};

module.exports = { createMarket };
