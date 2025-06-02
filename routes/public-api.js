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
router.use(createApiRateLimit(3600000, 100)); // 100 requests per hour
router.use(createApiRateLimit(86400000, 1000)); // 1000 requests per day

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    success: true,
    api: {
      name: 'Game Creation API',
      version: '1.0.0',
      endpoints: {
        'POST /create-room': 'Create a new game room with blockchain deposit',
        'POST /generate-image': 'Generate AI images for games',
        'POST /generate-react': 'Generate React game components',
        'POST /extract-room-info': 'Extract information from game code',
        'GET /game-types': 'List available game types'
      },
      authentication: 'API Key required in X-API-Key header',
      rateLimit: {
        default: '100 requests/hour, 1000 requests/day',
        customizable: true
      }
    }
  });
});

// Get available game types
router.get('/game-types', apiAuth, async (req, res) => {
  try {
    const gameTypes = await GameType.find({ isActive: true }).select('game_type_id game_type_name short_name description');
    
    res.json({
      success: true,
      gameTypes
    });
  } catch (error) {
    console.error('Error fetching game types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game types'
    });
  }
});

// Create room via API (with Web3 deposit handling)
router.post('/create-room', apiAuth, requirePermission('create_room'), async (req, res) => {
  try {
    const {
      // Required fields
      bet_amount,
      name,
      game_type,
      connectedAccount, // Web3 wallet address
      
      // Optional fields
      image,
      ticker,
      tax = 0,
      telegram_link = '',
      x_link = '',
      website_link = '',
      is_private = false,
      endgame_amount,
      endgame_type,
      selectedStrategy,
      description = '',
      room_password = '',
      prompt = '',
      gameCode = '',
      qs_nation = '',
      
      // Blockchain fields
      privateKey, // Optional: for automated signing
      skipDeposit = false // For testing or if deposit handled externally
    } = req.body;

    // Validation
    const user_bet = parseFloat(bet_amount);
    if (user_bet <= 0 || user_bet < 0.001) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bet amount. Minimum is 0.001 SOL'
      });
    }

    if (!name || name.length < 3 || name.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Game name must be 3-20 characters'
      });
    }

    if (!connectedAccount) {
      return res.status(400).json({
        success: false,
        error: 'Connected wallet address required'
      });
    }

    // Check user permissions and balance
    if (req.user.elite === '') {
      return res.status(403).json({
        success: false,
        error: 'Game creation is only for elite members'
      });
    }

    if (req.user.isWithdrawing) {
      return res.status(400).json({
        success: false,
        error: 'Cannot create room while withdrawal is in progress'
      });
    }

    if (user_bet > req.user.balance && !skipDeposit) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    // Get game type
    const gameTypeDoc = await GameType.findOne({ game_type_id: parseInt(game_type) });
    if (!gameTypeDoc) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game type'
      });
    }

    // Handle blockchain deposit
    let depositResult = { success: true, txHash: null };
    
    if (!skipDeposit) {
      if (privateKey) {
        // Automated deposit using provided private key
        try {
          depositResult = await handleAutomatedDeposit({
            privateKey,
            amount: user_bet,
            fromAddress: connectedAccount,
            roomName: name
          });
        } catch (depositError) {
          return res.status(400).json({
            success: false,
            error: 'Deposit failed: ' + depositError.message,
            details: depositError
          });
        }
      } else {
        // Return deposit instructions for manual handling
        return res.json({
          success: false,
          requiresDeposit: true,
          depositInstructions: {
            amount: user_bet,
            toAddress: process.env.adminWallet,
            message: 'Please send the deposit transaction and include the txHash in your next request',
            nextStep: 'Call this endpoint again with txHash parameter'
          }
        });
      }
    }

    // Calculate fees and create room
    const commissionDoc = await System.findOne({ name: 'commission' });
    const commissionPercentage = commissionDoc?.value || 5;
    const fee = user_bet * (commissionPercentage / 100);
    const amountAfterFee = user_bet - fee;

    const roomCount = await Room.countDocuments({});
    const room_number = roomCount + 1;

    // Create room object
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

    const newRoom = new Room({
      creator: req.user._id,
      room_password,
      bet_amount: amountAfterFee,
      is_private,
      qs_nation,
      battles: 0,
      hosts: [hostObj],
      game_type: gameTypeDoc,
      qs_game_type: 2,
      user_bet: amountAfterFee,
      tax,
      name,
      image,
      ticker: ticker || name.substring(0, 6).toUpperCase(),
      x_link,
      gameCode,
      prompt,
      telegram_link,
      website_link,
      selectedStrategy,
      pr: 0,
      total_stakes: amountAfterFee,
      endgame_amount: endgame_type ? endgame_amount : amountAfterFee,
      endgame_type,
      host_pr: amountAfterFee,
      room_name: gameTypeDoc.short_name + '-' + room_number,
      room_number,
      index: room_number,
      status: 'open',
      description,
    });

    // Create game log
    const newGameLog = new GameLog({
      room: newRoom._id,
      creator: req.user._id,
      joined_user: req.user._id,
      game_type: gameTypeDoc._id,
      bet_amount: amountAfterFee,
      hosts: [hostObj],
      game_result: -3000,
    });

    // Update user balance
    const updatedUser = {
      balance: req.user.balance - (skipDeposit ? 0 : amountAfterFee),
      updated_at: new Date(),
      totalTraded: req.user.totalTraded + Math.abs(user_bet),
      tradingProfit: req.user.tradingProfit - amountAfterFee
    };

    // Save all documents
    await Promise.all([
      saveDocumentWithRetry(newGameLog),
      User.findByIdAndUpdate(req.user._id, updatedUser),
      saveDocumentWithRetry(newRoom),
      System.findOneAndUpdate(
        { name: 'platform_trading' },
        { $inc: { value: fee } }
      )
    ]);

    // Prepare response
    const response = {
      success: true,
      room: {
        id: newRoom._id,
        room_number: newRoom.room_number,
        name: newRoom.name,
        ticker: newRoom.ticker,
        bet_amount: amountAfterFee,
        status: newRoom.status,
        game_type: gameTypeDoc.game_type_name,
        created_at: newRoom.created_at
      },
      deposit: depositResult,
      api_usage: {
        key_id: req.apiKey.keyId,
        usage_count: req.apiKey.usageCount + 1
      }
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('API Create Room Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room',
      message: error.message
    });
  }
});

