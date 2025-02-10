/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
var ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const socket = require('../socketController.js');
const moment = require('moment');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const check_access_time = require('../helper/util/checkAccessTime');
const router = express.Router();
const Loan = require('../model/Loan');
const Notification = require('../model/Notification');
const User = require('../model/User');
const Transaction = require('../model/Transaction');

router.post('/create-and-lend', auth, async (req, res) => {
  try {
    const { loan_amount, loan_period, apy, lender } = req.body;
    const parsedLoanAmount = parseFloat(loan_amount);
    const parsedLoanPeriod = parseFloat(loan_period);
    const parsedApy = parseFloat(apy);
    const currentUser = await User.findOne({ _id: req.user._id });

    const accessAllowed = await check_access_time(currentUser._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000
      });
    }

    const isEligible = await checkLoanEligibility(currentUser, loan_amount);

    if (!isEligible) {
      return res.json({
        success: false,
        message: 'This account is currently not eligible for loaning this amount. Try again another time or another amount.',
      });
    }


    if (!loan_amount || !loan_period || !apy || !lender) {
      return res.json({
        success: false,
        error: 'Please enter all fields'
      });
    }

    if (isNaN(parsedLoanAmount) || parsedLoanAmount <= 0 ||
      isNaN(parsedLoanPeriod) || parsedLoanPeriod <= 0 ||
      isNaN(parsedApy) || parsedApy <= 0) {
      return res.json({
        success: false,
        message: 'Loan amount, loan period, and APY must be valid positive numbers',
      });
    }

    const originalLender = await User.findOne({ _id: lender });
    if (!originalLender || originalLender.balance <= 0) {
      return res.json({
        success: false,
        message: 'Insufficient funds or lender not found',
      });
    }

    let loanType = 'FULL';
    let updatedBalance = originalLender.balance - parsedLoanAmount;
    let remainingAmount = parsedLoanAmount;
    let oldBalance = originalLender.balance;

    if (updatedBalance < 0) {
      loanType = 'FRACTIONAL';
      remainingAmount = -updatedBalance;
      updatedBalance = 0
    }

    let newTransactionJ = new Transaction({
      user: currentUser._id,
      amount: parsedLoanAmount,
      description: `Loan from ${originalLender.username}`,
    });

    let newTransactionC = new Transaction({
      user: originalLender._id,
      amount: -parsedLoanAmount,
      description: `Loan created for ${currentUser.username}`,
    });

    let loanMessage = loanType === 'FRACTIONAL'
      ? `Fractional Loan created`
      : `Loan created`;

    let notificationJ = new Notification({
      from: originalLender._id,
      to: currentUser._id,
      room: '',
      amount: parsedLoanAmount,
      message: `Loan received ${(parsedLoanAmount)}`,
      is_read: false
    });

    let notificationC = new Notification({
      from: currentUser._id,
      to: originalLender._id,
      room: '',
      amount: -parsedLoanAmount,
      message: loanMessage,
      is_read: false
    });

    const loanObj = new Loan({
      lender: originalLender._id,
      loan_amount: parsedLoanAmount,
      loan_type: loanType,
      loan_period: parsedLoanPeriod,
      apy: parsedApy / 100,
      fractional_amount: loanType === 'FRACTIONAL' ? parsedLoanAmount / originalLender.balance : 0
    });

    if (loanType === 'FRACTIONAL') {
      loanObj.loaners.push({
        user: lender,
        amount: remainingAmount,
        apy: parsedApy / 100,
        period: parsedLoanPeriod,
        paidBack: 0,
        created_at: Date.now(),
        updated_at: Date.now()
      });
      newTransactionC.amount = -oldBalance;
      newTransactionC.description = `Fractional loan created`;
    }

    loanObj.loaners.push({
      user: currentUser._id,
      amount: parsedLoanAmount + (parsedLoanAmount * parsedApy / 100),
      apy: parsedApy / 100,
      period: parsedLoanPeriod,
      paidBack: 0,
      created_at: Date.now(),
      updated_at: Date.now()
    });

    currentUser.balance += parsedLoanAmount;
    originalLender.balance = updatedBalance;

    await Promise.all([
      saveDocumentWithRetry(newTransactionC),
      saveDocumentWithRetry(newTransactionJ),
      saveDocumentWithRetry(notificationC),
      saveDocumentWithRetry(notificationJ),
      saveDocumentWithRetry(loanObj),
      saveDocumentWithRetry(currentUser),
      saveDocumentWithRetry(originalLender)
    ]);

    socket.sendNotification(currentUser._id, {
      message: notificationJ.message,
      username: originalLender.username,
      amount: newTransactionJ.amount,
      avatar: originalLender.avatar,
      accessory: originalLender.accessory,
      rank: originalLender.totalWagered,
      created_at: moment().format('YYYY-MM-DD HH:mm'),
      created_at_str: moment().format('LLL'),
      updated_at: moment().format('YYYY-MM-DD HH:mm'),
    });

    socket.sendNotification(originalLender._id, {
      message: notificationC.message,
      amount: newTransactionC.amount,
      username: currentUser.username,
      avatar: currentUser.avatar,
      accessory: currentUser.accessory,
      rank: currentUser.totalWagered,
      created_at: moment().format('YYYY-MM-DD HH:mm'),
      created_at_str: moment().format('LLL'),
      updated_at: moment().format('YYYY-MM-DD HH:mm'),
    });

    res.json({
      success: true,
      balance: currentUser.balance,
      newTransaction: newTransactionJ,
      message: `LOAN 🤝 RECEIVED FROM ${originalLender.username} (${loanType})`,
    });

  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: "An error occurred during the loan creation and lending process",
      error: err.message,
    });
  }
});

