const {
  ApiPoolInfoV4,
  LIQUIDITY_STATE_LAYOUT_V4,
  Liquidity,
  MARKET_STATE_LAYOUT_V3,
  Market,
  SPL_MINT_LAYOUT,
} = require('@raydium-io/raydium-sdk');
const { PublicKey } = require('@solana/web3.js');

const { connection } = require('./config');

async function formatAmmKeysById(id) {
  console.log('--formatAmmKeysById---', new PublicKey(id));
  const balance = await connection.getBalance(id);
  console.log(`AMM Account Balance: ${balance}`);
  const account = await connection.getAccountInfo(new PublicKey(id));
  if (account === null) throw new Error('Get id info error');
  const info = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);
  console.log('----account---');
  const marketId = info.marketId;
  const marketAccount = await connection.getAccountInfo(marketId);
  if (marketAccount === null) throw new Error('Get market info error');
  const marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data);

  const lpMint = info.lpMint;
  const lpMintAccount = await connection.getAccountInfo(lpMint);
  if (lpMintAccount === null) throw new Error('Get LP mint info error');
  const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data);
  console.log('----formatAmmKeysById---');
  return {
    id,
    baseMint: info.baseMint.toString(),
    quoteMint: info.quoteMint.toString(),
    lpMint: info.lpMint.toString(),
    baseDecimals: info.baseDecimal.toNumber(),
    quoteDecimals: info.quoteDecimal.toNumber(),
    lpDecimals: lpMintInfo.decimals,
    version: 4,
    programId: account.owner.toString(),
    authority: Liquidity.getAssociatedAuthority({
      programId: account.owner,
    }).publicKey.toString(),
    openOrders: info.openOrders.toString(),
    targetOrders: info.targetOrders.toString(),
    baseVault: info.baseVault.toString(),
    quoteVault: info.quoteVault.toString(),
    withdrawQueue: info.withdrawQueue.toString(),
    lpVault: info.lpVault.toString(),
    marketVersion: 3,
    marketProgramId: info.marketProgramId.toString(),
    marketId: info.marketId.toString(),
    marketAuthority: Market.getAssociatedAuthority({
      programId: info.marketProgramId,
      marketId: info.marketId,
    }).publicKey.toString(),
    marketBaseVault: marketInfo.baseVault.toString(),
    marketQuoteVault: marketInfo.quoteVault.toString(),
    marketBids: marketInfo.bids.toString(),
    marketAsks: marketInfo.asks.toString(),
    marketEventQueue: marketInfo.eventQueue.toString(),
    lookupTableAccount: PublicKey.default.toString(),
  };
}

module.exports = { formatAmmKeysById };
