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

🚨 MODERN STYLING FOR NEW GENERATION 🚨
Use cutting-edge design trends that appeal to Gen Z and younger audiences:

CORE DESIGN PRINCIPLES:
- Dark mode first (always use dark backgrounds)
- High contrast with vibrant accents
- Glassmorphism and depth effects
- Smooth animations and micro-interactions
- Bold, modern typography
- RGB/neon color schemes
- Rounded corners and soft shadows
- Gradient overlays and holographic effects

MANDATORY STYLING APPROACH:
- DO NOT use styled-components or the styled() function
- Use ONLY Material-UI's sx prop for styling
- Use ONLY inline styles when needed
- Focus on creating visually stunning, modern interfaces

🎨 MODERN COLOR PALETTES:

// Cyberpunk/Neon Theme (Primary Choice)
const cyberpunkColors = {
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
  primary: '#00f5ff',
  secondary: '#ff0080',
  accent: '#39ff14',
  surface: 'rgba(255, 255, 255, 0.05)',
  glass: 'rgba(255, 255, 255, 0.1)',
  border: 'rgba(0, 245, 255, 0.3)',
  glow: '0 0 20px rgba(0, 245, 255, 0.5)'
};

// Gaming RGB Theme
const rgbColors = {
  background: 'linear-gradient(45deg, #1e1e1e 0%, #2d1b69 50%, #11998e 100%)',
  primary: '#ff6b6b',
  secondary: '#4ecdc4', 
  accent: '#45b7d1',
  rainbow: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)',
  glass: 'rgba(255, 255, 255, 0.08)',
  glow: '0 0 15px rgba(255, 107, 107, 0.4)'
};

// Y2K Retro Theme
const retroColors = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  primary: '#ff3cac',
  secondary: '#784ba0', 
  accent: '#2b86ab',
  chrome: 'linear-gradient(45deg, #c0c0c0, #f5f5f5, #c0c0c0)',
  holographic: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff)',
  glow: '0 0 25px rgba(255, 60, 172, 0.6)'
};

🚨 MODERN COMPONENT STYLING EXAMPLES 🚨

MAIN GAME CONTAINER (Glassmorphism):
<Box sx={{
  width: '100%',
  minHeight: '600px',
  background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
  borderRadius: '24px',
  padding: 4,
  position: 'relative',
  overflow: 'hidden',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    zIndex: -1
  }
}}>


{/* Practice Mode Button */}
<Button 
  variant="outlined" 
  onClick={() => startGame(true)}
  sx={{ 
    borderColor: '#ffeb3b', 
    color: '#ffeb3b',
    borderRadius: '16px',
    padding: '12px 32px',
    fontSize: '1.1rem',
    fontWeight: 700,
    textTransform: 'none',
    borderWidth: '2px',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 235, 59, 0.05)',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      borderColor: '#fff',
      color: '#fff',
      background: 'rgba(255, 235, 59, 0.1)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(255, 235, 59, 0.3)'
    }
  }}
>
  🎯 Practice Mode
</Button>

PRACTICE MODE INDICATOR (Enhanced):
{isPracticeMode && (
  <Box sx={{
    background: 'linear-gradient(45deg, rgba(255, 235, 59, 0.1), rgba(255, 235, 59, 0.05))',
    border: '2px solid #ffeb3b',
    borderRadius: '16px',
    padding: 2,
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 20px rgba(255, 235, 59, 0.3)',
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': { boxShadow: '0 0 20px rgba(255, 235, 59, 0.3)' },
      '50%': { boxShadow: '0 0 30px rgba(255, 235, 59, 0.6)' },
      '100%': { boxShadow: '0 0 20px rgba(255, 235, 59, 0.3)' }
    }
  }}>
    <Typography sx={{
      color: '#ffeb3b',
      fontWeight: 700,
      fontSize: '1.1rem',
      textShadow: '0 0 10px rgba(255, 235, 59, 0.8)'
    }}>
      🎯 PRACTICE MODE - Free to Play
    </Typography>
  </Box>
)}