router.post('/create', auth, async (req, res) => {
  try {
    const { _id, loan_amount, loan_period, apy } = req.body;
    const currentUser = req.user;

    if (!loan_amount || !loan_period || !apy) {
      return res.json({
        success: false,
        error: 'Please enter all fields'
      });
    }

    const accessAllowed = await check_access_time(currentUser._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000
      });
    }
    const isEligible = await checkLoanEligibility(currentUser, loan_amount);
    
    if (!isEligible) {
      return res.json({
        success: false,
        message: 'This account is currently not eligible for loaning this amount. Try again another time or another amount.',
      });
    }
    
    const parsedLoanAmount = parseFloat(loan_amount);
    const parsedLoanPeriod = parseFloat(loan_period);
    const parsedApy = parseFloat(apy);

    if (isNaN(parsedLoanAmount) || parsedLoanAmount <= 0 || parsedApy <= 0 || parsedLoanPeriod <= 0) {
      return res.json({
        success: false,
        message: 'Loan amount must be a valid positive number',
      });
    }

    if (isNaN(parsedLoanPeriod) || parsedLoanPeriod <= 0 || isNaN(parsedApy) || parsedApy <= 0) {
      return res.json({
        success: false,
        message: 'Loan period and APY must be valid positive numbers',
      });
    }
    
    if (currentUser.balance * 10 < parsedLoanAmount) {
      return res.json({
        success: false,
        message: 'Insufficient funds',
      });
    }
    
    const newTransaction = new Transaction({
      user: currentUser._id,
      amount: -parsedLoanAmount,
      description: 'Loan created',
    });

    let loanType = 'FULL';
    let remainingAmount = parsedLoanAmount;
    let updatedBalance = currentUser.balance - parsedLoanAmount;
    let oldBalance = currentUser.balance;
    if (updatedBalance < 0) {
      remainingAmount = -updatedBalance;
      updatedBalance = 0;
      loanType = 'FRACTIONAL';
    }

    currentUser.balance = updatedBalance;

    const notificationMessage = loanType === 'FRACTIONAL'
      ? `Fractional loan created`
      : `Loan created`;

    const notification = new Notification({
      from: currentUser._id,
      to: currentUser._id,
      amount: -parsedLoanAmount,
      room: '',
      message: notificationMessage,
      is_read: false
    });

    const notificationData = {
      message: notification.message,
      username: currentUser.username,
      amount: -parsedLoanAmount,
      avatar: currentUser.avatar,
      accessory: currentUser.accessory,
      rank: currentUser.totalWagered,
      created_at: moment().format('YYYY-MM-DD HH:mm'),
      created_at_str: moment().format('LLL'),
      updated_at: moment().format('YYYY-MM-DD HH:mm'),
    };

    const loanObj = new Loan({
      lender: _id,
      loan_amount: parsedLoanAmount,
      loan_period: parsedLoanPeriod,
      apy: parsedApy / 100,
      loan_type: loanType,
      fractional_amount: loanType === 'FRACTIONAL' ? parsedLoanAmount / oldBalance : 0
    });

    if (loanType === 'FRACTIONAL') {
      loanObj.loaners.push({
        user: currentUser._id,
        amount: remainingAmount,
        apy: parsedApy / 100,
        period: parsedLoanPeriod,
        paidBack: 0,
        created_at: Date.now(),
        updated_at: Date.now()
      });

      newTransaction.amount = -oldBalance;
      newTransaction.description = `Fractional loan created`;
    } else {
      newTransaction.description = `Loan created`;
    }

    socket.sendNotification(currentUser._id, notificationData);

    await Promise.all([
      saveDocumentWithRetry(loanObj),
      saveDocumentWithRetry(currentUser),
      saveDocumentWithRetry(newTransaction),
      saveDocumentWithRetry(notification),
    ]);


    res.json({
      success: true,
      message: 'NEW LOAN CREATED',
      balance: currentUser.balance,
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
});

const calculateCreditScore = (loan, loaner, lender, currentUser) => {
  const loanCreatedAt = new Date(loan.loaners[loaner].created_at);
  const daysSinceLoanCreated = Math.floor((Date.now() - loanCreatedAt.getTime()) / (1000 * 60 * 60 * 24));

  const loanPeriod = parseFloat(loan.loaners[loaner].period);
  let remainingLoanPeriod = loanPeriod - daysSinceLoanCreated;
  remainingLoanPeriod = Math.min(remainingLoanPeriod, 30);

  if (!currentUser.lenders.includes(loan.lender)) {
    currentUser.lenders.push(loan.lender);
  }

  const paidBack = parseFloat(loan.loaners[loaner].paidBack);
  let creditScoreIncrease = paidBack + remainingLoanPeriod;

  const reductionFactor = 0.77;
  creditScoreIncrease = creditScoreIncrease * (1 - reductionFactor);

  currentUser.credit_score += creditScoreIncrease;
  if (currentUser.credit_score >= 2000) {
    currentUser.credit_score = 2000;
  }
};

router.post('/payback', auth, async (req, res) => {
  try {
    const { loanId, paybackAmount } = req.body;
    const loan = await Loan.findOne({ _id: loanId });
    const currentUser = await User.findOne({ _id: req.user._id });

    let amount = parseFloat(paybackAmount);

    const accessAllowed = await check_access_time(currentUser._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000
      });
    }

    if (!loan) {
      return res.json({
        success: false,
        message: 'Loan not found',
      });
    }

    const loanerIndex = loan.loaners.findIndex((loanerObj) => loanerObj.user.equals(currentUser._id));

    if (loanerIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not the loaner of this loan',
      });
    }

    if (currentUser.balance < amount) {
      return res.json({
        success: false,
        message: 'Insufficient funds',
      });
    }

    if (amount <= 0 || amount > loan.loaners[loanerIndex].amount) {
      return res.json({
        success: false,
        message: 'Invalid amount. Please enter a valid number.',
      });
    }

    const lender = await User.findOne({ _id: loan.lender });
    const isLenderSameAsCurrentUser = lender._id.equals(currentUser._id);

    // Transactions and notifications for the current user
    const newTransactionC = new Transaction({
      user: currentUser._id,
      amount: -amount,
      description: `Repayed loan${isLenderSameAsCurrentUser ? '' : ` to ${lender.username}`}`,
    });

    const notificationC = new Notification({
      from: lender._id,
      to: currentUser._id,
      amount: -amount,
      room: '',
      message: `Repayed loan${isLenderSameAsCurrentUser ? '' : ` to ${lender.username}`}`,
      is_read: false
    });

    let notificationDataC = null;
    if (!isLenderSameAsCurrentUser) {
      notificationDataC = {
        message: notificationC.message,
        username: lender.username,
        amount: -amount,
        avatar: lender.avatar,
        accessory: lender.accessory,
        rank: lender.totalWagered,
        created_at: moment().format('YYYY-MM-DD HH:mm'),
        created_at_str: moment().format('LLL'),
        updated_at: moment().format('YYYY-MM-DD HH:mm'),
      };
    }

    // Only update lender if they are different from the current user
    if (!isLenderSameAsCurrentUser) {
      lender.balance += amount;

      // Transaction and notification for the lender
      const newTransactionJ = new Transaction({
        user: lender._id,
        amount: amount,
        description: `Received loan repayment from ${currentUser.username}`,
      });

      const notificationJ = new Notification({
        from: currentUser._id,
        to: lender._id,
        amount: amount,
        room: '',
        message: `Received loan repayment from ${currentUser.username}`,
        is_read: false
      });

      const notificationDataJ = {
        message: notificationJ.message,
        username: currentUser.username,
        amount: amount,
        avatar: currentUser.avatar,
        accessory: currentUser.accessory,
        rank: currentUser.totalWagered,
        created_at: moment().format('YYYY-MM-DD HH:mm'),
        created_at_str: moment().format('LLL'),
        updated_at: moment().format('YYYY-MM-DD HH:mm'),
      };

      await Promise.all([
        saveDocumentWithRetry(notificationJ),
        saveDocumentWithRetry(newTransactionJ),
      ]);

      socket.sendNotification(lender._id, notificationDataJ);
    }

    currentUser.balance -= amount;

    // Update loan and loaner information
    loan.loaners[loanerIndex].paidBack += amount;
    loan.loaners[loanerIndex].amount -= amount;

    // Only calculate credit score if the lender is different from the current user
    if (!isLenderSameAsCurrentUser) {
      if (loan.loaners[loanerIndex].amount <= 0.05) {
        calculateCreditScore(loan, loanerIndex, lender, currentUser);
        // loan.loaners.splice(loanerIndex, 1);
      }
    }

    await Promise.all([
      saveDocumentWithRetry(notificationC),
      saveDocumentWithRetry(currentUser),
      saveDocumentWithRetry(lender),
      saveDocumentWithRetry(loan),
      saveDocumentWithRetry(newTransactionC),
    ]);

    if (notificationDataC) {
      socket.sendNotification(currentUser._id, notificationDataC);
    }

    return res.json({
      success: true,
      message: `Loan ${(amount)} paid back successfully`,
      balance: currentUser.balance,
      newTransaction: newTransactionC,
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: 'An error occurred while processing the payback',
      error: err.message,
    });
  }
});