// Helper function for automated deposits
async function handleAutomatedDeposit({ privateKey, amount, fromAddress, roomName }) {
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
    const connection = new Connection(process.env.PROVIDER_URL, 'confirmed');
    
    // Create keypair from private key
    const secretKey = bs58.decode(privateKey);
    const userKeypair = Keypair.fromSecretKey(secretKey);
    
    // Verify the from address matches the private key
    if (userKeypair.publicKey.toString() !== fromAddress) {
      throw new Error('Private key does not match the provided wallet address');
    }
    
    // Get admin wallet
    const adminWalletPubkey = new PublicKey(process.env.adminWallet);
    
    // Create transaction
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userKeypair.publicKey,
        toPubkey: adminWalletPubkey,
        lamports,
      })
    );
    
    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = userKeypair.publicKey;
    
    // Send transaction
    const signature = await connection.sendTransaction(transaction, [userKeypair]);
    
    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error('Transaction failed on blockchain');
    }
    
    return {
      success: true,
      txHash: signature,
      amount,
      explorerUrl: `https://explorer.solana.com/tx/${signature}`
    };
    
  } catch (error) {
    console.error('Automated deposit error:', error);
    throw new Error(`Deposit failed: ${error.message}`);
  }
}

// Generate image via API
router.post('/generate-image', apiAuth, requirePermission('generate_image'), async (req, res) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Image prompt is required'
      });
    }

    const validSizes = ['1024x1024', '1024x1792', '1792x1024'];
    const requestedSize = validSizes.includes(size) ? size : '1024x1024';

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: requestedSize,
      quality: quality,
    });

    const imageUrl = response.data[0].url;

    res.json({
      success: true,
      imageUrl,
      originalPrompt: prompt,
      size: requestedSize,
      api_usage: {
        key_id: req.apiKey.keyId,
        usage_count: req.apiKey.usageCount + 1
      }
    });

  } catch (error) {
    console.error('API Generate Image Error:', error);
    
    if (error.message && error.message.includes('content_policy_violation')) {
      return res.status(400).json({
        success: false,
        error: 'Content policy violation',
        message: 'The image prompt violates OpenAI content policy'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Image generation failed',
      message: error.message
    });
  }
});

