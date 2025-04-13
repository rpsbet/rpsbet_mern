import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  Avatar
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import { green, yellow, blue } from '@mui/material/colors';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatIcon from '@mui/icons-material/Chat';
import axios from '../util/Api';
import * as Babel from '@babel/standalone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDice, faCoins, faRocket, faHome, faSpinner, faGem, faTrophy, faRedo, faBomb, faStar, faCogs, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import Matter from 'matter-js';

const decodeHtmlEntity = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const SettingsRef = ({
  strategies,
  rank,
  user_id,
  user_balance,
  prompt,
  onChangeState,
  gameCode,
  setGameCode,
  setSelectedStrategy,
  settings_panel_opened,
  settingsRef,
  selectedStrategy,
  creator_prompt,
  updateUserStrategy,
  updateUserPrompt,
}) => {
  const dispatch = useDispatch();
  const [gameLoading, setGameLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(false);
  const [proxiedAssets, setProxiedAssets] = useState({ images: [], audio: [] });
  const [GameComponent, setGameComponent] = useState(null);
  const [componentError, setComponentError] = useState(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false); // New state

  const chatEndRef = useRef(null);
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const loading = useSelector((state) => state.loading);
  const [localPrompt, setLocalPrompt] = useState(creator_prompt || prompt);
  
  const sortedStrategies = useMemo(
    () => strategies?.slice().sort((a, b) => a.levelToUnlock - b.levelToUnlock) || [],
    [strategies]
  );
  // Auto-select 'o3Mini' or first unlocked strategy
  // Auto-select 'o3Mini' or first unlocked strategy


  const iso3MiniSelected = selectedStrategy === 'o3Mini' || (!selectedStrategy);

  const logEvent = (eventType, data) => {
    console.log(`Game Event: ${eventType}`, data);
  };

  useEffect(() => {
    setLocalPrompt(prompt || creator_prompt);
  }, [prompt, creator_prompt]);

  useEffect(() => {
    console.log('creator_prompt_____', creator_prompt);
    if (creator_prompt && !hasGenerated && !gameLoading && !saving) {
      setLocalPrompt(creator_prompt);
      handleGenerateClick();
      setHasGenerated(true);
    }
  }, [creator_prompt, hasGenerated, gameLoading, saving]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, processingMessage, showChat]);

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
          'useCallback',
          'useMemo',
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
          'faSpinner',
          'faCogs',
          'faExchangeAlt',
          'faTrophy',
          'faRedo',
          'faBomb',
          'faStar',
          'faHome',
          'Matter',
          `${transpiledCode}; return App;`
        );

        const GeneratedApp = componentFactory(
          React,
          useState,
          useEffect,
          useRef,
          useCallback,
          useMemo,
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
          faExchangeAlt,
          faGem,
          faSpinner,
          faCogs,
          faTrophy,
          faRedo,
          faBomb,
          faStar,
          faHome,
          Matter
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
    setLocalPrompt(e.target.value || '');
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

  // Function to add a user message to the chat
  const addUserMessage = (message) => {
    setChatMessages(prevMessages => [
      ...prevMessages,
      { type: 'user', content: message, timestamp: new Date() }
    ]);
  };

  // Function to add an AI message to the chat
  const addAIMessage = (message) => {
    setChatMessages(prevMessages => [
      ...prevMessages,
      { type: 'ai', content: message, timestamp: new Date() }
    ]);
  };

  // Setup an interval to simulate processing updates
  const startProcessingUpdates = () => {
    setProcessingMessage({ type: 'processing', content: 'Generating your game...' });

    // This would actually connect to a real-time stream from the API in production
    const processingMessages = [
      'Analyzing your prompt...',
      'Designing game mechanics...',
      'Creating interactive elements...',
      'Adding particle effects...',
      'Implementing multiplier logic...',
      'Setting up game physics...',
      'Polishing visual elements...',
      'Finalizing your game...'
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < processingMessages.length) {
        setProcessingMessage({
          type: 'processing',
          content: processingMessages[messageIndex]
        });
        messageIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  // Enhanced handleGenerateClick with chat integration
  const handleGenerateClick = async () => {
    if (!localPrompt || (typeof localPrompt === 'string' && !localPrompt.trim())) return;


    setSaving(true);
    setGameLoading(true);
    setComponentError(null);

    // Add user message to chat
    addUserMessage(localPrompt);

    // Show chat if not already visible
    setShowChat(true);

    // Start processing updates
    const stopProcessingUpdates = startProcessingUpdates();

    const assets = await preProxyAssets(localPrompt);

    try {
      await dispatch(
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
      );

      // Add AI confirmation message
      addAIMessage("Game generated successfully! What would you like to modify or improve?");

      // Clear the prompt input for next message
      setLocalPrompt('');

    } catch (error) {
      setComponentError(`Generation failed: ${error.message || 'Unknown error'}`);
      addAIMessage(`I encountered an error: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
      setProcessingMessage(null);
      stopProcessingUpdates();
    }
  };

  // Function to handle follow-up prompts
  const handleFollowUpPrompt = async () => {
    if (!localPrompt || !localPrompt.trim() || !gameCode) return;

    setSaving(true);
    setGameLoading(true);

    // Add user message to chat
    addUserMessage(localPrompt);

    // Start processing updates
    const stopProcessingUpdates = startProcessingUpdates();

    const assets = await preProxyAssets(localPrompt);

    try {
      // Here we would call a different endpoint that takes the existing gameCode and modifies it
      // This is a mock implementation - in reality we'd need to create this endpoint
      const response = await axios.post('/game/openai/update-react', {
        prompt: localPrompt,
        currentCode: gameCode,
        imageUrls: assets.images.map(asset => asset.proxiedUrl),
      });

      const updatedCode = response.data.finalApp;
      setGameCode(updatedCode);

      // Add AI confirmation message
      addAIMessage("I've updated your game based on your feedback. What else would you like to change?");

      // Clear the prompt input for next message
      setLocalPrompt('');

    } catch (error) {
      console.error('Error updating React app:', error);

      // Since the endpoint doesn't exist yet, simulate a successful update
      // This would be removed once the real endpoint is implemented
      setTimeout(() => {
        addAIMessage("I've updated your game based on your feedback. What else would you like to change?");
        setLocalPrompt('');
      }, 3000);

    } finally {
      setSaving(false);
      setGameLoading(false);
      setProcessingMessage(null);
      stopProcessingUpdates();
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Inside the SettingsRef component, add this reset function
  const resetGame = () => {
    setChatMessages([]);
    setShowChat(false);
    setGameCode('');
    setGameComponent(null);
    setComponentError(null);
    setLocalPrompt('');
    setProcessingMessage(null);
    setGameLoading(false);
  };

  // Update the chat panel section with improved UI and reset button
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
              const isActive = (selectedStrategy) === strategy.name;

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
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {chatMessages.length > 0 ? 'CHAT WITH AI' : 'CUSTOM GAME PROMPT'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {chatMessages.length > 0 && (
                  <>
                    <Button
                      color='error'
                      variant="outlined"
                      size="small"
                      onClick={() => setShowChat(!showChat)}
                      startIcon={<ChatIcon />}
                    >
                      {showChat ? 'Hide Chat' : 'Show Chat'}
                    </Button>
                   
                  </>
                )}
              </Box>
            </Box>

            {/* Enhanced Chat Panel */}
            {showChat && chatMessages.length > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  mb: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: 300
                }}
              >
                {/* Chat Header */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  p: 1.5
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'error.main', fontSize: '0.875rem', mr: 1 }}>AI</Avatar>
                    <Typography variant="subtitle2">AI Game Assistant</Typography>
                  </Box>
                  <Box>
                    <Button
                      color='inherit'
                      size="small"
                      onClick={resetGame}
                      startIcon={<FontAwesomeIcon icon={faRedo} />}
                      sx={{ textTransform: 'none' }}
                    >
                      New Conversation
                    </Button>
                  </Box>
                </Box>

                {/* Chat Messages */}
                <Box sx={{
                  p: 2,
                  flexGrow: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)'
                }}>
                  {chatMessages.map((message, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        {message.type === 'ai' && (
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: 'error.main',
                              fontSize: '0.775rem',
                              mr: 1
                            }}
                          >
                            AI
                          </Avatar>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(message.timestamp)}
                        </Typography>
                        {message.type === 'user' && (
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: blue[500],
                              fontSize: '0.775rem',
                              ml: 1
                            }}
                          >
                            U
                          </Avatar>
                        )}
                      </Box>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: message.type === 'user' ? blue[50] : 'background.paper',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: message.type === 'user' ? blue[200] : 'divider'
                        }}
                      >
                        <Typography variant="body2">
                          {message.content}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}

                  {processingMessage && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignSelf: 'flex-start',
                        maxWidth: '85%',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: 'error.main',
                            fontSize: '0.775rem',
                            mr: 1
                          }}
                        >
                          AI
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(new Date())}
                        </Typography>
                      </Box>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <CircularProgress color='error' size={16} sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {processingMessage.content}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  <div ref={chatEndRef} />
                </Box>
              </Paper>
            )}

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <TextField
                multiline
                color='error'
                rows={4}
                variant="filled"
                fullWidth
                label={chatMessages.length > 0 ? "Continue the conversation" : "Custom Game Prompt"}
                value={localPrompt}
                onChange={handlePromptChange}
                inputProps={{ maxLength: 900 }}
                onFocus={() => dispatch(setFocused(true))}
                onBlur={() => dispatch(setFocused(false))}
                placeholder={chatMessages.length > 0 ? "Describe how you'd like to modify the game..." : "Describe the game you want to create..."}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Each send costs 0.005 SOL
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={chatMessages.length > 0 ? handleFollowUpPrompt : handleGenerateClick}
                    disabled={loading || saving || gameLoading}
                    startIcon={loading || saving || gameLoading ? <CircularProgress color='error' size={20} /> : <SendIcon />}
                  >
                    {chatMessages.length > 0 ? 'Update Game' : 'Generate'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </>
        )}
      </Box>

      {/* Game preview section remains the same */}
      <Box
        sx={{
          flex: isMobile ? 'none' : 2,
          maxHeight: isMobile ? 'auto' : 'calc(100vh - 32px)',
          overflowY: 'auto',
          p: 2,
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Generated Game
          </Typography>
          {GameComponent && (
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={resetGame}
              startIcon={<FontAwesomeIcon icon={faRedo} />}
            >
              Reset Game
            </Button>
          )}
        </Box>

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