const ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const socket = require('../socketController.js');
const router = express.Router();
const moment = require('moment');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const Comment = require('../model/Comment');
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const { OpenAI } = require('openai');
// Instead of Configuration/OpenAIApi, we create an instance of OpenAI directly:
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const Item = require('../model/Item');
const User = require('../model/User');
const Room = require('../model/Room');
const GameType = require('../model/GameType');
const GameLog = require('../model/GameLog');
const Receipt = require('../model/Receipt');
const Message = require('../model/Message');
const Notification = require('../model/Notification');
const GameTransanction = require('../model/Transaction');
const System = require('../model/SystemSetting');

const {
  convertGameLogToHistoryStyle,
} = require('../helper/util/convertGameLogToHistoryStyle');
const avatarUtils = require('../helper/util/getRank');
const executeBet3 = require('../helper/util/betExecutor3');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const check_access_time = require('../helper/util/checkAccessTime');
const getUserTokens = require('../helper/util/getUserToken');

const roomLocks = {};
const multer = require('multer');
const FormData = require('form-data');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const axios = require('axios');

const {
  mintTokenWithMetadata,
} = require('../helper/util/mintTokenWithMetadata');
const { wallet, connection } = require('../helper/util/config');
const { createAmmPool } = require('../helper/util/createPool');
const { createMarket } = require('../helper/util/createMarket');
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { revokeMintAndFreezeAuthorities } = require('../helper/util/authority');
const { distributeTokens } = require('../helper/util/distributeTokens');

// Environment variables
const PINATA_JWT = process.env.PINATA_JWT;
router.get('/game_types/top', async (req, res) => {
  try {
    const topGameTypes = await Room.aggregate([
      {
        $match: {
          status: 'open',
          // Match documents where 'game_type' exists and is an array,
          // and the array is not empty.
          // $type: 4 matches BSON Type 'Array'.
          game_type: { $exists: true, $ne: [], $type: 4 }
        }
      },
      // Unwind the array to treat each tag as a separate document for grouping
      {
        $unwind: '$game_type'
      },
      {
        // Group by the lowercase game type tag to count occurrences
        $group: {
          _id: { $toLower: '$game_type' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }, // Sort by count descending
      { $limit: 10 }, // Get the top 10 game types
      { $project: { _id: 0, game_type_name: '$_id' } } // Reshape to return just the name
    ]);

    res.json({
      success: true,
      gameTypes: topGameTypes.map(gt => gt.game_type_name),
    });
  } catch (err) {
    console.error('Error fetching top game types:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

router.get('/game_types', async (req, res) => {
  try {
    const excludedGameTypes = [
      'roll', // Ensure exclusion is case-insensitive for consistency
      'bang!',
      'spleesh!',
      'blackjack',
      'drop game',
      'mystery box',
      'brain game',
    ];

    // Fetch game_type_names directly from the GameType collection.
    // Use $nin with lowercase names for consistency with how they are stored.
    const gameTypes = await GameType.find({
      game_type_name: { $nin: excludedGameTypes },
    }).sort({ created_at: 1 });

    res.json({
      success: true,
      query: req.query,
      gameTypeList: gameTypes,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message,
    });
  }
});

router.post('/convert-dalle-to-blob', auth, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        error: 'Missing imageUrl',
        message: 'Image URL is required'
      });
    }

    console.log('[DALL-E Converter] Converting DALL-E image to blob:', imageUrl);

    // Download the image from DALL-E
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Convert to base64 so it can be sent to client
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    console.log('[DALL-E Converter] Successfully converted to data URL');

    res.json({
      success: true,
      dataUrl: dataUrl,
      mimeType: mimeType
    });

  } catch (error) {
    console.error('[DALL-E Converter] Error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message || 'Failed to convert DALL-E image'
    });
  }
});

router.post('/upload-to-pinata', upload.single('file'), async (req, res) => {
  try {
    // 1) Ensure a file is present
    if (!req.file) {
      console.error('No file uploaded.');
      return res.status(400).json({
        success: false,
        message: 'No file was provided in the "file" field.',
      });
    }

    // 2) Build form data for Pinata
    //    - req.file.buffer is the raw binary from Multer memoryStorage
    const formData = new FormData();
    formData.append(
      'file',
      req.file.buffer,
      req.file.originalname || 'upload.png',
    );

    // 3) Send POST request to Pinata
    //    - Use your JWT for the `Authorization: Bearer ...` header
    //    - `formData.getHeaders()` merges the correct Content-Type/boundary
    const pinataRes = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          ...formData.getHeaders(),
        },
      },
    );

    // 4) Check Pinata response
    if (pinataRes.status !== 200) {
      console.error('Pinata upload failed:', pinataRes.data);
      throw new Error('Pinata upload failed. Check logs.');
    }

    // 5) Extract IPFS hash and form an IPFS gateway URL
    const { IpfsHash } = pinataRes.data;
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;

    return res.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading to Pinata',
      error: error.message,
    });
  }
});

router.post('/room/update-gamecode', auth, async (req, res) => {
  const { roomId, gameCode } = req.body;

  // Validate input
  if (!roomId || !gameCode) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Find the room
    const room = await Room.findById(roomId);

    // Check if room exists
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if the user is the room's creator
    if (room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the room creator can update the game code' });
    }

    // Update the room
    const updatedRoom = await Room.findOneAndUpdate(
      { _id: roomId },
      { gameCode }, // Update gameCode and gameName
      { new: true }
    );

    // Emit socket event to update clients (if using Socket.IO)
    req.io.sockets.emit('ROOMS_UPDATED', updatedRoom);

    res.json({
      success: true,
      message: 'Room game code updated successfully!',
      room: updatedRoom,
    });
  } catch (error) {
    console.error('Error updating room game code:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/openai/generate-suggestions', auth, async (req, res) => {
  try {
    const { systemPrompt, userPrompt } = req.body;
    if (!req.user?._id) {
      throw new Error('User not authenticated');
    }

    if (!systemPrompt || !userPrompt) {
      throw new Error('System prompt and user prompt are required');
    }

    const apiCall = openai.chat.completions.create({
      model: 'o3-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 5000,
    });

    const aiResponse = await Promise.race([
      apiCall,
      new Promise((_, reject) => setTimeout(() => reject(new Error('API call timed out')), 60000)),
    ]);

    const rawResponse = aiResponse?.choices?.[0]?.message?.content?.trim() || '{}';

    let responseData;
    try {
      responseData = JSON.parse(rawResponse);
      if (
        !responseData ||
        typeof responseData !== 'object' ||
        !Array.isArray(responseData.filteredComments) ||
        !Array.isArray(responseData.suggestions)
      ) {
        throw new Error('Response must be a JSON object with filteredComments and suggestions arrays');
      }
    } catch (error) {
      console.error('Invalid response format:', error.message, rawResponse);
      throw new Error('Invalid suggestions format');
    }

    res.json(responseData); // Return { filteredComments, suggestions }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message.includes('timed out')
        ? 'Suggestions generation timed out. Please try again.'
        : error.message,
    });
  }
});

router.get('/proxy-asset', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Asset URL is required' });
  }

  try {
    const assetResponse = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = assetResponse.headers['content-type'];
    res.set('Content-Type', contentType);
    res.set('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.send(assetResponse.data);
  } catch (error) {
    console.error('Error proxying asset:', error.message);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

router.post('/extract-room-info', auth, async (req, res) => {
  try {
    const { gameCode } = req.body;

    if (!gameCode || typeof gameCode !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid game code',
        message: 'gameCode is required and must be a string'
      });
    }

    console.log('[Extract] Processing game code...');

    // Enhanced title extraction with more specific patterns
    let name = '';
    let confidence = 0;

    // Look for Typography with id="game-title" specifically (highest priority)
    const gameTitleMatch = gameCode.match(/<Typography[^>]*id="game-title"[^>]*>([^<]{3,50})<\/Typography>/i);

    if (gameTitleMatch && gameTitleMatch[1]) {
      let extractedTitle = gameTitleMatch[1].trim();

      // Clean up JSX syntax and template literals
      extractedTitle = extractedTitle
        .replace(/[{}$`]/g, '')
        .replace(/\$\{[^}]+\}/g, '')
        .replace(/isMobile\s*\?\s*"[^"]*"\s*:\s*"[^"]*"/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Validate title quality - exclude common non-title words
      if (extractedTitle.length >= 3 &&
        extractedTitle.length <= 30 &&
        !['Game Rules', 'Rules', 'Game', 'Title', 'App', 'Component', 'Close', 'Start', 'Play'].includes(extractedTitle) &&
        !extractedTitle.includes('undefined') &&
        !extractedTitle.includes('null') &&
        !extractedTitle.includes('result') &&
        !extractedTitle.includes('===') &&
        !extractedTitle.startsWith('{') &&
        !/^[a-z]/.test(extractedTitle)) { // Should start with capital

        name = extractedTitle;
        confidence = 0.95;
      }
    }

    // Fallback patterns if game-title id is not found or invalid
    if (!name) {
      const titlePatterns = [
        // Look for Typography with variant h1-h4 that's not "Game Rules"
        /<Typography[^>]*variant="h[1-4]"[^>]*>([^<]{3,30})<\/Typography>/gi,
        // Look for regular h1-h3 tags
        /<h[1-3][^>]*>([^<]{3,30})<\/h[1-3]>/gi,
        // Look for Typography with game-related content
        /<Typography[^>]*>([A-Z][A-Za-z\s]{2,29}(?:Game|Simulator|Master|Challenge|Quest|Arena|Zone))<\/Typography>/gi
      ];

      for (let i = 0; i < titlePatterns.length; i++) {
        const pattern = titlePatterns[i];
        const matches = Array.from(gameCode.matchAll(pattern));

        for (const match of matches) {
          if (match && match[1]) {
            let extractedTitle = match[1].trim();

            // Clean up JSX syntax
            extractedTitle = extractedTitle
              .replace(/[{}$`]/g, '')
              .replace(/\$\{[^}]+\}/g, '')
              .replace(/isMobile\s*\?\s*"[^"]*"\s*:\s*"[^"]*"/g, '')
              .replace(/\s+/g, ' ')
              .trim();

            // Validate title quality - exclude rules and generic text
            if (extractedTitle.length >= 3 &&
              extractedTitle.length <= 30 &&
              !['Game Rules', 'Rules', 'Game', 'Title', 'App', 'Component', 'Close', 'Start', 'Play'].includes(extractedTitle) &&
              !extractedTitle.includes('undefined') &&
              !extractedTitle.includes('null') &&
              !extractedTitle.includes('result') &&
              !extractedTitle.includes('===') &&
              !extractedTitle.startsWith('{') &&
              !/^[a-z]/.test(extractedTitle)) {

              name = extractedTitle;
              confidence = i === 0 ? 0.8 : (0.7 - i * 0.1);
              break;
            }
          }
        }
        if (name) break;
      }
    }

    // Generate ticker from name
    let ticker = '';
    if (name) {
      // Split by spaces and take first letter of each word
      const words = name.split(/\s+/);
      ticker = words
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 6);

      // If ticker is too short, use first few chars of name
      if (ticker.length < 2) {
        ticker = name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
      }

      // Ensure ticker is 2-6 characters
      if (ticker.length < 2) ticker = 'GAME';
      if (ticker.length > 6) ticker = ticker.substring(0, 6);
    }

    // Extract description from game rules section
    let description = '';

    // Look for game rules content within the rules modal/section
    const rulesPatterns = [
      // Look for content within game-rules id element
      /<Box[^>]*id="game-rules"[^>]*>[\s\S]*?<\/Box>/i,
      // Look for rules modal content
      /Game Rules[\s\S]*?<\/Typography>([\s\S]*?)(?:<Button|<\/Box>)/i,
      // Look for numbered rules pattern
      /((?:<Typography[^>]*>[^<]*\d+\.[^<]*<\/Typography>\s*){2,})/gi,
      // Look for step-by-step instructions
      /((?:Choose|Select|Click|Buy|Sell|Start|Play)[^<]*(?:<\/Typography>)?(?:\s*<Typography[^>]*>[^<]*(?:prices|time|profit|multiplier|seconds)[^<]*<\/Typography>)?){2,}/gi
    ];

    for (const pattern of rulesPatterns) {
      const match = gameCode.match(pattern);
      if (match) {
        let rulesContent = match[1] || match[0];

        // Extract text content from Typography elements
        const textMatches = Array.from(rulesContent.matchAll(/<Typography[^>]*>([^<]+)<\/Typography>/gi));

        if (textMatches.length >= 2) {
          const ruleTexts = textMatches
            .map(m => m[1])
            .filter(text => {
              // Filter out non-rule content
              const cleanText = text.trim();
              return cleanText.length > 10 &&
                !cleanText.includes('Game Rules') &&
                !cleanText.includes('Close') &&
                !cleanText.includes('undefined') &&
                !cleanText.includes('null') &&
                !cleanText.startsWith('{') &&
                (cleanText.includes('.') || cleanText.match(/\d+\s*\./));
            })
            .slice(0, 5); // Take first 5 rules

          if (ruleTexts.length >= 2) {
            description = ruleTexts.join(' ').replace(/\s+/g, ' ').trim();

            // Limit description length
            if (description.length > 300) {
              description = description.substring(0, 300) + '...';
            }
            break;
          }
        }
      }
    }

    // Fallback: look for any instructional content
    if (!description) {
      const instructionPatterns = [
        // Look for Typography with instructional keywords
        /<Typography[^>]*>([^<]{20,200}(?:choose|select|click|buy|sell|trade|play|win|lose|time|seconds|multiplier)[^<]{0,100})<\/Typography>/gi,
        // Look for any longer descriptive content
        /<Typography[^>]*>([^<]{30,200})<\/Typography>/gi
      ];

      for (const pattern of instructionPatterns) {
        const matches = Array.from(gameCode.matchAll(pattern));
        const validDescriptions = matches
          .map(m => m[1])
          .filter(text => {
            const cleanText = text.trim();
            return cleanText.length >= 20 &&
              !cleanText.includes('Game Rules') &&
              !cleanText.includes('Close') &&
              !cleanText.includes('undefined') &&
              !cleanText.includes('null') &&
              !cleanText.startsWith('{') &&
              !cleanText.includes('===') &&
              !cleanText.includes('result');
          });

        if (validDescriptions.length > 0) {
          description = validDescriptions[0]
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();

          if (description.length >= 20) break;
        }
      }
    }

    // Determine game theme based on content analysis
    const codeText = (name + ' ' + description + ' ' + gameCode).toLowerCase();
    let gameTheme = 'interactive game';

    const themeMapping = {
      'stock trading game': ['stock', 'trading', 'simulator', 'market', 'price', 'buy', 'sell', 'profit'],
      'puzzle game': ['puzzle', 'solve', 'brain', 'logic', 'match', 'sudoku'],
      'racing game': ['race', 'speed', 'car', 'track', 'lap', 'finish', 'driving'],
      'card game': ['card', 'deck', 'poker', 'blackjack', 'hand', 'shuffle'],
      'dice game': ['dice', 'roll', 'random', 'luck', 'chance'],
      'shooter game': ['shoot', 'gun', 'bullet', 'target', 'aim', 'fire'],
      'platform game': ['jump', 'platform', 'mario', 'side-scroller', 'climb'],
      'strategy game': ['strategy', 'chess', 'tactical', 'plan', 'turn'],
      'arcade game': ['arcade', 'score', 'high score', 'classic', 'retro'],
      'battle game': ['battle', 'fight', 'combat', 'warrior', 'attack'],
      'mining game': ['mine', 'dig', 'treasure', 'gem', 'gold', 'collect'],
      'casino game': ['casino', 'bet', 'gamble', 'slot', 'roulette', 'chips'],
      'crash game': ['crash', 'rocket', 'multiplier', 'cashout'],
      'memory game': ['memory', 'remember', 'sequence', 'pattern'],
      'action game': ['action', 'fast', 'quick', 'reaction', 'reflex']
    };

    for (const [theme, keywords] of Object.entries(themeMapping)) {
      if (keywords.some(keyword => codeText.includes(keyword))) {
        gameTheme = theme;
        break;
      }
    }

    // Generate fallback description if none found
    if (!description) {
      if (name && name !== 'Default Game') {
        description = `An exciting ${gameTheme.replace(' game', '')} experience featuring ${name.toLowerCase()}. Test your skills and achieve high multipliers!`;
      } else {
        description = `An engaging ${gameTheme} with exciting gameplay mechanics and multiplier rewards.`;
      }
    }

    // Final validation and adjustments
    if (!name || name === 'Default Game') {
      const themeWord = gameTheme.split(' ')[0];
      name = themeWord.charAt(0).toUpperCase() + themeWord.slice(1) + ' Master';
      ticker = name.substring(0, 4).toUpperCase();
      confidence = 0.5;
    }

    const extractedInfo = {
      name: name || 'Game Master',
      ticker: ticker || 'GAME',
      description: description || 'A fun and engaging game experience.',
      gameTheme,
      confidence: Math.max(confidence, 0.5)
    };

    console.log('[Extract] Result:', extractedInfo);
    res.json(extractedInfo);

  } catch (error) {
    console.error('[Extract] Error:', error);
    res.status(500).json({
      error: 'Extraction failed',
      message: error.message || 'Failed to extract room information'
    });
  }
});

