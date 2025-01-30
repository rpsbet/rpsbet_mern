const {
  AMM_V4,
  AMM_STABLE,
  DEVNET_PROGRAM_ID,
} = require('@raydium-io/raydium-sdk-v2');

const VALID_PROGRAM_ID = new Set([
  AMM_V4.toBase58(),
  AMM_STABLE.toBase58(),
  DEVNET_PROGRAM_ID.AmmV4.toBase58(),
  DEVNET_PROGRAM_ID.AmmStable.toBase58(),
]);

const isValidAmm = (id) => VALID_PROGRAM_ID.has(id);

module.exports = { isValidAmm };
