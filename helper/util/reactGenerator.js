// helper/util/reactGenerator.js - FIXED VERSION with robust code generation and cleaning

const Anthropic = require('@anthropic-ai/sdk');
const transpileReactCode = require('./transpileReactCode');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Enhanced code cleaning and validation function
function cleanAndValidateCode(rawCode) {
  console.log('🧹 CLEANING AND VALIDATING GENERATED CODE');
  console.log('Raw code length:', rawCode.length);
  
  // Step 1: Basic cleanup
  let cleanedCode = rawCode
    .replace(/```(?:jsx?|javascript|react)?/gi, '') // Remove code blocks
    .replace(/^\s*[\r\n]+/gm, '') // Remove empty lines at start
    .trim();

  // Step 2: Remove any explanatory text before or after the code
  // Find the actual component start
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
    const exportEnd = exportIndex + exportMatch[0].length;
    cleanedCode = cleanedCode.substring(0, exportEnd);
  }

  // Step 4: Critical fix - remove any stray "App;" statements
  cleanedCode = cleanedCode.replace(/^\s*App;\s*$/gm, '');
  cleanedCode = cleanedCode.replace(/\}\s*App;\s*$/gm, '}');
  cleanedCode = cleanedCode.replace(/App;\s*export/g, 'export');

  // Step 5: Fix incomplete JSX syntax issues
  const lines = cleanedCode.split('\n');
  const fixedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines with just "App;"
    if (line.trim() === 'App;') {
      console.log(`🗑️ Removing stray "App;" statement at line ${i + 1}`);
      continue;
    }
    
    // Fix incomplete sx props (the specific issue from your error)
    if (line.includes('sx={{') && !line.includes('}}')) {
      // Check if this is an incomplete prop that's causing the syntax error
      if (line.trim().endsWith(',') && i < lines.length - 1) {
        const nextLine = lines[i + 1];
        // If next line looks like "App;" or similar incomplete syntax, fix it
        if (nextLine.trim() === 'App;' || nextLine.trim() === '' || nextLine.trim() === '}') {
          console.log(`🔧 Fixing incomplete sx prop at line ${i + 1}`);
          // Close the sx prop properly
          fixedLines.push(line.replace(/,\s*$/, ''));
          fixedLines.push('  }}');
          // Skip the problematic next line
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

  // Step 6: Ensure proper component structure
  if (!cleanedCode.includes('const App = ') && !cleanedCode.includes('function App')) {
    throw new Error('Generated code does not contain a valid App component declaration');
  }

  // Step 7: Ensure proper export (but not duplicate)
  if (!cleanedCode.includes('export default App')) {
    cleanedCode = cleanedCode.trim();
    // Make sure the last line ends properly
    if (!cleanedCode.endsWith(';') && !cleanedCode.endsWith('}')) {
      cleanedCode += ';';
    }
    cleanedCode += '\n\nexport default App;';
  } else {
    // Remove any duplicate exports
    const exportLines = cleanedCode.split('\n').filter(line => line.includes('export default App'));
    if (exportLines.length > 1) {
      // Remove all exports and add one at the end
      cleanedCode = cleanedCode.replace(/export\s+default\s+App;?\s*/g, '');
      cleanedCode = cleanedCode.trim() + '\n\nexport default App;';
    }
  }

  // Step 8: Final syntax validation
  const openBraces = (cleanedCode.match(/{/g) || []).length;
  const closeBraces = (cleanedCode.match(/}/g) || []).length;
  const openParens = (cleanedCode.match(/\(/g) || []).length;
  const closeParens = (cleanedCode.match(/\)/g) || []).length;

  console.log(`🔍 Syntax check: Braces ${openBraces}/${closeBraces}, Parentheses ${openParens}/${closeParens}`);

  // Try to auto-fix simple brace mismatches
  if (openBraces > closeBraces) {
    const diff = openBraces - closeBraces;
    console.log(`🔧 Auto-fixing ${diff} missing closing braces`);
    
    // Add closing braces before the export statement
    const exportIndex = cleanedCode.lastIndexOf('export default App;');
    if (exportIndex > -1) {
      const beforeExport = cleanedCode.substring(0, exportIndex);
      const afterExport = cleanedCode.substring(exportIndex);
      cleanedCode = beforeExport + '}'.repeat(diff) + '\n\n' + afterExport;
    } else {
      cleanedCode += '\n' + '}'.repeat(diff);
    }
  }

  // Step 9: Final cleanup
  cleanedCode = cleanedCode
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive newlines
    .replace(/;\s*;/g, ';') // Remove double semicolons
    .replace(/,\s*,/g, ',') // Remove double commas
    .trim();

  console.log('✅ Code cleaning completed');
  console.log('Cleaned code length:', cleanedCode.length);
  
  return cleanedCode;
}

// Enhanced validation function (same as before but with syntax checks)
function validateReactCode(code) {
  console.log('🔍 VALIDATING REACT CODE');
  
  const validationErrors = [];
  const codeText = code.toLowerCase();
  
  // Basic syntax validation first
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    validationErrors.push(`Syntax error: Unmatched braces (${openBraces} open, ${closeBraces} close)`);
  }

  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    validationErrors.push(`Syntax error: Unmatched parentheses (${openParens} open, ${closeParens} close)`);
  }

  // Check for stray "App;" statements that cause the specific error
  if (code.match(/^\s*App;\s*$/m)) {
    validationErrors.push('Found stray "App;" statement that will cause syntax error');
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

  // Check for house edge implementation
  const hasHouseEdge = code.includes('houseEdge') ||
    code.includes('0.9') ||
    code.includes('Math.min') ||
    code.includes('* 0.') ||
    code.includes('houseEdgeFactor');

  if (!hasHouseEdge) {
    validationErrors.push('Missing house edge enforcement in multiplier calculations');
  }

  // Enhanced financial terms check
  const strictFinancialTerms = [
    'bet', 'betting', 'bets', 'bettor', 'betted',
    'balance', 'balances',
    'wallet', 'wallets',
    'money', 'monetary', 'cash', 'currency', 'dollar', 'cent',
    'credit', 'credits', 'coin', 'coins',
    'deposit', 'deposits', 'withdraw', 'withdrawal',
    'payout', 'payouts', 'jackpot', 'jackpots'
  ];

  const foundFinancialTerms = strictFinancialTerms.filter(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(codeText);
  });

  if (foundFinancialTerms.length > 0) {
    validationErrors.push(`Forbidden financial terms detected: ${foundFinancialTerms.join(', ')}`);
  }

  // Check for required component structure
  const hasValidComponentStart = code.includes('const App = ({ logEvent }') ||
    code.includes('const App = (props)') ||
    code.includes('function App({ logEvent }') ||
    code.includes('function App(props)');

  if (!hasValidComponentStart) {
    validationErrors.push('Component must accept logEvent prop');
  }

  // Check for required state variables
  const requiredStates = ['gameStarted', 'gameEnded', 'isPracticeMode', 'gameHistory'];
  const missingStates = requiredStates.filter(state => !code.includes(state));
  if (missingStates.length > 0) {
    validationErrors.push(`Missing required state variables: ${missingStates.join(', ')}`);
  }

  // Check for required functions
  const requiredFunctions = ['startGame', 'endGame'];
  const missingFunctions = requiredFunctions.filter(func => !code.includes(func));
  if (missingFunctions.length > 0) {
    validationErrors.push(`Missing required functions: ${missingFunctions.join(', ')}`);
  }

  // Check for practice mode conditional logic
  if (!code.includes('!practiceMode') && !code.includes('!isPracticeMode')) {
    validationErrors.push('Missing practice mode conditional logic for logging');
  }

  console.log(`🔍 Validation completed: ${validationErrors.length} errors found`);
  return validationErrors;
}

async function generateReactComponent(prompt, imageUrls = []) {
  console.log('⚛️ GENERATING REACT COMPONENT (ENHANCED ERROR PREVENTION)');
  console.log('Prompt:', prompt);
  console.log('Image URLs:', imageUrls);

  try {
    // Asset processing (same as original)
    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter(url => url.length < 500);
    const allImageUrls = imageUrls.length > 0 ? imageUrls : promptUrls.filter(url => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrls = promptUrls.filter(url => /\.(mp3|wav|ogg)$/i.test(url));

    const proxiedAssets = {
      images: allImageUrls.map((url, i) => ({ key: `image${i}`, proxiedUrl: url })),
      audio: audioUrls.map((url, i) => ({ key: `audio${i}`, proxiedUrl: url })),
    };

    console.log(`[React Generator] Proxied assets prepared:`, JSON.stringify(proxiedAssets));

    // Enhanced system prompt with strict syntax requirements
    const systemPrompt = `You are an elite React developer. Generate a complete, working React game component with MANDATORY logging and house edge enforcement.

Output Requirements:
- Return ONLY valid JavaScript/React code for the App component
- Start with "const App = ({ logEvent }) => {" or "const App = (props) => { const { logEvent } = props;"
- End with "export default App;"
- No markdown, explanations, or extra text

Required Imports:
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';

🚨 MODERN STYLING FOR NEW GENERATION 🚨
Use cutting-edge design trends that appeal to Gen Z and younger audiences:

CORE DESIGN PRINCIPLES:
- Dark mode first (always use dark backgrounds)
- High contrast with vibrant accents
- Glassmorphism and depth effects
- Smooth animations and micro-interactions
- Bold, modern typography
- RGB/neon color schemes
- Rounded corners and soft shadows
- Gradient overlays and holographic effects

MANDATORY STYLING APPROACH:
- DO NOT use styled-components or the styled() function
- Use ONLY Material-UI's sx prop for styling
- Use ONLY inline styles when needed
- Focus on creating visually stunning, modern interfaces

🎨 MODERN COLOR PALETTES:

// Cyberpunk/Neon Theme (Primary Choice)
const cyberpunkColors = {
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
  primary: '#00f5ff',
  secondary: '#ff0080',
  accent: '#39ff14',
  surface: 'rgba(255, 255, 255, 0.05)',
  glass: 'rgba(255, 255, 255, 0.1)',
  border: 'rgba(0, 245, 255, 0.3)',
  glow: '0 0 20px rgba(0, 245, 255, 0.5)'
};

// Gaming RGB Theme
const rgbColors = {
  background: 'linear-gradient(45deg, #1e1e1e 0%, #2d1b69 50%, #11998e 100%)',
  primary: '#ff6b6b',
  secondary: '#4ecdc4', 
  accent: '#45b7d1',
  rainbow: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)',
  glass: 'rgba(255, 255, 255, 0.08)',
  glow: '0 0 15px rgba(255, 107, 107, 0.4)'
};

// Y2K Retro Theme
const retroColors = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  primary: '#ff3cac',
  secondary: '#784ba0', 
  accent: '#2b86ab',
  chrome: 'linear-gradient(45deg, #c0c0c0, #f5f5f5, #c0c0c0)',
  holographic: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff)',
  glow: '0 0 25px rgba(255, 60, 172, 0.6)'
};

