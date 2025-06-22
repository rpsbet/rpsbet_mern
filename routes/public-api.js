// routes/public-api.js - ENHANCED VERSION with your refactored structure
const express = require('express');
const { apiAuth, requirePermission, createApiRateLimit } = require('../middleware/apiAuth');
const Room = require('../model/Room');
const GameType = require('../model/GameType');
const User = require('../model/User');
const GameLog = require('../model/GameLog');
const System = require('../model/SystemSetting');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const GameCode = require('../model/GameCode');

// Import utility functions (your refactored structure)
const { classifyGameTypes } = require('../helper/util/gameClassification');
const { generateReactComponent } = require('../helper/util/reactGenerator');
const { extractRoomInfoFromCode } = require('../helper/util/codeExtraction');
const { checkWalletBalance, handleAutomatedDeposit } = require('../helper/util/blockchainUtils');
const { convertDalleImageToPinata } = require('../helper/util/imageUtils');

// External APIs
const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = express.Router();

// Apply rate limiting to all public API routes
router.use(createApiRateLimit(3600000, 10)); // 10 requests per hour
router.use(createApiRateLimit(86400000, 100)); // 100 requests per day

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

// ENHANCED: Helper function for intelligent metadata determination
function determineMetadata(providedName, providedTicker, providedDescription, extractedInfo, reactPrompt) {
  console.log('🏷️ DETERMINING FINAL GAME DETAILS (ENHANCED)');
  console.log('Provided:', { name: providedName, ticker: providedTicker, description: providedDescription });
  console.log('Extracted:', extractedInfo);

  let finalName = providedName;
  let finalTicker = providedTicker;
  let finalDescription = providedDescription;

  // ENHANCED: Use extracted values ONLY if provided values are empty AND confidence is good
  if ((!finalName || finalName.trim() === '') && extractedInfo?.name && extractedInfo.confidence > 0.3) {
    finalName = extractedInfo.name;
    console.log('✅ Using extracted name:', finalName);
  }

  if ((!finalTicker || finalTicker.trim() === '') && extractedInfo?.ticker && extractedInfo.confidence > 0.3) {
    finalTicker = extractedInfo.ticker;
    console.log('✅ Using extracted ticker:', finalTicker);
  }

  if ((!finalDescription || finalDescription.trim() === '') && extractedInfo?.description && extractedInfo.confidence > 0.3) {
    finalDescription = extractedInfo.description;
    console.log('✅ Using extracted description:', finalDescription);
  }

  // ENHANCED: Intelligent fallbacks with prompt analysis
  if (!finalName || finalName.trim() === '') {
    // Analyze prompt for keywords to generate better name
    const promptWords = reactPrompt
      .toLowerCase()
      .split(/[\s,.-]+/)
      .filter(word => 
        word.length > 3 && 
        !['game', 'with', 'that', 'have', 'this', 'make', 'create', 'where', 'when', 'what', 'will', 'like', 'want'].includes(word)
      )
      .slice(0, 2); // Take first 2 meaningful words

    if (promptWords.length > 0) {
      finalName = promptWords
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') + ' Game';
      console.log('🔍 Generated intelligent name from prompt:', finalName);
    } else {
      finalName = 'Generated Game';
      console.log('⚠️ Using fallback name:', finalName);
    }
  }

  if (!finalTicker || finalTicker.trim() === '') {
    // Generate ticker from final name using same logic as working version
    const words = finalName.split(/\s+/).filter(word => word.length > 0);
    finalTicker = words
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 6);

    if (finalTicker.length < 2) {
      finalTicker = finalName.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '') || 'GAME';
    }
    console.log('🔧 Generated ticker:', finalTicker);
  }

  if (!finalDescription || finalDescription.trim() === '') {
    finalDescription = `Experience ${finalName} with unique gameplay mechanics and exciting multiplier rewards.`;
    console.log('📝 Generated description');
  }

  // Validate final values
  if (finalName.length < 3 || finalName.length > 50) {
    finalName = 'Generated Game';
    finalTicker = 'GAME';
  }

  if (finalTicker.length < 2 || finalTicker.length > 6 || !/^[A-Z0-9]+$/.test(finalTicker)) {
    finalTicker = 'GAME';
  }

  if (finalDescription.length < 20 || finalDescription.length > 500) {
    finalDescription = 'An engaging game experience with exciting gameplay mechanics.';
  }

  console.log('📝 Final validated details:', { finalName, finalTicker, finalDescription });

  return {
    name: finalName,
    ticker: finalTicker,
    description: finalDescription,
    extractionUsed: {
      name: extractedInfo?.name && extractedInfo.confidence > 0.3 && !providedName,
      ticker: extractedInfo?.ticker && extractedInfo.confidence > 0.3 && !providedTicker,
      description: extractedInfo?.description && extractedInfo.confidence > 0.3 && !providedDescription
    }
  };
}

