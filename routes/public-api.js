// routes/public-api.js - Public API routes for external access
const express = require('express');
const { apiAuth, requirePermission, createApiRateLimit } = require('../middleware/apiAuth');
const Room = require('../model/Room');
const GameType = require('../model/GameType');
const User = require('../model/User');
const GameLog = require('../model/GameLog');
const System = require('../model/SystemSetting');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const { OpenAI } = require('openai');
// Instead of Configuration/OpenAIApi, we create an instance of OpenAI directly:
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = express.Router();

// Apply rate limiting to all public API routes
router.use(createApiRateLimit(3600000, 10)); // 10 requests per hour
router.use(createApiRateLimit(86400000, 100)); // 100 requests per day

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


// API info endpoint
router.get('/info', (req, res) => {
  console.log('📋 API Info endpoint called');
  console.log('Request headers:', req.headers);

  res.json({
    success: true,
    api: {
      name: 'Game Creation API',
      version: '1.0.0',
      endpoints: {
        'POST /create-room': 'Create a new game room with AI-generated React code, optional image generation, and mandatory blockchain deposit'
      },
      authentication: 'API Key required in X-API-Key header',
      rateLimit: {
        default: '100 requests/hour, 1000 requests/day',
        customizable: true
      }
    }
  });
});

// Create room via API (with mandatory React generation, optional image generation, and mandatory Web3 deposit)
router.post('/create-room', apiAuth, requirePermission('create_room'), async (req, res) => {
  console.log('🎮 CREATE ROOM API CALLED');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User authenticated:', !!req.user);
  console.log('User details:', {
    id: req.user?._id,
    username: req.user?.username,
    elite: req.user?.elite,
    balance: req.user?.balance,
    isWithdrawing: req.user?.isWithdrawing
  });
  console.log('API Key info:', {
    keyId: req.apiKey?.keyId,
    permissions: req.apiKey?.permissions,
    usageCount: req.apiKey?.usageCount
  });
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      // Required fields
      bet_amount,
      connectedAccount, // Web3 wallet address
      privateKey, // Required for automated signing
      reactPrompt, // Required for React generation
    
      // Optional fields (name can be extracted from generated code)
      name: providedName, // Rename to avoid confusion
      imageUrls = [],
      ticker: originalTicker,
      description: originalDescription = '',
      tax = 0,
      telegram_link = '',
      x_link = '',
      website_link = '',
      is_private = false,
      endgame_amount,
      endgame_type,
      room_password = '',
    
      // Image generation options
      generateImage = true,
      imageSize = '1024x1024',
      imageQuality = 'standard'
    } = req.body;

    console.log('🔍 VALIDATION STARTING');

    let ticker = originalTicker;
    let description = originalDescription;

    // Validation - Required fields
    const user_bet = parseFloat(bet_amount);
    console.log('Parsed bet amount:', user_bet);

    if (user_bet <= 0 || user_bet < 0.001) {
      console.log('❌ Invalid bet amount:', user_bet);
      return res.status(400).json({
        success: false,
        error: 'Invalid bet amount. Minimum is 0.001 SOL'
      });
    }

    if (!connectedAccount) {
      console.log('❌ Missing connected account');
      return res.status(400).json({
        success: false,
        error: 'Connected wallet address required'
      });
    }

    if (!privateKey) {
      console.log('❌ Missing private key');
      return res.status(400).json({
        success: false,
        error: 'Private key is required for automated deposit'
      });
    }

    if (!reactPrompt) {
      console.log('❌ Missing React prompt');
      return res.status(400).json({
        success: false,
        error: 'React prompt is required for game generation'
      });
    }

    console.log('✅ Basic validation passed');

    // Check user permissions
    console.log('🔒 CHECKING USER PERMISSIONS');
    console.log('User elite status:', req.user.elite);
    console.log('User isWithdrawing:', req.user.isWithdrawing);

    if (req.user.elite === '') {
      console.log('❌ User is not elite member');
      return res.status(403).json({
        success: false,
        error: 'Game creation is only for elite members'
      });
    }

    if (req.user.isWithdrawing) {
      console.log('❌ User is withdrawing');
      return res.status(400).json({
        success: false,
        error: 'Cannot create room while withdrawal is in progress'
      });
    }

    console.log('✅ User permissions validated');

    // Handle blockchain deposit FIRST - before any other operations
    console.log('💰 HANDLING MANDATORY DEPOSIT');

    let depositResult = { success: true, txHash: null };

    // Check blockchain wallet balance first
    console.log('💳 Checking blockchain wallet balance...');
    try {
      const walletBalance = await checkWalletBalance(connectedAccount);
      console.log('Wallet balance:', walletBalance, 'SOL');
      console.log('Required amount:', user_bet, 'SOL');

      if (walletBalance < user_bet) {
        console.log('❌ Insufficient wallet balance');
        return res.status(400).json({
          success: false,
          error: `Insufficient wallet balance. Required: ${user_bet} SOL, Available: ${walletBalance} SOL`
        });
      }
      console.log('✅ Wallet balance sufficient');
    } catch (balanceError) {
      console.error('❌ Error checking wallet balance:', balanceError);
      return res.status(400).json({
        success: false,
        error: 'Failed to check wallet balance: ' + balanceError.message
      });
    }

    // Process mandatory automated deposit


    let finalImageUrl = null;
    let generatedImageInfo = null;

    if (imageUrls.length === 0 && generateImage) {
      console.log('🎨 GENERATING IMAGE FROM PROMPT');
      console.log('Image prompt (using reactPrompt):', reactPrompt);
      console.log('Image size:', imageSize);
      console.log('Image quality:', imageQuality);

      try {
        const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
        const requestedSize = validSizes.includes(imageSize) ? imageSize : '1024x1024';

        console.log('🔄 Calling OpenAI DALL-E API...');
        const imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: `Game artwork for: ${reactPrompt}`,
          n: 1,
          size: requestedSize,
          quality: imageQuality,
        });

        const dalleImageUrl = imageResponse.data[0].url;
        console.log('✅ DALL-E image generated:', dalleImageUrl);

        // Convert DALL-E image to Pinata upload
        console.log('📤 Converting DALL-E image to Pinata upload...');
        finalImageUrl = await convertDalleImageToPinata(dalleImageUrl);

        generatedImageInfo = {
          originalDalleUrl: dalleImageUrl,
          finalPinataUrl: finalImageUrl,
          prompt: reactPrompt,
          size: requestedSize,
          quality: imageQuality
        };

        console.log('✅ Image processed and uploaded to Pinata:', finalImageUrl);

      } catch (imageError) {
        console.error('❌ Image generation/upload error:', imageError);
        console.log('⚠️ Continuing without generated image');

        if (imageError.message && imageError.message.includes('content_policy_violation')) {
          console.log('Content policy violation detected for image generation');
          // Continue without image rather than failing the entire request
        }
      }
    } else if (imageUrls.length > 0) {
      // Check if provided image is from DALL-E and needs conversion
      const providedImageUrl = imageUrls[0];
      const isDalleImage = providedImageUrl.includes('oaidalleapiprodscus.blob.core.windows.net');

      if (isDalleImage) {
        console.log('📷 Converting provided DALL-E image to Pinata...');
        try {
          finalImageUrl = await convertDalleImageToPinata(providedImageUrl);
          console.log('✅ Provided DALL-E image converted and uploaded:', finalImageUrl);
        } catch (conversionError) {
          console.error('❌ Error converting provided DALL-E image:', conversionError);
          finalImageUrl = providedImageUrl; // Fallback to original URL
        }
      } else {
        finalImageUrl = providedImageUrl; // Use provided image as-is
        console.log('📷 Using provided image URL:', finalImageUrl);
      }
    }

    // Generate React code (mandatory)
    console.log('⚛️ GENERATING MANDATORY REACT COMPONENT');
    console.log('React prompt:', reactPrompt);
    console.log('Image URLs for React:', imageUrls);

    let generatedReact = null;
    let extractedInfo = null;
    let finalGameCode = '';

    try {
      const reactResult = await generateReactComponent(reactPrompt, imageUrls.length > 0 ? imageUrls : (finalImageUrl ? [finalImageUrl] : []));
      generatedReact = reactResult;
      finalGameCode = reactResult.finalApp;
      console.log('✅ React component generated successfully');
      console.log('Generated code length:', finalGameCode.length);

      // Extract room info from generated code
      extractedInfo = extractRoomInfoFromCode(finalGameCode);
      console.log('Extracted info:', extractedInfo);

      // Use extracted info if available and original fields are empty
      if (extractedInfo && extractedInfo.confidence > 0.7) {
        if (!ticker && extractedInfo.ticker) {
          ticker = extractedInfo.ticker;
          console.log('Using extracted ticker:', ticker);
        }
        if (!description && extractedInfo.description) {
          description = extractedInfo.description;
          console.log('Using extracted description:', description);
        }
      }
    } catch (reactError) {
      console.error('❌ React generation error:', reactError);
      console.error('React error stack:', reactError.stack);
      // Since React generation is mandatory, fail the request
      return res.status(500).json({
        success: false,
        error: 'Failed to generate required React component: ' + reactError.message
      });
    }

    // DETERMINE FINAL NAME - Use provided name or extract from code
    let finalName = providedName;
    if (!finalName && extractedInfo && extractedInfo.name) {
      finalName = extractedInfo.name;
      console.log('Using extracted name:', finalName);
    }

    // AUTOMATIC GAME TYPE CLASSIFICATION
    console.log('🏷️ CLASSIFYING GAME TYPES AUTOMATICALLY');
    let classifiedGameTypes = [];

    try {
      classifiedGameTypes = await classifyGameTypes(
        finalName, // Use finalName instead of undefined name
        finalGameCode,
        reactPrompt,
        description || extractedInfo?.description || ''
      );
      console.log('✅ Game types classified:', classifiedGameTypes);
    } catch (classificationError) {
      console.error('❌ Game type classification error:', classificationError);
      console.log('⚠️ Using fallback game type classification');
      classifiedGameTypes = ['casual']; // Fallback
    }

    console.log('🔐 Processing mandatory automated deposit');
    try {
      depositResult = await handleAutomatedDeposit({
        privateKey,
        amount: user_bet,
        fromAddress: connectedAccount,
        roomName: finalName // Use finalName instead of undefined name
      });
      console.log('✅ Automated deposit successful:', depositResult.txHash);
    } catch (depositError) {
      console.error('❌ Automated deposit failed:', depositError);
      return res.status(400).json({
        success: false,
        error: 'Mandatory deposit failed: ' + depositError.message,
        details: depositError
      });
    }

    // Calculate fees and create room
    console.log('🧮 CALCULATING FEES');
    const commissionDoc = await System.findOne({ name: 'commission' });
    const commissionPercentage = commissionDoc?.value || 5;
    const fee = user_bet * (commissionPercentage / 100);
    const amountAfterFee = user_bet - fee;

    console.log('Commission percentage:', commissionPercentage);
    console.log('Fee amount:', fee);
    console.log('Amount after fee:', amountAfterFee);

    const roomCount = await Room.countDocuments({});
    const room_number = roomCount + 1;
    console.log('Room count:', roomCount);
    console.log('New room number:', room_number);

    // Create room object
    console.log('🏗️ CREATING ROOM OBJECT');
    const hostObj = {
      host: req.user._id,
      avatar: req.user.avatar,
      username: req.user.username,
      accessory: req.user.accessory,
      elite: req.user.elite,
      rank: req.user.totalWagered,
      share: 100,
      stake: amountAfterFee,
      walletAddress: connectedAccount,
    };
    console.log('Host object:', hostObj);

    const newRoom = new Room({
      creator: req.user._id,
      room_password,
      bet_amount: amountAfterFee,
      is_private,
      battles: 0,
      hosts: [hostObj],
      game_type: classifiedGameTypes,
      user_bet: amountAfterFee,
      tax,
      name: finalName, // Use finalName instead of undefined name
      image: finalImageUrl,
      ticker: ticker || finalName.substring(0, 6).toUpperCase(), // Use finalName for ticker fallback
      x_link,
      gameCode: finalGameCode,
      prompt: reactPrompt,
      telegram_link,
      website_link,
      pr: 0,
      total_stakes: amountAfterFee,
      endgame_amount: 40, // Set to 40 as requested
      endgame_type: false, // Set to false as requested
      host_pr: amountAfterFee,
      room_name: classifiedGameTypes[0].short_name + '-' + room_number,
      room_number,
      index: room_number,
      status: 'open',
      description: description || 'An exciting game room',
      gameTypes: classifiedGameTypes, // Add the automatically classified game types
    });

    console.log('New room created (not saved yet):', {
      name: newRoom.name,
      room_number: newRoom.room_number,
      ticker: newRoom.ticker,
      bet_amount: newRoom.bet_amount,
      image: newRoom.image
    });

    // Create game log
    console.log('📝 CREATING GAME LOG');
    const newGameLog = new GameLog({
      room: newRoom._id,
      creator: req.user._id,
      joined_user: req.user._id,
      game_type: classifiedGameTypes[0],
      bet_amount: amountAfterFee,
      hosts: [hostObj],
      game_result: -3000,
    });

    // Update user balance (only update stats, not actual balance since we used blockchain)
    console.log('💳 UPDATING USER STATS');
    const updatedUser = {
      updated_at: new Date(),
      totalTraded: req.user.totalTraded + Math.abs(user_bet),
      // Don't modify internal balance since we used blockchain deposit
      // balance: req.user.balance - amountAfterFee,
      // tradingProfit: req.user.tradingProfit - amountAfterFee
    };

    console.log('User stats update:', {
      totalTraded: updatedUser.totalTraded,
      txHash: depositResult.txHash
    });

    // Save all documents
    console.log('💾 SAVING TO DATABASE');
    try {
      await Promise.all([
        saveDocumentWithRetry(newGameLog),
        User.findByIdAndUpdate(req.user._id, updatedUser),
        saveDocumentWithRetry(newRoom),
        System.findOneAndUpdate(
          { name: 'platform_trading' },
          { $inc: { value: fee } }
        )
      ]);
      console.log('✅ All documents saved successfully');
    } catch (saveError) {
      console.error('❌ Database save error:', saveError);
      throw saveError;
    }

    // Prepare response
    console.log('📤 PREPARING RESPONSE');
    const response = {
      success: true,
      room: {
        id: newRoom._id,
        room_number: newRoom.room_number,
        name: newRoom.name,
        ticker: newRoom.ticker,
        bet_amount: amountAfterFee,
        status: newRoom.status,
        game_type: classifiedGameTypes[0],
        created_at: newRoom.created_at,
        gameCode: finalGameCode,
        image: finalImageUrl
      },
      deposit: depositResult,
      reactGeneration: {
        success: true,
        proxiedAssets: generatedReact.proxiedAssets
      },
      api_usage: {
        key_id: req.apiKey.keyId,
        usage_count: req.apiKey.usageCount + 1
      }
    };

    // Include image generation info if applicable
    if (generatedImageInfo) {
      response.imageGeneration = {
        success: true,
        ...generatedImageInfo
      };
      console.log('Including image generation results');
    }

    if (extractedInfo) {
      response.extractedInfo = extractedInfo;
      console.log('Including extracted info');
    }

    console.log('🎉 ROOM CREATION SUCCESSFUL');
    console.log('Response summary:', {
      roomId: response.room.id,
      roomNumber: response.room.room_number,
      roomName: response.room.name,
      hasImage: !!response.room.image,
      success: response.success
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('❌ API CREATE ROOM ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Log additional context
    console.error('Request context:', {
      userId: req.user?._id,
      apiKeyId: req.apiKey?.keyId,
      requestBody: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create room',
      message: error.message
    });
  }
});