🚨 MODERN COMPONENT STYLING EXAMPLES 🚨

MAIN GAME CONTAINER (Glassmorphism):
<Box sx={{
  width: '100%',
  minHeight: '600px',
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
  borderRadius: '24px',
  padding: 4,
  position: 'relative',
  overflow: 'hidden',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    zIndex: -1
  }
}}>


{/* Practice Mode Button */}
<Button 
  variant="outlined" 
  onClick={() => startGame(true)}
  sx={{ 
    borderColor: '#ffeb3b', 
    color: '#ffeb3b',
    borderRadius: '16px',
    padding: '12px 32px',
    fontSize: '1.1rem',
    fontWeight: 700,
    textTransform: 'none',
    borderWidth: '2px',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 235, 59, 0.05)',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      borderColor: '#fff',
      color: '#fff',
      background: 'rgba(255, 235, 59, 0.1)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(255, 235, 59, 0.3)'
    }
  }}
>
  🎯 Practice Mode
</Button>

PRACTICE MODE INDICATOR (Enhanced):
{isPracticeMode && (
  <Box sx={{
    background: 'linear-gradient(45deg, rgba(255, 235, 59, 0.1), rgba(255, 235, 59, 0.05))',
    border: '2px solid #ffeb3b',
    borderRadius: '16px',
    padding: 2,
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 235, 59, 0.3)',
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': { boxShadow: '0 0 20px rgba(255, 235, 59, 0.3)' },
      '50%': { boxShadow: '0 0 30px rgba(255, 235, 59, 0.6)' },
      '100%': { boxShadow: '0 0 20px rgba(255, 235, 59, 0.3)' }
    }
  }}>
    <Typography sx={{
      color: '#ffeb3b',
      fontWeight: 700,
      fontSize: '1.1rem',
      textShadow: '0 0 10px rgba(255, 235, 59, 0.8)'
    }}>
      🎯 PRACTICE MODE - Free to Play
    </Typography>
  </Box>
)}

