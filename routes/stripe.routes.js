const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Receipt = require('../model/Receipt');
const GameLog = require('../model/GameLog');
const gameTransaction = require('../model/Transaction');
const { newTransaction } = require('../socketController');
const { Connection, Keypair, Transaction, PublicKey, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createTransferInstruction, createAssociatedTokenAccount } = require('@solana/spl-token'); // Import from spl-token package
const saveDocumentWithRetry = require('../helper/util/retrySave');

const bs58 = require('bs58');
// const ganacheEndpoint = 'http://localhost:7544';
const jwt = require('jsonwebtoken');
// const provider = new JsonRpcProvider(ganacheEndpoint); 
const connection = new Connection(process.env.PROVIDER_URL);
const walletKey = process.env.wk;
const API_KEY = process.env.API_KEY;

// Replace with your actual token mint address
const tokenMintAddress = process.env.token;
const TOKEN_DECIMALS = 6;
const TOKEN_MULTIPLIER = 10 ** TOKEN_DECIMALS;


// **************************************** //
// ************ GLOBAL FUNCTIONS ********** //
// **************************************** //

async function calculateRemainingLoans(currentUser) {
  try {
    const matchingLoans = await Loan.find({ 'loaners.user': currentUser._id });
    let remainingAmount = 0;

    for (const loan of matchingLoans) {
      const loanerInfo = loan.loaners.find(loaner => loaner.user.equals(currentUser._id));

      if (parseFloat(loanerInfo.amount) > 0.0000) {
        remainingAmount += parseFloat(loanerInfo.amount);
      }
    }

    return remainingAmount;
  } catch (err) {
    console.error('Error:', err);
    throw new Error('An error occurred while calculating remaining loans');
  }
}

