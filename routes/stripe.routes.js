const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const sendgrid = require('../helper/sendgrid');
const Receipt = require('../model/Receipt');
const Transaction = require('../model/Transaction');
const { newTransaction } = require('../socketController');
const stripe = require('stripe')('sk_live_B8xrL7Gp2elKyanYJ0Zi5IqS00EKxOnhjP');
const { ethers } = require('ethers');
// const ganacheEndpoint = 'http://localhost:7544';
// const provider = new JsonRpcProvider(ganacheEndpoint); 
const { JsonRpcProvider } = require('@ethersproject/providers');
const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/5fedb9ded8fd4b149026d0140baacf98');
const walletKey = process.env.wk;
const API_KEY = 'ZBZK3XM-QNHM89H-MKXVFCD-TV6MW1N';


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
    // Extract payment details from query parameters
    const { web2Amount, currencyTo } = req.query;
    // Make GET request to NowPayments API to estimate amount
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

    // Extract estimated amount from response
    const estimatedAmount = response.data;

    // Send estimated amount as JSON response
    res.json(estimatedAmount);
  } catch (error) {
    console.error('Error estimating amount: ', error);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate amount.',
    });
  }
});


router.post('/validate_address', auth, async (req, res) => {
  try {
    // Extract payment details from request body
    const { sendAddress, currencyTo } = req.body;

    const payload = {
      address: sendAddress,
      currency: currencyTo,
    };

    const response = await axios.post('https://api.nowpayments.io/v1/payout/validate-address', payload, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Extract status from response data
    const { status } = response.data;

    // Return true if status is "OK", otherwise return false
    res.json(status === 200);
  } catch (error) {
    console.error('Invalid payout_address: ', error);
    res.status(500).json({
      success: false,
      message: 'Invalid payout address, please ensure the network is correct.',
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
    newTransaction.status = 'waiting';

    await newTransaction.save();

    const receipt = new Receipt({
      user_id: user_id,
      payment_method: 'Web2',
      payment_type: 'Deposit',
      amount: calculateAmount(price_amount),
    });

    await receipt.save();

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
  switch (price_amount) {
    case 10:
      return 14.28;
    case 25:
      return 42.71;
    case 50:
      return 85.42;
    case 100:
      return 163.85;
    case 250:
      return 385.14;
    default:
      return 0; // Or handle invalid price_amount accordingly
  }
}

router.post('/generate_address', auth, async (req, res) => {
  try {

    // Extract payment details from request body
    const { web2Amount, currencyTo } = req.body;
    console.log("generate_address: ", web2Amount, currencyTo )

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

// WITHDRAWAL
router.post('/create_payout', auth, async (req, res) => {
  try {
    // Extract payment details from request body
    const { address, currency, amount, extra_id, user_id } = req.body;
    const balance = req.user.balance;
    const withdrawalLimit = req.user.dailyWithdrawals;
    if (balance < req.body.amount) {
      return res.json({
        success: false,
        message: 'INSUFFICIENT FUNDS'
      });
    }
    if (withdrawalLimit > 0.02) {
      console.log("Exceeded Daily Withdrawal Limit", req.user);
      return res.json({
        success: false,
        message: 'EXCEEDED DAILY WITHDRAWAL LIMIT (DURING LAUNCH PHASE ONLY!)'
      });
    }
    if (req.body.amount > 0.02) {
      console.log("Large amount", req.user);
      return res.json({
        success: false,
        message: 'Maximum Withdrawal Amount is 0.02 Eth per transaction'
      });
    }
    const remainingLoanAmount = await calculateRemainingLoans(req.user);
    if (remainingLoanAmount > 0) {
      return res.json({
        success: false,
        message: 'EXISTING LOANS, CANNOT WITHDRAW'
      });
    }

    const newTransaction = new Transaction({
      user: user_id,
      address: address,
      amount: amount,
      description: 'withdrawal',
      currency: currency,
      hash: id,
      extra_id: extra_id
    });

    // Mark the transaction as pending (to be confirmed by the cron job)
    newTransaction.status = 'waiting';

    await newTransaction.save();

    const receipt = new Receipt({
      user_id: user_id,
      payment_method: 'Web2',
      payment_type: 'Withdrawal',
      amount: amount,
    });

    await receipt.save();

    res.json({
      success: true,
      message: `Please wait for confirmations.<br /> You can view the status in your 'All Transactions' history.`,
    });

  } catch (error) {
    console.error('Invalid payout_address: ', error);
    res.status(500).json({
      success: false,
      message: 'Invalid payout address, please ensure the network is correct.',
    });
  }
});


// **************************************** //
// ************* WEB3 ********************* //
// **************************************** //

router.post('/deposit_successed', auth, async (req, res) => {
  try {
    const { amount, txtHash } = req.body;

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
    const wamount = ethers.utils.parseUnits(amount, 'ether');

    if (Number(tx.value) != Number(wamount) || tx.to !== signer.address) {
      return res.status(400).send('Transaction does not match with input');
    }

    // The cron job will periodically check for confirmations and update the balance
    // No need to update the balance here
    const newTransaction = new Transaction({
      user: req.user._id,
      amount: req.body.amount,
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
      amount: req.body.amount,
    });

    await receipt.save();

    res.json({
      success: true,
      balance: req.user.balance + req.body.amount,
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
    const balance = req.user.balance;
    const withdrawalLimit = req.user.dailyWithdrawals;
    if (balance < req.body.amount) {
      return res.json({
        success: false,
        message: 'INSUFFICIENT FUNDS'
      });
    }
    if (withdrawalLimit > 0.02) {
      console.log("Exceeded Daily Withdrawal Limit", req.user);
      return res.json({
        success: false,
        message: 'EXCEEDED DAILY WITHDRAWAL LIMIT (DURING LAUNCH PHASE ONLY!)'
      });
    }
    if (req.body.amount > 0.02) {
      console.log("Large amount", req.user);
      return res.json({
        success: false,
        message: 'Maximum Withdrawal Amount is 0.02 Eth per transaction'
      });
    }

    // Check if the "to" address is provided and starts with "0x"
    const toAddress = req.body.addressTo;
    if (!toAddress || !toAddress.startsWith('0x')) {
      console.log("Invalid 'to' address");
      return res.json({
        success: false,
        message: "No wallet connected / wrong network."
      });
    }

    const remainingLoanAmount = await calculateRemainingLoans(req.user);
    if (remainingLoanAmount > 0) {
      return res.json({
        success: false,
        message: 'EXISTING LOANS, CANNOT WITHDRAW'
      });
    }
    const receipt = new Receipt({
      user_id: req.user._id,
      payment_method: 'Web3',
      payment_type: 'Withdraw',
      amount: req.body.amount,
    });
    await receipt.save();


    // console.log("User's balance:", req.user.balance);
    // console.log("Requested withdrawal amount:", req.body.amount);

    // console.log("Calculating gas fees...");

    const newTransaction = new Transaction({
      user: req.user,
      amount: -req.body.amount,
      description: 'withdraw',
      status: 'pending',  // Mark the transaction as pending
      hash: tx.hash
    });

    // Save the transaction as pending
    await newTransaction.save();

    return res.json({
      success: true,
      balance: req.user.balance - req.body.amount,
      newTransaction,
      message: `Withdrawal request received and is pending confirmation. 🤑 Much Wow.<br /> View the transaction details on the blockchain using this <a href="https://etherscan.io/tx/${tx.hash}" target="_blank">transaction link</a>.`
    });
  } catch (e) {
    console.log('ERROR in withdraw_request', e);
    return res.json({
      success: false,
      message: 'Failed to initiate withdrawal'
    });
  }
});

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