GAME HISTORY TABLE (Modern Dark):
<Box sx={{
  background: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(15px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden'
}}>
  <Typography sx={{
    color: '#fff',
    fontWeight: 600,
    padding: 2,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)'
  }}>
    📊 Recent Games
  </Typography>
  {/* Table content with neon-colored results */}
</Box>

ANIMATIONS & TRANSITIONS:
- Use transform: translateY(-2px) for hover states
- Add box-shadow transitions for depth
- Implement scale animations for interactions
- Use backdrop-filter: blur() for glassmorphism
- Add gradient animations for loading states

MODERN TYPOGRAPHY:
- Use font weights 600-900 for headings
- Implement gradient text effects
- Add text shadows and glows
- Use letter-spacing for emphasis
- Implement responsive font sizes

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
- Include TWO start buttons with modern styling as shown above

🚨 MANDATORY ADVANCED HOUSE EDGE ENFORCEMENT 🚨
Use sophisticated probability-based calculations that feel generous but maintain 5-8% house edge:

CASINO GAME TYPES require advanced multiplier calculations:

MINES GAME - Progressive House Edge:
const calculateMinesMultiplier = (safeReveals, totalMines, totalSpaces) => {
  const totalSafeSpaces = totalSpaces - totalMines;
  let probability = 1;
  
  for (let i = 0; i < safeReveals; i++) {
    probability *= (totalSafeSpaces - i) / (totalSpaces - i);
  }
  
  const fairMultiplier = 1 / probability;
  
  // Progressive house edge - gets harder with more risk
  let houseEdgeFactor;
  if (safeReveals <= 2) {
    houseEdgeFactor = 0.95; // 5% house edge for low risk
  } else if (safeReveals <= 5) {
    houseEdgeFactor = 0.93; // 7% house edge for medium risk  
  } else {
    houseEdgeFactor = 0.88; // 12% house edge for high risk
  }
  
  const scaledMultiplier = fairMultiplier * houseEdgeFactor;
  const maxMultiplier = totalMines >= 20 ? 1000 : totalMines >= 15 ? 500 : totalMines >= 10 ? 100 : 50;
  
  return Math.min(scaledMultiplier, maxMultiplier).toFixed(2);
};

CRASH GAME - Weighted Distribution:
const generateCrashPoint = () => {
  const random = Math.random();
  let crashPoint;
  
  if (random < 0.4) {
    // 40% chance: 1.00x - 1.99x (most losses)
    crashPoint = 1 + Math.pow(Math.random(), 2) * 0.99;
  } else if (random < 0.7) {
    // 30% chance: 2.00x - 4.99x
    crashPoint = 2 + Math.pow(Math.random(), 1.5) * 2.99;
  } else if (random < 0.9) {
    // 20% chance: 5.00x - 19.99x
    crashPoint = 5 + Math.pow(Math.random(), 2) * 14.99;
  } else if (random < 0.98) {
    // 8% chance: 20.00x - 99.99x
    crashPoint = 20 + Math.pow(Math.random(), 3) * 79.99;
  } else {
    // 2% chance: 100x+ (extremely rare)
    crashPoint = 100 + Math.pow(Math.random(), 4) * 900;
  }
  
  return Math.max(crashPoint * 0.94, 1.01).toFixed(2); // 6% house edge
};

DICE GAME - Probability Control:
const calculateDiceMultiplier = (prediction, rollType = 'under') => {
  let winProbability = rollType === 'under' ? 
    (prediction - 1) / 100 : (100 - prediction) / 100;
  
  winProbability = Math.max(0.01, Math.min(0.98, winProbability));
  const fairMultiplier = 1 / winProbability;
  const houseEdge = winProbability > 0.5 ? 0.98 : 0.95;
  
  return Math.min(fairMultiplier * houseEdge, 9999).toFixed(2);
};