router.get('/calculate-remaining-loans', auth, async (req, res) => {
  try {
    const currentUser = req.user._id;
    const { remainingAmount, userLoans } = await calculateRemainingLoans(currentUser);

    res.json({
      success: true,
      remainingLoans: remainingAmount,
      userLoans: userLoans,
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: 'An error occurred while calculating remaining loans',
      error: err.message,
    });
  }
});

router.post('/emit-offer-loan', auth, async (req, res) => {
  try {
    const { _id, lender, avatar, totalWagered, accessory, username } = req.body;
    req.io.sockets.emit(`RECEIVED_LOAN_OFFER_${_id}`, {
      lender,
      avatar,
      accessory,
      username,
      totalWagered
    });
    res.json({
      success: true,
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: 'An error occurred while calculating remaining loans',
      error: err.message,
    });
  }
});
router.post('/cancel-offer', auth, async (req, res) => {
  try {
    const { _id, username } = req.body;
    req.io.sockets.emit(`CANCEL_OFFER_${_id}`, {
      cancelled: true
    });
    res.json({
      success: true,
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: 'An error occurred while calculating remaining loans',
      error: err.message,
    });
  }
});



router.post('/reconsider-offer', auth, async (req, res) => {
  try {
    const { _id, username } = req.body;
    req.io.sockets.emit(`CANCEL_OFFER_${_id}`, {
      cancelled: false
    });
    res.json({
      success: true,
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: 'An error occurred while calculating remaining loans',
      error: err.message,
    });
  }
});

