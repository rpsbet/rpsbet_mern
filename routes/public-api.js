// routes/public-api.js - Public API routes for external access
const express = require('express');
const { apiAuth, requirePermission, createApiRateLimit } = require('../middleware/apiAuth');
const Room = require('../model/Room');
const GameType = require('../model/GameType');
const User = require('../model/User');
const GameLog = require('../model/GameLog');
const System = require('../model/SystemSetting');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const transpileReactCode = require('../helper/util/transpileReactCode');

const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const GameCode = require('../model/GameCode');

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

    // Image generation/processing
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
      console.log('📊 Extracted info from code:', extractedInfo);

    } catch (reactError) {
      console.error('❌ React generation error:', reactError);
      console.error('React error stack:', reactError.stack);
      // Since React generation is mandatory, fail the request
      return res.status(500).json({
        success: false,
        error: 'Failed to generate required React component: ' + reactError.message
      });
    }

    // DETERMINE FINAL NAME, TICKER, DESCRIPTION - Use extracted values when request values are empty
    console.log('🏷️ DETERMINING FINAL GAME DETAILS');
    console.log('Provided name:', providedName);
    console.log('Original ticker:', originalTicker);
    console.log('Original description:', originalDescription);
    console.log('Extracted info:', extractedInfo);

    let finalName = providedName;
    let finalTicker = originalTicker;
    let finalDescription = originalDescription;

    // Use extracted values if provided values are empty/undefined/null
    if ((!finalName || finalName.trim() === '') && extractedInfo && extractedInfo.name) {
      finalName = extractedInfo.name;
      console.log('✅ Using extracted name:', finalName);
    }

    if ((!finalTicker || finalTicker.trim() === '') && extractedInfo && extractedInfo.ticker) {
      finalTicker = extractedInfo.ticker;
      console.log('✅ Using extracted ticker:', finalTicker);
    }

    if ((!finalDescription || finalDescription.trim() === '') && extractedInfo && extractedInfo.description) {
      finalDescription = extractedInfo.description;
      console.log('✅ Using extracted description:', finalDescription);
    }

    // Fallback to defaults if still empty
    if (!finalName || finalName.trim() === '') {
      finalName = 'Generated Game';
      console.log('⚠️ Using fallback name:', finalName);
    }

    if (!finalTicker || finalTicker.trim() === '') {
      finalTicker = finalName.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '') || 'GAME';
      console.log('⚠️ Using fallback ticker:', finalTicker);
    }

    if (!finalDescription || finalDescription.trim() === '') {
      finalDescription = 'An exciting game experience with unique gameplay mechanics.';
      console.log('⚠️ Using fallback description:', finalDescription);
    }

    console.log('📝 Final game details:');
    console.log('- Name:', finalName);
    console.log('- Ticker:', finalTicker);
    console.log('- Description:', finalDescription);

    // AUTOMATIC GAME TYPE CLASSIFICATION
    console.log('🏷️ CLASSIFYING GAME TYPES AUTOMATICALLY');
    let classifiedGameTypes = [];

    try {
      classifiedGameTypes = await classifyGameTypes(
        finalName,
        finalGameCode,
        reactPrompt,
        finalDescription
      );
      console.log('✅ Game types classified:', classifiedGameTypes);
    } catch (classificationError) {
      console.error('❌ Game type classification error:', classificationError);
      console.log('⚠️ Using fallback game type classification');
      classifiedGameTypes = ['casual']; // Fallback
    }

    // Process mandatory automated deposit
    console.log('🔐 Processing mandatory automated deposit');
    try {
      depositResult = await handleAutomatedDeposit({
        privateKey,
        amount: user_bet,
        fromAddress: connectedAccount,
        roomName: finalName
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
      name: finalName,
      image: finalImageUrl,
      ticker: finalTicker,
      x_link,
      prompt: reactPrompt,
      telegram_link,
      website_link,
      pr: 0,
      total_stakes: amountAfterFee,
      endgame_amount: 40,
      endgame_type: false,
      host_pr: amountAfterFee,
      room_name: classifiedGameTypes[0] + '-' + room_number,
      room_number,
      index: room_number,
      status: 'open',
      description: finalDescription,
      gameTypes: classifiedGameTypes,
    });

    console.log('New room created (not saved yet):', {
      name: newRoom.name,
      room_number: newRoom.room_number,
      ticker: newRoom.ticker,
      bet_amount: newRoom.bet_amount,
      image: newRoom.image,
      description: newRoom.description
    });

    const gameCodeDoc = finalGameCode ? new GameCode({
      room: newRoom._id,
      code: finalGameCode,
      created_by: req.user._id,
      version: 1
    }) : null;

    // Create game log
    console.log('📝 CREATING GAME LOG');
    const newGameLog = new GameLog({
      room: newRoom._id,
      creator: req.user._id,
      joined_user: req.user._id,
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
      if (gameCodeDoc) {
        await saveDocumentWithRetry(gameCodeDoc);
      }
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
        image: finalImageUrl,
        description: newRoom.description
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
      roomTicker: response.room.ticker,
      roomDescription: response.room.description,
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
// Replace the generateReactComponent function in public-api.js with this:

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

  // Use the EXACT same system prompt as /generate-react endpoint
  const systemPrompt = `You are an elite React developer. Generate a complete, working React game component with MANDATORY logging and house edge enforcement.

Output Requirements:
- Return ONLY valid JavaScript/React code for the App component
- Start with "const App = ({ logEvent }) => {" or "const App = (props) => { const { logEvent } = props;"
- End with "export default App;"
- No markdown, explanations, or extra text

Required Imports:
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';

🚨 ABSOLUTE FORBIDDEN TERMS 🚨
NEVER use these words anywhere in your code (will cause automatic rejection):
- "bet" (use "wager", "stake", "play" instead)
- "balance" (use "score", "points", "total" instead) 
- "wallet" (use "account", "profile" instead)
- "coins", "credits", "cash", "money", "currency", "dollar", "cent"
- "deposit", "withdraw", "payout", "jackpot"

SAFE ALTERNATIVES:
- Instead of "bet amount" → "play amount" or "stake"
- Instead of "balance" → "player score" or "current total"
- Instead of "betting" → "playing" or "gaming"
- Instead of "place bet" → "start round" or "begin game"

CRITICAL: NO FINANCIAL LOGIC
- DO NOT include any financial amounts, monetary calculations, or payment processing
- DO NOT implement financial mechanics, currency displays, or monetary transactions
- Focus purely on game mechanics, scoring, and user interaction
- All financial logic will be handled by external systems

🚨 MANDATORY LOGEVENT IMPLEMENTATION 🚨
This is CRITICAL - games without proper logging will be rejected:

1. COMPONENT SIGNATURE - MUST start with logEvent prop:
REQUIRED FORMAT: const App = ({ logEvent }) => {
ALTERNATIVE FORMAT: const App = (props) => { const { logEvent } = props;
DO NOT USE: const App = () => { (this will fail validation)

2. FIRST LINE AFTER COMPONENT START - Add logEvent validation:
const App = ({ logEvent }) => {
  // MANDATORY: Add this validation immediately
  useEffect(() => {
    if (!logEvent || typeof logEvent !== 'function') {
      console.error('⚠️ CRITICAL: logEvent prop is missing or invalid');
    } else {
      console.log('✅ logEvent prop validated successfully');
    }
  }, [logEvent]);

3. MANDATORY GAME START LOGGING - Must be exactly this pattern:
const startGame = (practiceMode = false) => {
  setIsPracticeMode(practiceMode);
  setGameStarted(true);
  setGameEnded(false);
  setGameStartTime(Date.now());
  
  // CRITICAL: This exact logging pattern is required
  if (!practiceMode && logEvent && typeof logEvent === 'function') {
    logEvent("gameStarted", { 
      timestamp: new Date().toISOString(),
      gameType: "REPLACE_WITH_ACTUAL_GAME_NAME",
      practiceMode: false,
      sessionId: Date.now()
    });
    console.log('🎮 Game started - event logged');
  } else if (practiceMode) {
    console.log('🎯 Practice mode - no logging');
  }
  
  // Reset other game state here...
};

4. MANDATORY GAME END LOGGING - Must use this exact pattern:
const endGame = useCallback((result, multiplier) => {
  setGameEnded(true);
  const finalMultiplier = parseFloat(multiplier) || 1.0;
  
  // CRITICAL: This exact logging pattern is required
  if (!isPracticeMode && logEvent && typeof logEvent === 'function') {
    logEvent("gameEnded", { 
      timestamp: new Date().toISOString(),
      result: result, // Must be "win", "loss", or "draw"
      multiplier: finalMultiplier,
      gameType: "REPLACE_WITH_ACTUAL_GAME_NAME",
      practiceMode: false,
      sessionData: {
        duration: Math.round((Date.now() - gameStartTime) / 1000),
        actionsPerformed: actionCount || 0
      }
    });
  }
  
  // Always update game history (both modes)
  setGameHistory(prev => [...prev.slice(-9), { 
    id: Date.now(), 
    result, 
    multiplier: finalMultiplier, 
    timestamp: new Date().toISOString(),
    practice: isPracticeMode || false
  }]);
}, [isPracticeMode, logEvent, gameStartTime]);

5. PRACTICE MODE IMPLEMENTATION - MANDATORY:
- Add state: const [isPracticeMode, setIsPracticeMode] = useState(false);
- Include TWO start buttons:
  
  {/* Normal Mode Button */}
  <Button 
    variant="contained" 
    onClick={() => startGame(false)}
    sx={{ 
      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
      '&:hover': { background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)' }
    }}
  >
    Start Game
  </Button>
  
  {/* Practice Mode Button */}
  <Button 
    variant="outlined" 
    onClick={() => startGame(true)}
    sx={{ 
      borderColor: '#ffeb3b', 
      color: '#ffeb3b',
      '&:hover': { borderColor: '#fff', color: '#fff' }
    }}
  >
    🎯 Practice Mode
  </Button>

6. PRACTICE MODE INDICATOR:
{isPracticeMode && (
  <Typography variant="caption" sx={{ 
    color: '#ffeb3b', 
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 235, 59, 0.1)',
    padding: 1,
    borderRadius: 1,
    border: '1px solid #ffeb3b'
  }}>
    🎯 PRACTICE MODE - Free to Play
  </Typography>
)}

🚨 MANDATORY HOUSE EDGE ENFORCEMENT 🚨
ALL games must maintain 5-8% house edge to ensure profitability:

CASINO GAME TYPES (mines, crash, slots, dice, roulette, lottery):
- Apply house edge factor: 0.92-0.95 (5-8% house edge)
- Maximum multiplier cap: 50x
- Example mines calculation:
const calculateMinesMultiplier = (safeReveals, totalMines, totalSpaces) => {
  const baseMultiplier = Math.pow((totalSpaces - totalMines) / (totalSpaces - totalMines - safeReveals), safeReveals);
  const houseEdgeFactor = 0.93; // 7% house edge
  const finalMultiplier = baseMultiplier * houseEdgeFactor;
  return Math.min(finalMultiplier, 50).toFixed(2);
};

CRASH GAME MULTIPLIERS:
const generateCrashPoint = () => {
  const random = Math.random();
  // House-favored crash generation (favors lower multipliers)
  const crashPoint = 1 / (1 - Math.pow(random, 1.3) * 0.90);
  return Math.max(crashPoint, 1.01).toFixed(2);
};

SKILL-BASED GAMES (puzzle, platformer, racing):
- Apply house edge to score conversion: score * 0.92
- Cap multipliers at 4x maximum
const calculateSkillMultiplier = (score) => {
  const adjustedScore = score * 0.92; // House edge
  const multiplier = 1 + Math.log10(1 + adjustedScore / 150);
  return Math.min(multiplier, 4.0).toFixed(2);
};

MULTIPLIER VALIDATION - Add this function:
const validateMultiplier = (multiplier, gameType) => {
  const numMultiplier = parseFloat(multiplier);
  if (isNaN(numMultiplier) || numMultiplier < 0) return "0.00";
  
  const maxMultiplier = gameType === 'skill' ? 4.0 : 50.0;
  return Math.min(numMultiplier, maxMultiplier).toFixed(2);
};

🚨 MANDATORY CODE STRUCTURE 🚨

REQUIRED STATE VARIABLES:
const [gameStarted, setGameStarted] = useState(false);
const [gameEnded, setGameEnded] = useState(false);
const [isPracticeMode, setIsPracticeMode] = useState(false);
const [gameHistory, setGameHistory] = useState([]);
const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
const [gameStartTime, setGameStartTime] = useState(0);

REQUIRED FUNCTIONS (all must be present):
- startGame(practiceMode = false)
- endGame(result, multiplier) 
- resetGame()
- validateMultiplier(multiplier, gameType)

LAYOUT REQUIREMENTS:
- Main container: width: "100%", height: "100%", minHeight: "400px", padding: "60px 30px"
- Game title: <Typography id="game-title" variant="h4">GAME NAME</Typography>
- Responsive design with isMobile state
- Game rules overlay: <Box id="game-rules"> with toggle functionality

GAME HISTORY DISPLAY:
- Show last 10 games in a table format
- Color code: wins (#48ff00), losses (#ff0000)
- Include practice mode indicator
- Display timestamp and multiplier

ERROR PREVENTION:
- Validate all numeric inputs
- Handle edge cases (division by zero, negative values)
- Ensure multiplier never exceeds caps
- Always return valid multiplier strings with 2 decimal places

TESTING CHECKLIST (the generated code must pass all):
✅ logEvent prop is accepted and used
✅ gameStarted event is logged on game start (non-practice)
✅ gameEnded event is logged with result and multiplier (non-practice)
✅ Practice mode works without logging
✅ Multipliers respect house edge calculations
✅ Maximum multiplier caps are enforced
✅ Game history displays correctly
✅ Both game modes (normal/practice) function properly
✅ No financial terms or betting logic present
✅ Component exports properly

FAILURE CONDITIONS (will cause rejection):
❌ Missing logEvent prop handling
❌ No game start/end logging
❌ Practice mode missing or broken
❌ Multipliers too generous (no house edge)
❌ Missing required state variables
❌ Broken game history
❌ Financial logic present
❌ Missing multiplier validation

House Edge Validation Comment:
// House Edge: 7% | Max Multiplier: 50x | Expected RTP: 93%`;

  console.log('Calling Anthropic API...');
  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Create a React game component for: "${prompt}". Include proxiedAssets prop: ${JSON.stringify(proxiedAssets)}.
        
        CRITICAL REQUIREMENTS:
        1. MUST accept and use logEvent prop for game start/end tracking
        2. MUST implement working practice mode (no logging)
        3. MUST enforce house edge on all multipliers
        4. MUST include proper game history and state management
        5. NO financial/betting logic allowed
        
        The component will be tested for all logging functionality and house edge compliance.`,
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

  // Add validation similar to /generate-react endpoint
  const validationErrors = [];

  // Check for logEvent prop handling
  if (!cleanedCode.includes('{ logEvent }') && !cleanedCode.includes('logEvent') && !cleanedCode.includes('props.logEvent')) {
    validationErrors.push('Missing logEvent prop in component signature');
  }

  // Check for specific logEvent patterns
  if (!cleanedCode.includes('logEvent("gameStarted"') && !cleanedCode.includes("logEvent('gameStarted'")) {
    validationErrors.push('Missing required gameStarted logging call');
  }

  if (!cleanedCode.includes('logEvent("gameEnded"') && !cleanedCode.includes("logEvent('gameEnded'")) {
    validationErrors.push('Missing required gameEnded logging call');
  }

  // Check for practice mode implementation
  if (!cleanedCode.includes('isPracticeMode') || !cleanedCode.includes('Practice Mode')) {
    validationErrors.push('Missing practice mode implementation');
  }

  // Check for house edge implementation
  const hasHouseEdge = cleanedCode.includes('houseEdge') ||
    cleanedCode.includes('0.9') ||
    cleanedCode.includes('Math.min') ||
    cleanedCode.includes('* 0.') ||
    cleanedCode.includes('houseEdgeFactor');

  if (!hasHouseEdge) {
    validationErrors.push('Missing house edge enforcement in multiplier calculations');
  }

  // If validation fails, log but don't regenerate (to match public API behavior)
  if (validationErrors.length > 0) {
    console.warn(`[Public API] Generated code has validation issues: ${validationErrors.join('; ')}`);
    // You can choose to regenerate here or just log the warning
  }

  // Ensure proper export
  if (!cleanedCode.endsWith('export default App;')) {
    cleanedCode = `${cleanedCode}\nexport default App;`;
  }

  // IMPORTANT: Add transpilation like /generate-react does
  // You need to import or copy the transpileReactCode function
  let transpiledCode;
  try {
    transpiledCode = await transpileReactCode(cleanedCode);
  } catch (transpileError) {
    console.error('Transpilation failed, using cleaned code:', transpileError);
    transpiledCode = cleanedCode;
  }

  console.log('Cleaned code length:', cleanedCode.length);
  console.log('✅ React component generation completed');

  return {
    finalApp: transpiledCode, // Use transpiled code instead of cleaned code
    originalCode: cleanedCode, // Keep original for reference
    proxiedAssets
  };
}

// Replace the extractRoomInfoFromCode function in your public-api.js:

function extractRoomInfoFromCode(gameCode) {
  console.log('📊 EXTRACTING ROOM INFO FROM CODE');
  console.log('Code length:', gameCode.length);

  try {
    // Enhanced title extraction with more specific patterns
    let name = '';
    let confidence = 0;

    // Look for Typography with id="game-title" specifically (highest priority)
    // Updated regex to handle emojis, special characters, and quotes
    const gameTitleMatch = gameCode.match(/<Typography[^>]*id="game-title"[^>]*>([^<]{1,100})<\/Typography>/i);

    if (gameTitleMatch && gameTitleMatch[1]) {
      let extractedTitle = gameTitleMatch[1].trim();
      console.log('Raw extracted title from game-title:', extractedTitle);

      // Clean up JSX syntax and template literals more carefully
      extractedTitle = extractedTitle
        // Remove JSX template literal syntax but preserve content
        .replace(/\$\{[^}]+\}/g, '')
        .replace(/`/g, '')
        // Handle conditional JSX expressions
        .replace(/isMobile\s*\?\s*"[^"]*"\s*:\s*"([^"]*)"/g, '$1')
        .replace(/isMobile\s*\?\s*'[^']*'\s*:\s*'([^']*)'/g, '$1')
        // Remove remaining JSX artifacts
        .replace(/[{}]/g, '')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        .trim();

      console.log('Cleaned extracted title:', extractedTitle);

      // More lenient validation - allow emojis and special characters
      if (extractedTitle.length >= 3 &&
        extractedTitle.length <= 100 && // Increased max length
        // Remove generic exclusions that are too strict
        !['Game Rules', 'Rules', 'Close', 'Start', 'Play'].includes(extractedTitle) &&
        !extractedTitle.includes('undefined') &&
        !extractedTitle.includes('null') &&
        !extractedTitle.includes('result') &&
        !extractedTitle.includes('===') &&
        !extractedTitle.startsWith('{') &&
        extractedTitle !== '') {

        name = extractedTitle;
        confidence = 0.95;
        console.log('✅ High confidence title found:', name);
      } else {
        console.log('❌ Title validation failed for:', extractedTitle);
      }
    } else {
      console.log('❌ No game-title id found');
    }

    // Fallback patterns if game-title id is not found or invalid
    if (!name) {
      console.log('🔄 Trying fallback extraction patterns...');
      
      const titlePatterns = [
        // Look for Typography with variant h1-h6 
        /<Typography[^>]*variant="h[1-6]"[^>]*>([^<]{3,100})<\/Typography>/gi,
        // Look for regular h1-h6 tags
        /<h[1-6][^>]*>([^<]{3,100})<\/h[1-6]>/gi,
        // Look for any Typography that might contain a game title (broader search)
        /<Typography[^>]*>([A-Z🌆🎮🕹️🎯🏆🚀⚡🌟💎🔥🎲🃏♠♥♦♣🎪🎨🎭🎪][^<]{5,100})<\/Typography>/gi
      ];

      for (let i = 0; i < titlePatterns.length; i++) {
        const pattern = titlePatterns[i];
        const matches = Array.from(gameCode.matchAll(pattern));

        console.log(`Pattern ${i + 1} found ${matches.length} matches`);

        for (const match of matches) {
          if (match && match[1]) {
            let extractedTitle = match[1].trim();
            console.log(`Checking match: "${extractedTitle}"`);

            // Clean up JSX syntax
            extractedTitle = extractedTitle
              .replace(/\$\{[^}]+\}/g, '')
              .replace(/isMobile\s*\?\s*"[^"]*"\s*:\s*"([^"]*)"/g, '$1')
              .replace(/isMobile\s*\?\s*'[^']*'\s*:\s*'([^']*)'/g, '$1')
              .replace(/[{}$`]/g, '')
              .replace(/\s+/g, ' ')
              .trim();

            console.log(`Cleaned match: "${extractedTitle}"`);

            // More lenient validation for fallback
            if (extractedTitle.length >= 3 &&
              extractedTitle.length <= 100 &&
              !['Game Rules', 'Rules', 'Close', 'Start', 'Play', 'Game', 'Title', 'App', 'Component'].includes(extractedTitle) &&
              !extractedTitle.includes('undefined') &&
              !extractedTitle.includes('null') &&
              !extractedTitle.includes('result') &&
              !extractedTitle.includes('===') &&
              !extractedTitle.startsWith('{') &&
              extractedTitle !== '') {

              name = extractedTitle;
              confidence = i === 0 ? 0.8 : (0.7 - i * 0.1);
              console.log(`✅ Fallback title found: "${name}" with confidence ${confidence}`);
              break;
            }
          }
        }
        if (name) break;
      }
    }

    console.log('Final extracted title:', name);

    // Only use fallback if we truly found nothing
    if (!name || name.length < 3) {
      console.log('⚠️ No valid title found, using fallback');
      name = 'Generated Game';
      confidence = 0.3; // Low confidence for fallback
    }

    // Generate ticker from name - handle emojis and special characters
    let ticker = '';
    if (name) {
      // Remove emojis and special characters, then extract letters
      const cleanName = name
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
        .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
        .trim();

      console.log('Clean name for ticker:', cleanName);

      // Split by spaces and take first letter of each word
      const words = cleanName.split(/\s+/).filter(word => word.length > 0);
      ticker = words
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 6);

      console.log('Generated ticker from words:', ticker);

      // If ticker is too short, use first few chars of clean name
      if (ticker.length < 2) {
        ticker = cleanName.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '');
      }

      // Final fallback
      if (ticker.length < 2) ticker = 'GAME';
      if (ticker.length > 6) ticker = ticker.substring(0, 6);
    }

    console.log('Final ticker:', ticker);

    // Extract description (existing logic is fine, just adding more logging)
    let description = '';

    // Look for game rules content within the rules modal/section
    const rulesPatterns = [
      /<Box[^>]*id="game-rules"[^>]*>[\s\S]*?<\/Box>/i,
      /Game Rules[\s\S]*?<\/Typography>([\s\S]*?)(?:<Button|<\/Box>)/i,
      /((?:<Typography[^>]*>[^<]*\d+\.[^<]*<\/Typography>\s*){2,})/gi,
      /((?:Choose|Select|Click|Buy|Sell|Start|Play|Receive|Navigate|Use|Beat)[^<]*(?:<\/Typography>)?(?:\s*<Typography[^>]*>[^<]*(?:cards|hand|community|phases|multiplier|opponent)[^<]*<\/Typography>)?){2,}/gi
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
              const cleanText = text.trim();
              return cleanText.length > 10 &&
                !cleanText.includes('Game Rules') &&
                !cleanText.includes('Close') &&
                !cleanText.includes('undefined') &&
                !cleanText.includes('null') &&
                !cleanText.startsWith('{') &&
                (cleanText.includes('.') || cleanText.match(/\d+\s*\./) || cleanText.includes('•'));
            })
            .slice(0, 5);

          if (ruleTexts.length >= 2) {
            description = ruleTexts.join(' ').replace(/\s+/g, ' ').trim();
            if (description.length > 300) {
              description = description.substring(0, 300) + '...';
            }
            break;
          }
        }
      }
    }

    // Generate fallback description if none found
    if (!description) {
      if (name && name !== 'Generated Game') {
        description = `Experience ${name} - an exciting game with unique mechanics and multiplier rewards.`;
      } else {
        description = 'An engaging game experience with exciting gameplay mechanics.';
      }
    }

    // Determine game theme based on content analysis
    const themeWords = (name + ' ' + description + ' ' + gameCode).toLowerCase();
    let gameTheme = 'interactive game';

    const themeMapping = {
      'poker game': ['poker', 'texas', 'hold', 'cards', 'hand', 'flop', 'river', 'fold', 'community'],
      'casino game': ['casino', 'gambling', 'multiplier', 'fold', 'call', 'showdown'],
      'card game': ['card', 'deck', 'hand', 'shuffle', 'suit'],
      'cyberpunk game': ['cyberpunk', 'neon', 'nexus', 'cyber', 'hud', 'neural'],
      'strategy game': ['strategy', 'tactical', 'plan', 'decision'],
      'skill game': ['skill', 'precision', 'timing', 'challenge']
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
      name: 'Generated Game',
      ticker: 'GAME',
      description: 'A fun and engaging game experience.',
      gameTheme: 'interactive game',
      confidence: 0.3
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