// Create room via API (ENHANCED with your refactored utilities)
router.post('/create-room', apiAuth, requirePermission('create_room'), async (req, res) => {
  console.log('🎮 CREATE ROOM API CALLED (ENHANCED REFACTORED VERSION)');
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

    // Image generation/processing (keep your existing logic)
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

        // Convert DALL-E image to Pinata upload using your utility
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

    // ENHANCED: Generate React code using your refactored utility
    console.log('⚛️ GENERATING REACT COMPONENT (USING REFACTORED UTILITY)');
    console.log('React prompt:', reactPrompt);
    console.log('Image URLs for React:', imageUrls);

    let generatedReact = null;
    let extractedInfo = null;
    let finalGameCode = '';

    try {
      // Use your refactored generateReactComponent utility
      const reactResult = await generateReactComponent(
        reactPrompt, 
        imageUrls.length > 0 ? imageUrls : (finalImageUrl ? [finalImageUrl] : [])
      );
      
      generatedReact = reactResult;
      finalGameCode = reactResult.finalApp; // This should be the transpiled code
      console.log('✅ React component generated successfully');
      console.log('Generated code length:', finalGameCode.length);
      console.log('Has validation:', !!reactResult.validation);

      // ENHANCED: Extract room info using your refactored utility
      console.log('📊 EXTRACTING ROOM INFO (USING REFACTORED UTILITY)');
      extractedInfo = await extractRoomInfoFromCode(finalGameCode);
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

    // ENHANCED: Use improved metadata determination
    const metadataResult = determineMetadata(
      providedName,
      originalTicker,
      originalDescription,
      extractedInfo,
      reactPrompt
    );

    const finalName = metadataResult.name;
    const finalTicker = metadataResult.ticker;
    const finalDescription = metadataResult.description;

    console.log('📝 Final game details:');
    console.log('- Name:', finalName);
    console.log('- Ticker:', finalTicker);
    console.log('- Description:', finalDescription);

    // ENHANCED: Game type classification using your refactored utility
    console.log('🏷️ CLASSIFYING GAME TYPES (USING REFACTORED UTILITY)');
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

    // Process mandatory automated deposit using your refactored utility
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

    // Calculate fees and create room (keep your existing logic)
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

    // ENHANCED: Prepare comprehensive response
    console.log('📤 PREPARING ENHANCED RESPONSE');
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
        game_types: classifiedGameTypes, // Include all types
        created_at: newRoom.created_at,
        gameCode: finalGameCode,
        image: finalImageUrl,
        description: newRoom.description
      },
      deposit: depositResult,
      reactGeneration: {
        success: true,
        codeLength: finalGameCode.length,
        validation: generatedReact.validation,
        proxiedAssets: generatedReact.proxiedAssets
      },
      extraction: {
        success: !!extractedInfo?.name,
        confidence: extractedInfo?.confidence || 0,
        extractedData: extractedInfo ? {
          name: extractedInfo.name,
          ticker: extractedInfo.ticker,
          description: extractedInfo.description,
          gameTheme: extractedInfo.gameTheme
        } : null,
        metadataUsage: metadataResult.extractionUsed,
        fallbacksUsed: {
          name: !metadataResult.extractionUsed.name && !providedName,
          ticker: !metadataResult.extractionUsed.ticker && !originalTicker,
          description: !metadataResult.extractionUsed.description && !originalDescription
        }
      },
      classification: {
        success: classifiedGameTypes.length > 0,
        gameTypes: classifiedGameTypes,
        primaryType: classifiedGameTypes[0]
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

    console.log('🎉 ROOM CREATION SUCCESSFUL (ENHANCED)');
    console.log('Response summary:', {
      roomId: response.room.id,
      roomNumber: response.room.room_number,
      roomName: response.room.name,
      roomTicker: response.room.ticker,
      roomDescription: response.room.description,
      hasImage: !!response.room.image,
      extractionConfidence: response.extraction.confidence,
      gameTypes: response.classification.gameTypes,
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

module.exports = router;