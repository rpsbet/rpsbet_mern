import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';

// MUI v5 components
import {
  Modal,
  Box,
  Button,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  LinearProgress,
  CircularProgress as MuiCircularProgress,
} from '@mui/material';

import { Warning as WarningIcon } from '@mui/icons-material';
import {
  FileCopy as FileCopyIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import LoadingOverlay from 'react-loading-overlay';
import styled from 'styled-components';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBill,
  faUser,
  faCog,
  faEnvelope,
  faCoins,
  faRobot
} from '@fortawesome/free-solid-svg-icons';

import axios from '../../util/Api';
import history from '../../redux/history';

import {
  setBalance,
  setUserInfo,
} from '../../redux/Auth/user.actions';
import {
  setCurrentOfferTargetInfo,
} from '../../redux/Loan/loan.action';
import {
  openOfferLoanModal,
} from '../../redux/Notification/notification.actions';
import {
  setChatRoomInfo,
  addNewTransaction,
} from '../../redux/Logic/logic.actions';
import {
  acGetCustomerInfo,
  getCustomerStatisticsData,
  getSpendingHabit
} from '../../redux/Customer/customer.action';
import {
  queryProducts
} from '../../redux/Item/item.action';
import { alertModal } from '../modal/ConfirmAlerts';
import { convertToCurrency } from '../../util/conversion';
import { renderLottieAnimation } from '../../util/LottieAnimations';

import Avatar from '../../components/Avatar';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';

// Styled components for Inventory
const MarketplaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 20px;
  max-width: 100%;
  margin: 20px 0;