// Generate React component via API
router.post('/generate-react', apiAuth, requirePermission('generate_react'), async (req, res) => {
  try {
    const { prompt, imageUrls = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    // Process assets similar to your existing logic
    const urlRegex = /https?:\/\/[^\s]+?\.(jpg|jpeg|png|mp3|wav|ogg)/gi;
    const promptUrls = (prompt.match(urlRegex) || []).filter(url => url.length < 500);
    const allImageUrls = imageUrls.length > 0 ? imageUrls : promptUrls.filter(url => /\.(jpg|jpeg|png)$/i.test(url));
    const audioUrls = promptUrls.filter(url => /\.(mp3|wav|ogg)$/i.test(url));

    const proxiedAssets = {
      images: allImageUrls.map((url, i) => ({ key: `image${i}`, proxiedUrl: url })),
      audio: audioUrls.map((url, i) => ({ key: `audio${i}`, proxiedUrl: url })),
    };

    // Use your existing system prompt
    const systemPrompt = `You are an elite React developer. Generate a complete, working React game component.

Output Requirements:
- Return ONLY valid JavaScript/React code for the App component
- Start with "const App = ..." or "function App"
- End with "export default App;"
- No markdown, explanations, or extra text

Required Imports:
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Button, Modal } from '@mui/material';

CRITICAL: NO FINANCIAL LOGIC
- DO NOT include any bet amount, balance, wallet, or money-related state
- Focus purely on game mechanics and user interaction

Game Title Requirement:
- Include a <Typography> component with id="game-title"
- The title should be 3-20 characters, catchy, and relevant

Rules Modal Requirement:
- Include a rules modal with <Box> component with id="game-rules"
- Rules should clearly explain gameplay mechanics

Responsive Design:
- Main container MUST use: width: "100%", height: "100%"
- Glassmorphic dark theme design (#080808 background)`;

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

    let cleanedCode = rawCode
      .replace(/```(?:jsx?|javascript)?/g, '')
      .replace(/^\s*[\r\n]+/gm, '')
      .trim();

    if (!cleanedCode.endsWith('export default App;')) {
      cleanedCode = `${cleanedCode}\nexport default App;`;
    }

    res.json({
      success: true,
      finalApp: cleanedCode,
      proxiedAssets,
      api_usage: {
        key_id: req.apiKey.keyId,
        usage_count: req.apiKey.usageCount + 1
      }
    });

  } catch (error) {
    console.error('API Generate React Error:', error);
    res.status(500).json({
      success: false,
      error: 'React generation failed',
      message: error.message
    });
  }
});

// Extract room info via API  
router.post('/extract-room-info', apiAuth, requirePermission('extract_room_info'), async (req, res) => {
  try {
    const { gameCode } = req.body;

    if (!gameCode) {
      return res.status(400).json({
        success: false,
        error: 'Game code is required'
      });
    }

    // Use your existing extraction logic
    const titleMatch = gameCode.match(/<Typography[^>]*id="game-title"[^>]*>(.*?)<\/Typography>/i);
    let name = titleMatch ? titleMatch[1].trim() : '';
    if (!name || name.length < 3 || name.length > 20) {
      name = 'Default Game';
    }

    const ticker = name
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 6) || 'GAME';

    const rulesMatch = gameCode.match(/<Box[^>]*id="game-rules"[^>]*>([\s\S]*?)<\/Box>/i);
    let rulesText = '';
    if (rulesMatch && rulesMatch[1]) {
      const textMatches = rulesMatch[1].match(/<Typography[^>]*>(.*?)<\/Typography>/gi) || [];
      rulesText = textMatches
        .map(match => match.match(/<Typography[^>]*>(.*?)<\/Typography>/i)[1])
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (!rulesText) {
      rulesText = 'Play the game to achieve high multipliers.';
    }

    const description = rulesText.length > 200 
      ? rulesText.substring(0, 197) + '...' 
      : rulesText;

    const themeWords = (name + ' ' + rulesText).toLowerCase();
    let gameTheme = 'generic game';
    if (themeWords.includes('dice')) gameTheme = 'dice game';
    else if (themeWords.includes('card')) gameTheme = 'card game';
    else if (themeWords.includes('race') || themeWords.includes('speed')) gameTheme = 'racing game';
    else if (themeWords.includes('puzzle')) gameTheme = 'puzzle game';

    const extractedInfo = {
      name,
      ticker,
      description,
      gameTheme,
      confidence: titleMatch && rulesMatch ? 0.95 : 0.7
    };

    res.json({
      success: true,
      ...extractedInfo,
      api_usage: {
        key_id: req.apiKey.keyId,
        usage_count: req.apiKey.usageCount + 1
      }
    });

  } catch (error) {
    console.error('API Extract Room Info Error:', error);
    res.status(500).json({
      success: false,
      error: 'Extraction failed',
      message: error.message
    });
  }
});

module.exports = router;