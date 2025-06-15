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
              width: { xs: '95%', sm: '80%', md: '70%', lg: '60%' },
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '8px',
              background: '#262626',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              color: '#fff',
            }}
          >
            {/* Clean Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FontAwesomeIcon
                  icon={isBot ? faRobot : isSystem ? faCog : faUser}
                  style={{
                    color: isBot ? '#FF4444' : isSystem ? '#888' : '#ff0000',
                    fontSize: '14px'
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  {isBot ? 'Bot Profile' : isSystem ? 'Admin Profile' : 'Player Profile'}
                </Typography>
              </Box>
              <IconButton
                onClick={closeModal}
                size="small"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: '#fff'
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Clean Tabs */}
            <Box
              sx={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                textColor="inherit"
                variant="fullWidth"
                TabIndicatorProps={{
                  style: {
                    backgroundColor: '#ff0000',
                    height: '2px',
                  }
                }}
                sx={{
                  '& .MuiTab-root': { 
                    fontSize: '0.8rem', 
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'none',
                    minHeight: 40,
                    '&.Mui-selected': { color: '#fff' } 
                  },
                }}
              >
                <Tab label="Profile" />
                <Tab label="Statistics" />
              </Tabs>
            </Box>

            {/* Content */}
            <Box sx={{ padding: '16px' }}>
              {/* Tab 0: Profile */}
              {activeTab === 0 && (
                <Grid container spacing={2}>
                  {/* Left Column - Profile */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* Online Status */}
                      <Chip
                        label={isOnline ? 'ONLINE' : 'OFFLINE'}
                        size="small"
                        sx={{
                          mb: 1.5,
                          backgroundColor: isOnline ? '#4caf50' : '#666',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />

                      {/* Avatar */}
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          mb: 1.5,
                          border: '2px solid rgba(255, 0, 0, 0.3)',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={avatar || '/img/profile-thumbnail.svg'}
                          alt={username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>

                      {/* Username & Status */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          textAlign: 'center',
                          mb: 0.5,
                          fontSize: '1.1rem'
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
                          fontSize: '0.65rem',
                          height: 18,
                          mb: 2,
                        }}
                      />

                      {/* Key Metrics */}
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Box
                            sx={{
                              padding: '8px',
                              textAlign: 'center',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '4px',
                            }}
                          >
                            <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: '12px', marginBottom: 4 }} />
                            <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                              Joined
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                              {formatDate(dateJoined)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box
                            sx={{
                              padding: '8px',
                              textAlign: 'center',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '4px',
                            }}
                          >
                            <FontAwesomeIcon icon={faEye} style={{ fontSize: '12px', marginBottom: 4 }} />
                            <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                              Last Seen
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                              {formatDate(lastSeen)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>

                  {/* Right Column - Bio & Accounts */}
                  <Grid item xs={12} md={8}>
                    {/* Bio Section */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '0.85rem'
                        }}
                      >
                        About
                      </Typography>
                      <Box
                        sx={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px',
                          minHeight: '60px',
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
                              fontSize: '0.8rem',
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
                              fontSize: '0.8rem',
                              color: bio ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                              fontStyle: bio ? 'normal' : 'italic',
                              lineHeight: 1.4,
                            }}
                          >
                            {bio || 'No bio available'}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Accounts Section */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          fontSize: '0.85rem'
                        }}
                      >
                        Wallet Addresses
                      </Typography>
                      <Box
                        sx={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px',
                        }}
                      >
                        {accounts.length === 0 ? (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>
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
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                  }}
                                >
                                  {shortenAddress(acc)}
                                </Typography>
                                <Box>
                                  <IconButton
                                    size="small"
                                    onClick={() => navigator.clipboard.writeText(acc)}
                                    sx={{ p: 0.5 }}
                                  >
                                    <FileCopyIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                  <IconButton
                                    component="a"
                                    href={`https://solscan.io/account/${acc}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{ p: 0.5 }}
                                  >
                                    <LinkIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            ))}
                            {accounts.length > 3 && (
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', fontSize: '0.7rem' }}>
                                +{accounts.length - 3} more addresses
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Tab 1: Stats */}
              {activeTab === 1 && (
                <Box>
                  {/* Statistics Display */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ padding: '12px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
                        <FontAwesomeIcon icon={faCoins} style={{ fontSize: '1.2rem', marginBottom: 6, color: '#F59E0B' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: color || '#4A90E2', fontSize: '0.9rem' }}>
                          {gameProfit?.toFixed(2) || '0.00'} SOL
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                          Game Profit
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ padding: '12px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
                        <FontAwesomeIcon icon={faMoneyBill} style={{ fontSize: '1.2rem', marginBottom: 6, color: '#10B981' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: color || '#4A90E2', fontSize: '0.9rem' }}>
                          {totalWagered?.toFixed(2) || '0.00'} SOL
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                          Total Wagered
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ padding: '12px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
                        <FontAwesomeIcon icon={faCreditCard} style={{ fontSize: '1.2rem', marginBottom: 6, color: '#8B5CF6' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: color || '#4A90E2', fontSize: '0.9rem' }}>
                          {creditScore || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                          Credit Score
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ padding: '12px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
                        <FontAwesomeIcon icon={faCoins} style={{ fontSize: '1.2rem', marginBottom: 6, color: '#ff0000' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: color || '#4A90E2', fontSize: '0.9rem' }}>
                          {tradingProfit?.toFixed(2) || '0.00'} SOL
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                          Trading Profit
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ padding: '12px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
                        <FontAwesomeIcon icon={faMedal} style={{ fontSize: '1.2rem', marginBottom: 6, color: '#F59E0B' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: color || '#4A90E2', fontSize: '0.9rem' }}>
                          {gamePlayed || '0'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                          Games Played
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ padding: '12px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
                        <FontAwesomeIcon icon={faMoneyBill} style={{ fontSize: '1.2rem', marginBottom: 6, color: '#06B6D4' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: color || '#4A90E2', fontSize: '0.9rem' }}>
                          {totalTraded?.toFixed(2) || '0.00'} SOL
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                          Total Traded
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Spending Status */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.85rem' }}>
                      Spending Analysis
                    </Typography>
                    <Box 
                      sx={{ 
                        padding: '12px', 
                        background: 'rgba(255, 255, 255, 0.02)', 
                        border: '1px solid rgba(255, 255, 255, 0.05)', 
                        borderRadius: '4px' 
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                          {title}
                        </Typography>
                        <Chip
                          label={`${progressValue}%`}
                          size="small"
                          sx={{
                            backgroundColor: color || '#4A90E2',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            height: 18,
                          }}
                        />
                      </Box>
                      <Box sx={{
                        width: '100%',
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        mb: 1
                      }}>
                        <Box sx={{
                          ...barStyle,
                          height: '100%',
                          borderRadius: 3,
                          backgroundColor: color || '#4A90E2',
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                        {spendingMessage}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Clean Footer */}
            {userInfo._id !== creatorId && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '12px 16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleOpenChat}
                  sx={{
                    fontWeight: 600,
                    px: 2,
                    py: 0.75,
                    borderRadius: 1,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                  }}
                  startIcon={<FontAwesomeIcon icon={faEnvelope} style={{ fontSize: '12px' }} />}
                >
                  Send Message
                </Button>
              </Box>
            )}
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