require('dotenv').config();

console.log('🔥 =================================');
console.log('🔥 CATSINO SERVER STARTING UP');
console.log('🔥 Environment:', process.env.NODE_ENV || 'development');
console.log('🔥 Port:', process.env.PORT || 5001);
console.log('🔥 =================================');

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const socketController = require('./socketController.js');
const helmet = require('helmet'); // Security headers middleware
const bodyParser = require('body-parser');
const redis = require('redis');
const cronJob = require('./helper/util/createCronJob.js');
const eliteCron = require('./helper/util/eliteCron.js');
const callCronJob = require('./helper/util/callBotCron.js');
const interestCron = require('./helper/util/interestCron.js');

const app = express();

// -------------------- Redis Client Setup --------------------
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379', // Use env variable or default
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

// Attach redisClient to app for access in routes
app.set('redisClient', redisClient);

// -------------------- Server Setup --------------------
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// -------------------- Socket.io Setup --------------------
const io = socketController.socketio(server, {
  cors: {
    origin: [
      'http://localhost:3000', // Development
      'https://catsino.fun',   // Production
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
  allowEIO3: true, // Allow Engine.IO v3 clients
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6, // 1MB
});

setTimeout(() => callCronJob.callCronJobs(io), 500);
setTimeout(() => eliteCron.checkSubscriptionPayments(io), 3000);
setTimeout(() => cronJob.checkConfirmations(), 5000);
setTimeout(() => interestCron.updateRoomInterests(io), 11000);

// Attach io instance to each request for easy access
app.use((req, res, next) => {
  req.io = io;
  next();
});

// -------------------- CORS Configuration --------------------
// Updated CORS to allow API access from external sources
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://catsino.fun',
      // Add your external API domains here if needed
      // 'https://your-external-app.com'
    ];

    // Allow requests with no origin (mobile apps, server-to-server, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For public API, you might want to allow all origins for specific routes
      // This will be handled by route-specific CORS if needed
      callback(null, true); // Changed to allow all for API access
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
};
app.use(cors(corsOptions));

const compression = require('compression');
app.use(compression());

// -------------------- Middleware --------------------
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// Increase body size limits for API requests with large game codes
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
    },
  })
);

app.use('/img', express.static(path.join(__dirname, 'public/img')));

// -------------------- MongoDB Connection --------------------
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      writeConcern: { w: 1, j: false },
    });
    console.log('*** MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000); // Retry connection after 5 seconds
  }
};
connectWithRetry();

// -------------------- Routes --------------------
// Existing routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const gameRoutes = require('./routes/game.routes');
const loanRoutes = require('./routes/loan.routes');
const stripeRoutes = require('./routes/stripe.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const systemSettingRoutes = require('./routes/settings.routes');

// New API routes
const apiKeyRoutes = require('./routes/api-keys');
const publicApiRoutes = require('./routes/public-api');

// Existing API routes (protected by user auth)
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', systemSettingRoutes);

// New API routes
app.use('/api/api-keys', apiKeyRoutes); // Protected by user auth - for managing API keys
app.use('/api/public-api', publicApiRoutes); // Protected by API key auth - for external access

// Health check endpoint for API monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Updated API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Game Creation API',
    version: '1.0.0',
    description: 'Streamlined API for creating games and rooms programmatically',
    documentation: {
      authentication: 'API Key required in X-API-Key header',
      endpoints: {
        'GET /api/public-api/info': 'API information',
        'POST /api/public-api/create-room': 'Create a new game room with optional React generation',
        'POST /api/public-api/generate-image': 'Generate AI images using DALL-E 3'
      },
      rateLimit: '100 requests/hour, 1000 requests/day (configurable per key)',
      support: 'https://catsino.fun/support',
      changes: {
        'v1.0.0': 'Streamlined API - React generation now integrated into create-room endpoint'
      }
    },
    examples: {
      headers: {
        'X-API-Key': 'your_api_key_here',
        'Content-Type': 'application/json'
      },
      createRoomBasic: {
        url: '/api/public-api/create-room',
        method: 'POST',
        description: 'Create room with existing game code',
        body: {
          bet_amount: 0.01,
          name: 'My Game',
          game_type: 1,
          connectedAccount: 'your_wallet_address',
          gameCode: 'const App = () => { /* your React code */ }; export default App;',
          description: 'An exciting new game'
        }
      },
      createRoomWithGeneration: {
        url: '/api/public-api/create-room',
        method: 'POST',
        description: 'Create room with automatic React generation',
        body: {
          bet_amount: 0.01,
          name: 'AI Generated Game',
          game_type: 1,
          connectedAccount: 'your_wallet_address',
          generateReact: true,
          reactPrompt: 'Create a dice rolling game with animated dice and multiplier effects',
          imageUrls: ['https://example.com/dice.png'],
          description: 'An AI-generated game'
        }
      },
      generateImage: {
        url: '/api/public-api/generate-image',
        method: 'POST',
        description: 'Generate AI image for game assets',
        body: {
          prompt: 'A futuristic gaming interface with neon lights',
          size: '1024x1024',
          quality: 'hd'
        }
      }
    }
  });
});

// API documentation web page redirect
app.get('/docs', (req, res) => {
  // Redirect to your frontend documentation page
  if (process.env.NODE_ENV === 'production') {
    res.redirect('/#/api-docs'); // Assuming you have a docs page in your React app
  } else {
    res.redirect('http://localhost:3000/#/api-docs');
  }
});

// -------------------- Static Files --------------------
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// -------------------- Error Handling --------------------
// Enhanced error handling for API routes
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // API routes get JSON error responses
  if (req.path.startsWith('/api/')) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: err.stack })
    });
  } else {
    // Non-API routes get HTML error responses
    res.status(500).send('Something went wrong!');
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    available_endpoints: [
      'GET /api/docs',
      'GET /api/public-api/info',
      'POST /api/public-api/create-room',
      'POST /api/public-api/generate-image',
      'GET /health'
    ],
    documentation: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

// -------------------- Graceful Shutdown --------------------
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    console.log('Server closed');
  });
  await redisClient.quit(); // Close Redis connection
  mongoose.disconnect();
  process.exit(0);
});

// -------------------- Exports --------------------
module.exports = { app, server, io };