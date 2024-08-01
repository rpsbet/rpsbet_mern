/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
var ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const socket = require('../socketController.js');
const convertToCurrency = require('../helper/util/conversion');
const moment = require('moment');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const check_access_time = require('../helper/util/checkAccessTime');
const router = express.Router();
const Loan = require('../model/Loan');
const Notification = require('../model/Notification');
const User = require('../model/User');
const Transaction = require('../model/Transaction');

let user_access_log = {};

router.post('/create', auth, async (req, res) => {
  try {
    const { _id, loan_amount, loan_period, apy } = req.body;
    const currentUser = req.user;

    // Check if all required fields are provided
    if (!loan_amount || !loan_period || !apy) {
      return res.json({
        success: false,
        error: 'Please enter all fields'
      });
    }

    // Check if loan amount is a valid number and not zero
    if (isNaN(parseFloat(loan_amount)) || parseFloat(loan_amount) <= 0) {
      return res.json({
        success: false,
        message: 'Loan amount must be a valid positive number',
      });
    }

    // Check if the user has sufficient funds for the loan
    if (currentUser.balance < parseFloat(loan_amount)) {
      return res.json({
        success: false,
        message: 'Insufficient funds',
      });
    }

    // Ensure loan period and APY are valid values
    if (isNaN(parseFloat(loan_period)) || parseFloat(loan_period) <= 0 || isNaN(parseFloat(apy)) || parseFloat(apy) <= 0) {
      return res.json({
        success: false,
        message: 'Loan period and APY must be valid positive numbers',
      });
    }

    const newTransaction = new Transaction({
      user: currentUser,
      amount: -parseFloat(loan_amount),
      description: `Loan created`,
    });

    let loanObj = new Loan({
      lender: _id,
      loan_amount: loan_amount,
      loan_period: loan_period,
      apy: apy / 100
    });

    currentUser.balance -= parseFloat(loan_amount);

    const savePromises = [
      loanObj.save(),
      currentUser.save(),
      newTransaction.save()
    ];

    await Promise.all(savePromises);

    res.json({
      success: true,
      message: 'NEW LOAN CREATED'
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});


const calculateCreditScore = (loan, loaner, lender, currentUser) => {
  // Calculate the number of days since the loan was created
  const loanCreatedAt = new Date(loan.loaners[loaner].created_at);
  const daysSinceLoanCreated = Math.floor((Date.now() - loanCreatedAt.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate the remaining loan period and cap it at 30 days
  const loanPeriod = parseFloat(loan.loaners[loaner].period);
  let remainingLoanPeriod = loanPeriod - daysSinceLoanCreated;
  remainingLoanPeriod = Math.min(remainingLoanPeriod, 30);

  // Check if the current user has the lender in their list of lenders
  if (!currentUser.lenders.includes(loan.lender)) {
    currentUser.lenders.push(loan.lender);
  }

  // Calculate the credit score increase
  const paidBack = parseFloat(loan.loaners[loaner].paidBack);
  let creditScoreIncrease = paidBack + remainingLoanPeriod;

  // Apply a reduction factor (e.g., reduce by 20%)
  const reductionFactor = 0.20;
  creditScoreIncrease = creditScoreIncrease * (1 - reductionFactor);

  // Update the current user's credit score
  currentUser.credit_score += creditScoreIncrease;
};

router.post('/payback', auth, async (req, res) => {
  try {
    const { loanId, paybackAmount } = req.body;
    const loan = await Loan.findOne({ _id: loanId });
    const currentUser = await User.findOne({ _id: req.user._id });

    if (!loan) {
      return res.json({
        success: false,
        message: 'Loan not found',
      });
    }

    // Find the loaner's index in the loaners sub-array
    const loanerIndex = loan.loaners.findIndex((loanerObj) => loanerObj.user.equals(currentUser._id));

    if (loanerIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not the loaner of this loan',
      });
    }

    if (currentUser.balance <= parseFloat(paybackAmount)) {
      return res.json({
        success: false,
        message: 'Insufficient funds',
      });
    }

    // Check if the paybackAmount is valid
    if (parseFloat(paybackAmount) <= 0 || parseFloat(paybackAmount) > parseFloat(loan.loaners[loanerIndex].amount)) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!',
      });
    }

    const lender = await User.findOne({ _id: loan.lender });

    const newTransactionC = new Transaction({
      user: currentUser,
      amount: -parseFloat(paybackAmount),
      description: `Repayed loan to ${lender.username}`,
    });

    const newTransactionJ = new Transaction({
      user: lender._id,
      amount: parseFloat(paybackAmount),
      description: `Received loan repayment from ${currentUser.username}`,
    });

    const notificationC = new Notification({
      from: lender._id,
      to: currentUser._id,
      room: '',
      message: `Repayed ${convertToCurrency(paybackAmount)} loan to ${lender.username}`,
      is_read: false
    });

    const notificationJ = new Notification({
      from: currentUser._id,
      to: lender._id,
      room: '',
      message: `Received ${convertToCurrency(paybackAmount)} loan repayment from ${currentUser.username}`,
      is_read: false
    });

    const notificationDataC = {
      message: notificationJ.message,
      username: lender.username,
      avatar: lender.avatar,
      accessory: lender.accessory,
      rank: lender.totalWagered,
      created_at: moment().format('YYYY-MM-DD HH:mm'),
      created_at_str: moment().format('LLL'),
      updated_at: moment().format('YYYY-MM-DD HH:mm'),
    };

    const notificationDataJ = {
      message: notificationC.message,
      username: currentUser.username,
      avatar: currentUser.avatar,
      accessory: currentUser.accessory,
      rank: currentUser.totalWagered,
      created_at: moment().format('YYYY-MM-DD HH:mm'),
      created_at_str: moment().format('LLL'),
      updated_at: moment().format('YYYY-MM-DD HH:mm'),
    };

    lender.balance += parseFloat(paybackAmount);
    currentUser.balance -= parseFloat(paybackAmount);

    // Update loan and loaner information
    loan.loaners[loanerIndex].paidBack = parseFloat(loan.loaners[loanerIndex].paidBack) + parseFloat(paybackAmount);
    loan.loaners[loanerIndex].amount -= parseFloat(paybackAmount);

    if (loan.loaners[loanerIndex].amount <= 0.05) {
      calculateCreditScore(loan, loanerIndex, lender, currentUser);
      loan.loaners.splice(loanerIndex, 1);
    }

    await Promise.all([
      saveDocumentWithRetry(notificationC),
      saveDocumentWithRetry(notificationJ),
      saveDocumentWithRetry(currentUser),
      saveDocumentWithRetry(lender),
      saveDocumentWithRetry(loan),
      saveDocumentWithRetry(newTransactionC),
      saveDocumentWithRetry(newTransactionJ),
    ]);

    socket.sendNotification(currentUser._id, notificationDataJ);
    socket.sendNotification(lender._id, notificationDataC);

 
    return res.json({
      success: true,
      message: `Loan ${convertToCurrency(paybackAmount)} paid back successfully`,
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

// Calculate the sum of (amount - paidBack) for matching loans
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
    const matchingLoans = await Loan.find({ 'loaners.user': currentUser._id });
    let remainingAmount = 0;
    let userLoans = []; // Include this array to store loan details

    for (const loan of matchingLoans) {
      const lender = await User.findOne({ _id: loan.lender });
      const loanerInfo = loan.loaners.find(loaner => loaner.user.equals(currentUser._id));

      const currentDate = new Date();
      const daysSinceLoan = Math.floor((currentDate - loanerInfo.created_at) / (1000 * 60 * 60 * 24));
      const loanPeriod = loanerInfo.period - daysSinceLoan;

      if (parseFloat(loanerInfo.amount) > 0.0000) {
        remainingAmount += (parseFloat(loanerInfo.amount));
      }

      // Include loan details in the userLoans array
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
  const creditScore = currentUser.credit_score;
  const rank = Math.floor(Math.log2(parseFloat(currentUser.totalWagered) + 1) / 1.2) + 1;;

  const accountCreatedAt = new Date(currentUser.created_at);
  const currentDate = new Date();
  const accountAgeInMilliseconds = currentDate - accountCreatedAt;
  const accountAgeInDays = accountAgeInMilliseconds / (24 * 60 * 60 * 1000);

  // Calculate remaining loans using the function directly
  const { remainingAmount } = await calculateRemainingLoans(currentUser);

  // Threshold categories
  const categories = [
    { creditScoreThreshold: 1000, rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 10 },
    { creditScoreThreshold: 1000, rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 20 },
    { creditScoreThreshold: 1000, rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 50 },
    { creditScoreThreshold: 1000, rankThreshold: 4, accountAgeThresholdInDays: 60, maxAllowance: 100 },
    { creditScoreThreshold: 1000, rankThreshold: 5, accountAgeThresholdInDays: 60, maxAllowance: 250 },
    { creditScoreThreshold: 1000, rankThreshold: 6, accountAgeThresholdInDays: 90, maxAllowance: 500 },
    { creditScoreThreshold: 950, rankThreshold: 7, accountAgeThresholdInDays: 90, maxAllowance: 700 },
    { creditScoreThreshold: 950, rankThreshold: 8, accountAgeThresholdInDays: 120, maxAllowance: 800 },
    { creditScoreThreshold: 950, rankThreshold: 9, accountAgeThresholdInDays: 120, maxAllowance: 900 },
    { creditScoreThreshold: 950, rankThreshold: 10, accountAgeThresholdInDays: 120, maxAllowance: 1000 },
    { creditScoreThreshold: 1000, rankThreshold: 11, accountAgeThresholdInDays: 120, maxAllowance: 1500 },
    { creditScoreThreshold: 1000, rankThreshold: 12, accountAgeThresholdInDays: 120, maxAllowance: 2000 },
    { creditScoreThreshold: 1000, rankThreshold: 13, accountAgeThresholdInDays: 120, maxAllowance: 2500 },
    { creditScoreThreshold: 1000, rankThreshold: 14, accountAgeThresholdInDays: 120, maxAllowance: 3000 },
    { creditScoreThreshold: 1000, rankThreshold: 15, accountAgeThresholdInDays: 120, maxAllowance: 3500 },
    { creditScoreThreshold: 1000, rankThreshold: 16, accountAgeThresholdInDays: 120, maxAllowance: 5000 },
    { creditScoreThreshold: 950, rankThreshold: 17, accountAgeThresholdInDays: 120, maxAllowance: 6000 },
    { creditScoreThreshold: 950, rankThreshold: 18, accountAgeThresholdInDays: 120, maxAllowance: 7000 },
    { creditScoreThreshold: 950, rankThreshold: 19, accountAgeThresholdInDays: 120, maxAllowance: 8000 },
    { creditScoreThreshold: 950, rankThreshold: 50, accountAgeThresholdInDays: 120, maxAllowance: 10000 }
  ];
  // Find the starting index based on the user's rank
  const startingIndex = Math.min(rank - 1, categories.length - 1);

  // Iterate from the starting index to the end of the categories array
  for (let i = startingIndex; i < categories.length; i++) {
    const category = categories[i];

    // Check eligibility against each category using remainingAmount
    if (
      creditScore >= category.creditScoreThreshold &&
      rank >= category.rankThreshold &&
      accountAgeInDays >= category.accountAgeThresholdInDays &&
      (remainingAmount + parseFloat(loanAmount)) <= category.maxAllowance
    ) {
      return true; // Eligible for this category
    }
  }
  return false; // Not eligible for any category
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
    // exceeded loan_amount
    if (parseFloat(responseText) > parseFloat(loan.loan_amount)) {
      return res.json({
        success: false,
        message: 'Not enough available funds!',
      });
    }

    // Check loan eligibility
    const isEligible = await checkLoanEligibility(currentUser, responseText);

    if (!isEligible) {
      return res.json({
        success: false,
        message: 'This account is currently not eligible for loaning this amount. Try again another time or another amount.',
      });
    }

    const newTransaction = new Transaction({
      user: currentUser,
      amount: parseFloat(responseText),
      description: `Loan from ${originalLender.username}`,
    });

    // Create notifications
    const notificationJ = new Notification({
      from: originalLender._id,
      to: currentUser._id,
      room: '',
      message: `Loan received ${convertToCurrency(parseFloat(responseText))}`,
      is_read: false
    });

    const notificationC = new Notification({
      from: currentUser._id,
      to: originalLender._id,
      room: '',
      message: `Loan to ${currentUser.username} ${convertToCurrency(parseFloat(responseText))}`,
      is_read: false
    });

    const notificationDataJ = {
      message: notificationJ.message,
      username: originalLender.username,
      avatar: originalLender.avatar,
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
    
    // Update the loan's loaners array to increment count for the new loaner
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
    // Check if the new loaner already exists in the loaners array
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
  const sort = 'loan_amount';
  const loanTypeFilter = req.query.loanType;
  const userId = req.user._id;

  try {
    let query = { lender: userId, loan_amount: { $gt: 0 } }; // Initialize the query object with loan_amount > 0

    if (loanTypeFilter) {
      query['loan_type'] = loanTypeFilter;
    }

    const loans = await Loan.find(query)
      .sort({ updated_at: 'desc' })
      .skip(pagination * page - pagination)
      .limit(pagination);

    const count = await Loan.countDocuments(query);

    const loan_list = loans.map((loan) => ({
      _id: loan._id,
      loan_amount: loan.loan_amount,
      apy: loan.apy,
      loan_period: loan.loan_period,
      loan_type: loan.loan_type,
      created_at: loan.created_at,
    }));

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

    const loan = await Loan.findOne({ _id: loan_id });
    if (!loan) {
      return res.json({
        success: false,
        message: 'Loan not found',
      });
    }

    // Get the current user
    const currentUser = await User.findById(req.user._id);
    const amount = loan.loan_amount
    // Add loan amount to user balance
    currentUser.balance += amount;

    // Save the user balance changes
    await currentUser.save();

    // Create a new transaction for the loan amount
    const newTransaction = new Transaction({
      user: currentUser,
      amount: amount,
      description: `Loan withdrawal`,
    });

    // Save the new transaction
    await Loan.findByIdAndDelete(loan_id);
    await newTransaction.save();

    // Remove the loan from the database

    return res.json({
      success: true,
      message: `Loan successfully withdrawn, ${convertToCurrency(amount)} has been returned to your balance.`,
      balance: currentUser.balance,
      newTransaction: newTransaction
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: "An error occurred while withdrawing the loan",
      error: err.message,
    });
  }
});
router.get('/previous-loans', async (req, res) => {
  try {
    // Query to find loans where loan_amount > 0 and at least one loaner exists,
    // sorted by created_at in descending order, and limit to 9 results
    const query = { 
      loan_amount: 0, 
      'loaners.0': { $exists: true } 
    };
    const loans = await Loan.find(query)
                            .sort({ created_at: -1 }) // Sort by created_at descending
                            .limit(20); // Limit to 9 documents

    let loan_list = [];
    const currentDate = new Date();

    for (const loan of loans) {
      let isOutstanding = false;
      let shortestTimeRemaining = null;

      for (const loaner of loan.loaners) {
        const loanerCreatedAt = new Date(loaner.created_at);
        const loanerPeriodInDays = loaner.period;

        // Calculate the due date
        const loanerDueDate = new Date(loanerCreatedAt);
        loanerDueDate.setDate(loanerDueDate.getDate() + loanerPeriodInDays);

        // Calculate the time difference in days
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
    let query = { 'loan_amount': { $gt: 0 } };
    if (loanTypeFilter) {
      query['loan_type'] = loanTypeFilter;
    }

    const loans = await Loan.find(query)
      .skip(pagination * page - pagination)
      .limit(pagination);
    const count = await Loan.countDocuments(query);
    let loan_list = [];

    for (const loan of loans) {

      // for (const loaner of loan.loaners) {
      loan_list.push({
        _id: loan._id,
        lender: loan.lender,

        loan_amount: loan.loan_amount,

        loan_type: loan.loan_type,
        loan_period: loan.loan_period,
        apy: loan.apy,
        created_at: loan.created_at,
      });

      // }
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
    console.error('Error:', err); // Add an error log statement.
    res.json({
      success: false,
      err: err,
    });
  }
});



router.post('/create-and-lend', auth, async (req, res) => {
  try {
    const { loan_amount, loan_period, apy, lender } = req.body;
    const currentUser = await User.findOne({ _id: req.user._id });

    // Check if all required fields are provided
    if (!loan_amount || !loan_period || !apy || !lender) {
      return res.json({
        success: false,
        error: 'Please enter all fields'
      });
    }

    // Validate loan amount, loan period, and APY
    const parsedLoanAmount = parseFloat(loan_amount);
    const parsedLoanPeriod = parseFloat(loan_period);
    const parsedApy = parseFloat(apy);

    if (isNaN(parsedLoanAmount) || parsedLoanAmount <= 0 ||
      isNaN(parsedLoanPeriod) || parsedLoanPeriod <= 0 ||
      isNaN(parsedApy) || parsedApy <= 0) {
      return res.json({
        success: false,
        message: 'Loan amount, loan period, and APY must be valid positive numbers',
      });
    }

    const originalLender = await User.findOne({ _id: lender });

    // Check if the lender has sufficient funds for the loan
    if (!originalLender || originalLender.balance < parsedLoanAmount) {
      return res.json({
        success: false,
        message: 'Insufficient funds or lender not found',
      });
    }

    // Create new transactions
    const newTransactionJ = new Transaction({
      user: currentUser._id,
      amount: parsedLoanAmount,
      description: 'Loan received',
    });

    const newTransactionC = new Transaction({
      user: originalLender._id,
      amount: -parsedLoanAmount,
      description: 'Loan created',
    });

    // Create notifications
    const notificationJ = new Notification({
      from: originalLender._id,
      to: currentUser._id,
      room: '',
      message: `Loan received ${convertToCurrency(parsedLoanAmount)}`,
      is_read: false
    });

    const notificationC = new Notification({
      from: currentUser._id,
      to: originalLender._id,
      room: '',
      message: `Loan created ${convertToCurrency(parsedLoanAmount)} for ${currentUser.username}`,
      is_read: false
    });

    const notificationDataJ = {
      message: notificationJ.message,
      username: originalLender.username,
      avatar: originalLender.avatar,
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

    // Create a new loan
    const loanObj = new Loan({
      lender: originalLender,
      loan_amount: 0,
      loan_type: 'standard',
      loan_period: parsedLoanPeriod,
      apy: parsedApy / 100
    });

    const accessAllowed = await check_access_time(currentUser._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000
      });
    }

    // Update user balances
    currentUser.balance += parsedLoanAmount;
    originalLender.balance -= parsedLoanAmount;

    // Set loan details
    loanObj.loaners = [{
      user: currentUser._id,
      apy: loanObj.apy,
      paidBack: 0,
      period: parsedLoanPeriod,
      amount: parsedLoanAmount * (1 + loanObj.apy),
      created_at: Date.now(),
      updated_at: Date.now()
    }];

    // Save documents and send notifications
    await Promise.all([
      saveDocumentWithRetry(newTransactionC),
      saveDocumentWithRetry(newTransactionJ),
      saveDocumentWithRetry(notificationC),
      saveDocumentWithRetry(notificationJ),
      saveDocumentWithRetry(loanObj),
      saveDocumentWithRetry(currentUser),
      saveDocumentWithRetry(originalLender)
    ]);

    socket.sendNotification(currentUser._id, notificationDataJ);
    socket.sendNotification(originalLender._id, notificationDataC);

    res.json({
      success: true,
      balance: currentUser.balance,
      newTransaction: newTransactionJ,
      message: `LOAN 🤝 RECEIVED FROM ${originalLender.username}`,
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


module.exports = router;
