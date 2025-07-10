import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFocused } from '../redux/Auth/user.actions';
import { generateReactGameFromPrompt, proxyAsset, getCommentsForRoom, updateRoomGameCode, autopopulateRoomInfo } from '../redux/Logic/logic.actions';
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
  Modal,
  Card,
  Fade,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  DialogTitle,
  Grid,
  Divider,
  Collapse,
  IconButton,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Badge,
  Snackbar,
  Alert,
  Zoom,
  Grow,
  CardContent,
  CardActions,
  TableContainer,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import { green, yellow, blue, grey } from '@mui/material/colors';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatIcon from '@mui/icons-material/Chat';
import axios from '../util/Api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDice,
  faCoins,
  faChevronDown,
  faRocket,
  faHome,
  faSpinner,
  faGem,
  faTrophy,
  faRedo,
  faBomb,
  faStar,
  faCogs,
  faExchangeAlt,
  faInfoCircle,
  faChevronUp,
  faArrowUp,
  faArrowDown,
  faVolumeUp,
  faVolumeMute,
  faCog,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faPlay,
  faHistory,
  faChartLine,
  faWallet,
  faShieldAlt,
  faHeart,
  faSkull,
  faClock,
  faQuestionCircle,
  faMoneyBillWave,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useAIService } from '../hooks/useAIService';

const decodeHtmlEntity = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const filterRelevantComments = (comments) => {
  return comments
    .filter((comment) => comment.content && comment.content.length >= 10)
    .map((comment) => ({
      content: comment.content,
      relevanceScore: 0,
      category: null,
    }));
};

