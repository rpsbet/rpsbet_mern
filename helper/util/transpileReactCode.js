// helper/transpileReactCode.js - SIMPLIFIED VERSION
// Since we're now generating code in the correct format directly, 
// this function just validates and cleans the format

async function transpileReactCode(code) {
  try {
    console.log('📋 VALIDATING WRAPPED FUNCTION FORMAT');
    
    // Check if code is already in wrapped function format
    const isWrappedFormat = code.trim().startsWith('(function(React, useState') && 
                          code.trim().endsWith('})');
    
    if (isWrappedFormat) {
      console.log('✅ Code is already in correct wrapped function format');
      return code.trim();
    }
    
    console.log('⚠️ Code is not in wrapped format, attempting to wrap it...');
    
    // If it's a standard React component, wrap it
    // Remove imports and exports
    let cleanedCode = code
      .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g, '')
      .replace(/require\s*\(\s*['"][^'"]+['"]\s*\)\s*;?/g, '')
      .replace(/export\s+default\s+[\w\s]*?\s*;?$/gm, '')
      .replace(/export\s+[\w\s]*?\s*;?/g, '')
      .trim();

    // Add helper functions if not present
    const needsHelpers = !cleanedCode.includes('_defineProperty') || !cleanedCode.includes('_objectSpread');
    
    let helpers = '';
    if (needsHelpers) {
      helpers = `
      function _defineProperty(obj, key, value) {
        if (key in obj) {
          Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      
      function _objectSpread(target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i] != null ? arguments[i] : {};
          var ownKeys = Object.keys(source);
          if (typeof Object.getOwnPropertySymbols === 'function') {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
              return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
          }
          ownKeys.forEach(function (key) {
            _defineProperty(target, key, source[key]);
          });
        }
        return target;
      }`;
    }

    // Wrap in the correct function format
    const wrappedCode = `(function(React, useState, useEffect, useRef, useMemo, useCallback, useAnimation,
  Grid, Box, Typography, TextField, Button, Slider, Dialog, Divider, Paper, Chip,
  Collapse, DialogContent, DialogTitle, LinearProgress, CircularProgress, logEvent, FontAwesomeIcon,
  TableContainer, Table, TableBody, TableRow, TableCell, TableHead,
  faDice, faCoins, faPlay, faRocket, faChevronDown, faGem, faSpinner, faCogs,
  faExchangeAlt, faTrophy, faArrowUp, faArrowDown, faRedo, faBomb, faStar, faHome,
  Physics, Card, CardContent, CardActions, Tooltip, motion, styled, AnimatePresence,
  IconButton, Container, Badge, Snackbar, Alert, DialogContentText, DialogActions,
  Zoom, Modal, Grow, faInfoCircle, faChevronUp, faVolumeUp, faVolumeMute, faCog,
  faExclamationTriangle, faCheck, faTimes, faHistory, faChartLine, faWallet,
  faShieldAlt, faHeart, faSkull, faClock, faBolt, proxiedAssets, faQuestionCircle) {
  ${helpers}
  
  ${cleanedCode}
  
  // Return the App component
  return typeof App !== 'undefined' ? App : null;
})`;

    console.log('✅ Code wrapped in correct format');
    return wrappedCode;

  } catch (error) {
    console.error('❌ Error processing code:', error);
    throw new Error(`Code processing failed: ${error.message}`);
  }
}

module.exports = transpileReactCode;