// Helper function to generate React component
async function generateReactComponent(prompt, imageUrls = []) {
  console.log('⚛️ GENERATING REACT COMPONENT');
  console.log('Prompt:', prompt);
  console.log('Image URLs:', imageUrls);

  // Process assets similar to your existing logic
  const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
  const promptUrls = (prompt.match(urlRegex) || []).filter(url => url.length < 500);
  const allImageUrls = imageUrls.length > 0 ? imageUrls : promptUrls.filter(url => /\.(jpg|jpeg|png)$/i.test(url));
  const audioUrls = promptUrls.filter(url => /\.(mp3|wav|ogg)$/i.test(url));

  const proxiedAssets = {
    images: allImageUrls.map((url, i) => ({ key: `image${i}`, proxiedUrl: url })),
    audio: audioUrls.map((url, i) => ({ key: `audio${i}`, proxiedUrl: url })),
  };

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
- Main game container MUST use: width: "100%", height: "100%", minHeight: "600px"
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

DYNAMIC MULTIPLIER CALCULATION:
- **Casino-style games (mines, crash, slots, dice, roulette, etc.)**:
  - For mines/choice games: multiplier = (1.0 + 0.5 * (totalMines / (totalOptions - totalMines)) * Math.pow(1.3, actionsTaken)).toFixed(2)
  - For crash games: Generate crash point: multiplier = 1 / (1 - Math.pow(Math.random(), 1.5) * 0.95)
    Real-time progression: multiplier = 1 * Math.exp(k * timeElapsed), where k = 0.03
    Game ends when multiplier >= crash point (loss) or user cashes out (win)
  - For other casino games: Use predetermined multiplier based on game outcome (e.g., 2x for win, 0x for loss)
- **Skill-based games (puzzle, platformer, racing, arcade, etc.)**:
  - Convert final score to multiplier using: calculateMultiplierFromScore(score)
  - Use logarithmic scaling to keep multipliers reasonable (1-5x range)

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

  console.log('Calling Anthropic API...');
  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Create a React game component for: "${prompt}". Include proxiedAssets prop: ${JSON.stringify(proxiedAssets)}.`,
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

  console.log('Raw code received from Anthropic, length:', rawCode.length);

  let cleanedCode = rawCode
    .replace(/```(?:jsx?|javascript)?/g, '')
    .replace(/^\s*[\r\n]+/gm, '')
    .trim();

  if (!cleanedCode.endsWith('export default App;')) {
    cleanedCode = `${cleanedCode}\nexport default App;`;
  }

  console.log('Cleaned code length:', cleanedCode.length);
  console.log('✅ React component generation completed');

  return {
    finalApp: cleanedCode,
    proxiedAssets
  };
}