ROULETTE - Standard Casino House Edge:
const calculateRouletteMultiplier = (betType) => {
  const multipliers = {
    'straight': 35 * 0.946,      // Single number: 35:1 with house edge
    'split': 17 * 0.946,         // Two numbers: 17:1 with house edge
    'street': 11 * 0.946,        // Three numbers: 11:1 with house edge
    'corner': 8 * 0.946,         // Four numbers: 8:1 with house edge
    'line': 5 * 0.946,           // Six numbers: 5:1 with house edge
    'dozen': 2 * 0.946,          // 12 numbers: 2:1 with house edge
    'column': 2 * 0.946,         // 12 numbers: 2:1 with house edge
    'red': 1 * 0.946,            // 18 numbers: 1:1 with house edge
    'black': 1 * 0.946,          // 18 numbers: 1:1 with house edge
    'even': 1 * 0.946,           // 18 numbers: 1:1 with house edge
    'odd': 1 * 0.946             // 18 numbers: 1:1 with house edge
  };
  
  return (multipliers[betType] || 1).toFixed(2);
};

SLOT MACHINE - Weighted Symbols:
const generateSlotMultiplier = (reels) => {
  const symbolValues = {
    '🍒': 2, '🍋': 3, '🍊': 5, '🍇': 8, '🔔': 15, 
    '💎': 50, '⭐': 100, '🎰': 500
  };
  
  let multiplier = 1;
  const symbolCounts = {};
  
  reels.forEach(symbol => {
    symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
  });
  
  Object.entries(symbolCounts).forEach(([symbol, count]) => {
    if (count >= 2) {
      const baseValue = symbolValues[symbol] || 1;
      multiplier += baseValue * Math.pow(count, 1.5);
    }
  });
  
  return Math.min(multiplier * 0.92, 1000).toFixed(2); // 8% house edge
};

LOTTERY/SCRATCH - Tiered System:
const calculateLotteryMultiplier = (matches) => {
  const multipliers = [0, 0, 2.5, 12, 85, 750, 5000]; // Based on number of matches
  return (multipliers[matches] || 0).toFixed(2);
};

SKILL-BASED GAMES (puzzle, platformer, racing):
- Apply house edge to score conversion: score * 0.92
- Cap multipliers at 4x maximum
const calculateSkillMultiplier = (score) => {
  const adjustedScore = score * 0.92; // House edge
  const multiplier = 1 + Math.log10(1 + adjustedScore / 150);
  return Math.min(multiplier, 4.0).toFixed(2);
};

SKILL-BASED GAMES HOUSE EDGE IMPLEMENTATION:
- MUST include clear losing conditions (0x multiplier scenarios)
- Examples of proper losing mechanisms:
  * Score below minimum threshold
  * Time expiry before completion  
  * Lives/attempts exhausted
  * Failed to reach objective
  * Performance below acceptable level
- Target win rate: 60-70% (30-40% of players should lose completely)
- For winners: Apply 0.92 factor + 4x max cap

🚨 MANDATORY WIN/LOSS DISTRIBUTION 🚨
Ensure proper psychological balance:

TARGET DISTRIBUTION:
- 60% of plays: Small loss or tiny win (0x - 1.2x)
- 25% of plays: Small wins (1.2x - 5x) 
- 12% of plays: Medium wins (5x - 50x)
- 2.8% of plays: Big wins (50x - 500x)
- 0.2% of plays: Huge wins (500x+)

LOSING CONDITIONS (MANDATORY):
- Include multiple ways to lose completely (0x multiplier)
- Make high-risk scenarios fail more often
- Add time pressure or skill requirements
- Implement progressive difficulty

PSYCHOLOGICAL TECHNIQUES:
- Show "near misses" frequently
- Use visual/audio feedback for wins
- Display recent win history
- Suggest cashout at strategic moments

🚨 MANDATORY PROGRESSIVE DIFFICULTY 🚨
Implement win streak tracking and progressive difficulty:

const [winStreak, setWinStreak] = useState(0);

const applyProgressiveDifficulty = (baseMultiplier) => {
  let difficultyFactor = 1;
  if (winStreak >= 3) {
    difficultyFactor = 0.95 - (winStreak * 0.02);
  }
  return baseMultiplier * Math.max(0.75, difficultyFactor);
};

