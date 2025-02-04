const {
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} = require('@solana/web3.js');
const BN = require('bn.js');
const {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
} = require('@solana/spl-token');
const { connection, owner } = require('./config');
async function distributeTokens(mintPk, distributions) {
  try {
    const tx = new Transaction();

    // The central wallet's associated token account (which holds the minted tokens)
    const centralTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      mintPk,
      owner.publicKey,
    );
    const totalDistRaw = new BN(200_000_000).mul(new BN(10 ** 6)); // 200M tokens

    for (let dist of distributions) {
      console.log('---walletAddress:', dist.walletAddress);
      console.log('---share:', dist.share);

      const hostPk = new PublicKey(dist.walletAddress);
      const amount = totalDistRaw.mul(new BN(dist.share)).div(new BN(100));

      // Derive the associated token account for the host
      const hostTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        owner,
        mintPk,
        hostPk,
      );

      // If that ATA does not exist yet, create it
      // (We can also conditionally check getAccountInfo; if it doesn't exist, create)
      tx.add(
        createTransferInstruction(
          centralTokenAccount.address,
          hostTokenAccount.address,
          owner.publicKey,
          amount,
        ),
      );
    }

    const txSignature = await sendAndConfirmTransaction(connection, tx, [
      owner,
    ]);
    console.log(
      `Distribute tokens tx: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
    );
    return txSignature;
  } catch (e) {
    console.error('---error during distribute---', e);
  }
}
module.exports = {
  distributeTokens,
};
