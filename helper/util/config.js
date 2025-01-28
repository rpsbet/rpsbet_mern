const bs58 = require('bs58');
const {
  ENDPOINT: _ENDPOINT,
  Currency,
  LOOKUP_TABLE_CACHE,
  MAINNET_PROGRAM_ID,
  RAYDIUM_MAINNET,
  Token,
  TOKEN_PROGRAM_ID,
  TxVersion,
} = require('@raydium-io/raydium-sdk');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const privateKeyBase58 = process.env.wk?.trim();
if (!privateKeyBase58 || !/^[A-Za-z1-9]+$/.test(privateKeyBase58)) {
  throw new Error('Invalid private key in .env');
}
const secretKey = bs58.decode(privateKeyBase58);
const wallet = Keypair.fromSecretKey(secretKey);
const connection = new Connection('https://api.devnet.solana.com');

const PROGRAMIDS = MAINNET_PROGRAM_ID;
const ENDPOINT = _ENDPOINT;
const RAYDIUM_MAINNET_API = RAYDIUM_MAINNET;
const makeTxVersion = TxVersion.V0; // LEGACY
const addLookupTableInfo = LOOKUP_TABLE_CACHE; // only mainnet. other = undefined

const DEFAULT_TOKEN = {
  SOL: new Currency(9, 'USDC', 'USDC'),
  WSOL: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey('So11111111111111111111111111111111111111112'),
    9,
    'WSOL',
    'WSOL',
  ),
  USDC: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    6,
    'USDC',
    'USDC',
  ),
  RAY: new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'),
    6,
    'RAY',
    'RAY',
  ),
  'RAY_USDC-LP': new Token(
    TOKEN_PROGRAM_ID,
    new PublicKey('FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y'),
    6,
    'RAY-USDC',
    'RAY-USDC',
  ),
};

module.exports = {
  wallet,
  connection,
  PROGRAMIDS,
  ENDPOINT,
  RAYDIUM_MAINNET_API,
  makeTxVersion,
  addLookupTableInfo,
  DEFAULT_TOKEN,
};
