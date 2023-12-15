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

router.post('/trade', auth, async (req, res) => {
  try {
    const { loan_id, owner } = req.body;

    // Find the loan using the new model
    const loan = await Loan.findOne({ _id: loan_id });
    if (!loan) {
      return res.json({
        success: false,
        message: 'Loan not found',
      });
    }

    // Find the owner by ObjectId
    const ownerIndex = loan.owners.findIndex((ownerObj) => ownerObj.user.equals(owner));

    if (ownerIndex === -1 || loan.owners[ownerIndex].count === 0) {
      return res.json({
        success: false,
        message: 'Owner not found or not available for trade',
      });
    }

    // Find the current user
    const currentUser = await User.findOne({ _id: req.user._id });

    if (currentUser.balance < parseFloat(loan.owners[ownerIndex].price)) {
      return res.json({
        success: false,
        message: 'Your balance is insufficient for this trade',
      });
    }

    // Deduct balance from the current user
    currentUser.balance -= parseFloat(loan.owners[ownerIndex].price);

    loan.owners[ownerIndex].count -= 1;
    loan.owners[ownerIndex].onSale -= 1;

    // Find the loan creator
    const loanCreator = await User.findOne({ _id: owner });

    // Increase balance for the loan creator
    loanCreator.balance += parseFloat(loan.owners[ownerIndex].price);

    // Create new transaction records
    const newTransactionC = new Transaction({
      user: currentUser,
      amount: -parseFloat(loan.owners[ownerIndex].price),
      description: `Traded with ${loanCreator.username}`,
    });

    const newTransactionJ = new Transaction({
      user: loanCreator,
      amount: parseFloat(loan.owners[ownerIndex].price),
      description: `Traded with ${currentUser.username}`,
    });

    // Update the loan's owners array to increment count for the new owner
    const newLoanOwner = {
      user: currentUser._id,
      count: 1,
      price: loan.owners[ownerIndex].price,
      onSale: 0,
    };

    // Check if the new owner already exists in the owners array
    const newOwnerIndex = loan.owners.findIndex((ownerObj) => ownerObj.user.equals(currentUser._id));
    if (newOwnerIndex !== -1) {
      // If the new owner already exists, increment their count
      loan.owners[newOwnerIndex].count += 1;
    } else {
      // If the new owner doesn't exist, add them to the owners array
      loan.owners.push(newLoanOwner);
    }

    // Save changes and transactions
    const savePromises = [
      currentUser.save(),
      loanCreator.save(),
      loan.save(),
      newTransactionC.save(),
      newTransactionJ.save(),
    ];

    await Promise.all(savePromises);

    res.json({
      success: true,
      balance: currentUser.balance,
      newTransaction: newTransactionC,
      message: 'TRADE 🤝 SUCCESSFUL',
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: "An error occurred during the trade",
      error: err.message,
    });
  }
});


router.get('/my-loans', auth, async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const sort = 'owners.price';
  const loanTypeFilter = req.query.loanType;
  const userId = req.user._id;
  try {
    let query = { 'owners.onSale': { $gt: 0 } };
    if (loanTypeFilter) {
      query['loan_type'] = loanTypeFilter;
    }
    const loans = await Loan.find({ 'owners.user': userId, ...query})
      .sort({ updated_at: 'desc' })
      .skip(pagination * page - pagination)
      .limit(pagination);

    const count = await Loan.countDocuments({ 'owners.user': userId });

    let loan_list = [];

    for (const loan of loans) {
      // Map the owners array to include only the owner matching the user ID
      const owner = loan.owners.find(owner => owner.user.equals(userId));

      loan_list.push({
        _id: loan._id,
        loan_amount: loan.loan_amount,
        apy: owner ? owner.apy : '',
        loan_period: loan.loan_period,
        total_count: owner.count,
        onSale: owner.onSale,
        loan_type: loan.loan_type,
        created_at: loan.created_at,
      });
    }

    // if (sort === 'created_at') {
    //   loan_list.sort((a, b) => a.created_at - b.created_at);
    // } else {
    //   loan_list.sort((a, b) => a.owners[0].price - b.owners[0].price);
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

    // Find the owner's index in the owners sub-array
    const ownerIndex = loan.owners.findIndex((ownerObj) => ownerObj.user.equals(req.user._id));

    if (ownerIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not the owner of this loan',
      });
    }

    // Check if the onSale value is less than the loan's count
    if (loan.owners[ownerIndex].onSale < loan.owners[ownerIndex].count) {
      // Increment the onSale field
      loan.owners[ownerIndex].onSale += 1;

      // Set the price for the loan
      loan.owners[ownerIndex].price = price;

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

    const ownerIndex = loan.owners.findIndex((ownerObj) => ownerObj.user.equals(req.user._id));

    if (ownerIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not the owner of this loan',
      });
    }

    // Check if the onSale value is greater than 0
    if (loan.owners[ownerIndex].onSale > 0) {
      // Decrement the onSale field
      loan.owners[ownerIndex].onSale -= 1;

      // Remove the price for the loan (optional)
      loan.owners[ownerIndex].price = 0;

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

  // const sort = req.query.sortBy === 'price' ? 'owners.price' : 'created_at';
  const sort = 'owners.price';

  const loanTypeFilter = req.query.loanType;

  try {
    let query = { 'owners.onSale': { $gt: 0 } };
    if (loanTypeFilter) {
      query['loan_type'] = loanTypeFilter;
    }

    const loans = await Loan.find(query)
      .skip(pagination * page - pagination)
      .limit(pagination);
    const count = await Loan.countDocuments(query);

    let loan_list = [];

    for (const loan of loans) {
      // Calculate the total count for this loan
      const totalCount = loan.owners.reduce((sum, owner) => sum + owner.count, 0);

      // Create a separate entry for each owner
      for (const owner of loan.owners) {
        if (owner.onSale) {
          loan_list.push({
            _id: loan._id,
            loan_amount: loan.loan_amount,
            owners: [
              {
                user: owner.user,
                count: owner.count,
                price: owner.price,
                onSale: owner.onSale,
              },
            ],
            total_count: totalCount, // Include the total count
            loan_type: loan.loan_type,
            loan_period: loan.loan_period,
            apy: loan.apy,
            created_at: loan.created_at,
          });
        }
      }
    }
    if (sort === 'created_at') {
      loan_list.sort((a, b) => a.created_at - b.created_at);
    } else {
      loan_list.sort((a, b) => a.owners[0].price - b.owners[0].price);
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