async function calculateRemainingLoans(currentUser) {
  try {
    const matchingLoans = await Loan.find({ 'loaners.user': currentUser._id, 'loaners.amount': { $gt: 0 } });
    let remainingAmount = 0;
    let userLoans = [];

    for (const loan of matchingLoans) {
      const lender = await User.findOne({ _id: loan.lender });
      const loanerInfo = loan.loaners.find(loaner => loaner.user.equals(currentUser._id));

      const currentDate = new Date();
      const daysSinceLoan = Math.floor((currentDate - loanerInfo.created_at) / (1000 * 60 * 60 * 24));
      const loanPeriod = loanerInfo.period - daysSinceLoan;

      if (parseFloat(loanerInfo.amount) > 0.0000) {
        remainingAmount += (parseFloat(loanerInfo.amount));
      }

      userLoans.push({
        _id: loan._id,
        amount: loanerInfo.amount,
        paid_back: loanerInfo.paidBack,
        loan_period: loanPeriod,
        apy: loan.apy,
        lender: lender.username,
      });
    }

    return { remainingAmount, userLoans };
  } catch (err) {
    console.error('Error:', err);
    throw new Error('An error occurred while calculating remaining loans');
  }
}

async function checkLoanEligibility(currentUser, loanAmount) {
  // Convert loanAmount to a number
  const loanAmountFloat = parseFloat(loanAmount);
  if (isNaN(loanAmountFloat)) {
    return false; // Return false if loanAmount is not a valid number
  }

  const creditScore = currentUser.credit_score;

  // Safely parse totalWagered
  const rawWagered = parseFloat(currentUser.totalWagered) || 0;
  const safeWagered = rawWagered < 1.2973967 ? 0 : rawWagered;

  // Use safeWagered to calculate rank
  const rank = Math.floor(Math.log2(safeWagered + 1) / 1.2) + 1;

  const accountCreatedAt = new Date(currentUser.created_at);
  const currentDate = new Date();
  const accountAgeInMilliseconds = currentDate - accountCreatedAt;
  const accountAgeInDays = accountAgeInMilliseconds / (24 * 60 * 60 * 1000);

  const { remainingAmount } = await calculateRemainingLoans(currentUser);

  const categories = [
    { creditScoreThreshold: 700, rankThreshold: 0, accountAgeThresholdInDays: 30, maxAllowance: 0 },
    { creditScoreThreshold: 700, rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 0.02 },
    { creditScoreThreshold: 700, rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 0.05 },
    { creditScoreThreshold: 700, rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 0.1 },
    { creditScoreThreshold: 700, rankThreshold: 4, accountAgeThresholdInDays: 30, maxAllowance: 0.25 },
    { creditScoreThreshold: 700, rankThreshold: 5, accountAgeThresholdInDays: 30, maxAllowance: 0.5 },
    { creditScoreThreshold: 700, rankThreshold: 6, accountAgeThresholdInDays: 30, maxAllowance: 1 },
    { creditScoreThreshold: 700, rankThreshold: 7, accountAgeThresholdInDays: 30, maxAllowance: 1.5 },
    { creditScoreThreshold: 700, rankThreshold: 8, accountAgeThresholdInDays: 30, maxAllowance: 2 },
    { creditScoreThreshold: 700, rankThreshold: 9, accountAgeThresholdInDays: 30, maxAllowance: 3 },
    { creditScoreThreshold: 700, rankThreshold: 10, accountAgeThresholdInDays: 30, maxAllowance: 4 },
    { creditScoreThreshold: 700, rankThreshold: 12, accountAgeThresholdInDays: 30, maxAllowance: 6 },
    { creditScoreThreshold: 700, rankThreshold: 13, accountAgeThresholdInDays: 30, maxAllowance: 8 },
    { creditScoreThreshold: 700, rankThreshold: 14, accountAgeThresholdInDays: 30, maxAllowance: 10 },
  ];

  let bestMatch = null;
  const totalLoanAmount = remainingAmount + loanAmountFloat;

  // Start at the smaller of (rank - 1) or the last category
  let startingIndex = Math.min(rank - 1, categories.length - 1);

  for (let i = startingIndex; i >= 0; i--) {
    const category = categories[i];

    if (
      creditScore >= category.creditScoreThreshold &&
      rank >= category.rankThreshold &&
      totalLoanAmount <= category.maxAllowance
    ) {
      if (accountAgeInDays >= category.accountAgeThresholdInDays) {
        return true; // Return true if the best match is found with valid account age
      } else {
        bestMatch = bestMatch || category;
      }
    }
  }
  return false;
}

