import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import { FileCopy as FileCopyIcon, Info as InfoIcon, Link as LinkIcon, Close as CloseIcon } from '@mui/icons-material';
import LoadingOverlay from 'react-loading-overlay';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBill,
  faUser,
  faCog,
  faEnvelope,
  faCoins,
  faRobot,
} from '@fortawesome/free-solid-svg-icons';
import TipModal from './TipModal';
import axios from '../../util/Api';

// Redux actions
import { setUserInfo } from '../../redux/Auth/user.actions';
import { setCurrentOfferTargetInfo } from '../../redux/Loan/loan.action';
import { openOfferLoanModal, errorMsgBar } from '../../redux/Notification/notification.actions';
import { setChatRoomInfo, addNewTransaction } from '../../redux/Logic/logic.actions';
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
  const balance = useSelector((state) => state.auth.balance);
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
        return { color: '#ffc107', title: 'UNCONSCIOUS COMPETENT', message: 'Doing fine, but the bitch is comfortable.', progress: 60 };
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
  const barStyle = { width: `${progressValue}%`, backgroundColor: progressValue <= 50 ? 'yellow' : 'red' };

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
      if (tipAmtNum <= 0) {
        dispatch(errorMsgBar('R U FURR-REAL? TIP AMOUNT MUST BE MORE THAN 0!'));
        return;
      }
      if (tipAmtNum > balance) {
        dispatch(errorMsgBar('NOT ENUFF FUNDS AT THIS MEOWMENT'));
        return;
      }
      setIsLoading(true);
      const result = await axios.post('/game/tip/', {
        amount: tipAmtNum,
        addressTo: creatorId,
        message,
      });
      if (result.data.success) {
        dispatch(errorMsgBar(result.data.message));
        dispatch(addNewTransaction(result.data.newTransaction));
        setIsLoading(false);
        closeModal();
      } else {
        setIsLoading(false);
        dispatch(errorMsgBar(result.data.message));
      }
    } catch (err) {
      setIsLoading(false);
      dispatch(errorMsgBar('FAILED TRANSACTION'));
    }
  };

  // Lend Logic
  const handleOpenOfferModal = () => {
    dispatch(openOfferLoanModal());
    closeModal();
  };

  // Chat Logic
  const handleOpenChat = () => {
    const chatRoom = { _id: creatorId, username, avatar, accessory, rank, chatLogs: [] };
    dispatch(setChatRoomInfo(chatRoom));
    navigate(`/chat/${creatorId}`);
  };

  // Tabs
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      {isLoading && (
        <LoadingOverlay
          active={isLoading}
          spinner
          text="Sending Tip..."
          styles={{
            wrapper: { position: 'fixed', width: '100%', top: '0', left: '0', height: '100vh', zIndex: '99' },
          }}
        />
      )}
      <ThemeProvider theme={theme}>
        <Modal open={modalIsOpen || false} onClose={closeModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff', // Preserve text color conditional
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 2,
              boxShadow: 24,
              p: 3,
              // Glassmorphism styles (default dark mode colors)
              background: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)', // For Safari
              border: '1px solid rgba(255, 255, 255, 0.2)',
              // Fallback for browsers without backdrop-filter
              '@supports not (backdrop-filter: blur(10px))': {
                background: 'rgba(0, 0, 0, 0.4)',
              },
            }}
          >
            {/* Modal Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2" className="modal-title title">
                {isBot ? (
                  <>
                    <FontAwesomeIcon icon={faRobot} style={{ color: 'red', marginRight: 8 }} />
                    Bot Card
                  </>
                ) : isSystem ? (
                  <>
                    <FontAwesomeIcon icon={faCog} style={{ color: 'grey', marginRight: 8 }} />
                    ADMIN
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />
                    Player Card
                  </>
                )}
              </Typography>
              <Button color="error" onClick={closeModal}>×</Button>
            </Box>
            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              textColor="error"
              indicatorColor="error"
              sx={{ '& .MuiTabs-indicator': { backgroundColor: 'error.main', height: '3px' } }}
            >
              <Tab label="Profile" />
              <Tab label="Stats" />
            </Tabs>
            {/* Tab 0: Profile & Inventory */}
            <Box sx={{ borderRadius: '0.3em', p: '20px' }}>
              {activeTab === 0 && (
                <Box>
                  {/* Online/Offline */}
                  <Box
                    sx={{
                      mb: 2,
                      p: 1,
                      borderRadius: 1,
                      maxWidth: '90px',
                      backgroundColor: '#6c757d26',
                    }}
                    className="player"
                  >
                    <Typography
                      variant="body2"
                      sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}
                    >
                      {isOnline ? 'online' : 'offline'}&nbsp;
                      <i className={`online-status${isOnline ? ' online' : ''}`} />
                    </Typography>
                  </Box>
                  {/* Avatar & Bio */}
                  <Box sx={{ textAlign: 'center' }}>
                    <Box className="avatar-border" sx={{ display: 'inline-block' }}>
                      <Avatar
                        src={avatar || '/img/profile-thumbnail.svg'}
                        accessory={accessory}
                        user_id={creatorId}
                        username={username}
                        elite={elite}
                        rank={rank}
                        alt=""
                      />
                    </Box>
                    <Typography variant="h5" sx={{ mt: 3 }}>
                      {username}
                    </Typography>
                    <Box
                      id="user-bio"
                      sx={{ position: 'relative', mt: 2, borderBottom: '2px solid', borderTop: '2px solid' }}
                    >
                      {isBioUrl ? (
                        <a
                          href={bio}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '1.1em', color: isDarkMode ? '#e5e5e5' : '#333', textDecoration: 'none' }}
                        >
                          {bio}
                        </a>
                      ) : (
                        <Typography variant="body1" sx={{ fontSize: '1.1em', color: isDarkMode ? '#e5e5e5' : '#333' }}>
                          {bio}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ borderRadius: '0.3em', p: '20px' }}>
                    <Typography variant="h6" gutterBottom>
                      A.K.A
                    </Typography>
                    {accounts.length === 0 ? (
                      <p>No associated accounts found.</p>
                    ) : (
                      <Grid container spacing={1}>
                        {accounts.map((acc, index) => {
                          const displayed = isMobile ? shortenAddress(acc) : acc;
                          return (
                            <Grid item xs={12} key={index}>
                              <Box display="flex" alignItems="center">
                                <Chip label={displayed} variant="outlined" sx={{ mr: 1 }} />
                                <IconButton
                                  component="a"
                                  href={`https://solscan.io/account/${acc}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                >
                                  <LinkIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}
                  </Box>
                  {/* <MarketplaceContainer>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                      INVENTORY
                    </Typography>
                    {productArray && productArray.length > 0 ? (
                      <ProductGrid>
                        {productArray.map((row) => (
                          <ProductCard key={row._id}>
                            {row.image && renderLottieAnimation(row.image, isLowGraphics) ? (
                              <Box sx={{ width: 80, height: 80 }}>
                                {renderLottieAnimation(row.image, isLowGraphics)}
                              </Box>
                            ) : (
                              <ProductImage src={row.image} alt={row.productName} />
                            )}
                            <ProductInfo>
                              <Typography variant="h6" sx={{ fontSize: '1rem', color: '#fff', textAlign: 'center' }}>
                                {row.productName}
                              </Typography>
                            </ProductInfo>
                          </ProductCard>
                        ))}
                      </ProductGrid>
                    ) : (
                      <ProductGrid>
                        <Typography variant="body2">No items found.</Typography>
                      </ProductGrid>
                    )}
                  </MarketplaceContainer> */}
                </Box>
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
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                <Button color="error" variant="outlined" onClick={handleTip}>
                  Tip&nbsp;<FontAwesomeIcon icon={faMoneyBill} />
                </Button>
                <Button color="error" variant="outlined" onClick={handleOpenChat}>
                  DM&nbsp;<FontAwesomeIcon icon={faEnvelope} />
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