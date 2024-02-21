const express = require('express');
const router = express.Router();

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

async function getWalletBalance(signer) {
  const walletAddress = await signer.getAddress();

  const balance = await signer.provider.getBalance(walletAddress);

  const balanceInEther = ethers.utils.formatEther(balance);

  return balanceInEther;
}

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
      user: req.user,
      amount: req.body.amount,
      description: 'deposit',
      hash: txtHash,
    });
    
    // Mark the transaction as pending (to be confirmed by the cron job)
    newTransaction.status = 'pending';
    
    await newTransaction.save();
    
    const receipt = new Receipt({
      user_id: req.user._id,
      // payment_method: req.body.payment_method,
      payment_type: 'Deposit',
      amount: req.body.amount,
    });
    
    await receipt.save();

    res.json({
      success: true,
      balance: req.user.balance + req.body.amount,
      newTransaction,
      message: `Deposit received! Please wait for confirmations.<br />View transaction details <a href="https://etherscan.io/tx/${txtHash}" target="_blank">here</a>. You may need to refresh.`,
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
    const receipt = new Receipt({
      user_id: req.user._id,
      // payment_method: req.body.payment_method,
      payment_type: 'Withdraw',
      amount: req.body.amount,
    });
    await receipt.save();

   
    // console.log("User's balance:", req.user.balance);
    // console.log("Requested withdrawal amount:", req.body.amount);

    // console.log("Calculating gas fees...");

    const signer = new ethers.Wallet(walletKey, provider);

    try {
      const amountTransfer = ethers.utils.parseUnits(String(req.body.amount), 'ether');

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

      if ((req.user.balance - req.body.amount < 0) || (parseFloat(req.user.dailyWithdrawals) + parseFloat(req.body.amount) > 0.2)) {
        console.log("Insufficient funds");
        return res.json({
          success: false,
          message: 'Insufficient funds'
        });
      }
      // Update the user's balance accordingly
      req.user.balance = req.user.balance - parseFloat(req.body.amount);
      req.user.dailyWithdrawals = parseFloat(req.user.dailyWithdrawals) + parseFloat(req.body.amount);
      await req.user.save();

      console.log("Sending transaction...");

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

    return res.json({ data: gasFeeEth});
  } catch(error) {
    return res.status(400).send(error.message);
  }
})

module.exports = router;