router.post('/lend', auth, async (req, res) => {
  try {
    const { loan_id, lender, responseText } = req.body;

    const loan = await Loan.findOne({ _id: loan_id });
    const originalLender = await User.findOne({ _id: lender });
    const currentUser = await User.findById(req.user._id);

    const accessAllowed = await check_access_time(req.user._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000
      });
    }

    if (!loan) {
      return res.json({
        success: false,
        message: 'Loan not found',
      });
    }

    if (!loan.lender) {
      return res.json({
        success: false,
        message: 'Loaner not found or not available for loan',
      });
    }
    if (parseFloat(responseText) > parseFloat(loan.loan_amount)) {
      return res.json({
        success: false,
        message: 'Not enough available funds!',
      });
    }

    const isEligible = await checkLoanEligibility(currentUser, responseText);

    if (!isEligible) {
      return res.json({
        success: false,
        message: 'This account is currently not eligible for this amount. Check your account Age or Try again another time at a later rank.',
      });
    }

    const newTransaction = new Transaction({
      user: currentUser,
      amount: parseFloat(responseText),
      description: `Loan from ${originalLender.username}`,
    });

    const notificationJ = new Notification({
      from: originalLender._id,
      to: currentUser._id,
      room: '',
      amount: parseFloat(responseText),
      message: `Loan received`,
      is_read: false
    });

    const notificationC = new Notification({
      from: currentUser._id,
      to: originalLender._id,
      room: '',
      amount: parseFloat(responseText),
      message: `Loan to ${currentUser.username}}`,
      is_read: false
    });

    const notificationDataJ = {
      message: notificationJ.message,
      username: originalLender.username,
      avatar: originalLender.avatar,
      amount: parseFloat(responseText),
      accessory: originalLender.accessory,
      rank: originalLender.totalWagered,
      created_at: moment().format('YYYY-MM-DD HH:mm'),
      created_at_str: moment().format('LLL'),
      updated_at: moment().format('YYYY-MM-DD HH:mm'),
    };

    const notificationDataC = {
      message: notificationC.message,
      username: currentUser.username,
      avatar: currentUser.avatar,
      accessory: currentUser.accessory,
      rank: currentUser.totalWagered,
      created_at: moment().format('YYYY-MM-DD HH:mm'),
      created_at_str: moment().format('LLL'),
      updated_at: moment().format('YYYY-MM-DD HH:mm'),
    };

    const newLoanLoaner = {
      user: currentUser._id,
      paidBack: 0,
      apy: loan.apy,
      amount: (parseFloat(responseText)) * loan.apy + parseFloat(responseText),
      period: loan.loan_period,
      created_at: Date.now(),
      updated_at: Date.now()
    };
    loan.loan_amount -= parseFloat(responseText);

    currentUser.balance += parseFloat(responseText);
    const newLoanerIndex = loan.loaners.findIndex((loanerObj) => loanerObj.user.equals(currentUser._id));
    if (newLoanerIndex !== -1) {
      loan.loaners[newLoanerIndex].period += (loan.loan_period - loan.loaners[newLoanerIndex].period) + loan.loan_period;
      loan.loaners[newLoanerIndex].amount += (parseFloat(responseText)) * loan.apy + parseFloat(responseText);
      loan.loaners[newLoanerIndex].created_at = Date.now();
      loan.loaners[newLoanerIndex].updated_at = Date.now();

    } else {
      loan.loaners.push(newLoanLoaner);
    }

    await Promise.all([
      saveDocumentWithRetry(notificationC),
      saveDocumentWithRetry(notificationJ),
      saveDocumentWithRetry(currentUser),
      saveDocumentWithRetry(loan),
      saveDocumentWithRetry(newTransaction),
    ]);

    socket.sendNotification(currentUser._id, notificationDataJ);
    socket.sendNotification(originalLender._id, notificationDataC);

    res.json({
      success: true,
      balance: currentUser.balance,
      newTransaction: newTransaction,
      message: 'LOAN 🤝 ACCEPTED',
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: "An error occurred during the loan",
      error: err.message,
    });
  }
});


