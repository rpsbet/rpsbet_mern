import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFocused } from '../redux/Auth/user.actions';
import { generateReactGameFromPrompt, proxyAsset, getCommentsForRoom, updateRoomGameCode } from '../redux/Logic/logic.actions';
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
  Avatar,
  Chip,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
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

// Helper function to pre-filter comments for relevance based on content only
const filterRelevantComments = (comments) => {
  return comments
    .filter((comment) => comment.content && comment.content.length >= 10) // Basic pre-filtering for non-empty, non-trivial comments
    .map((comment) => ({
      content: comment.content,
      relevanceScore: 0, // Placeholder, will be updated by AI
      category: null, // Placeholder, will be updated by AI
    }));
};

const SettingsRef = ({
  strategies,
  rank,
  user_id,
  user_balance,
  prompt,
  onChangeState,
  gameCode: initialGameCode,
  rowName,
  setGameCode,
  setSelectedStrategy,
  settings_panel_opened,
  settingsRef,
  selectedStrategy,
  creator_prompt,
  updateUserStrategy,
  updateUserPrompt,
  onClose,
  room_id,
}) => {
  const dispatch = useDispatch();
  const [gameLoading, setGameLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(false);
  const [proxiedAssets, setProxiedAssets] = useState({ images: [], audio: [] });
  const [GameComponent, setGameComponent] = useState(null);
  const [componentError, setComponentError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(creator_prompt || prompt || '');
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [hasGeneratedSuggestions, setHasGeneratedSuggestions] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false); // Track if comments have been fetched
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const chatEndRef = useRef(null);
  const prevGameCodeRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const loading = useSelector((state) => state.loading);
  const comments = useSelector((state) => state.logic.comments);

  const sortedStrategies = useMemo(
    () => strategies?.slice().sort((a, b) => a.levelToUnlock - b.levelToUnlock) || [],
    [strategies]
  );

  const iso3MiniSelected = selectedStrategy === 'o3Mini' || !selectedStrategy;

  const logEvent = (eventType, data) => {
    console.log(`Game Event: ${eventType}`, data);
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        await dispatch(getCommentsForRoom(room_id));
        setCommentsFetched(true);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setCommentsFetched(true); // Allow suggestion generation even on error
      }
    };

    fetchComments();
  }, [room_id]);

  useEffect(() => {
    const generateSuggestedPrompts = async () => {
      if (!initialGameCode || !commentsFetched || hasGeneratedSuggestions) {
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const rawComments = filterRelevantComments(comments);

        const systemPrompt = `
          You are an expert game designer specializing in UI, game logic, and feature analysis. Your task is to:
          1. Filter user comments to identify actionable feedback related to UI, game logic, or game features.
          2. Generate 3-5 concise, actionable prompts for improving a React game based on the filtered feedback.
  
          ### Step 1: Filter Comments
          - **Feedback Definition**: A comment is feedback if it suggests a specific change, improvement, or issue related to UI (e.g., colors, layout, visuals), game logic (e.g., rules, mechanics, scoring), or game features (e.g., new modes, characters, levels).
          - **Exclude Irrelevant Comments**: Ignore vague, off-topic, or purely emotional comments (e.g., "Great game!", "This sucks") unless they contain actionable suggestions.
          - **Exclude Code Improvements**: Do not include comments about code quality, performance optimizations, or technical refactoring (e.g., "Optimize the rendering loop").
          - **Assign Relevance Score**: For each feedback comment, assign a relevance score (0-1) based on specificity and impact on UI/logic/features.
          - **Categorize Feedback**: Label each feedback comment as "UI", "Logic", or "Feature".
          - **Output Filtered Comments**: Include only the top 10 most relevant feedback comments, sorted by relevance score.
  
          ### Step 2: Generate Prompts
          - **Prompt Requirements**: Generate 3-5 prompts (20-50 words each) for improving the game, prioritizing filtered feedback.
          - **Prompt Focus**: Prompts must address UI, game logic, or game features, not code improvements.
          - **Label Feedback-Based Prompts**: Prefix prompts derived from comments with "[User Feedback]".
          - **Supplement if Needed**: If fewer than 3 actionable comments are available, generate additional prompts by analyzing the game code for UI/logic/feature improvements (not code optimizations).
          - **Prompt Feasibility**: Ensure prompts are specific, feasible for the /game/openai/update-react endpoint, and avoid technical code changes.
  
          ### Input
          **Game Code**:
          ${initialGameCode}
  
          **Comments**:
          ${rawComments.map((c) => `- ${c.content}`).join('\n') || 'No comments provided'}
  
          ### Output Format
          Return a JSON object with two properties:
          {
            "filteredComments": [
              { "content": "string", "relevanceScore": number, "category": "UI|Logic|Feature" },
              ...
            ],
            "suggestions": ["string", ...]
          }
        `;

        const response = await axios.post('/game/openai/generate-suggestions', {
          systemPrompt,
          userPrompt: 'Filter comments and generate suggested prompts based on the provided game code and comments.',
        });

        const { filteredComments = [], suggestions = [] } = response.data || {};

        // Update state with filtered comments and suggestions
        setSuggestedPrompts(suggestions);
        setHasGeneratedSuggestions(true);

        // Optionally store filtered comments if needed for display or further processing
        // For now, we only use them indirectly via suggestions
      } catch (error) {
        console.error('Error generating suggested prompts:', error);
        setSuggestedPrompts([]);
        setHasGeneratedSuggestions(true); // Prevent retry on error
      } finally {
        setIsLoadingSuggestions(false); // Stop loading
      }
    };

    generateSuggestedPrompts();
  }, [comments, commentsFetched, initialGameCode, hasGeneratedSuggestions]);

  const handleSaveAndClose = async () => {
    if (!initialGameCode || !rowName || !room_id) return;

    setSaving(true);
    setProcessingMessage({ type: 'processing', content: 'Saving your game...' });

    try {
      await dispatch(
        updateRoomGameCode({
          roomId: room_id,
          gameCode: initialGameCode,
        })
      );

      addAIMessage(`Game "${rowName}" has been successfully updated!`);
      onClose(); // Close the settings panel
    } catch (error) {
      console.error('Error saving game:', error);
      addAIMessage(`Failed to save game: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
      setProcessingMessage(null);
    }
  };

  useEffect(() => {
    if (initialGameCode && rowName) {
      setGameCode(initialGameCode);
      setLocalPrompt('');
      setHasGenerated(true);

    } else {
      setLocalPrompt(creator_prompt || prompt || '');
    }
  }, [initialGameCode, rowName, creator_prompt, prompt, setGameCode]);

  useEffect(() => {
    if (creator_prompt && !hasGenerated && !gameLoading && !saving && !initialGameCode) {
      setLocalPrompt(creator_prompt);
      handleGenerateClick();
      setHasGenerated(true);
    }
  }, [creator_prompt, hasGenerated, gameLoading, saving, initialGameCode]);

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
    if (initialGameCode) {
      try {
        setComponentError(null);
        const cleanedCode = initialGameCode
          .replace(/import .*? from .+?;/g, '')
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
  }, [initialGameCode]);

  const handlePromptChange = (e) => {
    setLocalPrompt(e.target.value || '');
  };

  const preProxyAssets = async (prompt) => {
    const promptLower = prompt.toLowerCase();
    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter((url) => url.length < 500);

    const imageUrlsFromPrompt = promptUrls.filter((url) => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrlsFromPrompt = promptUrls.filter((url) => /\.(mp3|wav|ogg)$/i.test(url));

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

  const addUserMessage = (message) => {
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { type: 'user', content: message, timestamp: new Date() },
    ]);
  };

  const addAIMessage = (message) => {
    setChatMessages((prevMessages) => [
      ...prevMessages,
      { type: 'ai', content: message, timestamp: new Date() },
    ]);
  };

  const startProcessingUpdates = () => {
    setProcessingMessage({ type: 'processing', content: 'Generating your game...' });

    const processingMessages = [
      'Analyzing your prompt...',
      'Designing game mechanics...',
      'Creating interactive elements...',
      'Adding particle effects...',
      'Implementing multiplier logic...',
      'Setting up game physics...',
      'Polishing visual elements...',
      'Finalizing your game...',
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < processingMessages.length) {
        setProcessingMessage({
          type: 'processing',
          content: processingMessages[messageIndex],
        });
        messageIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const handleGenerateClick = async () => {
    if (!localPrompt || (typeof localPrompt === 'string' && !localPrompt.trim())) return;

    if (room_id && initialGameCode) {
      await handleFollowUpPrompt();
      return;
    }

    setSaving(true);
    setGameLoading(true);
    setComponentError(null);

    addUserMessage(localPrompt);
    setShowChat(true);
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

      addAIMessage('Game generated successfully! What would you like to modify or improve?');
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

  const handleFollowUpPrompt = async (suggestedPrompt = null) => {
    let promptToUse = localPrompt;

    // Use suggestedPrompt only if it's a non-empty string
    if (typeof suggestedPrompt === 'string' && suggestedPrompt.trim()) {
      promptToUse = suggestedPrompt;
    }

    setSaving(true);
    setGameLoading(true);

    addUserMessage(promptToUse);
    const stopProcessingUpdates = startProcessingUpdates();

    const assets = await preProxyAssets(promptToUse);

    try {
      const response = await axios.post('/game/openai/update-react', {
        prompt: promptToUse,
        currentCode: initialGameCode,
        imageUrls: assets.images.map((asset) => asset.proxiedUrl),
      });

      const updatedCode = response.data.finalApp;
      setGameCode(updatedCode);

      addAIMessage('Game updated successfully! What else would you like to change?');
      if (!suggestedPrompt) setLocalPrompt('');
    } catch (error) {
      console.error('Error updating React app:', error);
      addAIMessage(`Failed to update game: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
      setGameLoading(false);
      setProcessingMessage(null);
      stopProcessingUpdates();
    }
  };

  const handleSaveGame = async () => {
    if (!initialGameCode || !rowName) return;

    setSaving(true);
    setProcessingMessage({ type: 'processing', content: 'Saving your game...' });

    try {
      const response = await axios.post('/game/update', {
        gameId: user_id,
        gameCode: initialGameCode,
        gameName: rowName,
      });

      addAIMessage(`Game "${rowName}" has been successfully updated!`);
    } catch (error) {
      console.error('Error saving game:', error);
      addAIMessage(`Failed to save game: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
      setProcessingMessage(null);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const resetGame = () => {
    setChatMessages([]);
    setShowChat(false);
    setGameCode('');
    setGameComponent(null);
    setComponentError(null);
    setLocalPrompt('');
    setProcessingMessage(null);
    setGameLoading(false);
    setSuggestedPrompts([]);
    setHasGeneratedSuggestions(false);
    setCommentsFetched(false); // Reset commentsFetched for new fetch
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
      <Button
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          padding: 0.5,
          fontSize: '1.5rem',
          pointer: 'cursor',
        }}
        color="error"
      >
        ✕
      </Button>
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
          {rowName ? `Updating ${rowName}` : 'AI Game Generator'}
          <AutoAwesomeIcon sx={{ ml: 1, fontSize: '1.25rem', color: 'error.main' }} />
        </Typography>

        {/* <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            MODEL SELECTION
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sortedStrategies.map((strategy, index) => {
              const isUnlocked = tokenStatus || rank >= strategy.levelToUnlock;
              const isActive = selectedStrategy === strategy.name;

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
        </Box> */}

        {iso3MiniSelected && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {chatMessages.length > 0 ? 'CHAT WITH AI' : 'CUSTOM GAME PROMPT'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {chatMessages.length > 0 && (
                  <Button
                    color="error"
                    variant="outlined"
                    size="small"
                    onClick={() => setShowChat(!showChat)}
                    startIcon={<ChatIcon />}
                  >
                    {showChat ? 'Hide Chat' : 'Show Chat'}
                  </Button>
                )}
                {rowName && (
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={handleSaveAndClose}
                    disabled={saving || gameLoading}
                    startIcon={
                      gameLoading ? null : saving ? <CircularProgress color="inherit" size={20} /> : <SaveIcon />
                    }
                    sx={{ minWidth: gameLoading ? 'auto' : 'fit-content' }}
                  >
                    {gameLoading ? <CircularProgress color="inherit" size={20} /> : 'Save and Close'}
                  </Button>
                )}
              </Box>
            </Box>

            {isLoadingSuggestions ? (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress color="error" size={20} sx={{ mr: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Generating Suggested Prompts...
                </Typography>
              </Box>
            ) : suggestedPrompts.length > 0 ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  SUGGESTED PROMPTS
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {suggestedPrompts.map((prompt, index) => (
                    <Chip
                      key={index}
                      label={prompt}
                      onClick={() => handleFollowUpPrompt(prompt)}
                      color={prompt.startsWith('[User Feedback]') ? 'error' : 'warning'}
                      variant="outlined"
                      sx={{ maxWidth: '100%', cursor: 'pointer' }}
                      disabled={saving || gameLoading}
                    />
                  ))}
                </Box>
              </Box>
            ) : null}

            {showChat && chatMessages.length > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  mb: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: 300,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    p: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'error.main', fontSize: '0.875rem', mr: 1 }}>
                      AI
                    </Avatar>
                    <Typography variant="subtitle2">AI Game Assistant</Typography>
                  </Box>
                  <Box>
                    <Button
                      color="inherit"
                      size="small"
                      onClick={resetGame}
                      startIcon={<FontAwesomeIcon icon={faRedo} />}
                      sx={{ textTransform: 'none' }}
                    >
                      New Conversation
                    </Button>
                  </Box>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    flexGrow: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)'),
                  }}
                >
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
                              mr: 1,
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
                              ml: 1,
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
                          borderColor: message.type === 'user' ? blue[200] : 'divider',
                        }}
                      >
                        <Typography variant="body2">{message.content}</Typography>
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
                            mr: 1,
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
                          alignItems: 'center',
                        }}
                      >
                        <CircularProgress color="error" size={16} sx={{ mr: 1 }} />
                        <Typography variant="body2">{processingMessage.content}</Typography>
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
                color="error"
                rows={4}
                variant="filled"
                fullWidth
                label={chatMessages.length > 0 ? 'Continue the conversation' : 'Custom Game Prompt'}
                value={localPrompt}
                onChange={handlePromptChange}
                inputProps={{ maxLength: 1800 }}
                onFocus={() => dispatch(setFocused(true))}
                onBlur={() => dispatch(setFocused(false))}
                placeholder={
                  chatMessages.length > 0
                    ? "Describe how you'd like to modify the game..."
                    : 'Describe the game you want to create...'
                }
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', width: '100%' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={room_id ? handleFollowUpPrompt : handleGenerateClick}
                    disabled={loading || saving || gameLoading}
                    startIcon={loading || saving || gameLoading ? <CircularProgress color="error" size={20} /> : <SendIcon />}
                  >
                    {room_id || chatMessages.length > 0 ? 'Update Game' : 'Generate'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Generated Game
          </Typography>
        </Box>

        {gameLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px' }}>
            <CircularProgress size={60} color="error" />
          </Box>
        ) : componentError ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '600px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '20px',
              color: 'red',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Error
            </Typography>
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '600px',
              border: '1px solid #ccc',
              borderRadius: '8px',
            }}
          >
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