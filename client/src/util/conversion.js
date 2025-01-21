import React from 'react';

export const convertToCurrency = (input, solPrice) => {
  let number = Number(input);

  if (!isNaN(number) && solPrice) {
    number = number * solPrice;
    number = Math.floor(number * 100) / 100;

    // Format number for K (thousands) and M (millions)
    let formattedNumber = '';
    if (number >= 1000000) {
      // For millions
      formattedNumber = (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
      // For thousands
      formattedNumber = (number / 1000).toFixed(1) + 'K';
    } else {
      // For numbers less than 1000
      let [whole, decimal] = number.toFixed(2).split('.');
      whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

      if (decimal) {
        decimal = decimal.replace(/0+$/, '');
      }

      formattedNumber = decimal ? `${whole}.${decimal}` : whole;
    }

    return (
      `$${formattedNumber}`
    );
  } else {
    return input;
  }
};