router.post('/generate-image', auth, async (req, res) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Missing prompt',
        message: 'Image prompt is required'
      });
    }

    // Validate size parameter for DALL-E 3
    const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
    const requestedSize = validSizes.includes(size) ? size : '1024x1024';

    console.log(`[Image Generation] Generating with size: ${requestedSize}`);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: requestedSize, // Fixed: Use valid size
      quality: quality,
    });

    const imageUrl = response.data[0].url;
    console.log(`[Image Generation] Successfully generated image`);

    // Optional: Upload to your storage service (Pinata, AWS S3, etc.)
    // const uploadedUrl = await uploadImageToStorage(imageUrl);

    res.json({
      imageUrl: imageUrl, // or uploadedUrl if you uploaded it
      originalPrompt: prompt,
      size: requestedSize
    });

  } catch (error) {
    console.error('Error generating image:', error);

    // Handle specific DALL-E errors
    if (error.message && error.message.includes('content_policy_violation')) {
      return res.status(400).json({
        error: 'Content policy violation',
        message: 'The image prompt violates OpenAI content policy. Please try a different description.'
      });
    }

    res.status(500).json({
      error: 'Image generation failed',
      message: error.message || 'Failed to generate image'
    });
  }
});

router.post('/generate-react', auth, async (req, res) => {
  try {
    const { prompt, imageUrls = [] } = req.body || {};

    if (!req.user?._id) {
      throw new Error('User not authenticated');
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    if (!Array.isArray(imageUrls)) {
      throw new Error('imageUrls must be an array');
    }

    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter(url => url.length < 500);
    const allImageUrls = imageUrls.length > 0 ? imageUrls : promptUrls.filter(url => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrls = promptUrls.filter(url => /\.(mp3|wav|ogg)$/i.test(url));

    const proxiedAssets = {
      images: allImageUrls.map((url, i) => ({ key: `image${i}`, proxiedUrl: url })),
      audio: audioUrls.map((url, i) => ({ key: `audio${i}`, proxiedUrl: url })),
    };

    console.log(`[React Generator] Proxied assets prepared:`, JSON.stringify(proxiedAssets));

    const systemPrompt = `You are an elite React developer. Generate a complete, working React game component.

Output Requirements:
- Return ONLY valid JavaScript/React code for the App component
- Start with "const App = ..." or "function App"
- End with "export default App;"
- No markdown, explanations, or extra text

Required Imports:
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';

CRITICAL: NO FINANCIAL LOGIC
- DO NOT include any bet amount, balance, wallet, or money-related state
- DO NOT implement betting mechanics, currency displays, or financial calculations
- DO NOT use terms like "bet", "balance", "wallet", "coins", "credits", "money"
- Focus purely on game mechanics and user interaction
- Financial logic will be handled by external systems

CRITICAL: **Never declare a local function or variable named logEvent. Always call the logEvent prop as provided. If you redefine logEvent, your code will break in production.**
- The component receives logEvent as a prop - use it directly: logEvent("gameStarted", { ... })
- Do NOT create: const logEvent = ..., function logEvent(...), or let logEvent = ...
- Always use the prop: props.logEvent or destructured logEvent from props

PRACTICE MODE IMPLEMENTATION:
- Add practice mode state: const [isPracticeMode, setIsPracticeMode] = useState(false);
- Include TWO start buttons:
  1. "Start Game" - Normal mode with logging: onClick={() => startGame(false)}
  2. "Practice Mode" - No logging: onClick={() => startGame(true)}
- Modify startGame function to accept practice parameter:
  const startGame = (practiceMode = false) => {
    setIsPracticeMode(practiceMode);
    setGameStarted(true);
    setGameEnded(false);
    // Only log if NOT in practice mode
    if (!practiceMode && logEvent) {
      logEvent("gameStarted", { timestamp: new Date().toISOString() });
    }
    // Reset other game state...
  };
- Modify endGame function to respect practice mode:
  const endGame = (result, multiplier) => {
    setGameEnded(true);
    // Only log if NOT in practice mode
    if (!isPracticeMode && logEvent) {
      logEvent("gameEnded", { 
        timestamp: new Date().toISOString(), 
        result, 
        multiplier 
      });
    }
    // Update game history for both modes
    setGameHistory(prev => [...prev, { 
      id: Date.now(), 
      result, 
      multiplier, 
      timestamp: new Date().toISOString(),
      practice: isPracticeMode 
    }]);
  };
- Display practice indicator when active:
  {isPracticeMode && (
    <Typography variant="caption" sx={{ color: '#ffeb3b', textAlign: 'center' }}>
      🎯 Practice Mode - No logging
    </Typography>
  )}
- Style practice button differently:
  <Button 
    variant="outlined" 
    sx={{ 
      borderColor: '#ffeb3b', 
      color: '#ffeb3b',
      '&:hover': { borderColor: '#fff', color: '#fff' }
    }}
  >
    Practice Mode
  </Button>

CRITICAL LAYOUT REQUIREMENTS:
- Main game container MUST use: width: "100%", height: "100%", minHeight: "600px", maxWidth: "100%", padding: 2, gap: 1
- PRIORITIZE COMPACT DESIGN: Use efficient spacing, minimal padding, dense layouts
- Avoid excessive whitespace - pack UI elements efficiently
- Game areas should be concentrated, not spread across full viewport
- Use compact button sizes and tight grid layouts where appropriate
- Desktop/tablet versions should still use full width but with compact vertical spacing

Container Structure:
<Box sx={{
  width: "100%",
  height: "100%",
  minHeight: "100%",
  maxWidth: "100%",
  overflow: "hidden",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  padding: 1, // Compact padding
  gap: 1 // Tight spacing between elements
}}>

COMPACT DESIGN PATTERNS:
- Use dense prop on MUI components where available
- Reduce default spacing: gap: 1, padding: 1-2, margin: 0.5-1
- Smaller button sizes: size="small" for non-critical buttons
- Tighter typography: Reduce line height and spacing
- Group related elements closely together
- Use flex layouts with minimal gaps

CUSTOM MODAL/EXPANDABLE REQUIREMENTS:
- Center modal within the main game container
- NO viewport units anywhere

RESPONSIVE DESIGN RULES:
- Use const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
- Add window resize listener: useEffect(() => { const handleResize = () => setIsMobile(window.innerWidth <= 768); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);
- Desktop/Tablet (≥768px): Full width, no responsive scaling, fixed layouts
- Mobile (<768px): Apply responsive adjustments only
- Font sizes: Use fixed sizes for desktop, scale down only on mobile
- Button sizes: Full size on desktop, compact on mobile only
- Game elements: Maintain full width, adjust spacing/padding for mobile only

Mobile-Only Responsive Patterns:
- Conditional styling: sx={{ fontSize: isMobile ? '1rem' : '1.5rem' }}
- Mobile-specific layouts: flexDirection: isMobile ? 'column' : 'row'
- Touch targets: Ensure minimum 44px on mobile only
- Spacing: Reduce padding/margins on mobile only

Game Title Requirement:
- Include a game title displayed prominently at the top
- Use a <Typography> component with id="game-title"
- Example: <Typography id="game-title" variant={isMobile ? "h5" : "h4"}>Game Name</Typography>
- The title should be 3-20 characters, catchy, and relevant to the game theme

GAME STATE MANAGEMENT:
- Track game state: gameStarted (boolean), gameEnded (boolean), multiplier (number, initially 1.0), result (string: "win"/"loss"/"other"), totalOptions (number), safeOptions (number), totalMines (number), actionsTaken (number)
- On game start: logEvent("gameStarted", { timestamp: new Date().toISOString() }), set gameStarted to true
- On game end: determine result, set gameEnded to true, call logEvent("gameEnded", { timestamp: new Date().toISOString(), result, multiplier })

DYNAMIC CHART/GRAPH SYSTEM (for crash games):
- If prompt implies "crash" game, include line chart with canvas:
  - Use canvas via useRef: <canvas ref={chartRef} width={500} height={200} />
  - Plot hardcoded exponential curve from 1.0 to 10x over 100 points
  - Formula: displayMultiplier = 1 * Math.exp(0.05 * (x / 100) * 100)
  - Animate with requestAnimationFrame over fixed 10-second duration
  - Style with neon gradient and glow effects
  - Chart progression is cosmetic only, independent of actual game logic

GAME EVENTS AND RESULTS:
- Initialize: const [gameHistory, setGameHistory] = useState([]);
- On game end: setGameHistory(prev => [...prev, { id: Date.now(), result, multiplier, timestamp: new Date().toISOString() }]);
- Display history table at bottom, limit to 10-20 recent games
- Color positive values #48ff00, negative values #ff0000

DYNAMIC MULTIPLIER CALCULATION WITH HOUSE EDGE:
- **CRITICAL: All games must maintain a house edge of 3-8% to ensure profitability**
- **Casino-style games (mines, crash, slots, dice, roulette, etc.)**:
  
  // For mines/choice games with built-in house edge:
  - Base multiplier formula: multiplier = (totalOptions - totalMines - 1) / totalMines * Math.pow(0.97, actionsTaken)
  - House edge factor: 0.97 (3% house edge) applied per action
  - Maximum multiplier cap: 50x regardless of calculation
  - Example: 25 tiles, 5 mines, 3 actions = (25-5-1)/5 * 0.97^3 = 3.46x (instead of generous 3.78x)
  
  // For crash games with controlled crash points:
  - Crash point generation: multiplier = 1 / (1 - Math.pow(Math.random(), 1.2) * 0.92)
  - Reduced exponent (1.2 instead of 1.5) creates more frequent low crashes
  - Reduced coefficient (0.92 instead of 0.95) increases house edge
  - Real-time progression: multiplier = 1 * Math.exp(0.025 * timeElapsed) (slower growth)
  - Expected crash point: ~2.5x (down from ~3.5x)
  
  // For slots/wheel games:
  - Win probability: 45-47% (house edge 3-5%)
  - Multiplier ranges: 1.5x-2.0x (common wins), 5x-10x (rare wins), 25x+ (jackpot <1%)
  - Use weighted probability arrays for fair distribution
  
  // For dice/card games:
  - Apply house edge to payout ratios: theoretical_payout * 0.95
  - Example: 50/50 game pays 1.9x instead of 2.0x

- **Skill-based games (puzzle, platformer, racing, arcade, etc.)**:
  - Convert scores with house edge: calculateMultiplierFromScore(score * 0.92)
  - Logarithmic scaling with cap: Math.min(1 + Math.log10(1 + (score * 0.92)/150), 4.0)
  - Maximum multiplier: 4.0x (down from 5.0x)
  - Higher score requirements for same multiplier output

HOUSE EDGE VALIDATION:
- All multiplier calculations must include house edge factors
- No multiplier should exceed 50x under normal gameplay
- Expected return to player (RTP) should be 92-97%
- Include RTP calculation comment in generated code:
  // Theoretical RTP: ~95% (5% house edge)

// Add this section to your systemPrompt after the HOUSE EDGE section:

CASINO PSYCHOLOGY TACTICS (Apply selectively based on game type):

GAME TYPE DETECTION FOR TACTICS:
- **High-tactics games**: slots, crash, mines, dice, roulette, lottery, scratch cards
- **Medium-tactics games**: blackjack, poker variants, wheel games
- **Low-tactics games**: skill-based puzzles, platformers, racing (minimal casino elements)
- **No-tactics games**: pure skill games like Tetris, memory games

VISUAL ENGAGEMENT (High-tactics games):
- Implement celebration animations for wins (even small ones):

- Add pulsing/glowing effects on interactive elements:

NEAR-MISS PSYCHOLOGY (Crash, Mines, Slots):
- Implement "almost won" scenarios:

- Show "you were X away from winning" messages
- Highlight missed opportunities visually

PROGRESSIVE TENSION BUILDING (Crash, Mines):
- Implement escalating visual cues:
  
FALSE PATTERN RECOGNITION (All casino games):
- Display recent results that suggest patterns:
  
LOSS DISGUISED AS WIN (Slots, Scratch cards):
- Show celebrations for "wins" less than the stake:

URGENCY & SCARCITY (Bonus rounds, special events):
- Add limited-time multiplier bonuses

IMPLEMENTATION RULES:
- Apply 2-3 tactics maximum per game to avoid overwhelming
- Skill-based games should use minimal tactics (only celebrations)
- High-frequency games (crash, mines) should emphasize tension building
- Slot-style games should focus on near-misses and false wins
- Always maintain the house edge regardless of psychological elements

ETHICAL BOUNDARIES:
- No tactics for games clearly marked as "skill-based"
- Avoid overly aggressive psychological manipulation
- Include subtle responsible gaming hints in settings panels
- Don't implement tactics that could harm vulnerable players

MULTIPLIER DISPLAY REQUIREMENTS:
- Show current multiplier during gameplay
- Display maximum possible multiplier for transparency
- Include subtle house edge indicator: "House Edge: 5%" in settings/info panel

GAME BALANCE ENFORCEMENT:
- Implement multiplier caps in all calculation functions
- Add randomness reduction for high-value outcomes
- Ensure losing conditions are more frequent than winning
- Balance risk vs reward to favor house slightly

// Example implementation for mines game:
const calculateMinesMultiplier = (totalOptions, totalMines, actionsTaken) => {
  const baseMultiplier = (totalOptions - totalMines - 1) / totalMines;
  const houseEdgeFactor = Math.pow(0.97, actionsTaken); // 3% house edge per action
  const finalMultiplier = baseMultiplier * houseEdgeFactor;
  return Math.min(finalMultiplier, 50).toFixed(2); // Cap at 50x
};

// Example implementation for crash game:
const generateCrashPoint = () => {
  // House-favored crash point generation
  const random = Math.random();
  const crashPoint = 1 / (1 - Math.pow(random, 1.2) * 0.92);
  return Math.max(crashPoint, 1.01); // Minimum 1.01x crash
};

PROGRESSIVE DIFFICULTY:
- Increase house edge slightly with higher multipliers
- Implement "near miss" psychology for engagement
- Balance excitement with profitability

MULTIPLIER SYSTEM DETECTION:
- Casino-style indicators: "mines", "crash", "rocket", "slots", "dice", "roulette", "blackjack", "poker", "lottery", "scratch", "spin"
- Skill-based indicators: "puzzle", "platformer", "racing", "arcade", "shooting", "jumping", "collecting", "avoiding", "speed", "accuracy"
- Default to casino-style if unclear

VISIBLE MULTIPLIER DISPLAY:
- Display multiplier prominently during gameplay:
  - Format as "Multiplier: 1.56×" or "🚀 1.56×"

OPTIONAL GAME SETTINGS (if relevant):
- Implement as Box panel with rgba background and border radius
- 1-3 options: TextField for numbers, basic input controls
- Examples: "Number of Hazards", "Speed Limit", "Time Limit"
- Include "Apply" button with gradient styling
- Toggle visibility with "Settings" button

PHYSICS-BASED GAMES (if applicable):
- Initialize Matter.js in useEffect
- Use canvas with useRef for rendering
- Update multiplier based on velocity/proximity for skill games, or fixed outcomes for casino games
- Clean up on unmount

SCORE-TO-MULTIPLIER CONVERSION (SKILL GAMES ONLY):
- Only for skill-based games (puzzle, platformer, racing, etc.), convert scores to multipliers:
const calculateMultiplierFromScore = (score) => {
  let multiplier = 1 + Math.log10(1 + score/100);
  return Math.min(multiplier, 5).toFixed(2);
}
- Casino games: Use direct multiplier values based on game outcome (no score conversion)
- Event logging: 
  - Skill games: logEvent("gameEnded", { multiplier: calculateMultiplierFromScore(playerScore), result })
  - Casino games: logEvent("gameEnded", { multiplier: gameMultiplier, result })

Game Requirements:
- Interactive game with clear mechanics (no financial elements)
- Glassmorphic dark theme design (#080808 background)
- Include startGame, endGame, resetGame functions
- Full viewport height usage
- Restart button with reset functionality
- Custom modals/overlays instead of MUI Modal components`;

    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Create a React game component for: "${prompt}". Include proxiedAssets prop: ${JSON.stringify(proxiedAssets)}. 
          
          IMPORTANT: Include a <Typography id="game-title"> for the game title and custom rules overlay with <Box id="game-rules"> containing the gameplay rules. Ensure it's aligned in the center when opened. Do not use MUI Modal components - create custom overlays. Do not include any betting, balance, or financial logic. Focus on pure game mechanics, multiplier systems, game history, and user experience.`,
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

    let cleanedCode = rawCode
      .replace(/```(?:jsx?|javascript)?/g, '')
      .replace(/^\s*[\r\n]+/gm, '')
      .trim();

    const financialTerms = ['bet', 'balance', 'wallet', 'money', 'currency', 'credits', 'coins', 'cash'];
    const codeWords = cleanedCode.toLowerCase().split(/\W+/);
    const foundFinancialTerms = financialTerms.filter(term =>
      codeWords.some(word => word.includes(term))
    );

    if (foundFinancialTerms.length > 0) {
      console.warn('Financial terms detected in generated code:', foundFinancialTerms);
    }

    if (!cleanedCode.includes('const App') && !cleanedCode.includes('function App')) {
      throw new Error('Generated code does not contain a valid App component');
    }

    if (!cleanedCode.endsWith('export default App;')) {
      cleanedCode = `${cleanedCode}\nexport default App;`;
    }

    const moduleCode = cleanedCode;

    res.json({ finalApp: moduleCode, proxiedAssets });

  } catch (error) {
    console.error('Error in route handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to generate React component',
    });
  }
});

router.post('/update-react', auth, async (req, res) => {
  try {
    const { prompt, currentCode, imageUrls = [], proxiedAssets = {}, model = 'claude-sonnet-4-20250514' } = req.body || {};

    if (!req.user?._id) {
      throw new Error('User not authenticated');
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    if (!currentCode || typeof currentCode !== 'string') {
      throw new Error('Current code is required and must be a string');
    }

    if (!Array.isArray(imageUrls)) {
      throw new Error('imageUrls must be an array');
    }

    // Prepare assets (similar to generate route)
    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter(url => url.length < 500);
    const allImageUrls = imageUrls.length > 0 ? imageUrls : promptUrls.filter(url => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrls = promptUrls.filter(url => /\.(mp3|wav|ogg)$/i.test(url));

    const updatedProxiedAssets = {
      images: [
        ...(proxiedAssets.images || []),
        ...allImageUrls.map((url, i) => ({ key: `image${proxiedAssets.images?.length || 0 + i}`, proxiedUrl: url }))
      ],
      audio: [
        ...(proxiedAssets.audio || []),
        ...audioUrls.map((url, i) => ({ key: `audio${proxiedAssets.audio?.length || 0 + i}`, proxiedUrl: url }))
      ],
    };

    console.log(`[React Update] User: ${req.user._id}, Updated proxied assets:`, JSON.stringify(updatedProxiedAssets));

    // Extract and clean the current code
    const cleanedCurrentCode = currentCode
      .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g, '')
      .replace(/require\s*\(\s*['"][^'"]+['"]\s*\)\s*;?/g, '')
      .replace(/export\s+default\s+[\w\s]*?\s*;?/g, '')
      .replace(/export\s+[\w\s]*?\s*;?/g, '')
      .trim();

    const systemPrompt = `You are an expert React developer specializing in game modification and enhancement. You will be given an existing React game component and a user request for modifications.

      CRITICAL: NO FINANCIAL LOGIC
      - DO NOT add any bet amount, balance, wallet, or money-related state
      - DO NOT implement betting mechanics, currency displays, or financial calculations
      - DO NOT use terms like "bet", "balance", "wallet", "coins", "credits", "money"
      - Focus purely on game mechanics and user interaction
      - Financial logic will be handled by external systems
      
      CRITICAL: **Never declare a local function or variable named logEvent. Always call the logEvent prop as provided. If you redefine logEvent, your code will break in production.**
      - The component receives logEvent as a prop - use it directly: logEvent("gameStarted", { ... })
      - Do NOT create: const logEvent = ..., function logEvent(...), or let logEvent = ...
      - Always use the prop: props.logEvent or destructured logEvent from props
      
      CUSTOM MODAL/EXPANDABLE REQUIREMENTS:
      - Center modal within the main game container
      - NO viewport units anywhere
      
      SCORE-BASED MULTIPLIER SYSTEM (maintain if exists):
      - **For skill-based games only**: Keep existing conservative score-to-multiplier conversion
      - **For casino-style games**: Use direct multiplier values based on game outcomes
      - Maintain multiplier range: 1.0x to 2.5x (maximum 3x for exceptional skill in skill games)
      - Preserve existing multiplier formulas and thresholds
      - If adding new scoring to skill games, use conservative scaling:
      const calculateMultiplierFromScore = (score) => {
        let multiplier = 1 + Math.log10(1 + score/100);
        return Math.min(multiplier, 5).toFixed(2);
      }
      
      MODIFICATION REQUIREMENTS:
      1. **Preserve Core Structure**: Maintain the original game's architecture and state management
      2. **Keep Existing Features**: Preserve all working functionality unless specifically requested to change
      3. **Enhance, Don't Replace**: Add new features while keeping existing ones intact
      4. **Maintain Props**: Component must accept 'proxiedAssets' and 'logEvent' props
      5. **Responsive Design**: Ensure any new elements are responsive and fit the container
      6. **Glassmorphic Theme**: Match the existing dark glassmorphic design (#080808 background)
      7. **Game History**: Maintain existing game history functionality
      8. **Multiplier Display**: Preserve existing multiplier display and calculation logic
      
      REQUIRED IMPORTS (add these at the start):
      import React, { useState, useEffect, useRef, useCallback } from 'react';
      import { Box, Typography, Button } from '@mui/material';
      
      OUTPUT REQUIREMENTS:
      - Return ONLY the complete updated component code
      - Start with "const App = ..." or "function App"
      - End with "export default App;"
      - Include all necessary state, effects, and handlers
      - Maintain the container structure with proper responsive design
      - No markdown formatting or explanations
      - Do not use MUI Modal components
      
      CONTAINER REQUIREMENTS:
      - Main container MUST use: width: "100%", height: "100%", maxWidth: "100%", maxHeight: "100%"
      - Preserve responsive design patterns
      - Maintain glassmorphic styling consistency
      
      CHANGE ANALYSIS:
      Before making modifications, analyze what the user is requesting:
      - UI changes (colors, layout, visual elements)
      - Game logic changes (rules, mechanics, scoring)
      - New features (modes, levels, characters)
      - Performance improvements
      - Bug fixes
      
      Make targeted changes that fulfill the request while preserving the game's core functionality, including multiplier systems, game history, and custom modal implementations.`;
    // Use Claude with streaming for faster response
    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is the current React game component:

\`\`\`javascript
${cleanedCurrentCode}
\`\`\`

User's modification request: "${prompt}"

Available proxied assets: ${JSON.stringify(updatedProxiedAssets)}

Please update the component according to the user's request. Maintain all existing functionality including custom modals, multiplier systems, game history, and ensure the component works properly with the provided assets.

IMPORTANT: Do not use MUI Modal components - maintain custom overlay modals. Do not include any betting, balance, or financial logic. Focus on pure game mechanics and user experience improvements while preserving existing multiplier calculations and game state management.`,
        },
      ],
      stream: true,
    });

    let rawCode = '';

    // Process the stream
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        rawCode += chunk.delta.text;
      }
    }

    // Clean the generated code
    let cleanedCode = rawCode
      .replace(/```(?:jsx?|javascript)?/g, '')
      .replace(/^\s*[\r\n]+/gm, '')
      .trim();

    // Validate the updated code
    if (!cleanedCode.includes('const App') && !cleanedCode.includes('function App')) {
      throw new Error('Updated code does not contain a valid App component');
    }

    // Ensure proper export
    if (!cleanedCode.endsWith('export default App;')) {
      cleanedCode = `${cleanedCode}\nexport default App;`;
    }

    // Validate for financial terms
    const financialTerms = ['bet', 'balance', 'wallet', 'money', 'currency', 'credits', 'coins', 'cash'];
    const codeWords = cleanedCode.toLowerCase().split(/\W+/);
    const foundFinancialTerms = financialTerms.filter(term =>
      codeWords.some(word => word.includes(term))
    );

    if (foundFinancialTerms.length > 0) {
      console.warn('[React Update] Financial terms detected in updated code:', foundFinancialTerms);
    }

    // Check if the modification appears successful
    const modificationKeywords = prompt.toLowerCase().split(/\W+/);
    const codeHasKeywords = modificationKeywords.some(keyword =>
      keyword.length > 3 && cleanedCode.toLowerCase().includes(keyword)
    );

    if (!codeHasKeywords && modificationKeywords.length > 0) {
      console.warn('[React Update] Warning: Modification may not have been applied correctly');
    }

    console.log(`[React Update] Successfully updated component for user: ${req.user._id}`);

    res.json({
      finalApp: cleanedCode,
      proxiedAssets: updatedProxiedAssets,
      message: 'Component updated successfully'
    });

  } catch (error) {
    console.error('[React Update] Error in update route handler:', error);

    // Handle specific errors
    if (error.message.includes('stream') || error.message.includes('timeout')) {
      return res.status(500).json({
        error: 'Update timeout',
        message: 'The AI took too long to update the component. Please try a simpler modification or try again.',
      });
    }

    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a moment before trying again.',
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to update React component',
    });
  }
});

router.post('/checkGamePassword', async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.body.room_id });
    if (room.room_password === req.body.password) {
      res.json({
        success: true,
      });
    } else {
      res.json({
        success: false,
      });
    }
  } catch (err) {
    res.json({
      success: false,
      err: message,
    });
  }
});

router.patch('/room/:id/:type', auth, async (req, res) => {
  const { id, type } = req.params;

  // Validate type
  if (!['like', 'dislike', 'view'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid type' });
  }

  try {
    // Define the update query
    let updateQuery;

    if (type === 'view') {
      // Views: Append user ID to views array (no toggle or conflict)
      updateQuery = [
        {
          $set: {
            views: {
              $cond: [
                { $in: [req.user._id, '$views'] },
                '$views', // Already viewed, no change
                { $concatArrays: ['$views', [req.user._id]] }, // Add user ID
              ],
            },
          },
        },
      ];
    } else {
      // Likes or Dislikes: Toggle the action and remove from opposite array
      const oppositeType = type === 'like' ? 'dislike' : 'like';
      updateQuery = [
        {
          $set: {
            // Toggle the current action (like/dislike)
            [`${type}s`]: {
              $cond: [
                { $in: [req.user._id, `$${type}s`] },
                { $setDifference: [`$${type}s`, [req.user._id]] }, // Remove user ID (unlike/undislike)
                { $concatArrays: [`$${type}s`, [req.user._id]] }, // Add user ID (like/dislike)
              ],
            },
            // Remove user from opposite array (dislikes/likes)
            [`${oppositeType}s`]: {
              $setDifference: [`$${oppositeType}s`, [req.user._id]],
            },
          },
        },
      ];
    }

    // Perform the update
    const room = await Room.findOneAndUpdate({ _id: id }, updateQuery, {
      new: true,
    });

    // Check if room exists
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    req.io.sockets.emit('ROOMS_UPDATED', room);
    res.json({
      success: true,
      message: 'Successful!',
    });
  } catch (error) {
    console.error('Error updating room action:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/room/:id', async (req, res) => {
  const roomId = req.params.id;
  const limit  = Number.parseInt(req.query.limit, 10) || 10;
  const cacheKey = `room:${roomId}:limit:${limit}`;
  const redisClient = req.app.get('redisClient');

  // 1️⃣ Try the cache first
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
  } catch (err) {
    console.error('Redis GET failed, bypassing cache:', err);
  }

  try {
    // 2️⃣ Fetch the room
    const roomPromise = Room.findById(roomId)
      .select([
        '_id','name','image','ticker','pool_id','gameCode',
        'x_link','tax','website_link','telegram_link',
        'created_at','likes','dislikes','creator','hosts',
        'endgame_amount','endgame_type','description',
        'joiners','game_type','bet_amount','user_bet',
        'host_pr','pr','room_number','battles',
        'status','is_private'
      ].join(' '))
      .populate('creator', 'username avatar totalWagered accessory elite')
      .populate('joiners', '_id avatar username accessory elite totalWagered status')
      .lean();

    // 3️⃣ Fetch logs + count in parallel
    const logsPromise = GameLog.find({ room: roomId })
      .select('bet_amount created_at game_type creator joined_user')
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('game_type', 'short_name game_type_name')
      .populate('creator',   '_id avatar username accessory elite totalWagered')
      .populate('joined_user','_id avatar username accessory elite totalWagered')
      .lean();

    const countPromise = GameLog.countDocuments({ room: roomId });

    const [ room, gameLogList, totalGameLogsCount ] = await Promise.all([
      roomPromise, logsPromise, countPromise
    ]);

    if (!room) {
      return res.status(404).json({ success: false, err: 'Room not found' });
    }

    // 4️⃣ Convert logs to your history style
    const roomHistory = await convertGameLogToHistoryStyle(gameLogList);

    // 5️⃣ Compute total stakes from hosts.share
    const totalStakes = room.hosts.reduce((sum, h) => sum + (h.share || 0), 0);

    // 6️⃣ Build response
    const response = {
      success: true,
      query:   req.query,
      roomInfo: {
        _id:             room._id,
        name:            room.name,
        image:           room.image,
        ticker:          room.ticker,
        pool_id:         room.pool_id,
        gameCode:        room.gameCode,
        x_link:          room.x_link,
        tax:             room.tax,
        website_link:    room.website_link,
        telegram_link:   room.telegram_link,
        created_at:      room.created_at,
        likes:           room.likes.length,
        dislikes:        room.dislikes.length,
        creator_id:      room.creator._id,
        username:        room.creator.username,
        creator_avatar:  room.creator.avatar,
        rank:            room.creator.totalWagered,
        accessory:       room.creator.accessory,
        elite:           room.creator.elite,
        hosts:           room.hosts,
        endgame_amount:  room.endgame_amount,
        endgame_type:    room.endgame_type,
        description:     room.description,
        joiners:         room.joiners,
        game_type:       room.game_type,
        bet_amount:      Number(room.bet_amount),
        user_bet:        Number(room.user_bet),
        host_pr:         room.host_pr,
        pr:              room.pr,
        room_name:       `${room.game_type[0]||'Unknown'}-${room.room_number}`,
        total_stakes:    totalStakes,
        battles:         room.battles,
        status:          room.status,
        is_private:      room.is_private,
        room_history:    roomHistory,
        game_logs:       gameLogList,
      },
      totalGameLogsCount,
    };

    // 7️⃣ Cache & return
    try {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(response));
    } catch (err) {
      console.error('Redis SETEX failed:', err);
    }

    return res.json(response);

  } catch (err) {
    console.error('Error in GET /room/:id:', err);
    return res.status(500).json({ success: false, err: err.toString() });
  }
});

// Game type classification function using OpenAI
async function classifyGameTypes(name, gameCode, prompt, description) {
  try {
    const analysisPrompt = `Analyze this game and classify it into 1-3 most relevant game type categories.

Game Details:
- Name: ${name || 'Not provided'}
- Description: ${description || 'Not provided'}
- Original Prompt: ${prompt || 'Not provided'}
- Game Code Preview: ${gameCode ? gameCode.substring(0, 500) + '...' : 'Not provided'}

Available Game Type Categories:
- casino: Games with gambling mechanics, chance-based outcomes, slots, dice, roulette, blackjack
- skill: Games requiring player skill, precision, timing, strategy, puzzles
- arcade: Classic arcade-style games, platformers, shooters, action games
- puzzle: Logic games, brain teasers, matching games, word games
- strategy: Strategic thinking games, tower defense, resource management
- sports: Sports simulations, racing, competitive games
- adventure: Story-driven games, exploration, RPG elements
- simulation: Life simulation, business simulation, realistic scenarios
- trivia: Quiz games, knowledge-based games, Q&A formats
- cards: Card games, poker variants, trading card games
- board: Digital board games, classic board game adaptations
- action: Fast-paced action games, combat, reflexes
- casual: Simple, easy-to-play games, relaxing gameplay
- multiplayer: Games designed for multiple players, social games
- retro: Retro-style games, nostalgic themes, classic mechanics

Instructions:
1. Return 1-3 most relevant categories from the list above
2. Order them by relevance (most relevant first)
3. Consider the game mechanics, theme, and player interaction
4. Avoid overlapping or redundant categories
5. Respond with ONLY a JSON array of strings, nothing else

Example responses:
["casino", "skill"]
["puzzle", "casual"]
["arcade", "action", "retro"]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a game classification expert. Analyze games and return their most relevant categories as a JSON array of 1-3 strings.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    const result = response.choices[0].message.content.trim();
    
    // Parse the JSON response
    let gameTypes;
    try {
      gameTypes = JSON.parse(result);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', result);
      // Fallback: extract categories from response text
      const availableCategories = [
        'casino', 'skill', 'arcade', 'puzzle', 'strategy', 'sports', 
        'adventure', 'simulation', 'trivia', 'cards', 'board', 
        'action', 'casual', 'multiplayer', 'retro'
      ];
      
      gameTypes = availableCategories.filter(category => 
        result.toLowerCase().includes(category)
      ).slice(0, 3);
      
      if (gameTypes.length === 0) {
        gameTypes = ['casual']; // Default fallback
      }
    }

    // Validate and clean the result
    const validCategories = [
      'casino', 'skill', 'arcade', 'puzzle', 'strategy', 'sports', 
      'adventure', 'simulation', 'trivia', 'cards', 'board', 
      'action', 'casual', 'multiplayer', 'retro'
    ];

    const filteredTypes = gameTypes
      .filter(type => typeof type === 'string' && validCategories.includes(type.toLowerCase()))
      .map(type => type.toLowerCase())
      .slice(0, 3); // Limit to 3 categories

    if (filteredTypes.length === 0) {
      console.warn('No valid game types classified, using fallback');
      return ['casual'];
    }

    console.log(`Game types classified: ${filteredTypes.join(', ')}`);
    return filteredTypes;

  } catch (error) {
    console.error('Error in classifyGameTypes:', error);
    // Fallback classification based on keywords
    return fallbackClassification(name, gameCode, prompt, description);
  }
}

