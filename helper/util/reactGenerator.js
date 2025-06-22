// helper/util/reactGenerator.js - REDUCED VALIDATION ERRORS VERSION

const Anthropic = require('@anthropic-ai/sdk');
const transpileReactCode = require('./transpileReactCode');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Enhanced code cleaning with better syntax fixing
function cleanAndValidateCode(rawCode) {
  console.log('🧹 CLEANING AND VALIDATING GENERATED CODE');
  console.log('Raw code length:', rawCode.length);
  
  // Step 1: Basic cleanup
  let cleanedCode = rawCode
    .replace(/```(?:jsx?|javascript|react)?/gi, '') // Remove code blocks
    .replace(/^\s*[\r\n]+/gm, '') // Remove empty lines at start
    .trim();

  // Step 2: Remove any explanatory text before or after the code
  const componentStartRegex = /(import React[^;]*;[\s\S]*?)?(const App\s*=|function App\s*\()/;
  const componentMatch = cleanedCode.match(componentStartRegex);
  
  if (componentMatch) {
    const startIndex = cleanedCode.indexOf(componentMatch[0]);
    cleanedCode = cleanedCode.substring(startIndex);
  }

  // Step 3: Remove any trailing explanatory text after export
  const exportMatch = cleanedCode.match(/(export\s+default\s+App;)/);
  if (exportMatch) {
    const exportIndex = cleanedCode.indexOf(exportMatch[0]);
    const exportEnd = exportIndex + exportMatch[0] + 50; // Add buffer for comments
    cleanedCode = cleanedCode.substring(0, exportEnd);
  }

  // Step 4: Critical fix - remove any stray "App;" statements
  cleanedCode = cleanedCode.replace(/^\s*App;\s*$/gm, '');
  cleanedCode = cleanedCode.replace(/\}\s*App;\s*$/gm, '}');
  cleanedCode = cleanedCode.replace(/App;\s*export/g, 'export');

  // Step 5: Enhanced syntax fixing
  const lines = cleanedCode.split('\n');
  const fixedLines = [];
  let braceStack = [];
  let parenStack = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip empty lines with just "App;"
    if (line.trim() === 'App;') {
      console.log(`🗑️ Removing stray "App;" statement at line ${i + 1}`);
      continue;
    }
    
    // Track braces and parentheses
    for (let char of line) {
      if (char === '{') braceStack.push(i);
      if (char === '}') braceStack.pop();
      if (char === '(') parenStack.push(i);
      if (char === ')') parenStack.pop();
    }
    
    // Fix incomplete jsx props
    if (line.includes('sx={{') && !line.includes('}}')) {
      if (line.trim().endsWith(',') && i < lines.length - 1) {
        const nextLine = lines[i + 1];
        if (nextLine.trim() === 'App;' || nextLine.trim() === '' || nextLine.trim() === '}') {
          console.log(`🔧 Fixing incomplete sx prop at line ${i + 1}`);
          line = line.replace(/,\s*$/, '');
          fixedLines.push(line);
          fixedLines.push('  }}');
          if (lines[i + 1] && lines[i + 1].trim() === 'App;') {
            i++; // Skip the "App;" line
          }
          continue;
        }
      }
    }
    
    fixedLines.push(line);
  }
  
  cleanedCode = fixedLines.join('\n');

  // Step 6: Auto-fix common syntax issues
  // Fix unmatched parentheses in function calls
  cleanedCode = cleanedCode.replace(/(\w+\([^)]*),\s*\n\s*\}/g, '$1)');
  
  // Fix unmatched braces in objects
  cleanedCode = cleanedCode.replace(/{\s*([^}]*),\s*$/gm, '{ $1 }');

  // Step 7: Final brace/paren balancing
  const openBraces = (cleanedCode.match(/{/g) || []).length;
  const closeBraces = (cleanedCode.match(/}/g) || []).length;
  const openParens = (cleanedCode.match(/\(/g) || []).length;
  const closeParens = (cleanedCode.match(/\)/g) || []).length;

  console.log(`🔍 Syntax check: Braces ${openBraces}/${closeBraces}, Parentheses ${openParens}/${closeParens}`);

  // Auto-fix brace mismatches
  if (openBraces > closeBraces) {
    const diff = openBraces - closeBraces;
    console.log(`🔧 Auto-fixing ${diff} missing closing braces`);
    const exportIndex = cleanedCode.lastIndexOf('export default App;');
    if (exportIndex > -1) {
      const beforeExport = cleanedCode.substring(0, exportIndex);
      const afterExport = cleanedCode.substring(exportIndex);
      cleanedCode = beforeExport + '}'.repeat(diff) + '\n\n' + afterExport;
    } else {
      cleanedCode += '\n' + '}'.repeat(diff);
    }
  }

  // Auto-fix parentheses mismatches (more conservative)
  if (openParens > closeParens) {
    const diff = openParens - closeParens;
    if (diff <= 3) { // Only fix small mismatches
      console.log(`🔧 Auto-fixing ${diff} missing closing parentheses`);
      cleanedCode += ')'.repeat(diff);
    }
  }

  // Step 8: Ensure proper component structure
  if (!cleanedCode.includes('const App = ') && !cleanedCode.includes('function App')) {
    throw new Error('Generated code does not contain a valid App component declaration');
  }

  // Step 9: Ensure proper export
  if (!cleanedCode.includes('export default App')) {
    cleanedCode = cleanedCode.trim();
    if (!cleanedCode.endsWith(';') && !cleanedCode.endsWith('}')) {
      cleanedCode += ';';
    }
    cleanedCode += '\n\nexport default App;';
  }

  // Step 10: Final cleanup
  cleanedCode = cleanedCode
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive newlines
    .replace(/;\s*;/g, ';') // Remove double semicolons
    .replace(/,\s*,/g, ',') // Remove double commas
    .trim();

  console.log('✅ Code cleaning completed');
  console.log('Cleaned code length:', cleanedCode.length);
  
  return cleanedCode;
}

// REDUCED validation function - only essential checks
function validateReactCode(code) {
  console.log('🔍 VALIDATING REACT CODE (REDUCED CHECKS)');
  
  const validationErrors = [];
  const codeText = code.toLowerCase();
  
  // 1. REMOVED: Strict syntax validation - let transpiler handle it
  // Only check for severe syntax issues
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  const braceDiff = Math.abs(openBraces - closeBraces);
  
  if (braceDiff > 5) { // Only flag large mismatches
    validationErrors.push(`Major syntax error: Large brace mismatch (${openBraces} open, ${closeBraces} close)`);
  }

  // 2. REMOVED: Financial terms validation (as requested)
  // 3. REMOVED: Strict parentheses validation - too many false positives

  // 4. Check for stray "App;" statements (this is a real syntax error)
  if (code.match(/^\s*App;\s*$/m)) {
    validationErrors.push('Found stray "App;" statement that will cause syntax error');
  }

  // 5. Essential logEvent validation (reduced)
  if (!code.includes('logEvent')) {
    validationErrors.push('Missing logEvent prop usage');
  }

  // 6. Basic game structure validation (reduced)
  if (!code.includes('gameStarted') || !code.includes('gameEnded')) {
    validationErrors.push('Missing basic game state management');
  }

  // 7. Component structure validation
  const hasValidComponentStart = code.includes('const App = ') || code.includes('function App');
  if (!hasValidComponentStart) {
    validationErrors.push('Invalid component structure');
  }

  // 8. Export validation
  if (!code.includes('export default App')) {
    validationErrors.push('Missing component export');
  }

  console.log(`🔍 Validation completed: ${validationErrors.length} errors found`);
  return validationErrors;
}

// Enhanced system prompt - reduced restrictions
// Complete Enhanced System Prompt with Win/Loss Enforcement
const getEnhancedSystemPrompt = (gameType = 'game') => `You are an elite React developer. Generate a complete, working React game component.

Output Requirements:
- Return ONLY valid JavaScript/React code for the App component
- Start with "const App = ({ logEvent }) => {" 
- End with "export default App;"
- No markdown, explanations, or extra text

Required Imports:
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';

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
  console.log('⚛️ GENERATING REACT COMPONENT (REDUCED VALIDATION)');
  console.log('Prompt:', prompt);

  try {
    // Asset processing (simplified)
    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter(url => url.length < 500);
    const allImageUrls = imageUrls.length > 0 ? imageUrls : promptUrls.filter(url => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrls = promptUrls.filter(url => /\.(mp3|wav|ogg)$/i.test(url));

    const proxiedAssets = {
      images: allImageUrls.map((url, i) => ({ key: `image${i}`, proxiedUrl: url })),
      audio: audioUrls.map((url, i) => ({ key: `audio${i}`, proxiedUrl: url })),
    };

    let attempt = 0;
    const maxAttempts = 2; // Reduced attempts
    
    while (attempt < maxAttempts) {
      attempt++;
      console.log(`🔄 Generation attempt ${attempt}/${maxAttempts}`);
      
      try {
        const stream = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: getEnhancedSystemPrompt(),
          messages: [
            {
              role: 'user',
              content: `Generate a syntactically perfect React game component for: "${prompt}". 

              Requirements:
              - Perfect syntax with balanced braces and parentheses
              - Proper logEvent integration
              - Modern dark theme styling
              - Complete game functionality
              
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

        // Clean and validate the code
        let cleanedCode;
        try {
          cleanedCode = cleanAndValidateCode(rawCode);
          console.log('✅ Code cleaning successful');
        } catch (cleanError) {
          console.error(`❌ Code cleaning failed (attempt ${attempt}):`, cleanError.message);
          if (attempt === maxAttempts) {
            // Return the best we have rather than failing completely
            console.warn('⚠️ Using partially cleaned code due to repeated cleaning failures');
            cleanedCode = rawCode.replace(/```(?:jsx?|javascript|react)?/gi, '').trim();
          } else {
            continue;
          }
        }

        // Reduced validation
        const validationErrors = validateReactCode(cleanedCode);

        if (validationErrors.length === 0 || attempt === maxAttempts) {
          if (validationErrors.length > 0) {
            console.warn(`⚠️ Proceeding with ${validationErrors.length} validation warnings:`, validationErrors.join('; '));
          }
          
          console.log('🔄 Testing transpilation');
          
          try {
            const transpiledCode = await transpileReactCode(cleanedCode);
            
            console.log('✅ React component generation completed');

            return {
              originalCode: cleanedCode,
              transpiledCode: transpiledCode,
              finalApp: transpiledCode,
              proxiedAssets,
              validation: {
                passed: validationErrors.length === 0,
                warnings: validationErrors,
                attempt: attempt,
                checkedItems: [
                  'basic syntax validation',
                  'logEvent integration',
                  'game structure',
                  'component exports',
                  'transpilation test'
                ]
              }
            };
            
          } catch (transpileError) {
            console.error(`❌ Transpilation failed (attempt ${attempt}):`, transpileError.message);
            if (attempt === maxAttempts) {
              // Try to return something usable
              console.warn('⚠️ Returning non-transpiled code due to transpilation issues');
              return {
                originalCode: cleanedCode,
                transpiledCode: cleanedCode, // Use original as fallback
                finalApp: cleanedCode,
                proxiedAssets,
                validation: {
                  passed: false,
                  warnings: [...validationErrors, 'Transpilation failed'],
                  attempt: attempt
                }
              };
            }
          }
        } else {
          console.warn(`❌ Validation failed (attempt ${attempt}): ${validationErrors.join('; ')}`);
        }

      } catch (generationError) {
        console.error(`❌ Generation error (attempt ${attempt}):`, generationError.message);
        if (attempt === maxAttempts) {
          throw generationError;
        }
      }
    }

    throw new Error(`Failed to generate valid React component after ${maxAttempts} attempts`);

  } catch (error) {
    console.error('❌ Fatal error in generateReactComponent:', error);
    throw new Error(`React generation failed: ${error.message || 'Failed to generate React component'}`);
  }
}

module.exports = {
  generateReactComponent
};