GAME HISTORY TABLE (Modern Dark):
<Box sx={{
  background: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(15px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden'
}}>
  <Typography sx={{
    color: '#fff',
    fontWeight: 600,
    padding: 2,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)'
  }}>
    📊 Recent Games
  </Typography>
  {/* Table content with neon-colored results */}
</Box>

ANIMATIONS & TRANSITIONS:
- Use transform: translateY(-2px) for hover states
- Add box-shadow transitions for depth
- Implement scale animations for interactions
- Use backdrop-filter: blur() for glassmorphism
- Add gradient animations for loading states

MODERN TYPOGRAPHY:
- Use font weights 600-900 for headings
- Implement gradient text effects
- Add text shadows and glows
- Use letter-spacing for emphasis
- Implement responsive font sizes

🚨 ABSOLUTE FORBIDDEN TERMS 🚨
NEVER use these words anywhere in your code (will cause automatic rejection):
- "bet" (use "wager", "stake", "play" instead)
- "balance" (use "score", "points", "total" instead) 
- "wallet" (use "account", "profile" instead)
- "coins", "credits", "cash", "money", "currency", "dollar", "cent"
- "deposit", "withdraw", "payout", "jackpot"

SAFE ALTERNATIVES:
- Instead of "bet amount" → "play amount" or "stake"
- Instead of "balance" → "player score" or "current total"
- Instead of "betting" → "playing" or "gaming"
- Instead of "place bet" → "start round" or "begin game"

