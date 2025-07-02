// helper/util/reactGenerator.js - COMPLETE SMART TARGETING + COMPREHENSIVE GAME LOGIC

const Anthropic = require('@anthropic-ai/sdk');
const transpileReactCode = require('./transpileReactCode');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Dynamic complexity assessment
function assessComplexity(prompt) {
  let complexity = 0;
  
  // Length factor
  complexity += Math.min(prompt.length / 100, 3);
  
  // Complexity indicators
  const complexityIndicators = [
    'battle', 'arena', 'versus', 'multiplayer', 'real-time', 'animation',
    'physics', 'collision', 'ai', 'strategy', 'multiple', 'levels',
    'characters', 'inventory', 'combat', 'tournament', 'leaderboard',
    'crash', 'mines', 'chart', 'graph', 'timer', 'countdown'
  ];
  
  const foundIndicators = complexityIndicators.filter(indicator => 
    prompt.toLowerCase().includes(indicator)
  ).length;
  
  complexity += foundIndicators * 0.5;
  
  // Interaction complexity
  if (prompt.includes('choose') || prompt.includes('select')) complexity += 0.5;
  if (prompt.includes('timer') || prompt.includes('countdown')) complexity += 0.5;
  if (prompt.includes('score') || prompt.includes('points')) complexity += 0.5;
  if (prompt.includes('2x') || prompt.includes('multiplier')) complexity += 0.5;
  
  return Math.min(complexity, 10); // Cap at 10
}

// Get progressive token allocation
function getTokenAllocation(complexity, attempt = 1) {
  const baseTokens = 8000;
  const complexityMultiplier = 1 + (complexity * 0.3);
  const attemptMultiplier = Math.pow(1.3, attempt - 1);
  
  return Math.min(baseTokens * complexityMultiplier * attemptMultiplier, 16000);
}

// Targeted error detection with specific locations
function detectSpecificErrors(code) {
  const errors = [];
  const lines = code.split('\n');
  
  // 1. Missing function ending (most critical)
  if (!code.trim().endsWith('})')) {
    const lastMeaningfulLine = lines.length - 1;
    
    errors.push({
      type: 'MISSING_ENDING',
      severity: 'CRITICAL',
      location: lastMeaningfulLine,
      description: 'Missing proper function ending',
      fixable: true
    });
  }
  
  // 2. Broken useState patterns
  const brokenStateLines = lines.map((line, index) => {
    if (line.match(/var\s+\w+\s*=\s*useState\([^)]*\)\[0\]/)) {
      return { type: 'BROKEN_USESTATE', line: index, content: line, fixable: true };
    }
    return null;
  }).filter(Boolean);
  
  if (brokenStateLines.length > 0) {
    errors.push({
      type: 'BROKEN_USESTATE',
      severity: 'CRITICAL',
      locations: brokenStateLines,
      description: 'Broken useState destructuring pattern',
      fixable: true
    });
  }
  
  // 3. Incomplete React.createElement calls
  const incompleteCreateElements = lines.map((line, index) => {
    if (line.match(/React\.createElement\([^)]+$/)) {
      return { line: index, content: line };
    }
    return null;
  }).filter(Boolean);
  
  if (incompleteCreateElements.length > 0) {
    errors.push({
      type: 'INCOMPLETE_CREATEELEMENT',
      severity: 'HIGH',
      locations: incompleteCreateElements,
      description: 'Incomplete React.createElement calls',
      fixable: true
    });
  }
  
  // 4. Missing core requirements (validation only, don't auto-fix)
  if (!code.includes('logEvent')) {
    errors.push({
      type: 'MISSING_LOGEVENT',
      severity: 'MEDIUM',
      description: 'Missing logEvent integration',
      fixable: false
    });
  }
  
  if (!code.includes('onDepositSuccess')) {
    errors.push({
      type: 'MISSING_DEPOSIT_FLOW',
      severity: 'MEDIUM',
      description: 'Missing deposit flow handling',
      fixable: false
    });
  }
  
  // 5. Potential null reference in array filtering
  const filterWithIdPatterns = code.match(/\.filter\([^)]*\.id[^)]*\)/g);
  if (filterWithIdPatterns) {
    const unsafeFilters = filterWithIdPatterns.filter(pattern => 
      !pattern.includes('&&') && !pattern.includes('item') && !pattern.includes('monster')
    );
    
    if (unsafeFilters.length > 0) {
      errors.push({
        type: 'UNSAFE_FILTER',
        severity: 'HIGH',
        description: 'Array filter accessing .id without null check',
        fixable: true,
        patterns: unsafeFilters
      });
    }
  }
  
  return errors;
}