const SettingsRef = React.forwardRef(({
  rank,
  user_id,
  user_credits,
  prompt,
  onChangeState,
  gameCode: initialGameCode,
  rowName,
  setGameCode,
  settings_panel_opened,
  ticker,
  image,
  description,
  my_games = false,
  onClose,
  room_id,
  proxiedAssets: initialProxiedAssets,
  setProxiedAssets,
  isDarkMode
}, ref) => {
  const dispatch = useDispatch();
  const [gameLoading, setGameLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(false);
  const [GameComponent, setGameComponent] = useState(null);
  const [componentError, setComponentError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedModel, setSelectedModel] = useState('o3-mini');
  const [showChat, setShowChat] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(prompt || '');
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [hasGeneratedSuggestions, setHasGeneratedSuggestions] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [Physics, setPhysics] = useState(null);
  const [isPhysicsLoading, setIsPhysicsLoading] = useState(true);
  const [localCredits, setLocalCredits] = useState(user_credits);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [streamingStatus, setStreamingStatus] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAutopopulating, setIsAutopopulating] = useState(false);

  const chatEndRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const loading = useSelector((state) => state.loading);
  const comments = useSelector((state) => state.logic.comments);
  const creator_prompt = useSelector((state) => state.logic.creator_prompt);
  const isMounted = useRef(true);

  // Available models
  const models = [
    { name: 'o3-mini', levelToUnlock: 1, cost: 8 },
    { name: 'o3', levelToUnlock: 5, cost: 12 }
  ];

  const currentModel = selectedModel || 'o3-mini';
  const modelCost = models.find(m => m.name === currentModel).cost;

  useEffect(() => {
    const loadPhysicsOnMount = async () => {
      setIsPhysicsLoading(true);
      try {
        const matterModule = await loadPhysics();
        if (!matterModule || !matterModule.World || !matterModule.Engine) {
          throw new Error('Matter.js loaded but missing required properties');
        }
        setPhysics(matterModule);
      } catch (error) {
        console.error('[SettingsRef] Failed to load Matter.js:', error.message, error.stack);
        setComponentError(`Failed to load physics engine: ${error.message}`);
      } finally {
        setIsPhysicsLoading(false);
      }
    };

    loadPhysicsOnMount();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Update local credits when user_credits prop changes
  useEffect(() => {
    setLocalCredits(user_credits);
  }, [user_credits]);

  useEffect(() => {
    if (!my_games) return;
    const fetchComments = async () => {
      try {
        await dispatch(getCommentsForRoom(room_id));
        setCommentsFetched(true);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setCommentsFetched(true);
      }
    };
    fetchComments();
  }, [room_id, dispatch, my_games]);

  useEffect(() => {
    if (!my_games) return;

    const generateSuggestedPrompts = async () => {
      if (!initialGameCode || !commentsFetched || hasGeneratedSuggestions) return;
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

        setSuggestedPrompts(suggestions);
        setHasGeneratedSuggestions(true);
      } catch (error) {
        console.error('Error generating suggested prompts:', error);
        setSuggestedPrompts([]);
        setHasGeneratedSuggestions(true);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    generateSuggestedPrompts();
  }, [comments, commentsFetched, initialGameCode, hasGeneratedSuggestions, my_games]);

  const handleSaveAndClose = async () => {
    if (!initialGameCode || !rowName || !room_id) return;
    setSaving(true);
    setProcessingMessage({ type: 'processing', content: 'Saving your game...' });
    try {
      await dispatch(updateRoomGameCode({ roomId: room_id, gameCode: initialGameCode, proxiedAssets: initialProxiedAssets }));
      addAIMessage(`Game "${rowName}" has been successfully updated!`);
      onClose();
    } catch (error) {
      console.error('Error saving game:', error);
      addAIMessage(`Failed to save game: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
      setProcessingMessage(null);
    }
  };

  useEffect(() => {
    if (initialGameCode && rowName && initialProxiedAssets) {
      setGameCode(initialGameCode);
      setProxiedAssets(initialProxiedAssets);
      setLocalPrompt('');
      setHasGenerated(true);
    } else {
      setLocalPrompt(creator_prompt || prompt || '');
    }
  }, [initialGameCode, initialProxiedAssets, rowName, creator_prompt, prompt, setGameCode, setProxiedAssets]);

  useEffect(() => {
    if (creator_prompt && !hasGenerated && !gameLoading && !saving && !initialGameCode && !initialProxiedAssets) {
      setLocalPrompt(creator_prompt);
      handleGenerateClick();
      setHasGenerated(true);
    }
  }, [creator_prompt, hasGenerated, gameLoading, saving, initialGameCode, initialProxiedAssets]);

  useEffect(() => {
    if (initialGameCode && Physics && !isPhysicsLoading) {
      let isMounted = true;
      setComponentError(null);

      const processGameCode = async () => {
        try {
          if (!Physics || !Physics.World) {
            throw new Error('Matter.js not loaded or missing World property');
          }

          // The code from backend is already transpiled - execute it directly
          let GeneratedApp;

          try {
            // Execute the component factory function
            const componentFactory = eval(initialGameCode);

            // Call the factory with all dependencies
            GeneratedApp = componentFactory(
              React, useState, useEffect, useRef, useMemo, useCallback, useAnimation,
              Grid, Box, Typography, TextField, Button, Slider, Dialog, Divider, Paper, Chip,
              Collapse, DialogContent, DialogTitle, LinearProgress, CircularProgress, logEvent, FontAwesomeIcon,
              TableContainer, Table, TableBody, TableHead, TableCell, TableRow,
              faDice, faCoins, faRocket, faChevronDown, faGem, faSpinner, faCogs, faExchangeAlt,
              faTrophy, faArrowUp, faArrowDown, faRedo, faBomb, faStar, faPlay, faHome, Physics,
              Card, CardContent, CardActions, Tooltip, motion, styled, AnimatePresence, IconButton,
              Container, Badge, Snackbar, Alert, DialogContentText, DialogActions, Zoom, Grow,
              faInfoCircle, faChevronUp, faVolumeUp, faVolumeMute, faCog, faExclamationTriangle,
              faCheck, faTimes, faHistory, faChartLine, faWallet, faShieldAlt, faHeart, faSkull,
              faClock, faBolt, initialProxiedAssets, faQuestionCircle, useAIService,
            );
          } catch (evalError) {
            console.error('[SettingsRef] Error executing component factory:', evalError);
            throw new Error(`Failed to execute transpiled code: ${evalError.message}`);
          }

          if (typeof GeneratedApp === 'function') {
            if (isMounted) {
              setGameComponent(() => (props) =>
                React.createElement(GeneratedApp, {
                  ...props,
                  Physics,
                  proxiedAssets: initialProxiedAssets,
                  logEvent,
                  useAIService
                })
              );
            }
          } else {
            throw new Error('Component factory did not return a valid React component function');
          }

        } catch (error) {
          console.error('[SettingsRef] Error creating component from transpiled code:', error);
          if (isMounted) {
            setComponentError(`Failed to create component: ${error.message}`);
            setGameComponent(null);
          }
        }
      };

      processGameCode();

      // Auto-populate logic (unchanged)
      if (!hasGenerated && !rowName && !prompt && !initialProxiedAssets?.images?.length) {
        setTimeout(() => {
          if (isMounted) {
            console.log('[SettingsRef] Auto-populating with initial code, length:', initialGameCode?.length);
            console.log('[SettingsRef] Initial code preview:', initialGameCode?.substring(0, 200) + '...');
            triggerAutopopulate(initialGameCode);
          }
        }, 1000);
      }

      return () => {
        isMounted = false;
      };
    } else {
      setGameComponent(null);
      setComponentError(null);
    }
  }, [initialGameCode, Physics, isPhysicsLoading, initialProxiedAssets, hasGenerated, rowName]);

  const handlePromptChange = (e) => setLocalPrompt(e.target.value || '');

  const preProxyAssets = async (prompt, backendAssets = { images: [], audio: [], theme: {}, background: {} }) => {
    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter((url) => url.length < 500);
    const imageUrlsFromPrompt = promptUrls.filter((url) => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrlsFromPrompt = promptUrls.filter((url) => /\.(mp3|wav|ogg)$/i.test(url));

    const assets = {
      images: [
        ...backendAssets.images.map(({ key, proxiedUrl }) => ({ key, url: proxiedUrl })),
        ...imageUrlsFromPrompt.map((url, i) => ({ key: `image${i}`, url })),
      ],
      audio: [
        ...backendAssets.audio.map(({ key, proxiedUrl }) => ({ key, url: proxiedUrl })),
        ...audioUrlsFromPrompt.map((url, i) => ({ key: `audio${i}`, url })),
      ],
      theme: backendAssets.theme,
      background: backendAssets.background,
    };

    const proxiedImages = await Promise.all(
      assets.images.map(async ({ key, url }) => {
        if (backendAssets.images.some((img) => img.key === key && img.proxiedUrl === url)) {
          return { key, proxiedUrl: url };
        }
        try {
          const result = await dispatch(proxyAsset(key, url));
          return { key, proxiedUrl: result.proxiedUrl || url };
        } catch (error) {
          console.error(`[ProxyAsset] Failed for ${key}: ${error.message}`);
          return { key, proxiedUrl: url };
        }
      })
    );

    const proxiedAudio = await Promise.all(
      assets.audio.map(async ({ key, url }) => {
        if (backendAssets.audio.some((audio) => audio.key === key && audio.proxiedUrl === url)) {
          return { key, proxiedUrl: url };
        }
        try {
          const result = await dispatch(proxyAsset(key, url));
          return { key, proxiedUrl: result.proxiedUrl || url };
        } catch (error) {
          console.error(`[ProxyAsset] Failed for ${key}: ${error.message}`);
          return { key, proxiedUrl: url };
        }
      })
    );

    const finalAssets = {
      images: proxiedImages,
      audio: proxiedAudio,
      theme: assets.theme,
      background: assets.background,
    };
    setProxiedAssets(finalAssets);
    return finalAssets;
  };

  const addUserMessage = (message) => {
    setChatMessages((prev) => [...prev, { type: 'user', content: message, timestamp: new Date() }]);
  };

  const addAIMessage = (message) => {
    setChatMessages((prev) => [...prev, { type: 'ai', content: message, timestamp: new Date() }]);
  };

  // Enhanced processing messages for better UX
  const startProcessingUpdates = () => {
    setProcessingMessage({ type: 'processing', content: 'Initializing game generation...' });
    setStreamingProgress(0);
    setIsStreaming(true);
  };

  // Streaming callback function
  const handleStreamUpdate = useCallback((update) => {
    switch (update.type) {
      case 'status':
        setProcessingMessage({
          type: 'processing',
          content: update.message
        });
        setStreamingProgress(update.progress || 0);
        setStreamingStatus(update.message);
        break;

      case 'code_update':
        // Real-time code updates - you could show a preview here
        setStreamingProgress(update.progress || 0);
        break;

      case 'complete':
        setProcessingMessage({
          type: 'success',
          content: update.message
        });
        setStreamingProgress(100);
        setIsStreaming(false);
        setTimeout(() => {
          setProcessingMessage(null);
          setStreamingProgress(0);
          setStreamingStatus('');
        }, 2000);
        break;

      default:
        break;
    }
  }, []);

  const handleGenerateClick = async () => {
    if (!localPrompt || (typeof localPrompt === 'string' && !localPrompt.trim())) return;
    if (localCredits < modelCost) {
      addAIMessage('Insufficient credits to generate game. Please add more credits.');
      return;
    }

    setSaving(true);
    setGameLoading(true);
    setComponentError(null);
    addUserMessage(localPrompt);
    setShowChat(true);
    startProcessingUpdates();

    const assets = await preProxyAssets(localPrompt);

    try {
      const response = await dispatch(
        generateReactGameFromPrompt(
          user_id,
          localCredits,
          localPrompt,
          setGameCode,
          setProxiedAssets,
          onChangeState,
          setGameLoading,
          assets,
          currentModel,
          handleStreamUpdate
        )
      );

      const backendAssets = response.payload?.proxiedAssets || { images: [], audio: [], theme: {}, background: {} };
      await preProxyAssets(localPrompt, backendAssets);
      setLocalCredits(prev => prev - modelCost);
      addAIMessage('Game generated successfully! What would you like to modify or improve?');
      setLocalPrompt('');
      setHasGenerated(true);

      // Trigger auto-populate ONLY if we successfully generated a game
      if (response.payload?.finalApp) {
        console.log('[SettingsRef] Triggering auto-populate for generated game');
        console.log('[SettingsRef] Generated code preview:', response.payload.finalApp.substring(0, 200) + '...');
        setTimeout(async () => {
          await triggerAutopopulate(response.payload.finalApp);
        }, 1000); // Small delay to ensure game code is processed
      } else {
        console.warn('[SettingsRef] No finalApp in response payload:', response.payload);
      }
    } catch (error) {
      setComponentError(`Generation failed: ${error.message || 'Unknown error'}`);
      addAIMessage(`I encountered an error: ${error.message || 'Unknown error'}`);
      setIsStreaming(false);
      setProcessingMessage(null);
      setStreamingProgress(0);
    } finally {
      setSaving(false);
      if (!isStreaming) {
        setProcessingMessage(null);
        setStreamingProgress(0);
      }
      setGameLoading(false);
    }
  };

  const triggerAutopopulate = async (generatedGameCode, force = false) => {
    setIsAutopopulating(true);

    try {
      // Validate the game code before sending it to the backend
      if (!generatedGameCode || typeof generatedGameCode !== 'string') {
        console.warn('[SettingsRef] Invalid game code for auto-populate:', typeof generatedGameCode);
        return;
      }

      // Check if the game code looks like an error message or malformed code
      const codeToCheck = generatedGameCode.toLowerCase();
      const errorIndicators = [
        'generation failed',
        'error handling',
        'failed request',
        'runtime error',
        'failed to',
        'error:',
        'exception:',
        'cannot read properties'
      ];

      if (errorIndicators.some(indicator => codeToCheck.includes(indicator))) {
        console.warn('[SettingsRef] Game code appears to contain error messages, skipping auto-populate');
        return;
      }

      // Additional validation - check if it looks like JavaScript code
      if (!generatedGameCode.includes('function') && !generatedGameCode.includes('=>') && !generatedGameCode.includes('React')) {
        console.warn('[SettingsRef] Game code does not appear to be valid JavaScript, skipping auto-populate');
        return;
      }

      console.log('[SettingsRef] Auto-populating with code length:', generatedGameCode.length);

      const extractedInfo = await autopopulateRoomInfo(
        generatedGameCode,
        onChangeState,
        dispatch
      );

      if (extractedInfo) {
        const imageText = extractedInfo.imageUrl ? ' with generated image' : '';
        addAIMessage(`I've auto-populated the room info: "${extractedInfo.name}" ($${extractedInfo.ticker})${imageText}. Feel free to modify these suggestions!`);
      } else {
        console.log('[SettingsRef] Auto-populate returned no results');
      }
    } catch (error) {
      console.error('[SettingsRef] Auto-populate failed:', error);
      addAIMessage('Failed to auto-populate room info. Please enter details manually.');
    } finally {
      setIsAutopopulating(false);
    }
  };

  const handleFollowUpPrompt = async (suggestedPrompt = null) => {
    let promptToUse = suggestedPrompt || localPrompt;
    if (!promptToUse || typeof promptToUse !== 'string' || !promptToUse.trim()) {
      console.warn('[handleFollowUpPrompt] Invalid prompt, exiting');
      return;
    }
    if (localCredits < modelCost) {
      addAIMessage('Insufficient credits to update game. Please add more credits.');
      return;
    }

    setSaving(true);
    setGameLoading(true);
    addUserMessage(promptToUse);

    // Enhanced progress updates for modifications
    let progressInterval = null;
    if (handleStreamUpdate && typeof handleStreamUpdate === 'function') {
      let progress = 0;
      const modificationMessages = [
        { progress: 10, message: 'Analyzing your modification request...' },
        { progress: 25, message: 'Understanding current game structure...' },
        { progress: 40, message: 'Implementing requested changes...' },
        { progress: 60, message: 'Updating game mechanics...' },
        { progress: 75, message: 'Preserving existing features...' },
        { progress: 90, message: 'Finalizing modifications...' },
      ];

      let messageIndex = 0;

      progressInterval = setInterval(() => {
        if (messageIndex < modificationMessages.length) {
          const currentMessage = modificationMessages[messageIndex];
          handleStreamUpdate({
            type: 'status',
            message: currentMessage.message,
            progress: currentMessage.progress
          });
          messageIndex++;
        }
      }, 1500);
    }

    // Determine if this is a background change request
    const isBackgroundChange = /change\s+background|switch\s+background|new\s+background|update\s+background/i.test(promptToUse.toLowerCase());

    const imageUrls = isBackgroundChange
      ? initialProxiedAssets.images
        .filter(asset => asset.key !== 'background')
        .map(asset => asset.proxiedUrl)
      : initialProxiedAssets.images.map(asset => asset.proxiedUrl);

    try {
      const response = await axios.post('/game/update-react', {
        prompt: promptToUse,
        currentCode: initialGameCode,
        imageUrls,
        proxiedAssets: {
          ...initialProxiedAssets,
          images: isBackgroundChange
            ? initialProxiedAssets.images.filter(asset => asset.key !== 'background')
            : initialProxiedAssets.images,
        },
        model: currentModel
      });

      // Clear progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      // FIX: The update endpoint returns different property names than generate
      console.log('[handleFollowUpPrompt] Update response:', response.data);

      // Use transpiledCode for execution, originalCode as fallback
      const updatedCode = response.data.transpiledCode || response.data.originalCode || response.data.finalApp;
      const backendAssets = response.data.proxiedAssets || initialProxiedAssets;

      if (!updatedCode) {
        throw new Error('No updated code received from server');
      }

      console.log('[handleFollowUpPrompt] Setting updated code:', updatedCode ? 'Code received' : 'No code');

      // Update assets if needed
      await preProxyAssets(promptToUse, backendAssets);

      setGameCode(updatedCode);
      setProxiedAssets(backendAssets);
      setLocalCredits(prev => prev - modelCost);

      // Final progress update
      if (handleStreamUpdate) {
        handleStreamUpdate({
          type: 'complete',
          message: 'Game updated successfully!',
          progress: 100
        });
      }

      addAIMessage('Game updated successfully! What else would you like to change?');
      if (!suggestedPrompt) setLocalPrompt('');

    } catch (error) {
      // Clear progress interval on error
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      console.error('[handleFollowUpPrompt] Error updating React app:', error);
      console.error('[handleFollowUpPrompt] Error response:', error.response?.data);

      const errorMessage = isBackgroundChange
        ? 'Failed to change background: ' + (error.response?.data?.message || error.message || 'Unknown error')
        : `Failed to update game: ${error.response?.data?.message || error.message || 'Unknown error'}`;
      addAIMessage(errorMessage);

      // Don't revert to previous version, keep the current game displayed
      console.log('[handleFollowUpPrompt] Keeping current game code after error');

    } finally {
      setSaving(false);
      setGameLoading(false);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
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
    setCommentsFetched(false);
    setProxiedAssets({ images: [], audio: [], theme: {}, background: {} });
  };

  const logEvent = useCallback((eventType, data) => {
    console.log(`Game Event: ${eventType}`, data);
  }, []);

  const loadPhysics = async () => {
    try {
      if (window.Matter && window.Matter.World && typeof window.Matter.World === 'function') {
        return window.Matter;
      }
      const matterModule = await import('matter-js');
      if (!matterModule || !matterModule.World || !matterModule.Engine) {
        throw new Error('Matter.js module loaded but missing required properties');
      }
      window.Matter = matterModule;
      return matterModule;
    } catch (error) {
      console.error('[Matter.js] Local import failed:', error.message);
      try {
        const matterModule = await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js';
          script.onload = () => {
            if (window.Matter && window.Matter.World && window.Matter.Engine) {
              console.log('[Matter.js] Loaded via CDN');
              resolve(window.Matter);
            } else {
              reject(new Error('Matter.js CDN loaded but missing required properties'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load Matter.js from CDN'));
          document.head.appendChild(script);
        });
        return matterModule;
      } catch (cdnError) {
        console.error('[Matter.js] CDN fallback failed:', cdnError.message);
        throw new Error(`Failed to load Matter.js: ${cdnError.message}`);
      }
    }
  };

  // For embedded mode (not modal), render directly without modal wrapper
  if (!settings_panel_opened) {
    return null;
  }

  // If this is for CreateGame (no modal), render as embedded component
  if (!rowName && !room_id) {
    return (
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            variant="h6"
            sx={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
              color: '#fff',
              fontSize: '1rem',
            }}
          >
            AI Game Generator
            <AutoAwesomeIcon sx={{ ml: 1, fontSize: '1.25rem', color: '#ff0000' }} />
          </Typography>

          {/* Chat Interface */}
          {showChat && (
            <Box
              sx={{
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                mb: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: 250,
                minHeight: 200,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  p: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', mr: 1 }}>
                    AI
                  </Avatar>
                  <Typography variant="subtitle2" sx={{ color: '#fff', fontSize: '0.875rem' }}>
                    AI Game Assistant
                  </Typography>
                </Box>
                <Button
                  color="inherit"
                  variant="outlined"
                  size="small"
                  onClick={resetGame}
                  startIcon={<FontAwesomeIcon icon={faRedo} />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  }}
                >
                  Reset
                </Button>
              </Box>
              <Box
                sx={{
                  p: 2,
                  flexGrow: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {chatMessages.length > 0 ? (
                  chatMessages.map((message, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        {message.type === 'ai' && (
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem', mr: 1 }}>
                            AI
                          </Avatar>
                        )}
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                          {formatTime(message.timestamp)}
                        </Typography>
                        {message.type === 'user' && (
                          <Avatar sx={{ width: 20, height: 20, bgcolor: blue[500], fontSize: '0.65rem', ml: 1 }}>
                            U
                          </Avatar>
                        )}
                      </Box>
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: message.type === 'user' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          border: `1px solid ${message.type === 'user' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                          color: '#fff',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{message.content}</Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', fontSize: '0.8rem' }}>
                    No messages yet. Start by sending a prompt!
                  </Typography>
                )}

                {processingMessage && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', maxWidth: '80%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem', mr: 1 }}>
                        AI
                      </Avatar>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                        {formatTime(new Date())}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        minWidth: 200,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CircularProgress color='error' size={16} sx={{ mr: 1 }} />
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{processingMessage.content}</Typography>
                      </Box>

                      {isStreaming && streamingProgress > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.65rem' }}>
                              Progress
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.65rem' }}>
                              {streamingProgress.toFixed(0)}%
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${streamingProgress}%`,
                                bgcolor: '#ff0000',
                                borderRadius: 2,
                                transition: 'width 0.3s ease-in-out',
                              }}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
                <div ref={chatEndRef} />
              </Box>
            </Box>
          )}

          {/* Prompt Input */}
          <Box
            sx={{
              p: 2,
              borderRadius: '8px',
              background: '#262626',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <TextField
              multiline
              rows={3}
              variant="outlined"
              fullWidth
              color='error'
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  borderRadius: '8px',
                },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {chatMessages.length > 0 && (
                  <Button
                    color="inherit"
                    variant="outlined"
                    size="small"
                    onClick={() => setShowChat(!showChat)}
                    startIcon={<ChatIcon />}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                    }}
                  >
                    {showChat ? 'Hide Chat' : 'Show Chat'}
                  </Button>
                )}
              </Box>
              <Button
                variant="contained"
                color='error'
                onClick={() => (room_id || chatMessages.length > 0 ? handleFollowUpPrompt() : handleGenerateClick())}
                disabled={loading || saving || gameLoading || localCredits < modelCost}
                startIcon={loading || saving || gameLoading ? <CircularProgress color='error' size={20} sx={{ color: '#fff' }} /> : <SendIcon />}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  px: 2,
                  '&:hover': {
                    bgcolor: '#cc0000',
                  },
                  '&:disabled': {
                    bgcolor: grey[700],
                    color: grey[400],
                  },
                }}
              >
                {room_id || chatMessages.length > 0 ? 'Update Game' : 'Generate'}
              </Button>
            </Box>
          </Box>

          {/* Game Preview */}
          {gameLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: 300,
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <CircularProgress color='error' size={60} sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ color: '#fff', fontSize: '0.875rem' }}>
                Generating your game...
              </Typography>
            </Box>
          ) : componentError ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: 300,
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                p: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: '#ff0000', fontSize: '1rem' }}>
                Error
              </Typography>
              <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>{componentError}</Typography>
            </Box>
          ) : GameComponent ? (
            <Box
              sx={{
                width: '100%',
                borderRadius: '8px',
                overflow: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.02)',
                position: 'relative',
              }}
            >
              {(() => {
                try {
                  return <GameComponent proxiedAssets={initialProxiedAssets} logEvent={logEvent} Physics={Physics} />;
                } catch (error) {
                  setComponentError(`Runtime error: ${error.message}`);
                  return (
                    <Typography sx={{ color: '#ff0000', p: 2, fontSize: '0.875rem' }}>
                      Failed to render game: {error.message}
                    </Typography>
                  );
                }
              })()}
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 300,
                p: 2,
                textAlign: 'center',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                No game generated yet. Enter a prompt and click Generate.
              </Typography>
            </Box>
          )}
          {isAutopopulating && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              p: 2,
              borderRadius: '8px',
              background: '#262626',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <CircularProgress size={20} sx={{ mr: 1 }} color='error' />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>
                Auto-populating room information...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // Original modal version for other use cases
  return (
    <Modal
      open={settings_panel_opened}
      onClose={onClose}
      aria-labelledby="settings-modal-title"
      aria-describedby="settings-modal-description"
      closeAfterTransition
      BackdropProps={{
        sx: { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
      }}
    >
      <Fade in={settings_panel_opened}>
        <Box
          ref={ref}
          sx={{
            width: isMobile ? '95vw' : isTablet ? '95vw' : '90vw',
            maxWidth: 1200,
            height: isMobile ? '90vh' : '85vh',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '8px',
            p: isMobile ? 2 : 3,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 3,
            color: '#fff',
            background: rowName ? '#262626' : 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Button
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              minWidth: 32,
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '1rem',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            ✕
          </Button>

          <Box
            sx={{
              flex: isMobile ? 'none' : 1,
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 1.5 : 2,
              maxHeight: isMobile ? 'auto' : 'calc(85vh - 64px)',
              overflowY: 'auto',
              pr: isMobile ? 0 : 1,
            }}
          >
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              id="settings-modal-title"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600,
                color: '#fff',
                fontSize: isMobile ? '1rem' : '1.25rem',
              }}
            >
              {rowName ? `Updating ${rowName}` : 'AI Game Generator'}
              <AutoAwesomeIcon sx={{ ml: 1, fontSize: '1.25rem', color: '#ff0000' }} />
            </Typography>

            {/* Credits Display */}
            <Box
              sx={{
                p: 2,
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff', mb: 0.5, fontSize: '0.875rem' }}>
                Credit Balance
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<FontAwesomeIcon icon={faCoins} style={{ color: yellow[700], fontSize: '12px' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mr: 0.5, fontSize: '0.75rem' }}>
                        {localCredits}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Credits</Typography>
                    </Box>
                  }
                  sx={{
                    bgcolor: localCredits < modelCost ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                    color: localCredits < modelCost ? '#ff0000' : '#fff',
                    border: `1px solid ${localCredits < modelCost ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255, 193, 7, 0.3)'}`,
                    borderRadius: '8px',
                    height: 28,
                    '& .MuiChip-icon': {
                      color: yellow[700],
                      mr: 0.5
                    }
                  }}
                />

                <Chip
                  icon={<FontAwesomeIcon icon={faCog} style={{ color: blue[400], fontSize: '12px' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mr: 0.5, fontSize: '0.75rem' }}>
                        {modelCost}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Cost per Generation</Typography>
                    </Box>
                  }
                  sx={{
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                    color: '#fff',
                    border: '1px solid rgba(33, 150, 243, 0.3)',
                    borderRadius: '8px',
                    height: 28,
                    '& .MuiChip-icon': {
                      color: blue[400],
                      mr: 0.5
                    }
                  }}
                />
              </Box>

              {localCredits < modelCost && (
                <Alert
                  severity="error"
                  variant="outlined"
                  icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
                  sx={{
                    mt: 1,
                    bgcolor: 'rgba(244, 67, 54, 0.05)',
                    color: '#ff0000',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    fontSize: '0.8rem',
                    '& .MuiAlert-icon': {
                      color: '#ff0000'
                    }
                  }}
                >
                  Insufficient credits. You need {modelCost - localCredits} more credits to proceed.
                </Alert>
              )}

              <Box sx={{ mt: 1, mb: localCredits < modelCost ? 0 : 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                    Credits Available
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                    {localCredits}/{modelCost} Required
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${Math.min(100, (localCredits / modelCost) * 100)}%`,
                      bgcolor: localCredits < modelCost ? '#ff0000' : '#4caf50',
                      borderRadius: 2,
                      transition: 'width 0.5s ease-in-out',
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>
                {chatMessages.length > 0 ? 'Chat with AI' : 'Custom Game Prompt'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {chatMessages.length > 0 && (
                  <>
                    <Button
                      color="inherit"
                      variant="outlined"
                      size="small"
                      onClick={() => setShowChat(!showChat)}
                      startIcon={<ChatIcon />}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                      }}
                    >
                      {showChat ? 'Hide Chat' : 'Show Chat'}
                    </Button>
                    <Button
                      color="inherit"
                      variant="outlined"
                      size="small"
                      onClick={resetGame}
                      startIcon={<FontAwesomeIcon icon={faRedo} />}
                      sx={{
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                      }}
                    >
                      New Chat
                    </Button>
                  </>
                )}
                {rowName && (
                  <Button
                    variant="contained"
                    onClick={handleSaveAndClose}
                    disabled={saving || gameLoading}
                    startIcon={
                      gameLoading ? null : saving ? <CircularProgress color="error" size={16} /> : <SaveIcon />
                    }
                    sx={{
                      bgcolor: '#4caf50',
                      color: '#fff',
                      fontSize: '0.75rem',
                      '&:hover': {
                        bgcolor: '#45a049',
                      },
                      '&:disabled': {
                        bgcolor: grey[700],
                        color: grey[400],
                      },
                    }}
                  >
                    {gameLoading ? <CircularProgress color="error" size={16} /> : 'Save & Close'}
                  </Button>
                )}
              </Box>
            </Box>

            {showChat && (
              <Box
                sx={{
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  mb: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: isMobile ? 250 : 300,
                  minHeight: 200,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    p: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', mr: 1 }}>
                      AI
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontSize: '0.875rem' }}>
                      AI Game Assistant
                    </Typography>
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
                  }}
                >
                  {chatMessages.length > 0 ? (
                    chatMessages.map((message, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '80%',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          {message.type === 'ai' && (
                            <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem', mr: 1 }}>
                              AI
                            </Avatar>
                          )}
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                            {formatTime(message.timestamp)}
                          </Typography>
                          {message.type === 'user' && (
                            <Avatar sx={{ width: 20, height: 20, bgcolor: blue[500], fontSize: '0.65rem', ml: 1 }}>
                              U
                            </Avatar>
                          )}
                        </Box>
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: message.type === 'user' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: `1px solid ${message.type === 'user' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                            color: '#fff',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{message.content}</Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', fontSize: '0.8rem' }}>
                      No messages yet. Start by sending a prompt!
                    </Typography>
                  )}
                  {processingMessage && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', maxWidth: '80%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: '0.65rem', mr: 1 }}>
                          AI
                        </Avatar>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                          {formatTime(new Date())}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#fff',
                        }}
                      >
                        <CircularProgress color='error' size={16} sx={{ mr: 1 }} />
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{processingMessage.content}</Typography>
                      </Box>
                    </Box>
                  )}
                  <div ref={chatEndRef} />
                </Box>
              </Box>
            )}

            <Box
              sx={{
                p: isMobile ? 2 : 3,
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <TextField
                multiline
                rows={isMobile ? 3 : 4}
                variant="outlined"
                fullWidth
                color='error'
                label={chatMessages.length > 0 ? 'Continue the conversation' : 'Custom Game Prompt'}
                value={localPrompt}
                onChange={(e) => {
                  handlePromptChange(e);
                }}
                inputProps={{ maxLength: 1800 }}
                onFocus={() => dispatch(setFocused(true))}
                onBlur={() => dispatch(setFocused(false))}
                placeholder={
                  chatMessages.length > 0
                    ? "Describe how you'd like to modify the game..."
                    : 'Describe the game you want to create...'
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    borderRadius: '8px',
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color='error'
                  onClick={() => (room_id || chatMessages.length > 0 ? handleFollowUpPrompt() : handleGenerateClick())}
                  disabled={loading || saving || gameLoading || localCredits < modelCost}
                  startIcon={loading || saving || gameLoading ? <CircularProgress color='error' size={20} sx={{ color: '#fff' }} /> : <SendIcon />}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    px: 3,
                    '&:hover': {
                      bgcolor: '#cc0000',
                    },
                    '&:disabled': {
                      bgcolor: grey[700],
                      color: grey[400],
                    },
                  }}
                >
                  {room_id || chatMessages.length > 0 ? 'Update Game' : 'Generate'}
                </Button>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              flex: isMobile ? 'none' : 2,
              maxHeight: isMobile ? 'auto' : 'calc(85vh - 64px)',
              overflowY: 'auto',
              p: isMobile ? 1 : 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>
                Generated Game
              </Typography>
            </Box>
            {gameLoading ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: isMobile ? 300 : 600,
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <CircularProgress color='error' size={60} sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#fff', fontSize: '0.875rem' }}>
                  Generating your game...
                </Typography>
              </Box>
            ) : componentError ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: isMobile ? 300 : 600,
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  p: 3,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: '#ff0000', fontSize: '1rem' }}>
                  Error
                </Typography>
                <Typography sx={{ color: '#fff', fontSize: '0.875rem' }}>{componentError}</Typography>
              </Box>
            ) : GameComponent ? (
              <Box
                sx={{
                  width: '100%',
                  height: isMobile ? 300 : 600,
                  borderRadius: '8px',
                  overflow: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  position: 'relative',
                }}
              >
                {(() => {
                  try {
                    return <GameComponent proxiedAssets={initialProxiedAssets} logEvent={logEvent} Physics={Physics} />;
                  } catch (error) {
                    setComponentError(`Runtime error: ${error.message}`);
                    return (
                      <Typography sx={{ color: '#ff0000', p: 2, fontSize: '0.875rem' }}>
                        Failed to render game: {error.message}
                      </Typography>
                    );
                  }
                })()}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: isMobile ? 300 : 600,
                  p: 2,
                  textAlign: 'center',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                  No game generated yet. Enter a prompt and click Generate.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
});

export default SettingsRef;