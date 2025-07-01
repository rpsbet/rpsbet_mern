// helper/util/reactGenerator.js - REDUCED VALIDATION ERRORS VERSION

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
    /createElement\([^)]*$/  // Incomplete createElement
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
  
  // Fix 5: Handle truncated code
  if (!fixed.trim().endsWith('})')) {
    console.log('🔧 Fixing truncated ending...');
    
    // Remove any incomplete trailing syntax
    fixed = fixed.replace(/[,{]\s*sx[^}]*$/, '');
    fixed = fixed.replace(/,\s*$/, '');
    fixed = fixed.replace(/\{\s*sx;?\s*$/, '');
    
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

  if (!hasLogEvent) warnings.push('Missing logEvent integration');
  if (!hasGameStates) warnings.push('Missing game state management');
  if (!hasEndGame) warnings.push('Missing endGame function');
  if (!hasStartGame) warnings.push('Missing startGame function');

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

  console.log(`📋 Validation complete: ${errors.length} errors, ${warnings.length} warnings`);

  return {
    code: fixedCode,
    errors: errors,
    warnings: warnings,
    isValid: errors.length === 0,
    autoFixed: fixedCode !== code
  };
}

// Enhanced system prompt - reduced restrictions
// Complete Enhanced System Prompt with Win/Loss Enforcement
const getEnhancedSystemPrompt = (gameType = 'game') => `You are an elite React developer. Generate a complete, working React game component.

🚨 CRITICAL OUTPUT FORMAT 🚨
You MUST output code in this EXACT structure - NO DEVIATIONS:

1. Start with EXACTLY: (function(React, useState, useEffect, useRef, useMemo, useCallback, useAnimation,
2. Include helper functions after the parameter list
3. Define the App component with var App = function App(_ref) {
4. End with EXACTLY: return typeof App !== 'undefined' ? App : null; })

🚨 FORBIDDEN PATTERNS 🚨
- ❌ NO double function wrappers (only ONE (function... statement)
- ❌ NO imports or exports anywhere in the code
- ❌ NO incomplete syntax (every { must have })
- ❌ NO trailing commas in the last object properties
- ❌ NO console.log statements for debugging
- ❌ NO markdown code blocks (\`\`\`)
- ❌ var gameStarted = useState(false)[0];
- ❌ [React.createElement(...), React.createElement(...)]  
- ❌ border: '2px; (incomplete)

✅ REQUIRED PATTERNS:
✅ var _useState = useState(false), gameStarted = _useState[0], setGameStarted = _useState[1];
✅ React.createElement(Box, {}, child1, child2, child3)
✅ Complete all properties before outputting

🚨 COMPLETION REQUIREMENTS 🚨
- ✅ EVERY React.createElement() call must be complete
- ✅ EVERY sx prop must be a complete object
- ✅ EVERY function must have closing braces
- ✅ EVERY component must be fully rendered
- ✅ ALL dialog components must be complete
- ✅ ALL event handlers must be complete

🚨 SYNTAX CHECKLIST BEFORE COMPLETION 🚨
Before outputting, verify:
1. Only ONE (function... wrapper at the start
2. All components are complete (no cut-off mid-sentence)
3. All sx props are complete objects
4. All React.createElement calls are properly closed
5. Ends with exactly: return typeof App !== 'undefined' ? App : null; })

🚨 EXACT TEMPLATE TO FOLLOW 🚨
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
  
  // Helper functions here
  function _defineProperty(obj, key, value) { /* ... */ }
  function _objectSpread(target) { /* ... */ }

  var App = function App(_ref) {
    var logEvent = _ref.logEvent;
    
    // All your game logic here...
    // Must include complete deposit handling, game mechanics, end game logic
    
    return React.createElement(Box, {
      sx: { /* complete object */ }
    }, renderGameContent());
  };

  return typeof App !== 'undefined' ? App : null;
})

Generate a game for: "${gameType}"

🚨 CRITICAL: Output ONLY the wrapped function code. No explanations, no markdown, no extra text.

🚨 CRITICAL: PERFECT SYNTAX REQUIRED 🚨
- Every opening brace { must have a matching closing brace }
- Every opening parenthesis ( must have a matching closing parenthesis )
- Every JSX element must be properly closed
- No incomplete statements or hanging syntax
- End with EXACTLY "export default App;" on its own line

🚨 MANDATORY WIN/LOSS GAME MECHANICS 🚨
EVERY game MUST implement proper win/loss conditions. NO PLACEHOLDER BUTTONS ALLOWED.

FOR QUIZ GAMES:
- Implement actual questions with multiple choice or input answers
- Track correct/incorrect answers with score state: const [score, setScore] = useState(0);
- Track current question: const [currentQuestion, setCurrentQuestion] = useState(0);
- Calculate multiplier based on performance: (correctAnswers / totalQuestions) * maxMultiplier
- Call endGame('win', multiplier) when quiz completed with passing score (>= 70%)
- Call endGame('loss', '0.00') when quiz failed or time expired
- Example: endGame('win', (score/questions.length * 2.5).toFixed(2))

FOR CASINO GAMES (slots, cards, dice):
- Implement actual game mechanics (card draws, dice rolls, slot spins)
- Use Math.random() for realistic randomness
- Calculate multiplier based on game odds and bet outcomes
- For slots: Match symbols, calculate payouts based on combinations
- For cards: Deal actual hands, implement game rules (blackjack, poker)
- For dice: Roll actual dice, calculate wins based on combinations
- Call endGame('win', multiplier) when player wins (e.g., '2.50' for 2.5x payout)
- Call endGame('loss', '0.00') when player loses
- Example: endGame('win', getSlotPayout(reels).toFixed(2))

FOR SKILL GAMES (timing, memory, reaction):
- Track performance metrics (reaction time, accuracy, level reached)
- Implement timers and countdown mechanisms
- Calculate multiplier based on skill performance vs. benchmarks
- Call endGame('win', multiplier) when skill target achieved
- Call endGame('loss', '0.00') when failed to meet minimum requirements
- Example: endGame('win', Math.min(3.0, baseMultiplier * (timeBonus + accuracyBonus)).toFixed(2))

FOR STRATEGY GAMES:
- Implement win conditions (checkmate, goal reached, opponent defeated)
- Create AI opponents or puzzle challenges
- Calculate multiplier based on game difficulty and performance
- Call endGame('win', multiplier) when win condition met
- Call endGame('loss', '0.00') when lose condition met
- Example: endGame('win', (1.5 + difficultyLevel * 0.5).toFixed(2))

🚨 MANDATORY LOGEVENT IMPLEMENTATION 🚨
const App = ({ logEvent }) => {
  // Validate logEvent prop
  useEffect(() => {
    if (!logEvent || typeof logEvent !== 'function') {
      console.error('⚠️ logEvent prop missing');
    }
  }, [logEvent]);

  // Required state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  
  // CRITICAL: Add states for deposit handling
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [depositError, setDepositError] = useState(null);

  // DYNAMIC GAME TYPE - will be set based on actual game content
  const gameType = "${gameType}";

  // UPDATED: Game start function with async deposit handling
  const startGame = useCallback((practiceMode = false) => {
    setGameEnded(false);
    setIsPracticeMode(practiceMode);
    setDepositError(null);
    
    // Practice mode starts immediately without deposit
    if (practiceMode) {
      setGameStarted(true);
      return;
    }
    
    // Real games wait for deposit confirmation
    setIsProcessingDeposit(true);
    
    if (logEvent) {
      logEvent("gameStarted", { 
        timestamp: new Date().toISOString(),
        gameType: gameType,
        practiceMode: false
      }, {
        onDepositSuccess: () => {
          setIsProcessingDeposit(false);
          setGameStarted(true); // Only start game AFTER deposit confirmed
        },
        onDepositFailed: () => {
          setIsProcessingDeposit(false);
          setDepositError("Deposit failed. Please try again.");
        }
      });
    } else {
      // Fallback if logEvent not available
      setIsProcessingDeposit(false);
      setGameStarted(true);
    }
  }, [logEvent]);

  // 🚨 CRITICAL: Enhanced game end function with validation
  const endGame = useCallback((result, score) => {
    // Validate inputs
    if (!result || !['win', 'loss'].includes(result)) {
      console.error('❌ Invalid endGame result:', result);
      return;
    }
    
    // Validate score/multiplier
    const multiplier = typeof score === 'string' ? score : String(score || '0.00');
    if (result === 'win' && (multiplier === '0.00' || multiplier === '0')) {
      console.warn('⚠️ Win with 0 multiplier - check game logic');
    }
    
    setGameEnded(true);
    
    if (!isPracticeMode && logEvent) {
      logEvent("gameEnded", { 
        timestamp: new Date().toISOString(),
        result: result,
        multiplier: multiplier,
        gameType: gameType
      });
    }
    
    setGameHistory(prev => [...prev.slice(-9), { 
      result, 
      score: multiplier, 
      timestamp: new Date().toISOString(),
      practice: isPracticeMode
    }]);
  }, [isPracticeMode, logEvent]);

  // Reset game function
  const resetGame = useCallback(() => {
    setGameStarted(false);
    setGameEnded(false);
    setIsProcessingDeposit(false);
    setDepositError(null);
  }, []);

  // CRITICAL: Conditional rendering based on game states
  const renderGameContent = () => {
    // 1. Deposit processing state (BLOCKS game start)
    if (isProcessingDeposit) {
      return (
        <Box sx={{
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
        }}>
          <CircularProgress sx={{ mb: 3, color: '#00ff3a' }} size={60} />
          <Typography variant="h6" sx={{ color: '#fff', mb: 2, fontWeight: 600 }}>
            🏦 Processing Deposit...
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
            Please confirm the transaction in your wallet.<br/>
            Do not refresh or navigate away from this page.
          </Typography>
        </Box>
      );
    }

    // 2. Deposit error state
    if (depositError) {
      return (
        <Box sx={{
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
        }}>
          <Typography variant="h5" sx={{ color: '#f44336', mb: 2, fontWeight: 700 }}>
            ⚠️ Deposit Failed
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, lineHeight: 1.6 }}>
            {depositError}
          </Typography>
          <Button 
            variant="contained"
            onClick={resetGame}
            sx={{
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              '&:hover': { 
                background: 'linear-gradient(135deg, #ee5a24, #ff6b6b)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    // 3. Game start screen (waiting for user to start)
    if (!gameStarted && !gameEnded) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center',
          p: 4
        }}>
          <Typography variant="h4" sx={{ 
            color: '#fff', 
            mb: 2,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #00ff3a, #00cc2e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🎮 Game Ready
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: 'rgba(255,255,255,0.8)', 
            mb: 4,
            maxWidth: '400px',
            lineHeight: 1.6
          }}>
            Choose your game mode below. Real games require a deposit confirmation before starting.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button 
              variant="contained"
              onClick={() => startGame(false)}
              disabled={isProcessingDeposit}
              size="large"
              sx={{
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
              }}
            >
              🎯 Start Game
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => startGame(true)}
              disabled={isProcessingDeposit}
              size="large"
              sx={{
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
              }}
            >
              🎮 Practice Mode
            </Button>
          </Box>
        </Box>
      );
    }

    // 4. ACTUAL GAME CONTENT (only renders AFTER deposit confirmed)
    if (gameStarted && !gameEnded) {
      return (
        <Box sx={{ p: 2 }}>
          {/* Status indicator */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 3,
            p: 2,
            background: isPracticeMode ? 'rgba(255, 235, 59, 0.1)' : 'rgba(0, 255, 58, 0.1)',
            borderRadius: '12px',
            border: isPracticeMode ? '1px solid rgba(255, 235, 59, 0.3)' : '1px solid rgba(0, 255, 58, 0.3)'
          }}>
            <Typography variant="h6" sx={{ 
              color: isPracticeMode ? '#ffeb3b' : '#00ff3a',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              {isPracticeMode ? '🎮 Practice Mode Active' : '✅ Live Game Started'}
            </Typography>
          </Box>
          
          {/* 
            🚨 IMPLEMENT YOUR ACTUAL GAME HERE 🚨
            This section only renders AFTER deposit is confirmed.
            REQUIREMENTS:
            1. Real game mechanics (not placeholder buttons)
            2. Natural win/loss conditions that trigger endGame()
            3. Proper multiplier calculation
            4. All timers, countdowns, and game logic here
            
            EXAMPLES OF PROPER IMPLEMENTATION:
            
            FOR QUIZ GAMES:
            - Display actual questions with answer choices
            - Track score and question progress
            - Implement timer countdown
            - Call endGame('win', (score/totalQuestions * 2.5).toFixed(2)) on completion
            - Call endGame('loss', '0.00') on time expiry or low score
            
            FOR SLOT GAMES:
            - Show spinning reels with symbols
            - Implement spin button that triggers random results
            - Calculate payouts based on symbol combinations
            - Call endGame('win', payout.toFixed(2)) for winning combinations
            - Call endGame('loss', '0.00') for losing spins
            
            FOR CARD GAMES:
            - Deal actual cards from deck
            - Implement game rules (blackjack hit/stand, poker betting)
            - Calculate hand values and determine winners
            - Call endGame('win', multiplier) when player wins hand
            - Call endGame('loss', '0.00') when player loses hand
            
            FOR SKILL GAMES:
            - Create timed challenges or reaction tests
            - Track performance metrics (speed, accuracy)
            - Set achievement targets
            - Call endGame('win', multiplier) when targets met
            - Call endGame('loss', '0.00') when failed
          */}
          
          {/* 🚨 REMOVE THIS PLACEHOLDER AND ADD YOUR REAL GAME 🚨 */}
          {/* The content below is just an example - replace with actual game mechanics */}
          
          <Typography variant="h5" sx={{ 
            color: '#fff', 
            textAlign: 'center', 
            mb: 3,
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700
          }}>
            🎯 Implement Your Real Game Here
          </Typography>
          
          <Typography variant="body1" sx={{ 
            color: 'rgba(255,255,255,0.7)', 
            textAlign: 'center', 
            mb: 4,
            fontStyle: 'italic'
          }}>
            Replace this section with actual game mechanics that naturally lead to win/loss conditions
          </Typography>
          
          {/* Example of what NOT to do - remove these placeholder buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            gap: 2,
            flexWrap: 'wrap',
            opacity: 0.5,
            border: '2px dashed #ff6b6b',
            borderRadius: '12px',
            p: 3,
            background: 'rgba(255, 107, 107, 0.05)'
          }}>
            <Typography variant="caption" sx={{ 
              color: '#ff6b6b', 
              width: '100%', 
              textAlign: 'center',
              mb: 2,
              fontWeight: 600
            }}>
              ❌ DO NOT USE THESE PLACEHOLDER BUTTONS ❌
            </Typography>
            <Button
              variant="contained"
              disabled
              sx={{
                background: 'linear-gradient(135deg, #4caf50, #45a049)',
                fontWeight: 600,
                opacity: 0.3
              }}
            >
              Win Game (2.5x) - PLACEHOLDER
            </Button>
            <Button
              variant="contained"
              disabled
              sx={{
                background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                fontWeight: 600,
                opacity: 0.3
              }}
            >
              Lose Game - PLACEHOLDER
            </Button>
          </Box>
        </Box>
      );
    }

    // 5. Game ended state
    if (gameEnded) {
      const lastGame = gameHistory[gameHistory.length - 1];
      
      return (
        <Box sx={{ 
          textAlign: 'center', 
          p: 4,
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Typography variant="h5" sx={{ 
            color: '#fff', 
            mb: 3,
            fontWeight: 700
          }}>
            🎉 Game Complete!
          </Typography>
          
          {lastGame && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ 
                color: lastGame.result === 'win' ? '#4caf50' : '#f44336',
                fontWeight: 600,
                mb: 1
              }}>
                {lastGame.result === 'win' ? '🎉 You Won!' : '💔 You Lost'}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'rgba(255,255,255,0.8)'
              }}>
                {lastGame.result === 'win' ? \`Multiplier: {lastGame.score}x\` : 'Better luck next time!'}
              </Typography>
              {lastGame.practice && (
                <Typography variant="caption" sx={{ 
                  color: '#ffeb3b',
                  display: 'block',
                  mt: 1
                }}>
                  🎮 Practice Mode
                </Typography>
              )}
            </Box>
          )}
         
          <Button 
            variant="contained"
            onClick={resetGame}
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              '&:hover': { 
                background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            🎮 Play Again
          </Button>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box sx={{
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '500px',
      borderRadius: '20px',
      p: 3,
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 20%, rgba(0, 255, 58, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 235, 59, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }
    }}>
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {renderGameContent()}
      </Box>
    </Box>
  );
};

🚨 CRITICAL IMPLEMENTATION EXAMPLES 🚨

QUIZ GAME EXAMPLE:
const [questions] = useState([
  { question: "What is 2+2?", options: ["3", "4", "5", "6"], correct: 1 },
  { question: "Capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correct: 2 }
]);
const [currentQuestion, setCurrentQuestion] = useState(0);
const [score, setScore] = useState(0);
const [timeLeft, setTimeLeft] = useState(30);

useEffect(() => {
  if (gameStarted && timeLeft > 0 && currentQuestion < questions.length) {
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  } else if (timeLeft === 0) {
    endGame('loss', '0.00');
  }
}, [timeLeft, gameStarted, currentQuestion]);

const handleAnswer = (selectedIndex) => {
  if (selectedIndex === questions[currentQuestion].correct) {
    setScore(score + 1);
  }
  if (currentQuestion + 1 >= questions.length) {
    const finalScore = selectedIndex === questions[currentQuestion].correct ? score + 1 : score;
    const multiplier = (finalScore / questions.length * 2.5).toFixed(2);
    endGame(finalScore >= questions.length * 0.7 ? 'win' : 'loss', finalScore >= questions.length * 0.7 ? multiplier : '0.00');
  } else {
    setCurrentQuestion(currentQuestion + 1);
    setTimeLeft(30);
  }
};

SLOT GAME EXAMPLE:
const [reels, setReels] = useState(['🍒', '🍒', '🍒']);
const [spinning, setSpinning] = useState(false);

const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'];
const payouts = {
  '🍒🍒🍒': 2.0,
  '🍋🍋🍋': 3.0,
  '🍊🍊🍊': 4.0,
  '🍇🍇🍇': 5.0,
  '⭐⭐⭐': 10.0,
  '💎💎💎': 25.0
};

const spin = () => {
  setSpinning(true);
  setTimeout(() => {
    const newReels = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];
    setReels(newReels);
    setSpinning(false);
    
    const combination = newReels.join('');
    const payout = payouts[combination];
    if (payout) {
      endGame('win', payout.toFixed(2));
    } else {
      endGame('loss', '0.00');
    }
  }, 2000);
};

🚨 MODERN STYLING REQUIREMENTS 🚨
- Use dark backgrounds with vibrant accents (#0f0f23, #1a1a2e, #16213e)
- Apply glassmorphism effects with rgba backgrounds
- Include gradient text and button effects using WebkitBackgroundClip
- Add smooth hover transitions with transform and boxShadow
- Use Material-UI sx prop for ALL styling (no styled-components)
- Include micro-animations and hover states on all interactive elements
- Use vibrant accent colors: #00ff3a (green), #ffeb3b (yellow), #ff6b6b (red), #6c5ce7 (purple)

🚨 SYNTAX CHECKLIST 🚨
Before completing, verify:
✅ All { have matching }
✅ All ( have matching )
✅ All JSX elements are closed
✅ Component starts with const App = ({ logEvent }) =>
✅ Component ends with export default App;
✅ No incomplete statements
✅ No stray "App;" lines
✅ No hanging commas or syntax errors
✅ Real game mechanics implemented (no placeholder buttons)
✅ Natural win/loss conditions that call endGame()
✅ Proper multiplier calculations
✅ Dynamic gameType usage (not hardcoded)

🚨 WIN/LOSS VALIDATION REQUIREMENTS 🚨
The generated game MUST have:
✅ Clear win conditions that naturally trigger endGame('win', multiplier)
✅ Clear loss conditions that naturally trigger endGame('loss', '0.00')
✅ Multiplier calculation based on actual game performance/odds
✅ NO placeholder "Win Game" or "Lose Game" buttons
✅ Automatic endGame() calls when game conditions are naturally met
✅ Game mechanics that make sense for the chosen game type

Generate a COMPLETE, syntactically perfect React component with REAL game mechanics, natural win/loss conditions, modern styling, and proper logEvent integration. The game must feel authentic and engaging, not like a demo with placeholder buttons.`;

async function generateReactComponent(prompt, imageUrls = []) {
  console.log('⚛️ GENERATING REACT COMPONENT (CRITICAL ERROR PREVENTION)');
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
        let enhancedPrompt = `Generate a React game component in the EXACT wrapped function format for: "${prompt}".`;
        
        if (attempt > 1 && lastError) {
          enhancedPrompt += `\n\n🚨 CRITICAL: Previous attempt failed with: ${lastError}`;
          enhancedPrompt += `\nUse EXACT useState pattern: var _useState = useState(false), gameStarted = _useState[0], setGameStarted = _useState[1];`;
          enhancedPrompt += `\nEnsure code is COMPLETE and ends properly.`;
        }
        
        if (attempt > 2) {
          enhancedPrompt += `\n\n🚨 FINAL ATTEMPT: Generate COMPLETE, valid code with proper useState patterns.`;
        }

        const stream = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          temperature: attempt > 1 ? 0.2 : 0.7, // Very low temperature for retries
          system: getEnhancedSystemPrompt(),
          messages: [
            {
              role: 'user',
              content: `${enhancedPrompt}
              
              🚨 CRITICAL REQUIREMENTS 🚨
              - Use EXACT useState pattern: var _useState = useState(false), gameStarted = _useState[0], setGameStarted = _useState[1];
              - NO var gameStarted = useState(false)[0]; patterns
              - Complete all React.createElement calls
              - End with exactly: return typeof App !== 'undefined' ? App : null; })
              - Real game mechanics that call endGame() naturally
              
              Proxied assets: ${JSON.stringify(proxiedAssets)}`,
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

        // Clean up any markdown or extra text
        let cleanedCode = rawCode
          .replace(/```(?:jsx?|javascript|react)?/gi, '')
          .replace(/^[^(]*\(function/m, '(function') // Remove any text before the wrapper
          .trim();

        // CRITICAL: Detect specific error patterns immediately
        const criticalErrors = detectCriticalErrors(cleanedCode);
        
        if (criticalErrors.length > 0) {
          console.warn(`🚨 CRITICAL ERRORS DETECTED (attempt ${attempt}):`, criticalErrors);
          
          // Auto-fix the errors
          cleanedCode = autoFixCriticalErrors(cleanedCode);
          
          // Re-validate after fixing
          const postFixErrors = detectCriticalErrors(cleanedCode);
          
          if (postFixErrors.length > 0 && attempt < maxAttempts) {
            lastError = postFixErrors.join('; ');
            console.log(`🔄 Auto-fix incomplete, retrying with explicit constraints...`);
            continue;
          }
          
          console.log(`✅ Auto-fix resolved ${criticalErrors.length - postFixErrors.length} critical errors`);
        }

        // Additional validation
        const openBraces = (cleanedCode.match(/{/g) || []).length;
        const closeBraces = (cleanedCode.match(/}/g) || []).length;
        const braceDiff = Math.abs(openBraces - closeBraces);
        
        if (braceDiff > 3) {
          const error = `Major brace mismatch: ${openBraces} open, ${closeBraces} close`;
          console.warn(`⚠️ ${error}`);
          if (attempt < maxAttempts) {
            lastError = error;
            continue;
          }
        }

        // Check for essential game structure
        const hasLogEvent = cleanedCode.includes('logEvent');
        const hasGameStates = cleanedCode.includes('gameStarted') && cleanedCode.includes('gameEnded');
        const hasEndGame = cleanedCode.includes('endGame');

        const structureWarnings = [];
        if (!hasLogEvent) structureWarnings.push('Missing logEvent integration');
        if (!hasGameStates) structureWarnings.push('Missing game state management');
        if (!hasEndGame) structureWarnings.push('Missing endGame function');

        // Success - return the code
        console.log('✅ Code generation successful');
        if (structureWarnings.length > 0) {
          console.warn('⚠️ Structure warnings:', structureWarnings);
        }

        return {
          originalCode: rawCode,
          transpiledCode: cleanedCode,
          finalApp: cleanedCode,
          proxiedAssets,
          validation: {
            passed: criticalErrors.length === 0,
            warnings: structureWarnings,
            autoFixed: cleanedCode !== rawCode,
            attempt: attempt,
            checkedItems: [
              'useState patterns',
              'code completion',
              'wrapper format',
              'brace balance',
              'game structure'
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
  validateAndFixCode // Export for testing
};