// Update win streak in endGame function
const endGame = useCallback((result, baseMultiplier) => {
  const validatedMultiplier = validateMultiplier(baseMultiplier, 'casino'); // or appropriate game type
  const finalMultiplier = applyProgressiveDifficulty(parseFloat(validatedMultiplier));
  
  if (result === 'win') {
    setWinStreak(prev => prev + 1);
  } else {
    setWinStreak(0);
  }
  
  setGameEnded(true);
  
  // CRITICAL: This exact logging pattern is required
  if (!isPracticeMode && logEvent && typeof logEvent === 'function') {
    logEvent("gameEnded", { 
      timestamp: new Date().toISOString(),
      result: result, // Must be "win", "loss", or "draw"
      multiplier: finalMultiplier.toFixed(2),
      gameType: "REPLACE_WITH_ACTUAL_GAME_NAME",
      practiceMode: false,
      winStreak: winStreak,
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
    multiplier: finalMultiplier.toFixed(2), 
    timestamp: new Date().toISOString(),
    practice: isPracticeMode || false
  }]);
}, [isPracticeMode, logEvent, gameStartTime, winStreak]);

🚨 MANDATORY VALIDATION FUNCTION 🚨
Include this exact function:

const validateMultiplier = (multiplier, gameType) => {
  const num = parseFloat(multiplier);
  if (isNaN(num) || num < 0) return "0.00";
  
  const maxMultipliers = {
    'mines': 1000, 
    'crash': 1000, 
    'dice': 9999,
    'roulette': 35,
    'slots': 1000,
    'lottery': 5000,
    'skill': 4.0,
    'default': 50
  };
  
  const max = maxMultipliers[gameType] || maxMultipliers.default;
  return Math.min(num, max).toFixed(2);
};

🚨 MANDATORY CODE STRUCTURE 🚨

REQUIRED STATE VARIABLES:
const [gameStarted, setGameStarted] = useState(false);
const [gameEnded, setGameEnded] = useState(false);
const [isPracticeMode, setIsPracticeMode] = useState(false);
const [gameHistory, setGameHistory] = useState([]);
const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
const [gameStartTime, setGameStartTime] = useState(0);
const [winStreak, setWinStreak] = useState(0);
const [actionCount, setActionCount] = useState(0);

REQUIRED FUNCTIONS (all must be present):
- startGame(practiceMode = false)
- endGame(result, multiplier) 
- resetGame()
- validateMultiplier(multiplier, gameType)
- applyProgressiveDifficulty(baseMultiplier)

LAYOUT REQUIREMENTS:
- Main container: Modern glassmorphism styling with gradient backgrounds
- Game title: <Typography id="game-title" variant="h4">GAME NAME</Typography> with gradient text effect
- Responsive design with isMobile state
- Game rules overlay: <Box id="game-rules"> with modern modal styling