`;
const ProductCard = styled.div`
  position: relative;
  background: linear-gradient(156deg, #5d28a7, #ff8500);
  border-radius: 20px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover::before {
    opacity: 1;
  }

  &:hover {
    transform: scale(1.03);
  }
`;
const ProductImage = styled.img`
  max-width: 50%;
  height: auto;
  background: #fff;
  border: 1px solid #f9f9;
  box-shadow: 0 1px 17px #333;
  border-radius: 10px;
`;
const ProductInfo = styled.div`
  text-align: center;
`;
const ProductName = styled.h6`
  padding: 4px;
  font-size: 1rem;
  margin-bottom: -5px;
  font-weight: 400;
  line-height: 1.75;
  letter-spacing: 0.00938em;
  background: linear-gradient(354deg, #ffdd0775, #494e54);
  width: 100%;
  text-shadow: 2px -2px 4px #f3b01b;
  text-transform: uppercase;
  color: #fff;
  margin-top: 10px;
  border-bottom-right-radius: 21px;
  border-top-left-radius: 30px;
`;

// Main functional component
function PlayerModal(props) {
  const {
    modalIsOpen,
    closeModal,
    selectedCreator,
    isDarkMode,
    userInfo,
    balance,
    solPrice,
    isLowGraphics,
    onlineUserList,
    productArray = [],
    // Redux actions
    getCustomerStatisticsData,
    acGetCustomerInfo,
    setChatRoomInfo,
    setBalance: _setBalance,
    queryProducts: _queryProducts,
    getSpendingHabit: _getSpendingHabit,
    addNewTransaction: _addNewTransaction,
    openOfferLoanModal: _openOfferLoanModal,
    setCurrentOfferTargetInfo: _setCurrentOfferTargetInfo,
  } = props;

  // -----------------------------
  // Local State
  // -----------------------------
  const [creatorId, setCreatorId] = useState(selectedCreator || '');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [accessory, setAccessory] = useState('');
  const [bio, setBio] = useState('');
  const [rank, setRank] = useState('');
  const [dateJoined, setDateJoined] = useState('');
  const [creditScore, setCreditScore] = useState(0);
  const [lastSeen, setLastSeen] = useState('');

  const [actorType, setActorType] = useState('Both');
  const [gameType, setGameType] = useState('All');
  const [timeType, setTimeType] = useState('24');

  const [status, setStatus] = useState('');
  const [gameLogList, setGameLogList] = useState([]);
  const [deposit, setDeposit] = useState(0);
  const [withdraw, setWithdraw] = useState(0);
  const [gameProfit, setGameProfit] = useState(0);
  const [playerBalance, setPlayerBalance] = useState(0);
  const [gamePlayed, setGamePlayed] = useState(0);
  const [gameHosted, setGameHosted] = useState(0);
  const [gameJoined, setGameJoined] = useState(0);
  const [totalWagered, setTotalWagered] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [profitAllTimeHigh, setProfitAllTimeHigh] = useState(0);
  const [profitAllTimeLow, setProfitAllTimeLow] = useState(0);
  const [averageWager, setAverageWager] = useState(0);
  const [averageGamesPlayedPerRoom, setAverageGamesPlayedPerRoom] = useState(0);
  const [averageProfit, setAverageProfit] = useState(0);

  // Tabbing: 0 => "Profile & Inventory", 1 => "Stats"
  const [activeTab, setActiveTab] = useState(0);

  // Tip modal
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [message, setMessage] = useState('');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // -----------------------------
  // Effects (replaces componentDidMount)
  // -----------------------------
  useEffect(() => {
    setCreatorId(selectedCreator);
    // Load stats, user info, inventory
    fetchUserData(selectedCreator);
  }, [selectedCreator]);

  // On mount or when any actorType/gameType/timeType changes, refetch stats
  useEffect(() => {
    if (creatorId) {
      fetchStatisticsData();
    }
  }, [creatorId, actorType, gameType, timeType]);

  // Fetch products (inventory)
  useEffect(() => {
    if (creatorId) {
      _queryProducts(127, 1, creatorId); // e.g. categoryId=127, page=1
    }
  }, [creatorId]);

  // -----------------------------
  // Async logic
  // -----------------------------
  const fetchUserData = async (userId) => {
    if (!userId) return;

    // Spending Habit
    const data = await _getSpendingHabit(userId);
    if (data) {
      setStatus(data.status);
    }

    // Full user stats
    try {
      // Load user base info
      const userData = await acGetCustomerInfo(userId);
      if (userData) {
        setUsername(userData.username);
        setAvatar(userData.avatar);
        setAccessory(userData.accessory);
        setBio(userData.bio || '');
        setRank(userData.totalWagered);
        setDateJoined(userData.created_at);
        setCreditScore(userData.credit_score);
        setLastSeen(userData.last_seen);

        // Pass user info to setCurrentOfferTargetInfo
        _setCurrentOfferTargetInfo({
          avatar: userData.avatar,
          _id: userId,
          username: userData.username,
          accessory: userData.accessory,
          totalWagered: userData.totalWagered,
          isLender: true,
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchStatisticsData = async () => {
    try {
      const result = await getCustomerStatisticsData(creatorId, actorType, gameType, timeType);
      if (result) {
        setGameLogList(result.gameLogList || []);
        setDeposit(result.deposit || 0);
        setWithdraw(result.withdraw || 0);
        setGameProfit(result.gameProfit || 0);
        setPlayerBalance(result.balance || 0);
        setGamePlayed(result.gamePlayed || 0);
        setGameHosted(result.gameHosted || 0);
        setGameJoined(result.gameJoined || 0);
        setTotalWagered(result.totalWagered || 0);
        setNetProfit(result.netProfit || 0);
        setProfitAllTimeHigh(result.profitAllTimeHigh || 0);
        setProfitAllTimeLow(result.profitAllTimeLow || 0);
        setAverageWager(result.averageWager || 0);
        setAverageGamesPlayedPerRoom(result.averageGamesPlayedPerRoom || 0);
        setAverageProfit(result.averageProfit || 0);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // -----------------------------
  // Misc Helpers
  // -----------------------------
  const getStatusDetails = (st) => {
    switch (st) {
      case 'very good':
        return {
          color: 'rgb(118 221 119)',
          title: 'JEWISH JEDI',
          message: 'Your spending habits are outstanding!',
          progress: 100,
        };
      case 'good':
        return {
          color: 'rgb(3 221 255)',
          title: 'SEASONED CZAR',
          message: 'Your spending habits are commendable.',
          progress: 80,
        };
      case 'average':
        return {
          color: '#ffc107',
          title: 'UNCONSCIOUS COMPETENT',
          message: 'You’re doing fine, but bitch don’t get too comfortable.',
          progress: 60,
        };
      case 'bad':
        return {
          color: '#fd7e14',
          title: 'PEASANT PUPPET',
          message: 'Consider revisiting your spending strategy.',
          progress: 40,
        };
      case 'very bad':
        return {
          color: '#dc3545',
          title: 'MISERABLE MULE',
          message: 'Your spending habits make you miserable.',
          progress: 20,
        };
      default:
        return {
          color: '#6c757d',
          title: 'Unknown',
          message: 'Unable to determine spending habits.',
          progress: 0,
        };
    }
  };

  const { color, title, message: spendingMessage, progress } = getStatusDetails(status);
  const barStyle = {
    width: `${progress}%`,
    backgroundColor: progress <= 50 ? 'yellow' : 'red',
  };

  const handleDropdownChange = async (dropdownName, selectedValue) => {
    // For the <StatisticsForm> usage
    if (dropdownName === 'actorType') setActorType(selectedValue);
    if (dropdownName === 'gameType') setGameType(selectedValue);
    if (dropdownName === 'timeType') setTimeType(selectedValue);
  };

  // Online check for the selected user
  const isOnline = onlineUserList.includes(selectedCreator);

  // If user name suggests a bot or system admin
  const isBot = username.toUpperCase().includes('BOT');
  const systemUsernames = [
    'pimpedpistols',
    'GIGACHAD',
    'KEKW',
    'smellyfingers',
    'SUPPORT',
    '69',
    'OFFICIALRPSGAME',
    'SYSTEM',
    'WHALE WATCHERS',
    'NO BROKIES',
  ];
  const isSystem = systemUsernames.includes(username);

  const isBioUrl = /^https?:\/\//.test(bio);

  // -----------------------------
  //   Tip Modal Logic
  // -----------------------------
  const handleTip = () => setIsTipModalOpen(true);
  const handleCloseTipModal = () => setIsTipModalOpen(false);
  const handleTipAmountChange = (e) => setTipAmount(e.target.value);
  const handleMessageChange = (e) => setMessage(e.target.value);

  const handleSendTip = async () => {
    try {
      const tipAmtNum = parseFloat(tipAmount || 0);
      if (tipAmtNum <= 0) {
        alertModal(isDarkMode, `R U FURR-REAL? TIP AMOUNT MUST BE MORE THAN 0!`);
        return;
      }
      if (tipAmtNum > balance) {
        alertModal(isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
        return;
      }
      setIsLoading(true);

      const result = await axios.post('/game/tip/', {
        amount: tipAmtNum,
        addressTo: creatorId,
        message,
      });

      if (result.data.success) {
        alertModal(isDarkMode, result.data.message, '-cat');
        _setBalance(result.data.balance);
        _addNewTransaction(result.data.newTransaction);
        setIsLoading(false);
        closeModal();
      } else {
        setIsLoading(false);
        alertModal(isDarkMode, result.data.message);
      }
    } catch (err) {
      setIsLoading(false);
      alertModal(isDarkMode, `FAILED TRANSACTION`);
    }
  };

  // -----------------------------
  //   Lend Logic
  // -----------------------------
  const handleOpenOfferModal = () => {
    _openOfferLoanModal();
    closeModal();
  };

  // -----------------------------
  //   Chat Logic
  // -----------------------------
  const handleOpenChat = () => {
    // Build a minimal chat room object
    const chatRoom = {
      _id: creatorId,
      username,
      avatar,
      accessory,
      rank,
      chatLogs: [],
    };
    setChatRoomInfo(chatRoom);
    history.push(`/chat/${creatorId}`);
  };

  // -----------------------------
  //   MUI Tab Switch
  // -----------------------------
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // -----------------------------
  //   Render
  // -----------------------------
  return (
    <>
      {/* Loading Overlay for the tip submission */}
      {isLoading && (
        <LoadingOverlay
          active={isLoading}
          spinner
          text="Sending Tip..."
          styles={{
            wrapper: {
              position: 'fixed',
              width: '100%',
              top: '0',
              left: '0',
              height: '100vh',
              zIndex: '99',
            },
          }}
        />
      )}

      {/* Main Player Modal (MUI) */}
      <Modal open={modalIsOpen} onClose={closeModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: isDarkMode ? '#1f1a25' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            width: '90vw',
            maxWidth: '700px',
            maxHeight: '85vh',
            overflowY: 'auto',
            borderRadius: 1,
            p: 3,
            boxShadow: 24,
          }}
        >
          {/* Modal Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
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
            <Button color="error" onClick={closeModal}>
              ×
            </Button>
          </Box>

          {/* If no data loaded yet, you could show skeleton or loading spinner here */}
          {/* TABS: 0 => Profile & Inventory; 1 => Stats */}
          <Tabs value={activeTab} onChange={handleTabChange} textColor="error" indicatorColor="error">
            <Tab label="Profile & Inventory" />
            <Tab label="Stats" />
          </Tabs>

          {/* Tab Panel #1: Profile & Inventory */}
          {activeTab === 0 && (
            <Box sx={{ mt: 2 }}>
              {/* Online/Offline indicator */}
              <Box
                sx={{
                  mb: 2,
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: '#6c757d26',
                  maxWidth: '150px',
                }}
              >
                <Typography variant="body2">
                  {isOnline ? 'online' : 'offline'}&nbsp;
                  <i className={`online-status${isOnline ? ' online' : ''}`} />
                </Typography>
              </Box>

              {/* Avatar + Bio */}
              <Box sx={{ textAlign: 'center' }}>
                <Box className="avatar-border" sx={{ display: 'inline-block' }}>
                  <Avatar
                    src={avatar || '/img/profile-thumbnail.svg'}
                    accessory={accessory}
                    username={username}
                    rank={rank}
                    alt=""
                  />
                </Box>
                <Typography variant="h5" sx={{ mt: 3 }}>
                  {username}
                </Typography>

                {/* Bio link or text */}
                <Box
                  id="user-bio"
                  sx={{
                    position: 'relative',
                    mt: 2,
                    borderBottom: '2px solid',
                    borderTop: '2px solid',
                  }}
                >
                  {isBioUrl ? (
                    <a
                      href={bio}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '1.1em',
                        color: isDarkMode ? '#e5e5e5' : '#333',
                        textDecoration: 'none',
                      }}
                    >
                      {bio}
                    </a>
                  ) : (
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: '1.1em',
                        color: isDarkMode ? '#e5e5e5' : '#333',
                      }}
                    >
                      {bio}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* INVENTORY */}
              <MarketplaceContainer>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  INVENTORY
                </Typography>

                {productArray && productArray.length > 0 ? (
                  <ProductGrid>
                    {productArray.map((row) => (
                      <ProductCard key={row._id}>
                        {row.image && renderLottieAnimation(row.image, isLowGraphics) ? (
                          renderLottieAnimation(row.image, isLowGraphics)
                        ) : (
                          <ProductImage src={row.image} alt={row.productName} />
                        )}
                        <ProductInfo>
                          <ProductName>{row.productName}</ProductName>
                        </ProductInfo>
                      </ProductCard>
                    ))}
                  </ProductGrid>
                ) : (
                  <ProductGrid>
                    {/* No items => maybe show placeholders or skeletons */}
                    <Typography variant="body2">No items found.</Typography>
                  </ProductGrid>
                )}
              </MarketplaceContainer>
            </Box>
          )}

          {/* Tab Panel #2: Stats */}
          {activeTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <StatisticsForm
                onDropdownChange={handleDropdownChange}
                username={username}
                title={title}
                barStyle={barStyle}
                color={color}
                message={spendingMessage}
                actorType={actorType}
                gameType={gameType}
                timeType={timeType}
                dateJoined={dateJoined}
                last_seen={lastSeen}
                creditScore={creditScore}
                gameLogList={gameLogList}
                deposit={deposit}
                withdraw={withdraw}
                gameProfit={gameProfit}
                balance={playerBalance}
                gamePlayed={gamePlayed}
                gameHosted={gameHosted}
                gameJoined={gameJoined}
                totalWagered={totalWagered}
                rank={rank}
                netProfit={netProfit}
                profitAllTimeHigh={profitAllTimeHigh}
                profitAllTimeLow={profitAllTimeLow}
                averageWager={averageWager}
                averageGamesPlayedPerRoom={averageGamesPlayedPerRoom}
                averageProfit={averageProfit}
              />
            </Box>
          )}

          {/* Footer: show Lend, Tip, DM if not your own card */}
          {userInfo._id !== creatorId && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
                mt: 3,
              }}
            >
              {/* If user is online, show Lend */}
              {isOnline && (
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleOpenOfferModal}
                >
                  Lend&nbsp;
                  <FontAwesomeIcon icon={faCoins} />
                </Button>
              )}
              <Button
                color="error"
                variant="contained"
                onClick={handleTip}
              >
                Tip&nbsp;
                <FontAwesomeIcon icon={faMoneyBill} />
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={handleOpenChat}
              >
                DM&nbsp;
                <FontAwesomeIcon icon={faEnvelope} />
              </Button>
            </Box>
          )}
        </Box>
      </Modal>

      {/* TIP MODAL (MUI) */}
      <Modal open={isTipModalOpen} onClose={handleCloseTipModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: isDarkMode ? '#1f1a25' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            width: '80vw',
            maxWidth: 600,
            maxHeight: '80vh',
            overflowY: 'auto',
            borderRadius: 1,
            p: 3,
            boxShadow: 24,
          }}
        >
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" component="h2">
                <FontAwesomeIcon icon={faMoneyBill} style={{ marginRight: 8 }} />
                ENTER TIP AMOUNT
              </Typography>
              <Button color="error" onClick={closeModal}>
                ×
              </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                color="error"
                label="Amount"
                value={tipAmount || 0}
                type="number"
                onChange={handleTipAmountChange}
                variant="filled"
                autoComplete="off"
                inputProps={{ pattern: '^\\d*\\.?\\d*$' }}
                sx={{ width: '100%', mb: 2 }}
                InputProps={{
                  endAdornment: <Box component="span" sx={{ ml: 1 }}>RPS</Box>,
                }}
              />

              {/* Balance Table */}
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>IN-GAME BALANCE:</TableCell>
                    <TableCell>
                      {convertToCurrency(balance, solPrice)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>TIP AMOUNT:</TableCell>
                    <TableCell style={{ color: 'red' }}>
                      {convertToCurrency((+tipAmount || 0) * -1, solPrice)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>NEW BALANCE:</TableCell>
                    <TableCell>
                      {convertToCurrency(balance - (parseFloat(tipAmount) || 0), solPrice)}
                      &nbsp;
                      {balance - (parseFloat(tipAmount) || 0) < 0 && (
                        <WarningIcon sx={{ fontSize: 16 }} />
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Optional message */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Add Message?
                </Typography>
                <TextField
                  color="error"
                  label="Message"
                  value={message}
                  onChange={handleMessageChange}
                  variant="filled"
                  autoComplete="off"
                  inputProps={{ maxLength: 8 }}
                  sx={{ width: '100%' }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button color="error" variant="contained" onClick={handleSendTip}>
                Send Tip
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={handleCloseTipModal}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

// Redux connections
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  balance: state.auth.balance,
  isLowGraphics: state.auth.isLowGraphics,
  onlineUserList: state.logic.onlineUserList,
  solPrice: state.logic.solPrice,
  productArray: state.itemReducer.productArray,
});

const mapDispatchToProps = {
  setBalance,
  setUserInfo,
  setChatRoomInfo,
  addNewTransaction,
  setCurrentOfferTargetInfo,
  openOfferLoanModal,
  getSpendingHabit,
  getCustomerStatisticsData,
  acGetCustomerInfo,
  queryProducts,
};

export default connect(mapStateToProps, mapDispatchToProps)(PlayerModal);