// Targeted fix generation - only fix specific problems
async function generateTargetedFix(error, codeContext, gameType) {
  console.log(`🎯 Generating targeted fix for: ${error.type}`);
  
  switch (error.type) {
    case 'MISSING_ENDING':
      return `
  return typeof App !== 'undefined' ? App : null;
})`;
    
    case 'BROKEN_USESTATE':
      const fixes = error.locations.map((loc, index) => {
        const match = loc.content.match(/var\s+(\w+)\s*=\s*useState\(([^)]*)\)\[0\]/);
        if (match) {
          const varName = match[1];
          const initialValue = match[2];
          const setterName = 'set' + varName.charAt(0).toUpperCase() + varName.slice(1);
          return `var _useState${Date.now() + index} = useState(${initialValue}),\n    ${varName} = _useState${Date.now() + index}[0],\n    ${setterName} = _useState${Date.now() + index}[1];`;
        }
        return loc.content;
      });
      return fixes.join('\n');
    
    case 'UNSAFE_FILTER':
      // Add null checks to filter operations
      return error.patterns.map(pattern => {
        return pattern.replace(/\.filter\(([^)]*\.id[^)]*)\)/, '.filter(function(item) { return item && $1; })');
      }).join('\n');
    
    case 'INCOMPLETE_CREATEELEMENT':
      // For incomplete createElement, generate a simple completion
      const completions = error.locations.map(loc => {
        const line = loc.content;
        // Simple completion - close the createElement call
        if (line.includes('React.createElement(')) {
          return line + ')';
        }
        return line;
      });
      return completions.join('\n');
    
    default:
      return null;
  }
}

// Apply targeted fixes to specific locations
function applyTargetedFixes(code, errors, fixes) {
  let fixedCode = code;
  const lines = fixedCode.split('\n');
  
  errors.forEach((error, index) => {
    const fix = fixes[index];
    if (!fix) return;
    
    switch (error.type) {
      case 'MISSING_ENDING':
        if (!fixedCode.trim().endsWith('})')) {
          fixedCode = fixedCode.trim() + '\n\n' + fix;
        }
        break;
      
      case 'BROKEN_USESTATE':
        error.locations.forEach((loc, locIndex) => {
          if (lines[loc.line]) {
            const fixLines = fix.split('\n');
            lines[loc.line] = fixLines[locIndex * 2] || fixLines[0]; // Take appropriate line
          }
        });
        fixedCode = lines.join('\n');
        break;
      
      case 'INCOMPLETE_CREATEELEMENT':
        error.locations.forEach((loc, locIndex) => {
          if (lines[loc.line]) {
            const fixLines = fix.split('\n');
            lines[loc.line] = fixLines[locIndex] || fix;
          }
        });
        fixedCode = lines.join('\n');
        break;
      
      case 'UNSAFE_FILTER':
        // Replace unsafe filter patterns with safe ones
        error.patterns.forEach(pattern => {
          const safePattern = pattern.replace(/\.filter\(([^)]*\.id[^)]*)\)/, '.filter(function(item) { return item && ($1); })');
          fixedCode = fixedCode.replace(pattern, safePattern);
        });
        break;
    }
  });
  
  return fixedCode;
}

