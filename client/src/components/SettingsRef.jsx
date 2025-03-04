import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setFocused } from '../redux/Auth/user.actions';
import {
  Paper,
  Button,
  Tooltip,
  CircularProgress,
  TextField,
  useMediaQuery,
  Typography,
  Box,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { green, yellow } from '@mui/material/colors';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from '../util/Api';
import debounce from 'lodash.debounce';

const decodeHtmlEntity = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const SettingsRef = ({
  strategies,
  rank,
  user_id,
  ai_mode,
  prompt,
  onChangeState,
  creator_prompt,
  setSelectedStrategy,
  settings_panel_opened,
  settingsRef,
  selectedStrategy,
  updateUserStrategy,
  updateUserPrompt,
}) => {
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(prompt || creator_prompt);
  const [tokenStatus, setTokenStatus] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const debouncedUpdateRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isGPT3Selected =
    selectedStrategy === 'GPT3' || (ai_mode === 'GPT3' && !selectedStrategy);

  const sortedStrategies = strategies.slice().sort((a, b) => a.levelToUnlock - b.levelToUnlock);

  useEffect(() => {
    if (debouncedUpdateRef.current) {
      debouncedUpdateRef.current.cancel();
    }

    debouncedUpdateRef.current = debounce(async (newPrompt) => {
      setSaving(true);

      if (typeof updateUserPrompt === 'function') {
        await updateUserPrompt(user_id, newPrompt);
      } else {
        onChangeState({ prompt: newPrompt });
      }

      // Generate the game from the prompt
      generateGameFromPrompt(newPrompt);

      timeoutRef.current = setTimeout(() => {
        setSaving(false);
        timeoutRef.current = null;
      }, 1000);
    }, 1000);

    return () => {
      if (debouncedUpdateRef.current) {
        debouncedUpdateRef.current.cancel();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user_id, updateUserPrompt]);

  // OpenAI API call to generate game code
  const generateGameFromPrompt = async (gamePrompt) => {
    if (!gamePrompt.trim()) return;

    try {
      const response = await axios.post('/game/openai/generate', { prompt: gamePrompt });

      let gameCode = response.data.gameCode || '// No game generated.';
console.log("gameCode", gameCode)
      // Attempt to extract only JavaScript code (remove explanations from OpenAI)
      const extractedCode = gameCode.match(/```javascript([\s\S]*?)```/);
      if (extractedCode) {
        gameCode = extractedCode[1].trim(); // Extract only the code inside the JS block
      }

      // Basic sanitization to remove non-JS symbols
      gameCode = gameCode.replace(/[^ -~\n]/g, ''); // Remove non-printable characters

      // Add a try-catch wrapper for error handling
      gameCode = `
        try {
          ${gameCode}
        } catch (error) {
          console.error("Game Error:", error);
        }
      `;

      setGameCode(gameCode);
    } catch (error) {
      console.error('Error generating game:', error);
      setGameCode('// Failed to generate game.');
    }
  };

  useEffect(() => {
    setLocalPrompt(prompt || creator_prompt);
  }, [prompt, creator_prompt]);

  useEffect(() => {
    const checkTokenStatus = async () => {
      try {
        const res = await axios.post('/game/checkTokens');
        setTokenStatus(res.data.status ?? false);
      } catch (error) {
        console.error('Error checking tokens:', error);
      }
    };

    checkTokenStatus();
  }, []);

  const handlePromptChange = (e) => {
    const newValue = e.target.value;
    setLocalPrompt(newValue);
    debouncedUpdateRef.current(newValue);
  };

  return (
    <Box
      ref={settingsRef}
      className={`transaction-settings ${settings_panel_opened ? 'active' : ''}`}
      sx={{
        maxWidth: '95vw',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? '#2a2a2a' : '#f9f9f9',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 0 8px rgba(0,0,0,0.8)'
            : '0 0 10px rgba(0,0,0,0.2)',
        overflowY: 'auto',
        transition: 'transform 0.3s ease-in-out',
        padding: 2,
      }}
    >
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1, fontWeight: 600 }}>
        AI Game Generator
        <AutoAwesomeIcon sx={{ ml: 1, fontSize: '1.25rem', color: 'error.main' }} />
      </Typography>

      {/* Game Model Selection */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          MODEL SELECTION
        </Typography>
        <Box className="slippage-select-panel" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {sortedStrategies.map((strategy, index) => {
            const isUnlocked = tokenStatus || rank >= strategy.levelToUnlock;
            const isActive = (selectedStrategy || ai_mode) === strategy.name;

            return (
              <Tooltip key={index} title={isUnlocked ? 'Unlocked!' : `Unlock at level ${strategy.levelToUnlock}`} arrow>
                <Box>
                  <Button
                    variant={isActive ? 'contained' : 'outlined'}
                    color={isActive ? 'error' : 'inherit'}
                    disableElevation
                    onClick={() => {
                      if (typeof updateUserStrategy === 'function' && isUnlocked) {
                        updateUserStrategy(user_id, strategy.name);
                      }
                      if (isUnlocked) {
                        setSelectedStrategy(strategy.name);
                      }
                    }}
                    disabled={!isUnlocked}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      borderRadius: 1,
                      width: '100%',
                      '&.Mui-disabled': { opacity: 0.5, color: 'text.disabled' },
                    }}
                  >
                    {!isUnlocked && <LockIcon sx={{ color: yellow[700], mr: 0.5, fontSize: '1.1rem' }} />}
                    {strategy.name}{' '}
                    {rank === strategy.levelToUnlock + 1 && (
                      <Box component="span" sx={{ color: green[500], fontWeight: 'bold', ml: 0.5 }}>
                        [NEW!]
                      </Box>
                    )}
                    <Box component="span" sx={{ fontSize: '1.1em', ml: 0.5 }}>
                      {decodeHtmlEntity(strategy.icon)}
                    </Box>
                  </Button>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Game Rendering Section */}
      {gameCode && (
        <Box sx={{ mt: 3, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Generated Game:
          </Typography>
          <iframe
            title="Generated Game"
            sandbox="allow-scripts"
            style={{ width: '600px', height: '400px', border: '1px solid black', marginTop: '20px' }}
            srcDoc={`
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js"></script>
        <script>
          window.onerror = function(message, source, lineno, colno, error) {
            document.body.innerHTML = '<h3 style="color:red;">Game Error: ' + message + '</h3>';
          };
        </script>
      </head>
      <body>
        <script>${gameCode}</script>
      </body>
    </html>
  `}
          />
        </Box>
      )}

      {/* Prompt Box */}
      {isGPT3Selected && (
        <Paper variant="outlined">
          <TextField
            multiline
            rows={4}
            color="error"
            variant="filled"
            fullWidth
            label="Custom Prompt"
            value={localPrompt}
            onChange={handlePromptChange}
            onFocus={() => dispatch(setFocused(true))}
            onBlur={() => dispatch(setFocused(false))}
          />
        </Paper>
      )}
    </Box>
  );
};

export default SettingsRef;