require('dotenv').config();
require('dotenv').config();
const bs58 = require('bs58'); // Ensure this is imported correctly
const { Keypair, PublicKey, Connection } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

// Load the private key from .env
const privateKeyBase58 = process.env.wk; // Base58-encoded private key
// console.log(`privateKeyBase58: ${privateKeyBase58}`);
if (!privateKeyBase58) {
    throw new Error('Private key not found in .env');
}

try {
    // Decode the Base58 private key into Uint8Array
    const secretKey = bs58.decode(privateKeyBase58);

    // Validate the key length
    if (secretKey.length !== 64) {
        throw new Error(`Invalid private key length: expected 64 bytes, got ${secretKey.length}`);
    }

    // Create a Keypair from the decoded private key
    const centralWallet = Keypair.fromSecretKey(secretKey);

} catch (error) {
    console.error('Error decoding private key:', error.message);
}
// Helper function to calculate token distribution
function calculateTokenDistribution(totalTokens, hostShare) {
    return (totalTokens * (hostShare / 100));
}

// Function to mint and distribute tokens
async function mintAndDistributeTokens(connection, roomInfo) {
    try {
        // Step 1: Create SPL token mint
        const mint = await Token.createMint(
            connection,
            centralWallet,                     // Payer
            centralWallet.publicKey,           // Mint authority
            null,                              // Freeze authority (optional, null if not used)
            9,                                 // Decimals
            TOKEN_PROGRAM_ID
        );

        console.log(`Mint Address: ${mint.publicKey.toString()}`);

        const totalTokens = 10_000_000_000; // 10B tokens

        // Step 2: Distribute tokens to hosts
        for (let host of roomInfo.hosts) {
            const recipientWallet = new PublicKey(host.walletAddress);
            const tokenAccount = await mint.getOrCreateAssociatedAccountInfo(recipientWallet);

            // Calculate tokens to distribute
            const tokensToDistribute = calculateTokenDistribution(totalTokens, host.share);

            // Mint tokens to recipient's token account
            await mint.mintTo(
                tokenAccount.address,
                centralWallet.publicKey,        // Mint authority
                [],                             // Signers
                Math.floor(tokensToDistribute)  // Tokens to mint
            );

            console.log(`Minted ${tokensToDistribute} tokens to ${recipientWallet.toString()}`);
        }

        // Step 3: Renounce mint authority
        await mint.setAuthority(
            mint.publicKey,
            null,                            // Set authority to null
            'MintTokens',                    // Authority type
            centralWallet.publicKey,         // Current authority
            []                               // Signers
        );

        console.log('Mint authority renounced.');

        return mint.publicKey.toString();
    } catch (error) {
        console.error('Error minting and distributing tokens:', error);
        throw error;
    }
}

// Export the functions
module.exports = {
    mintAndDistributeTokens,
    calculateTokenDistribution,
};