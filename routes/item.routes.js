/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
var ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();
const Item = require('../model/Item');
const User = require('../model/User');
const Transaction = require('../model/Transaction');

router.post('/delete', async (req, res) => {
  try {
    const { _id } = req.body;

    itemObj = await Item.remove({ _id: _id });

    res.json({
      success: true,
      message: 'Item has been removed'
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
    const { _id, item } = req.body;

    if (!item) {
      return res.json({
        success: false,
        error: 'Please enter all fields'
      });
    }

    let itemObj = new Item({
      item
    });

    if (_id) {
      itemObj = await Item.findOne({ _id: _id });
      itemObj.item = item;
      itemObj.updated_at = Date.now();
    }

    await itemObj.save();

    res.json({
      success: true,
      message: 'New item created'
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});

router.post('/return', auth, async (req, res) => {
  try {
    const { item_id } = req.body;

    // Find the item using the new model
    const item = await Item.findOne({ _id: item_id });

    if (!item) {
      return res.json({
        success: false,
        message: 'Item not found',
      });
    }

    // Find the current user's index in the owners array
    const currentUserIndex = item.owners.findIndex((ownerObj) => ownerObj.user.equals(req.user._id));

    if (currentUserIndex === -1 || item.owners[currentUserIndex].count === 0) {
      return res.json({
        success: false,
        message: 'You do not own this item or it is not available for return',
      });
    }

    // Decrement the count for the current user
    item.owners[currentUserIndex].count -= 1;
    item.owners[currentUserIndex].rentOption = false;
    item.owners[currentUserIndex].originalOwner = '';

    // Find the index of the original owner in the owners array
    const originalOwnerIndex = item.owners.findIndex((ownerObj) => ownerObj.user.equals(item.owners[currentUserIndex].originalOwner));

    // If the original owner exists, increment their count
    if (originalOwnerIndex !== -1) {
      item.owners[originalOwnerIndex].count += 1;
    } else {
      // If the original owner doesn't exist, create a new entry
      item.owners.push({
        user: item.owners[currentUserIndex].originalOwner,
        count: 1,
        // Add other necessary fields
      });
    }

    // Save changes to the item
    await item.save();

    res.json({
      success: true,
      message: 'Item returned successfully',
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: 'An error occurred during the return',
      error: err.message,
    });
  }
});


router.post('/trade', auth, async (req, res) => {
  try {
    const { item_id, owner} = req.body;

    // Find the item using the new model
    const item = await Item.findOne({ _id: item_id });
    if (!item) {
      return res.json({
        success: false,
        message: 'Item not found',
      });
    }

    // Find the owner by ObjectId
    const ownerIndex = item.owners.findIndex((ownerObj) => ownerObj.user.equals(owner));

    if (ownerIndex === -1 || item.owners[ownerIndex].count === 0) {
      return res.json({
        success: false,
        message: rentOption ? 'Owner not found or not available for rental' : 'Owner not found or not available for trade',
      });
    }

    const rentOption = item.owners[ownerIndex].rentOption;
    // Find the current user
    const currentUser = await User.findOne({ _id: req.user._id });

    if (currentUser.balance < parseFloat(item.owners[ownerIndex].price)) {
      return res.json({
        success: false,
        message: rentOption ? 'Your balance is insufficient for this rental' : 'Your balance is insufficient for this trade',
      });
    }

    // Deduct balance from the current user
    currentUser.balance -= parseFloat(item.owners[ownerIndex].price);

    item.owners[ownerIndex].count -= 1;
    item.owners[ownerIndex].onSale -= 1;
    if (item.owners[ownerIndex].onSale === 0) {
      item.owners[ownerIndex].rentOption = false;
    }

    // Find the item creator
    const itemCreator = await User.findOne({ _id: owner });

    // Increase balance for the item creator
    itemCreator.balance += parseFloat(item.owners[ownerIndex].price);

    // Create new transaction records
    const newTransactionC = new Transaction({
      user: currentUser,
      amount: -parseFloat(item.owners[ownerIndex].price),
      description:  rentOption
      ? `Rented from ${itemCreator.username}`
      : `Traded with ${itemCreator.username}`
    });

    const newTransactionJ = new Transaction({
      user: itemCreator,
      amount: parseFloat(item.owners[ownerIndex].price),
      description:  rentOption
      ? `Rented to ${currentUser.username}`
      : `Traded with ${currentUser.username}`
    });

    // Update the item's owners array to increment count for the new owner
    const newItemOwner = {
      user: currentUser._id,
      count: 1,
      price: item.owners[ownerIndex].price,
      onSale: 0,
      rentOption: rentOption,
      lastPayment: Date.now(),
      originalOwner: itemCreator._id
    };

    // Check if the new owner already exists in the owners array
    const newOwnerIndex = item.owners.findIndex((ownerObj) => ownerObj.user.equals(currentUser._id));
    if (newOwnerIndex !== -1) {
      // If the new owner already exists, increment their count
      if (rentOption) {
        return res.json({
          success: false,
          message: 'Why would you rent the same item again? You are smoking crack...'
        });
      } else {
        item.owners[newOwnerIndex].count += 1;
        item.owners[newOwnerIndex].rentOption = rentOption;
      }
    } else {
      // If the new owner doesn't exist, add them to the owners array
      item.owners.push(newItemOwner);
    }

    // Save changes and transactions
    const savePromises = [
      currentUser.save(),
      itemCreator.save(),
      item.save(),
      newTransactionC.save(),
      newTransactionJ.save(),
    ];

    await Promise.all(savePromises);

    res.json({
      success: true,
      balance: currentUser.balance,
      newTransaction: newTransactionC,
      message: rentOption ? 'FIRST MONTH PAYMENT 🤝 SUCCESSFUL' : 'TRADE 🤝 SUCCESSFUL'
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: rentOption ? "An error occurred during the renting" : "An error occurred during the trade",
      error: err.message,
    });
  }
});

// /api/accessory
router.post('/accessory', auth, async (req, res) => {
  try {
    const { _id } = req.body;
    const user = await User.findOne({ _id: _id }).select('accessory');
    if (!user) {
      return res.json({
        success: false,
        message: 'User not found',
      });
    }
    res.json({
      success: true,
      accessory: user.accessory,
    });
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: 'An error occurred while fetching the accessory',
      error: err.message,
    });
  }
});

// Update accessory
router.post('/equip', auth, async (req, res) => {
  try {
    const { item_id } = req.body;
    const userId = req.user._id;
    const user = await User.findOne({ _id: userId }).select('accessory');
    if (!user) {
      return res.json({
        success: false,
        message: 'User not found',
      });
    }

    const item = await Item.findOne({ _id: item_id }).select('image');


    if (String(user.accessory) === String(item.image)) {
      user.accessory = null; // Remove the accessory
      await user.save();
      return res.json({
        success: true,
        message: 'Accessory unequipped',
      });
    } else {
      user.accessory = item.image;
      await user.save();
      return res.json({
        success: true,
        message: 'Item equipped successfully',
      });
    }
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: 'An error occurred while updating the accessory',
      error: err.message,
    });
  }
});



router.get('/my-items', auth, async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const sort = 'owners.price';
  const itemTypeFilter = req.query.itemType;
  const userId = req.user._id;
  try {
    let query = { 'owners.onSale': { $gt: 0 } };
    if (itemTypeFilter) {
      query['item_type'] = itemTypeFilter;
    }
    const items = await Item.find({ 'owners.user': userId, ...query })
      .sort({ updated_at: 'desc' })
      .skip(pagination * page - pagination)
      .limit(pagination);

    const count = await Item.countDocuments({ 'owners.user': userId });

    let item_list = [];

    for (const item of items) {
      // Map the owners array to include only the owner matching the user ID
      const owner = item.owners.find(owner => owner.user.equals(userId));

      if (owner && owner.count > 0) {
        item_list.push({
          _id: item._id,
          productName: item.productName,
          rentOption: owner.rentOption,
          price: owner ? owner.price : '',
          total_count: owner.count,
          onSale: owner.onSale,
          image: item.image,
          item_type: item.item_type,
          CP: item.CP,
          created_at: item.created_at,
        });
      }
    }

    // if (sort === 'created_at') {
    //   item_list.sort((a, b) => a.created_at - b.created_at);
    // } else {
    //   item_list.sort((a, b) => a.owners[0].price - b.owners[0].price);
    // }


    res.json({
      success: true,
      query: req.query,
      total: count,
      items: item_list,
      pages: Math.ceil(count / pagination),
    });
  } catch (err) {
    res.json({
      success: false,
      err: err,
    });
  }
});

