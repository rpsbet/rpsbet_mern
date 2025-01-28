require('dotenv').config();
const bs58 = require('bs58');
const { base58 } = require('@metaplex-foundation/umi/serializers');
const {
  generateSigner,
  createSignerFromKeypair,
  signerIdentity,
  percentAmount,
} = require('@metaplex-foundation/umi');

const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const {
  mplTokenMetadata,
  findMetadataPda,
  createAndMint,
  TokenStandard,
} = require('@metaplex-foundation/mpl-token-metadata');
const privateKeyBase58 = process.env.wk?.trim();
if (!privateKeyBase58 || !/^[A-Za-z1-9]+$/.test(privateKeyBase58)) {
  throw new Error('Invalid private key in .env');
}

const umi = createUmi('https://api.devnet.solana.com');

let keypair;
try {
  const secretKey = bs58.decode(privateKeyBase58);
  keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secretKey));
  console.log(`Central Wallet Public Key: ${keypair.publicKey}`);
} catch (err) {
  console.error('Error decoding private key:', err.message);
  throw err;
}

const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(signer));
umi.use(mplTokenMetadata());

async function mintTokenWithMetadata(roomInfo) {
  try {
    const { name, ticker, image } = roomInfo;
    console.log('name, ticker, image', name, ticker, image);
    if (!name || !ticker || !image) {
      throw new Error('roomInfo must include "name", "ticker", and "image"');
    }
    const totalSupplyBaseUnits = 1000000000n * 1000000000n;
    // Generate the new mint (token) keypair
    const mint = generateSigner(umi);
    console.log('Mint Address (public key):', mint.publicKey);
    const metadataPda = await findMetadataPda(umi, { mint: mint.publicKey });

    // Build and send transaction
    const transaction = createAndMint(umi, {
      mint,
      metadata: metadataPda,
      authority: umi.identity,
      payer: umi.identity,
      updateAuthority: umi.identity,
      name: name,
      symbol: ticker,
      uri: 'https://raw.githubusercontent.com/lennybeadle/json/main/test.json',
      sellerFeeBasisPoints: percentAmount(5.5),
      decimals: 9,
      amount: totalSupplyBaseUnits,
      tokenOwner: umi.identity.publicKey,
      tokenStandard: TokenStandard.Fungible,
    });

    const { signature } = await transaction.sendAndConfirm(umi);
    console.log('Transaction signature:', signature);
    let txSig = base58.deserialize(signature)[0];
    console.log(
      `https://explorer.solana.com/address/${mint.publicKey}/metadata?cluster=devnet`,
    );

    console.log(
      `Successfully minted token: ${name} (${ticker}) to mint address: ${mint.publicKey}`,
    );
    console.log(
      'Check it on Solscan (Devnet): https://solscan.io/token/' +
        mint.publicKey +
        '?cluster=devnet',
    );
    return mint.publicKey;
  } catch (err) {
    console.error('Error in mintTokenWithMetadata:', err);
    throw err;
  }
}

module.exports = {
  mintTokenWithMetadata,
};
