const { BN } = require('bn.js');
const {
  Liquidity,
  MAINNET_PROGRAM_ID,
  Token,
} = require('@raydium-io/raydium-sdk');
const { Keypair, PublicKey } = require('@solana/web3.js');
const Decimal = require('decimal.js');

const {
  connection,
  DEFAULT_TOKEN,
  makeTxVersion,
  PROGRAMIDS,
} = require('./config');

const { buildAndSendTx } = require('./util');

const ZERO = new BN(0);

async function ammCreatePool(input) {
  // -------- step 1: make instructions --------
  const balance = await connection.getBalance(input.wallet.publicKey);
  console.log('Wallet SOL balance:', balance / 1e9);
  if (balance < 2e9) {
    // e.g. at least 2 SOL just to be safe
    console.warn('Low SOL balance - might fail to create ATAs or wrap SOL');
  }

  console.log('-----programid: ', PROGRAMIDS.OPENBOOK_MARKET);
  try {
    const initPoolInstructionResponse =
      await Liquidity.makeCreatePoolV4InstructionV2Simple({
        connection,
        programId: PROGRAMIDS.AmmV4,
        marketInfo: {
          marketId: input.targetMarketId,
          programId: PROGRAMIDS.OPENBOOK_MARKET,
        },
        baseMintInfo: input.baseToken,
        quoteMintInfo: input.quoteToken,
        baseAmount: input.addBaseAmount,
        quoteAmount: input.addQuoteAmount,
        startTime: new BN(Math.floor(input.startTime)),
        ownerInfo: {
          feePayer: input.wallet.publicKey,
          wallet: input.wallet.publicKey,
          tokenAccounts: input.walletTokenAccounts,
          useSOLBalance: true,
        },
        associatedOnly: false,
        checkCreateATAOwner: true,
        makeTxVersion,
        feeDestinationId: input.wallet.publicKey, // only mainnet use this
      });
    console.log('----create pool---');
    const txids = await buildAndSendTx(
      initPoolInstructionResponse.innerTransactions,
    );
    return { txids };
  } catch (e) {
    console.log('Error during create pool:', e);
  }
}

module.exports = { ammCreatePool };
