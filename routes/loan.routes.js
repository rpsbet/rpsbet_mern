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

router.post('/delete', async (req, res) => {
  try {
    const { _id } = req.body;

    loanObj = await Loan.remove({ _id: _id });

    res.json({
      success: true,
      message: 'Loan has been removed'
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});
router.post('/create', auth, async (req, res) => {
  try {
    const { _id, loan } = req.body;

    if (!loan) {
      return res.json({
        success: false,
        error: 'Please enter all fields'
      });
    }

    let loanObj = new Loan({
      loan
    });

    if (_id) {
      loanObj = await Loan.findOne({ _id: _id });
      loanObj.loan = loan;
      loanObj.updated_at = Date.now();
    }

    await loanObj.save();

    res.json({
      success: true,
      message: 'New loan created'
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});

router.post('/payback', auth, async (req, res) => {
  try {
    const { loanId, paybackAmount } = req.body;
console.log(loanId, paybackAmount )
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
        message: 'Invalid payback amount',
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

    // Find loans where the loaners array includes the current user
    const matchingLoans = await Loan.find({ 'loaners.user': currentUser });

    let remainingAmount = 0;
    let userLoans = [];

    for (const loan of matchingLoans) {
      const lender = await User.findOne({ _id: loan.lender });
      
      // Find the loaner's information in the loaners array
      const loanerInfo = loan.loaners.find(loaner => loaner.user.equals(currentUser));
      
      // Calculate loan period based on the number of days since the loan was created
      const currentDate = new Date();
      const daysSinceLoan = Math.floor((currentDate - loanerInfo.created_at) / (1000 * 60 * 60 * 24));
      const loanPeriod = loanerInfo.period - daysSinceLoan;

      // Check if paidBack is less than amount and add the remaining amount
      if (parseFloat(loanerInfo.paidBack) < parseFloat(loanerInfo.amount)) {
        remainingAmount += (parseFloat(loanerInfo.amount) - parseFloat(loanerInfo.paidBack));
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




router.post('/lend', auth, async (req, res) => {
  try {
    const { loan_id, lender, responseText } = req.body;
    // Find the loan using the new model
    const loan = await Loan.findOne({ _id: loan_id });
    
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
    
    // // Find the loaner by ObjectId
    // const loanerIndex = loan.loaners.findIndex((loanerObj) => loanerObj.user.equals(lender));
    // console.log("w", loan.loaners);

    // if (loanerIndex === -1 || loan.loaners[loanerIndex].count === 0) {
    //   return res.json({
    //     success: false,
    //     message: 'Loaner not found or not available for loan',
    //   });
    // }

    // exceeded loan_amount
    if (parseFloat(responseText) > parseFloat(loan.loan_amount)) {
      return res.json({
        success: false,
        message: 'Not enough available funds!',
      });
    }
    const currentUser = await User.findOne({ _id: req.user._id });
    // Calculate score_credit
    let score_credit = 1000;

    // Loop through all loans
    for (const loan of loans) {
      // Loop through loaners array in each loan
      for (const loanerObj of loan.loaners) {
        // Check if the loaner matches the current user
        if (loanerObj.user.equals(currentUser._id)) {
          // Check conditions for scoring
          if (
            loanerObj.paidBack <= loanerObj.amount &&
            loan.loan_period > 0 &&
            (Date.now() - loan.created_at.getTime()) / (1000 * 60 * 60 * 24) > loan.loan_period
          ) {
            score_credit -= 100;
          }
        }
      }
    }

    // If score_credit is below a certain threshold, reject the loan
    if (score_credit < 600) {
      return res.json({
        success: false,
        message: 'This account is currently not liable for loaning',
      });
    }

    // score_credit too low 
    // if (score_credit < 0) {
    //   return res.json({
    //     success: false,
    //     message: 'This account is currently not liable for loaning',
    //   });
    // }
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
      amount:  (parseFloat(responseText)) * loan.apy + parseFloat(responseText),
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
  const sort = 'loaners.price';
  const loanTypeFilter = req.query.loanType;
  const userId = req.user._id;
  try {
    let query = { 'loaners.onSale': { $gt: 0 } };
    if (loanTypeFilter) {
      query['loan_type'] = loanTypeFilter;
    }
    const loans = await Loan.find({ 'loaners.user': userId, ...query })
      .sort({ updated_at: 'desc' })
      .skip(pagination * page - pagination)
      .limit(pagination);

    const count = await Loan.countDocuments({ 'loaners.user': userId });

    let loan_list = [];

    for (const loan of loans) {
      // Map the loaners array to include only the loaner matching the user ID
      const loaner = loan.loaners.find(loaner => loaner.user.equals(userId));

      loan_list.push({
        _id: loan._id,
        loan_amount: loan.loan_amount,
        apy: loaner ? loaner.apy : '',
        loan_period: loan.loan_period,
        loan_type: loan.loan_type,
        created_at: loan.created_at,
      });
    }

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
      err: err,
    });
  }
});

// List an loan for sale
router.post('/list-for-sale', auth, async (req, res) => {
  try {
    const { loan_id, price } = req.body;
    // Find the loan using the new model
    const loan = await Loan.findOne({ _id: loan_id });

    if (!loan) {
      return res.json({
        success: false,
        message: 'Loan not found',
      });
    }

    // Find the loaner's index in the loaners sub-array
    const loanerIndex = loan.loaners.findIndex((loanerObj) => loanerObj.user.equals(req.user._id));

    if (loanerIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not the loaner of this loan',
      });
    }

    // Check if the onSale value is less than the loan's count
    if (loan.loaners[loanerIndex].onSale < loan.loaners[loanerIndex].count) {
      // Increment the onSale field
      loan.loaners[loanerIndex].onSale += 1;

      // Set the price for the loan
      loan.loaners[loanerIndex].price = price;

      // Save changes to the loan
      await loan.save();

      return res.json({
        success: true,
        message: `Loan '${loan.loan_amount}' listed for sale at ${price} ETH`,
      });
    } else {
      return res.json({
        success: false,
        message: `No more '${loan.loan_amount}' left to sell.`,
      });
    }
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: "An error occurred while listing the loan for sale",
      error: err.message,
    });
  }
});

// Delist an loan from sale
router.post('/delist-from-sale', auth, async (req, res) => {
  try {
    const { loan_id } = req.body;

    const loan = await Loan.findOne({ _id: loan_id });
    if (!loan) {
      return res.json({
        success: false,
        message: 'Loan not found',
      });
    }

    const loanerIndex = loan.loaners.findIndex((loanerObj) => loanerObj.user.equals(req.user._id));

    if (loanerIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not the loaner of this loan',
      });
    }

    // Check if the onSale value is greater than 0
    if (loan.loaners[loanerIndex].onSale > 0) {
      // Decrement the onSale field
      loan.loaners[loanerIndex].onSale -= 1;

      // Remove the price for the loan (optional)
      loan.loaners[loanerIndex].price = 0;

      // Save changes to the loan
      await loan.save();

      return res.json({
        success: true,
        message: `Loan '${loan.loan_amount}' delisted from sale`,
      });
    } else {
      return res.json({
        success: false,
        message: `No '${loan.loan_amount}' currently listed for sale.`,
      });
    }
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: "An error occurred while delisting the loan from sale",
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
  const sort = 'loaners.amount';

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
      loan_list.sort((a, b) => a.loaners[0].price - b.loaners[0].price);
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
