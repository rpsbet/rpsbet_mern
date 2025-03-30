// helpers/validateCode.js
const { parse } = require('@babel/parser');

function validateJavaScript(code) {
  try {
    // Parse the code as an ES module
    parse(code, {
      sourceType: 'module',
      allowReturnOutsideFunction: true, // In case user returns in top-level
      errorRecovery: false, // We want a hard error, not partial parse
    });
    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: err };
  }
}

module.exports = validateJavaScript;