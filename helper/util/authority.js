const {
  createSetAuthorityInstruction,
  AuthorityType,
  getMint,
} = require('@solana/spl-token');
const { Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { connection, owner } = require('./config');

async function revokeMintAndFreezeAuthorities(mintPk) {
  try {
    const tx = new Transaction();
    const mintInfo = await getMint(connection, mintPk);
    console.log('This really is a mint:', mintInfo);
    tx.add(
      createSetAuthorityInstruction(
        mintPk,
        owner.publicKey,
        AuthorityType.MintTokens,
        null,
      ),
    );
    tx.add(
      createSetAuthorityInstruction(
        mintPk,
        owner.publicKey,
        AuthorityType.FreezeAccount,
        null,
      ),
    );

    const txSignature = await sendAndConfirmTransaction(connection, tx, [
      owner,
    ]);
    console.log(
      `Revoke authorities tx: https://explorer.solana.com/tx/${txSignature}`,
    );
    return txSignature;
  } catch (error) {
    console.error('Error during revoke:', error);
  }
}

module.exports = {
  revokeMintAndFreezeAuthorities,
};
