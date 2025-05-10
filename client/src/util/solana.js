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
import { Buffer } from 'buffer';
window.Buffer = Buffer; 
// Send SOL deposit to the platform's admin wallet
export const sendSolDeposit = async (
  dispatch,
  amount,
  room_id,
  room_name,
  type,
  account, // Expected: { publicKey: PublicKey, ... } or at least { publicKey: { toString: () => string } }
  balance, // User's current SOL balance
  onSuccess = () => {},
  onError = () => {},
  onPopupOpen = () => {}, // New callback for when popup opens
  onPopupClose = () => {} 
) => {

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    const errorText = 'Please enter a valid SOL amount.';
    console.error('[sendSolDeposit] Validation Error:', errorText, { amount });
    dispatch(errorMsgBar(errorText));
    onError();
    return { success: false, error: errorText };
  }

  if (numAmount > balance) {
    const errorText = 'Insufficient balance.';
    console.error('[sendSolDeposit] Validation Error:', errorText, { numAmount, balance });
    dispatch(errorMsgBar(errorText)); // Changed from "Invalid Balance" for clarity
    onError();
    return { success: false, error: errorText };
  }

  // Check for window.solana (Phantom or other wallet provider)
  if (!window.solana || !window.solana.isPhantom) { // .isPhantom is common for Phantom
    const errorText = 'Solana wallet (e.g., Phantom) not detected. Please install or enable your wallet.';
    console.error('[sendSolDeposit] Wallet Provider Error:', errorText);
    dispatch(errorMsgBar(errorText));
    onError();
    return { success: false, error: errorText };
  }

  // 3) Validate wallet from props/state
  if (!account?.publicKey) {
    const errorText = 'Wallet not connected or public key not available in account prop.';
    console.error('[sendSolDeposit] Account Prop Error:', errorText, { account });
    dispatch(errorMsgBar(errorText));
    onError();
    return { success: false, error: errorText };
  }


  try {
    const getProviderUrl = await axios.get('/stripe/get_provider_url');
    const providerUrl = getProviderUrl.data.providerUrl;
    if (!providerUrl) {
        const errorText = 'Failed to retrieve RPC provider URL.';
        console.error('[sendSolDeposit] API Error:', errorText);
        dispatch(errorMsgBar(errorText));
        onError();
        return { success: false, error: errorText };
    }
    const connection = new Connection(providerUrl, 'confirmed');

    const getAdminWallet = await axios.get('/stripe/get_admin_wallet');
    const adminWalletAddressString = getAdminWallet.data.adminWallet;
    if (!adminWalletAddressString) {
        const errorText = 'Failed to retrieve admin wallet address.';
        console.error('[sendSolDeposit] API Error:', errorText);
        dispatch(errorMsgBar(errorText));
        onError();
        return { success: false, error: errorText };
    }
    const adminWalletPubkey = new PublicKey(adminWalletAddressString);


    // Ensure account.publicKey is a PublicKey instance if it's not already
    const fromUserPublicKey = account.publicKey instanceof PublicKey
        ? account.publicKey
        : new PublicKey(account.publicKey.toString()); // Assuming it has toString if not PublicKey

    const lamports = Math.floor(numAmount * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromUserPublicKey,
        toPubkey: adminWalletPubkey,
        lamports,
      })
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromUserPublicKey;

    // Ensure the wallet is connected and ready (some wallets might require an explicit connect call if not already trusted)
    // if (typeof window.solana.connect === 'function' && !window.solana.isConnected) { // isConnected might not be standard
    //   try {
    //     await window.solana.connect(); // Or window.solana.connect({ onlyIfTrusted: false });
    //     console.log('[sendSolDeposit] Wallet connected successfully.');
    //   } catch (connectError) {
    //     console.error('[sendSolDeposit] Wallet connection rejected or failed:', connectError);
    //     dispatch(errorMsgBar('Wallet connection failed. Please ensure your wallet is unlocked and connected.'));
    //     onError();
    //     return { success: false, error: 'Wallet connection failed.' };
    //   }
    // }
    onPopupOpen();

    if (typeof window.solana.signAndSendTransaction !== 'function') {
        const errorText = 'Wallet does not support signAndSendTransaction method.';
        console.error('[sendSolDeposit] Wallet Method Error:', errorText);
        dispatch(errorMsgBar(errorText));
        onError();
        return { success: false, error: errorText };
    }

    const { signature } = await window.solana.signAndSendTransaction(transaction);
    // Note: Phantom now returns { signature: string } instead of just the signature string directly for some calls.
    // If 'signature' is an object, it should be `signature.signature`.
    // However, the standard for signAndSendTransaction usually returns the signature string directly.
    // Let's assume 'signature' is the string here.
    console.log('[sendSolDeposit] Transaction signed and sent. Signature:', signature);

    console.log('[sendSolDeposit] Confirming transaction on Solana network...');
    const confirmation = await connection.confirmTransaction({
        signature,
        blockhash, // from getLatestBlockhash
        lastValidBlockHeight // from getLatestBlockhash
    }, 'confirmed');
    onPopupClose();

    if (confirmation.value.err) {
        console.error('[sendSolDeposit] Solana transaction confirmation error:', confirmation.value.err);
        dispatch(errorMsgBar('Solana transaction failed on-chain.'));
        onError();
        return { success: false, error: 'Solana transaction failed.' };
    }

    const result = await axios.post('/stripe/sol_deposit', {
      // Pass account publicKey as string if backend expects that
      account,
      amount: numAmount,
      txtHash: signature,
      room_id,
      room_name,
      type
    });

    if (result.data.success) {
      dispatch(successMsgBar(result.data.message || 'Deposit successful!'));
      if(result.data.newTransaction) { // Check if newTransaction exists
        dispatch(addNewTransaction(result.data.newTransaction));
      }

      try {
        const solBalLamports = await connection.getBalance(fromUserPublicKey);
        const solanaBalance = solBalLamports / LAMPORTS_PER_SOL;
        dispatch(setSolanaBalance({ solanaBalance }));
      } catch (balanceError) {
        console.error('[sendSolDeposit] Failed to fetch Solana balance after deposit:', balanceError);
        // Continue with success even if balance fetch fails, as deposit was successful
      }

      onSuccess();
      return { success: true, result: result.data };
    } else {
      const errorText = result.data.message || 'Backend processing failed after transaction. Please contact support.';
      console.error('[sendSolDeposit] Backend Error:', errorText);
      dispatch(errorMsgBar(errorText));
      // Potentially, you might need to inform the user that the on-chain tx was successful
      // but backend update failed, and they should contact support with the signature.
      onError();
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('[sendSolDeposit] CRITICAL ERROR during transaction process:', error);
    let errorMessage = 'Failed to process transaction.';
    if (error.message) {
        // Wallet interaction errors (e.g., user declining) often come through here
        if (error.message.includes('User rejected the request') || error.code === 4001) { // 4001 is common for user rejection
            errorMessage = 'Transaction rejected by user.';
        } else if (error.message.includes('Transaction simulation failed')) {
            errorMessage = 'Transaction simulation failed. Check details or try again.';
        } else {
            errorMessage = error.message; // More specific error from the wallet or web3.js
        }
    }
    dispatch(errorMsgBar(errorMessage));
    onError();
    return { success: false, error: errorMessage };
  }
};