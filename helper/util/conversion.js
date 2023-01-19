const convertToCurrency = input => {
  let number = Number(input);
  if(!isNaN(number)){
      let [whole, decimal] = number.toFixed(2).toString().split('.');
      whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `${whole}.${decimal} BUSD`;
  }else{
      return input;
  }
};







module.exports = convertToCurrency;
module.exports.convertToCurrency = convertToCurrency;