router.get('/estimate_amount', auth, async (req, res) => {
  try {
    const { web2Amount, currencyTo } = req.query;
    const estimatedAmount = await estimateAmount(web2Amount, currencyTo, tokenMintAddress);
    res.json(estimatedAmount);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


const validatePayoutAddress = async (sendAddress, currencyTo, apiKey) => {
  const payload = {
    address: sendAddress,
    currency: currencyTo,
  };


  try {
    const response = await axios.post('https://api.nowpayments.io/v1/payout/validate-address', payload, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Extract status from response data
    const { status } = response.status;
    // Return true if status is "OK", otherwise return false
    return response.status === 200;
  } catch (error) {
    console.error('Invalid payout_address: ', error);
    throw new Error('Invalid payout address, please ensure the network is correct.');
  }
};

// Define the endpoint
router.post('/validate_address', auth, async (req, res) => {
  try {
    // Extract payment details from request body
    const { sendAddress, currencyTo } = req.body;

    // Call the validation function
    const isValid = await validatePayoutAddress(sendAddress, currencyTo, API_KEY);

    // Return the validation result
    res.json({ success: isValid });
  } catch (error) {
    console.error('Error during address validation: ', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// **************************************** //
// ************* WEB2 ********************* //
// **************************************** //
router.get('/get_currencies', async (req, res) => {
  try {

    // Make GET request to NowPayments API to retrieve currencies
    const response = await axios.get('https://api.nowpayments.io/v1/currencies', {
      params: {
        fixed_rate: true,
      },
      headers: {
        'x-api-key': API_KEY,
      },
    });

    // Extract currencies from response data
    const currencies = response.data;

    res.json(currencies);
  } catch (error) {
    console.error('Error getting currencies:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching currencies',
    });
  }
});

router.get('/get_admin_wallet', async (req, res) => {
  try {
    const adminWallet = process.env.adminWallet;

    if (!adminWallet) {
      return res.status(500).json({
        success: false,
        message: 'Admin wallet address is not set in environment variables',
      });
    }

    // Respond with the admin wallet address as a JSON object
    res.json({ adminWallet });
  } catch (error) {
    console.error('Error getting adminWallet:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while getting adminWallet',
    });
  }
});

router.get('/get_provider_url', async (req, res) => {
  try {
    const providerUrl = process.env.PROVIDER_URL;

    if (!providerUrl) {
      return res.status(500).json({
        success: false,
        message: 'Provider URL is not set in environment variables',
      });
    }

    res.json({ providerUrl });
  } catch (error) {
    console.error('Error getting providerUrl:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while getting providerUrl',
    });
  }
});

// DEPOSIT
router.post('/create_payment', auth, async (req, res) => {
  try {
    const { price_amount, payment_id, user_id, tokenMintAddress } = req.body;

    if (payment_id !== null) {
      const usedTransactions = await gameTransaction.find({
        hash: payment_id,
      });

      if (usedTransactions.length > 0) {
        return res.status(400).send('Transaction has already been used');
      }
    }


    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMintAddress}`);
    const tokenPrice = parseFloat(response.data.pairs[0]?.priceUsd);

    if (tokenPrice == null || isNaN(tokenPrice)) {
      console.error('Token price not found or invalid');
      return res.status(404).json({ success: false, message: 'Token price not found or invalid.' });
    }

    const rpsAmount = calculateAmountSol(price_amount, tokenPrice);
    const newTransaction = new gameTransaction({
      user: user_id,
      amount: rpsAmount - (rpsAmount * 0.008),
      description: 'deposit',
      hash: payment_id,
    });

    newTransaction.status = 'processing';

    await newTransaction.save();

    res.json({
      success: true,
      message: `Please wait for confirmations.<br /> You can view the status in your 'All Transactions' history.`,
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating payment',
    });
  }
});

function calculateAmountSol(price_amount, tokenPrice) {
  switch (price_amount) {
    case 25:
      return price_amount / tokenPrice;
    case 50:
      return price_amount / tokenPrice;
    case 250:
      return price_amount / tokenPrice;
    case 500:
      return price_amount / tokenPrice;
    case 2500:
      return price_amount / tokenPrice;
    case 5000:
      return price_amount / tokenPrice;
    default:
      return 0;
  }
}

router.post('/generate_address', auth, async (req, res) => {
  try {

    const { web2Amount, currencyTo } = req.body;

    const payload = {
      price_amount: web2Amount,
      price_currency: 'usd',
      pay_currency: currencyTo,
    };

    const response = await axios.post('https://api.nowpayments.io/v1/payment', payload, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const paymentData = response.data;

    res.json(paymentData);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating payment',
    });
  }
});

router.post('/get_sol_to_usd', async (req, res) => {
  try {
    const { solAmount } = req.body;

    // Function to fetch SOL price from the primary source (CoinGecko)
    const fetchSolPriceFromPrimary = async () => {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: 'solana',
          vs_currencies: 'usd',
        },
      });
      return response.data.solana?.usd;
    };

    // Function to fetch SOL price from the first fallback source (Binance)
    const fetchSolPriceFromFallback1 = async () => {
      const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
        params: {
          symbol: 'SOLUSDT',
        },
      });
      return parseFloat(response.data.price);
    };

    // Function to fetch SOL price from the second fallback source (Coincap)
    const fetchSolPriceFromFallback2 = async () => {
      const response = await axios.get('https://api.coincap.io/v2/assets/solana');
      return parseFloat(response.data.data.priceUsd);
    };

    let solPrice = null;

    // Attempt to fetch SOL price from the primary and fallback sources in sequence
    try {
      solPrice = await fetchSolPriceFromPrimary();
    } catch (primaryError) {
      console.warn('Primary source failed, trying first fallback source...', primaryError.message);

      try {
        solPrice = await fetchSolPriceFromFallback1();
      } catch (fallback1Error) {
        console.warn('First fallback source failed, trying second fallback source...', fallback1Error.message);

        try {
          solPrice = await fetchSolPriceFromFallback2();
        } catch (fallback2Error) {
          console.error('All sources failed:', fallback2Error.message);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch Solana price from all sources.',
          });
        }
      }
    }

    if (solPrice == null || isNaN(solPrice)) {
      return res.status(404).json({
        success: false,
        message: 'Failed to fetch Solana price.',
      });
    }

    // If solAmount is not provided or invalid, return only the SOL price
    if (solAmount == null || isNaN(solAmount)) {
      return res.json({
        success: true,
        solPrice,
        usdValue: null, // No USD value calculated
      });
    }

    const usdValue = solAmount * solPrice;

    res.json({
      success: true,
      solPrice,
      usdValue,
    });
  } catch (error) {
    console.error('Error getting SOL to USD price:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while getting the SOL to USD price.',
    });
  }
});


router.post('/get_token_price', auth, async (req, res) => {
  try {
    const { tokenMintAddress, web2Amount } = req.body;
    const targetMintAddress = process.env.token;
    if (tokenMintAddress !== targetMintAddress) {
      return res.status(400).json({
        success: false,
        message: 'This token mint address is not supported.',
      });
    }

    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMintAddress}`);
    const tokenPrice = parseFloat(response.data.pairs[0]?.priceUsd);
    if (tokenPrice == null || isNaN(tokenPrice)) {
      return res.status(404).json({
        success: false,
        message: 'Token price not found or invalid.',
      });
    }

    const numberOfTokens = web2Amount / tokenPrice;
    res.json({ tokenPrice, numberOfTokens });
  } catch (error) {
    console.error('Error getting token price:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while getting the token price',
    });
  }
});

// WITHDRAWAL WEB2

router.post('/create_payout', auth, async (req, res) => {
  try {
    const { amount, currency, address, extra_id } = req.body;
    const balance = req.user.balance;
    const withdrawalLimit = req.user.dailyWithdrawals;
    const totalWagered = req.user.totalWagered;

    const username = req.user.username;

    if (username.includes('BOT')) {
      return res.json({
        success: false,
        message: 'DO NOT HAVE PURRMISSION'
      });
    }

    if (balance < amount) {
      return res.json({
        success: false,
        message: 'INSUFFICIENT FUNDS'
      });
    }
    if (totalWagered === 0) {
      return res.json({
        success: false,
        message: 'ACCOUNT TOO NEW'
      });
    }

    if (withdrawalLimit >= 4.269) {
      return res.json({
        success: false,
        message: 'EXCEEDED DAILY WITHDRAWAL LIMIT (DURING LAUNCH PHASE ONLY!)'
      });
    }

    if (amount > 4.269) {
      return res.json({
        success: false,
        message: 'Maximum Withdrawal Amount is 4.269 RPS per DAY during Launch'
      });
    }

    const remainingLoanAmount = await calculateRemainingLoans(req.user);
    if (remainingLoanAmount > 0) {
      return res.json({
        success: false,
        message: 'EXISTING LOANS, CANNOT WITHDRAW'
      });
    }
    const email = process.env.email;
    const password = process.env.password;

    const token = await getJWTToken(email, password);
    let newAmount;
    const retryLimit = 3;
    let attempt = 0;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt < retryLimit) {
      try {

        newAmount = await estimateAmount((req.body.amount), currency);

        break; // Break out of loop if estimation is successful
      } catch (error) {
        attempt++;
        console.error(`Estimation failed, attempt ${attempt} of ${retryLimit}:`, error.message);
        if (attempt < retryLimit) {
          await delay(1000 * attempt); // Exponential backoff
        } else {
          return res.status(500).json({
            success: false,
            message: 'Failed to estimate amount after multiple attempts'
          });
        }
      }
    }

    const payload = {
      ipn_callback_url: 'https://nowpayments.io', // You may adjust this as needed
      withdrawals: [
        {
          address: address.toString(),
          currency: currency,
          amount: newAmount.estimated_amount,
          ipn_callback_url: 'https://nowpayments.io',
          extra_id: extra_id ? extra_id : null
        }
      ]
    };


    const response = await axios.post('https://api.nowpayments.io/v1/payout', payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      }
    });

    const newTransaction = new gameTransaction({
      user: req.user._id,
      address: address,
      amount: -amount,
      description: 'withdraw',
      status: 'processing',
      hash: response.data.id,
    });

    const receipt = new Receipt({
      user_id: req.user._id,
      payment_method: 'Web2',
      payment_type: 'Withdrawal',
      amount: -amount,
    });

    req.user.balance -= amount;
    if (response.data.withdrawals[0].status === 'CREATING') {
      try {
        await req.user.save();
        await receipt.save();
        await newTransaction.save();
      } catch (error) {
        console.error('Error saving transaction or receipt:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to save transaction or receipt'
        });
      }
      // Create and save
      const newGameLog = new GameLog({
        room: null,
        creator: req.user._id,
        joined_user: null,
        game_type: null,
        bet_amount: amount,
        selected_rps: '',
        commission: 0,
        game_result: 777,
        winnings: 0,
        endgame_amount: 0,
        host_pr: 0,
        user_bet: 0,
        status: 'pending',
        hosts: []
      });

      try {
        await newGameLog.save();
      } catch (error) {
        console.log('Eerr:', error);
        console.error('Error saving game log:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to save game log'
        });
      }

      return res.json({
        success: true,
        balance: req.user.balance,
        newTransaction,
        newGameLog,
        message: `Withdrawal request received and is pending confirmation. 🤑 Much Wow.`
      });
    }
  } catch (error) {
    console.error('Error processing withdrawal request: ', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred'
    });
  }
});

