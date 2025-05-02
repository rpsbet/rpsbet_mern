import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
} from '@mui/material';
import styled from 'styled-components';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import { green, yellow, blue, grey } from '@mui/material/colors';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatIcon from '@mui/icons-material/Chat';
import axios from '../util/Api';
import * as Babel from '@babel/standalone';
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

// Glassmorphism style object for reuse
const glassmorphismStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
  '@supports not (backdrop-filter: blur(12px))': {
    background: 'rgba(255, 255, 255, 0.2)',
  },
};

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

const SettingsRef = ({
  rank,
  user_id,
  user_credits,
  user_balance,
  prompt,
  onChangeState,
  gameCode: initialGameCode,
  rowName,
  setGameCode,
  settings_panel_opened,
  settingsRef,
  creator_prompt,
  my_games = false,
  updateUserPrompt,
  onClose,
  room_id,
  proxiedAssets: initialProxiedAssets,
  setProxiedAssets
}) => {
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
  const [localPrompt, setLocalPrompt] = useState(creator_prompt || prompt || '');
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [hasGeneratedSuggestions, setHasGeneratedSuggestions] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [Physics, setPhysics] = useState(null);
  const [isPhysicsLoading, setIsPhysicsLoading] = useState(true);
  const [localCredits, setLocalCredits] = useState(user_credits); // Track credits locally

  const chatEndRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const loading = useSelector((state) => state.loading);
  const comments = useSelector((state) => state.logic.comments);
  const isMounted = useRef(true);

  // Available models
  const models = [
    { name: 'o3-mini', levelToUnlock: 1, cost: 8 },
    { name: 'o3', levelToUnlock: 5, cost: 12 }
  ];

  const currentModel = selectedModel || 'o3-mini'; // Default to o3-mini
  const modelCost = models.find(m => m.name === currentModel).cost;

  useEffect(() => {
    const loadPhysicsOnMount = async () => {
      setIsPhysicsLoading(true);
      try {
        console.log('[SettingsRef] Loading Matter.js on page load');
        const matterModule = await loadPhysics();
        if (!matterModule || !matterModule.World || !matterModule.Engine) {
          throw new Error('Matter.js loaded but missing required properties');
        }
        console.log('[SettingsRef] Matter.js loaded successfully:', matterModule);
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
        const { filteredComments = [], suggestions = [] } = response.data || {};
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
    if (showChat && (chatMessages.length > 0 || processingMessage) && chatEndRef.current) {
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
    if (initialGameCode && Physics && !isPhysicsLoading) {
      let isMounted = true;
      setComponentError(null);
      console.log('[Raw initialGameCode]', initialGameCode);

      const processGameCode = async () => {
        try {
          if (!Physics || !Physics.World) {
            throw new Error('Matter.js not loaded or missing World property');
          }

          let cleanedCode = initialGameCode
            .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g, '')
            .replace(/require\s*\(\s*['"][^'"]+['"]\s*\)\s*;?/g, '')
            .replace(/export\s+default\s+[\w\s]*?\s*;?/g, '')
            .replace(/export\s+[\w\s]*?\s*;?/g, '')
            .replace(/import\s*\(\s*['"][^'"]+['"]\s*\)\s*;?/g, '')
            .trim();
          console.log('[Cleaned Code]', cleanedCode);

          const babelHelpers = `
            function _defineProperty(obj, key, value) {
              if (key in obj) {
                Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
              } else {
                obj[key] = value;
              }
              return obj;
            }
            function _slicedToArray(arr, i) {
              return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
            }
            function _arrayWithHoles(arr) {
              if (Array.isArray(arr)) return arr;
            }
            function _iterableToArrayLimit(arr, i) {
              var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
              if (_i == null) return;
              var _arr = [];
              var _n = true;
              var _d = false;
              var _s, _e;
              try {
                for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
                  _arr.push(_s.value);
                  if (i && _arr.length === i) break;
                }
              } catch (err) {
                _d = true;
                _e = err;
              } finally {
                try {
                  if (!_n && _i["return"] != null) _i["return"]();
                } finally {
                  if (_d) throw _e;
                }
              }
              return _arr;
            }
            function _unsupportedIterableToArray(o, minLen) {
              if (!o) return;
              if (typeof o === "string") return _arrayLikeToArray(o, minLen);
              var n = Object.prototype.toString.call(o).slice(8, -1);
              if (n === "Object" && o.constructor) n = o.constructor.name;
              if (n === "Map" || n === "Set") return Array.from(o);
              if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
            }
            function _arrayLikeToArray(arr, len) {
              if (len == null || len > arr.length) len = arr.length;
              for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
              return arr2;
            }
            function _nonIterableRest() {
              throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
            }
            function _objectSpread(target) {
              for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i] != null ? arguments[i] : {};
                var ownKeys = Object.keys(source);
                if (typeof Object.getOwnPropertySymbols === 'function') {
                  ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
                    return Object.getOwnPropertyDescriptor(source, sym).enumerable;
                  }));
                }
                ownKeys.forEach(function (key) {
                  _defineProperty(target, key, source[key]);
                });
              }
              return target;
            }
          `;

          let transpiledCode;
          try {
            transpiledCode = Babel.transform(cleanedCode, {
              presets: ['react', ['env', { modules: false, targets: { browsers: ['last 2 versions'] } }]],
              filename: 'app.jsx',
            }).code;
            transpiledCode = `${babelHelpers}\n${transpiledCode}`;
          } catch (babelError) {
            console.error('[Babel Transpile Error]', babelError);
            throw new Error(`Babel transpilation failed: ${babelError.message}`);
          }

          const componentFactory = new Function(
            'React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useAnimation',
            'Grid', 'Box', 'Typography', 'TextField', 'Button', 'Slider', 'Dialog', 'Divider', 'Paper', 'Chip',
            'Collapse', 'DialogContent', 'DialogTitle', 'CircularProgress', 'logEvent', 'FontAwesomeIcon', 'TableContainer', 'Table', 'TableBody', 'TableRow', 'TableCell', 'TableHead',
            'faDice', 'faCoins', 'faPlay', 'faRocket', 'faChevronDown', 'faGem', 'faSpinner', 'faCogs', 'faExchangeAlt', 'faTrophy', 'faArrowUp', 'faArrowDown',
            'faRedo', 'faBomb', 'faStar', 'faHome', 'Physics', 'Card', 'CardContent', 'CardActions',
            'Tooltip', 'motion', 'styled', 'AnimatePresence', 'IconButton', 'Container', 'Badge',
            'Snackbar', 'Alert', 'DialogContentText', 'DialogActions', 'Zoom', 'Grow',
            'faInfoCircle', 'faChevronUp', 'faVolumeUp', 'faVolumeMute', 'faCog', 'faExclamationTriangle',
            'faCheck', 'faTimes', 'faHistory', 'faChartLine', 'faWallet', 'faShieldAlt', 'faHeart', 'faSkull', 'faClock', 'faBolt', 'faMoneyBillWave',
            'initialProxiedAssets', 'faQuestionCircle', 'Modal',
            `
              return function App(props) {
                ${transpiledCode}
                return App(props);
              };
            `
          );

          const GeneratedApp = componentFactory(
            React, useState, useEffect, useRef, useMemo, useCallback, useAnimation,
            Grid, Box, Typography, TextField, Button, Slider, Dialog, Divider, Paper, Chip,
            Collapse, DialogContent, DialogTitle, CircularProgress, logEvent, FontAwesomeIcon,
            faDice, faCoins, faRocket, faChevronDown, faGem, faSpinner, faCogs, faExchangeAlt, faTrophy, faArrowUp, faArrowDown,
            faRedo, faBomb, faStar, faPlay, faHome, Physics, Card, CardContent, CardActions, TableContainer, Table, TableBody, TableHead, TableCell, TableRow,
            Tooltip, motion, styled, AnimatePresence, IconButton, Container, Badge,
            Snackbar, Alert, DialogContentText, DialogActions, Zoom, Grow,
            faInfoCircle, faChevronUp, faVolumeUp, faVolumeMute, faCog, faExclamationTriangle,
            faCheck, faTimes, faHistory, faChartLine, faWallet, faShieldAlt, faHeart, faSkull, faClock, faBolt, faMoneyBillWave,
            initialProxiedAssets, faQuestionCircle, Modal,
          );

          if (typeof GeneratedApp === 'function') {
            if (isMounted) {
              setGameComponent(() => (props) => <GeneratedApp {...props} Physics={Physics} />);
            }
          } else {
            throw new Error('Generated code did not return a valid React component');
          }
        } catch (error) {
          console.error('Error creating component:', error);
          if (isMounted) {
            setComponentError(`Failed to create component: ${error.message}`);
            setGameComponent(null);
          }
        }
      };

      processGameCode();
      return () => {
        isMounted = false;
      };
    } else if (initialGameCode && isPhysicsLoading) {
      console.log('[SettingsRef] Waiting for Matter.js to load before processing game code');
    } else {
      setGameComponent(null);
      setComponentError(null);
    }
  }, [initialGameCode, Physics, isPhysicsLoading, initialProxiedAssets]);

  const handlePromptChange = (e) => setLocalPrompt(e.target.value || '');

  const preProxyAssets = async (prompt, backendAssets = { images: [], audio: [], theme: {}, background: {} }) => {
    const promptLower = prompt.toLowerCase();
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
          console.log(`[ProxyAsset] Key: ${key}, Proxied URL: ${result.proxiedUrl || url}`);
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
          console.log(`[ProxyAsset] Key: ${key}, Proxied URL: ${result.proxiedUrl || url}`);
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
    console.log(`[preProxyAssets] Final Assets: ${JSON.stringify(finalAssets, null, 2)}`);
    setProxiedAssets(finalAssets);
    return finalAssets;
  };

  const addUserMessage = (message) => {
    setChatMessages((prev) => [...prev, { type: 'user', content: message, timestamp: new Date() }]);
  };

  const addAIMessage = (message) => {
    setChatMessages((prev) => [...prev, { type: 'ai', content: message, timestamp: new Date() }]);
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
        setProcessingMessage({ type: 'processing', content: processingMessages[messageIndex] });
        messageIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  };

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
    const stopProcessingUpdates = startProcessingUpdates();
    const assets = await preProxyAssets(localPrompt);
    try {
      const response = await dispatch(
        generateReactGameFromPrompt(
          user_id,
          localCredits,
          localPrompt,
          user_balance,
          setGameCode,
          setProxiedAssets,
          onChangeState,
          updateUserPrompt,
          setGameLoading,
          assets,
          currentModel
        )
      );
      const backendAssets = response.payload?.proxiedAssets || { images: [], audio: [], theme: {}, background: {} };
      await preProxyAssets(localPrompt, backendAssets);
      setLocalCredits(prev => prev - modelCost);
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
    const stopProcessingUpdates = startProcessingUpdates();

    const isBackgroundChange = /change\s+background|switch\s+background|new\s+background|update\s+background/i.test(promptToUse.toLowerCase());

    const imageUrls = isBackgroundChange
      ? initialProxiedAssets.images
        .filter(asset => asset.key !== 'background')
        .map(asset => asset.proxiedUrl)
      : initialProxiedAssets.images.map(asset => asset.proxiedUrl);

    try {
      const response = await axios.post('/game/openai/update-react', {
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
      const updatedCode = response.data.finalApp;
      const backendAssets = response.data.proxiedAssets || initialProxiedAssets;
      await preProxyAssets(promptToUse, backendAssets);
      setGameCode(updatedCode);
      setProxiedAssets(backendAssets);
      setLocalCredits(prev => prev - modelCost);
      addAIMessage('Game updated successfully! What else would you like to change?');
      if (!suggestedPrompt) setLocalPrompt('');
    } catch (error) {
      console.error('[handleFollowUpPrompt] Error updating React app:', error);
      const errorMessage = isBackgroundChange
        ? 'Failed to change background: ' + (error.message || 'Unknown error')
        : `Failed to update game: ${error.message || 'Unknown error'}`;
      addAIMessage(errorMessage);
      setGameCode(initialGameCode);
    } finally {
      setSaving(false);
      setGameLoading(false);
      setProcessingMessage(null);
      stopProcessingUpdates();
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
        console.log('[Matter.js] Using cached Matter.js');
        return window.Matter;
      }
      console.log('[Matter.js] Attempting to load Matter.js dynamically');
      const matterModule = await import('matter-js');
      if (!matterModule || !matterModule.World || !matterModule.Engine) {
        throw new Error('Matter.js module loaded but missing required properties');
      }
      console.log('[Matter.js] Successfully loaded Matter.js:', matterModule);
      window.Matter = matterModule;
      return matterModule;
    } catch (error) {
      console.error('[Matter.js] Local import failed:', error.message);
      console.log('[Matter.js] Falling back to CDN');
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
          sx={{
            width: isMobile ? '95vw' : isTablet ? '90vw' : '80vw',
            maxWidth: 1200,
            height: isMobile ? '90vh' : '85vh',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 3,
            p: isMobile ? 2 : 3,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 3,
            color: '#fff',
            ...glassmorphismStyle,
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
              minWidth: 40,
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                transform: 'scale(1.1)',
                transition: 'all 0.3s ease',
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
                fontWeight: 700,
                color: '#fff',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
            >
              {rowName ? `Updating ${rowName}` : 'AI Game Generator'}
              <AutoAwesomeIcon sx={{ ml: 1, fontSize: '1.5rem', color: 'error.main' }} />
            </Typography>

            {/* Replace the current credits display with this improved version */}
            <Box
              sx={{
                ...glassmorphismStyle,
                p: 2,
                borderRadius: 2,
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff', mb: 0.5 }}>
                Credit Balance
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<FontAwesomeIcon icon={faCoins} style={{ color: yellow[700], fontSize: '14px' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mr: 0.5 }}>
                        {localCredits}
                      </Typography>
                      <Typography variant="caption">Credits</Typography>
                    </Box>
                  }
                  sx={{
                    bgcolor: localCredits < modelCost ? 'rgba(244, 67, 54, 0.15)' : 'rgba(255, 193, 7, 0.15)',
                    color: localCredits < modelCost ? '#ff1744' : '#fff',
                    border: `1px solid ${localCredits < modelCost ? 'rgba(244, 67, 54, 0.5)' : 'rgba(255, 193, 7, 0.5)'}`,
                    borderRadius: '16px',
                    height: 32,
                    '& .MuiChip-icon': {
                      color: yellow[700],
                      mr: 0.5
                    }
                  }}
                />

                <Chip
                  icon={<FontAwesomeIcon icon={faCog} style={{ color: blue[400], fontSize: '14px' }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mr: 0.5 }}>
                        {modelCost}
                      </Typography>
                      <Typography variant="caption">Cost per Generation</Typography>
                    </Box>
                  }
                  sx={{
                    bgcolor: 'rgba(33, 150, 243, 0.15)',
                    color: '#fff',
                    border: '1px solid rgba(33, 150, 243, 0.5)',
                    borderRadius: '16px',
                    height: 32,
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
                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                    color: '#ff1744',
                    border: '1px solid rgba(244, 67, 54, 0.5)',
                    '& .MuiAlert-icon': {
                      color: '#ff1744'
                    }
                  }}
                >
                  Insufficient credits. You need {modelCost - localCredits} more credits to proceed.
                </Alert>
              )}
              {/* Add this as an additional element in the credits box */}
              <Box sx={{ mt: 1, mb: localCredits < modelCost ? 0 : 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Credits Available
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {localCredits}/{modelCost} Required
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 6,
                    borderRadius: 3,
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
                      bgcolor: localCredits < modelCost ? '#ff1744' : '#4caf50',
                      borderRadius: 3,
                      transition: 'width 0.5s ease-in-out',
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ ...glassmorphismStyle, p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#fff', display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faBolt} style={{ marginRight: '8px', color: blue[400] }} />
                Model Selection
              </Typography>

              <Grid container spacing={2} sx={{ mb: 1 }}>
                {models.map((model, index) => {
                  const isUnlocked = tokenStatus || rank >= model.levelToUnlock;
                  const isActive = currentModel === model.name;
                  return (
                    <Grid item xs={6} key={index}>
                      <Paper
                        elevation={isActive ? 8 : 0}
                        onClick={() => {
                          if (isUnlocked) {
                            setSelectedModel(model.name);
                          }
                        }}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          cursor: isUnlocked ? 'pointer' : 'not-allowed',
                          border: isActive ? '2px solid #f50057' : '1px solid rgba(255, 255, 255, 0.2)',
                          bgcolor: isActive ? 'rgba(245, 0, 87, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': isUnlocked ? {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                            bgcolor: isActive ? 'rgba(245, 0, 87, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                          } : {},
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {isActive && (
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            p: 0.5,
                            bgcolor: '#f50057',
                            borderBottomLeftRadius: '12px',
                          }}>
                            <FontAwesomeIcon icon={faCheck} style={{ fontSize: '10px', color: '#fff' }} />
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: isActive ? '#f50057' : 'rgba(255, 255, 255, 0.2)',
                              mr: 1,
                              fontSize: '0.75rem',
                            }}
                          >
                            <AutoAwesomeIcon sx={{ fontSize: '0.8rem', color: 'white' }} /> 
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }}>
                            {model.name === 'o3-mini' ? 'O3 Mini' : 'O3'}
                          </Typography>
                          {!isUnlocked && (
                            <Chip
                              icon={<LockIcon sx={{ fontSize: '12px !important' }} />}
                              label={`Level ${model.levelToUnlock}+`}
                              size="small"
                              sx={{
                                ml: 'auto',
                                height: 20,
                                '& .MuiChip-label': { px: 0.5, fontSize: '0.625rem' },
                                bgcolor: 'rgba(255, 193, 7, 0.2)',
                                color: yellow[700],
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Chip
                            label={`${model.cost} Credits`}
                            size="small"
                            sx={{
                              height: 20,
                              '& .MuiChip-label': { px: 1, fontSize: '0.675rem' },
                              bgcolor: 'rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                            }}
                            icon={<FontAwesomeIcon icon={faCoins} style={{ color: yellow[700], fontSize: '10px' }} />}
                          />

                          {isActive && (
                            <Chip
                              label="Active"
                              size="small"
                              sx={{
                                height: 20,
                                '& .MuiChip-label': { px: 1, fontSize: '0.675rem' },
                                bgcolor: 'rgba(245, 0, 87, 0.2)',
                                color: '#f50057',
                              }}
                            />
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>

              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                Higher models provide better quality and more complex game implementations
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff' }}>
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
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: '#fff',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.5)',
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
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: '#fff',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.5)',
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
                      gameLoading ? null : saving ? <CircularProgress color="error" size={20} /> : <SaveIcon />
                    }
                    sx={{
                      bgcolor: 'linear-gradient(45deg, #4caf50, #388e3c)',
                      color: '#fff',
                      '&:hover': {
                        bgcolor: 'linear-gradient(45deg, #66bb6a, #4caf50)',
                        transform: 'scale(1.05)',
                      },
                      '&:disabled': {
                        bgcolor: grey[700],
                        color: grey[400],
                      },
                    }}
                  >
                    {gameLoading ? <CircularProgress color="error" size={20} /> : 'Save & Close'}
                  </Button>
                )}
              </Box>
            </Box>

            {isLoadingSuggestions ? (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, ...glassmorphismStyle, p: 2, borderRadius: 2 }}>
                <CircularProgress size={20} sx={{ mr: 1, color: '#ff4081' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#fff' }}>
                  Generating Suggested Prompts...
                </Typography>
              </Box>
            ) : suggestedPrompts.length > 0 ? (
              <Box sx={{ mb: 2, ...glassmorphismStyle, p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#fff' }}>
                  Suggested Prompts
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {suggestedPrompts.map((prompt, index) => (
                    <Chip
                      key={index}
                      label={prompt}
                      onClick={() => handleFollowUpPrompt(prompt)}
                      color={prompt.startsWith('[User Feedback]') ? 'error' : 'warning'}
                      sx={{
                        bgcolor: prompt.startsWith('[User Feedback]') ? 'rgba(244, 67, 54, 0.2)' : 'rgba(255, 193, 7, 0.2)',
                        color: '#fff',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: prompt.startsWith('[User Feedback]') ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255, 193, 7, 0.3)',
                          cursor: 'pointer',
                        },
                      }}
                      disabled={saving || gameLoading}
                    />
                  ))}
                </Box>
              </Box>
            ) : null}

            {showChat && (
              <Box
                sx={{
                  ...glassmorphismStyle,
                  borderRadius: 2,
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
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    p: 1.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem', mr: 1 }}>
                      AI
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ color: '#fff' }}>
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
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
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
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.775rem', mr: 1 }}>
                              AI
                            </Avatar>
                          )}
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {formatTime(message.timestamp)}
                          </Typography>
                          {message.type === 'user' && (
                            <Avatar sx={{ width: 24, height: 24, bgcolor: blue[500], fontSize: '0.775rem', ml: 1 }}>
                              U
                            </Avatar>
                          )}
                        </Box>
                        <Paper
                          sx={{
                            p: 1.5,
                            bgcolor: message.type === 'user' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            border: 'none',
                            color: '#fff',
                            ...glassmorphismStyle,
                          }}
                        >
                          <Typography variant="body2">{message.content}</Typography>
                        </Paper>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                      No messages yet. Start by sending a prompt!
                    </Typography>
                  )}
                  {processingMessage && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', maxWidth: '80%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.775rem', mr: 1 }}>
                          AI
                        </Avatar>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {formatTime(new Date())}
                        </Typography>
                      </Box>
                      <Paper
                        sx={{
                          p: 1.5,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: 2,
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#fff',
                          ...glassmorphismStyle,
                        }}
                      >
                        <CircularProgress color='error' size={16} sx={{ mr: 1 }} />
                        <Typography variant="body2">{processingMessage.content}</Typography>
                      </Paper>
                    </Box>
                  )}
                  <div ref={chatEndRef} />
                </Box>
              </Box>
            )}

            <Box sx={{ ...glassmorphismStyle, p: isMobile ? 2 : 3, borderRadius: 2 }}>
              <TextField
                multiline
                rows={isMobile ? 3 : 4}
                variant="outlined"
                fullWidth
                color='error'
                label={chatMessages.length > 0 ? 'Continue the conversation' : 'Custom Game Prompt'}
                value={localPrompt}
                onChange={(e) => {
                  console.log('[TextField] New prompt value:', e.target.value);
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
                    borderRadius: 2,
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
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    '&:hover': {
                      bgcolor: 'linear-gradient(45deg, #f50057, #ff4081)',
                      transform: 'scale(1.05)',
                      transition: 'all 0.3s ease',
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
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#fff' }}>
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
                  ...glassmorphismStyle,
                  borderRadius: 2,
                }}
              >
                <CircularProgress color='error' size={60} sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#fff' }}>
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
                  ...glassmorphismStyle,
                  borderRadius: 2,
                  p: 3,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: '#ff1744' }}>
                  Error
                </Typography>
                <Typography sx={{ color: '#fff' }}>{componentError}</Typography>
              </Box>
            ) : GameComponent ? (
              <Box
                sx={{
                  width: '100%',
                  height: isMobile ? 300 : 600,
                  borderRadius: 2,
                  overflow: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  ...glassmorphismStyle,
                  position: 'relative',
                }}
              >
                {(() => {
                  try {
                    return <GameComponent proxiedAssets={initialProxiedAssets} logEvent={logEvent} Physics={Physics} />;
                  } catch (error) {
                    setComponentError(`Runtime error: ${error.message}`);
                    return (
                      <Typography sx={{ color: '#ff1744', p: 2 }}>
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
                  ...glassmorphismStyle,
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  No game generated yet. Enter a prompt and click Generate.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default SettingsRef;