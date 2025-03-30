import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFocused } from '../redux/Auth/user.actions';
import { generateGameFromPrompt, proxyAsset } from '../redux/Logic/logic.actions';
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
import SendIcon from '@mui/icons-material/Send';
import { green, yellow } from '@mui/material/colors';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from '../util/Api';

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
  user_balance,
  prompt,
  onChangeState,
  creator_prompt,
  gameCode,
  setGameCode,
  setSelectedStrategy,
  settings_panel_opened,
  settingsRef,
  selectedStrategy,
  updateUserStrategy,
  updateUserPrompt,
}) => {
  const dispatch = useDispatch();
  const [gameLoading, setGameLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(prompt || creator_prompt);
  const [tokenStatus, setTokenStatus] = useState(false);
  const [proxiedAssets, setProxiedAssets] = useState({ images: [], audio: [] });
  const isMobile = useMediaQuery('(max-width: 768px)');
  const loading = useSelector((state) => state.loading);
  const iso3MiniSelected =
    selectedStrategy === 'o3Mini' || (ai_mode === 'o3Mini' && !selectedStrategy);
  const iframeRef = useRef(null);
  const prevGameCodeRef = useRef('');
  const gameCodeChangeReasonRef = useRef('');
  const [internalGameCode, setInternalGameCode] = useState(gameCode);

  const sortedStrategies = strategies.slice().sort((a, b) => a.levelToUnlock - b.levelToUnlock);

  useEffect(() => {
    console.log('SettingsRef mounted with gameCode:', gameCode);
    setInternalGameCode(gameCode);
    return () => {
      console.log('SettingsRef unmounting, preserving gameCode:', gameCode);
    };
  }, [gameCode]);

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

  useEffect(() => {
    if (gameCode !== prevGameCodeRef.current) {
      console.log('GameCode changed:', {
        previous: prevGameCodeRef.current,
        current: gameCode,
        reason: gameCodeChangeReasonRef.current || 'Unknown',
        timestamp: new Date().toISOString(),
      });
      prevGameCodeRef.current = gameCode;
    }
  }, [gameCode]);

  useEffect(() => {
    if (!settings_panel_opened && iframeRef.current && gameCode) {
      iframeRef.current.contentWindow.postMessage({ type: 'DESTROY_GAME' }, '*');
    } else if (settings_panel_opened && iframeRef.current && gameCode) {
      iframeRef.current.contentWindow.postMessage({ type: 'RELOAD_GAME' }, '*');
    }
  }, [settings_panel_opened, gameCode]);

  const handlePromptChange = (e) => {
    setLocalPrompt(e.target.value);
  };

  const preProxyAssets = async (prompt, imageUrls) => {
    const promptLower = prompt.toLowerCase();
    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter(url => url.length < 500);
    
    // Use only URLs from the prompt, no random additions
    const imageUrlsFromPrompt = promptUrls.filter(url => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrlsFromPrompt = promptUrls.filter(url => /\.(mp3|wav|ogg)$/i.test(url));
  
    console.log('Detected image URLs in prompt:', imageUrlsFromPrompt);
    console.log('Detected audio URLs in prompt:', audioUrlsFromPrompt);
  
    const assets = {
      images: imageUrlsFromPrompt.map((url, i) => ({ key: `image${i}`, url })),
      audio: audioUrlsFromPrompt.map((url, i) => ({ key: `audio${i}`, url })),
    };
  
    const proxiedImages = await Promise.all(
      assets.images.map(async ({ key, url }) => {
        const result = await dispatch(proxyAsset(key, url));
        const proxiedUrl = result.proxiedUrl || url;
        console.log(`Proxied ${key}: ${proxiedUrl}`);
        return { key, proxiedUrl };
      })
    );
  
    const proxiedAudio = await Promise.all(
      assets.audio.map(async ({ key, url }) => {
        const result = await dispatch(proxyAsset(key, url));
        const proxiedUrl = result.proxiedUrl || url;
        console.log(`Proxied ${key}: ${proxiedUrl}`);
        return { key, proxiedUrl };
      })
    );
  
    const finalAssets = { images: proxiedImages, audio: proxiedAudio };
    console.log('Pre-proxied assets:', JSON.stringify(finalAssets));
    return finalAssets;
  };

  const handleGenerateClick = async () => {
    setSaving(true);
    setGameLoading(true);
    console.log('Generating game with prompt:', localPrompt);
  
    const assets = await preProxyAssets(localPrompt, []);
    setProxiedAssets(assets);
  
    dispatch(
      generateGameFromPrompt(
        user_id,
        localPrompt,
        user_balance,
        (code) => {
          gameCodeChangeReasonRef.current = 'Generated from prompt';
          setGameCode(code);
          setGameLoading(false);
        },
        onChangeState,
        updateUserPrompt,
        setGameLoading,
        assets // Pass the pre-proxied assets
      )
    )
      .then(() => setSaving(false))
      .catch((error) => {
        console.error('Game generation failed:', error);
        setGameLoading(false);
        setSaving(false);
      });
  };

  const gameSrcDoc = useMemo(() => {
    if (!gameCode) return '';
    return `
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
          <script>
            window.onerror = function(message, source, lineno, colno, error) {
              document.body.innerHTML = '<h3 style="color:red;">Game Error: ' + message + ' at ' + source + ':' + lineno + '</h3><p>' + (error ? error.stack : 'No stack trace') + '</p>';
              console.error('Game Error:', message, 'Source:', source, 'Line:', lineno, 'Error:', error);
              return true;
            };
            window.sendGameMessage = function(type, data) {
            window.parent.postMessage({ type: type, ...data }, '*');
          };

            let gameInstance = null;
            function startGame() {
              const canvas = document.createElement('canvas');
              const gl = canvas.getContext('webgl');
              if (!gl) {
                document.body.innerHTML = '<h3 style="color:red;">WebGL not supported.</h3>';
                return;
              }
              const proxiedAssets = ${JSON.stringify(proxiedAssets)};
              console.log('Loading assets:', proxiedAssets);
              ${gameCode}
              gameInstance = this.game || window.game; // Ensure game instance is captured
            }
            window.addEventListener('message', (event) => {
              if (event.data.type === 'DESTROY_GAME' && gameInstance) {
                gameInstance.destroy(true);
                gameInstance = null;
                console.log('Game destroyed');
              } else if (event.data.type === 'RELOAD_GAME' && !gameInstance) {
                console.log('Reloading game');
                startGame();
              }
            });
          </script>
        </head>
        <body style="margin: 0; padding: 0; overflow: hidden;">
          <script>
            try {
              startGame();
            } catch (e) {
              console.error('Script execution failed:', e);
              document.body.innerHTML = '<h3 style="color:red;">Script Execution Failed: ' + e.message + '</h3>';
            }
          </script>
        </body>
      </html>
    `;
  }, [gameCode, proxiedAssets]);

  return (
    <Box
      ref={settingsRef}
      className={`transaction-settings ${settings_panel_opened ? 'active' : ''}`}
      sx={{
        flexDirection: isMobile ? 'column' : 'row',
        gap: 3,
        maxWidth: '95vw',
        maxHeight: '95vh',
        overflow: 'hidden',
        padding: 2,
        backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#2a2a2a' : '#f9f9f9'),
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 0 8px rgba(0,0,0,0.8)'
            : '0 0 10px rgba(0,0,0,0.2)',
      }}
    >
      <Box
        sx={{
          flex: isMobile ? 'none' : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxHeight: isMobile ? 'auto' : 'calc(100vh - 32px)',
          overflowY: 'auto',
        }}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
          AI Game Generator
          <AutoAwesomeIcon sx={{ ml: 1, fontSize: '1.25rem', color: 'error.main' }} />
        </Typography>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            MODEL SELECTION
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sortedStrategies.map((strategy, index) => {
              const isUnlocked = tokenStatus || rank >= strategy.levelToUnlock;
              const isActive = (selectedStrategy || ai_mode) === strategy.name;

              return (
                <Tooltip
                  key={index}
                  title={isUnlocked ? 'Unlocked!' : `Unlock at level ${strategy.levelToUnlock}`}
                  arrow
                >
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

        {iso3MiniSelected && (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(145deg, #1a1a3d, #2a2a5a)'
                  : 'linear-gradient(145deg, #f9f9f9, #e0e0e0)',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 4px 15px rgba(0, 0, 0, 0.5)'
                  : '0 4px 15px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <TextField
              multiline
              rows={4}
              color="error"
              variant="filled"
              fullWidth
              label="Custom Game Prompt"
              value={localPrompt}
              onChange={handlePromptChange}
              inputProps={{ maxLength: 900 }}
              onFocus={() => dispatch(setFocused(true))}
              onBlur={() => dispatch(setFocused(false))}
              sx={{
                '& .MuiFilledInput-root': {
                  borderRadius: 1,
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'dark' ? '#2a2a5a' : '#fff',
                  '&:hover': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark' ? '#3a3a7a' : '#f5f5f5',
                  },
                  '&.Mui-focused': {
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark' ? '#3a3a7a' : '#f5f5f5',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? '#00ffcc' : '#ff5555',
                  fontWeight: 500,
                },
              }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 2,
                gap: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: (theme) => (theme.palette.mode === 'dark' ? '#ff00ff' : '#888'),
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  letterSpacing: '0.5px',
                  textShadow: (theme) =>
                    theme.palette.mode === 'dark' ? '0 0 5px rgba(255, 0, 255, 0.5)' : 'none',
                }}
              >
                Each send costs 0.01 SOL
              </Typography>
              <Button
                variant="contained"
                color="error"
                disableElevation
                onClick={handleGenerateClick}
                disabled={loading || saving || gameLoading}
                sx={{
                  minWidth: '120px',
                  padding: '8px 16px',
                  borderRadius: 1,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #ff5555, #ff00ff)'
                      : 'linear-gradient(90deg, #ff5555, #ff7777)',
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 0 10px rgba(255, 0, 255, 0.5), inset 0 0 5px rgba(255, 85, 85, 0.5)'
                      : '0 0 10px rgba(255, 85, 85, 0.3), inset 0 0 5px rgba(255, 85, 85, 0.2)',
                  color: '#fff',
                  fontWeight: 600,
                  textTransform: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(90deg, #ff7777, #ff55ff)'
                        : 'linear-gradient(90deg, #ff7777, #ff9999)',
                    boxShadow: (theme) =>
                      theme.palette.mode === 'dark'
                        ? '0 0 15px rgba(255, 0, 255, 0.7)'
                        : '0 0 15px rgba(255, 85, 85, 0.5)',
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  '&.Mui-disabled': {
                    background: 'grey.500',
                    boxShadow: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                {loading || saving || gameLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SendIcon />
                )}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

      {gameCode && (
        <Box
          sx={{
            flex: isMobile ? 'none' : 2,
            maxHeight: isMobile ? 'auto' : 'calc(100vh - 32px)',
            overflowY: 'auto',
            p: 2,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Generated Game
          </Typography>
          {gameLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px' }}>
              <CircularProgress size={60} color="error" />
            </Box>
          ) : (
            <iframe
              ref={iframeRef}
              title="Generated Game"
              sandbox="allow-scripts allow-same-origin"
              style={{
                width: '100%',
                height: '600px',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
              srcDoc={gameSrcDoc}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default SettingsRef;