// Progressive validation with early exits
function quickValidation(code) {
  const criticalErrors = [];
  
  // Quick checks for showstoppers
  if (!code.trim().endsWith('})')) {
    criticalErrors.push('Missing function ending');
  }
  
  if (code.includes('var gameStarted = useState(false)[0]')) {
    criticalErrors.push('Broken useState pattern');
  }
  
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (Math.abs(openBraces - closeBraces) > 2) {
    criticalErrors.push(`Major brace mismatch (${openBraces}/${closeBraces})`);
  }
  
  return criticalErrors;
}

// Comprehensive validation for final check
function validateReactCode(code) {
  console.log('🔍 COMPREHENSIVE VALIDATION');
  
  const validationErrors = [];
  const codeText = code.toLowerCase();
  
  // Basic syntax validation
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    validationErrors.push(`Syntax error: Unmatched braces (${openBraces} open, ${closeBraces} close)`);
  }

  // Check for logEvent prop handling
  if (!code.includes('{ logEvent }') && !code.includes('logEvent') && !code.includes('props.logEvent')) {
    validationErrors.push('Missing logEvent prop in component signature');
  }

  // Check for specific logEvent patterns
  if (!code.includes('logEvent("gameStarted"') && !code.includes("logEvent('gameStarted'")) {
    validationErrors.push('Missing required gameStarted logging call');
  }

  if (!code.includes('logEvent("gameEnded"') && !code.includes("logEvent('gameEnded'")) {
    validationErrors.push('Missing required gameEnded logging call');
  }

  // Check for practice mode implementation
  if (!code.includes('isPracticeMode') || !code.includes('Practice Mode')) {
    validationErrors.push('Missing practice mode implementation');
  }

  // Check for deposit flow
  if (!code.includes('onDepositSuccess') || !code.includes('isProcessingDeposit')) {
    validationErrors.push('Missing deposit flow handling');
  }

  // Check for house edge implementation
  const hasHouseEdge = code.includes('houseEdge') ||
    code.includes('0.9') ||
    code.includes('Math.min') ||
    code.includes('* 0.') ||
    code.includes('houseEdgeFactor') ||
    code.includes('calculateMultiplier');

  if (!hasHouseEdge) {
    validationErrors.push('Missing house edge enforcement in multiplier calculations');
  }

  // Check for potential null reference errors in filtering
  if (code.includes('.filter(') && code.includes('.id') && !code.includes('&& monster')) {
    validationErrors.push('Potential null reference error in array filtering - add null checks');
  }

  // Enhanced financial terms check
  const strictFinancialTerms = [
    'balance', 'balances',
    'wallet', 'wallets',
    'monetary'
  ];

  const foundFinancialTerms = strictFinancialTerms.filter(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(codeText);
  });

  if (foundFinancialTerms.length > 0) {
    validationErrors.push(`Forbidden financial terms detected: ${foundFinancialTerms.join(', ')}`);
  }

  // Check for required state variables
  const requiredStates = ['gameStarted', 'gameEnded', 'isPracticeMode', 'gameHistory'];
  const missingStates = requiredStates.filter(state => !code.includes(state));
  if (missingStates.length > 0) {
    validationErrors.push(`Missing required state variables: ${missingStates.join(', ')}`);
  }

  console.log(`🔍 Validation completed: ${validationErrors.length} errors found`);
  return validationErrors;
}