const getJWTToken = async (email, password) => {
  try {
    const response = await axios.post('https://api.nowpayments.io/v1/auth', {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    throw new Error('Error obtaining JWT token: ' + (error.response ? error.response.data : error.message));
  }
};

// **************************************** //
// ************* SOLANA ******************** //
// **************************************** //
router.post('/deposit_successed', auth, async (req, res) => {
  try {
    let { amount, txtHash, account } = req.body;

    // If txtHash is an object with .signature, extract that
    if (typeof txtHash === 'object' && txtHash.signature) {
      txtHash = txtHash.signature;
    }

    // Validate the essential fields
    if (!amount || !txtHash || !account) {
      console.error('Invalid input:', { amount, txtHash, account });
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    // Make sure this transaction hash hasn't been used before
    const usedTransactions = await gameTransaction.find({ hash: txtHash });
    if (usedTransactions.length > 0) {
      console.error('Transaction has already been used:', txtHash);
      return res.status(400).json({ success: false, message: 'Transaction has already been used' });
    }

    // Convert amount if needed (if user sent as string)
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Deposit amount is invalid.' });
    }

    // Create a new transaction record
    const newTransaction = new gameTransaction({
      user: req.user._id,
      amount: numericAmount,
      description: 'SOL deposit',
      hash: txtHash,
      status: 'pending'
    });
    await newTransaction.save();

    // Create a receipt
    const receipt = new Receipt({
      user_id: req.user._id,
      payment_method: 'Web3',
      payment_type: 'Deposit',
      amount: numericAmount
    });
    await receipt.save();

    // If user has not used this wallet address, add it
    if (!req.user.accounts.includes(account.publicKey)) {
      req.user.accounts.push(account.publicKey);
      await req.user.save();
      console.log("Added new wallet address to user:", account);
    }

    // Return success
    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction,
      message: `Deposit received! Confirmation is pending.`
    });
  } catch (err) {
    console.log('Error in deposit_successed:', err);
    return res.json({
      success: false,
      message: err.message || 'An unexpected error occurred',
    });
  }
});


