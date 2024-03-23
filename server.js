require('dotenv').config();

const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const https = require('https');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const socketContoller = require('./socketController.js');

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
const cronJob = require('./helper/util/createCronJob.js');
const creditScoreCron = require('./helper/util/creditScoreCron.js');
const notificationCron = require('./helper/util/notificationCron.js');
const rentCron = require('./helper/util/rentCron.js');
const rpsCron = require('./helper/util/rpsCron.js');
const rollCron = require('./helper/util/rollCron.js');
const bangCron = require('./helper/util/bangCron.js');
const withdrawalCron = require('./helper/util/withdrawalCron.js');
// Initialize the cron job to periodically check for confirmations
creditScoreCron.checkOutstandingLoans(io);
// rentCron.checkRentalPayments(io);
notificationCron.deleteNotifications();
// cronJob.checkConfirmations();
rpsCron.callBotBet(io);
// rollCron.rollCron();
// bangCron.bangCron();
withdrawalCron.resetWithdrawalLimits();

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(express.json({ extended: false }));
app.use(fileUpload());

// Connect Database
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
    poolSize: 10,
  })
  .then(() => console.log(`***mongodb connected`))
  .catch(err => console.log(err));

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