GAME HISTORY DISPLAY:
- Show last 10 games in a modern dark table format
- Color code: wins (#39ff14), losses (#ff0080)
- Include practice mode indicator with neon styling
- Display timestamp and multiplier with gradient effects
- Show win streak indicator with glow effects

ERROR PREVENTION:
- Validate all numeric inputs
- Handle edge cases (division by zero, negative values)
- Ensure multiplier never exceeds caps
- Always return valid multiplier strings with 2 decimal places
- Implement proper error boundaries

TESTING CHECKLIST (the generated code must pass all):
✅ logEvent prop is accepted and used
✅ gameStarted event is logged on game start (non-practice)
✅ gameEnded event is logged with result and multiplier (non-practice)
✅ Practice mode works without logging
✅ Multipliers respect advanced house edge calculations
✅ Progressive difficulty system implemented
✅ Win streak tracking functional
✅ Maximum multiplier caps are enforced
✅ Game history displays correctly
✅ Both game modes (normal/practice) function properly
✅ No financial terms or betting logic present
✅ Component exports properly
✅ Advanced probability calculations implemented
✅ Proper loss distribution maintained
✅ Modern Gen Z styling implemented
✅ Glassmorphism and neon effects present

FAILURE CONDITIONS (will cause rejection):
❌ Missing logEvent prop handling
❌ No game start/end logging
❌ Practice mode missing or broken
❌ Multipliers too generous (no house edge)
❌ Missing progressive difficulty system
❌ Missing required state variables
❌ Broken game history
❌ Financial logic present
❌ Missing multiplier validation
❌ Using styled-components instead of sx prop
❌ Improper probability calculations
❌ Old/boring styling (must use modern design)
❌ Missing glassmorphism/neon effects

🚨 EXAMPLE IMPLEMENTATION STRUCTURE 🚨
Here's the required component structure with modern styling:

  // MANDATORY: Immediate validation
  useEffect(() => {
    if (!logEvent || typeof logEvent !== 'function') {
      console.error('⚠️ CRITICAL: logEvent prop is missing or invalid');
    } else {
      console.log('✅ logEvent prop validated successfully');
    }
  }, [logEvent]);

  // REQUIRED STATE VARIABLES
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [actionCount, setActionCount] = useState(0);

  // MANDATORY FUNCTIONS
  const validateMultiplier = (multiplier, gameType) => { /* implementation */ };
  const applyProgressiveDifficulty = (baseMultiplier) => { /* implementation */ };
  const startGame = (practiceMode = false) => { /* implementation */ };
  const endGame = useCallback((result, multiplier) => { /* implementation */ }, []);
  
 
House Edge Validation Comment (REQUIRED at end):
// House Edge: 6-12% progressive | Max Multiplier: 1000x | Expected RTP: 88-94% | Modern Gen Z Styling Applied

REMEMBER: The goal is creating visually stunning games that appeal to young audiences while maintaining mathematical house edge through:
1. Proper probability calculations
2. Progressive difficulty 
3. Weighted random distributions
4. Smart losing condition placement
5. Psychological near-miss mechanics
6. Win streak dampening
7. Strategic cashout encouragement
8. Modern glassmorphism and neon styling
9. Smooth animations and micro-interactions
10. Bold typography and gradient effects`;

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

async function extractRoomInfoFromCode(gameCode) {
  console.log('📊 EXTRACTING ROOM INFO FROM CODE USING OPENAI');
  console.log('Code length:', gameCode.length);

  try {
    console.log('🤖 Calling OpenAI for intelligent extraction...');

    const systemPrompt = `You are an expert at analyzing React game code and extracting metadata. 

Your task is to analyze the provided React game code (which may be JSX or transpiled) and extract:
1. Game Title/Name - Look for the main title displayed in the game
2. Game Type/Theme - What kind of game is this?
3. Game Description - Brief description of how to play

IMPORTANT CONTEXT:
- Look for elements with id="game-title" or similar title indicators first
- The game title is usually the most prominent text element
- Look for Typography components with h1-h6 variants or similar title styling
- Pay attention to text that appears to be the main game name/title
- Look for emoji indicators (🎮🌆🎯🏆🚀⚡🌟💎🔥🎲) that often accompany game titles
- Common game title patterns: "NEON NEXUS", "POKER MASTER", "CRASH GAME", etc.

Return ONLY a valid JSON object with:
{
  "name": "extracted game title (3-50 characters)",
  "gameType": "type of game (e.g., poker, puzzle, racing, casino, card)",
  "description": "brief description of gameplay (20-300 characters)",
  "confidence": number between 0-1 indicating confidence in extraction
}

If you cannot find a clear game title, return null for name and set confidence to 0.`;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Analyze this React game code and extract the game title and information:\n\n${gameCode.substring(0, 8000)}`
        }
      ]
    });

    let extractedData;
    try {
      const responseText = aiResponse.choices[0].message.content.trim();
      console.log('🤖 OpenAI raw response:', responseText);
      
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the entire response as JSON
        extractedData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', aiResponse.choices[0].message.content);
      throw new Error('Failed to parse AI analysis');
    }

    console.log('🤖 OpenAI extracted data:', extractedData);

    // Validate and process AI extraction
    let name = '';
    let confidence = 0;

    if (extractedData.name && extractedData.confidence >= 0.3) {
      // Clean the extracted name
      name = extractedData.name
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      confidence = extractedData.confidence;
      console.log('✅ AI EXTRACTION successful:', name, 'confidence:', confidence);
    } else {
      console.log('⚠️ AI extraction failed or low confidence, using fallback');
      
      // Simple fallback based on game type
      const gameType = extractedData.gameType || 'interactive';
      name = gameType.charAt(0).toUpperCase() + gameType.slice(1) + ' Master';
      confidence = 0.3;
    }

    // Generate ticker from name - much simpler approach
    let ticker = '';
    if (name && name !== 'Generated Game') {
      // Remove all non-letter characters and take first letters of words
      const letters = name
        .replace(/[^\p{L}\s]/gu, '') // Remove everything except letters and spaces
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word[0].toUpperCase())
        .join('')
        .substring(0, 6);

      ticker = letters.length >= 2 ? letters : 'GAME';
    } else {
      ticker = 'GAME';
    }

    // Use AI-extracted description or create fallback
    let description = '';
    if (extractedData.description && extractedData.description.length > 20) {
      description = extractedData.description
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 300);
    } else {
      // Fallback description
      description = name && name !== 'Generated Game'
        ? `Experience ${name} with exciting gameplay and multiplier rewards.`
        : 'An engaging game experience with exciting gameplay mechanics.';
    }

    // Use AI-detected theme or simple detection
    let gameTheme = extractedData.gameType || 'interactive game';
    
    // Add "game" suffix if not present
    if (!gameTheme.includes('game')) {
      gameTheme += ' game';
    }

    const result = {
      name,
      ticker,
      description,
      gameTheme,
      confidence
    };

    console.log('✅ Final AI extraction result:', result);
    return result;

  } catch (error) {
    console.error('❌ Error with OpenAI extraction:', error);
    
    // Fallback to basic regex extraction if OpenAI fails
    console.log('🔄 Falling back to basic regex extraction...');
    return fallbackRegexExtraction(gameCode);
  }
}

