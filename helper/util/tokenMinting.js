require('dotenv').config();
const bs58 = require('bs58');
const {
    Keypair,
    PublicKey,
    Connection,
    Transaction,
    clusterApiUrl,
    sendAndConfirmTransaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
} = require('@solana/web3.js');
const {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    setAuthority,
    TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const {
    createCreateMetadataAccountInstruction,
    createCreateMetadataAccountV3Instruction,
} = require('@metaplex-foundation/mpl-token-metadata');

// Constants
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const RAYDIUM_LIQUIDITY_PROGRAM_ID = new PublicKey('5quB68hAApBoN19riHUePvAca2WyKMaaR2B6sFdq5aFc'); // Replace with actual program ID

// Decode Base58 private key
const privateKeyBase58 = process.env.wk?.trim();
if (!privateKeyBase58 || !/^[A-Za-z1-9]+$/.test(privateKeyBase58)) {
    throw new Error('Invalid private key: ensure it is Base58 encoded and correctly set in .env');
}

let centralWallet;
try {
    const secretKey = bs58.decode(privateKeyBase58);
    if (secretKey.length !== 64) {
        throw new Error(`Invalid private key length: expected 64 bytes, got ${secretKey.length}`);
    }
    centralWallet = Keypair.fromSecretKey(secretKey);
    console.log(`Central Wallet Public Key: ${centralWallet.publicKey.toString()}`);
} catch (err) {
    console.error('Error decoding private key:', err.message);
    throw err;
}

// Helper function to calculate token distribution
function calculateTokenDistribution(totalTokens, hostShare) {
    return totalTokens * (hostShare / 100);
}

// Helper function to send transactions with retries
async function sendTransactionWithRetry(connection, transaction, signers, maxRetries = 5) {
    let retries = maxRetries;
    while (retries > 0) {
        try {
            const signature = await sendAndConfirmTransaction(connection, transaction, signers, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
            });
            console.log(`Transaction confirmed: ${signature}`);
            return signature;
        } catch (err) {
            console.warn(`Transaction failed, retries left: ${retries - 1}`);
            retries--;
            if (retries === 0) {
                throw new Error(`Transaction failed after ${maxRetries} retries: ${err.message}`);
            }
        }
    }
}

// Function to create a new Raydium pool
async function createRaydiumPool(connection, mint, centralWallet) {
    console.log('Creating new Raydium pool...');
    // Placeholder: Use Raydium SDK or program instructions for creating a pool
    // Replace this with actual implementation from Raydium documentation
    const poolAccount = Keypair.generate();

    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: centralWallet.publicKey,
            newAccountPubkey: poolAccount.publicKey,
            lamports: await connection.getMinimumBalanceForRentExemption(0), // Replace with actual rent-exempt size
            space: 0, // Replace with the required space for the pool account
            programId: RAYDIUM_LIQUIDITY_PROGRAM_ID,
        })
    );

    await sendTransactionWithRetry(connection, transaction, [centralWallet, poolAccount]);
    console.log(`New pool created: ${poolAccount.publicKey.toString()}`);
    return poolAccount.publicKey;
}

// Function to add liquidity to Raydium
async function addLiquidityToRaydium(connection, mint, remainingTokens, liquiditySolAmount, poolId) {
    console.log('Adding liquidity to Raydium...');
    // Placeholder: Use Raydium SDK or instructions for adding liquidity
    const transaction = new Transaction();

    transaction.add({
        keys: [
            { pubkey: centralWallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: true },
            { pubkey: poolId, isSigner: false, isWritable: true },
        ],
        programId: RAYDIUM_LIQUIDITY_PROGRAM_ID,
        data: Buffer.from([
            ...Buffer.from("ADD_LIQUIDITY"), // Placeholder, replace with actual data
            ...Buffer.alloc(remainingTokens.toString().length, remainingTokens), // Token amount
            ...Buffer.alloc(liquiditySolAmount.toString().length, liquiditySolAmount), // SOL amount
        ]),
    });

    await sendTransactionWithRetry(connection, transaction, [centralWallet]);
    console.log('Liquidity successfully added to Raydium.');
}