router.post('/offer-loan', auth, async (req, res) => {
  try {
    const { loanAmount, loanPeriod, lender, interestRate, complete, og } = req.body;
    const isComplete = complete ? true : false;

    req.io.sockets.emit(`OFFER_LOAN_${lender}`, {
      loanAmount,
      loanPeriod,
      interestRate,
      lender,
      og,
      isComplete
    });

    res.json({
      success: true,
      message: "waiting",
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: "An error occurred during the loan",
      error: err.message,
    });
  }
});

router.get('/my-loans', auth, async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const loanTypeFilter = req.query.loanType;
  const userId = req.user._id;

  try {
    let query = { lender: userId, loan_amount: { $gt: 0 } };
    if (loanTypeFilter) {
      query['loan_type'] = loanTypeFilter;
    }

    const loans = await Loan.find(query)
      .sort({ updated_at: 'desc' })
      .skip(pagination * page - pagination)
      .limit(pagination);

    const count = await Loan.countDocuments(query);

    const loan_list = await Promise.all(loans.map(async (loan) => {
      const loaners = await Promise.all(
        loan.loaners.map(async (loaner) => {
          const user = await User.findById(loaner.user, 'avatar _id totalWagered accessory');
          return user;
        })
      );

      return {
        _id: loan._id,
        loan_amount: loan.loan_amount,
        loaners: loaners,
        fractional_amount: loan.fractional_amount,
        apy: loan.apy,
        loan_period: loan.loan_period,
        loan_type: loan.loan_type,
        created_at: loan.created_at,
      };
    }));

    // Respond with the transformed loans and pagination data
    res.json({
      success: true,
      query: req.query,
      total: count,
      loans: loan_list,
      pages: Math.ceil(count / pagination),
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message,
    });
  }
});