// Fallback classification using keyword matching
function fallbackClassification(name, gameCode, prompt, description) {
  const text = `${name || ''} ${gameCode || ''} ${prompt || ''} ${description || ''}`.toLowerCase();
  
  const categories = {
    casino: ['casino', 'slot', 'dice', 'roulette', 'blackjack', 'poker', 'gambling', 'bet', 'jackpot', 'spin'],
    skill: ['skill', 'precision', 'timing', 'accuracy', 'challenge', 'practice', 'master'],
    arcade: ['arcade', 'retro', 'classic', 'platformer', 'jump', 'collect', 'avoid'],
    puzzle: ['puzzle', 'logic', 'brain', 'solve', 'match', 'pattern', 'thinking'],
    strategy: ['strategy', 'tactical', 'planning', 'resource', 'management', 'tower', 'defense'],
    sports: ['sports', 'race', 'racing', 'football', 'soccer', 'basketball', 'competition'],
    action: ['action', 'fast', 'quick', 'speed', 'combat', 'fight', 'shoot', 'battle'],
    simulation: ['simulation', 'sim', 'life', 'business', 'realistic', 'manage'],
    cards: ['card', 'deck', 'hand', 'draw', 'shuffle'],
    casual: ['casual', 'simple', 'easy', 'relaxing', 'fun', 'light']
  };

  const matches = [];
  
  for (const [category, keywords] of Object.entries(categories)) {
    const matchCount = keywords.filter(keyword => text.includes(keyword)).length;
    if (matchCount > 0) {
      matches.push({ category, score: matchCount });
    }
  }

  // Sort by score and take top 3
  matches.sort((a, b) => b.score - a.score);
  const result = matches.slice(0, 3).map(match => match.category);
  
  return result.length > 0 ? result : ['casual'];
}


