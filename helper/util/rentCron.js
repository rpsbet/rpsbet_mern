const cron = require('node-cron');
const Item = require('../../model/Item');
const User = require('../../model/User');
const Transaction = require('../../model/Transaction');

async function checkRentalPayments() {
  try {
    // Get all items from the database
    const items = await Item.find();

    // Iterate through each item
    for (const item of items) {
      // Iterate through each owner in the item's owners array
      for (const owner of item.owners) {
        // Check the specified conditions
        if (
          owner.count === 1 &&
          owner.onSale === 0 &&
          owner.rentOption === true &&
          owner.originalOwner &&
          owner.lastPayment
        ) {
          const currentDate = new Date();
          const lastPaymentDate = new Date(owner.lastPayment);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(currentDate.getMonth() - 1);

          // Check if it's been more than 1 month since the last payment
          if (lastPaymentDate <= oneMonthAgo) {
            // Find the current user
            const currentUser = await User.findOne({ _id: owner.user });

            // Calculate the amount to deduct (minimum of the balance or the price)
            let amountToDeduct = Math.min(parseFloat(owner.price), currentUser.balance);

            // Check if deducting the amount will result in a negative balance
            if (amountToDeduct > currentUser.balance) {
              // If so, deduct enough to make the balance 0
              amountToDeduct = currentUser.balance;

               // Check if the original owner already exists in the owners array
            const originalOwnerIndex = item.owners.findIndex((ownerObj) => ownerObj.user.equals(owner.originalOwner));

            if (originalOwnerIndex !== -1) {
              // If the original owner already exists, increment their count
              item.owners[originalOwnerIndex].count += 1;
            } else {
              // If the original owner doesn't exist, add them to the owners array
              item.owners.push({
                user: owner.originalOwner,
                count: 1,
                price: owner.price,
                rentOption: true
              });
            }

            // Set the count to 0 for the current owner
            owner.count = 0;
            owner.rentOption = false;
            }

            // Deduct the amount from the user's balance
            currentUser.balance -= amountToDeduct;

            // Find the original owner
            const originalOwner = await User.findOne({ _id: owner.originalOwner });

            // Increase the balance for the original owner
            originalOwner.balance += amountToDeduct;

            // Create new transaction records
            const newTransactionC = new Transaction({
              user: currentUser,
              amount: -amountToDeduct,
              description: `Rental payment for item ${item.productName}`,
            });

            const newTransactionJ = new Transaction({
              user: originalOwner,
              amount: amountToDeduct,
              description: `Rental income from item ${item.productName}`,
            });

            // Update the lastPayment for the item owner
            owner.lastPayment = currentDate;

           

            // Save changes and transactions
            await Promise.all([
              currentUser.save(),
              originalOwner.save(),
              newTransactionC.save(),
              newTransactionJ.save(),
              item.save(),
            ]);

            console.log(`Rental payment processed for item ${item.productName}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error taking rental payments', error);
  }
}

// Schedule the cron job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  await checkRentalPayments();
});

// Export an object containing the function
module.exports = {
  checkRentalPayments,
};
