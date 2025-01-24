import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';

import axios from '../../util/Api';
import history from '../../redux/history';

import { renderLottieAnimation } from '../../util/LottieAnimations';
import { convertToCurrency } from '../../util/conversion';
import { alertModal } from '../modal/ConfirmAlerts';

import {
  setBalance
} from '../../redux/Auth/user.actions';
import {
  setCurrentOfferTargetInfo
} from '../../redux/Loan/loan.action';
import {
  openOfferLoanModal
} from '../../redux/Notification/notification.actions';
import {
  setChatRoomInfo,
  addNewTransaction
} from '../../redux/Logic/logic.actions';
import {
  acGetCustomerInfo,
  getCustomerStatisticsData,
  getSpendingHabit
} from '../../redux/Customer/customer.action';
import {
  queryProducts
} from '../../redux/Item/item.action';

import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Box,
  Skeleton,
  Grid,
  Modal,
  InputAdornment
} from '@mui/material';

import { Warning } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill, faUser, faCog, faEnvelope, faCoins, faRobot } from '@fortawesome/free-solid-svg-icons';

import Avatar from '../../components/Avatar';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';

function PlayerModal(props) {
  const {
    modalIsOpen,
    closeModal,
    isDarkMode,
    selectedCreator,
    userInfo,
    balance,
    onlineUserList,
    productArray,
    isLowGraphics,
    solPrice,
    loading,
    // Redux actions
    setBalance: dispatchSetBalance,
    addNewTransaction,
    setChatRoomInfo,
    openOfferLoanModal,
    setCurrentOfferTargetInfo,
    getCustomerStatisticsData: dispatchGetCustomerStatisticsData,
    acGetCustomerInfo,
    getSpendingHabit: dispatchGetSpendingHabit,
    queryProducts: dispatchQueryProducts
  } = props;

  // -----------------------------
  // Local State
  // -----------------------------
  const [id, setId] = useState(selectedCreator || '');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [accessory, setAccessory] = useState('');
  const [rank, setRank] = useState('');
  const [bio, setBio] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Stats
  const [actorType, setActorType] = useState('Both');
  const [gameType, setGameType] = useState('All');
  const [timeType, setTimeType] = useState('24');

  const [gameLogList, setGameLogList] = useState([]);
  const [deposit, setDeposit] = useState(0);
  const [withdraw, setWithdraw] = useState(0);
  const [gameProfit, setGameProfit] = useState(0);
  const [playerBalance, setPlayerBalance] = useState(balance);
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

  // Additional user info
  const [dateJoined, setDateJoined] = useState('');
  const [creditScore, setCreditScore] = useState('');
  const [lastSeen, setLastSeen] = useState('');

  // Tip modal
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState('');
  const [message, setMessage] = useState('');

  // -----------------------------
  // MUI Modal Styles
  // -----------------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#1f1a25', // Purple background
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 700,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const tipModalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#1f1a25',
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 400,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  // -----------------------------
  // Effects
  // -----------------------------
  useEffect(() => {
    // Fetch stats & user data
    (async function loadData() {
      await fetchStatisticsData();

      // Get spending habit
      const data = await dispatchGetSpendingHabit(id);
      if (data) {
        setStatus(data.status);
      }

      // Query products for this user
      await dispatchQueryProducts(127, 1, id);
    })();
    // eslint-disable-next-line
  }, []);

  // -----------------------------
  // Data Fetching
  // -----------------------------
  const fetchStatisticsData = useCallback(async () => {
    const result = await dispatchGetCustomerStatisticsData(id, actorType, gameType, timeType);
    const userData = await acGetCustomerInfo(selectedCreator);

    if (!result || !userData) return;

    setGameLogList(result.gameLogList || []);
    setDeposit(result.deposit || 0);
    setWithdraw(result.withdraw || 0);
    setGameProfit(result.gameProfit || 0);
    setPlayerBalance(result.balance || balance);

    setGamePlayed(result.gamePlayed || 0);
    setGameHosted(result.gameHosted || 0);
    setGameJoined(result.gameJoined || 0);
    setTotalWagered(result.totalWagered || userData.totalWagered || 0);
    setNetProfit(result.netProfit || 0);
    setProfitAllTimeHigh(result.profitAllTimeHigh || userData.profitAllTimeHigh || 0);
    setProfitAllTimeLow(result.profitAllTimeLow || userData.profitAllTimeLow || 0);
    setAverageWager(result.averageWager || 0);
    setAverageGamesPlayedPerRoom(result.averageGamesPlayedPerRoom || 0);
    setAverageProfit(result.averageProfit || 0);

    setUsername(userData.username);
    setAvatar(userData.avatar);
    setAccessory(userData.accessory);
    setBio(userData.bio);
    setRank(userData.totalWagered);
    setDateJoined(userData.created_at);
    setCreditScore(userData.credit_score);
    setLastSeen(userData.last_seen);

    // Prepare the target info for the "Offer Loan" modal
    setCurrentOfferTargetInfo({
      avatar: userData.avatar,
      _id: selectedCreator,
      username: userData.username,
      accessory: userData.accessory,
      totalWagered: userData.totalWagered,
      isLender: true
    });
  }, [
    id,
    actorType,
    gameType,
    timeType,
    balance,
    acGetCustomerInfo,
    dispatchGetCustomerStatisticsData,
    setCurrentOfferTargetInfo,
    selectedCreator
  ]);

  // -----------------------------
  // Utility / Status
  // -----------------------------
  const getStatusDetails = useCallback((s) => {
    switch (s) {
      case 'very good':
        return { color: 'rgb(118 221 119)', title: 'JEWISH JEDI', message: 'Your spending habits are outstanding!', progress: 100 };
      case 'good':
        return { color: 'rgb(3 221 255)', title: 'SEASONED CZAR', message: 'Your spending habits are commendable.', progress: 80 };
      case 'average':
        return { color: '#ffc107', title: 'UNCONSCIOUS COMPETENT', message: 'Keep an eye on your spending.', progress: 60 };
      case 'bad':
        return { color: '#fd7e14', title: 'PEASANT PUPPET', message: 'Consider revisiting your strategy.', progress: 40 };
      case 'very bad':
        return { color: '#dc3545', title: 'MISERABLE MULE', message: 'Your spending habits are hurting you.', progress: 20 };
      default:
        return { color: '#6c757d', title: 'Unknown', message: 'Unable to determine spending habits.', progress: 0 };
    }
  }, []);

  const { color, title, message: spendingMessage, progress } = getStatusDetails(status);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleClosePlayerModal = () => {
    closeModal();
  };

  const handleTip = () => {
    setIsTipModalOpen(true);
  };

  const handleCloseTipModal = () => {
    setIsTipModalOpen(false);
  };

  const handleTipAmountChange = (event) => {
    setTipAmount(event.target.value);
  };

  const handleMessage = (event) => {
    setMessage(event.target.value);
  };

  const handleSendTip = useCallback(async () => {
    try {
      const tipVal = parseFloat(tipAmount) || 0;
      if (tipVal <= 0) {
        alertModal(isDarkMode, 'R U FURR-REAL? TIP AMOUNT MUST BE MORE THAN 0!');
        return;
      }
      if (tipVal > balance) {
        alertModal(isDarkMode, 'NOT ENUFF FUNDS AT THIS MEOWMENT');
        return;
      }
      setIsLoading(true);
      const result = await axios.post('/game/tip/', {
        amount: tipVal,
        addressTo: id,
        message
      });

      if (result.data.success) {
        alertModal(isDarkMode, result.data.message, '-cat');
        dispatchSetBalance(result.data.balance);
        addNewTransaction(result.data.newTransaction);
        setIsLoading(false);
        closeModal();
      } else {
        setIsLoading(false);
        alertModal(isDarkMode, result.data.message);
      }
    } catch (e) {
      setIsLoading(false);
      alertModal(isDarkMode, 'FAILED TRANSACTION');
    }
  }, [tipAmount, balance, id, message, isDarkMode, addNewTransaction, dispatchSetBalance, closeModal]);

  const handleOpenOfferModal = () => {
    openOfferLoanModal();
    handleClosePlayerModal();
  };

  const handleOpenChat = () => {
    const selected = selectedCreator;
    // If no existing chat, create new
    const newChatRoom = {
      _id: selected,
      username,
      avatar,
      accessory,
      rank,
      chatLogs: []
    };
    setChatRoomInfo(newChatRoom);
    history.push('/chat/' + selected);
  };

  const handleDropdownChange = async (dropdownName, selectedValue) => {
    if (dropdownName === 'actorType') setActorType(selectedValue);
    if (dropdownName === 'gameType') setGameType(selectedValue);
    if (dropdownName === 'timeType') setTimeType(selectedValue);

    // Re-fetch stats after updates
    setTimeout(() => {
      fetchStatisticsData();
    }, 0);
  };

  // -----------------------------
  // Conditions
  // -----------------------------
  const isBot = username?.toUpperCase().includes('BOT');
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
    'NO BROKIES'
  ];
  const isSystem = systemUsernames.includes(username);
  const isBioLink = /^https?:\/\//.test(bio);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <>
      {/* Loading Overlay for tip process */}
      {isLoading && (
        <LoadingOverlay
          active={isLoading}
          spinner
          text="Sending Tip..."
          styles={{
            wrapper: {
              position: 'fixed',
              width: '100%',
              height: '100vh',
              zIndex: 3000
            }
          }}
        />
      )}

      {/* Main Player Modal */}
      <Modal
        open={modalIsOpen}
        onClose={handleClosePlayerModal}
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
        }}
      >
        <Box sx={modalBoxStyle}>
          {/* HEADER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              {isBot ? (
                <>
                  <FontAwesomeIcon icon={faRobot} style={{ marginRight: 8, color: 'red' }} />
                  Bot Card
                </>
              ) : isSystem ? (
                <>
                  <FontAwesomeIcon icon={faCog} style={{ marginRight: 8, color: 'grey' }} />
                  ADMIN
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />
                  Player Card
                </>
              )}
            </Typography>
            <Button variant="text" color="error" onClick={handleClosePlayerModal}>
              X
            </Button>
          </Box>

          {/* BODY */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* AVATAR & INFO */}
            <Box sx={{ textAlign: 'center' }}>
              {/* Online/offline status */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#6c757d26',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <Typography variant="body2" sx={{ mr: 1 }}>
                  {onlineUserList.includes(selectedCreator) ? 'online' : 'offline'}
                </Typography>
                <Box
                  component="i"
                  sx={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: onlineUserList.includes(selectedCreator)
                      ? '#28a745'
                      : '#ff0000'
                  }}
                />
              </Box>

              {/* Avatar */}
              {avatar ? (

                  <Avatar
                    src={avatar || '/img/profile-thumbnail.svg'}
                    accessory={accessory}
                    username={username}
                    rank={rank}
                    alt=""
                  />
                  ) : (
                  <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto' }} />
              )}

                  {/* Username */}
                  <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
                    {username}
                  </Typography>

                  {/* Bio */}
                  {bio && (
                    <Box
                      sx={{
                        borderTop: '2px solid',
                        borderBottom: '2px solid',
                        py: 1,
                        mt: 1
                      }}
                    >
                      {isBioLink ? (
                        <Typography
                          component="a"
                          href={bio}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: '#fff' }}
                        >
                          {bio}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#f5f5f5' }}>
                          {bio}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>

            {/* STATS FORM */}
              {!username ? (
                <Box sx={{ width: '100%' }}>
                  <Skeleton variant="rectangular" sx={{ width: '100%', height: 300, borderRadius: 1 }} />
                  {[...Array(5)].map((_, idx) => (
                    <Box sx={{ mt: 1 }} key={idx}>
                      <Skeleton variant="text" sx={{ width: `${30 + idx * 10}%`, height: 20 }} />
                      <Skeleton variant="text" sx={{ width: `${70 - idx * 10}%`, height: 20 }} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <StatisticsForm
                  onDropdownChange={handleDropdownChange}
                  username={username}
                  title={title}
                  color={color}
                  solPrice={solPrice}
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
              )}

              {/* INVENTORY */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
                  INVENTORY
                </Typography>
                {productArray && productArray.length > 0 ? (
                  <Grid container spacing={2}>
                    {productArray.map((row) => (
                      <Grid item xs={6} sm={4} md={3} lg={2} key={row._id}>
                        <Box
                          sx={{
                            background: 'linear-gradient(156deg, #5d28a7, #ff8500)',
                            borderRadius: 1,
                            p: 1,
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.03)'
                            }
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              width: '100%',
                              height: '100%',
                              top: 0,
                              left: 0,
                              borderRadius: 1,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              '&:hover': { opacity: 1 }
                            }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                            {row.image && renderLottieAnimation(row.image, isLowGraphics) ? (
                              renderLottieAnimation(row.image, isLowGraphics)
                            ) : (
                              <Box
                                component="img"
                                src={row.image}
                                alt={row.productName}
                                sx={{
                                  maxWidth: '50%',
                                  border: '1px solid #f9f9f9',
                                  boxShadow: '0 1px 17px #333',
                                  borderRadius: 1
                                }}
                              />
                            )}
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                background: 'linear-gradient(354deg, #ffdd0775, #494e54)',
                                borderRadius: '20% 0 20% 0',
                                color: '#fff',
                                py: 0.5,
                                textTransform: 'uppercase',
                                fontWeight: 'bold'
                              }}
                            >
                              {row.productName}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  // Skeleton placeholders
                  <Grid container spacing={2}>
                    {[...Array(6)].map((_, idx) => (
                      <Grid item xs={6} sm={4} md={3} lg={2} key={idx}>
                        <Box
                          sx={{
                            background: 'linear-gradient(156deg, #5d28a7, #ff8500)',
                            borderRadius: 1,
                            p: 1,
                            position: 'relative'
                          }}
                        >
                          <Skeleton
                            variant="rectangular"
                            width="100%"
                            height={80}
                            sx={{ borderRadius: 1, mb: 1 }}
                          />
                          <Skeleton variant="text" width="60%" />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Box>

            {/* FOOTER (only if current user != selected user) */}
            {userInfo._id !== id && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                {onlineUserList.includes(selectedCreator) && (
                  <Button variant="contained" onClick={handleOpenOfferModal}>
                    Lend <FontAwesomeIcon icon={faCoins} style={{ marginLeft: 6 }} />
                  </Button>
                )}
                <Button variant="contained" onClick={handleTip}>
                  Tip <FontAwesomeIcon icon={faMoneyBill} style={{ marginLeft: 6 }} />
                </Button>
                <Button variant="contained" onClick={handleOpenChat}>
                  DM <FontAwesomeIcon icon={faEnvelope} style={{ marginLeft: 6 }} />
                </Button>
              </Box>
            )}
          </Box>
      </Modal>

      {/* Tip Modal */}
      <Modal
        open={isTipModalOpen}
        onClose={handleCloseTipModal}
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
        }}
      >
        <Box sx={tipModalBoxStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
            >
              <FontAwesomeIcon icon={faMoneyBill} style={{ marginRight: 8 }} />
              ENTER TIP AMOUNT
            </Typography>
            <Button variant="text" color="error" onClick={handleClosePlayerModal}>
              X
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Amount"
              variant="filled"
              color="secondary"
              value={tipAmount || 0}
              type="number"
              onChange={handleTipAmountChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">RPS</InputAdornment>
              }}
            />

            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>IN-GAME BALANCE:</TableCell>
                  <TableCell>{convertToCurrency(balance, solPrice)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>TIP AMOUNT:</TableCell>
                  <TableCell sx={{ color: 'red' }}>
                    {convertToCurrency(tipAmount * -1, solPrice)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>NEW BALANCE:</TableCell>
                  <TableCell>
                    {convertToCurrency(balance - tipAmount, solPrice)}
                    {(balance - tipAmount < 0) && <Warning sx={{ ml: 1 }} />}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Typography>Add Message?</Typography>
            <TextField
              label="Message"
              variant="filled"
              color="secondary"
              value={message}
              onChange={handleMessage}
              inputProps={{ maxLength: 8 }} // if you want an 8-char limit
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" color="error" onClick={handleSendTip}>
              Send Tip
            </Button>
            <Button variant="contained" color="secondary" onClick={handleCloseTipModal}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

// ---------------------
// Redux Mappings
// ---------------------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  myChat: state.logic.myChat,
  loading: state.logic.isActiveLoadingOverlay,
  userInfo: state.auth.user,
  balance: state.auth.balance,
  productArray: state.itemReducer.productArray,
  isLowGraphics: state.auth.isLowGraphics,
  onlineUserList: state.logic.onlineUserList,
  solPrice: state.logic.solPrice
});

const mapDispatchToProps = {
  getCustomerStatisticsData,
  acGetCustomerInfo,
  setChatRoomInfo,
  setBalance,
  queryProducts,
  getSpendingHabit,
  addNewTransaction,
  openOfferLoanModal,
  setCurrentOfferTargetInfo
};

export default connect(mapStateToProps, mapDispatchToProps)(PlayerModal);