// GET /api/comments/:room_id
router.get('/comments/:room_id', async (req, res) => {
  try {
    const room_id = req.params.room_id;
    const comments = await Comment.find({ room: room_id })
      .populate({ path: 'user', model: User })
      .select('_id accessory elite avatar username totalWagered content created_at')
      .sort({ created_at: -1 });
    res.json({
      success: true,
      comments: comments,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err,
    });
  }
});

router.post('/comments', auth, async (req, res) => {
  try {
    const { room_id, content } = req.body;
    room = await Room.findOne({ _id: room_id });

    let message = new Notification({
      from: req.user._id,
      to: room.creator,
      room: room_id,
      message: '',
      amount: 0,
      is_read: false,
    });

    const truncatedContent =
      content.length > 10 ? content.substring(0, 10) + '...' : content;
    message.message = `${req.user.username} left a comment ${truncatedContent}`;

    const comment = new Comment({
      user: req.user._id,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
      elite: req.user.elite,
      totalWagered: req.user.totalWagered,
      room: room_id,
      content: content,
    });

    await saveDocumentWithRetry(comment);

    const newCommentData = {
      _id: comment._id,
      user: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar,
        accessory: req.user.accessory,
        elite: req.user.elite,
        totalWagered: req.user.totalWagered,
      },
      content: comment.content,
      created_at: comment.created_at,
      room: comment.room,
    };
    req.io.sockets.emit('NEW_COMMENT', newCommentData);

    const notificationData = {
      message: message.message,
      username: req.user.username,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
      elite: req.user.elite,
      room: room_id,
      amount: 0,
      rank: req.user.totalWagered,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      is_read: false,
    };
    await saveDocumentWithRetry(message);
    socket.sendNotification(message.to, notificationData);

    res.json({
      success: true,
      comment: newCommentData,
    });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.json({
      success: false,
      err,
    });
  }
});

router.delete('/comments/:comment_id', async (req, res) => {
  try {
    const commentId = req.params.comment_id;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    await Comment.findByIdAndDelete(commentId);

    req.io.sockets.emit('DELETE_COMMENT', { commentId });

    res.json({
      success: true,
      commentId,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message,
    });
  }
});

router.get('/topWins', async (req, res) => {
  try {
    const recentGameLogs = await GameLog.find({})
      .sort({ created_at: -1 })
      .limit(4)
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id avatar username accessory totalWagered',
      });

    const topGameLogs = recentGameLogs
      .sort((a, b) => b.winnings - a.winnings)
      .slice(0, 4);

    res.json({
      success: true,
      pageSize: 4,
      history: topGameLogs,
    });
  } catch (err) {
    console.error("Error in '/topWins' endpoint:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});


// ============================================
// BACKEND: Enhanced Game History with Redis Caching
// ============================================

const getHistory = async (
  pageSize,
  my_id,
  game_type_filter,
  redisClient = null
) => {
  try {
    const cacheKey = `history:${pageSize}:${my_id || 'all'}:${game_type_filter}`;
    let result = null,
        fromCache = false;

    // ——————— Try cache ———————
    if (redisClient) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          result = JSON.parse(cached);
          fromCache = true;
        }
      } catch (redisErr) {
        console.error('Redis error during history fetch:', redisErr);
      }
    }

    if (!result) {
      const filters = [];

      // ——————— Filter by user if requested ———————
      if (my_id) {
        const userId = ObjectId.isValid(my_id) ? ObjectId(my_id) : my_id;
        filters.push({ $or: [{ creator: userId }, { joined_user: userId }] });
      }

      // ——————— Filter by game type if requested ———————
      if (game_type_filter && game_type_filter !== 'All') {
        let gameTypeId = null;

        // If they passed in an ObjectId string, use it directly
        if (ObjectId.isValid(game_type_filter)) {
          gameTypeId = ObjectId(game_type_filter);
        } else {
          // Otherwise look up by name (case-insensitive)
          const gameTypeDoc = await GameType
            .findOne({ game_type_name: game_type_filter })
            .collation({ locale: 'en', strength: 2 })  // case-insensitive
            .select('_id');

          if (gameTypeDoc) {
            gameTypeId = gameTypeDoc._id;
          } else {
            // No such game type → empty result
            result = { history: [], count: 0, pageSize };
          }
        }

        if (gameTypeId) {
          filters.push({ game_type: gameTypeId });
        }
      }

      // Build the final Mongo filter
      const finalCondition =
        filters.length > 0 ? { $and: filters } : {};

      // Only query if we haven’t already set `result` to empty
      if (!result) {
        const [ gameLogList, count ] = await Promise.all([
          GameLog.find(finalCondition)
            .sort({ created_at: -1 })
            .limit(pageSize)
            .populate({
              path: 'room',
              model: Room,
              select: [
                '_id','winnings','ticker','image','commission',
                'creator','status','ai_mode','hosts',
                'room_number','bet_amount','user_bet',
                'host_pr','created_at','name'
              ].join(' ')
            })
            .populate('game_type', 'short_name game_type_name')
            .populate('creator',   '_id avatar accessory totalWagered username')
            .populate('joined_user','_id avatar accessory totalWagered username')
            .lean(),
          GameLog.countDocuments(finalCondition)
        ]);

        const historyData = await convertGameLogToHistoryStyle(gameLogList);
        result = { history: historyData, count, pageSize };
      }

      // ——————— Cache it ———————
      if (redisClient) {
        const ttl = my_id ? 600 : 180;  // personal: 10m, global: 3m
        try {
          await redisClient.setEx(cacheKey, ttl, JSON.stringify(result));
        } catch (redisErr) {
          console.error('Failed to cache history:', redisErr);
        }
      }
    }

    return { ...result, cached: fromCache };
  } catch (err) {
    console.error('Error in getHistory:', err);
    return false;
  }
};

router.get('/history', async (req, res) => {
  try {
    const { pageSize = 1, game_type = 'All', my_id = null } = req.query;

    const redisClient = req.app.get('redisClient');

    const history = await getHistory(parseInt(pageSize), my_id, game_type, redisClient);

    if (!history) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch history'
      });
    }

    res.json({
      success: true,
      pageSize: parseInt(pageSize),
      history: history.history,
      count: history.count,
      cached: history.cached || false
    });
  } catch (err) {
    console.error('Error in /history route:', err);
    res.status(500).json({
      success: false,
      err: err.toString(),
    });
  }
});

router.get('/my_history', auth, async (req, res) => {
  try {
    const { pageSize = 16, game_type = 'All' } = req.query;

    const redisClient = req.app.get('redisClient'); // Get Redis client for my_history too

    const history = await getHistory(
      parseInt(pageSize),
      req.user._id,
      game_type,
      redisClient // Pass redisClient to getHistory for my_history as well
    );

    if (!history) { // Add check for history not found/failed
       return res.status(500).json({
        success: false,
        error: 'Failed to fetch my history'
      });
    }

    res.json({
      success: true,
      pageSize: parseInt(pageSize),
      history: history.history,
      count: history.count, // Include count for my_history as well
      cached: history.cached || false // Include cached status
    });
  } catch (err) {
    console.error('Error in /my_history route:', err);
    res.status(500).json({
      success: false,
      err: err.toString(),
    });
  }
});

router.get('/count', async (req, res) => {
  const game_type_filter = req.query.game_type || 'All';
  try {
    const search_condition = { status: 'open' };

    if (game_type_filter !== 'All') {
      // Filter by game_type array containing the specified tag (case-insensitive)
      search_condition.game_type = { $elemMatch: { $regex: new RegExp(game_type_filter, 'i') } };
    }

    const roomCount = await Room.countDocuments(search_condition);

    res.json({
      success: true,
      game_type: game_type_filter,
      roomCount: roomCount,
    });
  } catch (err) {
    console.error('Error in /count:', err);
    res.json({
      success: false,
      error: err.toString(),
    });
  }
});

router.get('/rooms', async (req, res) => {
  const game_type_filter = req.query.game_type || 'All';
  const cacheKey = `rooms:${game_type_filter}`;

  const redisClient = req.app.get('redisClient');

  let cached;
  try {
    cached = await redisClient.get(cacheKey);
  } catch (redisErr) {
    console.error('Redis error, bypassing cache:', redisErr);
  }

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  try {
    const rooms = await getRoomList(game_type_filter);
    console.log('Rooms fetched:', rooms.rooms.length, 'rooms');
    const response = {
      success: true,
      query: req.query,
      roomList: rooms.rooms,
    };

    try {
      await redisClient.setEx(cacheKey, 60, JSON.stringify(response));
    } catch (redisErr) {
      console.error('Failed to cache:', redisErr);
    }

    res.json(response);
  } catch (err) {
    console.error('Error in /rooms:', err);
    res.json({
      success: false,
      err: err.toString(),
    });
  }
});

const getRoomList = async (game_type_filter) => {
  const search_condition = {
    status: 'open',
  };

  if (game_type_filter !== 'All') {
    // Filter by game_type array containing the specified tag (case-insensitive)
    search_condition.game_type = { $elemMatch: { $regex: new RegExp(game_type_filter, 'i') } };
  }

  try {
    const preRooms = await Room.find(search_condition)
      .select(
        '_id name ticker image description room_number likes dislikes ' +
        'creator battles username joiners game_type qs_game_type is_private ' +
        'bet_amount user_bet pr host_pr endgame_amount status created_at updated_at hosts'
      )
      .populate({
        path: 'creator',
        model: 'rps_users',
        select: 'avatar totalWagered username accessory elite status',
      })
      .sort({ updated_at: -1 })
      .limit(50)
      .lean();

    const joinerIds = [...new Set(preRooms.flatMap(room => room.joiners))];
    const joinerUsers = await User.find({ _id: { $in: joinerIds } })
      .select('avatar totalWagered _id username accessory elite status')
      .lean();

    const joinerMap = joinerUsers.reduce((map, user) => {
      map[user._id.toString()] = {
        user_id: user._id,
        avatar: user.avatar,
        totalWagered: user.totalWagered,
        accessory: user.accessory,
        elite: user.elite,
        username: user.username,
        rank: user.totalWagered,
      };
      return map;
    }, {});

    const result = preRooms.map(room => {
      try {
        const joinerData = room.joiners.map(joinedUserId => joinerMap[joinedUserId.toString()] || null).filter(Boolean);

        return {
          _id: room._id,
          creator_id: room.creator ? room.creator._id : '',
          joiners: joinerData.map(joiner => ({
            avatar: joiner.avatar,
            rank: joiner.totalWagered,
            username: joiner.username,
            accessory: joiner.accessory,
            elite: joiner.elite,
            _id: joiner.user_id,
          })),
          ticker: room.ticker || room.room_number,
          rank: room.creator?.totalWagered || 0,
          creator_avatar: room.creator?.avatar || '',
          accessory: room.creator?.accessory || '',
          elite: room.creator?.elite || '',
          username: room.creator?.username || '',
          creator_status: room.creator?.status || '',
          game_type: room.game_type || [], // Ensure it's an array
          name: room.name,
          description: room.description,
          image: room.image,
          qs_game_type: room.qs_game_type,
          bet_amount: room.bet_amount,
          pr: room.pr,
          endgame_amount: room.endgame_amount,
          host_pr: room.host_pr,
          // room_name: Construct from first game_type tag, or 'Unknown'
          room_name: (room.game_type && room.game_type.length > 0 ? room.game_type[0] : 'Unknown') + '-' + room.room_number,
          total_stakes: room.hosts.reduce((acc, host) => acc + (host.stake || 0), 0),
          user_bet: parseFloat(room.user_bet || 0),
          is_private: room.is_private,
          status: room.status,
          index: room.room_number,
          created_at: moment(room.created_at).format('YYYY-MM-DD HH:mm'),
          updated_at: room.updated_at,
          battles: room.battles,
          likes: room.likes,
          dislikes: room.dislikes,
          hosts: room.hosts,
          winnings: parseFloat(room.user_bet || 0),
        };
      } catch (error) {
        console.error('Error building room object:', error.toString());
        return null;
      }
    });

    const filteredResults = result.filter(r => r !== null);
    return { rooms: filteredResults };
  } catch (error) {
    console.error('Error in getRoomList:', error);
    return { rooms: [] };
  }
};

