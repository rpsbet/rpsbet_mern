const {
  Raydium,
  TxVersion,
  parseTokenAccountResp,
} = require('@raydium-io/raydium-sdk-v2');
const { Connection, Keypair, clusterApiUrl } = require('@solana/web3.js');
const {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} = require('@solana/spl-token');
const bs58 = require('bs58');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();
const privateKeyBase58 = process.env.wk?.trim();
if (!privateKeyBase58 || !/^[A-Za-z1-9]+$/.test(privateKeyBase58)) {
  throw new Error('Invalid private key in .env');
}

const secretKey = bs58.decode(privateKeyBase58);

const owner = Keypair.fromSecretKey(secretKey);
const connection = new Connection('https://api.devnet.solana.com'); // Replace <YOUR_RPC_URL> with your RPC URL
// const connection = new Connection(clusterApiUrl('devnet')); // Alternative for devnet
const txVersion = TxVersion.V0; // or TxVersion.LEGACY
const cluster = 'devnet'; // 'mainnet' | 'devnet'

let raydium;

const initSdk = async (params = { loadToken: false }) => {
  if (raydium) return raydium;

  if (connection.rpcEndpoint === clusterApiUrl('mainnet-beta')) {
    console.warn(
      'Using free RPC node might cause unexpected errors. Strongly suggest using a paid RPC node.',
    );
  }

  console.log(`Connecting to RPC ${connection.rpcEndpoint} in ${cluster}`);

  raydium = await Raydium.load({
    owner,
    connection,
    cluster,
    disableFeatureCheck: true,
    disableLoadToken: !params.loadToken,
    blockhashCommitment: 'finalized',
    // urlConfigs: {
    //   BASE_HOST: '<API_HOST>', // API URL configs, currently API doesn't support devnet
    // },
  });

  /**
   * By default: SDK will automatically fetch token account data when needed or any SOL balance changes.
   * If you want to handle token accounts by yourself, set token account data after initializing the SDK.
   * Code below shows how to do it.
   * Note: After calling raydium.account.updateTokenAccount, Raydium will not automatically fetch token accounts.
   */

  /*  
  raydium.account.updateTokenAccount(await fetchTokenAccountData());
  connection.onAccountChange(owner.publicKey, async () => {
    raydium.account.updateTokenAccount(await fetchTokenAccountData());
  });
  */

  return raydium;
};

const fetchTokenAccountData = async () => {
  const solAccountResp = await connection.getAccountInfo(owner.publicKey);
  const tokenAccountResp = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId: TOKEN_PROGRAM_ID },
  );
  const token2022Req = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId: TOKEN_2022_PROGRAM_ID },
  );

  const tokenAccountData = parseTokenAccountResp({
    owner: owner.publicKey,
    solAccountResp,
    tokenAccountResp: {
      context: tokenAccountResp.context,
      value: [...tokenAccountResp.value, ...token2022Req.value],
    },
  });

  return tokenAccountData;
};

async function checkSolBalance() {
  const lamports = await connection.getBalance(owner.publicKey);
  const solBalance = lamports / 1_000_000_000;
  console.log(`SOL Balance: ${solBalance} SOL`);
}

const grpcUrl = '<YOUR_GRPC_URL>'; // Replace <YOUR_GRPC_URL> with your gRPC URL
const grpcToken = '<YOUR_GRPC_TOKEN>'; // Replace <YOUR_GRPC_TOKEN> with your gRPC token

module.exports = {
  owner,
  connection,
  txVersion,
  initSdk,
  fetchTokenAccountData,
  grpcUrl,
  grpcToken,
  cluster,
  checkSolBalance,
};
