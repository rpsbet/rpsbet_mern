/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
var ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const convertToCurrency = require('../helper/util/conversion');

const router = express.Router();
const Loan = require('../model/Loan');
const User = require('../model/User');
const Transaction = require('../model/Transaction');

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
  const daysRemaining = Math.floor((Date.now() - loan.loaners[loaner].created_at) / (1000 * 60 * 60 * 24));

  const remainingLoanPeriod = parseFloat(loan.loaners[loaner].period) - daysRemaining;
  if (!currentUser.lenders.includes(loan.lender)) {
    currentUser.lenders.push(loan.lender);
    const totalWageredValue = lender.totalWagered || 0; // Default to 0 if undefined
    const creditScoreIncrease = totalWageredValue * parseFloat(loan.loaners[loaner].paidBack) * 1000 + remainingLoanPeriod;
    currentUser.credit_score += creditScoreIncrease;
  } else {
    const creditScoreIncrease = parseFloat(loan.loaners[loaner].paidBack) * 1000 + remainingLoanPeriod;
    currentUser.credit_score += creditScoreIncrease;
  }
};

router.post('/payback', auth, async (req, res) => {
  try {
    const { loanId, paybackAmount } = req.body;
    const currentUser = req.user; // Store the user object directly
    const loan = await Loan.findOne({ _id: loanId });

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
      user: lender,
      amount: parseFloat(paybackAmount),
      description: `Received loan repayment from ${currentUser.username}`,
    });

    lender.balance += parseFloat(paybackAmount);
    currentUser.balance -= parseFloat(paybackAmount);

    // Update loan and loaner information
    loan.loaners[loanerIndex].paidBack = parseFloat(loan.loaners[loanerIndex].paidBack) + parseFloat(paybackAmount);
    loan.loaners[loanerIndex].amount -= parseFloat(paybackAmount);

    if (loan.loaners[loanerIndex].amount <= 0.0005) {
      calculateCreditScore(loan, loanerIndex, lender, currentUser);
      loan.loaners.splice(loanerIndex, 1);
    }

    // Save changes to the user and the loan
    const savePromises = [
      currentUser.save(),
      lender.save(),
      loan.save(),
      newTransactionC.save(),
      newTransactionJ.save(),
    ];

    await Promise.all(savePromises);
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

    return { remainingAmount, userLoans }; // Return both remainingAmount and userLoans
  } catch (err) {
    console.error('Error:', err);
    throw new Error('An error occurred while calculating remaining loans');
  }
}
async function checkLoanEligibility(currentUser) {
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
    { creditScoreThreshold: 1000, rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 0.001 },
    { creditScoreThreshold: 1000, rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 0.005 },
    { creditScoreThreshold: 1000, rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 0.015 },
    { creditScoreThreshold: 1000, rankThreshold: 4, accountAgeThresholdInDays: 60, maxAllowance: 0.025 },
    { creditScoreThreshold: 1000, rankThreshold: 5, accountAgeThresholdInDays: 60, maxAllowance: 0.05 },
    { creditScoreThreshold: 1000, rankThreshold: 6, accountAgeThresholdInDays: 90, maxAllowance: 0.1 },
    { creditScoreThreshold: 950, rankThreshold: 7, accountAgeThresholdInDays: 90, maxAllowance: 0.25 },
    { creditScoreThreshold: 950, rankThreshold: 8, accountAgeThresholdInDays: 120, maxAllowance: 0.5 },
    { creditScoreThreshold: 950, rankThreshold: 9, accountAgeThresholdInDays: 120, maxAllowance: 1 },
    { creditScoreThreshold: 950, rankThreshold: 10, accountAgeThresholdInDays: 120, maxAllowance: 2 }
  ];

  // Check eligibility against each category using remainingAmount
  for (const category of categories) {
    if (
      creditScore >= category.creditScoreThreshold &&
      rank >= category.rankThreshold &&
      accountAgeInDays >= category.accountAgeThresholdInDays &&
      remainingAmount <= category.maxAllowance
    ) {
      return true; // Eligible for this category
    }
  }

  return false; // Not eligible for any category
}


router.post('/lend', auth, async (req, res) => {
  try {
    const { loan_id, lender, responseText } = req.body;
    // Find the loan using the new model
    const loan = await Loan.findOne({ _id: loan_id });
    const currentUser = await User.findById(req.user._id);

    const loans = await Loan.find();

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
    const isEligible = await checkLoanEligibility(currentUser);

    if (!isEligible) {
      return res.json({
        success: false,
        message: 'This account is currently not eligible for loaning this amount. Try again another time or another amount.',
      });
    }

    // Continue processing the loan if the user is eligible

    const lender_username = await User.findOne({ _id: lender });

    const loanPeriodInDays = Math.floor((Date.now() - loan.created_at.getTime()) / (1000 * 60 * 60 * 24));

    const newTransaction = new Transaction({
      user: currentUser,
      amount: parseFloat(responseText),
      description: `Loan from ${lender_username.username}`,
    });

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
      loan.loaners[newLoanerIndex].amount += parseFloat(responseText);
      loan.loaners[newLoanerIndex].created_at = Date.now();
      loan.loaners[newLoanerIndex].updated_at = Date.now();

    } else {

      loan.loaners.push(newLoanLoaner);
    }

    // Save changes and transactions
    const savePromises = [
      currentUser.save(),
      loan.save(),
      newTransaction.save(),
    ];

    await Promise.all(savePromises);

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


router.get('/my-loans', auth, async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const sort = 'loan_amount';
  const loanTypeFilter = req.query.loanType;
  const userId = req.user._id;

  try {
    let query = { lender: userId }; // Initialize the query object

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

    // Sorting (you can uncomment and customize this block based on your sorting needs)
    // if (sort === 'created_at') {
    //   loan_list.sort((a, b) => a.created_at - b.created_at);
    // } else {
    //   loan_list.sort((a, b) => a.loaners[0].price - b.loaners[0].price);
    // }

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


// /api/loan/:id call
router.get('/:id', async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id });

    res.json({
      success: true,
      query: req.query,
      loan: {
        _id: loan._id,
        loan: loan.loan
      }
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});
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


module.exports = router;