router.post('/rooms', auth, async (req, res) => {
  try {
    const {
      bet_amount,
      name,
      image,
      ticker,
      tax,
      telegram_link,
      x_link,
      website_link,
      game_type_tag, // This can now be a string or an array of strings (optional for manual override)
      is_private,
      endgame_amount,
      endgame_type,
      description,
      room_password,
      connectedAccount,
      prompt,
      gameCode,
    } = req.body;

    const {
      _id,
      avatar,
      status,
      accessory,
      elite,
      totalWagered,
      username,
      dailyWithdrawals,
      isWithdrawing,
    } = req.user;

    const user_bet = parseFloat(bet_amount);

    let balance;
    try {
      balance = await checkWalletBalance(connectedAccount);
    } catch (balanceError) {
      console.error('Balance check failed:', balanceError);
      return res.json({
        success: false,
        message: 'UNABLE TO VERIFY WALLET BALANCE. PLEASE TRY AGAIN!',
      });
    }

    // All the existing validation logic stays the same...
    if (isWithdrawing) {
      return res.json({
        success: false,
        error: 'WITHDRAWAL IN PROGRESS. Please wait until it completes.'
      });
    }

    if (user_bet <= 0) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!',
      });
    }

    if (elite === '') {
      return res.json({
        success: false,
        message: 'GAME CREATION IS ONLY FOR ELITE MEMBERS!',
      });
    }

    if (!connectedAccount) {
      return res.json({
        success: false,
        message: 'NO CONNECTED ADDRESS FOUND!',
      });
    }

    if (user_bet < 0.001) {
      return res.json({
        success: false,
        message: 'MEOWNIMUM BUY-IN IS 0.001 SOL!',
      });
    }

    if (endgame_type && parseFloat(endgame_amount) < user_bet) {
      return res.json({
        success: false,
        message: 'MINIMUM AUTO-PAYOUT MUST BE EQUAL TO BANKROLL',
      });
    }

    if (username.includes('BOT')) {
      return res.json({
        success: false,
        message: 'DO NOT HAVE PURRMISSION'
      });
    }

    if (user_bet > balance) {
      console.log('Insufficient funds:', { user_bet, balance });
      return res.json({
        success: false,
        message: 'NOT ENUFF FUNDS AT THIS MEOWMENT',
      });
    }

    if (dailyWithdrawals > 4.269) {
      return res.json({
        success: false,
        message: 'Exceeded Daily Withdrawal Limit. Unable to Create a room. Please try again tomorrow! (During Launch Phase only)',
      });
    }

    const [roomCount, commissionDoc] = await Promise.all([
      Room.countDocuments({}),
      System.findOne({ name: 'commission' })
    ]);

    // AUTO-GENERATE GAME TYPES if not provided or if provided types are invalid
    let gameTypeNamesToStore = [];
    
    if (game_type_tag && Array.isArray(game_type_tag) && game_type_tag.length > 0) {
      // Manual override provided - validate and use
      gameTypeNamesToStore = game_type_tag
        .filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
        .map(tag => tag.trim().toLowerCase())
        .slice(0, 3); // Limit to 3
    } else if (game_type_tag && typeof game_type_tag === 'string' && game_type_tag.trim() !== '') {
      // Single tag provided
      gameTypeNamesToStore = [game_type_tag.trim().toLowerCase()];
    }
    
    // If no valid manual tags or we want to auto-generate, use AI classification
    if (gameTypeNamesToStore.length === 0) {
      try {
        console.log('Auto-generating game types using AI classification...');
        gameTypeNamesToStore = await classifyGameTypes(name, gameCode, prompt, description);
        console.log('AI classified game types:', gameTypeNamesToStore);
      } catch (classificationError) {
        console.error('Failed to classify game types:', classificationError);
        // Final fallback
        gameTypeNamesToStore = ['casual'];
      }
    }

    if (!gameTypeNamesToStore.length) gameTypeNamesToStore = ['casual'];
    // Create/find GameType documents for each tag (if you still need the GameType collection)
    let primaryGameTypeDoc = null;
    for (const gtName of gameTypeNamesToStore) {
      const doc = await GameType.findOneAndUpdate(
        { game_type_name: gtName },
        { // only set short_name on insert
          $setOnInsert: {
            short_name: gtName.slice(0, 3).toUpperCase(),
            created_at: Date.now(),
            updated_at: Date.now()
          }
        },
        {
          new: true,            // return the doc after update/insert
          upsert: true,         // create if missing
          setDefaultsOnInsert: true,
          collation: { locale: 'en', strength: 2 }
        }
      );
      if (!primaryGameTypeDoc) primaryGameTypeDoc = doc;
    }

    const commissionPercentage = commissionDoc.value;
    const fee = user_bet * (commissionPercentage / 100);
    const amountAfterFee = user_bet - fee;
    const room_number = roomCount + 1;

    const hostObj = {
      host: _id,
      avatar,
      username,
      accessory,
      elite,
      rank: totalWagered,
      share: 100,
      stake: amountAfterFee,
      walletAddress: connectedAccount,
    };

    const newRoom = new Room({
      creator: _id,
      room_password: room_password || '',
      bet_amount: amountAfterFee,
      is_private,
      battles: 0,
      hosts: [hostObj],
      game_type: gameTypeNamesToStore, // Store the array of AI-classified game types
      user_bet: amountAfterFee,
      tax,
      name,
      image,
      ticker,
      x_link,
      gameCode,
      prompt,
      telegram_link,
      website_link,
      pr: 0,
      total_stakes: amountAfterFee,
      endgame_amount: endgame_type ? endgame_amount : amountAfterFee,
      endgame_type,
      host_pr: amountAfterFee,
      room_name: (primaryGameTypeDoc?.short_name || gameTypeNamesToStore[0] || 'Unknown') + '-' + room_number,
      room_number,
      index: room_number,
      status: 'open',
      description,
    });

    const newGameLog = new GameLog({
      room: newRoom._id,
      creator: _id,
      joined_user: _id,
      game_type: primaryGameTypeDoc ? primaryGameTypeDoc._id : null,
      bet_amount: amountAfterFee,
      hosts: [hostObj],
      game_result: -3000,
    });

    const updatedUser = {
      balance: balance - amountAfterFee,
      updated_at: new Date(),
      totalTraded: req.user.totalTraded + Math.abs(user_bet),
      tradingProfit: req.user.tradingProfit - amountAfterFee
    };

    await Promise.all([
      saveDocumentWithRetry(newGameLog),
      User.findByIdAndUpdate(_id, updatedUser),
      saveDocumentWithRetry(newRoom),
      System.findOneAndUpdate(
        { name: 'platform_trading' },
        { $inc: { value: fee } }
      )
    ]);

    const gameLogList = await GameLog.find({ room: newRoom._id })
      .sort({ created_at: 'desc' })
      .limit(1)
      .populate({
        path: 'room',
        model: Room,
        select: '_id winnings ticker image creator status hosts room_number bet_amount user_bet host_pr created_at name',
      })
      .populate({
        path: 'game_type',
        model: GameType,
        select: 'short_name game_type_name',
      })
      .populate({
        path: 'creator',
        model: User,
        select: '_id avatar username accessory elite totalWagered',
      })
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id avatar username accessory elite totalWagered',
      });

    const newLog = await convertGameLogToHistoryStyle(gameLogList);
    const roomObj = {
      ...newRoom.toObject(),
      creator_id: _id,
      creator_avatar: avatar,
      creator_status: status,
      accessory: accessory || '',
      elite: elite,
      username,
      winnings: amountAfterFee,
      rank: totalWagered,
      joiners: [],
    };

    setImmediate(() => {
      req.io.sockets.emit('NEW_LOG', { newLog });
      req.io.sockets.emit('ROOMS_UPDATED', roomObj);
    });

    res.json({
      success: true,
      message: 'room created',
      gameTypes: gameTypeNamesToStore, // Return the classified game types
    });
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Helper function for checking wallet balance
async function checkWalletBalance(walletAddress) {
  const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

  try {
    console.log('🔗 Connecting to Solana to check balance...');
    const connection = new Connection(process.env.PROVIDER_URL, 'confirmed');
    const publicKey = new PublicKey(walletAddress);

    const balance = await connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    console.log('Wallet balance check:', {
      address: walletAddress,
      lamports: balance,
      sol: solBalance
    });

    return solBalance;
  } catch (error) {
    console.error('Error checking wallet balance:', error);
    throw new Error(`Failed to check wallet balance: ${error.message}`);
  }
}

router.get('/my_games', auth, async (req, res) => {
  try {
    const pageSize = 50;
    // `game_type_filter` might now be a comma-separated string if filtering by multiple tags
    // Let's assume it can be a single tag string 'Casino' or 'All' for simplicity
    // If you want to support multiple selected tags like 'Casino,Strategy', you'd parse it to an array here
    const game_type_filter = req.query.game_type || 'All';
    const status = req.query.status;
    const sort = req.query.sort || 'desc';
    const cacheKey = `my_games:${req.user._id}:${game_type_filter}:${status}:${sort}`;

    const redisClient = req.app.get('redisClient');

    let cached;
    try {
      cached = await redisClient.get(cacheKey);
    } catch (redisErr) {
      console.error('Redis error, bypassing cache:', redisErr);
    }

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const { rooms, count } = await getMyRooms(
      req.user._id,
      pageSize,
      game_type_filter,
      status,
      sort,
    );

    const response = {
      success: true,
      pageSize: pageSize,
      myGames: rooms,
      total: count,
    };

    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
    } catch (redisErr) {
      console.error('Failed to cache:', redisErr);
    }

    res.json(response);
  } catch (err) {
    console.error('Error in /my_games:', err);
    res.json({
      success: false,
      message: err.toString(),
    });
  }
});

const getMyRooms = async (
  user_id,
  pageSize,
  game_type_filter = 'All',
  status = 'open',
  sort = 'desc',
) => {
  const search_condition = {
    hosts: { $elemMatch: { host: user_id, share: { $gt: 0 } } },
  };

  if (status) {
    search_condition.status = status;
  }

  if (game_type_filter !== 'All') {
    search_condition.game_type = { $elemMatch: { $regex: new RegExp(game_type_filter, 'i') } };
  }

  if (status === 'finished') {
    search_condition.joiners = { $exists: true, $ne: [] };
  }

  const rooms = await Room.find(search_condition)
    .select('_id creator name image ticker hosts creator host_pr room_number endgame_type endgame_amount is_private status created_at user_bet bet_amount likes dislikes gameCode game_type') // Include game_type here for mapping
    .limit(pageSize)
    .lean();

  const count = await Room.countDocuments(search_condition);

  const creatorIds = [...new Set(rooms.map(room => room.creator))];
  const creators = await User.find({ _id: { $in: creatorIds } })
    .select('avatar totalWagered accessory elite')
    .lean();

  const creatorMap = creators.reduce((map, creator) => {
    map[creator._id.toString()] = creator;
    return map;
  }, {});

  const roomIds = rooms.map(room => room._id);
  const gameLogCounts = await GameLog.aggregate([
    { $match: { room: { $in: roomIds } } },
    { $group: { _id: '$room', count: { $sum: 1 } } }
  ]);

  const gameLogMap = gameLogCounts.reduce((map, log) => {
    map[log._id.toString()] = log.count;
    return map;
  }, {});

  let result = rooms.map(room => {
    const isCoHost = room.hosts.find(
      (host) => host.host.toString() === user_id.toString() && host.share === 100
    );
    const creatorDetails = creatorMap[room.creator.toString()] || {};
    const gameLogCount = gameLogMap[room._id.toString()] || 0;

    let temp = {
      _id: room._id,
      creator_id: room.creator,
      name: room.name,
      image: room.image,
      ticker: room.ticker,
      creator_avatar: creatorDetails.avatar || '',
      rank: creatorDetails.totalWagered || 0,
      accessory: creatorDetails.accessory || '',
      elite: creatorDetails.elite || '',
      game_type: room.game_type || [],
      bet_amount: room.bet_amount,
      user_bet: room.user_bet,
      share: room.hosts.find(
        (host) => host.host.toString() === user_id.toString()
      )?.share || 0,
      pr: room.host_pr,
      winnings: '',
      index: room.room_number,
      endgame_type: room.endgame_type,
      endgame_amount: room.endgame_amount,
      is_private: room.is_private,
      status: room.status,
      created_at: room.created_at,
      coHost: !!isCoHost,
      net_profit: '',
      battles: gameLogCount,
      likes: room.likes,
      dislikes: room.dislikes,
      gameCode: room.gameCode,
      hosts: room.hosts,
    };


    temp.winnings = room.user_bet;
    //
    if (isCoHost) {
      const hostShare = isCoHost.share;
      temp.winnings = (hostShare / 100) * parseFloat(room.user_bet);
      if (room.creator.toString() !== user_id.toString()) {
        temp.coHost = isCoHost;
      }
    }

    return temp;
  });

  // Sorting logic remains the same
  if (sort === 'asc') {
    result.sort((a, b) => a.created_at - b.created_at);
  } else if (sort === 'desc') {
    result.sort((a, b) => b.created_at - a.created_at);
  } else if (sort === 'net_profit_asc') {
    result.sort((a, b) => a.net_profit - b.net_profit);
  } else if (sort === 'net_profit_desc') {
    result.sort((a, b) => b.net_profit - a.net_profit);
  } else if (sort === 'bets_asc') {
    result.sort((a, b) => a.bets - b.bets);
  } else {
    result.sort((a, b) => b.bets - a.bets);
  }

  return {
    rooms: result,
    count: count,
  };
};