router.post('/withdraw-loan', auth, async (req, res) => {
  try {
    const { loan_id } = req.body;
    const currentUser = await User.findById(req.user._id);

    const accessAllowed = await check_access_time(currentUser._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'Irregular action',
        betResult: -1000
      });
    }

    const loan = await Loan.findOne({ _id: loan_id });
    if (!loan) {
      return res.json({
        success: false,
        message: 'Loan not found',
      });
    }

    let amount = loan.loan_amount;
    if (loan.loan_type === 'FRACTIONAL') {
      amount = loan.loan_amount * (loan.fractional_amount / 100);
    }

    // Update loan amount to 0
    loan.loan_amount = 0;

    // Update loaner amounts to 0
    const updatedLoaners = loan.loaners.map(async (loaner) => {
      if (loaner.user.toString() === currentUser._id.toString()) {
        loaner.amount = 0;
        await saveDocumentWithRetry(loaner);
      }
    });
    await Promise.all(updatedLoaners);

    currentUser.balance += amount;

    const newTransaction = new Transaction({
      user: currentUser._id,
      amount: amount,
      description: `Loan withdrawal`,
    });

    const notification = new Notification({
      from: currentUser._id,
      to: currentUser._id,
      room: '',
      message: `Loan withdrawal`,
      amount: amount,
      is_read: false
    });

    const notificationData = {
      message: notification.message,
      username: currentUser.username,
      avatar: currentUser.avatar,
      amount: amount,
      accessory: currentUser.accessory,
      rank: currentUser.totalWagered,
      created_at: moment().format('YYYY-MM-DD HH:mm'),
      created_at_str: moment().format('LLL'),
      updated_at: moment().format('YYYY-MM-DD HH:mm'),
    };

    await Promise.all([
      saveDocumentWithRetry(newTransaction),
      saveDocumentWithRetry(notification),
      saveDocumentWithRetry(currentUser),
      saveDocumentWithRetry(loan),
    ]);

    socket.sendNotification(currentUser._id, notificationData);

    // Delete the loan if it has no loaners
    if (loan.loaners.length === 0) {
      await Loan.findByIdAndDelete(loan_id);
    }

    return res.json({
      success: true,
      message: `Loan successfully withdrawn, ${(amount)} has been returned to your balance.`,
      balance: currentUser.balance,
      newTransaction: newTransaction
    });
  } catch (err) {
    console.error('Error:', err);
    return res.json({
      success: false,
      message: "An error occurred while withdrawing the loan",
      error: err.message,
    });
  }
});