// Helper function to extract room info from generated code
function extractRoomInfoFromCode(gameCode) {
  console.log('📊 EXTRACTING ROOM INFO FROM CODE');
  console.log('Code length:', gameCode.length);

  try {
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

    console.log('Extracted title:', name);

    if (!name || name.length < 3 || name.length > 30) {
      name = 'Default Game';
      confidence = 0.5;
      console.log('Using default name:', name);
    }

    // Generate ticker from name
    const ticker = name
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 6) || 'GAME';
    console.log('Generated ticker:', ticker);

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

    // Generate fallback description if none found
    if (!description) {
      description = 'Play the game to achieve high multipliers and test your skills.';
    }

    console.log('Extracted rules:', description.substring(0, 100) + '...');

    // Ensure description is properly sized
    if (description.length > 200) {
      description = description.substring(0, 197) + '...';
    }

    // Determine game theme based on content analysis
    const themeWords = (name + ' ' + description + ' ' + gameCode).toLowerCase();
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
      if (keywords.some(keyword => themeWords.includes(keyword))) {
        gameTheme = theme;
        break;
      }
    }

    console.log('Detected game theme:', gameTheme);

    const result = {
      name,
      ticker,
      description,
      gameTheme,
      confidence: Math.max(confidence, 0.5)
    };

    console.log('✅ Room info extraction completed:', result);
    return result;
  } catch (error) {
    console.error('❌ Error extracting room info:', error);
    return {
      name: 'Default Game',
      ticker: 'GAME',
      description: 'A fun and engaging game experience.',
      gameTheme: 'interactive game',
      confidence: 0.5
    };
  }
}

