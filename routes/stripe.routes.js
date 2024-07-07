const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const sendgrid = require('../helper/sendgrid');
const Receipt = require('../model/Receipt');
const GameLog = require('../model/GameLog');
const Transaction = require('../model/Transaction');
const { newTransaction } = require('../socketController');
const stripe = require('stripe')('sk_live_B8xrL7Gp2elKyanYJ0Zi5IqS00EKxOnhjP');
const { ethers } = require('ethers');
// const ganacheEndpoint = 'http://localhost:7544';
const jwt = require('jsonwebtoken');
// const provider = new JsonRpcProvider(ganacheEndpoint); 
const { JsonRpcProvider } = require('@ethersproject/providers');
const { getAddress } = require('ethers/lib/utils');
const provider = new JsonRpcProvider(process.env.PROVIDER_URL);
const walletKey = process.env.wk;
const API_KEY = process.env.API_KEY;


async function getWalletBalance(signer) {
  const walletAddress = await signer.getAddress();
  const balance = await signer.provider.getBalance(walletAddress);
  const balanceInEther = ethers.utils.formatEther(balance);
  return balanceInEther;
}

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
    const estimatedAmount = await estimateAmount(web2Amount, currencyTo);
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
// ************* FIAT ********************* //
// **************************************** //

router.post('/secret', auth, async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'gbp',
      // Verify your integration in this guide by including this parameter
      metadata: { integration_check: 'accept_a_payment' }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (err) {
    res.json({
      success: false,
      message: err
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


// DEPOSIT
router.post('/create_payment', auth, async (req, res) => {
  try {
    // Extract payment details from request body
    const { price_amount, payment_id, user_id } = req.body;
    if (payment_id !== null) {
      // Prevent double spending
      const usedTransactions = await Transaction.find({
        hash: payment_id,
      });

      if (usedTransactions.length > 0) {
        return res.status(400).send('Transaction has already been used');
      }
    }
    const newTransaction = new Transaction({
      user: user_id,
      amount: calculateAmount(price_amount),
      description: 'deposit',
      hash: payment_id,
    });

    // Mark the transaction as pending (to be confirmed by the cron job)
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

function calculateAmount(price_amount) {
  return price_amount / 0.59523;
}
function calculateAmountWeb3(price_amount) {
  switch (price_amount) {
    case 10:
      return price_amount / 0.59523 + 0.589;
    case 25:
      return price_amount / 0.59523 + (2 * 0.589);
    case 50:
      return price_amount / 0.59523 + (3 * 0.589);
    case 100:
      return price_amount / 0.59523 + (4 * 0.589);
    case 250:
      return price_amount / 0.59523 + (5 * 0.589);
    default:
      return 0; // Or handle invalid price_amount accordingly
  }
}

router.post('/generate_address', auth, async (req, res) => {
  try {

    // Extract payment details from request body
    const { web2Amount, currencyTo } = req.body;

    const payload = {
      price_amount: web2Amount,
      price_currency: 'usd',
      pay_currency: currencyTo,
    };

    // Make POST request to NowPayments API to create payment
    const response = await axios.post('https://api.nowpayments.io/v1/payment', payload, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Extract payment data from response
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

router.post('/get_price', auth, async (req, res) => {
  try {
    // Extract payment details from request body
    const { web2Amount, currencyTo } = req.body;

    // Make GET request to NowPayments API to get estimated price
    const response = await axios.get(`https://api.nowpayments.io/v1/estimate?amount=${web2Amount}&currency_from=usd&currency_to=${currencyTo}`, {
      headers: {
        'x-api-key': API_KEY,
      },
    });

    // Extract estimated price data from response
    const estimatedPriceData = response.data;

    res.json(estimatedPriceData);
  } catch (error) {
    console.error('Error getting estimated price:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while getting estimated price',
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

    if (withdrawalLimit >= 100) {
      return res.json({
        success: false,
        message: 'EXCEEDED DAILY WITHDRAWAL LIMIT (DURING LAUNCH PHASE ONLY!)'
      });
    }

    if (amount > 100) {
      return res.json({
        success: false,
        message: 'Maximum Withdrawal Amount is 100 RPS per DAY during Launch'
      });
    }

    const remainingLoanAmount = await calculateRemainingLoans(req.user);
    if (remainingLoanAmount > 0) {
      return res.json({
        success: false,
        message: 'EXISTING LOANS, CANNOT WITHDRAW'
      });
    }
    const email = 'lennybeadle@gmail.com';
    const password = 'Utrecht2156$';
    // Extract JWT token from authorization header
    const token = await getJWTToken(email, password);
    let newAmount;
    const retryLimit = 3;
    let attempt = 0;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt < retryLimit) {
      try {
        // Attempt to estimate the new amount
        newAmount = await estimateAmount((req.body.amount * 0.579), currency);

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

    // Construct payload for NowPayments API
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

    // Make request to NowPayments API with token from the authorization header
    const response = await axios.post('https://api.nowpayments.io/v1/payout', payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY, // Replace with your actual API key
        'Content-Type': 'application/json',
      }
    });

    // Save transaction and receipt after successful withdrawal
    const newTransaction = new Transaction({
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
      // Create and save a new game log
      const newGameLog = new GameLog({
        room: null, // Assign appropriate value
        creator: req.user._id,
        joined_user: null, // Assign appropriate value
        game_type: null, // Assign appropriate value
        bet_amount: amount,
        selected_rps: '', // Assign appropriate value
        commission: 0, // Adjust as necessary
        game_result: 0, // Adjust as necessary
        winnings: 0, // Adjust as necessary
        endgame_amount: 0, // Adjust as necessary
        host_pr: 0, // Adjust as necessary
        user_bet: 0, // Adjust as necessary
        status: 'pending', // Adjust as necessary
        hosts: [] // Assign appropriate value
      });

      try {
        await newGameLog.save();
      } catch (error) {
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
        newGameLog, // Include the new game log in the response
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

// Function to get the JWT token from NOWPayments
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
// ************* WEB3 ********************* //
// **************************************** //

router.post('/deposit_successed', auth, async (req, res) => {
  try {
    const { amount, price_amount, txtHash } = req.body;

    // Validate the input
    if (!amount || !txtHash) {
      return res.status(400).send('Invalid input');
    }

    // Prevent double spending
    const usedTransactions = await Transaction.find({
      hash: txtHash,
    });

    if (usedTransactions.length > 0) {
      return res.status(400).send('Transaction has already been used');
    }

    // Query the Ethereum network to get transaction details
    const tx = await provider.getTransaction(txtHash);

    // Check if the transaction exists and is confirmed
    if (!tx || !tx.blockNumber) {
      return res.status(404).send('Transaction not found or not confirmed');
    }

    // Check if the transaction matches with the amount and the addresses
    const signer = new ethers.Wallet(walletKey, provider);
    const wamount = ethers.utils.parseUnits(amount.toString(), 'ether');

    if (Number(tx.value) != Number(wamount) || tx.to !== signer.address) {
      return res.status(400).send('Transaction does not match with input');
    }
    // console.log("wamount", wamount);
    const rpsAmount = calculateAmountWeb3(price_amount)
    // The cron job will periodically check for confirmations and update the balance
    // No need to update the balance here
    const newTransaction = new Transaction({
      user: req.user._id,
      amount: rpsAmount,
      description: 'deposit',
      hash: txtHash,
    });

    // Mark the transaction as pending (to be confirmed by the cron job)
    newTransaction.status = 'pending';

    await newTransaction.save();

    const receipt = new Receipt({
      user_id: req.user._id,
      payment_method: 'Web3',
      payment_type: 'Deposit',
      amount: rpsAmount,
    });

    await receipt.save();

    res.json({
      success: true,
      balance: req.user.balance + rpsAmount,
      newTransaction,
      message: `Deposit received! Please wait for confirmations.<br />View transaction details <a href="https://etherscan.io/tx/${txtHash}" target="_blank">here</a>.`,
    });
  } catch (err) {
    console.log('error in deposit_successed', err);
    res.json({
      success: false,
      message: err,
    });
  }
});

router.post('/withdraw_request', auth, async (req, res) => {

  let tx;
  try {
    const username = req.user.username;
    const totalWagered = req.user.totalWagered;

    if (username.includes('BOT')) {
      return res.json({
        success: false,
        message: 'DO NOT HAVE PERMISSION'
      });
    }
    if (totalWagered === 0) {
      return res.json({
        success: false,
        message: 'ACCOUNT TOO NEW'
      });
    }

    const balance = req.user.balance;
    const withdrawalLimit = req.user.dailyWithdrawals;

    if (balance < req.body.amount) {

    }

    if (withdrawalLimit > 100) {
      console.log("Exceeded Daily Withdrawal Limit", req.user);
      return res.json({
        success: false,
        message: 'EXCEEDED DAILY WITHDRAWAL LIMIT (DURING LAUNCH PHASE ONLY!)'
      });
    }
    if (req.body.amount > 100) {
      return res.json({
        success: false,
        message: 'Maximum Withdrawal Amount is 100 RPS per DAY during Launch'
      });
    }

    const remainingLoanAmount = await calculateRemainingLoans(req.user);
    if (remainingLoanAmount > 0) {
      return res.json({
        success: false,
        message: 'EXISTING LOANS, CANNOT WITHDRAW'
      });
    }

    const toAddress = req.body.addressTo;
    if (!toAddress || !toAddress.startsWith('0x')) {
      console.log("Invalid 'to' address");
      return res.json({
        success: false,
        message: "No wallet connected / wrong network."
      });
    }

    const signer = new ethers.Wallet(walletKey, provider);
    try {
      const estimatedAmount = await estimateAmount((req.body.amount * 0.589), 'eth');
      const amountTransfer = ethers.utils.parseUnits(String(estimatedAmount.estimated_amount), 'ether');
      const block = await provider.getBlock('latest');
      const baseFeeGwei = ethers.utils.formatUnits(block.baseFeePerGas, 'gwei');
      const priorityFeeGwei = '2.5';
      const gasLimit = await provider.estimateGas({
        to: req.body.addressTo,
        value: amountTransfer
      });

      // Calculate gas fee in wei
      const gasPrice = ethers.utils.parseUnits(baseFeeGwei, 'gwei')
        .add(ethers.utils.parseUnits(priorityFeeGwei, 'gwei'));
      const gasFee = gasPrice.mul(gasLimit);
      const balanceInEther = await getWalletBalance(signer);
      const balanceWei = ethers.utils.parseEther(balanceInEther);
      // Subtract gas fee from balance in wei
      const differenceWei = balanceWei.sub(gasFee);

      // console.log("Balance in Wei:", balanceWei.toString());
      // console.log("Gas Fee in Wei:", gasFee.toString());
      // console.log("Difference in Wei:", differenceWei.toString());
      if (differenceWei.lt(0)) {
        console.log("Insufficient funds to cover gas fee");
        return res.json({
          success: false,
          message: 'Insufficient funds to cover gas fee'
        });
      }

      const real = amountTransfer.sub(gasFee);
      const realEth = ethers.utils.formatEther(real);

      // console.log("Sending transaction...", real);

      req.user.balance = req.user.balance - req.body.amount;

      try {
        await req.user.save();
      } catch (saveError) {
        console.error('Failed to save user balance:', saveError);
        return res.json({
          success: false,
          message: 'Failed to save user balance'
        });
      }

      tx = await signer.sendTransaction({
        to: req.body.addressTo,
        value: real,
        gasLimit: ethers.utils.hexlify(gasLimit),
        gasPrice: ethers.utils.hexlify(gasPrice)
      });

      console.log("Transaction hash:", tx.hash);

      const receipt = await tx.wait();

      console.log("Transaction mined in block:", receipt.blockNumber);

    } catch (e) {
      console.log(e);
      return res.json({
        success: false,
        message: 'Failed in sending transaction'
      });
    }

    const receipt = new Receipt({
      user_id: req.user._id,
      payment_method: 'Web3',
      payment_type: 'Withdraw',
      amount: req.body.amount,
    });

    await receipt.save();
    const newTransaction = new Transaction({
      user: req.user,
      amount: -req.body.amount,
      description: 'withdraw',
      status: 'completed',
      hash: tx.hash
    });

    // req.user.balance = await getWalletBalance(signer);

    await newTransaction.save();
    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction,
      message: `Withdrawal request received and is pending confirmation. 🤑 Much Wow.<br /> View the transaction details on the blockchain using this <a href="https://etherscan.io/tx/${tx.hash}" target="_blank">transaction link</a>.`
    });
  } catch (e) {
    console.log('ERROR in withdraw send transaction', e);
    return res.json({
      success: false,
      message: 'Failed to initiate withdrawal'
    });
  }
});

async function estimateAmount(web2Amount, currencyTo) {
  try {
    const response = await axios.get(`https://api.nowpayments.io/v1/estimate`, {
      params: {
        amount: web2Amount,
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
    console.error('Error estimating amount: ', web2Amount, currencyTo);
    throw new Error('Failed to estimate amount.');
  }
}

router.post('/get_gasfee', auth, async (req, res) => {
  // console.log("Qd", process.env)
  const amount = req.body.amount ? req.body.amount : "0";
  const amountTransfer = ethers.utils.parseUnits(amount, 'ether');

  try {
    const block = await provider.getBlock('latest')
    const baseFeeGwei = ethers.utils.formatUnits(block.baseFeePerGas, 'gwei')
    const priorityFeeGwei = '2.5';
    const gasLimit = await provider.estimateGas({
      to: req.body.addressTo,
      value: amountTransfer
    });

    // Calculate gas fee in wei
    const gasFee = ethers.utils.parseUnits(baseFeeGwei, 'gwei')
      .add(ethers.utils.parseUnits(priorityFeeGwei, 'gwei')).mul(gasLimit);

    const gasFeeEth = ethers.utils.formatEther(gasFee);

    return res.json({ data: gasFeeEth });
  } catch (error) {
    return res.status(400).send(error.message);
  }
})


module.exports = router;
