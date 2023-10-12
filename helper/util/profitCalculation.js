// profitCalculation.js
const calculate7dayProfit = transactions => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  // Adjust the time to start at the beginning of the day
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const sevenDayTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.created_at);
    return transactionDate >= sevenDaysAgo && transactionDate <= today;
  });

  const sevenDayProfit = sevenDayTransactions.reduce((total, transaction) => {
    return total + transaction.amount;
  }, 0);

  return sevenDayProfit;
};

const calculate1dayProfit = transactions => {
  const today = new Date();

  const oneDayTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.created_at);
    return transactionDate.toDateString() === today.toDateString();
  });

  const oneDayProfit = oneDayTransactions.reduce((total, transaction) => {
    return total + transaction.amount;
  }, 0);

  return oneDayProfit;
};

const calculateAllTimeProfit = transactions => {
  const sortedTransactions = transactions.slice().sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return dateA - dateB;
  });

  const oldestTransactionDate = new Date(sortedTransactions[0].created_at);
  const today = new Date();

  const allTimeProfitTransactions = sortedTransactions.filter(transaction => {
    const transactionDate = new Date(transaction.created_at);
    return transactionDate >= oldestTransactionDate && transactionDate <= today;
  });

  const allTimeProfit = allTimeProfitTransactions.reduce(
    (total, transaction) => {
      return total + transaction.amount;
    },
    0
  );

  return allTimeProfit;
};

module.exports = {
  calculate7dayProfit,
  calculate1dayProfit,
  calculateAllTimeProfit
};
