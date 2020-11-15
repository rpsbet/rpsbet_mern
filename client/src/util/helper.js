export const cleanObj = obj => {
  let newObj = {};
  Object.keys(obj).forEach(prop => {
    if (obj[prop]) {
      newObj[prop] = obj[prop];
    }
  });
  return newObj;
};

export const hpGoToInput = id => {
  document.getElementById(id).focus();
};

export function updateDigitToPoint2(number) {
  if (parseFloat(number) - parseInt(number) > 0) {
      return parseFloat(number).toFixed(2);
  }
  return number;
}