router.post('/end_game', auth, async (req, res) => {
  try {
    const {
      _id: userId,
      updated_at,
      dailyWithdrawals,
      username,
      avatar,
      accessory,
      elite,
      totalWagered,
      accounts,
    } = req.user;
    const { room_id: roomId, connectedAccount } = req.body;

    const timeDifference = (new Date() - new Date(updated_at)) / 1000; // Difference in seconds
    if (timeDifference <= 1.5) {
      return res.json({
        success: false,
        message: 'Too fast. Please wait a few seconds before trying again.',
      });
    }

    if (!(await check_access_time(userId))) {
      return res.json({
        success: false,
        message: 'Irregular action',
        betResult: -1000,
      });
    }

    if (dailyWithdrawals > 4.269) {
      return res.json({
        success: false,
        message:
          'Exceeded Daily Withdrawal Limit. Unable to end this room. Please try again tomorrow!',
      });
    }

    // Ensure `connectedAccount` is present and authorized
    if (!connectedAccount || !accounts || !accounts.includes(connectedAccount)) {
      return res.json({
        success: false,
        message: 'Connected account is missing or not authorized.',
      });
    }

    // When fetching roomInfo, we need the `game_type` string array itself.
    const roomInfo = await Room.findOne({ _id: roomId })
      .populate({ path: 'creator', model: User, select: 'username _id' })
      .select(
        'status hosts user_bet name host_pr pr bet_amount room_number game_type updated_at',
      );

    if (!roomInfo) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    if (roomInfo.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS ALREADY ENDED',
      });
    }

    const fiveHundredMsAgo = new Date(Date.now() - 500); // More precise variable name
    if (roomInfo.updated_at > fiveHundredMsAgo) { // Use roomInfo.updated_at directly
      return res.json({
        success: false,
        message: 'ROOM TOO BUSY, TRY AGAIN LATER',
        betResult: -1200,
      });
    }

    roomInfo.status = 'finished';

    const hostUpdates = [];
    const gameTransactions = [];

    for (const hostData of roomInfo.hosts) {
      const hostId = hostData.host;
      const host = await User.findById(hostId).select('updated_at accounts'); // Include accounts for validation
      if (!host) continue;

      const amount = (hostData.share / 100) * parseFloat(roomInfo.user_bet);

      if (amount > 0 && connectedAccount) {
        const depositTransaction = await GameTransanction.findOne({
          user: hostId,
          status: { $in: ['pending', 'completed'] },
          description: { $regex: '^(Created)', $options: 'i' },
          room: roomId, // Crucial to filter by room for the specific deposit
        });

        if (!depositTransaction) {
          console.warn(
            `No valid deposit (pending or completed) for user ${hostId}, room ${roomId}`,
          );
          // Instead of immediately returning, consider a more robust error handling
          // This might be a false positive if a deposit is for another room or already processed.
          // For now, keeping your original behavior, but flagging for review.
          return res.json({
            success: false,
            message:
              'No valid SOL deposit found for this room. Please wait for your deposit to process and try again.',
            betResult: -1000,
          });
        }

        try {
          const address = connectedAccount.trim();
          new PublicKey(address); // Validate Solana address
        } catch (error) {
          console.error('PublicKey error:', error.message);
          return res.json({
            success: false,
            message: 'Invalid Solana wallet address',
          });
        }

        const newGameTransaction = new GameTransanction({
          user: hostId,
          amount: amount,
          description: `Rugged ${roomInfo.name}`,
          room: roomId,
          room_name: roomInfo.name,
          status: 'pending',
          connectedAccount: connectedAccount,
        });
        gameTransactions.push(saveDocumentWithRetry(newGameTransaction));
      }

      host.updated_at = new Date();
      hostUpdates.push(saveDocumentWithRetry(host));

      const message = `Rugged ${roomInfo.name}`;
      const notificationData = {
        _id: userId, // This should be the hostId if sending to the host
        message,
        username, // This is the username of the user who made the request, not necessarily the host
        avatar, // Avatar of the user who made the request
        amount,
        accessory,
        elite,
        room: roomInfo._id,
        rank: totalWagered, // This is totalWagered of the user who made the request
        created_at: moment().format('YYYY-MM-DD HH:mm'),
        created_at_str: moment().format('LLL'),
        updated_at: moment().format('YYYY-MM-DD HH:mm'),
        is_read: false,
      };
      // You should send notification to hostId, not userId for host-specific notifications
      socket.sendNotification(hostId, notificationData);
    }

    await Promise.all([...hostUpdates, ...gameTransactions]);

    // To create the GameLog, you need the _id of a GameType document.
    // Since roomInfo.game_type is now an array of strings, we need to pick one
    // or fetch the corresponding GameType _id from the GameType collection.
    // For simplicity, let's assume the first tag in the array is the primary one for GameLog.
    let gameTypeIdForLog = null;
    if (roomInfo.game_type && roomInfo.game_type.length > 0) {
      const primaryGameTypeTag = roomInfo.game_type[0]; // Get the first tag from the array
      const gameTypeDoc = await GameType.findOne({ game_type_name: primaryGameTypeTag.toLowerCase() }).select('_id');
      if (gameTypeDoc) {
        gameTypeIdForLog = gameTypeDoc._id;
      } else {
        console.warn(`GameType document not found for tag: ${primaryGameTypeTag}`);
        // Consider defaulting to a generic GameType _id or handling this error
      }
    }

    if (!gameTypeIdForLog) {
        // If no game type ID could be determined, handle this error
        return res.status(500).json({
            success: false,
            message: 'Could not determine game type for logging.'
        });
    }

    const newGameLog = new GameLog({
      room: roomInfo._id,
      creator: roomInfo.creator._id,
      joined_user: roomInfo.creator._id,
      game_type: gameTypeIdForLog, // Assign the fetched GameType _id
      bet_amount: roomInfo.host_pr,
      hosts: roomInfo.hosts,
      game_result: -100,
    });

    const newTransactionC = new GameTransanction({
      user: userId, // This is the user who initiated the end_game (the host)
      amount: (roomInfo.hosts[0].share / 100) * parseFloat(roomInfo.user_bet), // This assumes hosts[0] is the primary host
      description: `Rugged ${roomInfo.name}`,
      room: roomId,
      status: 'pending',
      connectedAccount: connectedAccount,
    });

    await Promise.all([
      saveDocumentWithRetry(roomInfo), // This saves the updated room status
      saveDocumentWithRetry(newGameLog),
      saveDocumentWithRetry(newTransactionC),
    ]);

    // When populating GameLog for emission, it still links to GameType by ObjectId
    let gameLogQuery = GameLog.find({ room: roomInfo._id })
      .sort({ created_at: 'desc' })
      .limit(1)
      .populate({
        path: 'room',
        model: Room,
        select: '_id winnings ticker image creator status hosts room_number bet_amount user_bet host_pr created_at name', // Do NOT select game_type as it's now string array. Include `name`
      })
      .populate({
        path: 'game_type', // This still populates from GameType collection via GameLog's ObjectId
        model: GameType,
        select: 'short_name game_type_name',
      })
      .populate({
        path: 'creator',
        model: User,
        select: '_id avatar username accessory elite totalWagered',
      })
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id avatar username accessory elite totalWagered',
      });

    const gameLogList = await gameLogQuery;

    const newLog = await convertGameLogToHistoryStyle(gameLogList);
    req.io.sockets.emit('NEW_LOG', { newLog });
    req.io.sockets.emit('ROOM_ENDED', { roomId });

    res.json({
      success: true,
      roomId,
      newTransaction: newTransactionC,
    });
  } catch (err) {
    console.error('ERROR in end_game:', err);
    res.json({
      success: false,
      already_finished: false,
      message: err.message,
    });
  }
});

// PUMP route (Simplified: older holders get a bonus share allocation)
router.post('/pump', auth, async (req, res) => {
  try {
    if (!req.body.connectedAccount || !req.user.accounts || !req.user.accounts.includes(req.body.connectedAccount)) {
      return res.json({
        success: false,
        message: 'Connected account is missing or not authorized.',
      });
    }

    if (req.user.isWithdrawing) {
      return res.json({
        success: false,
        error: 'WITHDRAWAL IN PROGRESS. Please wait until it completes.'
      });
    }

    const rowId = req.body.rowId;
    const room = await Room.findOne({ _id: rowId });

    if (!room) {
      return res.json({
        success: false,
        message: 'ROOM NOT FOUND',
      });
    }

    const accessAllowed = await check_access_time(req.user._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000,
      });
    }

    const fiveHundredMsAgo = new Date(Date.now() - 500);
    if (room.updated_at > fiveHundredMsAgo) {
      return res.json({
        success: false,
        message: 'ROOM TOO BUSY, TRY AGAIN LATER',
        betResult: -1200,
      });
    }

    if (room.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS ENDED ALREADY',
      });
    }

    const now = moment().format('LLL');
    const userBalance = req.user.balance;
    let coHostAmount = parseFloat(req.body.amount);

    if (isNaN(coHostAmount) || coHostAmount <= 0) {
      return res.json({
        success: false,
        message: 'INVALID AMOUNT! PLEASE ENTER A VALID NUMBER.',
      });
    }

    if (userBalance < coHostAmount) {
      return res.json({
        success: false,
        message: 'INSUFFICIENT FUNDS!',
      });
    }

    const commissionDoc = await System.findOne({ name: 'commission' });
    const commissionPercentage = commissionDoc?.value || 0;
    const fee = coHostAmount * (commissionPercentage / 100);
    const amountAfterFee = coHostAmount - fee;

    await System.findOneAndUpdate(
      { name: 'platform_trading' },
      { $inc: { value: fee } },
    );

    req.user.balance -= amountAfterFee;
    req.user.totalTraded += Math.abs(coHostAmount);
    req.user.tradingProfit -= amountAfterFee;

    const oldLiquidity = parseFloat(room.user_bet) || 0;
    const netDeposit = amountAfterFee;
    const newLiquidity = oldLiquidity + netDeposit;

    let totalShareSupply = 0;
    const oldHosts = room.hosts.map((host) => {
      const oldAbs = (host.share / 100) * oldLiquidity;
      totalShareSupply += oldAbs;
      return {
        ...host.toObject(),
        oldAbsoluteShares: oldAbs,
      };
    });

    const mintedShares = netDeposit;
    const fractionForOld = 0.12;
    const bonusForOld = mintedShares * fractionForOld;
    const buyerShares = mintedShares - bonusForOld;

    let totalOld = oldHosts.reduce((acc, h) => acc + h.oldAbsoluteShares, 0);
    if (totalOld < 1e-9) totalOld = 1;

    oldHosts.forEach((h) => {
      const frac = h.oldAbsoluteShares / totalOld;
      const bonus = bonusForOld * frac;
      h.newAbsoluteShares = (h.oldAbsoluteShares || 0) + bonus;
    });

    const existingHostIndex = oldHosts.findIndex((h) =>
      h.host.equals(req.user._id),
    );
    if (existingHostIndex === -1) {
      oldHosts.push({
        host: req.user._id,
        accessory: req.user.accessory,
        elite: req.user.elite,
        username: req.user.username,
        avatar: req.user.avatar,
        rank: req.user.totalWagered,
        walletAddress: req.body.connectedAccount,
        oldAbsoluteShares: 0,
        newAbsoluteShares: buyerShares,
      });
    } else {
      oldHosts[existingHostIndex].newAbsoluteShares += buyerShares;
    }

    const newTotalShareSupply = totalShareSupply + mintedShares;

    oldHosts.forEach((h) => {
      const fraction = h.newAbsoluteShares / newTotalShareSupply;
      h.share = fraction * 100;
    });

    const sumPct = oldHosts.reduce((acc, h) => acc + h.share, 0);
    if (sumPct > 0) {
      const factor = 100 / sumPct;
      oldHosts.forEach((h) => (h.share *= factor));
    }

    room.hosts = oldHosts.map((h) => ({
      host: h.host,
      share: h.share,
      accessory: h.accessory,
      elite: h.elite,
      username: h.username,
      avatar: h.avatar,
      rank: h.rank,
      walletAddress: h.walletAddress,
    }));

    room.user_bet = newLiquidity;
    room.host_pr += netDeposit;
    room.updated_at = moment(new Date()).format('YYYY-MM-DD HH:mm');

    let pool_id = '';
    // Fetch GameType ID for GameLog later if needed
    let gameTypeIdForLog = null;
    if (room.game_type && room.game_type.length > 0) {
      // Assuming the first tag is the primary one for logging purposes
      const primaryGameTypeTag = room.game_type[0];
      const gameTypeDoc = await GameType.findOne({ game_type_name: primaryGameTypeTag.toLowerCase() }).select('_id');
      if (gameTypeDoc) {
        gameTypeIdForLog = gameTypeDoc._id;
      } else {
        console.warn(`GameType document not found for tag: ${primaryGameTypeTag}. GameLog may have missing type.`);
        // Consider defaulting to a generic GameType _id or handling this as an error.
      }
    }


    if (room.user_bet >= room.endgame_amount) {
      try {
        room.status = 'finished';
        if (req.io.sockets) {
          req.io.sockets.emit('ROOM_ENDED', { roomId: room._id });
        }
        await saveDocumentWithRetry(room); // Save room status change before minting

        const myMintPk = await mintTokenWithMetadata(room);
        const realBasePublicKey = new PublicKey(myMintPk);

        await setTimeout(15000);

        const wsolMintPk = new PublicKey('So11111111111111111111111111111111111111112');
        await setTimeout(10000);

        const marketId = await createMarket(realBasePublicKey, wsolMintPk);
        await setTimeout(15000);

        const ammId = await createAmmPool(marketId);
        console.log('Pool creation ammId:', ammId);

        await setTimeout(20000);

        await distributeTokens(realBasePublicKey, room.hosts);
        await setTimeout(10000);

        const revokeTx = await revokeMintAndFreezeAuthorities(realBasePublicKey);
        pool_id = ammId.toBase58();
      } catch (e) {
        console.error('Error in endgame process (minting/pooling):', e);
        pool_id = '';
      }

      const newGameLogC = new GameLog({
        room: room._id,
        creator: room.creator,
        joined_user: room.creator,
        game_type: gameTypeIdForLog, // Use the fetched GameType ID
        bet_amount: room.host_pr,
        user_bet: room.user_bet,
        hosts: room.hosts,
        endgame_amount: room.endgame_amount,
        game_result: 3,
      });

      if (pool_id) {
        room.pool_id = pool_id;
      }

      // Save newGameLogC even if pool_id failed, as it's a log of the outcome
      saveDocumentWithRetry(newGameLogC);
    }

    const message = `Pumped ${room.name}`;

    const tempNotification = new Notification({
      from: req.user._id,
      to: req.user._id,
      room: room._id,
      amount: -amountAfterFee,
      message,
      is_read: false,
    });

    const notificationData = {
      _id: req.user._id,
      message,
      username: req.user.username,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
      elite: req.user.elite,
      room: room._id,
      rank: req.user.totalWagered,
      amount: -amountAfterFee,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      is_read: false,
    };

    const timeBucket = Math.floor(new Date(now).getTime() / (60 * 1000));
    const newCandle = {
      _id: timeBucket,
      open: oldLiquidity,
      close: newLiquidity,
      high: Math.max(newLiquidity, oldLiquidity),
      low: Math.min(newLiquidity, oldLiquidity),
      volume: netDeposit,
      buyVolume: netDeposit,
      sellVolume: 0,
      startTime: new Date(timeBucket * 60 * 1000),
    };

    const newGameLog = new GameLog({
      room: room._id,
      creator: req.user._id,
      joined_user: null, // Joined user is null for pump action
      game_type: gameTypeIdForLog, // Use the fetched GameType ID
      bet_amount: netDeposit,
      selected_rps: '', // Specific to RPS, might not be relevant for pump
      ai_mode: '', // Might not be relevant for pump
      commission: 0, // Commission is handled separately
      game_result: 444, // Custom result for pump action
      winnings: 0, // No direct winnings for pump
      endgame_amount: netDeposit, // Assuming this means amount contributed to bankroll
      host_pr: netDeposit, // Host profit from this pump
      user_bet: 0, // User bet is 0 for pump action
      status: 'open', // Room remains open after pump unless endgame_amount is met
      hosts: room.hosts,
    });

    try {
      await newGameLog.save();
      const gameLogQuery = GameLog.find({ room: room._id })
        .sort({ created_at: 'desc' })
        .limit(1)
        .populate({
          path: 'room',
          model: Room,
          select: '_id winnings ticker image creator status hosts room_number bet_amount user_bet host_pr created_at name', // Include `name` and ensure `game_type` is not populated
        })
        .populate({
          path: 'game_type',
          model: GameType,
          select: 'short_name game_type_name',
        })
        .populate({
          path: 'creator',
          model: User,
          select: '_id avatar username accessory elite totalWagered',
        })
        .populate({
          path: 'joined_user',
          model: User,
          select: '_id avatar username accessory elite totalWagered',
        });

      const gameLogList = await gameLogQuery;
      const newLog = await convertGameLogToHistoryStyle(gameLogList);

      await Promise.all([
        saveDocumentWithRetry(tempNotification),
        saveDocumentWithRetry(room), // Save room changes after all updates are done
        saveDocumentWithRetry(req.user),
      ]);

      if (socket) {
        socket.sendNotification(req.user._id, notificationData);
      }

      if (req.io?.sockets) {
        const payload = {
          bankroll: newLiquidity,
          host_pr: room.host_pr,
          newLog,
          room: room._id,
          user: req.user,
          hosts: room.hosts,
        };

        if (pool_id) {
          payload.pool_id = pool_id;
        }

        req.io.sockets.emit(`UPDATED_BANKROLL_${room._id}`, payload);
        req.io.sockets.emit('NEW_LOG', { newLog });
        req.io.sockets.emit(`NEW_CANDLE_${room._id}`, { newCandle });
      }

      return res.json({
        success: true,
        balance: req.user.balance,
      });
    } catch (error) {
      console.error('Error saving game log and emitting:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to complete pump action due to a logging/emission error.',
      });
    }
  } catch (error) {
    console.error('ERROR in pump:', error);
    return res.status(500).json({
      success: false,
      message: 'FAILED TO INITIATE PUMP',
    });
  }
});