// Comprehensive system prompt with all casino game logic
const getComprehensiveSystemPrompt = (gameType = 'game') => `You are an elite React developer creating casino-style games. Generate ONLY the wrapped function code - no explanations, no markdown.

🚨 ULTRA-CRITICAL FORMAT RULES 🚨

1. START WITH EXACTLY THIS (copy-paste it):
(function(React, useState, useEffect, useRef, useMemo, useCallback, useAnimation,
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

2. ADD HELPER FUNCTIONS:
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
  }

3. DEFINE APP COMPONENT:
  var App = function App(_ref) {
    var logEvent = _ref.logEvent;
    
    // ALL GAME CODE HERE
  };

4. END WITH EXACTLY THIS (CRITICAL - NEVER TRUNCATE):
  return typeof App !== 'undefined' ? App : null;
})

🚨 USESTATE PATTERN - MEMORIZE THIS 🚨
❌ NEVER: var gameStarted = useState(false)[0];
❌ NEVER: var setGameStarted = useState(false)[1];
✅ ALWAYS: var _useState = useState(false), gameStarted = _useState[0], setGameStarted = _useState[1];

🚨 MANDATORY CORE STATES 🚨
ALWAYS include these exact useState declarations:
    var _useState1 = useState(false), gameStarted = _useState1[0], setGameStarted = _useState1[1];
    var _useState2 = useState(false), gameEnded = _useState2[0], setGameEnded = _useState2[1];
    var _useState3 = useState(false), isPracticeMode = _useState3[0], setIsPracticeMode = _useState3[1];
    var _useState4 = useState([]), gameHistory = _useState4[0], setGameHistory = _useState4[1];
    var _useState5 = useState(false), isProcessingDeposit = _useState5[0], setIsProcessingDeposit = _useState5[1];
    var _useState6 = useState(null), depositError = _useState6[0], setDepositError = _useState6[1];

🚨 MANDATORY DEPOSIT FLOW HANDLING 🚨
CRITICAL: Include this exact deposit handling pattern:

    var startGame = useCallback(function(practiceMode) {
      if (practiceMode === void 0) { practiceMode = false; }
      setGameEnded(false);
      setIsPracticeMode(practiceMode);
      setDepositError(null);
      
      if (practiceMode) {
        setGameStarted(true);
        // Start game immediately for practice
        return;
      }
      
      setIsProcessingDeposit(true);
      
      if (logEvent) {
        logEvent("gameStarted", { 
          timestamp: new Date().toISOString(),
          gameType: "${gameType}",
          practiceMode: false
        }, {
          onDepositSuccess: function() {
            setIsProcessingDeposit(false);
            setGameStarted(true);
            // Start time-sensitive elements HERE
          },
          onDepositFailed: function() {
            setIsProcessingDeposit(false);
            setDepositError("Deposit failed. Please try again.");
          }
        });
      }
    }, [logEvent]);

🚨 MANDATORY END GAME PATTERN 🚨
    var endGame = useCallback(function(result, multiplier) {
      if (!result || !['win', 'loss'].includes(result)) {
        console.error('❌ Invalid endGame result:', result);
        return;
      }
      
      var finalMultiplier = typeof multiplier === 'string' ? multiplier : String(multiplier || '0.00');
      setGameEnded(true);
      
      if (!isPracticeMode && logEvent) {
        logEvent("gameEnded", { 
          timestamp: new Date().toISOString(),
          result: result,
          multiplier: finalMultiplier,
          gameType: "${gameType}"
        });
      }
      
      setGameHistory(function(prev) {
        return prev.slice(-9).concat([{ 
          result: result, 
          score: finalMultiplier, 
          timestamp: new Date().toISOString(),
          practice: isPracticeMode
        }]);
      });
    }, [isPracticeMode, logEvent]);

🚨 ADVANCED HOUSE EDGE CALCULATIONS 🚨

CRASH GAME - Real-time multiplier with house edge:
    var generateCrashPoint = function() {
      var random = Math.random();
      var crashPoint;
      
      if (random < 0.40) {
        crashPoint = 1 + Math.pow(Math.random(), 2) * 0.99;
      } else if (random < 0.70) {
        crashPoint = 2 + Math.pow(Math.random(), 1.5) * 2.99;
      } else if (random < 0.90) {
        crashPoint = 5 + Math.pow(Math.random(), 2) * 14.99;
      } else if (random < 0.98) {
        crashPoint = 20 + Math.pow(Math.random(), 3) * 79.99;
      } else {
        crashPoint = 100 + Math.pow(Math.random(), 4) * 900;
      }
      
      return Math.max(crashPoint * 0.94, 1.01); // 6% house edge
    };

    // Real-time multiplier progression
    var updateCrashMultiplier = function(startTime, crashPoint) {
      var timeElapsed = (Date.now() - startTime) / 1000;
      var k = 0.03; // Growth rate constant
      var currentMultiplier = Math.exp(k * timeElapsed);
      
      if (currentMultiplier >= crashPoint) {
        return { multiplier: crashPoint, crashed: true };
      }
      
      return { multiplier: currentMultiplier, crashed: false };
    };

MINES GAME - Progressive difficulty:
    var calculateMinesMultiplier = function(safeReveals, totalMines, totalSpaces) {
      var totalSafeSpaces = totalSpaces - totalMines;
      var probability = 1;
      
      for (var i = 0; i < safeReveals; i++) {
        probability *= (totalSafeSpaces - i) / (totalSpaces - i);
      }
      
      var fairMultiplier = 1 / probability;
      var houseEdgeFactor = safeReveals <= 2 ? 0.95 : safeReveals <= 5 ? 0.93 : 0.88;
      var scaledMultiplier = fairMultiplier * houseEdgeFactor;
      var maxMultiplier = totalMines >= 20 ? 1000 : totalMines >= 15 ? 500 : totalMines >= 10 ? 100 : 50;
      
      return Math.min(scaledMultiplier, maxMultiplier).toFixed(2);
    };

DICE GAME - Probability control:
    var calculateDiceMultiplier = function(prediction, rollType) {
      var winProbability = rollType === 'under' ? 
        (prediction - 1) / 100 : (100 - prediction) / 100;
      
      winProbability = Math.max(0.01, Math.min(0.98, winProbability));
      var fairMultiplier = 1 / winProbability;
      var houseEdge = winProbability > 0.5 ? 0.98 : 0.95;
      
      return Math.min(fairMultiplier * houseEdge, 9999).toFixed(2);
    };

SLOTS GAME - Weighted symbols:
    var generateSlotMultiplier = function(reels) {
      var symbolValues = {
        '🍒': 2, '🍋': 3, '🍊': 5, '🍇': 8, '🔔': 15, 
        '💎': 50, '⭐': 100, '🎰': 500
      };
      
      var multiplier = 1;
      var symbolCounts = {};
      
      reels.forEach(function(symbol) {
        symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
      });
      
      Object.entries(symbolCounts).forEach(function(entry) {
        var symbol = entry[0], count = entry[1];
        if (count >= 2) {
          var baseValue = symbolValues[symbol] || 1;
          multiplier += baseValue * Math.pow(count, 1.5);
        }
      });
      
      return Math.min(multiplier * 0.92, 1000).toFixed(2); // 8% house edge
    };

SKILL-BASED GAMES - Performance-based with house edge:
    var calculateSkillMultiplier = function(score, maxScore) {
      var performance = Math.min(score / maxScore, 1);
      var baseMultiplier = 1 + (performance * 2); // Max 3x for perfect score
      var houseEdgeFactor = 0.92; // 8% house edge
      
      return Math.min(baseMultiplier * houseEdgeFactor, 4.0).toFixed(2);
    };

🚨 MANDATORY UI COMPONENTS 🚨

DEPOSIT PROCESSING UI:
      if (isProcessingDeposit) {
        return React.createElement(Box, {
          sx: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center',
            p: 4,
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }
        }, 
          React.createElement(CircularProgress, { sx: { mb: 3, color: '#00ff3a' }, size: 60 }),
          React.createElement(Typography, { 
            variant: "h6", 
            sx: { color: '#fff', mb: 2, fontWeight: 600 }
          }, '🏦 Processing Deposit...'),
          React.createElement(Typography, { 
            variant: "body2", 
            sx: { color: 'rgba(255,255,255,0.7)', textAlign: 'center' }
          }, 'Please confirm the transaction in your wallet.', React.createElement('br'), 'Do not refresh or navigate away from this page.')
        );
      }

DEPOSIT ERROR UI:
      if (depositError) {
        return React.createElement(Box, {
          sx: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center',
            p: 4,
            background: 'rgba(244, 67, 54, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(244, 67, 54, 0.3)'
          }
        },
          React.createElement(Typography, { 
            variant: "h5", 
            sx: { color: '#f44336', mb: 2, fontWeight: 700 }
          }, '⚠️ Deposit Failed'),
          React.createElement(Typography, { 
            variant: "body1", 
            sx: { color: 'rgba(255,255,255,0.8)', mb: 3, lineHeight: 1.6 }
          }, depositError),
          React.createElement(Button, { 
            variant: "contained",
            onClick: resetGame,
            sx: {
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              fontWeight: 600,
              px: 4,
              py: 1.5
            }
          }, 'Try Again')
        );
      }

GAME START BUTTONS:
          React.createElement(Box, { sx: { display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' } },
            React.createElement(Button, { 
              variant: "contained",
              onClick: function() { return startGame(false); },
              disabled: isProcessingDeposit,
              size: "large",
              sx: {
                background: 'linear-gradient(135deg, #00ff3a, #00cc2e)',
                fontSize: '1.1rem',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                textTransform: 'none',
                '&:hover': { 
                  background: 'linear-gradient(135deg, #00cc2e, #009624)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0, 255, 58, 0.4)'
                }
              }
            }, '🎯 Start Game'),
            
            React.createElement(Button, { 
              variant: "outlined",
              onClick: function() { return startGame(true); },
              disabled: isProcessingDeposit,
              size: "large",
              sx: {
                borderColor: '#ffeb3b',
                color: '#ffeb3b',
                fontSize: '1.1rem',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                textTransform: 'none',
                '&:hover': { 
                  backgroundColor: 'rgba(255, 235, 59, 0.1)',
                  borderColor: '#ffeb3b',
                  transform: 'translateY(-2px)'
                }
              }
            }, '🎮 Practice Mode')
          )

🚨 RESPONSIVE DESIGN REQUIREMENTS 🚨
- Use Container with maxWidth="sm" for mobile-first
- Dynamic glassmorphism backgrounds with backdrop-filter: blur()
- Gradient color schemes that adapt to game theme
- Box shadows with rgba colors for depth
- Responsive typography using variant prop

🚨 GAME HISTORY DISPLAY 🚨
        React.createElement(Box, { sx: { mt: 3 } },
          React.createElement(Typography, { 
            variant: "h6", 
            sx: { color: '#fff', mb: 2, fontWeight: 600 }
          }, '📊 Recent Games'),
          React.createElement(Box, { sx: { maxHeight: '200px', overflowY: 'auto' } },
            gameHistory.length === 0 ? 
              React.createElement(Typography, { 
                variant: "body2", 
                sx: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 2 }
              }, 'No games played yet') :
              gameHistory.slice(-5).reverse().map(function(game, index) {
                return React.createElement(Box, {
                  key: game.timestamp || index,
                  sx: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1,
                    mb: 1,
                    background: game.result === 'win' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                    borderRadius: '8px',
                    border: game.result === 'win' ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(244, 67, 54, 0.3)'
                  }
                },
                  React.createElement(Typography, { 
                    variant: "body2", 
                    sx: { color: game.result === 'win' ? '#4caf50' : '#f44336', fontWeight: 600 }
                  }, game.result === 'win' ? '🎉 Won' : '💔 Lost'),
                  React.createElement(Typography, { 
                    variant: "body2", 
                    sx: { color: '#fff' }
                  }, game.score + 'x'),
                  game.practice && React.createElement(Typography, { 
                    variant: "caption", 
                    sx: { color: '#ffeb3b' }
                  }, '🎮')
                );
              })
          )
        )

🚨 TRUNCATION PREVENTION RULES 🚨
- Keep component logic concise but complete
- Use helper functions to reduce repetition
- Prioritize core functionality over excessive styling
- ALWAYS end with the exact closing pattern above
- If approaching token limits, simplify but maintain all required features

🚨 FORBIDDEN PATTERNS - INSTANT FAILURE 🚨
❌ Double function wrappers
❌ var useState = React.useState;
❌ Incomplete React.createElement calls
❌ Placeholder "Win Game" / "Lose Game" buttons
❌ Missing deposit flow handling
❌ Missing house edge calculations
❌ Financial terms: bet, balance, wallet, money
❌ Code that ends abruptly or is truncated

🚨 GAME-SPECIFIC REQUIREMENTS 🚨

CRASH GAME MUST INCLUDE:
- Real-time multiplier updates with requestAnimationFrame
- generateCrashPoint() and updateCrashMultiplier() functions
- Cash out functionality before crash
- Visual progression display
- Chart/graph showing crash line

MINES GAME MUST INCLUDE:
- Grid of clickable tiles (5x5 or customizable)
- Mine placement with random distribution
- Progressive multiplier calculation per reveal
- Auto cash-out on mine hit
- Reveal animations

DICE GAME MUST INCLUDE:
- Prediction input (1-99)
- Over/Under selection
- Dice roll animation
- Real-time multiplier calculation
- Roll history display

SLOTS GAME MUST INCLUDE:
- Multiple spinning reels (3-5 reels)
- Symbol combinations and payouts
- Spin animation effects
- Progressive jackpot display
- Symbol value table

SKILL GAMES MUST INCLUDE:
- Performance-based scoring
- Time limits or action counters
- Progressive difficulty
- Clear win/loss conditions
- Score-to-multiplier conversion

GAME TYPE: ${gameType}

OUTPUT ONLY THE COMPLETE WRAPPED FUNCTION CODE - NO EXPLANATIONS OR MARKDOWN!`;