// Function to mint and distribute tokens
async function mintAndDistributeTokens(connection, roomInfo) {
    try {
        console.log(`Wallet Balance: ${(await connection.getBalance(centralWallet.publicKey)) / LAMPORTS_PER_SOL} SOL`);
        console.log(`Central Wallet Public Key: ${centralWallet.publicKey.toString()}`);

console.log("roomInfo.name", roomInfo.name)
        if (!roomInfo.name || typeof roomInfo.name !== 'string' || roomInfo.name.trim().length === 0) {
            throw new Error(`Invalid roomInfo.name: ${roomInfo.name}`);
        }
        if (!roomInfo.ticker || typeof roomInfo.ticker !== 'string' || roomInfo.ticker.trim().length === 0) {
            throw new Error(`Invalid roomInfo.ticker: ${roomInfo.ticker}`);
        }
        if (!roomInfo.image || typeof roomInfo.image !== 'string' || !roomInfo.image.startsWith('http')) {
            throw new Error(`Invalid roomInfo.image: ${roomInfo.image}`);
        }

        const formattedName = roomInfo.name.trim();
        const formattedTicker = roomInfo.ticker.trim().toUpperCase();
        const formattedImage = roomInfo.image;

        console.log('Validated Metadata Fields:');
        console.log(`Name: ${formattedName}`);
        console.log(`Ticker: ${formattedTicker}`);
        console.log(`Image URI: ${formattedImage}`);

        // Step 1: Create SPL token mint
        console.log('Attempting to create SPL token mint...');
        const mint = await createMint(connection, centralWallet, centralWallet.publicKey, null, 9);
        console.log(`Mint Address: ${mint.toString()}`);

        const totalTokens = 10_000_000_000; // 10B tokens
        let distributedTokens = 0;

        // Step 2: Prepare and log metadata PDA
        console.log('Preparing metadata...');
        const metadataPDA = await PublicKey.findProgramAddress(
            [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
            METADATA_PROGRAM_ID
        );

        console.log(`Metadata PDA: ${metadataPDA[0].toString()}`);

        const metadataTx = new Transaction().add(
            createCreateMetadataAccountV3Instruction(
                {
                    metadata: metadataPDA[0],
                    mint,
                    mintAuthority: centralWallet.publicKey,
                    payer: centralWallet.publicKey,
                    updateAuthority: centralWallet.publicKey,
                },
                {
                    createMetadataAccountArgsV3: {
                        data: {
                            name: formattedName,
                            symbol: formattedTicker,
                            uri: formattedImage,
                            sellerFeeBasisPoints: 0,
                            creators: null,
                        },
                        isMutable: true,
                    },
                }
            )
        );

        console.log('Sending transaction for metadata creation...');
        await sendTransactionWithRetry(connection, metadataTx, [centralWallet]);

        // Step 3: Distribute tokens to hosts
        console.log('Distributing tokens...');
        for (let host of roomInfo.hosts) {
            const recipientWallet = new PublicKey(host.walletAddress);
            const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, centralWallet, mint, recipientWallet);
            const tokensToDistribute = calculateTokenDistribution(totalTokens, host.share);

            const mintTx = new Transaction().add(
                mintTo(
                    connection,
                    centralWallet,
                    mint,
                    tokenAccount.address,
                    centralWallet.publicKey,
                    Math.floor(tokensToDistribute)
                )
            );

            await sendTransactionWithRetry(connection, mintTx, [centralWallet]);
            distributedTokens += tokensToDistribute;
        }

        // Step 4: Add remaining tokens to liquidity pool
        const remainingTokens = totalTokens - distributedTokens;
        const liquiditySolAmount = parseFloat(roomInfo.user_bet);

        const poolId = await createRaydiumPool(connection, mint, centralWallet);
        await addLiquidityToRaydium(connection, mint, remainingTokens, liquiditySolAmount, poolId);

        // Step 5: Renounce mint authority
        console.log('Renouncing mint authority...');
        await setAuthority(connection, centralWallet, mint, centralWallet.publicKey, null, 'MintTokens');
        console.log('Mint authority renounced.');

        return mint.toString();
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