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
const mongoose = require('mongoose');
const User = require('../model/User');
const Room = require('../model/Room');
const GameType = require('../model/GameType');
const GameLog = require('../model/GameLog');
const GameCode = require('../model/GameCode');
const Message = require('../model/Message');
const Notification = require('../model/Notification');
const GameTransaction = require('../model/Transaction');
const System = require('../model/SystemSetting');
const { generateReactComponent } = require('../helper/util/reactGenerator.js');
const {
  convertGameLogToHistoryStyle,
} = require('../helper/util/convertGameLogToHistoryStyle');
const executeBet3 = require('../helper/util/betExecutor3');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const check_access_time = require('../helper/util/checkAccessTime');
const getUserTokens = require('../helper/util/getUserToken');
const transpileReactCode = require('../helper/util/transpileReactCode');

const multer = require('multer');
const FormData = require('form-data');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const axios = require('axios');

const {
  mintTokenWithMetadata,
} = require('../helper/util/mintTokenWithMetadata');
const { createAmmPool } = require('../helper/util/createPool');
const { createMarket } = require('../helper/util/createMarket');
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { revokeMintAndFreezeAuthorities } = require('../helper/util/authority');
const { distributeTokens } = require('../helper/util/distributeTokens');

const compression = require('compression');
router.use(compression());
const PINATA_JWT = process.env.PINATA_JWT;

router.get('/game_types/top', async (req, res) => {
  const cacheKey = 'top_game_types';
  const redisClient = req.app.get('redisClient');

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

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
      { $limit: 16 }, // Get the top 10 game types
      { $project: { _id: 0, game_type_name: '$_id' } } // Reshape to return just the name
    ]);

    // Format the response to match the original structure
    const response = {
      success: true,
      gameTypes: topGameTypes.map(gt => gt.game_type_name),
    };

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
    res.json(response);

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
    
    // Also provide alternative gateway URLs in case of rate limiting
    const alternativeUrls = [
      `https://ipfs.io/ipfs/${IpfsHash}`,
      `https://cloudflare-ipfs.com/ipfs/${IpfsHash}`,
      `https://dweb.link/ipfs/${IpfsHash}`,
    ];

    return res.json({
      success: true,
      imageUrl,
      ipfsHash: IpfsHash,
      alternativeUrls,
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

  if (!roomId || !gameCode) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Find the room and verify ownership
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only the room creator can update the game code' });
    }

    // Update or create game code
    const updatedGameCode = await GameCode.findOneAndUpdate(
      { room: roomId },
      {
        code: gameCode,
        updated_at: new Date(),
        $inc: { version: 1 }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    // If this was an insert (new document), set the created_by field
    if (!updatedGameCode.created_by) {
      updatedGameCode.created_by = req.user._id;
      await updatedGameCode.save();
    }

    // Emit socket event
    req.io.sockets.emit('GAMECODE_UPDATED', {
      roomId,
      gameCode,
      version: updatedGameCode.version
    });

    res.json({
      success: true,
      message: 'Room game code updated successfully!',
      gameCode: {
        code: updatedGameCode.code,
        version: updatedGameCode.version,
        updated_at: updatedGameCode.updated_at
      }
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
    console.log('[Extract] Code length:', gameCode.length);

    // Use OpenAI to extract game information instead of regex
    const systemPrompt = `You are an expert at analyzing React game code and extracting metadata. 

Your task is to analyze the provided transpiled React game code and extract:
1. Game Title/Name - Look for the main title displayed in the game
2. Game Type/Theme - What kind of game is this?
3. Game Description - Brief description of how to play

IMPORTANT CONTEXT:
- The code is already transpiled, so you'll see React.createElement() calls instead of JSX
- Look for elements with id="game-title" or similar title indicators
- The game title is usually the most prominent text element
- Look for Typography components with h1-h6 variants or similar title styling
- Pay attention to text that appears to be the main game name/title

Return ONLY a JSON object with:
{
  "name": "extracted game title (3-20 characters)",
  "gameType": "type of game (e.g., poker, puzzle, racing)",
  "description": "brief description of gameplay",
  "confidence": number between 0-1 indicating confidence in extraction
}

If you cannot find a clear game title, return null for name and set confidence to 0.`;

    try {
      console.log('[Extract] Making OpenAI API call...');
      console.log('[Extract] Code preview being sent:', gameCode.substring(0, 300) + '...');
      
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
            content: `Analyze this transpiled React game code and extract the game title and information:\n\n${gameCode.substring(0, 8000)}`
          }
        ]
      });

      console.log('[Extract] OpenAI API call successful');
      console.log('[Extract] Response usage:', aiResponse.usage);

      let extractedData;
      try {
        const responseText = aiResponse.choices[0].message.content.trim();
        console.log('[Extract] OpenAI raw response:', responseText);

        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          // Try parsing the entire response as JSON
          extractedData = JSON.parse(responseText);
        }
      } catch (parseError) {
        console.error('[Extract] Failed to parse OpenAI response:', parseError);
        console.error('[Extract] Raw response:', aiResponse.choices[0].message.content);
        throw new Error('Failed to parse AI analysis');
      }

      console.log('[Extract] AI extracted data:', extractedData);

      // Validate AI extraction
      if (!extractedData.name || extractedData.confidence < 0.5) {
        console.log('[Extract] AI extraction failed or low confidence, using fallback');

        // Simple fallback based on game type
        const gameType = extractedData.gameType || 'interactive';
        const fallbackName = gameType.charAt(0).toUpperCase() + gameType.slice(1) + ' Master';

        extractedData = {
          name: fallbackName,
          gameType: gameType,
          description: extractedData.description || `An engaging ${gameType} game with exciting gameplay mechanics.`,
          confidence: 0.3
        };
      }

      // Generate ticker from name
      let ticker = '';
      if (extractedData.name) {
        const cleanName = extractedData.name
          .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
          .replace(/[^\w\s]/g, ' ')
          .trim();

        const words = cleanName.split(/\s+/).filter(word => word.length > 0);
        ticker = words
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 6);

        if (ticker.length < 2) {
          ticker = cleanName.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '');
        }
        if (ticker.length < 2) ticker = 'GAME';
        if (ticker.length > 6) ticker = ticker.substring(0, 6);
      }

      const result = {
        name: extractedData.name || 'Game Master',
        ticker: ticker || 'GAME',
        description: extractedData.description || 'A fun and engaging game experience.',
        gameTheme: extractedData.gameType || 'interactive game',
        confidence: extractedData.confidence || 0.3
      };

      console.log('[Extract] ✅ Final Result:', result);
      res.json(result);

    } catch (openaiError) {
      console.error('[Extract] OpenAI analysis failed:', openaiError);
      console.error('[Extract] Error details:', {
        message: openaiError.message,
        status: openaiError.status,
        code: openaiError.code,
        type: openaiError.type
      });

      // Check if it's a rate limit error
      if (openaiError.status === 429 || openaiError.message?.includes('rate limit')) {
        console.error('[Extract] Rate limit exceeded - this is likely the production issue');
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'OpenAI API rate limit exceeded. Please try again later.',
          isRateLimit: true
        });
      }

      // Check if it's a quota error
      if (openaiError.status === 403 || openaiError.message?.includes('quota')) {
        console.error('[Extract] Quota exceeded - this is likely the production issue');
        return res.status(403).json({
          error: 'Quota exceeded',
          message: 'OpenAI API quota exceeded. Please check your billing.',
          isQuotaExceeded: true
        });
      }

      // Fallback to basic analysis if AI fails
      const fallbackResult = {
        name: 'Game Master',
        ticker: 'GAME',
        description: 'A fun and engaging game experience.',
        gameTheme: 'interactive game',
        confidence: 0.2
      };

      console.log('[Extract] Using fallback result:', fallbackResult);
      res.json(fallbackResult);
    }

  } catch (error) {
    console.error('[Extract] ❌ Error:', error);
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

    // Basic input validation
    if (!req.user?._id) {
      throw new Error('User not authenticated');
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    if (!Array.isArray(imageUrls)) {
      throw new Error('imageUrls must be an array');
    }

    console.log(`[React Generator] Request from user ${req.user._id}: ${prompt.substring(0, 100)}...`);

    // Add timeout wrapper for production environments to avoid 504 gateway timeouts
    const GENERATION_TIMEOUT = process.env.NODE_ENV === 'production' ? 230000 : 290000; // 3:50 prod, 4:50 dev
    
    const result = await Promise.race([
      generateReactComponent(prompt, imageUrls),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Generation timeout: Request took too long to complete. Please try with a shorter or simpler prompt.')), GENERATION_TIMEOUT)
      )
    ]);

    // Log success
    console.log(`[React Generator] ✅ Successfully generated component for user ${req.user._id}`);

    // Return the result
    res.json(result);

  } catch (error) {
    console.error(`[React Generator] ❌ Error for user ${req.user?._id}:`, error.message);
    
    // Determine appropriate status code and user message based on error type
    let statusCode = 500;
    let userMessage = error.message || 'Failed to generate React component';
    
    if (error.message && error.message.includes('timeout')) {
      statusCode = 504;
      userMessage = 'Generation timed out. Please try with a shorter or simpler prompt.';
    } else if (error.message && error.message.includes('Anthropic API call timed out')) {
      statusCode = 504;
      userMessage = 'AI service timed out. Please try again with a simpler prompt.';
    }
    
    res.status(statusCode).json({
      error: statusCode === 504 ? 'Request timeout' : 'Internal server error',
      message: userMessage,
      validation: {
        passed: false,
        error: error.message
      }
    });
  }
});