router.get('/products', auth, async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const userId = req.query.id;
  // console.log(userId)
  try {
    let query = { 'owners.onSale': { $gt: 0 } };
    
    const items = await Item.find({ 'owners.user': userId, ...query })
      .sort({ updated_at: 'desc' })
      .skip(pagination * page - pagination)
      .limit(pagination);

    const count = await Item.countDocuments({ 'owners.user': userId });

    let item_list = [];

    for (const item of items) {
      // Map the owners array to include only the owner matching the user ID
      const owner = item.owners.find(owner => owner.user.equals(userId));

      if (owner && owner.count > 0) {
        item_list.push({
          _id: item._id,
          productName: item.productName,
          rentOption: owner.rentOption,
          price: owner ? owner.price : '',
          total_count: owner.count,
          onSale: owner.onSale,
          image: item.image,
          item_type: item.item_type,
          CP: item.CP,
          created_at: item.created_at,
        });
      }
    }



    res.json({
      success: true,
      query: req.query,
      total: count,
      items: item_list,
      pages: Math.ceil(count / pagination),
    });
  } catch (err) {
    res.json({
      success: false,
      err: err,
    });
  }
});

// List an item for sale or rent
router.post('/list-for-sale', auth, async (req, res) => {
  try {
    const { item_id, price, rentOption } = req.body;
    // Find the item using the new model
    const item = await Item.findOne({ _id: item_id });

    if (!item) {
      return res.json({
        success: false,
        message: 'Item not found',
      });
    }

    // Find the owner's index in the owners sub-array
    const ownerIndex = item.owners.findIndex((ownerObj) => ownerObj.user.equals(req.user._id));

    if (ownerIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not the owner of this item',
      });
    }

    // Check if rentOption is true
    if (rentOption) {
      item.owners[ownerIndex].rentOption = rentOption;
      // Ensure item_type is '653ee81117c9f5ee2124564b' when rentOption is true
      if (item.item_type.toString() !== '653ee81117c9f5ee2124564b') {
        return res.json({
          success: false,
          message: 'Rent option can only be applied to items of type "653ee81117c9f5ee2124564b"',
        });
      }
    } else {
      item.owners[ownerIndex].rentOption = false;

    }

    // Check if the onSale value is less than the item's count
    if (item.owners[ownerIndex].onSale < item.owners[ownerIndex].count) {
      // Increment the onSale field
      item.owners[ownerIndex].onSale += 1;
      item.owners[ownerIndex].price = price;

      // Save changes to the item
      await item.save();

      return res.json({
        success: true,
        message: rentOption
          ? `Item '${item.productName}' listed for rent at ${price} ETH per month`
          : `Item '${item.productName}' listed for sale at ${price} ETH`,
      });
    } else {
      return res.json({
        success: false,
        message: `No more '${item.productName}' left to sell or rent.`,
      });
    }
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: "An error occurred while listing the item for sale or rent",
      error: err.message,
    });
  }
});


