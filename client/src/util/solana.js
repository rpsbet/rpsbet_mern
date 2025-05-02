// src/util/solana.js
import axios from './Api';
import {
  Connection,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from '@solana/web3.js';
import { errorMsgBar, successMsgBar } from '../redux/Notification/notification.actions';
import { addNewTransaction, setSolanaBalance } from '../redux/Logic/logic.actions';

// Send SOL deposit to the platform's admin wallet
export const sendSolDeposit = async (
  dispatch,
  amount,
  room_id,
  room_name,
  type,
  account,
  balance,
  onSuccess = () => {},
  onError = () => {}
) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    dispatch(errorMsgBar('Please enter a valid SOL amount.'));
    onError();
    return { success: false };
  }
  if (numAmount > balance) {
    dispatch(errorMsgBar('Invalid Balance'));
    onError();
    return { success: false };
  }

  try {
    // 1) Fetch provider URL
    const getProviderUrl = await axios.get('/stripe/get_provider_url');
    const providerUrl = getProviderUrl.data.providerUrl;
    const connection = new Connection(providerUrl, 'confirmed');

    // 2) Get admin wallet public key
    const getAdminWallet = await axios.get('/stripe/get_admin_wallet');
    const adminWalletPubkey = new PublicKey(getAdminWallet.data.adminWallet);

    // 3) Validate wallet
    if (!account?.publicKey) {
      console.log("a")
      dispatch(errorMsgBar('Wallet not connected.'));
      onError();
      return { success: false };
    }

    // 4) Construct transaction
    const lamports = Math.floor(numAmount * LAMPORTS_PER_SOL);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: account.publicKey,
        toPubkey: adminWalletPubkey,
        lamports,
      })
    );

    // 5) Set recent blockhash & fee payer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = account.publicKey;

    // 6) Sign and send transaction via Phantom
    const signature = await window.solana.signAndSendTransaction(transaction);
    await connection.confirmTransaction(signature);

    // 7) Notify backend of successful deposit
    const result = await axios.post('/stripe/sol_deposit', {
      account,
      amount: numAmount,
      txtHash: signature,
      room_id,
      room_name,
      type
    });

    if (result.data.success) {
      dispatch(successMsgBar(result.data.message));
      console.log("result.data.newTransaction———————", result.data.newTransaction)
      dispatch(addNewTransaction(result.data.newTransaction));

      // 8) Fetch and update Solana balance
      try {
        const solBalLamports = await connection.getBalance(account.publicKey);
        const solanaBalance = solBalLamports / LAMPORTS_PER_SOL;
        dispatch(setSolanaBalance({ solanaBalance }));
      } catch (balanceError) {
        console.error('Failed to fetch Solana balance:', balanceError);
        // Continue with success even if balance fetch fails
      }

      onSuccess();
      return { success: true, result: result.data };
    } else {
      dispatch(errorMsgBar(result.data.message || 'Transaction failed. Please try again.'));
      onError();
      return { success: false };
    }
  } catch (error) {
    console.error('Error sending transaction:', error);
    dispatch(errorMsgBar('Failed to process transaction.'));
    onError();
    return { success: false };
  }
};