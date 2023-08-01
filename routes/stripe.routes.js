const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const sendgrid = require('../helper/sendgrid');

const Receipt = require('../model/Receipt');
const Transaction = require('../model/Transaction');
const { newTransaction } = require('../socketController');
const stripe = require('stripe')('sk_live_B8xrL7Gp2elKyanYJ0Zi5IqS00EKxOnhjP');
const ethers = require('ethers');
const { JsonRpcProvider } = require('@ethersproject/providers');
const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/3f535fe3cae1467a92d14001d9754c09'); // Replace 'YOUR_INFURA_PROJECT_ID' with your actual Infura project ID.
const walletKey = process.env.WK;

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

router.post('/deposit_successed', auth, async (req, res) => {
  try {
    req.user.balance = Number(req.user.balance) + Number(req.body.amount);
    await req.user.save();
    const newTransaction = new Transaction({
      user: req.user,
      amount: req.body.amount,
      description: 'deposit'
    });
    await newTransaction.save();

    const receipt = new Receipt({
      user_id: req.user._id,
      payment_method: req.body.payment_method,
      payment_type: 'Deposit',
      amount: req.body.amount
    });
    await receipt.save();
    res.json({
      success: true,
      balance: req.user.balance,
      newTransaction,
      message: 'ACCOUNT LOADED 🤑 MUCH WOW!!'
    });
  } catch (err) {
    console.log('error in deposit_successed', err);
    res.json({
      success: false,
      message: err
    });
  }
});

router.post('/withdraw_request', auth, async (req, res) => {
  try {
    const receipt = new Receipt({
      user_id: req.user._id,
      email: req.body.email,
      amount: req.body.amount
    });
    const balance = req.user.balance;
    if (balance < req.body.amount) {
      return res.json({
        success: false,
        message: 'Insufficient funds'
      });
    }
    console.log(req.body.addressTo, req.body.amount);
    try {
      const signer = new ethers.Wallet(walletKey, provider);
      const amountTransfer = ethers.utils.parseUnits(String(req.body.amount), 'ether');
      const tx = await signer.sendTransaction({
        to: req.body.addressTo,
        value: amountTransfer,
        gasLimit: ethers.utils.hexlify(Number(500000)),
        gasPrice: ethers.utils.hexlify(
          Number(ethers.utils.parseUnits(String(10), 'gwei'))
        )
      });
      console.log(`Tx-hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Sell Tx was mined in block: ${receipt.blockNumber}`);
    } catch (e) {
      console.log(e);
      return res.json({
        success: false,
        message: 'Failed in sending transaction'
      });
    }
    await receipt.save();
    const newTransaction = new Transaction({
      user: req.user,
      amount: -req.body.amount,
      description: 'withdraw'
    });
    req.user.balance = Number(req.user.balance) - Number(req.body.amount);
    await req.user.save();
    await newTransaction.save();
    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction,
      message: 'GREAT SUCCESS! 🧀 VERY NICE!!'
    });
  } catch (e) {
    console.log('ERROR in withdraw send transaction');
    return res.json({
      success: false,
      message: e
    });
  }
});

module.exports = router;
