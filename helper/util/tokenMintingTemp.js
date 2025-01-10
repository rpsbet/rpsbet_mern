require('dotenv').config();
const {
  clusterApiUrl,
  Connection,
  PublicKey,
  Keypair,
} = require('@solana/web3.js');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const {
  createMetadataAccountV3,
} = require('@metaplex-foundation/mpl-token-metadata');
const {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
} = require('@metaplex-foundation/umi-web3js-adapters');
const { createSignerFromKeypair } = require('@metaplex-foundation/umi');
const { base58 } = require('@metaplex-foundation/umi/serializers');

const mintTokenWithMetadata = async (roomInfo) => {
  const umi = createUmi('https://api.devnet.solana.com');

  const privateKeyBase58 = process.env.wk?.trim();
  if (!privateKeyBase58 || !/^[A-Za-z1-9]+$/.test(privateKeyBase58)) {
    throw new Error(
      'Invalid private key: ensure it is Base58 encoded and correctly set in .env',
    );
  }
  let keypair;
  try {
    const secretKey = bs58.decode(privateKeyBase58);
    keypair = Keypair.fromSecretKey(secretKey); // Use Web3.js Keypair
    console.log(`Central Wallet Public Key: ${keypair.publicKey.toBase58()}`);
  } catch (err) {
    console.error('Error decoding private key:', err.message);
    throw err;
  }

  //   const keypair = fromWeb3JsKeypair(web3jsKeyPair);
  console.log('--keypair--', keypair);
  const signer = createSignerFromKeypair(umi, keypair);
  umi.identity = signer;
  umi.payer = signer;

  const mint = Keypair.generate();
  console.log('Mint Address:', mint.publicKey.toBase58());

  let CreateMetadataAccountV3Args = {
    //accounts
    mint: mint.publicKey,
    mintAuthority: signer,
    payer: signer,
    updateAuthority: keypair.publicKey,
    data: {
      name: roomInfo.name,
      symbol: roomInfo.ticker,
      uri: roomInfo.image,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    },
    isMutable: false,
    collectionDetails: null,
  };

  let instruction = createMetadataAccountV3(umi, CreateMetadataAccountV3Args);

  const transaction = await instruction.buildAndSign(umi);

  const transactionSignature = await umi.rpc.sendTransaction(transaction);
  console.log('------', transactionSignature);
  const signature = base58.deserialize(transactionSignature);
  console.log({ signature });
  return signature;
};

module.exports = { mintTokenWithMetadata };
