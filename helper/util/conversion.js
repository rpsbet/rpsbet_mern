const convertToCurrency = input =>
  `${input.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} BUSD`;

module.exports = convertToCurrency;
module.exports.convertToCurrency = convertToCurrency;