// Fallback function in case OpenAI fails
function fallbackRegexExtraction(gameCode) {
  console.log('🔍 Using fallback regex extraction');
  
  try {
    let name = '';
    let confidence = 0;

    // Simple pattern for game-title id
    const gameTitlePattern = /<Typography(?=\s)[^>]*\bid="game-title"[^>]*>\s*([\s\S]*?)\s*<\/Typography>/gi;
    const gameTitleMatch = gameTitlePattern.exec(gameCode);

    if (gameTitleMatch && gameTitleMatch[1]) {
      let rawTitle = gameTitleMatch[1];
      console.log('Raw title found:', JSON.stringify(rawTitle));

      // Clean the title
      let cleanTitle = rawTitle;
      const ternaryMatch = cleanTitle.match(/\{\s*isMobile\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']\s*\}/);
      if (ternaryMatch) {
        cleanTitle = ternaryMatch[2]; // Use the full name (second option)
      } else {
        const literalMatch = cleanTitle.match(/\{\s*["']([^"']+)["']\s*\}/);
        if (literalMatch) {
          cleanTitle = literalMatch[1];
        } else {
          cleanTitle = cleanTitle.replace(/\{[^}]*\}/g, '');
        }
      }

      if (cleanTitle && cleanTitle.length >= 3 && cleanTitle.length <= 200) {
        name = cleanTitle;
        confidence = 0.6;
        console.log('✅ REGEX title found:', name);
      }
    }

    // Generate ticker
    let ticker = '';
    if (name) {
      const letters = name
        .replace(/[^\p{L}\s]/gu, '')
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word[0].toUpperCase())
        .join('')
        .substring(0, 6);
      ticker = letters.length >= 2 ? letters : 'GAME';
    } else {
      name = 'Generated Game';
      ticker = 'GAME';
      confidence = 0.3;
    }

    // Simple description
    const description = name !== 'Generated Game'
      ? `Experience ${name} with exciting gameplay and multiplier rewards.`
      : 'An engaging game experience with exciting gameplay mechanics.';

    // Simple theme detection
    const lowerText = (name + ' ' + gameCode).toLowerCase();
    let gameTheme = 'interactive game';

    if (lowerText.includes('poker') || lowerText.includes('texas') || lowerText.includes('hold')) {
      gameTheme = 'poker game';
    } else if (lowerText.includes('card') || lowerText.includes('deck')) {
      gameTheme = 'card game';
    } else if (lowerText.includes('casino') || lowerText.includes('multiplier')) {
      gameTheme = 'casino game';
    }

    return {
      name,
      ticker,
      description,
      gameTheme,
      confidence
    };

  } catch (error) {
    console.error('❌ Fallback extraction also failed:', error);
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