router.post('/jeet', auth, async (req, res) => {
  try {
    if (!req.body.walletAddress || !req.user.accounts || !req.user.accounts.includes(req.body.walletAddress)) {
      return res.json({
        success: false,
        message: 'Connected account is missing or not authorized.',
      });
    }

    if (req.user.isWithdrawing) {
      return res.json({
        success: false,
        error: 'WITHDRAWAL IN PROGRESS. Please wait until it completes.'
      });
    }

    const accessAllowed = await check_access_time(req.user._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000,
      });
    }

    const now = moment().format('LLL');
    const userId = req.user._id;
    const roomId = req.body.room_id;

    let sellShares = parseFloat(req.body.stake_amount);
    if (isNaN(sellShares) || sellShares <= 0) {
      return res.json({ success: false, message: 'Invalid sell share amount' });
    }

    const roomInfo = await Room.findOne({ _id: roomId })
      .populate({ path: 'creator', model: User })
      .select(
        'status hosts user_bet name host_pr pr bet_amount room_number game_type updated_at total_share_supply',
      );

    if (!roomInfo) {
      return res.json({ success: false, message: 'Room not found' });
    }

    if (roomInfo.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS NOW ENDED',
      });
    }

    const fiveHundredMsAgo = new Date(Date.now() - 500);
    if (roomInfo.updated_at > fiveHundredMsAgo) {
      return res.json({
        success: false,
        message: 'ROOM TOO BUSY, TRY AGAIN LATER',
        betResult: -1200,
      });
    }

    const hostIndex = roomInfo.hosts.findIndex((host) =>
      host.host.equals(userId),
    );
    if (hostIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not a host of this room',
      });
    }

    const commissionDoc = await System.findOne({ name: 'commission' });
    const commissionPercentage = commissionDoc?.value || 0;

    const oldLiquidity = parseFloat(roomInfo.user_bet) || 0;

    let totalShareSupplyDB = roomInfo.total_share_supply || 0;
    if (totalShareSupplyDB < 1e-9) {
      totalShareSupplyDB = oldLiquidity;
    }

    const oldHosts = roomInfo.hosts.map((host) => {
      const absShares = (host.share / 100) * totalShareSupplyDB;
      return { ...host.toObject(), absShares };
    });

    const seller = oldHosts[hostIndex];
    if (sellShares > seller.absShares + 1e-9) {
      return res.json({
        success: false,
        message: `You cannot sell ${sellShares.toFixed(
          2,
        )} shares; you only have ${seller.absShares.toFixed(2)} shares.`,
      });
    }

    const valueBeforeFee = sellShares * (oldLiquidity / totalShareSupplyDB);
    const fee = valueBeforeFee * (commissionPercentage / 100);
    const amountAfterFee = valueBeforeFee - fee;

    await System.findOneAndUpdate(
      { name: 'platform_trading' },
      { $inc: { value: fee } },
    );

    seller.newAbsShares = seller.absShares - sellShares;

    const shockRatio = 0.1;
    oldHosts.forEach((host, idx) => {
      if (idx !== hostIndex) {
        host.newAbsShares = host.absShares * (1 - shockRatio);
      }
    });

    let newTotalShareSupply = oldHosts.reduce(
      (acc, host) => acc + (host.newAbsShares || 0),
      0,
    );

    const newLiquidity = oldLiquidity - amountAfterFee;

    oldHosts.forEach((host) => {
      host.share =
        newTotalShareSupply > 0
          ? (host.newAbsShares / newTotalShareSupply) * 100
          : 0;
    });

    const sumPct = oldHosts.reduce((acc, host) => acc + host.share, 0);
    if (sumPct > 0) {
      const factor = 100 / sumPct;
      oldHosts.forEach((host) => (host.share *= factor));
    }

    roomInfo.hosts = oldHosts.map((host) => ({
      host: host.host,
      share: host.share,
      accessory: host.accessory,
      elite: host.elite,
      username: host.username,
      avatar: host.avatar,
      rank: host.rank,
      walletAddress: host.walletAddress || req.body.walletAddress,
    }));

    roomInfo.user_bet = newLiquidity;
    roomInfo.total_share_supply = newTotalShareSupply;
    roomInfo.host_pr = Math.max(roomInfo.host_pr - amountAfterFee, 0);
    roomInfo.updated_at = moment(new Date()).format('YYYY-MM-DD HH:mm');

    req.user.totalTraded += valueBeforeFee;
    req.user.tradingProfit += amountAfterFee;

    if (amountAfterFee > 0 && req.body.walletAddress) {
      const depositTransaction = await GameTransanction.findOne({
        user: req.user._id,
        room: roomId,
        status: { $in: ['pending', 'completed'] },
        description: { $regex: '^(Pumped|Created)', $options: 'i' }, // Include 'Created' if initial room creation also counts as deposit
      });

      if (!depositTransaction) {
        console.warn(
          `No valid prior deposit (pending or completed) for user ${req.user._id}, room ${roomId}`
        );
        return res.json({ // Return here instead of throw
          success: false,
          message:
            'No valid SOL deposit found for this room. Please ensure you have a prior stake.',
          betResult: -1000,
        });
      }

      try {
        const address = req.body.walletAddress.trim();
        new PublicKey(address);
      } catch (error) {
        console.error("PublicKey error:", error.message);
        return res.json({ // Return here instead of throw
          success: false,
          message: 'Invalid Solana wallet address',
        });
      }

      const newGameTransaction = new GameTransanction({
        user: req.user._id,
        amount: amountAfterFee,
        description: `Jeeted ${roomInfo.name}`,
        room: roomId,
        room_name: roomInfo.name,
        status: 'pending',
        connectedAccount: req.body.walletAddress,
      });
      await saveDocumentWithRetry(newGameTransaction);
    }

    const timeBucket = Math.floor(new Date(now).getTime() / (60 * 1000));
    const newCandle = {
      _id: timeBucket,
      open: oldLiquidity,
      close: newLiquidity,
      high: Math.max(oldLiquidity, newLiquidity),
      low: Math.min(oldLiquidity, newLiquidity),
      volume: valueBeforeFee,
      buyVolume: 0,
      sellVolume: valueBeforeFee,
      startTime: new Date(timeBucket * 60 * 1000),
    };

    let gameTypeIdForLog = null;
    if (roomInfo.game_type && roomInfo.game_type.length > 0) {
      const primaryGameTypeTag = roomInfo.game_type[0];
      const gameTypeDoc = await GameType.findOne({ game_type_name: primaryGameTypeTag.toLowerCase() }).select('_id');
      if (gameTypeDoc) {
        gameTypeIdForLog = gameTypeDoc._id;
      } else {
        console.warn(`GameType document not found for tag: ${primaryGameTypeTag}. GameLog may have missing type.`);
      }
    }

    const newGameLog = new GameLog({
      room: roomInfo._id,
      creator: req.user._id,
      joined_user: null,
      game_type: gameTypeIdForLog, // Use the fetched GameType ID
      bet_amount: amountAfterFee,
      selected_rps: '',
      ai_mode: '',
      commission: 0,
      game_result: 666,
      winnings: amountAfterFee,
      endgame_amount: amountAfterFee,
      host_pr: 0,
      user_bet: -amountAfterFee,
      status: 'open',
      hosts: roomInfo.hosts,
    });

    await newGameLog.save();

    let gameLogQuery = GameLog.find({ room: roomInfo._id })
      .sort({ created_at: 'desc' })
      .limit(1)
      .populate({
        path: 'room',
        model: Room,
        select: '_id winnings ticker image creator status hosts room_number bet_amount user_bet host_pr created_at name',
      })
      .populate({
        path: 'game_type',
        model: GameType,
        select: 'short_name game_type_name',
      })
      .populate({
        path: 'creator',
        model: User,
        select: '_id avatar username accessory elite totalWagered',
      })
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id avatar username accessory elite totalWagered',
      });

    const gameLogList = await gameLogQuery;
    const newLog = await convertGameLogToHistoryStyle(gameLogList);

    const recipientId = userId.toString();
    const message = `Jeeted ${roomInfo.name}`;

    const tempNotification = new Notification({
      from: userId,
      to: recipientId,
      room: roomInfo._id,
      amount: amountAfterFee,
      message,
      is_read: false,
    });

    const notificationData = {
      _id: recipientId,
      message,
      username: req.user.username,
      avatar: req.user.avatar,
      amount: amountAfterFee,
      accessory: req.user.accessory,
      elite: req.user.elite,
      room: roomInfo._id,
      rank: req.user.totalWagered,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      is_read: false,
    };

    await Promise.all([
      saveDocumentWithRetry(tempNotification),
      saveDocumentWithRetry(roomInfo),
      saveDocumentWithRetry(req.user),
    ]);

    if (socket) {
      socket.sendNotification(recipientId, notificationData);
    }

    if (req.io?.sockets) {
      req.io.sockets.emit(`UPDATED_BANKROLL_${roomInfo._id}`, {
        bankroll: newLiquidity,
        host_pr: roomInfo.host_pr,
        newLog,
        room: roomInfo._id,
        user: req.user,
        hosts: roomInfo.hosts,
      });
      req.io.sockets.emit('NEW_LOG', {
        newLog,
      });
      req.io.sockets.emit(`NEW_CANDLE_${roomInfo._id}`, {
        newCandle,
      });
    }

    return res.json({
      success: true,
      balance: req.user.balance,
    });
  } catch (err) {
    console.error('ERROR in jeet endpoint:', err);
    return res.json({
      success: false,
      message: 'Failed to process unstake request',
    });
  }
});

router.get('/my_chat', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const messages1 = await Message.find({ from: userId }).populate({
      path: 'to',
      model: User,
    });
    const messages2 = await Message.find({ to: userId }).populate({
      path: 'from',
      model: User,
    });

    const myChat = {};

    for (let message of messages1) {
      if (
        message.to &&
        (!myChat[message.to._id] ||
          myChat[message.to._id].updated_at < message.updated_at)
      ) {
        myChat[message.to._id] = {
          ...myChat[message.to._id],
          _id: message.to._id,
          message: message.message,
          username: message.to.username,
          avatar: message.to.avatar,
          accessory: message.to.accessory,
          elite: message.to.elite,
          rank: message.to.totalWagered,
          created_at: message.created_at,
          created_at_str: moment(message.created_at).format('LLL'),
          updated_at: message.updated_at,
          unread_message_count: 0,
        };
      }
    }

    for (let message of messages2) {
      if (message.from && message.from._id === message.to) {
        continue;
      }

      if (
        message.from &&
        (!myChat[message.from._id] ||
          myChat[message.from._id].updated_at < message.updated_at)
      ) {
        myChat[message.from._id] = {
          ...myChat[message.from._id],
          _id: message.from._id,
          message: message.message,
          username: message.from.username,
          avatar: message.from.avatar,
          accessory: message.from.accessory,
          elite: message.from.elite,
          rank: message.from.totalWagered,
          created_at: message.created_at,
          created_at_str: moment(message.created_at).format('LLL'),
          updated_at: message.updated_at,
        };
      }

      if (message.from && !myChat[message.from._id].unread_message_count) {
        myChat[message.from._id].unread_message_count = 0;
      }

      if (message.from && !message.is_read) {
        myChat[message.from._id].unread_message_count++;
      }
    }

    res.json({
      success: true,
      myChat,
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err,
    });
  }
});

// routes/game.js

router.post('/mark_chat_as_read', auth, async (req, res) => {
  try {
    // Mark all messages from "req.body.fromId" to the current user (req.user._id) as read
    await Message.updateMany(
      {
        from: new ObjectId(req.body.fromId),
        to: req.user._id,
        is_read: false,
      },
      { $set: { is_read: true } },
    );

    // Return success
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err.toString(),
    });
  }
});

router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ to: userId })
      .populate([
        {
          path: 'from',
          model: User,
          select: 'username avatar accessory elite totalWagered',
        },
      ])
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      notifications: notifications.map((notification) => ({
        _id: notification.from._id,
        message: notification.message,
        username: notification.from.username,
        avatar: notification.from.avatar,
        accessory: notification.from.accessory,
        elite: notification.from.elite,
        room: notification.room,
        rank: notification.from.totalWagered,
        created_at: notification.created_at,
        created_at_str: moment(notification.created_at).format('LLL'),
        updated_at: notification.updated_at,
        amount: notification.amount ? notification.amount : 0,
        is_read: notification.is_read,
      })),
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
});

router.patch('/read_notifications', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ to: userId })
      .sort({ created_at: -1 })
      .limit(10);

    const notificationIds = notifications.map(
      (notification) => notification._id,
    );
    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $set: { is_read: true } },
    );
    res.json({
      success: true,
      message: 'Most recent notifications marked as read successfully.',
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
});

router.post('/get_chat_room_info', auth, async (req, res) => {
  try {
    const { user_id, offset = 0, limit = 20 } = req.body;

    const user = await User.findOne({ _id: new ObjectId(user_id) });

    // 1) Query messages sorted by newest first:
    let chatLogs = await Message.find({
      $or: [
        { from: new ObjectId(user_id), to: new ObjectId(req.user._id) },
        { from: new ObjectId(req.user._id), to: new ObjectId(user_id) },
      ],
    })
      .sort({ created_at: -1 }) // newest -> oldest
      .skip(Number(offset)) // how many to skip
      .limit(Number(limit)); // how many to retrieve

    // 2) Reverse so we end up with oldest -> newest in the final array
    //    (because we sorted descending above)
    chatLogs = chatLogs.reverse();

    // 3) Transform them for the response
    const messages = chatLogs.map((chatLog) => ({
      from: chatLog.from,
      to: chatLog.to,
      message: chatLog.message,
      created_at: moment(chatLog.created_at).format('MM-DD-YYYY HH:mm:ss'),
    }));

    // Check if there are more older messages
    // We do that by counting total docs (or using .countDocuments())
    const totalCount = await Message.countDocuments({
      $or: [
        { from: new ObjectId(user_id), to: new ObjectId(req.user._id) },
        { from: new ObjectId(req.user._id), to: new ObjectId(user_id) },
      ],
    });
    // If offset+limit >= totalCount, there are no more older messages
    const hasMore = offset + limit < totalCount;

    res.json({
      success: true,
      chatRoomInfo: {
        user_id: user._id,
        accessory: user.accessory,
        elite: user.elite,
        avatar: user.avatar,
        rank: user.totalWagered,
        username: user.username,
        chatLogs: messages,
        hasMore,
      },
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err,
    });
  }
});

const getTimeBucket = (timeRange) => {
  switch (timeRange) {
    case '1m':
      return 1;
    case '15m':
      return 15;
    case '4h':
      return 4 * 60;
    case '24h':
      return 24 * 60;
    default:
      return 1;
  }
};
router.post('/getGlobalChatLogs', async (req, res) => {
  try {
    const redisClient = req.app.get('redisClient');
    const cacheKey = 'global:chat:logs';

    let chatLogs = null;
    let fromCache = false;

    // Step 1: Try to get from Redis cache first
    try {
      const cachedLogs = await redisClient.get(cacheKey);
      if (cachedLogs) {
        chatLogs = JSON.parse(cachedLogs);
        fromCache = true;
      }
    } catch (redisErr) {
      console.error('Redis error during chat fetch:', redisErr);
    }

    // Step 2: If not in cache, fetch from database
    if (!chatLogs) {
      const results = await Chat.find({})
        .sort({ created_at: -1 })
        .limit(15)
        .select('sender message messageType messageContent created_at replyTo')
        .populate({
          path: 'sender',
          select: 'username avatar accessory elite totalWagered _id',
          options: { lean: true }
        })
        .populate({
          path: 'replyTo',
          select: 'sender message messageType created_at',
          populate: {
            path: 'sender',
            select: 'username avatar accessory elite totalWagered _id',
            options: { lean: true }
          },
          options: { lean: true }
        })
        .lean();

      chatLogs = results.map(chat => ({
        sender: chat.sender?.username || '',
        senderId: chat.sender?._id || '',
        message: chat.message,
        messageType: chat.messageType,
        messageContent: chat.messageContent,
        avatar: chat.sender?.avatar || '',
        accessory: chat.sender?.accessory || '',
        elite: chat.sender?.elite || false,
        rank: chat.sender?.totalWagered || '',
        time: moment(chat.created_at).format('hh:mm'),
        replyTo: chat.replyTo?.[0] ? {
          username: chat.replyTo[0].sender?.username || '',
          senderId: chat.replyTo[0].sender?._id || '',
          avatar: chat.replyTo[0].sender?.avatar || '',
          rank: chat.replyTo[0].sender?.totalWagered || '',
          accessory: chat.replyTo[0].sender?.accessory || '',
          elite: chat.replyTo[0].sender?.elite || false,
          message: chat.replyTo[0].message,
          messageType: chat.replyTo[0].messageType,
          time: moment(chat.replyTo[0].created_at).format('hh:mm')
        } : null
      })).reverse();

      // Step 3: Cache the processed chat logs for 2 minutes
      try {
        await redisClient.setEx(cacheKey, 120, JSON.stringify(chatLogs));
      } catch (redisErr) {
        console.error('Failed to cache global chat:', redisErr);
      }
    }

    return res.json({
      success: true,
      chatLogs,
      cached: fromCache
    });

  } catch (error) {
    console.error('Error fetching global chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching global chat'
    });
  }
});