CRITICAL: NO FINANCIAL LOGIC
- DO NOT include any financial amounts, monetary calculations, or payment processing
- DO NOT implement financial mechanics, currency displays, or monetary transactions
- Focus purely on game mechanics, scoring, and user interaction
- All financial logic will be handled by external systems

🚨 MANDATORY LOGEVENT IMPLEMENTATION 🚨
This is CRITICAL - games without proper logging will be rejected:

1. COMPONENT SIGNATURE - MUST start with logEvent prop:
REQUIRED FORMAT: const App = ({ logEvent }) => {
ALTERNATIVE FORMAT: const App = (props) => { const { logEvent } = props;
DO NOT USE: const App = () => { (this will fail validation)

2. FIRST LINE AFTER COMPONENT START - Add logEvent validation:
const App = ({ logEvent }) => {
  // MANDATORY: Add this validation immediately
  useEffect(() => {
    if (!logEvent || typeof logEvent !== 'function') {
      console.error('⚠️ CRITICAL: logEvent prop is missing or invalid');
    } else {
      console.log('✅ logEvent prop validated successfully');
    }
  }, [logEvent]);

3. MANDATORY GAME START LOGGING - Must be exactly this pattern:
const startGame = (practiceMode = false) => {
  setIsPracticeMode(practiceMode);
  setGameStarted(true);
  setGameEnded(false);
  setGameStartTime(Date.now());
  
  // CRITICAL: This exact logging pattern is required
  if (!practiceMode && logEvent && typeof logEvent === 'function') {
    logEvent("gameStarted", { 
      timestamp: new Date().toISOString(),
      gameType: "REPLACE_WITH_ACTUAL_GAME_NAME",
      practiceMode: false,
      sessionId: Date.now()
    });
    console.log('🎮 Game started - event logged');
  } else if (practiceMode) {
    console.log('🎯 Practice mode - no logging');
  }
  
  // Reset other game state here...
};

4. MANDATORY GAME END LOGGING - Must use this exact pattern:
const endGame = useCallback((result, multiplier) => {
  setGameEnded(true);
  const finalMultiplier = parseFloat(multiplier) || 1.0;
  
  // CRITICAL: This exact logging pattern is required
  if (!isPracticeMode && logEvent && typeof logEvent === 'function') {
    logEvent("gameEnded", { 
      timestamp: new Date().toISOString(),
      result: result, // Must be "win", "loss", or "draw"
      multiplier: finalMultiplier,
      gameType: "REPLACE_WITH_ACTUAL_GAME_NAME",
      practiceMode: false,
      sessionData: {
        duration: Math.round((Date.now() - gameStartTime) / 1000),
        actionsPerformed: actionCount || 0
      }
    });
  }
  
  // Always update game history (both modes)
  setGameHistory(prev => [...prev.slice(-9), { 
    id: Date.now(), 
    result, 
    multiplier: finalMultiplier, 
    timestamp: new Date().toISOString(),
    practice: isPracticeMode || false
  }]);
}, [isPracticeMode, logEvent, gameStartTime]);

5. PRACTICE MODE IMPLEMENTATION - MANDATORY:
- Add state: const [isPracticeMode, setIsPracticeMode] = useState(false);
- Include TWO start buttons with modern styling as shown above

🚨 MANDATORY ADVANCED HOUSE EDGE ENFORCEMENT 🚨
Use sophisticated probability-based calculations that feel generous but maintain 5-8% house edge:

CASINO GAME TYPES require advanced multiplier calculations:

MINES GAME - Progressive House Edge:
const calculateMinesMultiplier = (safeReveals, totalMines, totalSpaces) => {
  const totalSafeSpaces = totalSpaces - totalMines;
  let probability = 1;
  
  for (let i = 0; i < safeReveals; i++) {
    probability *= (totalSafeSpaces - i) / (totalSpaces - i);
  }
  
  const fairMultiplier = 1 / probability;
  
  // Progressive house edge - gets harder with more risk
  let houseEdgeFactor;
  if (safeReveals <= 2) {
    houseEdgeFactor = 0.95; // 5% house edge for low risk
  } else if (safeReveals <= 5) {
    houseEdgeFactor = 0.93; // 7% house edge for medium risk  
  } else {
    houseEdgeFactor = 0.88; // 12% house edge for high risk
  }
  
  const scaledMultiplier = fairMultiplier * houseEdgeFactor;
  const maxMultiplier = totalMines >= 20 ? 1000 : totalMines >= 15 ? 500 : totalMines >= 10 ? 100 : 50;
  
  return Math.min(scaledMultiplier, maxMultiplier).toFixed(2);
};

CRASH GAME - Weighted Distribution:
const generateCrashPoint = () => {
  const random = Math.random();
  let crashPoint;
  
  if (random < 0.4) {
    // 40% chance: 1.00x - 1.99x (most losses)
    crashPoint = 1 + Math.pow(Math.random(), 2) * 0.99;
  } else if (random < 0.7) {
    // 30% chance: 2.00x - 4.99x
    crashPoint = 2 + Math.pow(Math.random(), 1.5) * 2.99;
  } else if (random < 0.9) {
    // 20% chance: 5.00x - 19.99x
    crashPoint = 5 + Math.pow(Math.random(), 2) * 14.99;
  } else if (random < 0.98) {
    // 8% chance: 20.00x - 99.99x
    crashPoint = 20 + Math.pow(Math.random(), 3) * 79.99;
  } else {
    // 2% chance: 100x+ (extremely rare)
    crashPoint = 100 + Math.pow(Math.random(), 4) * 900;
  }
  
  return Math.max(crashPoint * 0.94, 1.01).toFixed(2); // 6% house edge
};

DICE GAME - Probability Control:
const calculateDiceMultiplier = (prediction, rollType = 'under') => {
  let winProbability = rollType === 'under' ? 
    (prediction - 1) / 100 : (100 - prediction) / 100;
  
  winProbability = Math.max(0.01, Math.min(0.98, winProbability));
  const fairMultiplier = 1 / winProbability;
  const houseEdge = winProbability > 0.5 ? 0.98 : 0.95;
  
  return Math.min(fairMultiplier * houseEdge, 9999).toFixed(2);
};

ROULETTE - Standard Casino House Edge:
const calculateRouletteMultiplier = (betType) => {
  const multipliers = {
    'straight': 35 * 0.946,      // Single number: 35:1 with house edge
    'split': 17 * 0.946,         // Two numbers: 17:1 with house edge
    'street': 11 * 0.946,        // Three numbers: 11:1 with house edge
    'corner': 8 * 0.946,         // Four numbers: 8:1 with house edge
    'line': 5 * 0.946,           // Six numbers: 5:1 with house edge
    'dozen': 2 * 0.946,          // 12 numbers: 2:1 with house edge
    'column': 2 * 0.946,         // 12 numbers: 2:1 with house edge
    'red': 1 * 0.946,            // 18 numbers: 1:1 with house edge
    'black': 1 * 0.946,          // 18 numbers: 1:1 with house edge
    'even': 1 * 0.946,           // 18 numbers: 1:1 with house edge
    'odd': 1 * 0.946             // 18 numbers: 1:1 with house edge
  };
  
  return (multipliers[betType] || 1).toFixed(2);
};

SLOT MACHINE - Weighted Symbols:
const generateSlotMultiplier = (reels) => {
  const symbolValues = {
    '🍒': 2, '🍋': 3, '🍊': 5, '🍇': 8, '🔔': 15, 
    '💎': 50, '⭐': 100, '🎰': 500
  };
  
  let multiplier = 1;
  const symbolCounts = {};
  
  reels.forEach(symbol => {
    symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
  });
  
  Object.entries(symbolCounts).forEach(([symbol, count]) => {
    if (count >= 2) {
      const baseValue = symbolValues[symbol] || 1;
      multiplier += baseValue * Math.pow(count, 1.5);
    }
  });
  
  return Math.min(multiplier * 0.92, 1000).toFixed(2); // 8% house edge
};

LOTTERY/SCRATCH - Tiered System:
const calculateLotteryMultiplier = (matches) => {
  const multipliers = [0, 0, 2.5, 12, 85, 750, 5000]; // Based on number of matches
  return (multipliers[matches] || 0).toFixed(2);
};

SKILL-BASED GAMES (puzzle, platformer, racing):
- Apply house edge to score conversion: score * 0.92
- Cap multipliers at 4x maximum
const calculateSkillMultiplier = (score) => {
  const adjustedScore = score * 0.92; // House edge
  const multiplier = 1 + Math.log10(1 + adjustedScore / 150);
  return Math.min(multiplier, 4.0).toFixed(2);
};

SKILL-BASED GAMES HOUSE EDGE IMPLEMENTATION:
- MUST include clear losing conditions (0x multiplier scenarios)
- Examples of proper losing mechanisms:
  * Score below minimum threshold
  * Time expiry before completion  
  * Lives/attempts exhausted
  * Failed to reach objective
  * Performance below acceptable level
- Target win rate: 60-70% (30-40% of players should lose completely)
- For winners: Apply 0.92 factor + 4x max cap

🚨 MANDATORY WIN/LOSS DISTRIBUTION 🚨
Ensure proper psychological balance:

TARGET DISTRIBUTION:
- 60% of plays: Small loss or tiny win (0x - 1.2x)
- 25% of plays: Small wins (1.2x - 5x) 
- 12% of plays: Medium wins (5x - 50x)
- 2.8% of plays: Big wins (50x - 500x)
- 0.2% of plays: Huge wins (500x+)

LOSING CONDITIONS (MANDATORY):
- Include multiple ways to lose completely (0x multiplier)
- Make high-risk scenarios fail more often
- Add time pressure or skill requirements
- Implement progressive difficulty

PSYCHOLOGICAL TECHNIQUES:
- Show "near misses" frequently
- Use visual/audio feedback for wins
- Display recent win history
- Suggest cashout at strategic moments

🚨 MANDATORY PROGRESSIVE DIFFICULTY 🚨
Implement win streak tracking and progressive difficulty:

const [winStreak, setWinStreak] = useState(0);

const applyProgressiveDifficulty = (baseMultiplier) => {
  let difficultyFactor = 1;
  if (winStreak >= 3) {
    difficultyFactor = 0.95 - (winStreak * 0.02);
  }
  return baseMultiplier * Math.max(0.75, difficultyFactor);
};

// Update win streak in endGame function
const endGame = useCallback((result, baseMultiplier) => {
  const validatedMultiplier = validateMultiplier(baseMultiplier, 'casino'); // or appropriate game type
  const finalMultiplier = applyProgressiveDifficulty(parseFloat(validatedMultiplier));
  
  if (result === 'win') {
    setWinStreak(prev => prev + 1);
  } else {
    setWinStreak(0);
  }
  
  setGameEnded(true);
  
  // CRITICAL: This exact logging pattern is required
  if (!isPracticeMode && logEvent && typeof logEvent === 'function') {
    logEvent("gameEnded", { 
      timestamp: new Date().toISOString(),
      result: result, // Must be "win", "loss", or "draw"
      multiplier: finalMultiplier.toFixed(2),
      gameType: "REPLACE_WITH_ACTUAL_GAME_NAME",
      practiceMode: false,
      winStreak: winStreak,
      sessionData: {
        duration: Math.round((Date.now() - gameStartTime) / 1000),
        actionsPerformed: actionCount || 0
      }
    });
  }
  
  // Always update game history (both modes)
  setGameHistory(prev => [...prev.slice(-9), { 
    id: Date.now(), 
    result, 
    multiplier: finalMultiplier.toFixed(2), 
    timestamp: new Date().toISOString(),
    practice: isPracticeMode || false
  }]);
}, [isPracticeMode, logEvent, gameStartTime, winStreak]);

🚨 MANDATORY VALIDATION FUNCTION 🚨
Include this exact function:

const validateMultiplier = (multiplier, gameType) => {
  const num = parseFloat(multiplier);
  if (isNaN(num) || num < 0) return "0.00";
  
  const maxMultipliers = {
    'mines': 1000, 
    'crash': 1000, 
    'dice': 9999,
    'roulette': 35,
    'slots': 1000,
    'lottery': 5000,
    'skill': 4.0,
    'default': 50
  };
  
  const max = maxMultipliers[gameType] || maxMultipliers.default;
  return Math.min(num, max).toFixed(2);
};

🚨 MANDATORY CODE STRUCTURE 🚨

REQUIRED STATE VARIABLES:
const [gameStarted, setGameStarted] = useState(false);
const [gameEnded, setGameEnded] = useState(false);
const [isPracticeMode, setIsPracticeMode] = useState(false);
const [gameHistory, setGameHistory] = useState([]);
const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
const [gameStartTime, setGameStartTime] = useState(0);
const [winStreak, setWinStreak] = useState(0);
const [actionCount, setActionCount] = useState(0);

REQUIRED FUNCTIONS (all must be present):
- startGame(practiceMode = false)
- endGame(result, multiplier) 
- resetGame()
- validateMultiplier(multiplier, gameType)
- applyProgressiveDifficulty(baseMultiplier)

LAYOUT REQUIREMENTS:
- Main container: Modern glassmorphism styling with gradient backgrounds
- Game title: <Typography id="game-title" variant="h4">GAME NAME</Typography> with gradient text effect
- Responsive design with isMobile state
- Game rules overlay: <Box id="game-rules"> with modern modal styling

GAME HISTORY DISPLAY:
- Show last 10 games in a modern dark table format
- Color code: wins (#39ff14), losses (#ff0080)
- Include practice mode indicator with neon styling
- Display timestamp and multiplier with gradient effects
- Show win streak indicator with glow effects

ERROR PREVENTION:
- Validate all numeric inputs
- Handle edge cases (division by zero, negative values)
- Ensure multiplier never exceeds caps
- Always return valid multiplier strings with 2 decimal places
- Implement proper error boundaries

TESTING CHECKLIST (the generated code must pass all):
✅ logEvent prop is accepted and used
✅ gameStarted event is logged on game start (non-practice)
✅ gameEnded event is logged with result and multiplier (non-practice)
✅ Practice mode works without logging
✅ Multipliers respect advanced house edge calculations
✅ Progressive difficulty system implemented
✅ Win streak tracking functional
✅ Maximum multiplier caps are enforced
✅ Game history displays correctly
✅ Both game modes (normal/practice) function properly
✅ No financial terms or betting logic present
✅ Component exports properly
✅ Advanced probability calculations implemented
✅ Proper loss distribution maintained
✅ Modern Gen Z styling implemented
✅ Glassmorphism and neon effects present

FAILURE CONDITIONS (will cause rejection):
❌ Missing logEvent prop handling
❌ No game start/end logging
❌ Practice mode missing or broken
❌ Multipliers too generous (no house edge)
❌ Missing progressive difficulty system
❌ Missing required state variables
❌ Broken game history
❌ Financial logic present
❌ Missing multiplier validation
❌ Using styled-components instead of sx prop
❌ Improper probability calculations
❌ Old/boring styling (must use modern design)
❌ Missing glassmorphism/neon effects

🚨 EXAMPLE IMPLEMENTATION STRUCTURE 🚨
Here's the required component structure with modern styling:

  // MANDATORY: Immediate validation
  useEffect(() => {
    if (!logEvent || typeof logEvent !== 'function') {
      console.error('⚠️ CRITICAL: logEvent prop is missing or invalid');
    } else {
      console.log('✅ logEvent prop validated successfully');
    }
  }, [logEvent]);

  // REQUIRED STATE VARIABLES
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [actionCount, setActionCount] = useState(0);

  // MANDATORY FUNCTIONS
  const validateMultiplier = (multiplier, gameType) => { /* implementation */ };
  const applyProgressiveDifficulty = (baseMultiplier) => { /* implementation */ };
  const startGame = (practiceMode = false) => { /* implementation */ };
  const endGame = useCallback((result, multiplier) => { /* implementation */ }, []);
  
 
House Edge Validation Comment (REQUIRED at end):
// House Edge: 6-12% progressive | Max Multiplier: 1000x | Expected RTP: 88-94% | Modern Gen Z Styling Applied

REMEMBER: The goal is creating visually stunning games that appeal to young audiences while maintaining mathematical house edge through:
1. Proper probability calculations
2. Progressive difficulty 
3. Weighted random distributions
4. Smart losing condition placement
5. Psychological near-miss mechanics
6. Win streak dampening
7. Strategic cashout encouragement
8. Modern glassmorphism and neon styling
9. Smooth animations and micro-interactions
10. Bold typography and gradient effects`;

    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      attempt++;
      console.log(`🔄 Generation attempt ${attempt}/${maxAttempts}`);
      
      try {
        // Generate with enhanced prompt
        const stream = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Generate a complete, syntactically perfect React game component for: "${prompt}". 

              CRITICAL REQUIREMENTS:
              1. Every brace { must have a matching }
              2. Every JSX element must be properly closed
              3. End with EXACTLY "export default App;" and nothing else
              4. NO incomplete statements or syntax errors
              5. Include proper logEvent handling and house edge

              Include proxiedAssets: ${JSON.stringify(proxiedAssets)}

              Generate COMPLETE, working code with perfect syntax.`,
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
            throw new Error(`Code cleaning failed after ${maxAttempts} attempts: ${cleanError.message}`);
          }
          continue;
        }

        // Validate the cleaned code
        const validationErrors = validateReactCode(cleanedCode);

        if (validationErrors.length === 0) {
          console.log('✅ All validations passed, testing transpilation');
          
          // Test transpilation to ensure no syntax errors
          try {
            const transpiledCode = await transpileReactCode(cleanedCode);
            
            console.log('✅ React component generation completed successfully');

            return {
              originalCode: cleanedCode,
              transpiledCode: transpiledCode,
              finalApp: transpiledCode,
              proxiedAssets,
              validation: {
                passed: true,
                attempt: attempt,
                checkedItems: [
                  'logEvent prop handling',
                  'gameStarted/gameEnded logging',
                  'practice mode implementation',
                  'house edge enforcement',
                  'financial terms check',
                  'required state variables',
                  'syntax validation',
                  'transpilation test'
                ]
              }
            };
            
          } catch (transpileError) {
            console.error(`❌ Transpilation test failed (attempt ${attempt}):`, transpileError.message);
            if (attempt === maxAttempts) {
              throw new Error(`Generated code failed transpilation after ${maxAttempts} attempts: ${transpileError.message}`);
            }
            // Continue to next attempt with more specific feedback
          }
        } else {
          console.warn(`❌ Validation failed (attempt ${attempt}): ${validationErrors.join('; ')}`);
          if (attempt === maxAttempts) {
            throw new Error(`Validation failed after ${maxAttempts} attempts: ${validationErrors.join('; ')}`);
          }
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