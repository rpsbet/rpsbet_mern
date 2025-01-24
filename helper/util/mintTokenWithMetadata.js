require("dotenv").config();
const bs58 = require("bs58");
const { createUmi } = require("@metaplex-foundation/umi-bundle-defaults");
const {
    createMetadataAccountV3,
    findMetadataPda,
} = require("@metaplex-foundation/mpl-token-metadata");
const {
    Keypair,
    SystemProgram,
    Transaction,
    Connection,
    LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const {
    createInitializeMintInstruction,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const { generateSigner, signerIdentity } = require("@metaplex-foundation/umi");

// Decode Base58 private key
const privateKeyBase58 = process.env.wk?.trim();
if (!privateKeyBase58 || !/^[A-Za-z1-9]+$/.test(privateKeyBase58)) {
    throw new Error("Invalid private key: ensure it is Base58 encoded and correctly set in .env");
}

let keypair;
try {
    const secretKey = bs58.decode(privateKeyBase58);
    keypair = Keypair.fromSecretKey(secretKey); // Use Web3.js Keypair
    console.log(`Central Wallet Public Key: ${keypair.publicKey.toBase58()}`);
} catch (err) {
    console.error("Error decoding private key:", err.message);
    throw err;
}

// Create a UMI connection (to devnet)
const umi = createUmi("https://api.devnet.solana.com");
const signer = generateSigner(umi, keypair.secretKey); // Use keypair's secret key
umi.use(signerIdentity(signer));

// Connection to Solana network for balance checking
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function logAndFundAccount(publicKey, description, requiredBalance = 0.01) {
    const balance = await connection.getBalance(publicKey);
    console.log(`${description} Balance for ${publicKey.toBase58()}: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance < requiredBalance * LAMPORTS_PER_SOL) {
        console.log(`${description} is underfunded. Requesting airdrop...`);
        const signature = await connection.requestAirdrop(publicKey, requiredBalance * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature, "confirmed");
        console.log(`${description} funded via airdrop. New balance: ${(await connection.getBalance(publicKey)) / LAMPORTS_PER_SOL} SOL`);
    }
}

async function createAndInitializeMint(umi, mint, payer) {
    const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    const createAccountIx = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
    });

    const initializeMintIx = createInitializeMintInstruction(
        mint.publicKey,
        9, // Decimals (9 is standard for SPL tokens)
        payer.publicKey,
        null, // Freeze authority (optional, set to null)
        TOKEN_PROGRAM_ID
    );

    const tx = new Transaction().add(createAccountIx, initializeMintIx);
    const signature = await connection.sendTransaction(tx, [payer, mint], {
        skipPreflight: false,
        preflightCommitment: "confirmed",
    });
    await connection.confirmTransaction(signature, "confirmed");

    console.log("Mint Account Created and Initialized:", signature);
}

async function createAssociatedTokenAccount(payer, mint, owner) {
    const ata = await getAssociatedTokenAddress(mint, owner, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    const instruction = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ata,
        owner,
        mint
    );

    const tx = new Transaction().add(instruction);
    const signature = await connection.sendTransaction(tx, [payer], { skipPreflight: false, preflightCommitment: "confirmed" });
    await connection.confirmTransaction(signature, "confirmed");

    console.log("Associated Token Account Created:", signature);
    return ata;
}

async function mintTokenWithMetadata(roomInfo) {
    try {
        if (!roomInfo.name || !roomInfo.ticker || !roomInfo.image) {
            throw new Error("Invalid room information. Ensure name, ticker, and image are provided.");
        }

        const rentExemption = await connection.getMinimumBalanceForRentExemption(1024);
        await logAndFundAccount(keypair.publicKey, "Central Wallet", rentExemption * 3);

        // Generate new mint keypair
        const mint = Keypair.generate();
        console.log(`Mint Address: ${mint.publicKey.toBase58()}`);

        // Create and initialize mint
        await createAndInitializeMint(umi, mint, keypair);

        // Create associated token account
        const ata = await createAssociatedTokenAccount(keypair, mint.publicKey, keypair.publicKey);

        // Create metadata account
        const metadataPda = findMetadataPda(umi, { mint: mint.publicKey });
        console.log(`Metadata PDA: ${metadataPda}`);

        await createMetadataAccountV3(umi, {
            metadata: metadataPda,
            mint: mint.publicKey,
            mintAuthority: signer.publicKey,
            updateAuthority: signer.publicKey,
            payer: signer.publicKey,
            data: {
                name: roomInfo.name,
                symbol: roomInfo.ticker,
                uri: roomInfo.image,
                sellerFeeBasisPoints: 0,
                creators: null,
                collection: null,
                uses: null,
            },
            isMutable: true,
        });

        console.log("Token minting and metadata creation completed successfully.");
        return mint.publicKey.toBase58();
    } catch (error) {
        console.error("Error during token minting and metadata creation:", error);
        throw error;
    }
}

module.exports = { mintTokenWithMetadata };