// Helper function to check wallet balance
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

// Helper function for automated deposits
async function handleAutomatedDeposit({ privateKey, amount, fromAddress, roomName }) {
  console.log('💰 HANDLING AUTOMATED DEPOSIT');
  console.log('Amount:', amount, 'SOL');
  console.log('From address:', fromAddress);
  console.log('Room name:', roomName);

  const {
    Connection,
    Transaction,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    Keypair
  } = require('@solana/web3.js');
  const bs58 = require('bs58');

  try {
    // Initialize connection
    console.log('🔗 Connecting to Solana network...');
    const connection = new Connection(process.env.PROVIDER_URL, 'confirmed');

    // Create keypair from private key
    console.log('🔐 Creating keypair from private key...');
    const secretKey = bs58.decode(privateKey);
    const userKeypair = Keypair.fromSecretKey(secretKey);

    // Verify the from address matches the private key
    if (userKeypair.publicKey.toString() !== fromAddress) {
      console.log('❌ Address mismatch');
      console.log('Expected:', fromAddress);
      console.log('Got:', userKeypair.publicKey.toString());
      throw new Error('Private key does not match the provided wallet address');
    }
    console.log('✅ Address verification passed');

    // Get admin wallet
    const adminWalletPubkey = new PublicKey(process.env.adminWallet);
    console.log('Admin wallet:', adminWalletPubkey.toString());

    // Create transaction
    console.log('📝 Creating transaction...');
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    console.log('Amount in lamports:', lamports);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userKeypair.publicKey,
        toPubkey: adminWalletPubkey,
        lamports,
      })
    );

    // Get latest blockhash
    console.log('🔗 Getting latest blockhash...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userKeypair.publicKey;

    // Send transaction
    console.log('📤 Sending transaction...');
    const signature = await connection.sendTransaction(transaction, [userKeypair]);
    console.log('Transaction signature:', signature);

    // Confirm transaction
    console.log('⏳ Confirming transaction...');
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');

    if (confirmation.value.err) {
      console.log('❌ Transaction failed on blockchain:', confirmation.value.err);
      throw new Error('Transaction failed on blockchain');
    }

    console.log('✅ Transaction confirmed successfully');
    const result = {
      success: true,
      txHash: signature,
      amount,
      explorerUrl: `https://explorer.solana.com/tx/${signature}`
    };

    console.log('Deposit result:', result);
    return result;

  } catch (error) {
    console.error('❌ Automated deposit error:', error);
    throw new Error(`Deposit failed: ${error.message}`);
  }
}

