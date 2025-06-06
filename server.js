require('dotenv').config();

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
  transports: ['websocket'],
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
const itemRoutes = require('./routes/item.routes');
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
app.use('/api/item', itemRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', systemSettingRoutes);


// New API routes
app.use('/api/api-keys', apiKeyRoutes); // Changed from '/api/keys' to '/api/api-keys'
app.use('/api/v1', publicApiRoutes); 

// Health check endpoint for API monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Game Creation API',
    version: '1.0.0',
    description: 'API for creating games and rooms programmatically',
    documentation: {
      authentication: 'API Key required in X-API-Key header',
      endpoints: {
        'GET /api/v1/info': 'API information',
        'GET /api/v1/game-types': 'List available game types',
        'POST /api/v1/create-room': 'Create a new game room',
        'POST /api/v1/generate-image': 'Generate AI images',
        'POST /api/v1/generate-react': 'Generate React components',
        'POST /api/v1/extract-room-info': 'Extract game information'
      },
      rateLimit: '100 requests/hour, 1000 requests/day (configurable per key)',
      support: 'https://catsino.fun/api-support'
    },
    examples: {
      headers: {
        'X-API-Key': 'your_api_key_here',
        'Content-Type': 'application/json'
      },
      createRoom: {
        url: '/api/v1/create-room',
        method: 'POST',
        body: {
          bet_amount: 0.01,
          name: 'My Game',
          game_type: 1,
          connectedAccount: 'your_wallet_address',
          description: 'An exciting new game'
        }
      }
    }
  });
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
      'GET /api/v1/info',
      'POST /api/v1/create-room',
      'GET /health'
    ]
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