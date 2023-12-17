/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
var ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

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

router.post('/lend', auth, async (req, res) => {
  try {
    const { loan_id, lender, responseText } = req.body;
    console.log("ww", req.body);

    // Find the loan using the new model
    const loan = await Loan.findOne({ _id: loan_id });
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

    // Find the loaner by ObjectId
    const loanerIndex = loan.loaners.findIndex((loanerObj) => loanerObj.user.equals(loan.lender));

    if (loanerIndex === -1 || loan.loaners[loanerIndex].count === 0) {
      return res.json({
        success: false,
        message: 'Loaner not found or not available for loan',
      });
    }

    // exceeded loan_amount
    if (loanAmount > parseFloat(loan.loan_amount)) {
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

    loan.loan_amount -= loanAmount;

    loan.loaners[loanerIndex].user = currentUser._id;
    loan.loaners[loanerIndex].amount += loanAmount;
    currentUser.balance += parseFloat(loan.loanAmount);

    // Create new transaction records
    const newTransaction = new Transaction({
      user: currentUser,
      amount: loanAmount,
      description: `Loan from ${lender.username}`,
    });

    // Update the loan's loaners array to increment count for the new loaner
    const newLoanLoaner = {
      user: currentUser._id,
      paidBack: 0,
      apy: loan.apy,
      amount: loanAmount,
      period: loan.loan_period,
    };

    // Check if the new loaner already exists in the loaners array
    const newLoanerIndex = loan.loaners.findIndex((loanerObj) => loanerObj.user.equals(currentUser._id));
    if (newLoanerIndex !== -1) {
      loan.loaners[newLoanerIndex].period += (loan.loan_period - loan.loaners[newLoanerIndex].period) + loan.loan_period;
      loan.loaners[newLoanerIndex].amount += loanAmount;
    } else {
      // If the new loaner doesn't exist, add them to the loaners array
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
        total_count: loaner.count,
        onSale: loaner.onSale,
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
    let query = { 'loaners.amount': { $gt: 0 } };
    if (loanTypeFilter) {
      query['loan_type'] = loanTypeFilter;
    }

    const loans = await Loan.find(query)
      .skip(pagination * page - pagination)
      .limit(pagination);
    const count = await Loan.countDocuments(query);

    let loan_list = [];

    for (const loan of loans) {

      for (const loaner of loan.loaners) {
          loan_list.push({
            _id: loan._id,
            lender: loan.lender,

            loan_amount: loan.loan_amount,
            loaners: [
              {
                user: loaner.user,
                apy: loaner.apy,
                period: loaner.period,
                paidBack: loaner.paidBack,
              },
            ],
            loan_type: loan.loan_type,
            loan_period: loan.loan_period,
            apy: loan.apy,
            created_at: loan.created_at,
          });
        
      }
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
