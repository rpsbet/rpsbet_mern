import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  Box,
  Button,
  Tabs,
  Tab,
  IconButton,
  useMediaQuery,
  Grid,
  Chip,
  Typography,
  ThemeProvider,
  CircularProgress,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import { FileCopy as FileCopyIcon, Info as InfoIcon, Link as LinkIcon, Close as CloseIcon } from '@mui/icons-material';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBill,
  faUser,
  faCog,
  faEnvelope,
  faCoins,
  faRobot,
  faMedal,
  faCalendarAlt,
  faEye,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import TipModal from './TipModal';
import axios from '../../util/Api';

// Redux actions
import { setUserInfo } from '../../redux/Auth/user.actions';
import { setCurrentOfferTargetInfo } from '../../redux/Loan/loan.action';
import { openOfferLoanModal, errorMsgBar, successMsgBar } from '../../redux/Notification/notification.actions';
import { setChatRoomInfo, addNewTransaction, setSolanaBalance } from '../../redux/Logic/logic.actions';
import { acGetCustomerInfo, getSpendingHabit } from '../../redux/Customer/customer.action';

import Avatar from '../../components/Avatar';
// import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';
import { getCustomTheme } from '../../config/theme';

function PlayerModal({ modalIsOpen, closeModal, selectedCreator }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const userInfo = useSelector((state) => state.auth.user);
  const balance = useSelector((state) => state.logic.solanaBalance);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const isLowGraphics = useSelector((state) => state.auth.isLowGraphics);
  const onlineUserList = useSelector((state) => state.logic.onlineUserList);

  // Local state
  const [creatorId, setCreatorId] = useState(selectedCreator || '');
  const [elite, setElite] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [accessory, setAccessory] = useState('');
  const [bio, setBio] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [rank, setRank] = useState('');
  const [dateJoined, setDateJoined] = useState('');
  const [creditScore, setCreditScore] = useState(0);
  const [lastSeen, setLastSeen] = useState('');
  const [status, setStatus] = useState('');
  const [gameLogList, setGameLogList] = useState([]);
  const [gameProfit, setGameProfit] = useState(0);
  const [gamePlayed, setGamePlayed] = useState(0);
  const [totalWagered, setTotalWagered] = useState(0);
  const [totalTraded, setTotalTraded] = useState(0);
  const [tradingProfit, setTradingProfit] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Effects
  useEffect(() => {
    setCreatorId(selectedCreator);
    fetchUserData(selectedCreator);
  }, [selectedCreator]);


  const fetchUserData = async (userId) => {
    if (!userId) return;
    const data = await dispatch(getSpendingHabit(userId));
    if (data) {
      setStatus(data.status);
    }
    try {
      const userData = await dispatch(acGetCustomerInfo(userId));
      if (userData) {
        setUsername(userData.username);
        setAvatar(userData.avatar);
        setElite(userData.elite);
        setAccounts(userData.accounts);
        setAccessory(userData.accessory);
        setBio(userData.bio || '');
        setRank(userData.totalWagered);
        setDateJoined(userData.created_at);
        setCreditScore(userData.credit_score);
        setLastSeen(userData.last_seen);
        setGamePlayed(userData.gamePlayed || 0);
        setTotalWagered(userData.totalWagered || 0);
        setTotalTraded(userData.totalTraded || 0);
        setTradingProfit(userData.tradingProfit || 0);
        setGameProfit(userData.gameProfit || 0);

        dispatch(
          setCurrentOfferTargetInfo({
            avatar: userData.avatar,
            _id: userId,
            username: userData.username,
            elite: userData.elite,
            accessory: userData.accessory,
            totalWagered: userData.totalWagered,
            isLender: true,
          })
        );
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // Helper to get status details
  const getStatusDetails = (st) => {
    switch (st) {
      case 'very good':
        return { color: 'rgb(118 221 119)', title: 'JEWISH DJEDI', message: 'Greed is fueling their growth!', progress: 100 };
      case 'good':
        return { color: 'rgb(3 221 255)', title: 'SEASONED CZAR', message: 'Spending habits are commendable.', progress: 80 };
      case 'average':
        return { color: '#ffc107', title: 'UN innenCONSCIOUS COMPETENT', message: 'Doing fine, but the bitch is comfortable.', progress: 60 };
      case 'bad':
        return { color: '#fd7e14', title: 'PEASANT PUPPET', message: 'They need to revisit their spending strategy.', progress: 40 };
      case 'very bad':
        return { color: '#ff0000', title: 'MISERABLE MULE', message: 'Spending habits make them miserable.', progress: 20 };
      default:
        return { color: '#6c757d', title: 'Unknown', message: 'Unable to determine spending habits.', progress: 0 };
    }
  };

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { color, title, message: spendingMessage, progress: progressValue } = getStatusDetails(status);
  const barStyle = { width: `${progressValue}%`, backgroundColor: progressValue <= 50 ? 'yellow' : '#FF0000' };

  const isOnline = onlineUserList.includes(selectedCreator);
  const isBot = username.toUpperCase().includes('BOT');
  const systemUsernames = ['pimpedpistols', 'GIGACHAD', 'KEKW', 'smellyfingers', 'SUPPORT', '69', 'OFFICIALRPSGAME', 'SYSTEM', 'WHALE WATCHERS', 'NO BROKIES'];
  const isSystem = systemUsernames.includes(username);
  const isBioUrl = /^https?:\/\//.test(bio);
  const shortenAddress = (address) => (address ? address.slice(0, 8) + '...' + address.slice(-8) : '');

  // Tip Modal Logic
  const handleTip = () => setIsTipModalOpen(true);
  const handleCloseTipModal = () => setIsTipModalOpen(false);
  const handleTipAmountChange = (e) => setTipAmount(e.target.value);
  const handleMessageChange = (e) => setMessage(e.target.value);

  const handleSendTip = async () => {
    try {
      const tipAmtNum = parseFloat(tipAmount || 0);
      if (isNaN(tipAmtNum) || tipAmtNum <= 0) {
        dispatch(errorMsgBar('Please enter a valid SOL amount.'));
        return;
      }
      if (tipAmtNum > balance) {
        dispatch(errorMsgBar('Insufficient Balance'));
        return;
      }
      if (!window.solana || !window.solana.isConnected) {
        dispatch(errorMsgBar('Wallet not connected. Please connect your wallet.'));
        return;
      }

      setIsLoading(true);

      // Get the connected wallet address
      let senderPubkey;
      try {
        senderPubkey = new PublicKey(await window.solana.publicKey.toString());
      } catch (e) {
        console.error('Failed to get sender wallet:', e.message);
        setIsLoading(false);
        dispatch(errorMsgBar('Failed to access wallet address'));
        return;
      }

      // Request prepared transaction from backend
      const prepareResponse = await axios.post('/game/tip', {
        amount: tipAmtNum,
        addressTo: creatorId,
        message,
        senderWallet: senderPubkey.toBase58(),
        prepare: true,
      });

      if (!prepareResponse.data.success || !prepareResponse.data.transaction) {
        console.error('Prepare response failed:', prepareResponse.data);
        setIsLoading(false);
        dispatch(errorMsgBar(prepareResponse.data.message || 'Failed to prepare transaction'));
        return;
      }

      // Initialize Solana connection
      const connection = new Connection(process.env.REACT_APP_PROVIDER_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');

      // Deserialize transaction
      const transaction = Transaction.from(Buffer.from(prepareResponse.data.transaction, 'base64'));

      // Validate sender wallet
      if (transaction.feePayer.toBase58() !== senderPubkey.toBase58()) {
        console.error('Wallet mismatch:', {
          transactionFeePayer: transaction.feePayer.toBase58(),
          connectedWallet: senderPubkey.toBase58(),
        });
        setIsLoading(false);
        dispatch(errorMsgBar('Connected wallet does not match transaction sender'));
        return;
      }

      const signedTransaction = await window.solana.signAndSendTransaction(transaction);
      const txtHash = signedTransaction.signature;

      await connection.confirmTransaction(
        {
          signature: txtHash,
          blockhash: prepareResponse.data.blockhash,
          lastValidBlockHeight: prepareResponse.data.lastValidBlockHeight,
        },
        'confirmed'
      );

      // Notify backend of successful tip
      const result = await axios.post('/game/tip', {
        amount: tipAmtNum,
        addressTo: creatorId,
        message,
        txtHash,
      });

      if (result.data.success) {
        dispatch(successMsgBar(result.data.message));
        dispatch(addNewTransaction(result.data.newTransaction));

        // Update Solana balance
        try {
          const solBalLamports = await connection.getBalance(senderPubkey);
          const solanaBalance = solBalLamports / LAMPORTS_PER_SOL;
          dispatch(setSolanaBalance({ solanaBalance }));
        } catch (balanceError) {
          console.error('Failed to fetch Solana balance:', balanceError);
        }

        setIsLoading(false);
        closeModal();
      } else {
        setIsLoading(false);
        dispatch(errorMsgBar(result.data.message || 'Failed to record tip'));
      }
    } catch (err) {
      setIsLoading(false);
      let errorMessage = 'Failed to process transaction';
      if (err.message.includes('blockhash')) {
        errorMessage = 'Invalid or expired blockhash';
      } else if (err.message.includes('signature')) {
        errorMessage = 'Transaction signature verification failed';
      } else if (err.message.includes('lamports')) {
        errorMessage = 'Insufficient funds for transaction';
      } else if (err.message.includes('rejected')) {
        errorMessage = 'Transaction rejected by wallet';
      } else {
        errorMessage = err.message || 'Failed to process transaction';
      }
      dispatch(errorMsgBar(errorMessage));
      console.error('Error sending tip:', err.message, err.stack);
    }
  };

  // Chat Logic
  const handleOpenChat = () => {
    const chatRoom = { _id: creatorId, username, avatar, accessory, rank, chatLogs: [] };
    dispatch(setChatRoomInfo(chatRoom));
    navigate(`/chat/${creatorId}`);
    closeModal();
  };

  // Tabs
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <Modal open={modalIsOpen || false} onClose={closeModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              maxHeight: '90vh',
              width: { xs: '95%', sm: '80%', md: '70%', lg: '60%' },
              maxWidth: '1200px',
              overflowY: 'auto',
              borderRadius: 2,
              boxShadow: 24,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '@supports not (backdrop-filter: blur(10px))': {
                background: 'rgba(0, 0, 0, 0.85)',
              },
            }}
          >
            <Paper
              elevation={3}
              sx={{
                background: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 2,
                color: isDarkMode ? '#fff' : '#333',
              }}
            >
              {/* Compact Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(240, 240, 240, 0.9)',
                  borderRadius: '8px 8px 0 0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <FontAwesomeIcon
                    icon={isBot ? faRobot : isSystem ? faCog : faUser}
                    style={{
                      color: isBot ? '#FF4444' : isSystem ? '#888' : '#FF0000',
                      fontSize: '1.1rem'
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: isDarkMode ? '#fff' : '#1a1a1a',
                      fontSize: '1.1rem'
                    }}
                  >
                    {isBot ? 'Bot Profile' : isSystem ? 'Admin Profile' : 'Player Profile'}
                  </Typography>
                </Box>
                <IconButton
                  onClick={closeModal}
                  size="small"
                  sx={{
                    color: isDarkMode ? '#ccc' : '#666',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      color: isDarkMode ? '#fff' : '#333'
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Compact Tabs */}
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                textColor="error"
                indicatorColor="error"
                variant="fullWidth"
                sx={{
                  '& .MuiTabs-indicator': { backgroundColor: '#ff0000', height: '3px' },
                  '& .MuiTab-root': { 
                    fontSize: '1rem', 
                    fontWeight: 500,
                    color: isDarkMode ? '#ccc' : '#555',
                    '&.Mui-selected': { color: '#ff0000' } 
                  },
                }}
              >
                <Tab label="Profile" />
                <Tab label="Statistics" />
              </Tabs>

              {/* Compact Content */}
              <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                {/* Tab 0: Profile */}
                {activeTab === 0 && (
                  <Grid container spacing={2.5}>
                    {/* Left Column - Compact Profile */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Compact Online Status */}
                        <Chip
                          label={isOnline ? 'ONLINE' : 'OFFLINE'}
                          size="small"
                          sx={{
                            mb: 2,
                            backgroundColor: isOnline ? '#4caf50' : '#',
                            color: 'white',
                            fontWeight: 600,
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            '&::before': {
                              content: '""',
                              display: 'inline-block',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: 'currentColor',
                              marginRight: 0.5,
                            }
                          }}
                        />

                        {/* Compact Avatar */}
                        <Box
                          sx={{
                            width: { xs: 120, sm: 140, md: 160 },
                            height: { xs: 120, sm: 140, md: 160 },
                            position: 'relative',
                            mb: 2,
                            borderRadius: '50%',
                            padding: '2px',
                            background: `linear-gradient(45deg, #ff0000, transparent)`,
                            boxShadow: `0 4px 12px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                          }}
                        >
                          <img
                            src={avatar || '/img/profile-thumbnail.svg'}
                            accessory={accessory}
                            user_id={creatorId}
                            username={username}
                            elite={elite}
                            rank={rank}
                            alt={username}
                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                          />
                        </Box>

                        {/* Compact Username & Status */}
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            textAlign: 'center',
                            mb: 1,
                            color: isDarkMode ? '#fff' : '#1a1a1a',
                            fontSize: { xs: '1.3rem', md: '1.5rem' }
                          }}
                        >
                          {username}
                        </Typography>

                        <Chip
                          label={title}
                          size="small"
                          sx={{
                            backgroundColor: '#ff0000',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            mb: 2,
                          }}
                        />

                        {/* Compact Key Metrics */}
                        <Grid container spacing={1} sx={{ mt: 0.5 }}>
                          <Grid item xs={6}>
                            <Card
                              variant="outlined"
                              sx={{
                                p: 1,
                                textAlign: 'center',
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                              }}
                            >
                              <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '0.9rem', marginBottom: 4 }} />
                              <Typography variant="caption" display="block" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                Joined
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                {formatDate(dateJoined)}
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6}>
                            <Card
                              variant="outlined"
                              sx={{
                                p: 1,
                                textAlign: 'center',
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                              }}
                            >
                              <FontAwesomeIcon icon={faEye} style={{ fontSize: '0.9rem', marginBottom: 4 }} />
                              <Typography variant="caption" display="block" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                Last Seen
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                {formatDate(lastSeen)}
                              </Typography>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>

                    {/* Right Column - Compact Bio & Accounts */}
                    <Grid item xs={12} md={8}>
                      {/* Compact Bio Section */}
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            mb: 1.5,
                            color: isDarkMode ? '#fff' : '#1a1a1a',
                            fontSize: '1rem'
                          }}
                        >
                          About
                        </Typography>
                        <Card
                          variant="outlined"
                          sx={{
                            p: 2,
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.8)',
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                            minHeight: '80px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {isBioUrl ? (
                            <a
                              href={bio}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '0.95rem',
                                color: color || '#4A90E2',
                                textDecoration: 'none',
                                fontWeight: 500,
                              }}
                            >
                              {bio}
                            </a>
                          ) : (
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.95rem',
                                color: isDarkMode ? '#ddd' : '#444',
                                fontStyle: bio ? 'normal' : 'italic',
                                lineHeight: 1.4,
                              }}
                            >
                              {bio || 'No bio available'}
                            </Typography>
                          )}
                        </Card>
                      </Box>

                      {/* Compact Accounts Section */}
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            mb: 1.5,
                            color: isDarkMode ? '#fff' : '#1a1a1a',
                            fontSize: '1rem'
                          }}
                        >
                          Wallet Addresses
                        </Typography>
                        <Card
                          variant="outlined"
                          sx={{
                            p: 2,
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.8)',
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                          }}
                        >
                          {accounts.length === 0 ? (
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                              No associated accounts
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {accounts.slice(0, 3).map((acc, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 1,
                                    borderRadius: 1,
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    fontSize: '0.85rem',
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontFamily: 'monospace',
                                      fontSize: '0.8rem',
                                      color: isDarkMode ? '#ccc' : '#555',
                                    }}
                                  >
                                    {shortenAddress(acc)}
                                  </Typography>
                                  <Box>
                                    <IconButton
                                      size="small"
                                      onClick={() => navigator.clipboard.writeText(acc)}
                                      sx={{ ml: 0.5, p: 0.5 }}
                                    >
                                      <FileCopyIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      component="a"
                                      href={`https://solscan.io/account/${acc}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      size="small"
                                      sx={{ p: 0.5 }}
                                    >
                                      <LinkIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              ))}
                              {accounts.length > 3 && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', mt: 0.5 }}>
                                  +{accounts.length - 3} more addresses
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Card>
                      </Box>
                    </Grid>
                  </Grid>
                )}

                {/* Tab 1: Stats */}
                {activeTab === 1 && (
                  <Box sx={{ mt: 1 }}>
                    {/* Compact Statistics Display */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <FontAwesomeIcon icon={faCoins} style={{ fontSize: '1.5rem', marginBottom: 8, color: '#F59E0B' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: color || '#4A90E2' }}>
                            {gameProfit?.toFixed(2) || '0.00'} SOL
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Game Profit
                          </Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <FontAwesomeIcon icon={faMoneyBill} style={{ fontSize: '1.5rem', marginBottom: 8, color: '#10B981' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: color || '#4A90E2' }}>
                            {totalWagered?.toFixed(2) || '0.00'} SOL
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Wagered
                          </Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '1.5rem', marginBottom: 8, color: '#8B5CF6' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: color || '#4A90E2' }}>
                            {creditScore || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Credit Score
                          </Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <FontAwesomeIcon icon={faCoins} style={{ fontSize: '1.5rem', marginBottom: 8, color: '#ff0000' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: color || '#4A90E2' }}>
                            {tradingProfit?.toFixed(2) || '0.00'} SOL
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Trading Profit
                          </Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <FontAwesomeIcon icon={faMedal} style={{ fontSize: '1.5rem', marginBottom: 8, color: '#F59E0B' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: color || '#4A90E2' }}>
                            {gamePlayed || '0'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Games Played
                          </Typography>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <FontAwesomeIcon icon={faMoneyBill} style={{ fontSize: '1.5rem', marginBottom: 8, color: '#06B6D4' }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: color || '#4A90E2' }}>
                            {totalTraded?.toFixed(2) || '0.00'} SOL
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total Traded
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* Spending Status */}
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Spending Analysis
                      </Typography>
                      <Card variant="outlined" sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {title}
                          </Typography>
                          <Chip
                            label={`${progressValue}%`}
                            size="small"
                            sx={{
                              backgroundColor: color || '#4A90E2',
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        <Box sx={{
                          width: '100%',
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          mb: 2
                        }}>
                          <Box sx={{
                            ...barStyle,
                            height: '100%',
                            borderRadius: 4,
                            backgroundColor: color || '#4A90E2',
                            transition: 'width 0.3s ease'
                          }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {spendingMessage}
                        </Typography>
                      </Card>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Compact Footer */}
              {userInfo._id !== creatorId && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    p: 2,
                    borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    background: isDarkMode
                      ? 'rgba(55, 55, 55, 0.4)'
                      : 'rgba(248, 250, 252, 0.6)',
                    borderRadius: '0 0 12px 12px',
                  }}
                >
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleOpenChat}
                    sx={{
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                    }}
                    startIcon={<FontAwesomeIcon icon={faEnvelope} />}
                  >
                    Send Message
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>
        </Modal>
      </ThemeProvider>

      <TipModal
        isTipModalOpen={isTipModalOpen}
        handleCloseTipModal={handleCloseTipModal}
        isDarkMode={isDarkMode}
        isLoading={isLoading}
        theme={theme}
        closeModal={closeModal}
        handleTipAmountChange={handleTipAmountChange}
        tipAmount={tipAmount}
        handleMessageChange={handleMessageChange}
        message={message}
        balance={balance}
        solPrice={solPrice}
        handleSendTip={handleSendTip}
      />
    </>
  );
}

export default PlayerModal;