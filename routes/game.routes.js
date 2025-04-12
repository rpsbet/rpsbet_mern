const ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const socket = require('../socketController.js');
const router = express.Router();
const moment = require('moment');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const Comment = require('../model/Comment');
const { OpenAI } = require('openai');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Instead of Configuration/OpenAIApi, we create an instance of OpenAI directly:
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const Item = require('../model/Item');
const User = require('../model/User');
const Room = require('../model/Room');
const GameType = require('../model/GameType');
const Strategy = require('../model/Strategy');
const GameLog = require('../model/GameLog');
const AttachedPlayer = require('../model/AttachedPlayer');
const Receipt = require('../model/Receipt');
const Message = require('../model/Message');
const Notification = require('../model/Notification');
const QBot = require('../model/QBot');
const Transaction = require('../model/Transaction');
const System = require('../model/SystemSetting');
const RpsBetItem = require('../model/RpsBetItem');
const QsBetItem = require('../model/QsBetItem');
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
const { addLiquidity } = require('../helper/util/addLiquidity');
// const { getWalletTokenAccount } = require('./util');
const { getAccount, getAssociatedTokenAddress } = require('@solana/spl-token');
const { Market } = require('@project-serum/serum');
const { revokeMintAndFreezeAuthorities } = require('../helper/util/authority');
const { distributeTokens } = require('../helper/util/distributeTokens');

// Environment variables
const PINATA_JWT = process.env.PINATA_JWT;

