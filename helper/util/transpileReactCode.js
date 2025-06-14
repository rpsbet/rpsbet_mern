// helper/transpileReactCode.js
// Shared utility for transpiling React code to be used across multiple endpoints

async function transpileReactCode(code) {
  try {
    // Remove imports and exports first
    const cleanedCode = code
      .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g, '')
      .replace(/require\s*\(\s*['"][^'"]+['"]\s*\)\s*;?/g, '')
      .replace(/export\s+default\s+[\w\s]*?\s*;?/g, '')
      .replace(/export\s+[\w\s]*?\s*;?/g, '')
      .replace(/import\s*\(\s*['"][^'"]+['"]\s*\)\s*;?/g, '')
      .trim();

    // Babel helpers
    const babelHelpers = `
      function _defineProperty(obj, key, value) {
        if (key in obj) {
          Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      function _slicedToArray(arr, i) {
        return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
      }
      function _arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
      }
      function _iterableToArrayLimit(arr, i) {
        var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
        if (_i == null) return;
        var _arr = [];
        var _n = true;
        var _d = false;
        var _s, _e;
        try {
          for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
          }
        } catch (err) {
          _d = true;
          _e = err;
        } finally {
          try {
            if (!_n && _i["return"] != null) _i["return"]();
          } finally {
            if (_d) throw _e;
          }
        }
        return _arr;
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
        return arr2;
      }
      function _nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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
      }
    `;

    // Ensure babel is available - you might need to adjust this import path
    const babel = require('@babel/core');

    // FIXED: Use sync version and proper preset configuration
    const result = babel.transformSync(cleanedCode, {
      presets: [
        ['@babel/preset-react', {
          runtime: 'classic', // Changed from 'automatic' to 'classic'
          pragma: 'React.createElement' // Explicit pragma
        }],
        ['@babel/preset-env', {
          modules: false,
          targets: { browsers: ['last 2 versions'] },
          // Ensure compatibility
          loose: true
        }]
      ],
      filename: 'game-component.jsx',
      // Add these options for better compatibility
      compact: false,
      comments: false
    });

    if (!result || !result.code) {
      throw new Error('Babel transpilation returned empty result');
    }

    // Combine helpers with transpiled code
    const finalCode = `${babelHelpers}\n${result.code}`;

    // FIXED: Create a proper component factory that returns the component directly
    const componentFactoryCode = `
(function(React, useState, useEffect, useRef, useMemo, useCallback, useAnimation,
  Grid, Box, Typography, TextField, Button, Slider, Dialog, Divider, Paper, Chip,
  Collapse, DialogContent, DialogTitle, CircularProgress, logEvent, FontAwesomeIcon,
  TableContainer, Table, TableBody, TableRow, TableCell, TableHead,
  faDice, faCoins, faPlay, faRocket, faChevronDown, faGem, faSpinner, faCogs,
  faExchangeAlt, faTrophy, faArrowUp, faArrowDown, faRedo, faBomb, faStar, faHome,
  Physics, Card, CardContent, CardActions, Tooltip, motion, styled, AnimatePresence,
  IconButton, Container, Badge, Snackbar, Alert, DialogContentText, DialogActions,
  Zoom, Modal, Grow, faInfoCircle, faChevronUp, faVolumeUp, faVolumeMute, faCog,
  faExclamationTriangle, faCheck, faTimes, faHistory, faChartLine, faWallet,
  faShieldAlt, faHeart, faSkull, faClock, faBolt, proxiedAssets, faQuestionCircle) {
  
  ${finalCode}
  
  // Return the App component
  return typeof App !== 'undefined' ? App : null;
})`;

    return componentFactoryCode;

  } catch (error) {
    console.error('Babel transpilation error:', error);
    throw new Error(`Babel transpilation failed: ${error.message}`);
  }
}

module.exports = transpileReactCode;