router.post('/withdraw_request', auth, async (req, res) => {
  try {
    const user = req.user; // from auth middleware
    const username = user.username;
    const totalWagered = user.totalWagered;
    const balance = user.balance;
    const withdrawalLimit = user.dailyWithdrawals;

    // Basic permission checks
    if (username.includes('BOT')) {
      return res.json({ success: false, message: 'DO NOT HAVE PERMISSION' });
    }
    if (totalWagered === 0) {
      return res.json({ success: false, message: 'ACCOUNT TOO NEW' });
    }

    // Parse requested amount
    const requestedAmount = parseFloat(req.body.amount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return res.json({ success: false, message: 'Invalid withdrawal amount' });
    }

    // Check user balance
    if (balance < requestedAmount) {
      return res.json({ success: false, message: 'Insufficient balance' });
    }
    // Check daily limit
    if (withdrawalLimit > 4.269) {
      console.log('Exceeded Daily Withdrawal Limit', user);
      return res.json({
        success: false,
        message: 'EXCEEDED DAILY WITHDRAWAL LIMIT (DURING LAUNCH PHASE)!'
      });
    }
    if (requestedAmount > 4.269) {
      return res.json({
        success: false,
        message: 'Maximum Withdrawal Amount is 4.269 SOL per DAY during Launch'
      });
    }

    // Check loans
    const remainingLoanAmount = await calculateRemainingLoans(user);
    if (remainingLoanAmount > 0) {
      return res.json({
        success: false,
        message: 'EXISTING LOANS, CANNOT WITHDRAW'
      });
    }

    // Validate 'toAddress'
    const toAddress = req.body.addressTo;
    if (!toAddress) {
      console.log("Invalid 'to' address");
      return res.json({ success: false, message: 'Invalid Solana wallet address.' });
    }

    // Load admin wallet secret from environment
    let walletKey = process.env.wk; // base58-encoded
    if (!walletKey) {
      return res.json({ success: false, message: 'Admin wallet secret not set in env' });
    }

    let secretKey;
    try {
      secretKey = bs58.decode(walletKey);
    } catch (error) {
      console.error('Failed to decode walletKey:', error);
      return res.json({ success: false, message: 'Failed to decode wallet key' });
    }

    // Must be 64 bytes for Ed25519 secret
    if (secretKey.length !== 64) {
      return res.json({
        success: false,
        message: 'Invalid secret key size. Must be 64 bytes.'
      });
    }

    // Construct the admin wallet Keypair
    const walletKeyPair = Keypair.fromSecretKey(secretKey);

    // Connect to Solana
    const connection = new Connection(process.env.PROVIDER_URL);

    // Convert to lamports
    const lamports = Math.floor(requestedAmount * LAMPORTS_PER_SOL);

    // Get a fresh blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    // Build the transaction: admin => user
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: walletKeyPair.publicKey
    }).add(
      SystemProgram.transfer({
        fromPubkey: walletKeyPair.publicKey,
        toPubkey: new PublicKey(toAddress),
        lamports
      })
    );

    // -- Attempt the Solana send + confirm once --
    let signature;
    try {
      // Send
      signature = await connection.sendTransaction(transaction, [walletKeyPair]);
      // Confirm
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });
    } catch (err) {
      console.error('Error sending transaction:', err);
      return res.json({
        success: false,
        message: 'Transaction failed. Please try again.'
      });
    }

    // If we're here, transaction was successful
    // Update the user doc (subtract from in-game balance)
    if (!user.accounts.includes(toAddress)) {
      user.accounts.push(toAddress);
    }
    user.balance -= requestedAmount;
    await saveDocumentWithRetry(user);

    // Create a receipt
    const receipt = new Receipt({
      user_id: user._id,
      payment_method: 'Web3',
      payment_type: 'Withdraw',
      amount: requestedAmount
    });
    await saveDocumentWithRetry(receipt);

    // Create a gameTransaction
    const newTransaction = new gameTransaction({
      user: user._id,
      amount: -requestedAmount,
      description: 'withdraw',
      status: 'completed',
      hash: signature
    });
    await saveDocumentWithRetry(newTransaction);

    // Log the withdrawal in GameLog
    const newGameLog = new GameLog({
      room: null,
      creator: user._id,
      joined_user: null,
      game_type: null,
      bet_amount: requestedAmount,
      selected_rps: '',
      commission: 0,
      game_result: 777,
      winnings: 0,
      endgame_amount: 0,
      host_pr: 0,
      user_bet: 0,
      status: 'complete',
      hosts: []
    });
    await saveDocumentWithRetry(newGameLog);

    console.log(
      `View on Explorer: https://explorer.solana.com/tx/${signature}`
    );

    return res.json({
      success: true,
      balance: user.balance,
      newTransaction,
      message: `Withdrawal request completed. 🤑`
    });
  } catch (e) {
    console.log('ERROR in /withdraw_request route:', e);
    return res.json({ success: false, message: 'Failed to initiate withdrawal' });
  }
});