// Delist an item from sale
router.post('/delist-from-sale', auth, async (req, res) => {
  try {
    const { item_id } = req.body;

    const item = await Item.findOne({ _id: item_id });
    if (!item) {
      return res.json({
        success: false,
        message: 'Item not found',
      });
    }

    const ownerIndex = item.owners.findIndex((ownerObj) => ownerObj.user.equals(req.user._id));

    if (ownerIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not the owner of this item',
      });
    }

    // Check if the onSale value is greater than 0
    if (item.owners[ownerIndex].onSale > 0) {
      // Decrement the onSale field
      item.owners[ownerIndex].onSale -= 1;

      if (item.owners[ownerIndex].onSale -= 1
      ) {
        item.owners[ownerIndex].rentOption = false;
      }
      // Save changes to the item
      await item.save();

      return res.json({
        success: true,
        message: `Item '${item.productName}' delisted from sale`,
      });
    } else {
      return res.json({
        success: false,
        message: `No '${item.productName}' currently listed for sale.`,
      });
    }
  } catch (err) {
    console.error('Error:', err);
    res.json({
      success: false,
      message: "An error occurred while delisting the item from sale",
      error: err.message,
    });
  }
});


// /api/item/:id call
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id });

    res.json({
      success: true,
      query: req.query,
      item: {
        _id: item._id,
        item: item.item
      }
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});
// /api/items call
router.get('/', async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;

  // const sort = req.query.sortBy === 'price' ? 'owners.price' : 'created_at';
  const sort = 'owners.price';

  const itemTypeFilter = req.query.itemType;

  try {
    let query = { 'owners.onSale': { $gt: 0 } };
    if (itemTypeFilter) {
      query['item_type'] = itemTypeFilter;
    }
    const items = await Item.find(query)
      .skip(pagination * page - pagination)
      .limit(pagination);

    const count = await Item.countDocuments(query);

    let item_list = [];

    for (const item of items) {
      // Calculate the total count for this item
      const totalCount = item.owners.reduce((sum, owner) => sum + owner.count, 0);

      // Create a separate entry for each owner
      for (const owner of item.owners) {
        if (owner.onSale) {
          item_list.push({
            _id: item._id,
            productName: item.productName,
            owners: [
              {
                user: owner.user,
                count: owner.count,
                price: owner.price,
                onSale: owner.onSale,
                rentOption: owner.rentOption,
              },
            ],
            total_count: totalCount, // Include the total count
            item_type: item.item_type,
            image: item.image,
            CP: item.CP,
            created_at: item.created_at,
          });
        }
      }
    }
    if (sort === 'created_at') {
      item_list.sort((a, b) => a.created_at - b.created_at);
    } else {
      item_list.sort((a, b) => a.owners[0].price - b.owners[0].price);
    }

    res.json({
      success: true,
      query: req.query,
      total: count,
      items: item_list,
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
