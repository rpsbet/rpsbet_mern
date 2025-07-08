// helper/util/blockchainUtils.js - Solana blockchain utilities
const { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Helper function to check wallet balance
async function checkWalletBalance(walletAddress) {
  try {
    log('🔗 Connecting to Solana to check balance...');
    const connection = new Connection(process.env.PROVIDER_URL, 'confirmed');
    const publicKey = new PublicKey(walletAddress);

    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    log('Wallet balance check:', {
      address: walletAddress,
      lamports: balance,
      sol: solBalance
    });

    return solBalance;
  } catch (error) {
    console.error('Error checking wallet balance:', error);
    throw new Error(`Failed to check wallet balance: ${error.message}`);
  }
}

// Helper function for automated deposits
async function handleAutomatedDeposit({ privateKey, amount, fromAddress, roomName }) {
  console.log('💰 HANDLING AUTOMATED DEPOSIT');
  console.log('Amount:', amount, 'SOL');
  console.log('From address:', fromAddress);
  console.log('Room name:', roomName);

  try {
    // Initialize connection
    console.log('🔗 Connecting to Solana network...');
    const connection = new Connection(process.env.PROVIDER_URL, 'confirmed');

    // Create keypair from private key
    console.log('🔐 Creating keypair from private key...');
    const secretKey = bs58.decode(privateKey);
    const userKeypair = Keypair.fromSecretKey(secretKey);

    // Verify the from address matches the private key
    if (userKeypair.publicKey.toString() !== fromAddress) {
      console.log('❌ Address mismatch');
      console.log('Expected:', fromAddress);
      console.log('Got:', userKeypair.publicKey.toString());
      throw new Error('Private key does not match the provided wallet address');
    }
    console.log('✅ Address verification passed');

    // Get admin wallet
    const adminWalletPubkey = new PublicKey(process.env.adminWallet);
    console.log('Admin wallet:', adminWalletPubkey.toString());

    // Create transaction
    console.log('📝 Creating transaction...');
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    console.log('Amount in lamports:', lamports);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userKeypair.publicKey,
        toPubkey: adminWalletPubkey,
        lamports,
      })
    );

    // Get latest blockhash
    console.log('🔗 Getting latest blockhash...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userKeypair.publicKey;

    // Send transaction
    console.log('📤 Sending transaction...');
    const signature = await connection.sendTransaction(transaction, [userKeypair]);
    console.log('Transaction signature:', signature);

    // Confirm transaction
    console.log('⏳ Confirming transaction...');
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');

    if (confirmation.value.err) {
      console.log('❌ Transaction failed on blockchain:', confirmation.value.err);
      throw new Error('Transaction failed on blockchain');
    }

    console.log('✅ Transaction confirmed successfully');
    const result = {
      success: true,
      txHash: signature,
      amount,
      explorerUrl: `https://explorer.solana.com/tx/${signature}`
    };

    console.log('Deposit result:', result);
    return result;

  } catch (error) {
    log('❌ Automated deposit error:', error);
    throw new Error(`Deposit failed: ${error.message}`);
  }
}

module.exports = {
  checkWalletBalance,
  handleAutomatedDeposit
};