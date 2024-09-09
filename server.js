require('dotenv').config();

const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
const https = require('https');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const socketContoller = require('./socketController.js');
const session = require('express-session');
const app = express();

const server = app.listen(process.env.PORT, () =>
  console.log(`server running on port ${process.env.PORT}`)
);

const io = socketContoller.socketio(server, { origins: '*:*' });
app.use(function(req, res, next) {
  req.io = io;
  next();
});

var corsOptions = {
  origin: 'http://localhost:1337',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// app.use(cors());

const adminAuthRoutes = require('./routes/admin_auth.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const landingRoutes = require('./routes/landing.routes');
const uploadRoutes = require('./routes/upload.routes');
const gameRoutes = require('./routes/game.routes');
const itemRoutes = require('./routes/item.routes');
const loanRoutes = require('./routes/loan.routes');
const questionRoutes = require('./routes/admin_question.routes');
const brainGameTypeRoutes = require('./routes/admin_brain_game_type.route');
const stripeRoutes = require('./routes/stripe.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const systemSetting = require('./routes/settings.routes');
const helmet = require('helmet'); // for sec headers
const { OAuth2Client } = require('google-auth-library');
const bodyParser = require('body-parser');
const cronJob = require('./helper/util/createCronJob.js');
const creditScoreCron = require('./helper/util/creditScoreCron.js');
const notificationCron = require('./helper/util/notificationCron.js');
const interestCron = require('./helper/util/interestCron.js');
const rentCron = require('./helper/util/rentCron.js');
const callBotCron = require('./helper/util/callBotCron.js');
const withdrawalCron = require('./helper/util/withdrawalCron.js');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Initialize the cron job to periodically check for confirmations
creditScoreCron.checkOutstandingLoans(io);
rentCron.checkRentalPayments(io);
notificationCron.deleteNotifications();
callBotCron.callCronJobs(io);
withdrawalCron.resetWithdrawalLimits();
cronJob.checkConfirmations(io);
interestCron.updateRoomInterests(io);

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.json({ extended: false }));
app.use(fileUpload());
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  }
}));

// Google OAuth 2.0 token verification
async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  return payload;
}


// Login route
// Login route with user lookup based on extracted username and conditional creation
app.post('/auth/google', async (req, res) => {
  const token = req.body.token;
  try {
    // Verify the Google token
    const googleUser = await verify(token);

    // Extract relevant information from the payload
    const { sub: email, picture } = googleUser;

    // Extract the username by removing the "@gmail.com" part
    let username = email.split('@')[0];

    // Check if a user with this username exists in the database
    let user = await User.findOne({ username });

    if (!user) {
      // If no user with this username, create a new user account
      user = new User({
        username,  // Use the extracted username
        avatar: picture,
        // Add other fields as needed
      });
      
      // Save the new user to the database
      await user.save();
    }

    // Create a session or token for the user
    req.session.user = user;

    res.json({ success: true, user });
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});


// Connect Database
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      poolSize: 10,
    });
    console.log('*** MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Retry connection after a delay
    console.log('Retrying MongoDB connection in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Retry connecting
    await connectWithRetry();
  }
};

connectWithRetry();

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/item', itemRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/question', questionRoutes);
app.use('/api/brain_game_type', brainGameTypeRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', systemSetting);

// Set static folder
app.use(express.static('client/build'));

// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
// });
// Serve static assets in production
// if (process.env.NODE_ENV === 'production') {
//   // Set static folder
//   app.use(express.static('client/build'));

//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
//   });
// }

module.exports = { app, server, io };
