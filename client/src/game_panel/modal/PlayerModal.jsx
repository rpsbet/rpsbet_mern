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
  Divider,
  Paper,
  Avatar as MuiAvatar,
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
import { queryProducts } from '../../redux/Item/item.action';
import { convertToCurrency } from '../../util/conversion';

import Avatar from '../../components/Avatar';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';
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
  const productArray = useSelector((state) => state.itemReducer.productArray) || [];

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
    // Load user data when selected creator changes
    fetchUserData(selectedCreator);
  }, [selectedCreator]);

  useEffect(() => {
    if (creatorId) {
      dispatch(queryProducts(127, 1, creatorId));
    }
  }, [creatorId, dispatch]);

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
        return { color: '#dc3545', title: 'MISERABLE MULE', message: 'Spending habits make them miserable.', progress: 20 };
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
  const shortenAddress = (address) => (address ? address.slice(0, 12) + '...' + address.slice(-12) : '');

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

      // 1. Request prepared transaction from backend
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

      // 2. Initialize Solana connection
      const connection = new Connection(process.env.REACT_APP_PROVIDER_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');

      // 3. Deserialize transaction
      const transaction = Transaction.from(Buffer.from(prepareResponse.data.transaction, 'base64'));

      // 4. Validate sender wallet
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

      // 7. Notify backend of successful tip
      const result = await axios.post('/game/tip', {
        amount: tipAmtNum,
        addressTo: creatorId,
        message,
        txtHash,
      });

      if (result.data.success) {
        dispatch(successMsgBar(result.data.message));
        dispatch(addNewTransaction(result.data.newTransaction));

        // 8. Update Solana balance
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
              maxWidth: '900px',
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
              }}
            >
              {/* Modal Header */}
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
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#333' }}>
                  {isBot ? (
                    <>
                      <FontAwesomeIcon icon={faRobot} style={{ color: '#FF0000', marginRight: 12 }} />
                      Bot Profile
                    </>
                  ) : isSystem ? (
                    <>
                      <FontAwesomeIcon icon={faCog} style={{ color: 'grey', marginRight: 12 }} />
                      ADMIN Profile
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faUser} style={{ marginRight: 12 }} />
                      Player Profile
                    </>
                  )}
                </Typography>
                <IconButton
                  onClick={closeModal}
                  sx={{
                    color: isDarkMode ? '#fff' : '#333',
                    '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                textColor="error"
                indicatorColor="error"
                variant="fullWidth"
                sx={{
                  '& .MuiTabs-indicator': { backgroundColor: 'error.main', height: '3px' },
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

              {/* Tab Content */}
              <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                {/* Tab 0: Profile & Inventory */}
                {activeTab === 0 && (
                  <Grid container spacing={3}>
                    {/* Left Column - Profile Image & Status */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Online Status Badge */}
                        <Box
                          sx={{
                            mb: 2,
                            p: 1,
                            borderRadius: '20px',
                            backgroundColor: isOnline ? 'rgba(46, 204, 64, 0.2)' : 'rgba(255, 65, 54, 0.2)',
                            border: `1px solid ${isOnline ? 'rgba(46, 204, 64, 0.5)' : 'rgba(255, 65, 54, 0.5)'}`,
                            alignSelf: 'center',
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              color: isOnline ? '#2ecc40' : '#ff4136',
                              fontWeight: 500,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: isOnline ? '#2ecc40' : '#ff4136',
                                mr: 1,
                              }}
                            />
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                          </Typography>
                        </Box>

                        {/* Avatar Box - Larger Size */}
                        <Box
                          sx={{
                            width: { xs: 180, sm: 220, md: 240 },
                            height: { xs: 180, sm: 220, md: 240 },
                            position: 'relative',
                            mb: 3,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: '50%',
                            padding: '4px',
                            background: `linear-gradient(45deg, ${color || '#ff0000'}, transparent)`,
                            boxShadow: `0 0 15px 5px ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                          }}
                        >
                          <Avatar
                            src={avatar || '/img/profile-thumbnail.svg'}
                            accessory={accessory}
                            user_id={creatorId}
                            username={username}
                            elite={elite}
                            rank={rank}
                            alt={username}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </Box>

                        {/* Username */}
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            textAlign: 'center',
                            mb: 2,
                            color: isDarkMode ? '#fff' : '#333',
                          }}
                        >
                          {username}
                        </Typography>

                        {/* Status/Title */}
                        <Chip
                          label={title}
                          sx={{
                            backgroundColor: color || 'primary.main',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            mb: 3,
                            padding: '20px 10px',
                          }}
                        />

                        {/* Key Metrics */}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <FontAwesomeIcon icon={faCalendarAlt} style={{ marginBottom: 8, fontSize: '1.2rem' }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Joined
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {formatDate(dateJoined)}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <FontAwesomeIcon icon={faEye} style={{ marginBottom: 8, fontSize: '1.2rem' }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Last Seen
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {formatDate(lastSeen)}
                              </Typography>
                            </Box>
                          </Grid>
                          {/* <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <FontAwesomeIcon icon={faMedal} style={{ marginBottom: 8, fontSize: '1.2rem' }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Rank
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {rank || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid> */}
                          {/* <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center' }}>
                              <FontAwesomeIcon icon={faCreditCard} style={{ marginBottom: 8, fontSize: '1.2rem' }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Credit Score
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {creditScore || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid> */}
                        </Grid>
                      </Box>
                    </Grid>

                    {/* Right Column - Bio & Accounts */}
                    <Grid item xs={12} md={8}>
                      {/* Bio Section */}
                      <Box sx={{ mb: 4 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 2,
                            pb: 1,
                            borderBottom: '2px solid',
                            borderColor: color || 'error.main',
                          }}
                        >
                          About
                        </Typography>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                            borderRadius: 2,
                            minHeight: '120px',
                          }}
                        >
                          {isBioUrl ? (
                            <a
                              href={bio}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '1.1rem',
                                color: isDarkMode ? '#e5e5e5' : '#333',
                                textDecoration: 'none',
                                fontWeight: 500,
                              }}
                            >
                              {bio}
                            </a>
                          ) : (
                            <Typography
                              variant="body1"
                              sx={{
                                fontSize: '1.1rem',
                                color: isDarkMode ? '#e5e5e5' : '#333',
                                fontStyle: bio ? 'normal' : 'italic',
                                fontWeight: 500,
                              }}
                            >
                              {bio || 'No bio available'}
                            </Typography>
                          )}
                        </Paper>
                      </Box>

                      {/* Accounts Section */}
                      <Box sx={{ mb: 4 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 2,
                            pb: 1,
                            borderBottom: '2px solid',
                            borderColor: color || 'error.main',
                          }}
                        >
                          Associated Addresses
                        </Typography>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                            borderRadius: 2,
                          }}
                        >
                          {accounts.length === 0 ? (
                            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                              No associated accounts found
                            </Typography>
                          ) : (
                            <Grid container spacing={2}>
                              {accounts.map((acc, index) => {
                                const displayed = isMobile ? shortenAddress(acc) : acc;
                                return (
                                  <Grid item xs={12} key={index}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1.5,
                                        borderRadius: 1,
                                        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                        '&:hover': {
                                          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)',
                                        },
                                      }}
                                    >
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontFamily: 'monospace',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {displayed}
                                      </Typography>
                                      <Box>
                                        <IconButton
                                          sx={{ ml: 1 }}
                                          onClick={() => navigator.clipboard.writeText(acc)}
                                          size="small"
                                          color="primary"
                                        >
                                          <FileCopyIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          component="a"
                                          href={`https://solscan.io/account/${acc}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          size="small"
                                          color="primary"
                                        >
                                          <LinkIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          )}
                        </Paper>
                      </Box>
                    </Grid>
                  </Grid>
                )}

                {/* Tab 1: Stats */}
                {activeTab === 1 && (
                  <Box sx={{ mt: 2 }}>
                    <StatisticsForm
                      username={username}
                      title={title}
                      barStyle={barStyle}
                      color={color}
                      solPrice={solPrice}
                      message={spendingMessage}
                      dateJoined={dateJoined}
                      last_seen={lastSeen}
                      creditScore={creditScore}
                      gameLogList={gameLogList}
                      gameProfit={gameProfit}
                      gamePlayed={gamePlayed}
                      totalWagered={totalWagered}
                      totalTraded={totalTraded}
                      tradingProfit={tradingProfit}
                      rank={rank}
                    />
                  </Box>
                )}
              </Box>

              {/* Footer */}
              {userInfo._id !== creatorId && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                    p: 3,
                    borderTop: '1px solid',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(240, 240, 240, 0.9)',
                    borderRadius: '0 0 8px 8px',
                  }}
                >
                  <Button color="error" variant="outlined" onClick={handleOpenChat}>
                    DM&nbsp;<FontAwesomeIcon icon={faEnvelope} />
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