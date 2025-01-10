require('dotenv').config();
const bs58 = require('bs58');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const {
  createMetadataAccountV3,
  findMetadataPda,
} = require('@metaplex-foundation/mpl-token-metadata');
const {
  Keypair,
  SystemProgram,
  Transaction,
  Connection,
} = require('@solana/web3.js');
const {
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const { generateSigner, signerIdentity } = require('@metaplex-foundation/umi');

// Decode Base58 private key
const privateKeyBase58 = process.env.wk?.trim();
if (!privateKeyBase58 || !/^[A-Za-z1-9]+$/.test(privateKeyBase58)) {
  throw new Error(
    'Invalid private key: ensure it is Base58 encoded and correctly set in .env',
  );
}
console.log('---privatekey----', privateKeyBase58);
let keypair;
try {
  const secretKey = bs58.decode(privateKeyBase58);
  keypair = Keypair.fromSecretKey(secretKey); // Use Web3.js Keypair
  console.log(`Central Wallet Public Key: ${keypair.publicKey.toBase58()}`);
} catch (err) {
  console.error('Error decoding private key:', err.message);
  throw err;
}

// Create a UMI connection (to devnet)
const umi = createUmi('https://api.devnet.solana.com');
const signer = generateSigner(umi, keypair.secretKey); // Use keypair's secret key
umi.use(signerIdentity(signer));

// Connection to Solana network for balance checking
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function createAndInitializeMint(umi, mint, payer) {
  const lamports =
    await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

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
    TOKEN_PROGRAM_ID,
  );

  const tx = new Transaction().add(createAccountIx, initializeMintIx);
  const signature = await connection.sendTransaction(tx, [payer, mint], {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  await connection.confirmTransaction(signature, 'confirmed');

  console.log('Mint Account Created and Initialized:', signature);
}

async function createAssociatedTokenAccount(payer, mint, owner) {
  const ata = await getAssociatedTokenAddress(
    mint,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const instruction = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    ata,
    owner,
    mint,
  );

  const tx = new Transaction().add(instruction);
  const signature = await connection.sendTransaction(tx, [payer], {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  await connection.confirmTransaction(signature, 'confirmed');

  console.log('Associated Token Account Created:', signature);
  return ata;
}

async function mintTokenWithMetadata(roomInfo) {
  try {
    if (!roomInfo.name || !roomInfo.ticker || !roomInfo.image) {
      throw new Error(
        'Invalid room information. Ensure name, ticker, and image are provided.',
      );
    }

    console.log(`Minting token for room: ${roomInfo.name}`);

    // Ensure the payer is sufficiently funded
    const rentExemption =
      await connection.getMinimumBalanceForRentExemption(1024); // Rent exemption for PDA
    await ensureAccountIsFunded(
      keypair.publicKey,
      'Payer Account',
      rentExemption * 3,
    );

    // Generate a new mint keypair
    const mint = Keypair.generate();
    console.log('Mint Address:', mint.publicKey.toBase58());

    // Ensure mint account is properly created and initialized
    await createAndInitializeMint(umi, mint, keypair);

    // Create the associated token account
    const ata = await createAssociatedTokenAccount(
      keypair,
      mint.publicKey,
      keypair.publicKey,
    );

    // Derive and validate Metadata PDA
    const metadata = findMetadataPda(umi, { mint: mint.publicKey });
    console.log('Metadata PDA:', metadata[0]);

    // Ensure Metadata PDA is funded
    await ensureAccountIsFunded(
      new PublicKey(metadata[0]),
      'Metadata PDA',
      rentExemption,
    );

    // Define accounts required for createMetadataAccountV3
    const accounts = {
      mint: mint.publicKey, // Use Web3.js PublicKey directly for the mint
      mintAuthority: signer.publicKey, // Use the publicKey of the signer
      payer: keypair.publicKey, // Use the keypair as payer
      updateAuthority: signer.publicKey, // Authority to update metadata in the future
    };

    console.log('Accounts for Metadata Creation:');
    console.log('Mint:', accounts.mint.toBase58());
    console.log('Mint Authority:', accounts.mintAuthority.toBase58());
    console.log('Payer:', accounts.payer.toBase58());
    console.log('Update Authority:', accounts.updateAuthority.toBase58());

    // Create metadata account
    const txId = await createMetadataAccountV3(umi, {
      metadata,
      ...accounts,
      data: {
        name: roomInfo.name, // NFT name
        symbol: roomInfo.ticker, // NFT ticker/symbol
        uri: roomInfo.image, // Link to metadata JSON file
        sellerFeeBasisPoints: 0, // Royalty fee (0 if not required)
        creators: null, // Optional creators array
        collection: null, // Optional collection
        uses: null, // Optional usage metadata
      },
      isMutable: true, // Allow updates to metadata in the future
      collectionDetails: null, // Optional collection details
    }).sendAndConfirm(umi);

    console.log('Metadata account created successfully. Transaction ID:', txId);

    return mint.publicKey.toBase58();
  } catch (error) {
    console.error('Error minting token and creating metadata:', error);

    // Log detailed error information
    if (error.name === 'SendTransactionError' && error.getLogs) {
      console.error(
        'Transaction simulation failed. Logs:',
        await error.getLogs(),
      );
    }
    throw error;
  }
}

module.exports = { mintTokenWithMetadata };