router.post('/update-react', auth, async (req, res) => {
  try {
    const { prompt, currentCode, proxiedAssets = {} } = req.body || {};

    if (!req.user?._id) {
      throw new Error('User not authenticated');
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    if (!currentCode || typeof currentCode !== 'string') {
      throw new Error('Current code is required and must be a string');
    }

    console.log(`[React Update] User: ${req.user._id}, Prompt: ${prompt.substring(0, 100)}...`);

    // Use existing proxied assets without modification
    const finalProxiedAssets = proxiedAssets;

    const systemPrompt = `You are an expert React developer. You will be given existing React game code and a user's modification request.

CRITICAL INSTRUCTIONS:
1. **ONLY MODIFY** what the user specifically requests - do not add or change anything else
2. **PRESERVE EVERYTHING** that is not mentioned in the user's request
3. **MAINTAIN** all existing functionality, state management, and props
4. **KEEP** existing multiplier systems, game history, styling, and layout unchanged unless specifically requested
5. **DO NOT** add financial logic, betting, balance, or wallet features unless explicitly requested

MODIFICATION APPROACH:
- Read the user's request carefully and implement ONLY what they asked for
- Preserve all existing code structure, imports, exports, and functionality
- Make minimal, targeted changes that address the specific request
- Maintain the exact same component architecture and patterns

OUTPUT REQUIREMENTS:
- Return the complete updated component code
- Preserve exact formatting and structure of original code
- Only modify the specific parts mentioned in the user's request
- No markdown formatting or explanations`;
    // Use Claude with streaming for faster response
    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.1, // Lower temperature for more precise modifications
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Current React game code:

\`\`\`javascript
${currentCode}
\`\`\`

User's specific modification request: "${prompt}"

Instructions:
- Implement ONLY the requested change
- Preserve ALL existing functionality and code structure
- Do not modify anything not mentioned in the request
- Return the complete updated component`,
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

    // Clean the generated code minimally
    let cleanedCode = rawCode
      .replace(/```(?:jsx?|javascript)?/g, '')
      .trim();

    // Basic validation only
    if (!cleanedCode.includes('App')) {
      throw new Error('Updated code does not contain App component');
    }

    console.log(`[React Update] Successfully updated component for user: ${req.user._id}`);

    const transpiledCode = await transpileReactCode(cleanedCode);

    res.json({
      originalCode: cleanedCode,
      transpiledCode: transpiledCode,
      finalApp: transpiledCode,
      proxiedAssets: finalProxiedAssets,
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
  const userId = req.user._id;
  const redisClient = req.app.get('redisClient');

  if (!['like', 'dislike', 'view'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid type' });
  }

  try {
    // 1. Find the room by its ID first
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // 2. Modify the document in your JavaScript code
    if (type === 'view') {
      if (!room.views.includes(userId)) {
        room.views.push(userId);
      }
    } else {
      const oppositeType = type === 'like' ? 'dislikes' : 'likes';
      const typeArray = type === 'like' ? 'likes' : 'dislikes';

      // Check if the user has already performed this action
      const alreadyDone = room[typeArray].includes(userId);

      // Remove from the opposite array first, if present
      const oppositeIndex = room[oppositeType].indexOf(userId);
      if (oppositeIndex > -1) {
        room[oppositeType].splice(oppositeIndex, 1);
      }

      // If the user already liked/disliked, this click removes it (toggle off)
      if (alreadyDone) {
        const index = room[typeArray].indexOf(userId);
        room[typeArray].splice(index, 1);
      } else {
        // Otherwise, add the like/dislike (toggle on)
        room[typeArray].push(userId);
      }
    }

    // 3. Save the modified document. This is the crucial step that persists the changes.
    const savedRoom = await room.save();
    try {
      await redisClient.del('rooms:All');

      // Also invalidate the cache for each specific game type this room belongs to
      if (Array.isArray(room.game_type)) {
        for (const gameType of room.game_type) {
          await redisClient.del(`rooms:${gameType}`);
        }
      } else {
        await redisClient.del(`rooms:${room.game_type}`);
      }
    } catch (redisErr) {
      console.error('Failed to invalidate cache:', redisErr);
    }
    // Now populate the necessary fields on the saved document before sending it back
    const populatedRoom = await savedRoom.populate([
      { path: 'hosts.host', select: 'username avatar elite accessory rank walletAddress' },
      { path: 'joiners', select: 'username avatar elite accessory rank walletAddress' }
    ]);


    // 4. Emit the update via sockets
    req.io.sockets.emit('ROOM_ACTION_UPDATED', {
      roomId: populatedRoom._id,
      likes: populatedRoom.likes,
      dislikes: populatedRoom.dislikes,
      views: populatedRoom.views,
      type: type,
      userId: req.user._id
    });

    // 5. Send the successful response
    res.json({
      success: true,
      message: 'Successful!',
      room: populatedRoom
    });

  } catch (error) {
    console.error('Error updating room action:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 1. BACKEND ROUTE - Return individual room by ID/index
router.get('/room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const redisClient = req.app.get('redisClient');
  const cacheKey = `room:v2:${roomId}`;

  try {
    // Try cache first - individual rooms cached longer
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Optimized aggregation pipeline for better performance
    const roomData = await Room.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $lookup: {
          from: 'rps_users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator_data',
          pipeline: [
            {
              $project: {
                avatar: 1,
                totalWagered: 1,
                username: 1,
                accessory: 1,
                elite: 1,
                status: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'rps_users',
          localField: 'joiners',
          foreignField: '_id',
          as: 'joiner_data',
          pipeline: [
            {
              $project: {
                avatar: 1,
                totalWagered: 1,
                username: 1,
                accessory: 1,
                elite: 1
              }
            }
          ]
        }
      },
      {
        $project: {
          // Only include fields needed by frontend
          _id: 1,
          name: 1,
          ticker: 1,
          image: 1,
          description: 1,
          room_number: 1,
          likes: { $ifNull: ['$likes', []] },
          dislikes: { $ifNull: ['$dislikes', []] },
          game_type: 1,
          bet_amount: 1,
          user_bet: 1,
          pr: 1,
          host_pr: 1,
          endgame_amount: 1,
          is_private: 1,
          status: 1,
          created_at: 1,
          updated_at: 1,
          battles: 1,
          hosts: 1,
          creator: { $arrayElemAt: ['$creator_data', 0] },
          joiners: '$joiner_data'
        }
      }
    ]).hint({ _id: 1 }); // Force index on _id

    if (!roomData || roomData.length === 0) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const room = roomData[0];

    // Process the data efficiently
    const processedRoom = {
      _id: room._id,
      creator_id: room.creator?._id || '',
      joiners: room.joiners.map(joiner => ({
        avatar: joiner.avatar,
        rank: joiner.totalWagered,
        username: joiner.username,
        accessory: joiner.accessory,
        elite: joiner.elite,
        _id: joiner._id,
      })),
      ticker: room.ticker || room.room_number,
      rank: room.creator?.totalWagered || 0,
      creator_avatar: room.creator?.avatar || '',
      accessory: room.creator?.accessory || '',
      elite: room.creator?.elite || '',
      username: room.creator?.username || '',
      creator_status: room.creator?.status || '',
      game_type: room.game_type || [],
      name: room.name,
      description: room.description,
      image: room.image,
      bet_amount: room.bet_amount,
      pr: room.pr,
      endgame_amount: room.endgame_amount,
      host_pr: room.host_pr,
      room_name: (room.game_type && room.game_type.length > 0 ? room.game_type[0] : 'Unknown') + '-' + room.room_number,
      total_stakes: room.hosts.reduce((acc, host) => acc + (host.stake || 0), 0),
      user_bet: parseFloat(room.user_bet || 0),
      is_private: room.is_private,
      status: room.status,
      index: room.room_number,
      created_at: room.created_at,
      updated_at: room.updated_at,
      battles: room.battles,
      likes: room.likes,
      dislikes: room.dislikes,
      hosts: room.hosts,
      winnings: parseFloat(room.user_bet || 0),
    };

    const response = {
      success: true,
      room: processedRoom
    };

    // Cache individual rooms for 2 minutes
    await redisClient.setEx(cacheKey, 120, JSON.stringify(response));

    res.json(response);
  } catch (err) {
    console.error('Error fetching individual room:', err);
    res.status(500).json({
      success: false,
      error: err.toString()
    });
  }
});

// 2. UPDATED ROOMS LIST ROUTE - Return room IDs only
router.get('/rooms/ids', async (req, res) => {
  const game_type_filter = req.query.game_type || 'All';
  const limit = parseInt(req.query.limit) || 30;
  const page = parseInt(req.query.page) || 1;
  const sort_by = req.query.sort_by || 'default'; // New sorting parameter
  const skip = (page - 1) * limit;
  const redisClient = req.app.get('redisClient');
  const cacheKey = `rooms:ids:${game_type_filter}:${limit}:${page}:${sort_by}`;

  try {
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const search_condition = {
      status: 'open',
    };

    if (game_type_filter !== 'All') {
      search_condition.game_type = {
        $elemMatch: { $regex: new RegExp(game_type_filter, 'i') }
      };
    }

    // Build sort object based on sort_by parameter
    let sortObject = { updated_at: -1 }; // Default sort

    switch (sort_by) {
      case 'bankroll_high':
        sortObject = { user_bet: -1, updated_at: -1 };
        break;
      case 'bankroll_low':
        sortObject = { user_bet: 1, updated_at: -1 };
        break;
      case 'battles_high':
        sortObject = { battles: -1, updated_at: -1 };
        break;
      case 'battles_low':
        sortObject = { battles: 1, updated_at: -1 };
        break;
      case 'age_newest':
        sortObject = { created_at: -1, updated_at: -1 };
        break;
      case 'age_oldest':
        sortObject = { created_at: 1, updated_at: -1 };
        break;
      default:
        sortObject = { updated_at: -1 }; // Default
    }

    // Get total count for pagination
    const totalCount = await Room.countDocuments(search_condition);
    const totalPages = Math.ceil(totalCount / limit);

    const rooms = await Room.find(search_condition)
      .allowDiskUse(true)
      .select('_id updated_at user_bet battles created_at') // Include fields needed for sorting
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .lean();

    const roomIds = rooms.map(room => room._id);

    const response = {
      success: true,
      roomIds: roomIds,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: limit
      },
      sortBy: sort_by // Include sort info in response
    };

    // Cache for 30 seconds
    await redisClient.setEx(cacheKey, 30, JSON.stringify(response));

    res.json(response);
  } catch (err) {
    console.error('Error fetching room IDs:', err);
    res.json({
      success: false,
      err: err.toString(),
    });
  }
});

// UPDATED SEARCH ROUTE with sorting support
router.get('/rooms/search', async (req, res) => {
  const { query, game_type, limit = 20, page = 1, sort_by = 'default' } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const redisClient = req.app.get('redisClient');
  const cacheKey = `rooms:search:${query}:${game_type}:${limit}:${page}:${sort_by}`;

  try {
    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    let search_condition = {
      status: 'open',
    };

    // Add text search if query provided
    if (query) {
      search_condition.$or = [
        { name: { $regex: new RegExp(query, 'i') } },
        { description: { $regex: new RegExp(query, 'i') } },
        { game_type: { $elemMatch: { $regex: new RegExp(query, 'i') } } }
      ];
    }

    // Add game type filter
    if (game_type && game_type !== 'All') {
      search_condition.game_type = {
        $elemMatch: { $regex: new RegExp(game_type, 'i') }
      };
    }

    // Build sort object for search results
    let sortObject = { updated_at: -1 }; // Default sort

    switch (sort_by) {
      case 'bankroll_high':
        sortObject = { user_bet: -1, updated_at: -1 };
        break;
      case 'bankroll_low':
        sortObject = { user_bet: 1, updated_at: -1 };
        break;
      case 'battles_high':
        sortObject = { battles: -1, updated_at: -1 };
        break;
      case 'battles_low':
        sortObject = { battles: 1, updated_at: -1 };
        break;
      case 'age_newest':
        sortObject = { created_at: -1, updated_at: -1 };
        break;
      case 'age_oldest':
        sortObject = { created_at: 1, updated_at: -1 };
        break;
      default:
        sortObject = { updated_at: -1 }; // Default
    }

    const totalCount = await Room.countDocuments(search_condition);
    const rooms = await Room.find(search_condition)
      .select('_id updated_at user_bet battles created_at')
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const response = {
      success: true,
      roomIds: rooms.map(room => room._id),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount: totalCount,
        hasNext: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
        limit: parseInt(limit)
      },
      searchQuery: query,
      sortBy: sort_by
    };

    // Cache search results for 15 seconds (shorter than regular results)
    await redisClient.setEx(cacheKey, 15, JSON.stringify(response));

    res.json(response);
  } catch (err) {
    console.error('Error searching rooms:', err);
    res.json({
      success: false,
      err: err.toString(),
    });
  }
});

router.get('/game-room/:id', async (req, res) => {
  const roomId = req.params.id;
  const limit = Number.parseInt(req.query.limit, 10) || 10;
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
    // 2️⃣ Fetch the room and game code in parallel
    const roomPromise = Room.findById(roomId)
      .select([
        '_id', 'name', 'image', 'ticker', 'pool_id',
        'x_link', 'tax', 'website_link', 'telegram_link',
        'created_at', 'likes', 'dislikes', 'creator', 'hosts',
        'endgame_amount', 'endgame_type', 'description',
        'joiners', 'game_type', 'bet_amount', 'user_bet',
        'host_pr', 'pr', 'room_number', 'battles',
        'status', 'is_private'
      ].join(' '))
      .populate('creator', 'username avatar totalWagered accessory elite')
      .populate('joiners', '_id avatar username accessory elite totalWagered status')
      .lean();

    const gameCodePromise = GameCode.findOne({ room: roomId })
      .select('code version updated_at')
      .lean();

    // 3️⃣ Fetch logs + count in parallel
    const logsPromise = GameLog.find({ room: roomId })
      .select('bet_amount created_at creator joined_user game_result multiplier winnings ai_mode hosts commission endgame_amount host_pr user_bet')
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('creator', '_id avatar username accessory elite totalWagered')
      .populate('joined_user', '_id avatar username accessory elite totalWagered')
      .lean();

    const countPromise = GameLog.countDocuments({ room: roomId });

    const [room, gameCode, gameLogList, totalGameLogsCount] = await Promise.all([
      roomPromise, gameCodePromise, logsPromise, countPromise
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
      query: req.query,
      roomInfo: {
        _id: room._id,
        name: room.name,
        image: room.image,
        ticker: room.ticker,
        pool_id: room.pool_id,
        gameCode: gameCode?.code || '', // Get from separate collection
        x_link: room.x_link,
        tax: room.tax,
        website_link: room.website_link,
        telegram_link: room.telegram_link,
        created_at: room.created_at,
        likes: room.likes.length,
        dislikes: room.dislikes.length,
        creator_id: room.creator._id,
        username: room.creator.username,
        creator_avatar: room.creator.avatar,
        rank: room.creator.totalWagered,
        accessory: room.creator.accessory,
        elite: room.creator.elite,
        hosts: room.hosts,
        endgame_amount: room.endgame_amount,
        endgame_type: room.endgame_type,
        description: room.description,
        joiners: room.joiners,
        game_type: room.game_type,
        bet_amount: Number(room.bet_amount),
        user_bet: Number(room.user_bet),
        host_pr: room.host_pr,
        pr: room.pr,
        room_name: `${room.game_type[0] || 'Unknown'}-${room.room_number}`,
        total_stakes: totalStakes,
        battles: room.battles,
        status: room.status,
        is_private: room.is_private,
        room_history: roomHistory,
        game_logs: gameLogList,
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
- rpg: Role-playing games, character progression, leveling systems
- horror: Scary games, thriller, suspense, haunted themes
- educational: Learning games, teaching concepts, brain training
- music: Rhythm games, music creation, dancing, audio-based
- platformer: Jumping games, level progression, obstacle navigation
- shooter: Shooting games, FPS, bullet hell, target practice
- racing: Car racing, speed competitions, time trials
- fighting: Combat games, martial arts, one-on-one battles
- sandbox: Creative games, building, open-world exploration
- idle: Incremental games, passive gameplay, auto-progression
- clicker: Click-based games, tapping mechanics, repetitive actions
- tower-defense: Defensive strategy, wave survival, unit placement
- puzzle-platformer: Combination of puzzles and platforming elements
- survival: Resource gathering, crafting, staying alive mechanics
- city-builder: Urban planning, construction, management simulation
- roguelike: Procedural generation, permadeath, dungeon crawling
- moba: Multiplayer online battle arena, team-based strategy
- battle-royale: Last player standing, shrinking play area
- stealth: Sneaking mechanics, avoiding detection, espionage
- cooking: Food preparation, restaurant management, recipe games
- farming: Agricultural simulation, crop growing, livestock
- dating: Romance simulation, relationship building, social interaction
- mystery: Detective work, solving crimes, hidden object games
- word: Letter games, vocabulary, spelling, word formation
- math: Number games, calculation challenges, arithmetic practice
- physics: Real physics simulation, gravity, momentum mechanics
- drawing: Art creation, sketching, painting, creative expression
- crafting: Item creation, recipe combinations, material gathering

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
        'action', 'casual', 'multiplayer', 'retro', 'rpg', 'horror',
        'educational', 'music', 'platformer', 'shooter', 'racing',
        'fighting', 'sandbox', 'idle', 'clicker', 'tower-defense',
        'puzzle-platformer', 'survival', 'city-builder', 'roguelike',
        'moba', 'battle-royale', 'stealth', 'cooking', 'farming',
        'dating', 'mystery', 'word', 'math', 'physics', 'drawing',
        'crafting'
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
      'action', 'casual', 'multiplayer', 'retro', 'rpg', 'horror',
      'educational', 'music', 'platformer', 'shooter', 'racing',
      'fighting', 'sandbox', 'idle', 'clicker', 'tower-defense',
      'puzzle-platformer', 'survival', 'city-builder', 'roguelike',
      'moba', 'battle-royale', 'stealth', 'cooking', 'farming',
      'dating', 'mystery', 'word', 'math', 'physics', 'drawing',
      'crafting'
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
    casual: ['casual', 'simple', 'easy', 'relaxing', 'fun', 'light'],
    rpg: ['rpg', 'role', 'character', 'level', 'experience', 'stats', 'progression'],
    horror: ['horror', 'scary', 'spooky', 'haunted', 'ghost', 'zombie', 'fear', 'thriller'],
    educational: ['educational', 'learning', 'teach', 'school', 'study', 'knowledge', 'brain training'],
    music: ['music', 'rhythm', 'beat', 'dance', 'song', 'melody', 'audio', 'sound'],
    platformer: ['platform', 'jump', 'hop', 'climb', 'ledge', 'obstacle', 'navigate'],
    shooter: ['shoot', 'gun', 'weapon', 'bullet', 'target', 'aim', 'fire', 'fps'],
    racing: ['race', 'car', 'speed', 'lap', 'track', 'vehicle', 'driving', 'fast'],
    fighting: ['fight', 'combat', 'martial', 'punch', 'kick', 'battle', 'versus'],
    sandbox: ['sandbox', 'create', 'build', 'open world', 'freedom', 'explore'],
    idle: ['idle', 'incremental', 'passive', 'automatic', 'progress', 'upgrade'],
    clicker: ['click', 'tap', 'press', 'repetitive', 'mouse', 'finger'],
    'tower-defense': ['tower', 'defense', 'defend', 'wave', 'enemy', 'protect'],
    'puzzle-platformer': ['puzzle platform', 'thinking jump', 'brain hop'],
    survival: ['survival', 'survive', 'craft', 'gather', 'hunger', 'thirst', 'shelter'],
    'city-builder': ['city', 'build', 'urban', 'town', 'construction', 'planning'],
    roguelike: ['rogue', 'dungeon', 'random', 'procedural', 'permadeath'],
    moba: ['moba', 'arena', 'team', 'lane', 'champion', 'league'],
    'battle-royale': ['battle royale', 'last standing', 'shrinking', 'zone'],
    stealth: ['stealth', 'sneak', 'hide', 'spy', 'infiltrate', 'quiet'],
    cooking: ['cook', 'recipe', 'food', 'kitchen', 'restaurant', 'chef'],
    farming: ['farm', 'crop', 'harvest', 'plant', 'agriculture', 'livestock'],
    dating: ['dating', 'romance', 'love', 'relationship', 'flirt', 'boyfriend', 'girlfriend'],
    mystery: ['mystery', 'detective', 'crime', 'solve', 'clue', 'investigate'],
    word: ['word', 'letter', 'vocabulary', 'spelling', 'alphabet', 'text'],
    math: ['math', 'number', 'calculate', 'equation', 'arithmetic', 'algebra'],
    physics: ['physics', 'gravity', 'momentum', 'force', 'collision', 'realistic'],
    drawing: ['draw', 'paint', 'art', 'sketch', 'creative', 'canvas', 'brush'],
    crafting: ['craft', 'recipe', 'combine', 'material', 'ingredient', 'create']
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
const getHistory = async (redisClient = null) => {
  try {
    const cacheKey = `history:all`;
    let result = null,
      fromCache = false;

    // ——————— Try cache ———————
    if (redisClient && typeof redisClient.get === 'function') {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          result = JSON.parse(cached);
          fromCache = true;
        }
      } catch (redisErr) {
        console.error('Redis error during latest history fetch:', redisErr);
      }
    }

    if (!result) {
      // Use findOne instead of find + limit(1) for better performance
      const latestGameLog = await GameLog.findOne({})
        .sort({ created_at: -1 })
        .populate({
          path: 'room',
          model: Room,
          select: [
            '_id', 'winnings', 'ticker', 'image', 'commission',
            'creator', 'status', 'hosts',
            'room_number', 'bet_amount', 'user_bet',
            'host_pr', 'created_at', 'name'
          ].join(' ')
        })
        .populate('creator', '_id avatar accessory totalWagered username')
        .populate('joined_user', '_id avatar accessory totalWagered username')
        .lean();

      if (latestGameLog) {
        // Convert single item to history style
        const historyData = await convertGameLogToHistoryStyle([latestGameLog]);
        result = { latestItem: historyData[0] || null };
      } else {
        result = { latestItem: null };
      }

      // ——————— Cache it ———————
      if (redisClient && typeof redisClient.setEx === 'function') {
        const ttl = 60;  // global: 1m (shorter TTL for single item)
        try {
          await redisClient.setEx(cacheKey, ttl, JSON.stringify(result));
        } catch (redisErr) {
          console.error('Failed to cache latest history:', redisErr);
        }
      }
    }

    return { ...result, cached: fromCache };
  } catch (err) {
    console.error('Error in getHistory:', err);
    return false;
  }
};

// Optimized route for getting just the latest history item
router.get('/history', async (req, res) => {
  try {
    const redisClient = req.app.get('redisClient');

    const latestHistory = await getHistory(redisClient);

    if (latestHistory === false) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch latest history'
      });
    }

    res.json({
      success: true,
      latestItem: latestHistory.latestItem,
      cached: latestHistory.cached || false
    });
  } catch (err) {
    console.error('Error in /history route:', err);
    res.status(500).json({
      success: false,
      err: err.toString(),
    });
  }
});

// Updated POST /rooms route
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
      game_type_tag,
      is_private,
      endgame_amount,
      endgame_type,
      description,
      room_password,
      connectedAccount,
      prompt,
      gameCode, // Still accept gameCode in request
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

    const gameCodeDoc = gameCode ? new GameCode({
      room: newRoom._id,
      code: gameCode,
      created_by: _id,
      version: 1
    }) : null;

    const savePromises = [
      saveDocumentWithRetry(newGameLog),
      User.findByIdAndUpdate(_id, updatedUser),
      saveDocumentWithRetry(newRoom),
      System.findOneAndUpdate(
        { name: 'platform_trading' },
        { $inc: { value: fee } }
      )
    ];

    if (gameCodeDoc) {
      savePromises.push(saveDocumentWithRetry(gameCodeDoc));
    }

    await Promise.all(savePromises);


    const gameLogList = await GameLog.find({ room: newRoom._id })
      .sort({ created_at: 'desc' })
      .limit(1)
      .populate({
        path: 'room',
        model: Room,
        select: '_id winnings ticker image creator status hosts room_number bet_amount user_bet host_pr created_at name',
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
      gameCode: gameCode || '',
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

    const { rooms, count } = await getMyRoomsWithGameCodes(
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

const getMyRoomsWithGameCodes = async (
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
    .select('_id creator name image ticker hosts creator host_pr room_number endgame_type endgame_amount is_private status created_at user_bet bet_amount likes dislikes game_type')
    .limit(pageSize)
    .lean();

  const count = await Room.countDocuments(search_condition);

  // Get game codes for all rooms
  const roomIds = rooms.map(room => room._id);
  const gameCodes = await GameCode.find({ room: { $in: roomIds } })
    .select('room code version')
    .lean();

  const gameCodeMap = gameCodes.reduce((map, gc) => {
    map[gc.room.toString()] = gc;
    return map;
  }, {});

  const creatorIds = [...new Set(rooms.map(room => room.creator))];
  const creators = await User.find({ _id: { $in: creatorIds } })
    .select('avatar totalWagered accessory elite')
    .lean();

  const creatorMap = creators.reduce((map, creator) => {
    map[creator._id.toString()] = creator;
    return map;
  }, {});

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
    const gameCodeInfo = gameCodeMap[room._id.toString()];

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
      gameCode: gameCodeInfo?.code || '', // Add game code from separate collection
      hosts: room.hosts,
    };

    temp.winnings = room.user_bet;

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

router.get('/room/:id/gamecode', async (req, res) => {
  try {
    const roomId = req.params.id;
    const gameCode = await GameCode.findOne({ room: roomId })
      .select('code version created_at updated_at')
      .lean();

    if (!gameCode) {
      return res.json({
        success: true,
        gameCode: null,
        message: 'No game code found for this room'
      });
    }

    res.json({
      success: true,
      gameCode: {
        code: gameCode.code,
        version: gameCode.version,
        created_at: gameCode.created_at,
        updated_at: gameCode.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching game code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game code'
    });
  }
});

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
        const depositTransaction = await GameTransaction.findOne({
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

        const newGameTransaction = new GameTransaction({
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
      bet_amount: roomInfo.host_pr,
      hosts: roomInfo.hosts,
      game_result: -100,
    });

    const newTransactionC = new GameTransaction({
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
      bet_amount: netDeposit,
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
        console.log("newLog", newLog)
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
        'status hosts user_bet name host_pr pr bet_amount room_number updated_at total_share_supply',
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
      const depositTransaction = await GameTransaction.findOne({
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

      const newGameTransaction = new GameTransaction({
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

    const newGameLog = new GameLog({
      room: roomInfo._id,
      creator: req.user._id,
      joined_user: null,
      bet_amount: amountAfterFee,
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
    case '1s':
      return 1;
    case '1m':
      return 60;
    case '15m':
      return 15 * 60;
    case '4h':
      return 4 * 60 * 60;
    case '24h':
      return 24 * 60 * 60;
    default:
      return 1; // Default to 1 second
  }
};

router.post('/getGlobalChatLogs', async (req, res) => {
  try {
    const redisClient = req.app.get('redisClient');
    const cacheKey = 'global:chat:logs';
    const CACHE_TTL = 60; // 1 minute cache

    // Try Redis first
    const cachedLogs = await redisClient.get(cacheKey);
    if (cachedLogs) {
      return res.json({
        success: true,
        chatLogs: JSON.parse(cachedLogs),
        cached: true
      });
    }

    // FIXED: Simpler query that matches your Chat schema structure
    const results = await Chat.find({})
      .populate({
        path: 'sender',
        select: 'username avatar accessory elite totalWagered'
      })
      .sort({ created_at: -1 })
      .limit(9)
      .lean(); // Use lean() for better performance


    // Process the results to match the real-time socket structure
    const chatLogs = results.map((chat, index) => {

      const createdTime = new Date(chat.created_at);
      const timeString = createdTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const baseChat = {
        id: chat._id.toString(), // Add unique ID for React keys
        sender: chat.username || chat.sender?.username || 'Unknown', // Use username field first
        senderId: chat.sender?._id?.toString() || chat.sender?.toString() || '',
        message: chat.message || '',
        messageType: chat.messageType || 'text',
        messageContent: chat.messageContent || '',
        avatar: chat.sender?.avatar || '',
        accessory: chat.sender?.accessory || '',
        elite: chat.sender?.elite || false,
        rank: chat.sender?.totalWagered || 0,
        time: timeString,
        created_at: chat.created_at,
        replyTo: null
      };

      // FIXED: Process replyTo to match socket structure
      if (chat.replyTo && typeof chat.replyTo === 'object') {

        // The replyTo is stored as an object with the structure from socket
        baseChat.replyTo = {
          sender: chat.replyTo.sender || chat.replyTo.username, // Username for display
          senderId: chat.replyTo.sender || chat.replyTo.senderId, // ID for references
          username: chat.replyTo.username || chat.replyTo.sender,
          avatar: chat.replyTo.avatar || '',
          rank: chat.replyTo.rank || 0,
          accessory: chat.replyTo.accessory || '',
          elite: chat.replyTo.elite || false,
          message: chat.replyTo.message || '',
          messageType: chat.replyTo.messageType || 'text',
          time: chat.replyTo.time || timeString,
          created_at: chat.replyTo.created_at || chat.created_at
        };

      }

      return baseChat;
    }).reverse(); // Reverse to get chronological order

    // Cache result (fire and forget)
    redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(chatLogs))
      .catch(err => console.error('Cache error:', err));

    return res.json({
      success: true,
      chatLogs,
      cached: false
    });

  } catch (error) {
    console.error('❌ Error fetching global chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching global chat'
    });
  }
});


router.get('/candles/:room', async (req, res) => {
  try {
    const room = req.params.room;
    const { timeRange = '1s' } = req.query;
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

    let transactions = await GameTransaction.find({ room: room }).sort({
      updated_at: 1,
    });
    // Start liquidity at the creator's initial bet_amount, not 0
    let previousLiquidity = parseFloat(roomData.bet_amount) || 0;
    console.log(`📊 Candles for room ${room}: Starting liquidity = ${previousLiquidity} (bet_amount: ${roomData.bet_amount})`);
    const finalCandles = [];
    const candleMap = new Map(); // Map to group transactions by second

    transactions.forEach((transaction) => {
      const transactionTime = moment(transaction.created_at)
        .startOf('second')
        .toISOString();
      const transactionAmount = -transaction.amount;

      // If no candle exists for this second, create one
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

    const sortedCandles = Array.from(candleMap.values()).sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime),
    );

    // CRITICAL FIX: Ensure the last candle's close matches the current room liquidity
    if (sortedCandles.length > 0) {
      const lastCandle = sortedCandles[sortedCandles.length - 1];
      const currentLiquidity = user_bet;
      
      // If there's a mismatch, adjust the last candle to match current liquidity
      if (Math.abs(lastCandle.close - currentLiquidity) > 0.001) {
        console.log(`🔧 Candle sync fix: Last candle close ${lastCandle.close} -> Current liquidity ${currentLiquidity}`);
        lastCandle.close = currentLiquidity;
        lastCandle.high = Math.max(lastCandle.high, currentLiquidity);
        lastCandle.low = Math.min(lastCandle.low, currentLiquidity);
      }
    }

    finalCandles.push(...sortedCandles);

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
    const usedTransactions = await GameTransaction.find({ hash: txtHash });
    if (usedTransactions.length > 0) {
      console.error('Duplicate transaction:', txtHash);
      return res.json({ success: false, message: 'Transaction already used' });
    }

    // Update database and send notifications
    const now = moment().format('LLL');
    userToTip.balance = userToTip.balance || 0;
    userToTip.balance += tipAmount;
    req.user.balance -= tipAmount;

    const newTransactionC = new GameTransaction({
      created_at: now,
      user: req.user._id,
      amount: -tipAmount,
      description: `Tipped ${userToTip.username}`,
      hash: txtHash,
    });

    const newTransactionJ = new GameTransaction({
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
      const redisClient = req.app.get('redisClient');
      const roomId = req.body._id;

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
      if (betResult.success) {
        // *** START: CACHE INVALIDATION LOGIC ***
        try {
          if (roomId) {
            const keys = await redisClient.keys(`room:${roomId}:limit:*`);

            if (keys.length > 0) {
              await redisClient.del(keys);
              console.log(`✅ Invalidated ${keys.length} cache keys for room: ${roomId}`);
            }
          }
        } catch (err) {
          console.error('Redis cache invalidation failed:', err);
        }
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

router.get('/user/check-deposit-status/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    if (!roomId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and user ID are required'
      });
    }

    // Check for a valid deposit transaction within the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const depositTransaction = await GameTransaction.findOne({
      user: userId,
      room: roomId,
      status: { $in: ['pending', 'completed'] },
      description: { $regex: '^(Joined)', $options: 'i' },
      created_at: { $gte: fifteenMinutesAgo },
      amount: { $lt: 0 } // Negative amount indicates a deposit
    }).sort({ created_at: -1 }); // Get the most recent deposit

    if (!depositTransaction) {
      return res.json({
        success: true,
        hasValidDeposit: false,
        message: 'No valid deposit found for this room'
      });
    }

    return res.json({
      success: true,
      hasValidDeposit: true,
      depositAmount: Math.abs(depositTransaction.amount),
      depositTimestamp: depositTransaction.created_at.getTime(),
      transactionHash: depositTransaction.hash,
      status: depositTransaction.status
    });

  } catch (error) {
    console.error('Error checking deposit status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking deposit status'
    });
  }
});

router.post('/checkTokens', auth, async (req, res) => {
  const connectedWallets = req.user.accounts;
  const available = await getUserTokens(connectedWallets);
  return res.json({
    status: available,
  });
});

module.exports = router;
