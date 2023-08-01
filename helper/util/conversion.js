const convertToCurrency = input => {
  let number = Number(input);
  if(!isNaN(number)){
    number = Math.floor(number * 100) / 100; // round down to 2 decimal places
      let [whole, decimal] = number.toFixed(2).toString().split('.');
      whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `<svg id='busd' width="0.7em" height="0.7em" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
      viewBox="0 0 1920 1920" enable-background="new 0 0 1920 1920" xml:space="preserve">
   <g>
     <polygon fill="#8A92B2" points="959.8,80.7 420.1,976.3 959.8,731 	"/>
     <polygon fill="#62688F" points="959.8,731 420.1,976.3 959.8,1295.4 	"/>
     <polygon fill="#62688F" points="1499.6,976.3 959.8,80.7 959.8,731 	"/>
     <polygon fill="#454A75" points="959.8,1295.4 1499.6,976.3 959.8,731 	"/>
     <polygon fill="#8A92B2" points="420.1,1078.7 959.8,1839.3 959.8,1397.6 	"/>
     <polygon fill="#62688F" points="959.8,1397.6 959.8,1839.3 1499.9,1078.7 	"/>
   </g>
   </svg>&thinsp;${whole}.${decimal}`;
  }else{
      return input;
  }
};






module.exports = convertToCurrency;
module.exports.convertToCurrency = convertToCurrency;
