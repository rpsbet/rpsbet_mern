const { Keypair, Connection, clusterApiUrl } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const dotenv = require('dotenv');
const bs58 = require('bs58');

dotenv.config();

// Function to mint token with metadata
async function mintTokenWithMetadata(roomInfo) {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    
    // Decode the base58 private key to a byte array
    const decodedSecret = bs58.decode(process.env.wk);
    const payer = Keypair.fromSecretKey(new Uint8Array(decodedSecret));

    console.log(`Minting token for Room: ${roomInfo.name}, Ticker: ${roomInfo.ticker}, Image: ${roomInfo.image}`);

    // Create a new token mint
    let mint = await Token.createMint(
        connection,
        payer,
        payer.publicKey,
        null,
        9, // Decimals
        TOKEN_PROGRAM_ID
    );

    // Create a token account for the payer
    let tokenAccount = await mint.getOrCreateAssociatedAccountInfo(
        payer.publicKey
    );

    // Mint 10,000,000 tokens
    await mint.mintTo(
        tokenAccount.address,
        payer.publicKey,
        [],
        10000000 * (10 ** mint.decimals) // Account for decimals
    );

    console.log(`Minted ${10_000_000} tokens to ${tokenAccount.address.toString()}`);
}

// Exporting the function
module.exports = { mintTokenWithMetadata };