// Main generation function with progressive approach
async function generateReactComponent(prompt, imageUrls = []) {
  console.log('⚛️ GENERATING COMPREHENSIVE REACT COMPONENT WITH SMART TARGETING');
  
  try {
    // Asset processing
    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter(url => url.length < 500);
    const allImageUrls = imageUrls.length > 0 ? imageUrls : promptUrls.filter(url => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrls = promptUrls.filter(url => /\.(mp3|wav|ogg)$/i.test(url));

    const proxiedAssets = {
      images: allImageUrls.map((url, i) => ({ key: `image${i}`, proxiedUrl: url })),
      audio: audioUrls.map((url, i) => ({ key: `audio${i}`, proxiedUrl: url })),
    };

    // Dynamic complexity assessment
    const complexity = assessComplexity(prompt);
    console.log(`🎯 Assessed complexity: ${complexity.toFixed(1)}/10`);

    // Game type detection
    const gameType = prompt.toLowerCase().includes('crash') ? 'crash' :
                    prompt.toLowerCase().includes('mines') ? 'mines' :
                    prompt.toLowerCase().includes('dice') ? 'dice' :
                    prompt.toLowerCase().includes('slots') ? 'slots' :
                    'skill';

    let attempt = 1;
    const maxAttempts = 3;
    let currentCode = null;
    
    while (attempt <= maxAttempts) {
      console.log(`🔄 Attempt ${attempt}/${maxAttempts}`);
      
      const tokenAllocation = getTokenAllocation(complexity, attempt);
      console.log(`📊 Using ${tokenAllocation} tokens (complexity: ${complexity.toFixed(1)})`);
      
      try {
        if (attempt === 1) {
          // First attempt: Generate full code
          const enhancedPrompt = `Generate a complete React ${gameType} game component for: "${prompt}".

🚨 EFFICIENCY REQUIREMENTS 🚨
- Keep code concise but functional
- Use helper functions to reduce repetition
- Prioritize core game mechanics over excessive styling
- MUST end with: return typeof App !== 'undefined' ? App : null; })
- Include all required states, deposit flow, and house edge calculations

Required features:
1. useState pattern: var _useState = useState(false), gameStarted = _useState[0], setGameStarted = _useState[1];
2. onDepositSuccess/onDepositFailed callback handling
3. Practice mode with separate button
4. Real game mechanics that naturally trigger endGame()
5. House edge calculations for ${gameType} games
6. Responsive glassmorphism design
7. Game history display

Include proxiedAssets: ${JSON.stringify(proxiedAssets)}

OUTPUT ONLY THE WRAPPED FUNCTION CODE - NO EXPLANATIONS!`;

          const stream = await anthropic.messages.create({
            model: complexity > 6 ? 'claude-opus-4-20250514' : 'claude-sonnet-4-20250514',
            max_tokens: tokenAllocation,
            temperature: 0.3,
            system: getComprehensiveSystemPrompt(gameType),
            messages: [{ role: 'user', content: enhancedPrompt }],
            stream: true,
          });

          let rawCode = '';
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              rawCode += chunk.delta.text;
            }
          }

          currentCode = rawCode
            .replace(/```(?:jsx?|javascript|react)?/gi, '')
            .replace(/```/g, '')
            .replace(/^[^(]*(?=\(function)/m, '')
            .trim();

        } else {
          // Subsequent attempts: Only fix specific errors
          const specificErrors = detectSpecificErrors(currentCode);
          const fixableErrors = specificErrors.filter(e => e.fixable);
          
          if (fixableErrors.length === 0) {
            console.log('✅ No fixable errors found, proceeding with current code');
            break;
          }
          
          console.log(`🎯 Fixing ${fixableErrors.length} specific errors:`, fixableErrors.map(e => e.type));
          
          // Generate targeted fixes
          const fixes = await Promise.all(
            fixableErrors.map(error => generateTargetedFix(error, currentCode, gameType))
          );
          
          // Apply fixes
          currentCode = applyTargetedFixes(currentCode, fixableErrors, fixes);
        }

        // Quick validation
        const quickErrors = quickValidation(currentCode);
        
        if (quickErrors.length === 0) {
          console.log('✅ Quick validation passed');
          
          // Final comprehensive validation on last attempt or if quick validation passes
          let finalValidationErrors = [];
          if (attempt === maxAttempts || quickErrors.length === 0) {
            finalValidationErrors = validateReactCode(currentCode);
          }
          
          // Test transpilation if available
          let transpiledCode = currentCode;
          try {
            if (transpileReactCode) {
              transpiledCode = await transpileReactCode(currentCode);
            }
          } catch (transpileError) {
            console.warn('⚠️ Transpilation test failed:', transpileError.message);
            if (attempt < maxAttempts) {
              attempt++;
              continue;
            }
          }

          console.log(`✅ Component generated successfully (attempt ${attempt})`);
          
          return {
            originalCode: currentCode,
            transpiledCode: transpiledCode,
            finalApp: transpiledCode,
            proxiedAssets,
            validation: {
              passed: finalValidationErrors.length === 0,
              warnings: finalValidationErrors.filter(e => e.startsWith('WARNING') || e.includes('Missing')),
              errors: finalValidationErrors.filter(e => !e.startsWith('WARNING') && !e.includes('Missing')),
              attempt: attempt,
              complexity: complexity,
              tokensUsed: tokenAllocation,
              gameType: gameType,
              fixesApplied: attempt > 1,
              checkedItems: [
                'Dynamic complexity assessment',
                'Progressive token allocation',
                'Targeted error fixing',
                'useState pattern validation',
                'Deposit flow integration',
                'House edge calculations',
                'Practice mode implementation',
                'Game mechanics validation',
                'Responsive design',
                'Financial terms compliance'
              ]
            }
          };
        } else {
          console.log(`❌ Quick validation failed (attempt ${attempt}):`, quickErrors);
          if (attempt === maxAttempts) {
            throw new Error(`Validation failed after ${maxAttempts} attempts: ${quickErrors.join('; ')}`);
          }
        }

      } catch (generationError) {
        console.error(`❌ Generation error (attempt ${attempt}):`, generationError.message);
        if (attempt === maxAttempts) {
          throw generationError;
        }
      }
      
      attempt++;
    }

    throw new Error(`Failed to generate valid React component after ${maxAttempts} attempts`);

  } catch (error) {
    console.error('❌ Fatal error in generateReactComponent:', error);
    throw new Error(`React generation failed: ${error.message}`);
  }
}

module.exports = {
  generateReactComponent,
  assessComplexity,
  detectSpecificErrors,
  generateTargetedFix,
  quickValidation,
  validateReactCode,
  getComprehensiveSystemPrompt
};