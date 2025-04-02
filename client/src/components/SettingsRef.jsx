import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFocused } from '../redux/Auth/user.actions';
import { generateReactGameFromPrompt, proxyAsset } from '../redux/Logic/logic.actions';
import {
  Paper,
  Button,
  Tooltip,
  CircularProgress,
  TextField,
  useMediaQuery,
  Typography,
  Box,
  Slider,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import { green, yellow } from '@mui/material/colors';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from '../util/Api';
import * as Babel from '@babel/standalone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDice, faCoins, faRocket, faGem, faTrophy, faRedo, faBomb, faStar } from '@fortawesome/free-solid-svg-icons';
import Matter from 'matter-js'; // Add Matter.js import

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
  const [GameComponent, setGameComponent] = useState(null);
  const [componentError, setComponentError] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const loading = useSelector((state) => state.loading);
  const iso3MiniSelected =
    selectedStrategy === 'o3Mini' || (ai_mode === 'o3Mini' && !selectedStrategy);

  const sortedStrategies = strategies.slice().sort((a, b) => a.levelToUnlock - b.levelToUnlock);

  const logEvent = (eventType, data) => {
    console.log(`Game Event: ${eventType}`, data);
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

  useEffect(() => {
    if (gameCode) {
      try {
        setComponentError(null);

        const cleanedCode = gameCode
          .replace(/import .*? from .+?;/g, '') // Remove all imports
          .replace('export default App;', '')
          .trim();

        const transpiledCode = Babel.transform(cleanedCode, {
          presets: ['react'],
          filename: 'app.jsx',
        }).code;

        const componentFactory = new Function(
          'React',
          'useState',
          'useEffect',
          'useRef',
          'Box',
          'Typography',
          'TextField',
          'Button',
          'Slider',
          'CircularProgress',
          'logEvent',
          'FontAwesomeIcon',
          'faDice',
          'faCoins',
          'faRocket',
          'faGem',
          'faTrophy',
          'faRedo',
          'faBomb',
          'faStar',
          'Matter', // Add Matter.js to the factory function
          `${transpiledCode}; return App;`
        );

        const GeneratedApp = componentFactory(
          React,
          useState,
          useEffect,
          useRef,
          Box,
          Typography,
          TextField,
          Button,
          Slider,
          CircularProgress,
          logEvent,
          FontAwesomeIcon,
          faDice,
          faCoins,
          faRocket,
          faGem,
          faTrophy,
          faRedo,
          faBomb,
          faStar,
          Matter // Pass Matter.js to the generated component
        );

        if (typeof GeneratedApp === 'function') {
          setGameComponent(() => GeneratedApp);
        } else {
          throw new Error('Generated code did not return a valid React component');
        }
      } catch (error) {
        console.error('Error creating component:', error);
        setComponentError(`Failed to create component: ${error.message}`);
        setGameComponent(null);
      }
    } else {
      setGameComponent(null);
      setComponentError(null);
    }
  }, [gameCode]);

  const handlePromptChange = (e) => {
    setLocalPrompt(e.target.value);
  };

  const preProxyAssets = async (prompt) => {
    const promptLower = prompt.toLowerCase();
    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter((url) => url.length < 500);

    const imageUrlsFromPrompt = promptUrls.filter((url) => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrlsFromPrompt = promptUrls.filter((url) => /\.(mp3|wav|ogg)$/i.test(url));

    console.log('Detected image URLs in prompt:', imageUrlsFromPrompt);
    console.log('Detected audio URLs in prompt:', audioUrlsFromPrompt);

    const assets = {
      images: imageUrlsFromPrompt.map((url, i) => ({ key: `image${i}`, url })),
      audio: audioUrlsFromPrompt.map((url, i) => ({ key: `audio${i}`, url })),
    };

    const proxiedImages = await Promise.all(
      assets.images.map(async ({ key, url }) => {
        const result = await dispatch(proxyAsset(key, url));
        return { key, proxiedUrl: result.proxiedUrl || url };
      })
    );

    const proxiedAudio = await Promise.all(
      assets.audio.map(async ({ key, url }) => {
        const result = await dispatch(proxyAsset(key, url));
        return { key, proxiedUrl: result.proxiedUrl || url };
      })
    );

    const finalAssets = { images: proxiedImages, audio: proxiedAudio };
    setProxiedAssets(finalAssets);
    return finalAssets;
  };

  const handleGenerateClick = async () => {
    setSaving(true);
    setGameLoading(true);
    setComponentError(null);

    const assets = await preProxyAssets(localPrompt);

    dispatch(
      generateReactGameFromPrompt(
        user_id,
        localPrompt,
        user_balance,
        setGameCode,
        onChangeState,
        updateUserPrompt,
        setGameLoading,
        assets
      )
    )
      .then(() => setSaving(false))
      .catch((error) => {
        setGameLoading(false);
        setSaving(false);
        setComponentError(`Generation failed: ${error.message || 'Unknown error'}`);
      });
  };

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
                  <Button
                    variant={isActive ? 'contained' : 'outlined'}
                    color={isActive ? 'error' : 'inherit'}
                    onClick={() => {
                      if (isUnlocked) {
                        setSelectedStrategy(strategy.name);
                        updateUserStrategy?.(user_id, strategy.name);
                      }
                    }}
                    disabled={!isUnlocked}
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    {!isUnlocked && <LockIcon sx={{ color: yellow[700], mr: 0.5 }} />}
                    {strategy.name}
                    {rank === strategy.levelToUnlock + 1 && (
                      <Box component="span" sx={{ color: green[500], ml: 0.5 }}>
                        [NEW!]
                      </Box>
                    )}
                    <Box component="span" sx={{ ml: 0.5 }}>
                      {decodeHtmlEntity(strategy.icon)}
                    </Box>
                  </Button>
                </Tooltip>
              );
            })}
          </Box>
        </Box>

        {iso3MiniSelected && (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <TextField
              multiline
              rows={4}
              variant="filled"
              fullWidth
              label="Custom Game Prompt"
              value={localPrompt}
              onChange={handlePromptChange}
              inputProps={{ maxLength: 900 }}
              onFocus={() => dispatch(setFocused(true))}
              onBlur={() => dispatch(setFocused(false))}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Each send costs 0.01 SOL
              </Typography>
              <Button
                variant="contained"
                color="error"
                onClick={handleGenerateClick}
                disabled={loading || saving || gameLoading}
                startIcon={loading || saving || gameLoading ? <CircularProgress size={20} /> : <SendIcon />}
              >
                Generate
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

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
        ) : componentError ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '600px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '20px',
            color: 'red' 
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Error</Typography>
            <Typography>{componentError}</Typography>
          </Box>
        ) : GameComponent ? (
          <Box
            sx={{
              width: '100%',
              height: '600px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              overflow: 'auto',
            }}
          >
            <GameComponent proxiedAssets={proxiedAssets} logEvent={logEvent} />
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '600px',
            border: '1px solid #ccc',
            borderRadius: '8px' 
          }}>
            <Typography variant="body1" color="text.secondary">
              No game generated yet. Enter a prompt and click Generate.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SettingsRef;