async function convertDalleImageToPinata(dalleImageUrl) {
  console.log('🔄 Converting DALL-E image to Pinata upload...');
  console.log('DALL-E URL:', dalleImageUrl);

  try {
    // Download the image from DALL-E
    console.log('⬇️ Downloading image from DALL-E...');
    const imageResponse = await fetch(dalleImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch DALL-E image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('✅ Image downloaded, size:', imageBuffer.byteLength, 'bytes');

    // Convert to Buffer
    const buffer = Buffer.from(imageBuffer);

    // Optional: Resize image using Sharp if available
    let processedBuffer = buffer;
    try {
      const sharp = require('sharp');
      console.log('🔧 Resizing image with Sharp...');
      processedBuffer = await sharp(buffer)
        .resize(512, 512, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({
          quality: 90,
          compressionLevel: 6
        })
        .toBuffer();
      console.log('✅ Image resized, new size:', processedBuffer.byteLength, 'bytes');
    } catch (sharpError) {
      console.log('⚠️ Sharp not available or error, using original size:', sharpError.message);
      processedBuffer = buffer;
    }

    // Upload to Pinata using axios (more reliable than fetch for FormData)
    console.log('☁️ Uploading to Pinata...');
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Add file with proper options
    formData.append('file', processedBuffer, {
      filename: `game-image-${Date.now()}.png`,
      contentType: 'image/png'
    });

    // Add metadata (optional)
    const metadata = JSON.stringify({
      name: `Game Image ${Date.now()}`,
      keyvalues: {
        type: 'game-image',
        source: 'dalle-generated',
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Add options (optional)
    const options = JSON.stringify({
      cidVersion: 0
    });
    formData.append('pinataOptions', options);

    // Use axios instead of fetch for better FormData handling
    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PINATA_JWT}`,
          ...formData.getHeaders() // This is crucial for proper boundary setting
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000 // 60 second timeout
      }
    );

    const pinataData = pinataResponse.data;
    const finalImageUrl = `https://gateway.pinata.cloud/ipfs/${pinataData.IpfsHash}`;

    console.log('✅ Successfully uploaded to Pinata');
    console.log('IPFS Hash:', pinataData.IpfsHash);
    console.log('Final URL:', finalImageUrl);

    return finalImageUrl;

  } catch (error) {
    console.error('❌ Error converting DALL-E image to Pinata:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Pinata API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    throw new Error(`Failed to convert DALL-E image: ${error.message}`);
  }
}

module.exports = router;