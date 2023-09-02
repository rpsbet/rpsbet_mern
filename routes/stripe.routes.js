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
const cron = require('node-cron');
// const ganacheEndpoint = 'http://localhost:7544';
// const provider = new JsonRpcProvider(ganacheEndpoint); 
const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/3f535fe3cae1467a92d14001d9754c09'); // Replace 'YOUR_INFURA_PROJECT_ID' with your actual Infura project ID.
const walletKey = process.env.WK;

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
// Define a function to process deposits securely
const processDeposit = async (user, amount, txtHash) => {
  try {
    // Check if the transaction hash has already been processed
    const usedTransactions = await Transaction.find({ hash: txtHash });
    if (usedTransactions.length > 0) {
      console.log('Transaction has been already used');
      return;
    }

    // Retrieve the Ethereum transaction
    const tx = await provider.getTransaction(txtHash);

    // Check if the transaction is confirmed on the blockchain
    if (!tx || !tx.blockNumber) {
      console.log('Transaction not found or not confirmed');
      return;
    }

    // Verify that the transaction matches with the expected details
    const signer = new ethers.Wallet(walletKey, provider);
    const wamount = ethers.utils.parseUnits(amount, 'ether');

    if (tx.to !== signer.address || !tx.value.eq(wamount)) {
      console.log('Transaction does not match with input');
      return;
    }

    // Update the user's balance
    user.balance = Number(user.balance) + Number(amount);
    await user.save();

    // Save the transaction details
    const newTransaction = new Transaction({
      user: user,
      amount: amount,
      description: 'deposit',
      hash: txtHash,
    });
    await newTransaction.save();

    // Create a receipt and log success
    const receipt = new Receipt({
      user_id: user._id,
      payment_method: req.body.payment_method,
      payment_type: 'Deposit',
      amount: amount,
    });
    await receipt.save();

    console.log('Deposit processed successfully');
  } catch (err) {
    console.log('Error in processing deposit:', err);
  }
};

// Schedule a cron job to regularly process deposits (e.g., every minute)
cron.schedule('* * * * *', async () => {
  try {
    // Query the database for pending deposits (you may need a deposit queue)
    const pendingDeposits = await PendingDeposit.find();

    for (const deposit of pendingDeposits) {
      // Process each pending deposit securely
      await processDeposit(deposit.user, deposit.amount, deposit.txtHash);

      // Remove the processed deposit from the queue
      await deposit.remove();
    }
  } catch (err) {
    console.log('Error in cron job:', err);
  }
});

// Handle deposit requests
router.post('/deposit_successed', auth, async (req, res) => {
  try {
    const { amount, txtHash } = req.body;

    // Validate the input
    if (!amount || !txtHash) {
      return res.status(400).send('Invalid input');
    }

    // Save the deposit as pending for later processing by the cron job
    const pendingDeposit = new PendingDeposit({
      user: req.user,
      amount: amount,
      txtHash: txtHash,
    });
    await pendingDeposit.save();

    res.json({
      success: true,
      message: 'Deposit request received and pending processing',
    });
  } catch (err) {
    console.log('Error in deposit_successed', err);
    res.json({
      success: false,
      message: err,
    });
  }
});


router.post('/withdraw_request', auth, async (req, res) => {
  let tx;
  try {
    const receipt = new Receipt({
      user_id: req.user._id,
      email: req.body.email,
      amount: req.body.amount
    });
    const balance = req.user.balance;
    console.log("User's balance:", req.user.balance);
    console.log("Requested withdrawal amount:", req.body.amount);

    if (balance < req.body.amount) {
      console.log("Insufficient funds");
      return res.json({
        success: false,
        message: 'Insufficient funds'
      });
    }

    // console.log("Calculating gas fees...");

    // console.log(req.body.addressTo, req.body.amount);
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
    
    await receipt.save();
    const newTransaction = new Transaction({
      user: req.user,
      amount: -req.body.amount,
      description: 'withdraw'
    });
    req.user.balance = Number(req.user.balance) - Number(req.body.amount);
    // req.user.balance = await getWalletBalance(signer);

    await req.user.save();
    await newTransaction.save();

    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction,
      message: `Withdrawal successful! 🤑 Much Wow.<br /> View the transaction details on the blockchain using this <a href="https://etherscan.io/tx/${tx.hash}" target="_blank">transaction link</a>.`
    });
  } catch (e) {
    console.log('ERROR in withdraw send transaction', e);
    return res.json({
      success: false,
      message: 'Failed to initiate withdrawal'
    });
  }
});


router.post('/get_gasfee', auth, async (req, res) => {
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
