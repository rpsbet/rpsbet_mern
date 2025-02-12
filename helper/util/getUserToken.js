const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { getAccount, getAssociatedTokenAddress } = require('@solana/spl-token');

async function getUserTokens(connectedWallets) {
  const connection = new Connection(clusterApiUrl('mainnet-beta'));
  const tokenAddress = process.env.token?.trim();
  const mintPublicKey = new PublicKey(tokenAddress);

  for (const connectedAccount of connectedWallets) {
    try {
      const userPublicKey = new PublicKey(connectedAccount);

      const userATA = await getAssociatedTokenAddress(
        mintPublicKey,
        userPublicKey,
      );

      const accountInfo = await getAccount(connection, userATA);

      const decimals = 6;
      const userBalance = Number(accountInfo.amount) / Math.pow(10, decimals);

      if (userBalance > 2_500_000) {
        return true;
      }
    } catch (error) {
      console.error(
        `Failed to get balance for wallet: ${connectedAccount}`,
        error,
      );
    }
  }

  return false;
}

module.exports = getUserTokens;