router.get('/candles/:room', async (req, res) => {
  try {
    const room = req.params.room;
    const { timeRange = '1m' } = req.query;
    const bucketSize = getTimeBucket(timeRange);

    const roomData = await Room.findById(room);
    const user_bet = parseFloat(roomData.user_bet);
    if (isNaN(user_bet)) {
      console.error(`[ERROR] Invalid liquidity (user_bet) for room: ${room}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid liquidity value.',
      });
    }

    let transactions = await GameTransanction.find({ room: room }).sort({
      updated_at: 1,
    });
    // Start liquidity at 0 so the first candle open is 0.
    let previousLiquidity = 0;
    const finalCandles = [];
    const candleMap = new Map(); // Map to group transactions by minute

    transactions.forEach((transaction) => {
      const transactionTime = moment(transaction.created_at)
        .startOf('minute')
        .toISOString();
      const transactionAmount = -transaction.amount;

      // If no candle exists for this minute, create one
      if (!candleMap.has(transactionTime)) {
        candleMap.set(transactionTime, {
          _id: `candle_${transactionTime}`,
          open: previousLiquidity,
          high: previousLiquidity,
          low: previousLiquidity,
          close: previousLiquidity,
          volume: 0,
          buyVolume: 0,
          sellVolume: 0,
          startTime: transaction.created_at,
        });
      }

      // Update the existing candle for this minute
      const currentCandle = candleMap.get(transactionTime);
      previousLiquidity += transactionAmount;
      currentCandle.high = Math.max(currentCandle.high, previousLiquidity);
      currentCandle.low = Math.min(currentCandle.low, previousLiquidity);
      currentCandle.close = previousLiquidity;
      currentCandle.volume += Math.abs(transactionAmount);
      if (transactionAmount > 0) {
        currentCandle.buyVolume += transactionAmount;
      } else {
        currentCandle.sellVolume += Math.abs(transactionAmount);
      }
    });

    finalCandles.push(
      ...Array.from(candleMap.values()).sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime),
      ),
    );

    const transactionData = transactions.map((transaction) => ({
      description: transaction.description,
      amount: transaction.amount,
      created_at: transaction.created_at,
    }));

    res.json({
      success: true,
      candles: finalCandles,
      transactions: transactionData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      err: err.message,
    });
  }
});

router.post('/editPayout', auth, async (req, res) => {
  try {
    const rowId = req.body.rowId;
    const room = await Room.findOne({ _id: rowId });

    const gameType = await GameType.findOne({ _id: room.game_type });

    if (!room) {
      return res.json({
        success: false,
        message: 'ROOM NOT FOUND',
      });
    }

    if (room.status !== 'open') {
      return res.json({
        success: false,
        message: 'THIS GAME HAS ENDED ALREADY',
      });
    }

    const now = moment().format('LLL');
    const payoutAmount = parseFloat(req.body.amount);

    if (isNaN(payoutAmount) || payoutAmount < 0) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!',
      });
    }
    if (payoutAmount < parseFloat(room.user_bet)) {
      return res.json({
        success: false,
        message: 'PAYOUT TOO LOW! MINIMUM IS BANKROLL',
      });
    }

    room.endgame_amount = payoutAmount;
    if (room.endgame_amount === 0) {
      room.endgame_type = false;
    } else {
      room.endgame_type = true;
    }
    try {
      await Promise.all([
        saveDocumentWithRetry(room),
        saveDocumentWithRetry(req.user),
      ]);
    } catch (error) {
      console.error('Error saving documents:', error);
    }

    return res.json({
      success: true,
      message: 'PAYOUT SETTINGS HAVE BEEN CHANGED.',
    });
  } catch (e) {
    console.log('ERROR in payout_request', e);
    return res.json({
      success: false,
      message: 'FAILED TO INITIATE PAYOUT SETTINGS',
    });
  }
});

router.post('/tip', auth, async (req, res) => {
  try {
    const { addressTo, amount, message, txtHash, prepare, senderWallet } = req.body;
    const tipAmount = parseFloat(amount);

    // Validate input
    if (!addressTo || isNaN(tipAmount) || tipAmount <= 0) {
      console.error('Invalid input:', { addressTo, amount });
      return res.json({ success: false, message: 'Invalid input: addressTo and amount are required' });
    }

    // Find sender and recipient
    const userToTip = await User.findOne({ _id: addressTo });
    if (!userToTip) {
      console.error('Recipient not found:', addressTo);
      return res.json({ success: false, message: 'Recipient user not found' });
    }

    if (req.user.username.includes('BOT')) {
      return res.json({ success: false, message: 'Bots cannot send tips' });
    }
    if (req.user.isWithdrawing) {
      return res.json({ success: false, message: 'Withdrawal in progress' });
    }
    if (req.user.dailyWithdrawals > 4.269) {
      return res.json({ success: false, message: 'Daily tip limit exceeded' });
    }

    if (!userToTip.accounts || userToTip.accounts.length === 0) {
      console.error('Recipient has no accounts:', addressTo);
      return res.json({ success: false, message: 'Recipient wallet not connected' });
    }

    const recipientWallet = userToTip.accounts[0];
    console.log('Recipient wallet:', recipientWallet);

    // Initialize Solana connection
    const providerUrl = process.env.PROVIDER_URL;
    if (!providerUrl || typeof providerUrl !== 'string' || !providerUrl.startsWith('http')) {
      console.error('Invalid PROVIDER_URL:', providerUrl);
      return res.json({ success: false, message: 'Invalid Solana provider URL configuration' });
    }
    console.log('Provider URL:', providerUrl);
    const connection = new Connection(providerUrl, 'confirmed');

    // Handle transaction preparation
    if (prepare) {
      // Validate sender wallet
      if (!senderWallet) {
        console.error('Sender wallet not provided');
        return res.json({ success: false, message: 'Sender wallet address required' });
      }

      let senderPubkey, recipientPubkey;
      try {
        senderPubkey = new PublicKey(senderWallet);
        recipientPubkey = new PublicKey(recipientWallet);
        console.log('Sender pubkey:', senderPubkey.toBase58());
        console.log('Recipient pubkey:', recipientPubkey.toBase58());
      } catch (e) {
        console.error('Invalid wallet address:', e.message);
        return res.json({ success: false, message: `Invalid wallet address: ${e.message}` });
      }

      // Validate database balance
      req.user.balance = req.user.balance || 0;
      if (req.user.balance < tipAmount) {
        console.error('Insufficient database balance:', { userId: req.user._id, balance: req.user.balance, tipAmount });
        return res.json({ success: false, message: 'Insufficient funds in account' });
      }

      // Check sender's on-chain balance
      const senderBalance = await connection.getBalance(senderPubkey);
      const lamports = Math.floor(tipAmount * LAMPORTS_PER_SOL);
      const feeEstimate = 5000; // Approximate fee in lamports
      console.log('Sender balance (lamports):', senderBalance);
      console.log('Required lamports (initial):', lamports + feeEstimate);

      // Check recipient account status
      const recipientAccountInfo = await connection.getAccountInfo(recipientPubkey);
      console.log('Recipient account exists:', !!recipientAccountInfo);

      const transaction = new Transaction();
      let requiredLamports = lamports + feeEstimate;

      // Handle recipient account creation or funding
      const rentExemptionAmount = await connection.getMinimumBalanceForRentExemption(0);
      console.log('Rent exemption amount (lamports):', rentExemptionAmount);

      if (!recipientAccountInfo) {
        // Recipient account doesn't exist; add createAccount instruction
        requiredLamports += rentExemptionAmount;
        if (senderBalance < requiredLamports) {
          console.error('Insufficient balance for tip, fee, and account creation:', {
            senderBalance,
            required: requiredLamports,
          });
          return res.json({
            success: false,
            message: `Insufficient sender balance to create recipient account (requires ~${(requiredLamports / LAMPORTS_PER_SOL).toFixed(6)} SOL)`,
          });
        }

        transaction.add(
          SystemProgram.createAccount({
            fromPubkey: senderPubkey,
            newAccountPubkey: recipientPubkey,
            lamports: rentExemptionAmount,
            space: 0,
            programId: SystemProgram.programId,
          })
        );
      } else if (recipientAccountInfo.lamports < rentExemptionAmount) {
        // Recipient account exists but is underfunded; add funding instruction
        const additionalLamports = rentExemptionAmount - recipientAccountInfo.lamports;
        requiredLamports += additionalLamports;
        console.log('Additional lamports needed for recipient:', additionalLamports);
        if (senderBalance < requiredLamports) {
          console.error('Insufficient balance for tip, fee, and recipient funding:', {
            senderBalance,
            required: requiredLamports,
          });
          return res.json({
            success: false,
            message: `Insufficient sender balance to fund recipient account (requires ~${(requiredLamports / LAMPORTS_PER_SOL).toFixed(6)} SOL)`,
          });
        }

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: senderPubkey,
            toPubkey: recipientPubkey,
            lamports: additionalLamports,
          })
        );
      }

      // Add transfer instruction for the tip amount
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: senderPubkey,
          toPubkey: recipientPubkey,
          lamports,
        })
      );

      // Set recent blockhash and fee payer
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPubkey;
      console.log('Blockhash:', blockhash);
      console.log('Last valid block height:', lastValidBlockHeight);

      // Simulate transaction
      const simulation = await connection.simulateTransaction(transaction);
      if (simulation.value.err) {
        const errorMessage = typeof simulation.value.err === 'object' ? JSON.stringify(simulation.value.err) : simulation.value.err;
        console.error('Simulation failed:', errorMessage);
        return res.json({ success: false, message: `Transaction simulation failed: ${errorMessage}` });
      }
      console.log('Simulation logs:', simulation.value.logs);

      // Serialize transaction
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      return res.json({
        success: true,
        transaction: serializedTransaction.toString('base64'),
        blockhash,
        lastValidBlockHeight,
      });
    }

    // Handle post-confirmation processing
    if (!txtHash) {
      console.error('Transaction hash missing');
      return res.json({ success: false, message: 'Transaction hash required' });
    }

    // Verify transaction with retries
    let signatureResult;
    const maxRetries = 3;
    let retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        signatureResult = await connection.confirmTransaction(
          {
            signature: txtHash,
            blockhash: (await connection.getLatestBlockhash()).blockhash,
            lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
          },
          'confirmed',
          { timeout: 30000 }
        );
        if (signatureResult.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(signatureResult.value.err)}`);
        }
        console.log('Transaction confirmed:', txtHash);
        break;
      } catch (error) {
        retryCount++;
        console.warn(`Confirmation attempt ${retryCount} failed:`, error.message);
        if (retryCount === maxRetries) {
          console.error('Transaction verification failed after retries:', error);
          return res.json({ success: false, message: `Blockchain transaction failed: ${error.message}` });
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Check for duplicate transaction
    const usedTransactions = await GameTransanction.find({ hash: txtHash });
    if (usedTransactions.length > 0) {
      console.error('Duplicate transaction:', txtHash);
      return res.json({ success: false, message: 'Transaction already used' });
    }

    // Update database and send notifications
    const now = moment().format('LLL');
    userToTip.balance = userToTip.balance || 0;
    userToTip.balance += tipAmount;
    req.user.balance -= tipAmount;

    const newTransactionC = new GameTransanction({
      created_at: now,
      user: req.user._id,
      amount: -tipAmount,
      description: `Tipped ${userToTip.username}`,
      hash: txtHash,
    });

    const newTransactionJ = new GameTransanction({
      created_at: now,
      user: userToTip._id,
      amount: tipAmount,
      description: message ? `${message} (Tip from ${req.user.username})` : `Received Tip from ${req.user.username}`,
      hash: txtHash,
    });

    const notification = new Notification({
      from: req.user._id,
      to: userToTip._id,
      room: '',
      message: message ? `Tipped you — "${message}"` : 'Tipped you',
      amount: tipAmount,
      is_read: false,
    });

    const notificationC = new Notification({
      from: userToTip._id,
      to: req.user._id,
      room: '',
      message: message ? `You Tipped ${message}` : 'You Tipped',
      amount: -tipAmount,
      is_read: false,
    });

    const notificationData = {
      message: notification.message,
      amount: tipAmount,
      username: req.user.username,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
      elite: req.user.elite,
      rank: req.user.totalWagered,
      created_at: moment().format('YYYY-MM-DD HH:mm'),
      created_at_str: moment().format('LLL'),
      updated_at: moment().format('YYYY-MM-DD HH:mm'),
    };

    const notificationDataC = {
      message: notificationC.message,
      amount: -tipAmount,
      username: userToTip.username,
      avatar: userToTip.avatar,
      accessory: userToTip.accessory,
      elite: userToTip.elite,
      rank: userToTip.totalWagered,
      created_at: moment().format('YYYY-MM-DD HH:mm'),
      created_at_str: moment().format('LLL'),
      updated_at: moment().format('YYYY-MM-DD HH:mm'),
    };

    try {
      await Promise.all([
        saveDocumentWithRetry(userToTip),
        saveDocumentWithRetry(req.user),
        saveDocumentWithRetry(newTransactionC),
        saveDocumentWithRetry(newTransactionJ),
        saveDocumentWithRetry(notification),
        saveDocumentWithRetry(notificationC),
      ]);
      socket.sendNotification(userToTip._id, notificationData);
      socket.sendNotification(req.user._id, notificationDataC);
      console.log('Database updated and notifications sent');
    } catch (error) {
      console.error('Error saving documents or notifications:', error);
      return res.json({ success: false, message: 'Failed to save transaction data' });
    }

    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction: newTransactionC,
      message: 'Tip has been sent on the blockchain. 💸 Yipeee!',
    });
  } catch (e) {
    console.error('ERROR in tip_request:', e.message, e.stack);
    return res.json({ success: false, message: `Failed to initiate tip: ${e.message}` });
  }
});

const MAX_RETRIES = 3;

router.post('/bet3', auth, async (req, res) => {
  let retryCount = 0;
  while (retryCount < MAX_RETRIES) {
    try {
      const requestId = uuidv4();

      const [accessAllowed, betResult] = await Promise.all([
        check_access_time(req.user._id),
        executeBet3(req),
      ]);

      semaphore3 = 1;

      if (!accessAllowed) {
        const responseData = {
          success: false,
          message: 'irregular action',
          betResult: -1000,
          requestId: requestId,
        };

        return res.json(responseData);
      }

      return res.json({
        success: betResult.success,
        message: betResult.message,
        betResult: betResult.betResult,
        newTransaction: betResult.newTransaction,
        roomStatus: betResult.roomStatus,
        pool_id: betResult.pool_id,
        requestId: requestId,
      });
    } catch (err) {
      console.error(`Error occurred on attempt ${retryCount + 1}:`, err);
      retryCount++; // Increment retry count

      semaphore3 = 1;

      if (retryCount === MAX_RETRIES) {
        console.error('Max retry limit reached');
        return res
          .status(500)
          .json({ success: false, message: 'Internal Server Error' });
      }
      console.log(`Retrying after a delay...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
});

router.post('/checkTokens', auth, async (req, res) => {
  const connectedWallets = req.user.accounts;
  const available = await getUserTokens(connectedWallets);
  return res.json({
    status: available,
  });
});

router.get('/recent-transactions', async (req, res) => {
  try {
    const { descriptionPrefix } = req.query;

    const transactions = await GameTransanction.find({
      description: { $regex: `^${descriptionPrefix}`, $options: 'i' },
    })
      .sort({ created_at: -1 })
      .limit(4)
      .populate({
        path: 'user',
        model: User,
        select: 'avatar username totalWagered accessory elite _id',
      });

    res.json({
      success: true,
      transactions,
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
