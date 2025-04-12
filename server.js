require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const socketController = require('./socketController.js');
const helmet = require('helmet'); // Security headers middleware
const bodyParser = require('body-parser');
const cronJob = require('./helper/util/createCronJob.js');
const creditScoreCron = require('./helper/util/creditScoreCron.js');
const rentCron = require('./helper/util/rentCron.js');
const callCronJob = require('./helper/util/callBotCron.js');
const withdrawalCron = require('./helper/util/withdrawalCron.js');
const interestCron = require('./helper/util/interestCron.js');

const app = express();

// -------------------- Server Setup --------------------
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// -------------------- Socket.io Setup --------------------
const io = socketController.socketio(server, {
  cors: {
    origin: 'http://localhost:3000', // Allow requests from your frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
    credentials: true,
  },
  transports: ['websocket'],
});

setTimeout(() => callCronJob.callCronJobs(io), 500);
setTimeout(() => rentCron.checkRentalPayments(io), 3000);
setTimeout(() => cronJob.checkConfirmations(), 5000);
setTimeout(() => creditScoreCron.checkOutstandingLoans(io), 7000); 
setTimeout(() => withdrawalCron.resetWithdrawalLimits(), 9000);
setTimeout(() => interestCron.updateRoomInterests(io), 11000);

// Attach io instance to each request for easy access
app.use((req, res, next) => {
  req.io = io;
  next();
});

// -------------------- CORS Configuration --------------------
const corsOptions = {
  origin: 'http://localhost:3000', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  credentials: true, // Allow cookies and credentials
};

app.use(cors(corsOptions));

const compression = require('compression');
app.use(compression());

// -------------------- Middleware --------------------
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(fileUpload());

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
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const landingRoutes = require('./routes/landing.routes');
const gameRoutes = require('./routes/game.routes');
const itemRoutes = require('./routes/item.routes');
const loanRoutes = require('./routes/loan.routes');
const stripeRoutes = require('./routes/stripe.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const systemSettingRoutes = require('./routes/settings.routes');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/item', itemRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', systemSettingRoutes);

// -------------------- Static Files --------------------
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// -------------------- Error Handling --------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// -------------------- Exports --------------------
module.exports = { app, server, io };