// helper/util/reactGenerator.js - ENHANCED VERSION

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function detectCriticalErrors(code) {
  const errors = [];
  
  // 1. BROKEN useState PATTERN (your exact error)
  const brokenUseStatePattern = /var\s+\w+\s*=\s*useState\([^)]*\)\[0\]/g;
  if (brokenUseStatePattern.test(code)) {
    errors.push('CRITICAL: Broken useState pattern detected');
    console.log('🚨 Found broken useState:', code.match(brokenUseStatePattern));
  }
  
  // 2. TRUNCATED CODE (your exact error)  
  const lastLine = code.split('\n').pop().trim();
  const truncationPatterns = [
    /sx:\s*{$/,           // "sx: {"
    /,\s*sx:\s*{[^}]*$/,  // ", sx: { incomplete"
    /\{\s*sx;$/,          // "{ sx;"
    /createElement\([^)]*$/,  // Incomplete createElement
    /\)\s*:\s*React\.createElement\([^)]*$/,  // Incomplete ternary with createElement
    /,\s*React\.createElement\([^)]*$/,  // Incomplete createElement in list
    /\{\s*textAlign:\s*['"]/,  // Incomplete textAlign property
    /py:\s*\d+\s*}\s*,?\s*$/  // Cut off after py property
  ];
  
  if (truncationPatterns.some(pattern => pattern.test(lastLine))) {
    errors.push('CRITICAL: Code appears truncated');
    console.log('🚨 Truncated ending detected:', lastLine);
  }
  
  // 3. MISSING PROPER ENDING (your exact error)
  if (!code.trim().endsWith('return typeof App !== \'undefined\' ? App : null;\n})') && 
      !code.trim().endsWith('return typeof App !== \'undefined\' ? App : null;\n})')) {
    errors.push('CRITICAL: Missing proper function ending');
  }
  
  // 4. REDUNDANT React DECLARATIONS (your exact error)
  if (code.includes('var useState = React.useState;')) {
    errors.push('CRITICAL: Redundant React hook declarations');
  }
  
  // 5. DOUBLE WRAPPER (causes function nesting errors)
  const wrapperCount = (code.match(/\(function\(React, useState/g) || []).length;
  if (wrapperCount > 1) {
    errors.push('CRITICAL: Multiple function wrappers detected');
  }
  
  // 6. NEW: Check for placeholder buttons (should have real mechanics)
  if (code.includes('Win Game') && code.includes('Lose Game') && code.includes('Button')) {
    errors.push('CRITICAL: Placeholder win/loss buttons detected - needs real game mechanics');
  }
  
  // 7. NEW: Check for incomplete game mechanics
  if (!code.includes('Math.random') && !code.includes('setTimeout') && !code.includes('setInterval')) {
    errors.push('WARNING: No randomization or timing detected - may lack game mechanics');
  }
  
  return errors;
}

// AUTO-FIX FOR CRITICAL ERRORS
function autoFixCriticalErrors(code) {
  console.log('🔧 AUTO-FIXING CRITICAL ERRORS');
  let fixed = code;
  
  // Fix 1: Remove double wrapper
  const wrapperMatches = fixed.match(/\(function\(React, useState/g) || [];
  if (wrapperMatches.length > 1) {
    console.log('🔧 Removing double wrapper...');
    const firstIndex = fixed.indexOf('(function(React, useState');
    const secondIndex = fixed.indexOf('(function(React, useState', firstIndex + 1);
    if (secondIndex > -1) {
      fixed = fixed.substring(secondIndex);
    }
  }
  
  // Fix 2: Convert broken useState to proper destructuring
  const stateVarMatches = fixed.match(/var\s+(\w+)\s*=\s*useState\(([^)]*)\)\[0\];\s*var\s+set(\w+)\s*=\s*useState\([^)]*\)\[1\];?/g);
  
  if (stateVarMatches) {
    console.log('🔧 Fixing broken useState patterns...');
    
    stateVarMatches.forEach((match, index) => {
      const varMatch = match.match(/var\s+(\w+)\s*=\s*useState\(([^)]*)\)\[0\];\s*var\s+set(\w+)\s*=\s*useState\([^)]*\)\[1\];?/);
      if (varMatch) {
        const varName = varMatch[1];
        const setterName = 'set' + varMatch[3];
        const initialValue = varMatch[2];
        
        // Create proper destructuring
        const properDestructure = `var _useState${index + 1} = useState(${initialValue}),\n    ${varName} = _useState${index + 1}[0],\n    ${setterName} = _useState${index + 1}[1];`;
        
        fixed = fixed.replace(match, properDestructure);
      }
    });
  }
  
  // Fix 3: Handle individual broken useState patterns
  let stateCounter = 100;
  fixed = fixed.replace(/var\s+(\w+)\s*=\s*useState\(([^)]*)\)\[0\];/g, function(match, varName, initialValue) {
    stateCounter++;
    const setterName = 'set' + varName.charAt(0).toUpperCase() + varName.slice(1);
    return `var _useState${stateCounter} = useState(${initialValue}),\n    ${varName} = _useState${stateCounter}[0],\n    ${setterName} = _useState${stateCounter}[1];`;
  });
  
  // Remove orphaned setter declarations
  fixed = fixed.replace(/var\s+set\w+\s*=\s*useState\([^)]*\)\[1\];\s*/g, '');
  
  // Fix 4: Remove redundant React declarations
  fixed = fixed.replace(/var\s+useState\s*=\s*React\.useState;\s*\n?/g, '');
  fixed = fixed.replace(/var\s+useEffect\s*=\s*React\.useEffect;\s*\n?/g, '');
  fixed = fixed.replace(/var\s+useCallback\s*=\s*React\.useCallback;\s*\n?/g, '');
  fixed = fixed.replace(/var\s+useRef\s*=\s*React\.useRef;\s*\n?/g, '');
  fixed = fixed.replace(/var\s+useMemo\s*=\s*React\.useMemo;\s*\n?/g, '');
  
  // Fix 5: Handle truncated code
  if (!fixed.trim().endsWith('})')) {
    console.log('🔧 Fixing truncated ending...');
    
    // Remove any incomplete trailing syntax patterns
    fixed = fixed.replace(/[,{]\s*sx[^}]*$/, '');
    fixed = fixed.replace(/,\s*$/, '');
    fixed = fixed.replace(/\{\s*sx;?\s*$/, '');
    fixed = fixed.replace(/React\.createElement\([^)]*$/g, '');
    fixed = fixed.replace(/\)\s*:\s*React\.createElement\([^)]*$/g, '');
    
    // Clean up any incomplete trailing elements
    const lines = fixed.split('\n');
    while (lines.length > 0) {
      const lastLine = lines[lines.length - 1].trim();
      if (lastLine.match(/^\s*[,{]\s*$/) || 
          lastLine.match(/sx\s*:\s*{\s*$/) ||
          lastLine.match(/React\.createElement\([^)]*$/)) {
        lines.pop();
      } else {
        break;
      }
    }
    fixed = lines.join('\n');
    
    // Ensure proper ending
    if (!fixed.includes('return typeof App !== \'undefined\' ? App : null')) {
      fixed += '\n\n  return typeof App !== \'undefined\' ? App : null;\n})';
    } else if (!fixed.trim().endsWith('})')) {
      fixed += '\n})';
    }
  }
  
  // Fix 6: Clean up any malformed React.createElement calls
  fixed = fixed.replace(/React\.createElement\([^)]*sx:\s*{[^}]*$/, '');
  
  return fixed;
}

function validateAndFixCode(code) {
  console.log('🔍 ENHANCED VALIDATION AND FIXING');
  
  const errors = [];
  const warnings = [];
  let fixedCode = code;

  // 1. Check for double wrapper (CRITICAL ERROR)
  const wrapperMatches = code.match(/\(function\(React, useState/g) || [];
  if (wrapperMatches.length > 1) {
    errors.push('CRITICAL: Multiple function wrappers detected');
    console.log('🚨 Fixing double wrapper...');
    
    // Find the first wrapper start
    const firstWrapperIndex = code.indexOf('(function(React, useState');
    // Find the second wrapper start
    const secondWrapperIndex = code.indexOf('(function(React, useState', firstWrapperIndex + 1);
    
    if (secondWrapperIndex > -1) {
      // Remove everything before the second wrapper
      fixedCode = code.substring(secondWrapperIndex);
      console.log('✅ Removed duplicate wrapper');
    }
  }

  // 2. Check for incomplete syntax patterns
  const incompletePatterns = [
    /sx:\s*{\s*background:\s*$/m,  // Incomplete sx background
    /sx:\s*{\s*[^}]*$/m,          // Incomplete sx object
    /React\.createElement\([^)]*$/m, // Incomplete React.createElement
    /onClick:\s*function\(\)\s*{\s*$/m, // Incomplete onClick handlers
  ];

  incompletePatterns.forEach((pattern, index) => {
    if (pattern.test(fixedCode)) {
      errors.push(`CRITICAL: Incomplete syntax pattern ${index + 1} detected`);
    }
  });

  // 3. Check for proper wrapper format
  if (!fixedCode.trim().startsWith('(function(React, useState')) {
    errors.push('CRITICAL: Missing proper function wrapper start');
  }

  if (!fixedCode.trim().endsWith('})')) {
    errors.push('CRITICAL: Missing proper function wrapper end');
    console.log('🔧 Attempting to fix wrapper ending...');
    
    // Try to fix missing ending
    if (fixedCode.includes('return typeof App !== \'undefined\' ? App : null')) {
      // Find the return statement and ensure it ends properly
      const returnIndex = fixedCode.lastIndexOf('return typeof App !== \'undefined\' ? App : null');
      if (returnIndex > -1) {
        const beforeReturn = fixedCode.substring(0, returnIndex);
        fixedCode = beforeReturn + 'return typeof App !== \'undefined\' ? App : null;\n})';
        console.log('✅ Fixed wrapper ending');
      }
    } else {
      // Add the missing return and ending
      fixedCode = fixedCode.trim();
      if (!fixedCode.endsWith(';')) {
        fixedCode += ';';
      }
      fixedCode += '\n\n  return typeof App !== \'undefined\' ? App : null;\n})';
      console.log('✅ Added missing return and wrapper ending');
    }
  }

  // 4. Brace and parentheses validation (ENHANCED)
  const openBraces = (fixedCode.match(/{/g) || []).length;
  const closeBraces = (fixedCode.match(/}/g) || []).length;
  const openParens = (fixedCode.match(/\(/g) || []).length;
  const closeParens = (fixedCode.match(/\)/g) || []).length;

  console.log(`📊 Syntax balance: Braces ${openBraces}/${closeBraces}, Parens ${openParens}/${closeParens}`);

  if (Math.abs(openBraces - closeBraces) > 2) {
    errors.push(`CRITICAL: Major brace mismatch (${openBraces} open, ${closeBraces} close)`);
  } else if (openBraces !== closeBraces) {
    warnings.push(`Minor brace mismatch (${openBraces} open, ${closeBraces} close)`);
    
    // Try to auto-fix small brace mismatches
    if (openBraces > closeBraces) {
      const diff = openBraces - closeBraces;
      console.log(`🔧 Auto-fixing ${diff} missing closing braces`);
      
      // Find the last meaningful position to add braces
      const lastReturnIndex = fixedCode.lastIndexOf('return typeof App');
      if (lastReturnIndex > -1) {
        const beforeReturn = fixedCode.substring(0, lastReturnIndex);
        const afterReturn = fixedCode.substring(lastReturnIndex);
        fixedCode = beforeReturn + '}'.repeat(diff) + '\n\n  ' + afterReturn;
      } else {
        fixedCode += '\n' + '}'.repeat(diff);
      }
    }
  }

  // 5. Check for essential game structure
  const hasLogEvent = fixedCode.includes('logEvent');
  const hasGameStates = fixedCode.includes('gameStarted') && fixedCode.includes('gameEnded');
  const hasEndGame = fixedCode.includes('endGame');
  const hasStartGame = fixedCode.includes('startGame');
  const hasRealGameMechanics = fixedCode.includes('Math.random') || fixedCode.includes('setInterval') || fixedCode.includes('setTimeout');

  if (!hasLogEvent) warnings.push('Missing logEvent integration');
  if (!hasGameStates) warnings.push('Missing game state management');
  if (!hasEndGame) warnings.push('Missing endGame function');
  if (!hasStartGame) warnings.push('Missing startGame function');
  if (!hasRealGameMechanics) warnings.push('May lack real game mechanics');

  // 6. Check for truncation indicators
  const truncationIndicators = [
    /sx:\s*{\s*background:\s*$/,
    /\)\s*;?\s*$/,  // Ends with just a closing paren
    /,\s*$/,        // Ends with a comma
    /{\s*$/,        // Ends with an opening brace
  ];

  const lastLine = fixedCode.split('\n').pop().trim();
  if (truncationIndicators.some(pattern => pattern.test(lastLine))) {
    errors.push('CRITICAL: Code appears to be truncated (incomplete ending)');
  }

  // 7. Final structure validation
  if (!fixedCode.includes('var App = function App')) {
    errors.push('CRITICAL: Missing App component definition');
  }

  if (!fixedCode.includes('renderGameContent')) {
    warnings.push('Missing renderGameContent function');
  }

  // 8. Check for placeholder buttons
  if (fixedCode.includes('"Win Game"') || fixedCode.includes('"Lose Game"')) {
    warnings.push('Contains placeholder win/loss buttons - should have real game mechanics');
  }

  console.log(`📋 Validation complete: ${errors.length} errors, ${warnings.length} warnings`);
  
  if (errors.length > 0) {
    console.log('🚨 DETAILED ERRORS:');
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('⚠️ DETAILED WARNINGS:');
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }

  return {
    code: fixedCode,
    errors: errors,
    warnings: warnings,
    isValid: errors.length === 0,
    autoFixed: fixedCode !== code
  };
}

// Simplified focused system prompt
const getEnhancedSystemPrompt = (gameType = 'game') => `Generate a React game component. Output ONLY the code in this exact format:

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

  var App = function App(_ref) {
    var logEvent = _ref.logEvent;

    // useState pattern: var _useState = useState(false), gameStarted = _useState[0], setGameStarted = _useState[1];
    var _useState = useState(false), gameStarted = _useState[0], setGameStarted = _useState[1];
    var _useState2 = useState(false), gameEnded = _useState2[0], setGameEnded = _useState2[1];
    var _useState3 = useState(false), isPracticeMode = _useState3[0], setIsPracticeMode = _useState3[1];
    var _useState4 = useState([]), gameHistory = _useState4[0], setGameHistory = _useState4[1];
    var _useState5 = useState(false), isProcessingDeposit = _useState5[0], setIsProcessingDeposit = _useState5[1];
    var _useState6 = useState(null), depositError = _useState6[0], setDepositError = _useState6[1];

    var gameType = "${gameType}";

    // Game functions
    var startGame = useCallback(function(practiceMode) {
      if (practiceMode === void 0) { practiceMode = false; }
      setGameEnded(false);
      setIsPracticeMode(practiceMode);
      setDepositError(null);
      
      if (practiceMode) {
        setGameStarted(true);
        return;
      }
      
      setIsProcessingDeposit(true);
      
      if (logEvent) {
        logEvent("gameStarted", { 
          timestamp: new Date().toISOString(),
          gameType: gameType,
          practiceMode: false
        }, {
          onDepositSuccess: function() {
            setIsProcessingDeposit(false);
            setGameStarted(true);
          },
          onDepositFailed: function() {
            setIsProcessingDeposit(false);
            setDepositError("Deposit failed. Please try again.");
          }
        });
      } else {
        setIsProcessingDeposit(false);
        setGameStarted(true);
      }
    }, [logEvent]);

    var endGame = useCallback(function(result, multiplier) {
      var finalMultiplier = typeof multiplier === 'string' ? multiplier : String(multiplier || '0.00');
      setGameEnded(true);
      
      if (!isPracticeMode && logEvent) {
        logEvent("gameEnded", { 
          timestamp: new Date().toISOString(),
          result: result,
          multiplier: finalMultiplier,
          gameType: gameType
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

    var resetGame = useCallback(function() {
      setGameStarted(false);
      setGameEnded(false);
      setIsProcessingDeposit(false);
      setDepositError(null);
    }, []);

    // Render logic with deposit handling, game states, actual game mechanics
    // MUST naturally call endGame('win', multiplier) or endGame('loss', '0.00')
    
    return React.createElement(Container, { maxWidth: "md" }, 
      // Your game implementation here
    );
  };

  return typeof App !== 'undefined' ? App : null;
})

CRITICAL: Use this exact pattern. Include real game mechanics that call endGame() naturally.`;

async function generateReactComponent(prompt, imageUrls = []) {
  console.log('⚛️ GENERATING REACT COMPONENT (ENHANCED ERROR PREVENTION)');
  console.log('Prompt:', prompt);

  try {
    // Asset processing (keep your existing logic)
    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter(url => url.length < 500);
    const allImageUrls = imageUrls.length > 0 ? imageUrls : promptUrls.filter(url => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrls = promptUrls.filter(url => /\.(mp3|wav|ogg)$/i.test(url));

    const proxiedAssets = {
      images: allImageUrls.map((url, i) => ({ key: `image${i}`, proxiedUrl: url })),
      audio: audioUrls.map((url, i) => ({ key: `audio${i}`, proxiedUrl: url })),
    };

    let attempt = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempt < maxAttempts) {
      attempt++;
      console.log(`🔄 Generation attempt ${attempt}/${maxAttempts}`);
      
      try {
        // Enhanced prompt based on previous failure
        let enhancedPrompt = `Generate a complete React game component for: "${prompt}".

🚨 CRITICAL REQUIREMENTS 🚨
1. Start with EXACTLY: (function(React, useState, useEffect, useRef, useMemo, useCallback, useAnimation,
2. Use ONLY this useState pattern: var _useState = useState(false), gameStarted = _useState[0], setGameStarted = _useState[1];
3. Include real game mechanics that naturally trigger endGame()
4. End with EXACTLY: return typeof App !== 'undefined' ? App : null; })
5. Complete all React.createElement calls before moving to the next
6. NO placeholder buttons - implement actual gameplay

OUTPUT ONLY THE WRAPPED FUNCTION CODE - NO EXPLANATIONS!`;
        
        if (attempt > 1 && lastError) {
          enhancedPrompt += `\n\n🚨 PREVIOUS ATTEMPT FAILED: ${lastError}\n`;
          enhancedPrompt += `ENSURE: Proper useState destructuring, complete syntax, no truncation.`;
        }

        const stream = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 8000,
          temperature: attempt > 1 ? 0.1 : 0.3, // Lower temperature on retries
          system: getEnhancedSystemPrompt(prompt),
          messages: [
            {
              role: 'user',
              content: enhancedPrompt,
            },
          ],
          stream: true,
        });

        let rawCode = '';
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            rawCode += chunk.delta.text;
          }
        }

        console.log(`📝 Raw code received (attempt ${attempt}), length: ${rawCode.length}`);
        
        // Log the start and end of the raw code for debugging
        console.log('🔍 RAW CODE START (first 800 chars):');
        console.log(rawCode.substring(0, 800));
        console.log('🔍 RAW CODE END (last 800 chars):');
        console.log(rawCode.substring(Math.max(0, rawCode.length - 800)));

        // Clean up any markdown or extra text
        let cleanedCode = rawCode
          .replace(/```(?:jsx?|javascript|react)?/gi, '')
          .replace(/```/g, '')
          .replace(/^[^(]*(?=\(function)/m, '') // Remove anything before (function
          .trim();

        // CRITICAL: Detect and fix errors immediately
        const criticalErrors = detectCriticalErrors(cleanedCode);
        
        if (criticalErrors.length > 0) {
          console.warn(`🚨 CRITICAL ERRORS DETECTED (attempt ${attempt}):`, criticalErrors);
          
          // Auto-fix the errors
          cleanedCode = autoFixCriticalErrors(cleanedCode);
          
          // Re-validate after fixing
          const postFixErrors = detectCriticalErrors(cleanedCode);
          
          if (postFixErrors.length > 0 && attempt < maxAttempts) {
            lastError = postFixErrors.join('; ');
            console.log(`🔄 Auto-fix incomplete, retrying...`);
            continue;
          }
          
          console.log(`✅ Auto-fix resolved ${criticalErrors.length - postFixErrors.length} errors`);
        }

        // Enhanced validation
        const validation = validateAndFixCode(cleanedCode);
        
        if (!validation.isValid && attempt < maxAttempts) {
          lastError = validation.errors.join('; ');
          console.log(`🔄 Validation failed, retrying...`);
          continue;
        }

        // Success - return the code
        console.log('✅ Code generation successful');
        if (validation.warnings.length > 0) {
          console.warn('⚠️ Warnings:', validation.warnings);
        }

        return {
          originalCode: rawCode,
          transpiledCode: validation.code,
          finalApp: validation.code,
          proxiedAssets,
          validation: {
            passed: validation.isValid,
            warnings: validation.warnings,
            errors: validation.errors,
            autoFixed: validation.autoFixed,
            attempt: attempt,
            checkedItems: [
              'useState patterns',
              'code completion',
              'wrapper format',
              'brace balance',
              'game structure',
              'real game mechanics'
            ]
          }
        };

      } catch (generationError) {
        console.error(`❌ Generation error (attempt ${attempt}):`, generationError.message);
        lastError = generationError.message;
        
        if (attempt === maxAttempts) {
          throw generationError;
        }
      }
    }

    throw new Error(`Failed to generate valid React component after ${maxAttempts} attempts. Last error: ${lastError}`);

  } catch (error) {
    console.error('❌ Fatal error in generateReactComponent:', error);
    throw new Error(`React generation failed: ${error.message}`);
  }
}

module.exports = {
  generateReactComponent,
  validateAndFixCode,
  detectCriticalErrors,
  autoFixCriticalErrors
};