router.get('/previous-loans', async (req, res) => {
  try {
    const query = {
      loan_amount: 0,
      'loaners.0': { $exists: true }
    };
    const loans = await Loan.find(query)
      .sort({ created_at: -1 })
      .limit(20);

    let loan_list = [];
    const currentDate = new Date();

    for (const loan of loans) {
      let isOutstanding = false;
      let shortestTimeRemaining = null;

      for (const loaner of loan.loaners) {
        const loanerCreatedAt = new Date(loaner.created_at);
        const loanerPeriodInDays = loaner.period;

        const loanerDueDate = new Date(loanerCreatedAt);
        loanerDueDate.setDate(loanerDueDate.getDate() + loanerPeriodInDays);

        const timeDiffInMs = loanerDueDate - currentDate;
        const timeDiffInDays = loanerPeriodInDays - ((currentDate - loanerCreatedAt) / (1000 * 60 * 60 * 24));

        if (currentDate > loanerDueDate) {
          isOutstanding = true;
          break;
        } else {
          if (shortestTimeRemaining === null || timeDiffInDays < shortestTimeRemaining) {
            shortestTimeRemaining = timeDiffInDays;
          }
        }
      }

      let timeRemaining = null;
      if (!isOutstanding && shortestTimeRemaining !== null) {
        const daysLeft = Math.floor(shortestTimeRemaining);
        const hoursLeft = Math.floor((shortestTimeRemaining % 1) * 24);
        const minutesLeft = Math.floor((((shortestTimeRemaining % 1) * 24) % 1) * 60);
        timeRemaining = `${daysLeft}d ${hoursLeft}h ${minutesLeft}m`;
      }

      loan_list.push({
        _id: loan._id,
        lender: loan.lender,
        loan_amount: loan.loan_amount,
        loan_period: loan.loan_period,
        apy: loan.apy,
        created_at: loan.created_at,
        loaners: loan.loaners,
        outstanding: isOutstanding ? true : timeRemaining,
      });
    }


    res.json({
      success: true,
      data: loan_list,
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      err: err,
    });
  }
});


// /api/loan/:id call
// router.get('/:id', async (req, res) => {
//   try {
//     const loan = await Loan.findOne({ _id: req.params.id });

//     res.json({
//       success: true,
//       query: req.query,
//       loan: {
//         _id: loan._id,
//         loan: loan.loan
//       }
//     });
//   } catch (err) {
//     res.json({
//       success: false,
//       err: err
//     });
//   }
// });

// /api/loans call
router.get('/', async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;

  // const sort = req.query.sortBy === 'price' ? 'loaners.price' : 'created_at';
  const sort = 'loan_amount';

  const loanTypeFilter = req.query.loanType;

  try {
    let query = { loan_amount: { $gt: 0 } };
    if (loanTypeFilter) {
      query['loan_type'] = loanTypeFilter;
    }

    const loans = await Loan.find(query)
      .skip(pagination * page - pagination)
      .limit(pagination);

    const count = await Loan.countDocuments(query);
    let loan_list = [];

    for (const loan of loans) {
      const loaners = await Promise.all(
        loan.loaners.map(async (loaner) => {
          const user = await User.findById(loaner.user, 'avatar _id username totalWagered accessory');
          return user;
        })
      );

      loan_list.push({
        _id: loan._id,
        lender: loan.lender,
        loan_amount: loan.loan_amount,
        fractional_amount: loan.fractional_amount,
        loan_type: loan.loan_type,
        loan_period: loan.loan_period,
        apy: loan.apy,
        created_at: loan.created_at,
        loaners: loaners, // Include the loaners in the response
      });
    }

    if (sort === 'created_at') {
      loan_list.sort((a, b) => a.created_at - b.created_at);
    } else {
      loan_list.sort((a, b) => a.loan_amount - b.loan_amount);
    }

    res.json({
      success: true,
      query: req.query,
      total: count,
      loans: loan_list,
      pages: Math.ceil(count / pagination),
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      err: err.message,
    });
  }
});



module.exports = router;
