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

// Log environment variables at startup to verify configuration
console.log('Environment Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI ? '[REDACTED]' : undefined, // Avoid logging sensitive data
  REDIS_URL: process.env.REDIS_URL ? '[REDACTED]' : undefined,
  SESSION_SECRET: process.env.SESSION_SECRET ? '[REDACTED]' : undefined,
});

// -------------------- Redis Client Setup --------------------
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379', // Use env variable or default
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err.message, err.stack));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('Redis connection successful');
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message, err.stack);
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

// Log Socket.io connections and disconnections
io.on('connection', (socket) => {
  console.log(`Socket.io client connected: ${socket.id}, origin: ${socket.handshake.headers.origin}`);
  socket.on('disconnect', (reason) => {
    console.log(`Socket.io client disconnected: ${socket.id}, reason: ${reason}`);
  });
  socket.on('error', (err) => {
    console.error(`Socket.io error for client ${socket.id}:`, err.message, err.stack);
  });
});

setTimeout(() => {
  console.log('Starting callCronJobs');
  callCronJob.callCronJobs(io);
}, 500);
setTimeout(() => {
  console.log('Starting checkSubscriptionPayments');
  eliteCron.checkSubscriptionPayments(io);
}, 3000);
setTimeout(() => {
  console.log('Starting checkConfirmations');
  cronJob.checkConfirmations();
}, 5000);
setTimeout(() => {
  console.log('Starting updateRoomInterests');
  interestCron.updateRoomInterests(io);
}, 11000);

// Attach io instance to each request for easy access
app.use((req, res, next) => {
  req.io = io;
  next();
});

// -------------------- CORS Configuration --------------------
// Log CORS decisions for debugging
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000', 
      'https://catsino.fun',
    ];
    
    console.log(`CORS check for origin: ${origin || 'No origin'}`);
    if (!origin || allowedOrigins.includes(origin)) {
      console.log(`CORS allowed for origin: ${origin || 'No origin'}`);
      callback(null, true);
    } else {
      console.log(`CORS allowed for public API access: ${origin}`);
      callback(null, true); // Allow all for API access
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
};
app.use(cors(corsOptions));

const compression = require('compression');
app.use(compression());

// -------------------- Middleware --------------------
// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

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
    console.log('Attempting MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000, // Increased timeout
    });
    console.log('*** MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message, error.stack);
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

// Log route registration
console.log('Registering API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/item', itemRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', systemSettingRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/v1', publicApiRoutes);

// Health check endpoint for API monitoring
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    // Add database and Redis status
    mongoConnected: mongoose.connection.readyState === 1,
    redisConnected: redisClient.isOpen,
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  console.log('API docs requested');
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
        'POST /api/v1/extract-room-info': 'Extract game information',
      },
      rateLimit: '100 requests/hour, 1000 requests/day (configurable per key)',
      support: 'https://catsino.fun/api-support',
    },
    examples: {
      headers: {
        'X-API-Key': 'your_api_key_here',
        'Content-Type': 'application/json',
      },
      createRoom: {
        url: '/api/v1/create-room',
        method: 'POST',
        body: {
          bet_amount: 0.01,
          name: 'My Game',
          game_type: 1,
          connectedAccount: 'your_wallet_address',
          description: 'An exciting new game',
        },
      },
    },
  });
});

// -------------------- Static Files --------------------
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  console.log('Serving static files for production');
  app.use(express.static(path.resolve(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    console.log(`Serving index.html for ${req.url}`);
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// -------------------- Error Handling --------------------
// Enhanced error handling for API routes
app.use((err, req, res, next) => {
  console.error(`Error in ${req.method} ${req.url}:`, err.message, err.stack);
  
  // API routes get JSON error responses
  if (req.path.startsWith('/api/')) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error',
      ...(isDevelopment && { stack: err.stack }),
    });
  } else {
    // Non-API routes get HTML error responses
    res.status(500).send('Something went wrong!');
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`404 for ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    available_endpoints: [
      'GET /api/docs',
      'GET /api/v1/info',
      'POST /api/v1/create-room',
      'GET /health',
    ],
  });
});

// -------------------- Graceful Shutdown --------------------
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    console.log('Server closed');
  });
  try {
    await redisClient.quit();
    console.log('Redis connection closed');
  } catch (err) {
    console.error('Error closing Redis:', err.message);
  }
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB:', err.message);
  }
  process.exit(0);
});

// -------------------- Exports --------------------
module.exports = { app, server, io };