let user_access_log = {};
router.get('/game_types', async (req, res) => {
  try {
    const excludedGameTypes = [
      'Roll',
      'Bang!',
      'Spleesh!',
      'Blackjack',
      'Drop Game',
      'Mystery Box',
      'Brain Game',
    ];
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

router.get('/strategies', async (req, res) => {
  try {
    const excludedStrategies = ['Markov', 'Adam'];
    const strategies = await Strategy.find({
      name: { $nin: excludedStrategies },
    }).sort({ created_at: 1 });
    res.json({
      success: true,
      query: req.query,
      strategies: strategies,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message,
    });
  }
});

router.get('/recently-closed', async (req, res) => {
  try {
    const rooms = await Room.find({
      status: 'finished',
      battles: { $gt: 0 },
      pool_id: { $nin: [null, ''] },
    })
      .select(
        'name battles bet_amount host_pr user_bet pood_id room_number image game_type created_at',
      ) // Select specific fields
      .populate({
        path: 'game_type',
        model: GameType,
        select: 'short_name game_type_name',
      })
      .sort({ created_at: -1 })
      .limit(20);

    if (rooms.length > 0) {
      res.json({
        success: true,
        rooms: rooms,
      });
    } else {
      res.json({
        success: true,
        message: 'No recently closed rooms found.',
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
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

router.patch('/range/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { newValue } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      user_id,
      { range: newValue },
      { new: true },
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'user not found' });
    }
    res.json({
      success: true,
      message: 'Successful!',
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message,
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

router.post('/openai/generate-react', auth, async (req, res) => {
  try {
    const { prompt, imageUrls = [] } = req.body || {};
    const cost = 0.005;

    if (!req.user?._id) {
      throw new Error('User not authenticated');
    }

    // Fetch the latest user data from the database
    const currentUser = await User.findOne({ _id: req.user._id });
    if (!currentUser) {
      throw new Error('User not found');
    }

    console.log(`[React Generator] Starting generation with prompt: "${prompt.substring(0, 50)}..."`);
    console.log(`[React Generator] User balance: ${currentUser.balance}, Cost: ${cost}`);

    if (cost > currentUser.balance) {
      throw new Error('NOT ENUFF FUNDS AT THIS MEOWMENT');
    }

    const newTransaction = new Transaction({
      user: currentUser,
      amount: -cost,
      description: 'Generated AI React app',
    });

    currentUser.balance -= cost;
    currentUser.updated_at = new Date();

    await Promise.all([
      saveDocumentWithRetry(currentUser),
      saveDocumentWithRetry(newTransaction),
    ]);

    socket.newTransaction(newTransaction);

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

    const systemPrompt = `
You are an elite React developer with a passion for cutting-edge design, inspired by the Web3 ecosystem (e.g., dApps, NFT marketplaces, DeFi platforms). Generate a complete, working React game component based on the user's prompt:
- Interpret the prompt to create an interactive game with clear gameplay mechanics (e.g., clicker, puzzle, betting game, physics-based game). Every generation must be a game.
- Use functional components and hooks (useState, useEffect, useRef, useCallback) for state management and interactivity.
- Accept two props: 'proxiedAssets' ({ images: [{ key, proxiedUrl }], audio: [{ key, proxiedUrl }] }) and 'logEvent' (a callback function to send events to the parent).
- Safely handle proxiedAssets with checks (e.g., proxiedAssets?.images?.[0]?.proxiedUrl).
- Include the following import statements at the top:
  import React, { useState, useEffect, useRef, useCallback } from 'react';
  import { Box, Typography, TextField, Button, CircularProgress, Slider, Switch } from '@mui/material';
  import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
  import { faDice, faCoins, faRocket, faGem, faTrophy, faRedo, faBomb, faStar } from '@fortawesome/free-solid-svg-icons';
- For physics-based games (e.g., involving gravity, collisions, or motion), include:
  import Matter from 'matter-js';
  - Use Matter.js to handle physics (e.g., Engine, World, Bodies, Events).
  - Set up a canvas via useRef and render physics objects within the Box container.
- Use Material-UI (MUI) v5 components and the 'sx' prop for inline styling with these Web3-inspired guidelines:
  - **Container Layout**: 
    - Use Box with 'width: "100%", height: "100%"' to take up the full width and height of the parent container.
    - Set 'maxWidth: "100%", maxHeight: "100%"' and 'overflow: "auto"' to ensure content fits.
    - Center content with 'mx: "auto"' and 'display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center"'.
    - Set background color to '#080808' for a dark backdrop.
  - **Alignment & Spacing**: 
    - Use 'gap: 2' for consistent spacing.
    - Apply 'p: 2' for padding.
    - For buttons, use 'display: "flex", gap: 1' within a nested Box.
    - Ensure elements fit within the container, adjusting dynamically.
  - **Color Palette**: 
    - Choose a random Web3-inspired theme unless specified.
    - Ensure text/icons contrast (e.g., 'color: "white"').
    - Use gradients (e.g., 'background: "linear-gradient(45deg, <randomColor1>, <randomColor2>)"') for buttons.
    - Add glow with 'boxShadow: "0 0 10px rgba(<randomColor>, 0.5)"'.
  - **Visual Polish**: 
    - Apply 'borderRadius: 6' to buttons.
    - Use 'transition: "all 0.3s ease-out"' and '&:hover: { transform: "translateY(-4px)", boxShadow: "0 0 15px rgba(<randomColor>, 0.7)" }'.
    - Add glassmorphism effects using 'backdropFilter: "blur(10px)"', 'background: "rgba(255, 255, 255, 0.1)"', 'border: "1px solid rgba(255, 255, 255, 0.2)"' to create translucent, frosted glass effects on UI elements.
  - **Web3 Aesthetics**: 
    - Use gradient buttons and glowing hover states.
    - Add subtle animations (e.g., 'animation: "pulse 2s infinite"') minimally.
  - **User Experience**: 
    - Buttons: 'p: 1', 'color: "white"', 'fontSize: "1.125rem"', 'fontWeight: 500', 'minWidth: 120px' with glowing effects.
    - TextFields: Custom 'InputProps' (e.g., 'bgcolor: "rgba(<randomColor>, 0.5)"', 'color: "white"', 'borderRadius: 6').
    - Ensure contrast with 'color: "white"' on dark backgrounds.
    - Apply glassmorphism to cards, panels, and UI containers with 'backdropFilter: "blur(8px)"', 'background: "rgba(255, 255, 255, 0.1)"'.
  - **Responsiveness**: 
    - Use responsive props (e.g., 'sx={{ width: { xs: "100%", sm: "90%" }, fontSize: { xs: "1rem", md: "1.25rem" } }}').
    - Scale items to fit across screen sizes.
- **FontAwesome Icons**:
  - Use only: faDice, faCoins, faRocket, faGem, faTrophy, faRedo.
  - Match icons to the theme (e.g., faDice for dice games, faRedo for Restart).
  - Include in buttons with 'mr: 1'.
  - Optionally use in the logo if thematic.
  - IMPORTANT: Instead of SVG graphics for interactive elements, use appropriate emoji combinations. For example:
    - Rocket: 🚀
    - Moon: 🌕 or 🌙
    - Star: ⭐ or 🌟
    - Ship: 🚢
    - Bomb: 💣
    - Dice: 🎲
    - Coins: 💰 or 🪙
    - Trophy: 🏆
    - Gems: 💎
    - Pick relevant emoji combinations based on the game theme.
- **Particle Background System**: 
  - IMPORTANT: Include particle effects in EVERY game as a visual enhancement. Use the following implementation:
    - Create a Canvas element with useRef: const canvasRef = useRef(null);
    - Create a particles array with state: const [particles, setParticles] = useState([]);
    - In useEffect, initialize the canvas and add a render loop with requestAnimationFrame
    - Create a drawParticles function that clears the canvas and draws each particle
    - Include a createParticle function that adds new particles based on game events
    - Add particles on different game events (clicks, wins, losses)
    - Make particles drift naturally with opacity decay
    - Render the canvas in your component: <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
    - Call createParticle() on game events like button clicks, wins, and losses
  - Customize particles based on the theme:
    - Explosions: Red/orange particles (e.g., 'rgba(255, 100, 50, 0.8)') with outward acceleration
    - Mines: Red/black particles with random directions on trigger
    - Coins: Yellow/gold particles ('rgba(255, 215, 0, 0.8)') that fall downward
    - Space: Blue/purple/white particles with slow drift
  - Add particle effects for game events:
    - On win: Green particles exploding upward
    - On loss: Red particles exploding outward
    - On click/action: Small burst of particles at cursor position
  - Control particle count (20-200), size (1-5px), color palette (game-specific), and behavior (drift, explode, rain, float)
  - Add glow effects with 'filter: "blur(1px)"' for more vibrant particles
  - Position the canvas with 'position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1' to overlay the game
  - **Dynamic Graphics**:
  - Instead of SVG elements, use emojis styled with CSS for theme-specific visual elements:
    - Mines: Use the bomb emoji 💣 with shadow and glow effects
    - Crash: Rocket emoji 🚀 with size increase as multiplier grows
    - Slots: Slotmachine emoji 🎰 or combinations like 7️⃣🍒💰
    - Dice: Use dice emoji 🎲 with rotation animations
  - Style emoji elements with:
    - 'fontSize: "2rem"' (or responsive sizing)
    - 'filter: "drop-shadow(0 0 10px rgba(<randomColor>, 0.5))"'
    - 'transition: "transform 0.3s"'
    - Hover effects: '&:hover: { transform: "scale(1.2)" }'
  - Create animated containers for emojis with glassmorphism:
    - 'backdropFilter: "blur(8px)"'
    - 'background: "rgba(255, 255, 255, 0.1)"'
    - 'borderRadius: "50%"' (for circular containers)
    - 'border: "1px solid rgba(255, 255, 255, 0.2)"'
    - 'boxShadow: "0 0 15px rgba(<randomColor>, 0.5)"'
  - Add subtle animations to emojis:
    - Pulse: '@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }'
    - Rotate: '@keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'
    - Bounce: '@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }'
- **Dynamic Chart/Graph System**: 
  - If the prompt implies a "crash" game, include a line chart to visualize a fixed, hardcoded multiplier progression for display purposes only:
    - Use a canvas via useRef (e.g., "<canvas ref={chartRef} width={500} height={200} />").
    - Plot x-axis as a fixed number of points (e.g., 100 points representing a consistent time scale), y-axis as a hardcoded exponential curve from 1.0 to a visual maximum of 10x, scaled to canvas height.
    - Use a static, predetermined formula for the chart: "displayMultiplier = 1 * Math.exp(0.05 * (x / 100) * 100)", where "x" is the point index (0 to 100), hardcoding a smooth rise from 1.0 to ~10x over 100 points. This curve remains constant across all games.
    - Style with a neon gradient (e.g., "linearGradient" from "#ff6ec4" to "#00ffcc"), "shadowBlur: 10".
    - Animate the chart with "requestAnimationFrame" to draw the full hardcoded curve (1.0 to 10x) progressively, using a fixed animation duration (e.g., 10 seconds total). Calculate the current point to draw based on elapsed animation time (e.g., "currentPoint = Math.min((elapsedTime / 10000) * 100, 100)"), where "elapsedTime" is in milliseconds, starting from game start and stopping at game end (crash or cash out).
    - The chart's progression speed and shape must remain identical in every game, unaffected by the actual game "multiplier", "timeElapsedRef.current", or crash point. It is purely a visual overlay with a hardcoded 10-second rise to 10x.
    - When the game ends (crash or cash out), freeze the chart at the current animation point along the hardcoded curve, showing the fixed progression up to that moment.
    - Ensure the chart is a cosmetic element only and does not reflect or interact with the actual crash point, real-time multiplier, or gameplay logic.

- **Game Events and Results**:
  - Track game state:
    - Use 'useState' for 'gameStarted' (boolean, initially false), 'gameEnded' (boolean, initially false), 'multiplier' (number, initially 1.0), 'result' (string, initially null, values: "win", "loss", "other"), 'totalOptions' (number, total possible actions/spaces), 'safeOptions' (number, remaining safe actions/spaces), 'totalMines' (number, hazards set by user), and 'actionsTaken' (number, successful actions).
    - On game start (e.g., "Start Game" button), call 'logEvent("gameStarted", { timestamp: new Date().toISOString() })', set 'gameStarted' to true, and initialize 'safeOptions' to 'totalOptions - totalMines'.
    - On game end (e.g., "End Game" button or logic), determine 'result', set 'gameEnded' to true, and call 'logEvent("gameEnded", { timestamp: new Date().toISOString(), result, multiplier })'.
  - **Game History**:
    - IMPORTANT: Include a game history table showing results of previous games:
      - Create state for gameHistory: const [gameHistory, setGameHistory] = useState([]);
      - When a game ends, add the result to history: setGameHistory(prev => [...prev, { id: Date.now(), result, multiplier, timestamp: new Date().toISOString() }]);
      - Display the history in a scrollable table at the bottom of the game:
      - Limit history to most recent 10-20 games to avoid performance issues
      - Positive values should have color: #48ff00 and negative values should have color: #ff0000
  - **Dynamic Multiplier Calculation**:
    - Calculate 'multiplier' dynamically based on odds and user settings:
      - Initial multiplier = 1.0.
      - For non-crash games (e.g., mines, clickers):
        - After each successful action (e.g., click), update: multiplier = (1.0 + 0.5 * (totalMines / (totalOptions - totalMines)) * Math.pow(1.3, actionsTaken)).toFixed(2).
        - 'totalMines' reflects user-set hazards, 'totalOptions - totalMines' is initial safe options, 'actionsTaken' increases with each success.
        - Update continuously (e.g., useEffect with dependencies on 'actionsTaken', 'safeOptions').
        - Allow multiple multipliers if the game has multiple outcomes, based on the prompt.
        - Examples:
          - 25 options, 10 mines (15 safe): 1st click → 1.22, 2nd → 1.56, 3rd → 2.03.
          - 25 options, 1 mine (24 safe): 1st click → 1.03, 2nd → 1.06, 3rd → 1.09.
      - For crash games or games with exponential progression (e.g., prompt includes "crash," "rocket," "flies higher"):
  - CRASH FORMULA: 
    Generate the crash point at game start using multiplier = 1 / (1 - Math.pow(Math.random(), 1.5) * 0.95).
    - Store this value (e.g., in a ref) for comparison during the game.
    - This formula creates a distribution where lower crash points are more probable, incorporating a 1% house edge for fairness.
  - In-Game Progression: 
    Use an exponential growth model for the displayed multiplier:
    - Formula: multiplier = 1 * Math.exp(k * timeElapsed), where k is a growth rate constant (e.g., k = 0.03 yields ~2.72× in 90 seconds).
    - Update the multiplier in real-time using requestAnimationFrame, starting from 1.0 and increasing until it reaches or exceeds the crash point.
  - Game ends when multiplier >= crash point (result: "loss") or user cashes out (result: "win").
  - Example: Crash point = 1.11×, k = 0.03, reaches 1.11× in ~11s; Crash point = 2×, reaches in ~35s.
- Don't display the final crash point to the user until the round is over.
    - Add "Start Game" and "Cash Out" buttons, triggering log events.
    - Include a "Restart" button with <FontAwesomeIcon icon={faRedo} /> to reset state (gameStarted: false, gameEnded: false, multiplier: 1.0, result: null, safeOptions: totalOptions - totalMines, actionsTaken: 0) and log "gameStarted".
- **Visible Multiplier(s)**:
  - Display 'multiplier' (or multiple multipliers) prominently during gameplay (when 'gameStarted' is true and 'gameEnded' is false) using Typography:
    - Place inside a Box with 'p: 2', 'borderRadius: 8'
    - Use 'color: "white"', 'fontWeight: "bold"', 'fontSize: "1.5rem"' for readability
    - Add 'boxShadow: "0 0 15px rgba(<randomColor>, 0.7)"' for a glowing effect
    - Include an emoji based on game type (e.g., "🚀" for rocket games, "💎" for gem games, "💰" for betting games)
    - Position centrally or near gameplay elements, ensuring it fits
    - Format as "Multiplier: 1.56×" or with relevant emoji "🚀 1.56×"
  - After game ends:
    - If 'result' is "win" or "other", show final multiplier(s) and result (e.g., "You won! Multiplier: 2.03").
    - If 'result' is "loss", display only the result (e.g., "You lost!") without the multiplier.
- **Optional Game Settings**:
  - Include settings only if relevant to the prompt (e.g., configurable risk factors):
    - Implement as a Box panel with 'p: 2', 'bgcolor: "rgba(<randomColor>, 0.2)"', 'borderRadius: 8'.
    - Use 1–3 options (e.g., TextField for numbers, Slider for ranges, Switch for toggles).
    - Examples:
      - Choice game: "Number of Hazards" (TextField, min: 1, max: totalOptions - 1).
      - Physics game: "Speed Limit" (Slider, min: 5, max: 30).
      - Time game: "Time Limit" (Switch, on/off).
    - Cap settings to prevent breaking the game (e.g., hazards < totalOptions - 1).
    - Settings set 'totalMines', influencing risk and multiplier growth indirectly.
    - Store in state and update gameplay dynamically.
    - Add a "Apply" button with Web3 styling (e.g., gradient, glow).
    - Toggle visibility with a "Settings" button styled similarly.
  - Ensure settings are optional, omitted for simple games, and responsive.
- **Physics-Based Games**:
  - For prompts implying physics (e.g., "rocket launch"):
    - Initialize Matter.js in useEffect (e.g., Matter.Engine.create()).
    - Use a canvas with useRef (e.g., <canvas ref={canvasRef} style={{ width: '100%', height: '70%' }} />).
    - Update multiplier based on:
      - Velocity (e.g., multiplier = 1.0 + 0.5 * (velocity / maxVelocity) * Math.pow(1.3, actionsTaken)).
      - Proximity to obstacles (e.g., multiplier = 1.0 + 0.5 * (1 - distance / maxDistance) * Math.pow(1.3, actionsTaken)).
    - Use Matter.Events for updates.
    - Clean up on unmount (e.g., Matter.Engine.clear(engine)).
  - Ensure canvas scales within the Box.
  - IMPORTANT: Do NOT include any title or header text in the app. The logo/icon should be the only visual identifier.
- **logEvent for Score-Based Games**:
  - IMPORTANT: For any score-based games where you would normally send a log event with score info (e.g., score, playerScore, points), convert these to multiplier values using the following approach:
    - Create a score-to-multiplier conversion function:
      \`\`\`javascript
      const calculateMultiplierFromScore = (score) => {
        // Base conversion with logarithmic scaling
        let multiplier = 1 + Math.log10(1 + score/100);
        
        // Cap extremely high scores at 5x
        return Math.min(multiplier, 5).toFixed(2);
      }
      \`\`\`
    - This function ensures most scores result in multipliers between 1-2x
    - Replace any score-related log events:
      \`\`\`javascript
      // Instead of: logEvent("gameEnded", { score: playerScore })
      // Use: logEvent("gameEnded", { multiplier: calculateMultiplierFromScore(playerScore) })
      \`\`\`
  - For non-score games that would send other values (e.g., time, distance):
    - Convert these to multiplier: 2x by default:
      \`\`\`javascript
      // Instead of: logEvent("gameEnded", { distance: playerDistance })
      // Use: logEvent("gameEnded", { multiplier: 2.00 })
      \`\`\`
- Return a single App component as a string with 'export default App;'.
- Infuse Web3 flair, futuristic polish, and interactivity with perfect alignment. Ensure error-free code, full container usage, and no overflow unless specified. Use MUI v5 and incorporate glassmorphism in UI elements.
`;
    const apiCall = openai.chat.completions.create({
      model: 'o3-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Create a React component for: "${prompt}". Use 'proxiedAssets' prop: ${JSON.stringify(proxiedAssets)}.`,
        },
      ],
      max_completion_tokens: 100000,
    });

    const aiResponse = await Promise.race([
      apiCall,
      new Promise((_, reject) => setTimeout(() => reject(new Error('API call timed out')), 300000)),
    ]);

    const rawCode = aiResponse?.choices?.[0]?.message?.content?.trim() || '';
    const cleanedCode = rawCode.replace(/```(?:jsx?|javascript)?/g, '').trim();

    // Basic validation
    if (!cleanedCode.includes('return (') || !cleanedCode.includes('App')) {
      throw new Error('Generated code is invalid or incomplete');
    }

    // Wrap the cleaned code with imports and export
    const moduleCode = `
      ${cleanedCode}
    `;

    console.log(`[React Generator] Generated code length: ${moduleCode.length}`);
    console.log(moduleCode);
    res.json({ finalApp: moduleCode });
  } catch (error) {
    console.error('Error in route handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message.includes('timed out')
        ? 'App generation timed out. Please try again.'
        : error.message,
    });
  }
});

router.post('/openai/update-react', auth, async (req, res) => {
  try {
    const { prompt, currentCode, imageUrls = [] } = req.body || {};
    const cost = 0.005;

    if (!req.user?._id) {
      throw new Error('User not authenticated');
    }

    // Fetch the latest user data from the database
    const currentUser = await User.findOne({ _id: req.user._id });
    if (!currentUser) {
      throw new Error('User not found');
    }

    console.log(`[React Update] Starting update with prompt: "${prompt.substring(0, 50)}..."`);
    console.log(`[React Update] User balance: ${currentUser.balance}, Cost: ${cost}`);

    if (cost > currentUser.balance) {
      throw new Error('NOT ENUFF FUNDS AT THIS MEOWMENT');
    }

    const newTransaction = new Transaction({
      user: currentUser,
      amount: -cost,
      description: 'Updated AI React app',
    });

    currentUser.balance -= cost;
    currentUser.updated_at = new Date();

    await Promise.all([
      saveDocumentWithRetry(currentUser),
      saveDocumentWithRetry(newTransaction),
    ]);
    socket.newTransaction(newTransaction);


    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    if (!currentCode || typeof currentCode !== 'string') {
      throw new Error('Current code is required and must be a string');
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

    console.log(`[React Update] Proxied assets prepared:`, JSON.stringify(proxiedAssets));

    // Extract the main component code and any important elements from the current code
    // Strip out imports and export statements
    const cleanedCurrentCode = currentCode
      .replace(/import [^;]+;/g, '')
      .replace(/export default App;/g, '')
      .trim();

    const systemPrompt = `
You are an expert React developer skilled at modifying existing React components. You will be given a current React game component and a user request for modifications. Your task is to update the component based on the user's request.

IMPORTANT:
1. Maintain the core structure and functionality of the original component
2. Add or modify features as requested by the user
3. Ensure all existing hooks (useState, useEffect, useRef) are properly preserved
4. Keep all existing event handlers and callbacks
5. Preserve any physics systems, particle effects, or other complex systems
6. Make sure the component accepts the same props: 'proxiedAssets' and 'logEvent'
7. Return the complete updated component, not just the changed parts
8. Do not include import statements or export statements in your response

Please analyze the existing code carefully before making changes to ensure you understand the game's mechanics and structure.
`;

    const apiCall = openai.chat.completions.create({
      model: 'o3-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Here is the current React game component:\n\n${cleanedCurrentCode}\n\nUser's modification request: "${prompt}". Please update the component accordingly. Use 'proxiedAssets' prop: ${JSON.stringify(proxiedAssets)}.`,
        },
      ],
      max_completion_tokens: 100000,
    });

    const aiResponse = await Promise.race([
      apiCall,
      new Promise((_, reject) => setTimeout(() => reject(new Error('API call timed out')), 300000)),
    ]);

    const rawCode = aiResponse?.choices?.[0]?.message?.content?.trim() || '';
    const cleanedCode = rawCode.replace(/```(?:jsx?|javascript)?/g, '').trim();

    // Basic validation
    if (!cleanedCode.includes('return (') || !cleanedCode.includes('App')) {
      throw new Error('Generated code is invalid or incomplete');
    }

    // Wrap the cleaned code with imports and export
    const moduleCode = `
      ${cleanedCode}
    `;

    console.log(`[React Update] Updated code length: ${moduleCode.length}`);
    res.json({ finalApp: moduleCode });
  } catch (error) {
    console.error('Error in update route handler:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message.includes('timed out')
        ? 'App update timed out. Please try again.'
        : error.message,
    });
  }
});

router.patch('/strategies/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { strategy } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      user_id,
      { ai_mode: strategy },
      { new: true },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'user not found' });
    }

    res.json({
      success: true,
      message: 'Successful!',
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message,
    });
  }
});

router.patch('/prompt/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { prompt } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      user_id,
      { prompt: prompt },
      { new: true },
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'user not found' });
    }

    res.json({
      success: true,
      message: 'Successful!',
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message,
    });
  }
});

router.post('/detachPlayer/:room_id', auth, async (req, res) => {
  const { room_id } = req.params;
  const user_id = req.user._id;
  try {
    const room = await Room.findById(room_id);
    if (!room) {
      console.log('Room not found');
      return res
        .status(404)
        .json({ success: false, message: 'Room not found' });
    }

    const attachedPlayer = await AttachedPlayer.findOne({
      room: room_id,
      user: user_id,
    });
    if (!attachedPlayer) {
      console.log('Attached player not found');
      return res
        .status(404)
        .json({ success: false, message: 'Attached player not found' });
    }

    await AttachedPlayer.deleteOne({ _id: attachedPlayer._id });

    res.json({
      success: true,
      message: 'Successfully detached from the room',
    });
  } catch (err) {
    console.error('Error detaching player from room:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

router.patch('/updateAttachment/:room_id', auth, async (req, res) => {
  const { room_id } = req.params;
  const { _id, range, ai_mode } = req.user;
  const selected_strategy = ai_mode;
  const bet_amounts = range;

  try {
    // Retrieve the room and populate its game_type field
    const room = await Room.findById(room_id).populate({
      path: 'game_type',
      model: 'rps_game_types',
    });

    // Build the room_name string using the populated data
    let room_name = '';
    if (room && room.game_type && room.room_number) {
      room_name = `${room.game_type.short_name}-${room.room_number}`;
    }

    // Update (or create if none exists) the AttachedPlayer document.
    const updatedAttachment = await AttachedPlayer.findOneAndUpdate(
      { user: _id, room: room_id }, // Filter using user_id and room_id
      {
        $set: {
          bet_amounts,
          selected_strategy,
          updated_at: Date.now(),
          room_name, // Add the newly built room_name field
        },
      },
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true, // Applies default values on insert if defined in the schema
      },
    );

    return res.json({
      success: true,
      message: 'Attachment updated successfully',
      updatedAttachment,
    });
  } catch (err) {
    console.error('Error updating attachment:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

router.get('/getattachedrooms', auth, async (req, res) => {
  const user_id = req.user._id;
  try {
    const attachments = await AttachedPlayer.find({ user: user_id });
    return res.json({
      success: true,
      attachments: attachments || [],
    });
  } catch (err) {
    console.error('Error finding attachments:', err.message);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

router.get('/checkAttachment/:room_id', auth, async (req, res) => {
  const { room_id } = req.params;
  const user_id = req.user._id;
  try {
    const existingAttachment = await AttachedPlayer.findOne({
      user: user_id,
      room: room_id,
    });

    if (existingAttachment) {
      return res.json({
        success: true,
        attached: true,
        message: 'User is already attached to this room',
        attachedPlayer: existingAttachment,
      });
    } else {
      return res.json({
        success: true,
        attached: false,
        message: 'User is not attached to this room',
      });
    }
  } catch (err) {
    console.error('Error checking attachment:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

router.patch('/rooms/:room_id', async (req, res) => {
  const { room_id } = req.params;

  try {
    if (roomLocks[room_id]) {
      return res
        .status(409)
        .json({ success: false, message: 'Room is currently being updated' });
    }

    roomLocks[room_id] = true;

    const room = await Room.findById(room_id);
    if (!room) {
      console.log('Room not found');
      delete roomLocks[room_id];
      return res
        .status(404)
        .json({ success: false, message: 'Room not found' });
    }

    if (room.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS ENDED ALREADY',
      });
    }
    const findRandomBot = async () => {
      let attempts = 0;
      while (attempts < 6) {
        const randomBot = await User.aggregate([
          { $match: { username: { $regex: /BOT/i } } },
          { $sample: { size: 1 } },
        ]);
        const botId = randomBot[0]._id;

        if (!room.joiners.includes(botId)) {
          return botId;
        }
        attempts++;
      }
      throw new Error('No available bots found');
    };

    const botId = await findRandomBot();

    if (room.joiners.includes(botId)) {
      delete roomLocks[room_id];
      return res.status(400).json({
        success: false,
        message: 'Bot is already in the room',
      });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      room_id,
      { $push: { joiners: botId } },
      { new: true },
    );

    delete roomLocks[room_id];

    res.json({
      success: true,
      message: 'Bot joined the room successfully!',
      room: updatedRoom,
    });
  } catch (err) {
    console.error('Error updating room:', err.message);
    delete roomLocks[room_id];
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

router.patch('/rooms/:room_id/remove-bots', async (req, res) => {
  const { room_id } = req.params;
  const bots = [
    '65eafc72aea25957ac8ea60d',
    '65eafa5caea25957ac8ea60b',
    '62b9ef88a5409449f63f7ccb',
    '65eafb7daea25957ac8ea60c',
  ];

  try {
    roomLocks[room_id] = true;

    let room = await Room.findById(room_id);

    if (!room) {
      delete roomLocks[room_id];
      return res
        .status(404)
        .json({ success: false, message: 'Room not found' });
    }

    room.status = 'waiting';
    await saveDocumentWithRetry(room);

    const removeAllMatchingBots = async () => {
      try {
        room = await Room.findById(room_id);

        if (!room) {
          throw new Error('Room not found');
        }

        const matchingBots = room.joiners.filter((joiner) =>
          bots.includes(joiner.toString()),
        );

        if (matchingBots.length === 0) {
          if (room.status !== 'open') {
            room.status = 'open';
            await saveDocumentWithRetry(room);
          }
          return room;
        }

        room.joiners = room.joiners.filter(
          (joiner) => !bots.includes(joiner.toString()),
        );

        room.status = 'open';
        await saveDocumentWithRetry(room);

        return room;
      } catch (err) {
        throw err;
      }
    };

    const updatedRoom = await removeAllMatchingBots();

    delete roomLocks[room_id];

    if (updatedRoom) {
      res.json({
        success: true,
        message:
          'All matching bots removed from the room and room status updated!',
        room: updatedRoom,
      });
    } else {
      res.json({
        success: true,
        message: 'No matching bots found in the room',
        room: room,
      });
    }
  } catch (err) {
    console.error('Error removing bots from room:', err.message);
    delete roomLocks[room_id];
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

router.get('/rooms/:room_id/bots-count', async (req, res) => {
  const { room_id } = req.params;
  try {
    const room = await Room.findById(room_id);
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Room not found' });
    }

    const findBots = async () => {
      const bots = await User.aggregate([
        { $match: { username: { $regex: /BOT/i } } },
        { $project: { _id: { $toString: '$_id' } } },
      ]);
      return bots.map((bot) => bot._id);
    };

    const botIds = await findBots();
    const joinerIds = room.joiners.map((joiner) => joiner.toString());
    const botCount = joinerIds.reduce((count, joinerId) => {
      if (botIds.includes(joinerId)) {
        count++;
      }
      return count;
    }, 0);

    res.json({
      success: true,
      botCount,
    });
  } catch (err) {
    console.error('Error retrieving bot count:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});

router.patch('/room/strategies/:room_id', async (req, res) => {
  const { room_id } = req.params;
  const { strategy } = req.body;

  try {
    const room = await Room.findByIdAndUpdate(
      room_id,
      { selectedStrategy: strategy },
      { new: true },
    );

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Room not found' });
    }

    res.json({
      success: true,
      message: 'Room strategy updated successfully!',
      room: room,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
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
  if (!['like', 'dislike', 'view'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid type' });
  }
  const updateQuery =
    type === 'view'
      ? {
        $set: {
          views: { $concatArrays: ['$views', [req.user._id]] },
        },
      }
      : {
        $set: {
          [`${type}s`]: {
            $cond: [
              { $in: [req.user._id, `$${type}s`] },
              { $setDifference: [`$${type}s`, [req.user._id]] },
              { $concatArrays: [`$${type}s`, [req.user._id]] },
            ],
          },
        },
      };
  try {
    const room = await Room.findOneAndUpdate({ _id: id }, [updateQuery], {
      new: true,
    });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, message: 'Successful!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/room/:id', async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id })
      .populate({ path: 'game_type', model: GameType })
      .populate({ path: 'joiners', model: User });
    let gameLogQuery = GameLog.find({ room: room })
      .sort({ created_at: 'desc' })
      .populate({
        path: 'room',
        model: Room,
        select:
          '_id winnings gameCode pool_id ticker battles image tax website_link x_link telegram_link selectedStrategy commission username creator status hosts room_number game_type bet_amount user_bet host_pr created_at',
      })
      .populate({
        path: 'game_type',
        model: GameType,
        select: 'short_name game_type_name',
      })
      .populate({
        path: 'creator',
        model: User,
        select: '_id avatar username accessory totalWagered',
      })
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id avatar username accessory totalWagered',
      })
      .limit(req.query.limit ? req.query.limit : 10);

    const totalGameLogsCount = await GameLog.countDocuments({ room });

    const gameLogList = await gameLogQuery;

    const creator = await User.findOne({ _id: room.creator });
    const joiners = await User.find({ _id: { $in: room.joiners } });

    const roomHistory = await convertGameLogToHistoryStyle(gameLogList);
    res.json({
      success: true,
      query: req.query,
      roomInfo: {
        _id: room['_id'],
        name: room['name'],
        image: room['image'],
        ticker: room['ticker'],
        pool_id: room['pool_id'],
        gameCode: room['gameCode'],
        x_link: room['x_link'],
        tax: room['tax'],
        website_link: room['website_link'],
        telegram_link: room['telegram_link'],
        created_at: room['created_at'],
        creator_id: room['creator'],
        username: creator['username'],
        creator_avatar: creator['avatar'],
        rank: creator['totalWagered'],
        accessory: creator['accessory'],
        hosts: room.hosts.map((host) => ({
          host: host['host'],
          username: host['username'],
          avatar: host['avatar'],
          rank: host['rank'],
          accessory: host['accessory'],
          share: host['share'],
          walletAddress: host['walletAddress'],
        })),
        endgame_amount: room['endgame_amount'],
        endgame_type: room['endgame_type'],
        description: room['description'],
        joiners: joiners,
        game_type: room['game_type']['game_type_name'],
        bet_amount: parseFloat(room['bet_amount']),
        user_bet: parseFloat(room['user_bet']),
        host_pr: room['host_pr'],
        pr: room['pr'],
        user_bet: room['user_bet'],
        room_name: room['game_type']['short_name'] + '-' + room['room_number'],
        total_stakes: room.hosts.reduce((acc, host) => acc + host.stake, 0),
        qs_game_type: room['qs_game_type'],
        selectedStrategy: room['selectedStrategy'],
        battles: room['battles'],
        qs_nation: room['qs_nation'],
        rps_game_type: room['rps_game_type'],
        qs_game_type: room['qs_game_type'],
        room_history: roomHistory,
        status: room['status'],
        is_private: room['is_private'],
        game_log_list: gameLogList.map(({ bet_amount }) => bet_amount),
      },
      totalGameLogsCount: totalGameLogsCount,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.toString(),
    });
  }
});

// Define your route
router.get('/rpsbetitems/:roomId', auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    const rpsBetItems = await RpsBetItem.find({
      room: roomId,
      joiner: req.user._id,
      joiner_rps: { $ne: null },
    })
      .sort({ created_at: -1 })
      .limit(50);

    res.json({
      success: true,
      data: rpsBetItems,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err,
    });
  }
});

router.get('/qsbetitems/:roomId', auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    const qsBetItems = await QsBetItem.find({
      room: roomId,
      joiner: req.user._id,
      joiner_qs: { $ne: null },
    })

      .sort({ created_at: -1 })
      .limit(50);
    res.json({
      success: true,
      data: qsBetItems,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err,
    });
  }
});

// GET /api/comments/:room_id
router.get('/comments/:room_id', async (req, res) => {
  try {
    const room_id = req.params.room_id;
    const comments = await Comment.find({ room: room_id })
      .populate({ path: 'user', model: User })
      .select('_id accessory avatar username totalWagered content created_at')
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

router.get('/topWithdrawals', async (req, res) => {
  try {
    const topWds = await Receipt.find({ payment_type: { $regex: /Withdraw/i } })
      .sort({ amount: -1 })
      .populate({
        path: 'user_id',
        model: User,
        select: '_id avatar accessory totalWagered username',
      });

    const filteredWithdrawals = topWds.filter(
      (withdrawal) =>
        withdrawal.user_id &&
        !['OFFICIALRPSGAME', 'pimpedpistols', '69'].includes(
          withdrawal.user_id.username,
        ),
    );

    const sortedWithdrawals = filteredWithdrawals
      .map((withdrawal) => ({
        ...withdrawal.toObject(),
        amount: Math.abs(withdrawal.amount),
      }))
      .slice(0, 4);

    res.json({
      success: true,
      pageSize: 4,
      history: sortedWithdrawals,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

const getHistory = async (pageSize, my_id, game_type) => {
  try {
    const id_condition = {};
    const game_type_condition = {};

    if (my_id) {
      id_condition['$or'] = [{ creator: my_id }, { joined_user: my_id }];
    }

    if (game_type !== 'All') {
      const gameType = await GameType.findOne({ short_name: game_type });
      game_type_condition.game_type = gameType._id;
    }

    const search_condition = { $and: [id_condition, game_type_condition] };

    const gameLogQuery = GameLog.find(search_condition)
      .sort({ created_at: 'desc' })
      .limit(pageSize)
      .populate({
        path: 'room',
        model: Room,
        select:
          '_id winnings ticker image commission creator status ai_mode hosts room_number game_type bet_amount user_bet host_pr created_at',
      })
      .populate({
        path: 'game_type',
        model: GameType,
        select: 'short_name game_type_name',
      })
      .populate({
        path: 'creator',
        model: User,
        select: '_id avatar accessory totalWagered',
      })
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id avatar accessory totalWagered',
      });
    const countQuery = GameLog.countDocuments(search_condition);

    const [gameLogList, count] = await Promise.all([gameLogQuery, countQuery]);

    const result = await convertGameLogToHistoryStyle(gameLogList);

    return {
      history: result,
      count,
      pageSize,
    };
  } catch (err) {
    return false;
  }
};

router.get('/history', async (req, res) => {
  try {
    const { pageSize = 1, game_type = 'All' } = req.query;

    const history = await getHistory(parseInt(pageSize), null, game_type);
    res.json({
      success: true,
      pageSize: parseInt(pageSize),
      history: history.history,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.toString(),
    });
  }
});

router.get('/my_history', auth, async (req, res) => {
  try {
    const { pageSize = 16, game_type = 'All' } = req.query;

    const history = await getHistory(
      parseInt(pageSize),
      req.user._id,
      game_type,
    );

    res.json({
      success: true,
      pageSize: parseInt(pageSize),
      history: history.history,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.toString(),
    });
  }
});

router.get('/count', async (req, res) => {
  const game_type = req.query.game_type ? req.query.game_type : 'All';
  try {
    let search_condition = { status: 'open' };

    if (game_type !== 'All') {
      const gameType = await GameType.findOne({ short_name: game_type }).select(
        '_id',
      );
      search_condition.game_type = gameType._id;
    }

    const roomCount = await Room.countDocuments(search_condition);

    res.json({
      success: true,
      game_type: game_type,
      roomCount: roomCount,
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.toString(),
    });
  }
});

router.get('/rooms', async (req, res) => {
  // game_type can still be used as a filter, default to 'All'
  const game_type = req.query.game_type || 'All';

  try {
    // We no longer pass "page" or do skip/limit
    const rooms = await getRoomList(game_type);
    res.json({
      success: true,
      query: req.query,
      roomList: rooms.rooms,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.toString(),
    });
  }
});

const getRoomList = async (game_type) => {
  const search_condition = {
    status: 'open',
    game_type: { $ne: null },
  };

  // If a specific short_name is requested (not "All"), filter by that
  if (game_type !== 'All') {
    const gameType = await GameType.findOne({ short_name: game_type }).select(
      '_id',
    );
    if (gameType) {
      search_condition.game_type = gameType._id;
    }
  }

  try {
    // Return all matching rooms with no skip/limit
    const preRooms = await Room.find(search_condition)
      .select(
        '_id name ticker image description room_number ' +
        'creator battles username joiners game_type qs_game_type is_private ' +
        'bet_amount user_bet pr host_pr endgame_amount status created_at updated_at hosts',
      )
      .populate({
        path: 'creator',
        model: 'rps_users',
        select: 'avatar totalWagered username accessory status',
      })
      .populate({ path: 'game_type', model: 'rps_game_types' })
      .sort({ updated_at: -1 })
      .limit(50);
    // Build final list of rooms with joiner info
    const result = await Promise.all(
      preRooms.map(async (room) => {
        try {
          const joinerData = await Promise.all(
            room.joiners.map(async (joinedUserId) => {
              const user = await User.findOne({ _id: joinedUserId }).select(
                'avatar totalWagered _id username accessory status',
              );
              return {
                user_id: user._id,
                avatar: user.avatar,
                totalWagered: user.totalWagered,
                accessory: user.accessory,
                username: user.username,
                rank: user.totalWagered,
              };
            }),
          );

          const temp = {
            _id: room._id,
            creator_id: room.creator ? room.creator._id : '',
            joiners: room.joiners,
            ticker: room.ticker || room.room_number,
            joiners: joinerData.map((joiner) => ({
              avatar: joiner.avatar,
              rank: joiner.totalWagered,
              username: joiner.username,
              accessory: joiner.accessory,
              _id: joiner._id,
            })),
            rank: room.creator?.totalWagered || 0,
            creator_avatar: room.creator?.avatar || '',
            accessory: room.creator?.accessory || '',
            username: room.creator?.username || '',
            creator_status: room.creator?.status || '',
            game_type: room.game_type,
            name: room.name,
            description: room.description,
            image: room.image,
            qs_game_type: room.qs_game_type,
            bet_amount: room.bet_amount,
            pr: room.pr,
            endgame_amount: room.endgame_amount,
            host_pr: room.host_pr,
            room_name: room.game_type.short_name + '-' + room.room_number,
            total_stakes: room.hosts.reduce((acc, host) => acc + host.stake, 0),
            user_bet: parseFloat(room.user_bet),
            is_private: room.is_private,
            status: room.status,
            index: room.room_number,
            created_at: moment(room.created_at).format('YYYY-MM-DD HH:mm'),
            updated_at: room.updated_at,
            battles: room.battles,
            hosts: room.hosts,
            winnings: parseFloat(room.user_bet),
          };

          return temp;
        } catch (error) {
          console.error('Error building room object:', error.toString());
          return null;
        }
      }),
    );

    const filteredResults = result.filter((r) => r !== null);
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
      game_type,
      is_private,
      endgame_amount,
      endgame_type,
      selectedStrategy,
      description,
      qs_game_type,
      room_password,
      connectedAccount,
      prompt,
      gameCode,
      qs_nation,
    } = req.body;

    const {
      _id,
      avatar,
      status,
      accessory,
      totalWagered,
      username,
      dailyWithdrawals,
      isWithdrawing,
      balance
    } = req.user;

    // Consolidate validations
    const user_bet = parseFloat(bet_amount);
    
    // Validation checks - return early if any fail
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

    // Fetch necessary data in parallel
    const [roomCount, gameTypeDoc, commissionDoc] = await Promise.all([
      Room.countDocuments({}),
      GameType.findOne({ game_type_id: parseInt(game_type) }),
      System.findOne({ name: 'commission' })
    ]);

    if (!gameTypeDoc) {
      return res.json({
        success: false,
        message: 'Invalid game type',
      });
    }

    // Calculate fees
    const commissionPercentage = commissionDoc.value;
    const fee = user_bet * (commissionPercentage / 100);
    const amountAfterFee = user_bet - fee;
    const room_number = roomCount + 1;

    // Prepare the host object
    const hostObj = {
      host: _id,
      avatar,
      username,
      accessory,
      rank: totalWagered,
      share: 100,
      stake: amountAfterFee,
      walletAddress: connectedAccount,
    };

    // Create objects for all models that need to be saved
    const newRoom = new Room({
      creator: _id,
      room_password: room_password || '',
      bet_amount: amountAfterFee,
      is_private,
      qs_nation,
      battles: 0,
      hosts: [hostObj],
      game_type: gameTypeDoc,
      qs_game_type: qs_game_type ? qs_game_type : 2,
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

    const newGameLog = new GameLog({
      room: newRoom._id,
      creator: _id,
      joined_user: _id,
      game_type: gameTypeDoc._id,
      bet_amount: amountAfterFee,
      hosts: [hostObj],
      game_result: -3000,
    });

    const newTransaction = new Transaction({
      user: req.user,
      amount: -amountAfterFee,
      description: 'created ' + (name || `${gameTypeDoc.short_name}-${room_number}`),
      room: newRoom._id,
    });

    // Update user
    const updatedUser = {
      balance: balance - amountAfterFee,
      updated_at: new Date(),
      totalTraded: req.user.totalTraded + Math.abs(user_bet),
      tradingProfit: req.user.tradingProfit - amountAfterFee
    };

    // Execute all database operations in parallel
    await Promise.all([
      saveDocumentWithRetry(newGameLog),
      User.findByIdAndUpdate(_id, updatedUser),
      saveDocumentWithRetry(newRoom),
      saveDocumentWithRetry(newTransaction),
      System.findOneAndUpdate(
        { name: 'platform_trading' },
        { $inc: { value: fee } }
      )
    ]);

    // Query for emitting events
    const gameLogList = await GameLog.find({ room: newRoom._id })
      .sort({ created_at: 'desc' })
      .limit(1)
      .populate({
        path: 'room',
        model: Room,
        select: '_id winnings ticker image commission username creator status hosts room_number game_type bet_amount user_bet host_pr created_at',
      })
      .populate({
        path: 'game_type',
        model: GameType,
        select: 'short_name game_type_name',
      })
      .populate({
        path: 'creator',
        model: User,
        select: '_id avatar username accessory totalWagered',
      })
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id avatar username accessory totalWagered',
      });

    // Process and emit events
    const newLog = await convertGameLogToHistoryStyle(gameLogList);
    const roomObj = {
      ...newRoom.toObject(),
      creator_id: _id,
      creator_avatar: avatar,
      creator_status: status,
      accessory: accessory || '',
      username,
      winnings: amountAfterFee,
      rank: totalWagered,
      joiners: [],
    };

    // Emit events in non-blocking way
    setImmediate(() => {
      req.io.sockets.emit('NEW_LOG', { newLog });
      req.io.sockets.emit('UPDATED_ROOM_LIST', roomObj);
    });

    res.json({
      success: true,
      message: 'room created',
      newTransaction,
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

router.get('/my_games', auth, async (req, res) => {
  try {
    const pageSize = 50;
    const game_type = req.query.game_type ? req.query.game_type : 'All';
    const status = req.query.status;
    const sort = req.query.sort ? req.query.sort : 'desc';

    const { rooms, count } = await getMyRooms(
      req.user._id,
      pageSize,
      game_type,
      status,
      sort,
    );
    res.json({
      success: true,
      pageSize: pageSize,
      myGames: rooms,
      total: count,
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.toString(),
    });
  }
});

const getMyRooms = async (
  user_id,
  pageSize,
  game_type = 'All',
  status = 'open',
  sort = 'desc',
) => {
  const search_condition = {
    hosts: { $elemMatch: { host: user_id, share: { $gt: 0 } } },
  };

  if (status) {
    search_condition.status = status;
  }
  if (game_type !== 'All') {
    const gameType = await GameType.findOne({ short_name: game_type });
    search_condition.game_type = gameType._id;
  }
  if (status === 'finished') {
    search_condition.joiners = { $exists: true, $ne: [] };
  }

  const rooms = await Room.find(search_condition)
    .populate({ path: 'game_type', model: GameType })
    .limit(pageSize);

  const count = await Room.countDocuments(search_condition);

  let result = [];

  for (const room of rooms) {
    try {
      const isCoHost = room.hosts.find(
        (host) =>
          host.host.toString() === user_id.toString() && host.share === 100,
      );
      const gameLogCount = await GameLog.countDocuments({ room: room._id });
      const creatorDetails = await User.findById(room.creator).select(
        'avatar totalWagered accessory',
      );
      const creatorAvatar = creatorDetails?.avatar || '';
      const creatorTotalWagered = creatorDetails?.totalWagered || 0;
      const creatorAccessory = creatorDetails?.accessory || '';

      let temp = {
        _id: room._id,
        creator_id: room.creator,
        name: room.name,
        image: room.image,
        ticker: room.ticker,
        creator_avatar: creatorAvatar,
        rank: creatorTotalWagered,
        accessory: creatorAccessory,
        game_type: room.game_type,
        bet_amount: room.bet_amount,
        rps_list: room.rps_list,
        qs_list: room.qs_list,
        user_bet: room.user_bet,
        share: (() => {
          const matchingHost = room.hosts.find(
            (host) => host.host.toString() === user_id.toString(),
          );
          if (matchingHost) {
            return matchingHost.share;
          } else {
            return 0;
          }
        })(),
        pr: room.host_pr,
        winnings: '',
        index: room.room_number,
        endgame_type: room.endgame_type,
        endgame_amount: room.endgame_amount,
        is_private: room.is_private,
        status: room.status,
        created_at: room.created_at,
        coHost: isCoHost,
        selectedStrategy: room.selectedStrategy,
        // statistics: '',
        net_profit: '',
        battles: gameLogCount,
        hosts: room.hosts,
      };

      if (gameLogCount === 0) {
        temp.winnings = temp.bet_amount;
      } else if (room.game_type.game_type_id === 1) {
        // RPS
        temp.winnings = room.user_bet;
      } else if (room.game_type.game_type_id === 5) {
        // Quick Shoot
        temp.winnings = room.user_bet;
      }

      if (isCoHost) {
        const hostShare = isCoHost.share;
        temp.winnings = (hostShare / 100) * parseFloat(room.user_bet);
        if (room.creator.toString() !== user_id.toString()) {
          temp.coHost = isCoHost;
        }
      }

      result.push(temp);
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
    } catch (e) {
      console.log(e.toString());
    }
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
      totalWagered,
    } = req.user;
    const { room_id: roomId } = req.body;

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

    const roomInfo = await Room.findOne({ _id: roomId })
      .populate({ path: 'creator', model: User, select: 'username _id' })
      .populate({ path: 'game_type', model: GameType, select: 'short_name' })
      .select(
        'status hosts user_bet name host_pr pr bet_amount room_number selectedStrategy',
      );

    if (roomInfo.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS ALREADY ENDED',
      });
    }

    const tenSecondsAgo = new Date(Date.now() - 500);
    if (roomInfo.updated_at > tenSecondsAgo) {
      responseData = {
        success: false,
        message: 'ROOM TOO BUSY, TRY AGAIN LATER',
        betResult: -1200,
      };
      return responseData;
    }

    roomInfo.status = 'finished';
    await saveDocumentWithRetry(roomInfo);

    const strategyKey = roomInfo.selectedStrategy
      .replace(/[\s-]/g, '')
      .toLowerCase();
    const hostUpdates = [];

    for (const hostData of roomInfo.hosts) {
      const hostId = hostData.host;
      const host = await User.findById(hostId).select('balance updated_at');
      if (!host) continue;

      const amount = (hostData.share / 100) * parseFloat(roomInfo.user_bet);
      host.balance += amount;
      host.updated_at = new Date();
      hostUpdates.push(saveDocumentWithRetry(host));

      let qbotHost =
        (await QBot.findOne({ user: req.user._id }).select(
          'hosting updated_at',
        )) || new QBot({ user: roomInfo.creator._id });
      qbotHost.hosting = qbotHost.hosting || {};
      qbotHost.hosting[strategyKey] =
        (qbotHost.hosting[strategyKey] || 0) +
        (roomInfo.host_pr + roomInfo.pr - roomInfo.bet_amount);
      qbotHost.updated_at = new Date();
      hostUpdates.push(saveDocumentWithRetry(qbotHost));

      const message = `Rugged ${roomInfo.name}`;
      const notificationData = {
        _id: userId,
        message,
        username,
        avatar,
        amount,
        accessory,
        room: roomInfo._id,
        rank: totalWagered,
        created_at: moment().format('YYYY-MM-DD HH:mm'),
        created_at_str: moment().format('LLL'),
        updated_at: moment().format('YYYY-MM-DD HH:mm'),
        is_read: false,
      };
      socket.sendNotification(hostId, notificationData);
    }

    await Promise.all(hostUpdates);

    const newGameLog = new GameLog({
      room: roomInfo._id,
      creator: roomInfo.creator._id,
      joined_user: roomInfo.creator._id,
      game_type: roomInfo.game_type._id,
      bet_amount: roomInfo.host_pr,
      hosts: roomInfo.hosts,
      game_result: -100,
    });

    const newTransactionC = new Transaction({
      user: userId,
      amount: (roomInfo.hosts[0].share / 100) * parseFloat(roomInfo.user_bet),
      description: `Rugged ${roomInfo.name}`,
      room: roomId,
    });

    await Promise.all([
      saveDocumentWithRetry(newGameLog),
      saveDocumentWithRetry(newTransactionC),
    ]);

    let gameLogQuery = GameLog.find({ room: roomInfo._id })
      .sort({ created_at: 'desc' })
      .limit(1)
      .populate({
        path: 'room',
        model: Room,
        select:
          '_id winnings ticker image commission username creator status hosts room_number game_type bet_amount user_bet host_pr created_at',
      })
      .populate({
        path: 'game_type',
        model: GameType,
        select: 'short_name game_type_name',
      })
      .populate({
        path: 'creator',
        model: User,
        select: '_id avatar username accessory totalWagered',
      })
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id avatar username accessory totalWagered',
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
    // -------------------------------------------
    // 1) Basic checks
    // -------------------------------------------
    if (
      !req.body.connectedAccount ||
      !req.user.accounts ||
      !req.user.accounts.includes(req.body.connectedAccount)
    ) {
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
    const gameType = await GameType.findOne({ _id: room?.game_type });
    let pool_id = '';

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

    const tenSecondsAgo = new Date(Date.now() - 500);
    if (room.updated_at > tenSecondsAgo) {
      responseData = {
        success: false,
        message: 'ROOM TOO BUSY, TRY AGAIN LATER',
        betResult: -1200,
      };
      return responseData;
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

    // -------------------------------------------
    // 2) Commission & user balance
    // -------------------------------------------
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

    // -------------------------------------------
    // 3) Real liquidity update
    // -------------------------------------------
    const oldLiquidity = parseFloat(room.user_bet) || 0;
    const netDeposit = amountAfterFee;
    const newLiquidity = oldLiquidity + netDeposit;

    // -------------------------------------------
    // 4) Reconstruct current share supply
    // -------------------------------------------
    // Calculate each host’s current “absolute” shares based on liquidity.
    // (This assumes that previously the share percentages were computed
    // with oldLiquidity as the total pool.)
    let totalShareSupply = 0;
    const oldHosts = room.hosts.map((host) => {
      const oldAbs = (host.share / 100) * oldLiquidity; // old absolute shares
      totalShareSupply += oldAbs;
      return {
        ...host.toObject(),
        oldAbsoluteShares: oldAbs,
      };
    });

    // -------------------------------------------
    // 5) Simple share minting & bonus distribution
    // -------------------------------------------
    // Instead of using a bonding curve we mint new shares equal to netDeposit.
    // Then, a fixed fraction (e.g., 12%) of the new shares is taken as a bonus for existing holders.
    const mintedShares = netDeposit; // New shares minted are directly equal to the net deposit.
    const fractionForOld = 0.12; // 12% bonus to older holders.
    const bonusForOld = mintedShares * fractionForOld;
    const buyerShares = mintedShares - bonusForOld;

    // 5A) Distribute bonus shares among existing hosts proportionally
    let totalOld = oldHosts.reduce((acc, h) => acc + h.oldAbsoluteShares, 0);
    if (totalOld < 1e-9) totalOld = 1; // avoid division by zero if there are no hosts

    oldHosts.forEach((h) => {
      const frac = h.oldAbsoluteShares / totalOld;
      const bonus = bonusForOld * frac;
      h.newAbsoluteShares = (h.oldAbsoluteShares || 0) + bonus;
    });

    // 5B) The new buyer gets buyerShares.
    const existingHostIndex = oldHosts.findIndex((h) =>
      h.host.equals(req.user._id),
    );
    if (existingHostIndex === -1) {
      // New user: add as a host.
      oldHosts.push({
        host: req.user._id,
        accessory: req.user.accessory,
        username: req.user.username,
        avatar: req.user.avatar,
        rank: req.user.totalWagered,
        walletAddress: req.body.connectedAccount,
        oldAbsoluteShares: 0,
        newAbsoluteShares: buyerShares,
      });
    } else {
      // Existing user: add buyerShares to their total.
      oldHosts[existingHostIndex].newAbsoluteShares += buyerShares;
    }

    // The new total share supply is the old share supply plus the newly minted shares.
    const newTotalShareSupply = totalShareSupply + mintedShares;

    // -------------------------------------------
    // 6) Recalculate each host's share percentage
    // -------------------------------------------
    oldHosts.forEach((h) => {
      const fraction = h.newAbsoluteShares / newTotalShareSupply;
      h.share = fraction * 100;
    });

    // Normalize percentages to ensure they sum to 100.
    const sumPct = oldHosts.reduce((acc, h) => acc + h.share, 0);
    if (sumPct > 0) {
      const factor = 100 / sumPct;
      oldHosts.forEach((h) => (h.share *= factor));
    }

    // -------------------------------------------
    // 7) Overwrite room.hosts and update room liquidity
    // -------------------------------------------
    room.hosts = oldHosts.map((h) => ({
      host: h.host,
      share: h.share,
      accessory: h.accessory,
      username: h.username,
      avatar: h.avatar,
      rank: h.rank,
      walletAddress: h.walletAddress,
    }));

    room.user_bet = newLiquidity;
    room.host_pr += netDeposit;
    room.updated_at = moment(new Date()).format('YYYY-MM-DD HH:mm');

    if (room.user_bet >= room.endgame_amount) {
      try {
        room.status = 'finished';
        if (req.io.sockets) {
          req.io.sockets.emit('ROOM_ENDED', { roomId: room._id });
        }
        await saveDocumentWithRetry(room);
        const myMintPk = await mintTokenWithMetadata(room);
        const realBasePublicKey = new PublicKey(myMintPk);
        // const realBasePublicKey = new PublicKey(
        //   '4F5RbTrB35xMp816kYTazCM1H4ohLSJ2rVtuRyjcRRnz',
        // );
        await setTimeout(15000);

        console.log('----mint publickey:', realBasePublicKey);
        const wsolMintPk = new PublicKey(
          'So11111111111111111111111111111111111111112',
        );
        console.log('----wsolMintPk publickey:', wsolMintPk);
        await setTimeout(10000);

        const marketId = await createMarket(realBasePublicKey, wsolMintPk);
        // const marketId = new PublicKey(
        //   '33gVpPhJAm4f2p7EWMEMXuHrusTQCbkv2Q1coNrFEYTL',
        // );

        await setTimeout(15000);

        const ammId = await createAmmPool(marketId);
        // const ammId = new PublicKey(
        //   'BNR18d22wYLSaSQ8gKAQxP63XkDkW7WS9rwKinSCUKXs',
        // );
        console.log('Pool creation ammId:', ammId);

        await setTimeout(20000);

        // const addTxids = await addLiquidity(ammId);
        // console.log('Add Liquidity txids:', addTxids);
        // await setTimeout(10000);

        await distributeTokens(realBasePublicKey, room.hosts);
        await setTimeout(10000);

        const revokeTx =
          await revokeMintAndFreezeAuthorities(realBasePublicKey);
        pool_id = ammId.toBase58();
      } catch (e) {
        pool_id = '';
      }

      const newGameLogC = new GameLog({
        room: room._id,
        creator: room.creator,
        joined_user: room.creator,
        game_type: room.game_type,
        bet_amount: room.host_pr,
        user_bet: room.user_bet,
        hosts: room.hosts,
        endgame_amount: room.endgame_amount,
        game_result: 3,
      });

      if (pool_id) {
        room.pool_id = pool_id;
      }

      saveDocumentWithRetry(newGameLogC);
    }

    // -------------------------------------------
    // 8) Notification & logs (same as original)
    // -------------------------------------------
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
      room: room._id,
      rank: req.user.totalWagered,
      amount: -amountAfterFee,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      is_read: false,
    };

    const newTransaction = new Transaction({
      created_at: now,
      user: req.user._id,
      amount: -amountAfterFee,
      description: `Pumped ${room.name}`,
      room: room._id,
    });

    // Candle generation (using liquidity before and after the pump)
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
      joined_user: null,
      game_type: gameType,
      bet_amount: netDeposit,
      selected_rps: '',
      ai_mode: '',
      commission: 0,
      game_result: 444,
      winnings: 0,
      endgame_amount: netDeposit,
      host_pr: netDeposit,
      user_bet: 0,
      status: 'open',
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
          select:
            '_id winnings ticker image commission username creator status hosts room_number game_type bet_amount user_bet host_pr created_at',
        })
        .populate({
          path: 'game_type',
          model: GameType,
          select: 'short_name game_type_name',
        })
        .populate({
          path: 'creator',
          model: User,
          select: '_id avatar username accessory totalWagered',
        })
        .populate({
          path: 'joined_user',
          model: User,
          select: '_id avatar username accessory totalWagered',
        });

      const gameLogList = await gameLogQuery;
      const newLog = await convertGameLogToHistoryStyle(gameLogList);

      await Promise.all([
        saveDocumentWithRetry(tempNotification),
        saveDocumentWithRetry(room),
        saveDocumentWithRetry(req.user),
        saveDocumentWithRetry(newTransaction),
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
        newTransaction,
      });
    } catch (error) {
      console.error('Error saving game log:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save game log',
      });
    }
  } catch (error) {
    console.log('ERROR in pump (Simplified version):', error);
    return res.json({
      success: false,
      message: 'FAILED TO INITIATE PUMP',
    });
  }
});

// JEET (unstake / sell) endpoint – simplified version that sells the specified share amount
router.post('/jeet', auth, async (req, res) => {
  try {
    // 1) Basic checks + anti-abuse
    if (
      !req.body.connectedAccount ||
      !req.user.accounts ||
      !req.user.accounts.includes(req.body.connectedAccount)
    ) {
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

    // Instead of specifying a currency amount, the client now provides the number of shares to sell.
    let sellShares = parseFloat(req.body.stake_amount);
    if (isNaN(sellShares) || sellShares <= 0) {
      return res.json({ success: false, message: 'Invalid sell share amount' });
    }

    // 2) Load Room and check status
    const roomInfo = await Room.findOne({ _id: roomId })
      .populate({ path: 'creator', model: User })
      .populate({ path: 'game_type', model: GameType });

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

    const tenSecondsAgo = new Date(Date.now() - 500);
    if (roomInfo.updated_at > tenSecondsAgo) {
      responseData = {
        success: false,
        message: 'ROOM TOO BUSY, TRY AGAIN LATER',
        betResult: -1200,
      };
      return responseData;
    }

    // Verify that the user is a host in this room
    const hostIndex = roomInfo.hosts.findIndex((host) =>
      host.host.equals(userId),
    );
    if (hostIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not a host of this room',
      });
    }

    // 3) Set up commission & fees
    const commissionDoc = await System.findOne({ name: 'commission' });
    const commissionPercentage = commissionDoc?.value || 0;

    // 4) Determine current liquidity and total share supply
    const oldLiquidity = parseFloat(roomInfo.user_bet) || 0;

    // Use the stored total_share_supply (or assume it equals the liquidity if not set)
    let totalShareSupplyDB = roomInfo.total_share_supply || 0;
    if (totalShareSupplyDB < 1e-9) {
      totalShareSupplyDB = oldLiquidity;
    }

    // Convert each host's percentage into an absolute share amount.
    // (For example, if a host has 20% and the total share supply is 1000, then that host’s absolute stake is 200.)
    const oldHosts = roomInfo.hosts.map((host) => {
      const absShares = (host.share / 100) * totalShareSupplyDB;
      return { ...host.toObject(), absShares };
    });

    // 5) Identify the seller and ensure they have enough shares
    const seller = oldHosts[hostIndex];
    if (sellShares > seller.absShares + 1e-9) {
      return res.json({
        success: false,
        message: `You cannot sell ${sellShares.toFixed(
          2,
        )} shares; you only have ${seller.absShares.toFixed(2)} shares.`,
      });
    }

    // 6) Determine the currency value for the sold shares.
    // Each share is worth: (oldLiquidity / totalShareSupplyDB)
    const valueBeforeFee = sellShares * (oldLiquidity / totalShareSupplyDB);
    const fee = valueBeforeFee * (commissionPercentage / 100);
    const amountAfterFee = valueBeforeFee - fee;

    // Update platform fees
    await System.findOneAndUpdate(
      { name: 'platform_trading' },
      { $inc: { value: fee } },
    );

    // 7) Update share holdings:
    //    - The seller loses exactly the number of shares sold.
    //    - All other hosts lose a fixed fraction of their stake (shock effect).
    seller.newAbsShares = seller.absShares - sellShares;

    const shockRatio = 0.1; // 10% shock applied to other hosts
    oldHosts.forEach((host, idx) => {
      if (idx !== hostIndex) {
        host.newAbsShares = host.absShares * (1 - shockRatio);
      }
    });

    // 8) Compute the new total share supply after the sale and shock
    let newTotalShareSupply = oldHosts.reduce(
      (acc, host) => acc + (host.newAbsShares || 0),
      0,
    );

    // 9) Update pool liquidity: the pool’s liquidity decreases by the full amount (net of fee)
    const newLiquidity = oldLiquidity - amountAfterFee;

    // 10) Recompute each host’s percentage share based on their new absolute stake
    oldHosts.forEach((host) => {
      host.share =
        newTotalShareSupply > 0
          ? (host.newAbsShares / newTotalShareSupply) * 100
          : 0;
    });

    // Normalize percentages so that they sum to 100
    const sumPct = oldHosts.reduce((acc, host) => acc + host.share, 0);
    if (sumPct > 0) {
      const factor = 100 / sumPct;
      oldHosts.forEach((host) => (host.share *= factor));
    }

    // 11) Overwrite roomInfo.hosts with the updated share data
    roomInfo.hosts = oldHosts.map((host) => ({
      host: host.host,
      share: host.share,
      accessory: host.accessory,
      username: host.username,
      avatar: host.avatar,
      rank: host.rank,
      walletAddress: host.walletAddress || req.body.connectedAccount,
    }));

    // 12) Update room liquidity, the total share supply, and host_pr (if applicable)
    roomInfo.user_bet = newLiquidity;
    roomInfo.total_share_supply = newTotalShareSupply;
    roomInfo.host_pr = Math.max(roomInfo.host_pr - amountAfterFee, 0);
    roomInfo.updated_at = moment(new Date()).format('YYYY-MM-DD HH:mm');

    // 13) Credit the seller’s account with the withdrawn funds
    req.user.balance += amountAfterFee;
    req.user.totalTraded += valueBeforeFee;
    req.user.tradingProfit += amountAfterFee;

    // 14) Record the transaction
    const newTransaction = new Transaction({
      created_at: now,
      user: userId,
      amount: amountAfterFee,
      description: `Jeeted ${roomInfo.name}`,
      room: roomId,
    });

    // 15) Prepare candle data for chart updates
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

    // 16) Log this action in GameLog
    const newGameLog = new GameLog({
      room: roomInfo._id,
      creator: req.user._id,
      joined_user: null,
      game_type: roomInfo.game_type,
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
        select:
          '_id winnings ticker image commission username creator status hosts room_number game_type bet_amount user_bet host_pr created_at',
      })
      .populate({
        path: 'game_type',
        model: GameType,
        select: 'short_name game_type_name',
      })
      .populate({
        path: 'creator',
        model: User,
        select: '_id avatar username accessory totalWagered',
      })
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id avatar username accessory totalWagered',
      });

    const gameLogList = await gameLogQuery;
    const newLog = await convertGameLogToHistoryStyle(gameLogList);

    // 17) Prepare and send a notification to the seller
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
      room: roomInfo._id,
      rank: req.user.totalWagered,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      is_read: false,
    };

    // 18) Save all updates
    await Promise.all([
      saveDocumentWithRetry(tempNotification),
      saveDocumentWithRetry(roomInfo),
      saveDocumentWithRetry(req.user),
      saveDocumentWithRetry(newTransaction),
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

    // 19) Return success
    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction,
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

router.patch('/qbotStatus', auth, async (req, res) => {
  try {
    const { userId, isActive } = req.body;
    if (!userId || typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'User ID and isActive status are required',
      });
    }

    const qbot = await QBot.findOneAndUpdate(
      { user: userId },
      { active: isActive },
      { new: true, upsert: true },
    ).select('user _id active');
    if (req.io.sockets) {
      const socketName = 'QBOT_STATUS';
      req.io.sockets.emit(socketName, qbot);
    }

    res.json({
      success: true,
      isActive: qbot.active,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get('/qbotStatuses', auth, async (req, res) => {
  try {
    const { userIds } = req.query;
    if (!userIds) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required',
      });
    }

    const userIdsArray = userIds.split(',');
    const statuses = await QBot.find(
      { user: { $in: userIdsArray }, active: true },
      'user active',
    );

    // Transform statuses into a lookup object
    const statusesMap = userIdsArray.reduce((acc, id) => {
      acc[id] = !!statuses.find((status) => status.user.toString() === id);
      return acc;
    }, {});

    res.json({
      success: true,
      statuses: statusesMap,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get('/qbotStatus', auth, async (req, res) => {
  try {
    const user_id = req.user._id;
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }
    const isActive = await QBot.findOne(
      { user: user_id, active: true },
      'active',
    );

    return res.json({
      success: true,
      isActive: !!isActive,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
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
          select: 'username avatar accessory totalWagered',
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
    const results = await Chat.find({})
      .sort({ created_at: -1 }) // Change to ascending to avoid extra sort later
      .limit(15)
      .select('sender message messageType messageContent created_at replyTo')
      .populate({
        path: 'sender',
        select: 'username avatar accessory totalWagered _id',
        options: { lean: true }
      })
      .populate({
        path: 'replyTo',
        select: 'sender message messageType created_at',
        populate: {
          path: 'sender',
          select: 'username avatar accessory totalWagered _id',
          options: { lean: true }
        },
        options: { lean: true }
      })
      .lean()
     

    const chatLogs = results.map(chat => ({
      sender: chat.sender?.username || '',
      senderId: chat.sender?._id || '',
      message: chat.message,
      messageType: chat.messageType,
      messageContent: chat.messageContent,
      avatar: chat.sender?.avatar || '',
      accessory: chat.sender?.accessory || '',
      rank: chat.sender?.totalWagered || '',
      time: moment(chat.created_at).format('hh:mm'),
      replyTo: chat.replyTo?.[0] ? {
        username: chat.replyTo[0].sender?.username || '',
        senderId: chat.replyTo[0].sender?._id || '',
        avatar: chat.replyTo[0].sender?.avatar || '',
        rank: chat.replyTo[0].sender?.totalWagered || '',
        accessory: chat.replyTo[0].sender?.accessory || '',
        message: chat.replyTo[0].message,
        messageType: chat.replyTo[0].messageType,
        time: moment(chat.replyTo[0].created_at).format('hh:mm')
      } : null
    }));
    return res.json({ 
      success: true, 
      chatLogs: chatLogs.reverse() // Simply add .reverse() here
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

    let transactions = await Transaction.find({ room: room }).sort({
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
    const toAddress = req.body.addressTo;
    const userToTip = await User.findOne({ _id: toAddress });

    if (!userToTip) {
      return res.json({
        success: false,
        message: 'PURR-SON NOT FOUND',
      });
    }

    if (parseFloat(userToTip.totalWagered) < 500) {
      return res.json({
        success: false,
        message: 'CANNOT TIP THIS USER, THEIR RANK IS TOO LOW',
      });
    }

    const now = moment().format('LLL');
    const userBalance = req.user.balance;
    if (req.user.username.includes('BOT')) {
      return res.json({
        success: false,
        message: 'DO NOT HAVE PURRMISSION',
      });
    }

    if (user.isWithdrawing) {
      return res.json({
        success: false,
        error: 'WITHDRAWAL IN PROGRESS. Please wait until it completes.'
      });
    }

    const tipAmount = parseFloat(req.body.amount); // Parse amount as a float

    if (isNaN(tipAmount) || tipAmount <= 0) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!',
      });
    }
    if (req.user.dailyWithdrawals > 4.269) {
      return res.json({
        success: false,
        message: 'UNABLE TO TIP TODAY, PLEASE CHECK BACK TOMORROW!',
      });
    }

    // Initialize balance fields if they are undefined
    userToTip.balance = userToTip.balance || 0;
    req.user.balance = req.user.balance || 0;

    if (userBalance < tipAmount) {
      return res.json({
        success: false,
        message: 'NOT ENUFF FUNDS AT THIS MEOWMENT',
      });
    }

    // Create a default description
    let description = `Received Tip from ${req.user.username}`;

    if (req.body.message) {
      description = `${req.body.message} (Tip from ${req.user.username})`;
    }

    const newTransactionC = new Transaction({
      created_at: now,
      user: req.user,
      amount: -tipAmount,
      description: `Tipped ${userToTip.username}`,
    });

    const newTransactionJ = new Transaction({
      created_at: now,
      user: userToTip._id,
      amount: tipAmount,
      description,
    });

    let tipMessage = req.body.message ? `"${req.body.message}"` : ''; // Add quotes only if a message exists

    let notification = new Notification({
      from: req.user._id,
      to: userToTip._id,
      room: '',
      message: tipMessage ? `Tipped you — "${tipMessage}"` : 'Tipped you',
      amount: tipAmount,
      is_read: false,
    });

    let notificationC = new Notification({
      from: userToTip,
      to: req.user._id,
      room: '',
      message: tipMessage ? `You Tipped ${tipMessage}` : `You Tipped`,
      amount: -tipAmount,
      is_read: false,
    });

    const notificationData = {
      message: notification.message,
      amount: tipAmount,
      username: req.user.username,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
      rank: req.user.totalWagered,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
    };
    const notificationDataC = {
      message: notificationC.message,
      amount: -tipAmount,
      username: userToTip.username,
      avatar: userToTip.avatar,
      accessory: userToTip.accessory,
      rank: userToTip.totalWagered,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
    };

    try {
      await saveDocumentWithRetry(notification);
      await saveDocumentWithRetry(notificationC);
      socket.sendNotification(userToTip._id, notificationData);
      socket.sendNotification(req.user._id, notificationDataC);
    } catch (error) {
      console.error('Error saving tip notification:', error);
    }

    // Update balances and save transactions
    userToTip.balance += tipAmount;
    req.user.balance -= tipAmount;

    try {
      await Promise.all([
        saveDocumentWithRetry(userToTip),
        saveDocumentWithRetry(req.user),
        saveDocumentWithRetry(newTransactionC),
        saveDocumentWithRetry(newTransactionJ),
      ]);
    } catch (error) {
      console.error('Error saving documents:', error);
    }

    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction: newTransactionC,
      message: 'Tip has been sent. 💸 Yipeee!',
    });
  } catch (e) {
    console.log('ERROR in tip_request', e);
    return res.json({
      success: false,
      message: 'Failed to initiate tip',
    });
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

module.exports = router;
