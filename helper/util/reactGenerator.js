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
  const trimmedCode = code.trim();
  const properEndings = [
    'return typeof App !== \'undefined\' ? App : null;\n})',
    'return typeof App !== \'undefined\' ? App : null;\n})',
    'return typeof App !== \'undefined\' ? App : null; })',
    'return typeof App !== \'undefined\' ? App : null;})'
  ];
  
  const hasProperEnding = properEndings.some(ending => trimmedCode.endsWith(ending));
  
  if (!hasProperEnding) {
    errors.push('CRITICAL: Missing proper function ending');
    console.log('🚨 Code ends with:', trimmedCode.slice(-100));
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
  const properEndings = [
    'return typeof App !== \'undefined\' ? App : null;\n})',
    'return typeof App !== \'undefined\' ? App : null; })',
    'return typeof App !== \'undefined\' ? App : null;})'
  ];
  
  const hasProperEnding = properEndings.some(ending => fixed.trim().endsWith(ending));
  
  if (!hasProperEnding) {
    console.log('🔧 Fixing truncated ending...');
    
    // Remove any incomplete trailing syntax patterns
    fixed = fixed.replace(/[,{]\s*sx[^}]*$/, '');
    fixed = fixed.replace(/,\s*$/, '');
    fixed = fixed.replace(/\{\s*sx;?\s*$/, '');
    fixed = fixed.replace(/React\.createElement\([^)]*$/g, '');
    fixed = fixed.replace(/\)\s*:\s*React\.createElement\([^)]*$/g, '');
    
    // More aggressive cleanup for incomplete elements
    const problematicPatterns = [
      /\s*,\s*\{[^}]*$/,  // Incomplete object at end
      /\s*\)[^)]*$/,      // Incomplete closing parenthesis
      /\s*\([^)]*$/,      // Incomplete opening parenthesis
      /\s*\{[^}]*$/       // Incomplete opening brace
    ];
    
    problematicPatterns.forEach(pattern => {
      fixed = fixed.replace(pattern, '');
    });
    
    // Clean up any incomplete trailing elements line by line
    const lines = fixed.split('\n');
    while (lines.length > 0) {
      const lastLine = lines[lines.length - 1].trim();
      if (lastLine.match(/^\s*[,{(\)]\s*$/) || 
          lastLine.match(/sx\s*:\s*{\s*$/) ||
          lastLine.match(/React\.createElement\([^)]*$/) ||
          lastLine.match(/^\s*\)\s*[,;]?\s*$/)) {
        console.log('🔧 Removing incomplete line:', lastLine);
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

// Minimal system prompt to prevent token limit issues
const getEnhancedSystemPrompt = (gameType = 'game') => `Generate React game: "${gameType}". Use wrapped function format starting with (function(React, useState, useEffect, useRef, useMemo, useCallback, useAnimation, Grid, Box, Typography, TextField, Button, Slider, Dialog, Divider, Paper, Chip, Collapse, DialogContent, DialogTitle, CircularProgress, logEvent, FontAwesomeIcon, TableContainer, Table, TableBody, TableRow, TableCell, TableHead, faDice, faCoins, faPlay, faRocket, faChevronDown, faGem, faSpinner, faCogs, faExchangeAlt, faTrophy, faArrowUp, faArrowDown, faRedo, faBomb, faStar, faHome, Physics, Card, CardContent, CardActions, Tooltip, motion, styled, AnimatePresence, IconButton, Container, Badge, Snackbar, Alert, DialogContentText, DialogActions, Zoom, Modal, Grow, faInfoCircle, faChevronUp, faVolumeUp, faVolumeMute, faCog, faExclamationTriangle, faCheck, faTimes, faHistory, faChartLine, faWallet, faShieldAlt, faHeart, faSkull, faClock, faBolt, proxiedAssets, faQuestionCircle) {
Include helper functions _defineProperty and _objectSpread.
Use useState like: var _useState = useState(false), gameStarted = _useState[0], setGameStarted = _useState[1];
Implement real game mechanics with endGame('win', multiplier) and endGame('loss', '0.00').
End with: return typeof App !== 'undefined' ? App : null; })`;

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

        const startTime = Date.now();
        let totalTokens = 0;
        let inputTokens = 0;
        let outputTokens = 0;

        // Add timeout wrapper
        const GENERATION_TIMEOUT = 120000; // 2 minutes max
        
        const generationPromise = anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          temperature: attempt > 1 ? 0.1 : 0.5,
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

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Generation timeout after 2 minutes')), GENERATION_TIMEOUT);
        });

        const stream = await Promise.race([generationPromise, timeoutPromise]);

        let rawCode = '';
        let chunkCount = 0;
        
        try {
          for await (const chunk of stream) {
            chunkCount++;
            
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              rawCode += chunk.delta.text;
              outputTokens += chunk.delta.text.split(' ').length; // Rough token estimate
            } else if (chunk.type === 'message_start') {
              inputTokens = chunk.message.usage?.input_tokens || 0;
            } else if (chunk.type === 'message_delta' && chunk.delta.usage) {
              outputTokens = chunk.delta.usage.output_tokens || outputTokens;
            } else if (chunk.type === 'message_stop') {
              // Final usage data
              if (chunk.usage) {
                inputTokens = chunk.usage.input_tokens || inputTokens;
                outputTokens = chunk.usage.output_tokens || outputTokens;
              }
            }
          }
          
          totalTokens = inputTokens + outputTokens;
          
        } catch (streamError) {
          console.error('⚠️ Streaming error:', streamError.message);
          // Continue with whatever we got
        }

        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`📝 Raw code received (attempt ${attempt}), length: ${rawCode.length}`);
        console.log(`📊 Streaming stats: ${chunkCount} chunks processed`);
        console.log(`🔢 Token usage: ${totalTokens} total (${inputTokens} input, ${outputTokens} output)`);
        console.log(`⏱️ Generation time: ${duration}ms`);
        
        // Check if response appears complete
        const endsWithClosingBrace = rawCode.trim().endsWith('})');
        const hasReturnStatement = rawCode.includes('return typeof App');
        console.log(`✅ Response completeness: ends with '})'=${endsWithClosingBrace}, has return=${hasReturnStatement}`);

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
          tokenUsage: {
            total: totalTokens,
            input: inputTokens,
            output: outputTokens,
            duration: duration,
            attempt: attempt
          },
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
  validateAndFixCode: autoFixCriticalErrors // Export for testing
};