async function estimateAmount(web2Amount, currencyTo) {

  try {
    const priceResponse = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMintAddress}`);
    const tokenPrice = parseFloat(priceResponse.data.pairs[0]?.priceUsd);

    if (tokenPrice == null || isNaN(tokenPrice)) {
      console.error("Token price not found or invalid.");
      throw new Error('Token price not found or invalid.');
    }

    const adjustedAmount = tokenPrice * web2Amount;
    const response = await axios.get(`https://api.nowpayments.io/v1/estimate`, {
      params: {
        amount: adjustedAmount,
        currency_from: 'usd',
        currency_to: currencyTo,
      },
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    return response.data;

  } catch (error) {
    console.error('Error estimating amount:', error.message);
    throw new Error('Failed to estimate amount.');
  }
}

router.post('/get_gasfee', auth, async (req, res) => {
  try {
    const { amount, addressTo } = req.body;
    if (!amount || !addressTo) {
      return res.status(400).json({ success: false, message: 'Amount and recipient address are required' });
    }

    const connection = new Connection(process.env.PROVIDER_URL);
    const { blockhash } = await connection.getLatestBlockhash();
    // Use the provided wallet address as fee payer.
    const feePayer = new PublicKey(addressTo);
    // The amount (in SOL) is irrelevant for fee calculation, but we still use it to construct an instruction.
    const lamports = typeof amount === 'number' ? amount * 1e9 : 0;  // Convert SOL to lamports

    // Create a transaction that transfers lamports from the fee payer to itself.
    const transaction = new Transaction({ recentBlockhash: blockhash, feePayer });
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: feePayer,
        toPubkey: feePayer,
        lamports: lamports,
      })
    );

    // Get the fee for this transaction message.
    const feeResponse = await connection.getFeeForMessage(transaction.compileMessage());
    if (feeResponse === null) {
      throw new Error("Unable to fetch fee. The blockhash might be expired or invalid.");
    }
    
    // feeResponse can be a number or an object with a `value` property.
    const feeLamports = (typeof feeResponse === 'object' && feeResponse !== null && feeResponse.value !== undefined)
      ? feeResponse.value
      : feeResponse;
    const gasFeeSol = (feeLamports / 1e9) * 3; // Convert lamports to SOL

    return res.json({ success: true, data: gasFeeSol });
  } catch (error) {
    console.error('Error fetching Solana gas fee:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
