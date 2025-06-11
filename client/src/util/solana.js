// src/util/solana.js - Improved version with better error handling and wallet compatibility
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

// Helper function to create account object from Privy user
export const createAccountFromPrivyUser = (privyUser) => {
  if (!privyUser?.wallet?.address) {
    return null;
  }
  
  return {
    publicKey: new PublicKey(privyUser.wallet.address)
  };
};

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
  onError = () => {},
  onPopupOpen = () => {},
  onPopupClose = () => {},
  subscriptionInfo = null
) => {
// console.log('[sendSolDeposit] Starting SOL deposit process...', account);
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
    dispatch(errorMsgBar(errorText));
    onError();
    return { success: false, error: errorText };
  }

  // Enhanced wallet detection
  if (!window.solana) {
    const errorText = 'Solana wallet not detected. Please install Phantom or another Solana wallet.';
    console.error('[sendSolDeposit] Wallet Provider Error:', errorText);
    dispatch(errorMsgBar(errorText));
    onError();
    return { success: false, error: errorText };
  }

  // Check if wallet is connected
  if (!window.solana.isConnected) {
    try {
      await window.solana.connect();
    } catch (connectError) {
      const errorText = 'Failed to connect to wallet. Please try again.';
      console.error('[sendSolDeposit] Wallet Connection Error:', connectError);
      dispatch(errorMsgBar(errorText));
      onError();
      return { success: false, error: errorText };
    }
  }

  // Validate wallet from props/state
  if (!account?.publicKey) {
    const errorText = 'Wallet not connected or public key not available.';
    console.error('[sendSolDeposit] Account Prop Error:', errorText, { account });
    dispatch(errorMsgBar(errorText));
    onError();
    return { success: false, error: errorText };
  }

  try {
    // Get RPC URL
    const getProviderUrl = await axios.get('/stripe/get_provider_url');
    const providerUrl = getProviderUrl.data.providerUrl;
    if (!providerUrl) {
        const errorText = 'Failed to retrieve RPC provider URL.';
        console.error('[sendSolDeposit] API Error:', errorText);
        dispatch(errorMsgBar(errorText));
        onError();
        return { success: false, error: errorText };
    }
    
    // Use commitment level for better reliability
    const connection = new Connection(providerUrl, 'confirmed');

    // Get admin wallet
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

    // Ensure account.publicKey is a PublicKey instance
    const fromUserPublicKey = account.publicKey instanceof PublicKey
        ? account.publicKey
        : new PublicKey(account.publicKey.toString());

    // Verify the connected wallet matches the account
    const connectedPubkey = window.solana.publicKey;
    if (!connectedPubkey || connectedPubkey.toString() !== fromUserPublicKey.toString()) {
        const errorText = 'Connected wallet does not match the expected account. Please check your wallet connection.';
        console.error('[sendSolDeposit] Wallet Mismatch:', { 
            connected: connectedPubkey?.toString(), 
            expected: fromUserPublicKey.toString() 
        });
        dispatch(errorMsgBar(errorText));
        onError();
        return { success: false, error: errorText };
    }

    // console.log('[sendSolDeposit] User PublicKey:', fromUserPublicKey.toString());
    // console.log('[sendSolDeposit] Admin Wallet:', adminWalletPubkey.toString());
    // console.log('[sendSolDeposit] Amount:', numAmount, 'SOL');

    const lamports = Math.floor(numAmount * LAMPORTS_PER_SOL);
    // console.log('[sendSolDeposit] Lamports to transfer:', lamports);

    // Enhanced balance check with real-time balance
    const userBalance = await connection.getBalance(fromUserPublicKey);
    const estimatedFee = 10000; // Increased fee estimate for safety (0.00001 SOL)
    
    // console.log('[sendSolDeposit] Current balance check:', {
    //     userBalance: userBalance / LAMPORTS_PER_SOL,
    //     required: (lamports + estimatedFee) / LAMPORTS_PER_SOL,
    //     hasEnough: userBalance >= lamports + estimatedFee
    // });
    
    if (userBalance < lamports + estimatedFee) {
        const errorText = `Insufficient balance. Need ${((lamports + estimatedFee) / LAMPORTS_PER_SOL).toFixed(6)} SOL, but only have ${(userBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL.`;
        console.error('[sendSolDeposit] Balance check failed:', { 
            userBalance: userBalance / LAMPORTS_PER_SOL, 
            required: (lamports + estimatedFee) / LAMPORTS_PER_SOL 
        });
        dispatch(errorMsgBar(errorText));
        onError();
        return { success: false, error: errorText };
    }

    // Get fresh blockhash
    // console.log('[sendSolDeposit] Getting latest blockhash...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    
    // Create transaction with proper setup
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: fromUserPublicKey,
    }).add(
      SystemProgram.transfer({
        fromPubkey: fromUserPublicKey,
        toPubkey: adminWalletPubkey,
        lamports,
      })
    );

    onPopupOpen();

    let signature;
    try {
      // Use the most compatible wallet method
      if (window.solana.signAndSendTransaction) {
        // console.log('[sendSolDeposit] Using signAndSendTransaction...');
        const result = await window.solana.signAndSendTransaction(transaction);
        signature = result.signature || result;
      } else if (window.solana.signTransaction) {
        // console.log('[sendSolDeposit] Using signTransaction + sendRawTransaction...');
        const signedTransaction = await window.solana.signTransaction(transaction);
        signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });
      } else {
        throw new Error('Wallet does not support required transaction methods.');
      }

      if (!signature) {
        throw new Error('No signature returned from wallet.');
      }

    } catch (walletError) {
      onPopupClose();
      console.error('[sendSolDeposit] Wallet interaction error:', walletError);
      
      let errorMessage = 'Failed to sign transaction.';
      
      // Better error message handling
      if (walletError.message) {
        const msg = walletError.message.toLowerCase();
        if (msg.includes('user rejected') || msg.includes('cancelled') || walletError.code === 4001) {
          errorMessage = 'Transaction cancelled by user.';
        } else if (msg.includes('insufficient')) {
          errorMessage = 'Insufficient funds for transaction and network fees.';
        } else if (msg.includes('blockhash not found')) {
          errorMessage = 'Network issue. Please try again.';
        } else if (msg.includes('simulation failed')) {
          errorMessage = 'Transaction simulation failed. Please check your balance and try again.';
        } else {
          errorMessage = `Transaction failed: ${walletError.message}`;
        }
      }
      
      dispatch(errorMsgBar(errorMessage));
      onError();
      return { success: false, error: errorMessage };
    }

    // console.log('[sendSolDeposit] Transaction signed and sent. Signature:', signature);

    // Enhanced transaction confirmation
    // console.log('[sendSolDeposit] Confirming transaction...');
    try {
      const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
          console.error('[sendSolDeposit] Transaction confirmation error:', confirmation.value.err);
          onPopupClose();
          dispatch(errorMsgBar('Transaction failed on blockchain. Please try again.'));
          onError();
          return { success: false, error: 'Transaction failed on blockchain.' };
      }
    } catch (confirmError) {
      console.error('[sendSolDeposit] Confirmation timeout or error:', confirmError);
      // Don't immediately fail - the transaction might still be processing
      console.log('[sendSolDeposit] Confirmation failed, but proceeding to backend verification...');
    }
    
    onPopupClose();

    // Send to backend for verification
    const result = await axios.post('/stripe/sol_deposit', {
      account,
      amount: numAmount,
      txtHash: signature,
      room_id,
      room_name,
      type,
      ...(subscriptionInfo && { subscriptionInfo })
    });

    if (result.data.success) {
      dispatch(successMsgBar(result.data.message || 'Transaction completed successfully!'));
      
      if(result.data.newTransaction) {
        dispatch(addNewTransaction(result.data.newTransaction));
      }

      // Update balance
      try {
        const solBalLamports = await connection.getBalance(fromUserPublicKey);
        const solanaBalance = solBalLamports / LAMPORTS_PER_SOL;
        dispatch(setSolanaBalance({ solanaBalance }));
        console.log('[sendSolDeposit] Updated balance:', solanaBalance);
      } catch (balanceError) {
        console.error('[sendSolDeposit] Failed to fetch updated balance:', balanceError);
      }

      onSuccess();
      return { success: true, result: result.data };
    } else {
      const errorText = result.data.message || 'Backend verification failed. Transaction may have succeeded on blockchain.';
      console.error('[sendSolDeposit] Backend Error:', errorText);
      dispatch(errorMsgBar(errorText));
      onError();
      return { success: false, error: errorText };
    }

  } catch (error) {
    onPopupClose();
    console.error('[sendSolDeposit] CRITICAL ERROR:', error);
    
    let errorMessage = 'Transaction failed due to an unexpected error.';
    
    if (error.message) {
      const msg = error.message.toLowerCase();
      if (msg.includes('network') || msg.includes('rpc')) {
        errorMessage = 'Network connection error. Please check your internet and try again.';
      } else if (msg.includes('insufficient')) {
        errorMessage = 'Insufficient funds for transaction and fees.';
      } else if (msg.includes('blockhash')) {
        errorMessage = 'Network synchronization issue. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }
    
    dispatch(errorMsgBar(errorMessage));
    onError();
    return { success: false, error: errorMessage };
  }
};