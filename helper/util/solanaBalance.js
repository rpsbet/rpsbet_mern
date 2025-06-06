const { Connection, PublicKey } = require('@solana/web3.js');

class SolanaBalanceChecker {
  constructor() {
    this.connection = new Connection(
      process.env.PROVIDER_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
  }

  async getSOLBalance(walletAddress) {
    try {
      if (!walletAddress) return 0;
      
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      
      // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
      return balance / 1000000000;
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      return 0;
    }
  }

  async getTokenBalance(walletAddress, tokenMintAddress) {
    try {
      if (!walletAddress || !tokenMintAddress) return 0;
      
      const walletPublicKey = new PublicKey(walletAddress);
      const mintPublicKey = new PublicKey(tokenMintAddress);
      
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        walletPublicKey,
        { mint: mintPublicKey }
      );

      if (tokenAccounts.value.length === 0) return 0;

      const accountInfo = await this.connection.getTokenAccountBalance(
        tokenAccounts.value[0].pubkey
      );

      return parseFloat(accountInfo.value.uiAmount || 0);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  }
}

module.exports = new SolanaBalanceChecker();