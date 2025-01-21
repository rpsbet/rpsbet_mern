import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import styled from 'styled-components';
import axios from '../../util/Api';
import history from '../../redux/history';

import { renderLottieAnimation } from '../../util/LottieAnimations';
import { convertToCurrency } from '../../util/conversion';
import { alertModal } from '../modal/ConfirmAlerts';

import {
  setBalance,
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
  InputAdornment,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  Skeleton,
  Box
} from '@mui/material';

import { Warning } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill, faUser, faCog, faEnvelope, faCoins, faRobot } from '@fortawesome/free-solid-svg-icons';

import Avatar from '../../components/Avatar';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0,
    border: 'none'
  }
};

// -----------------------------
// Styled Components
// -----------------------------
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
  border-radius: 23%;
  text-shadow: 2px -2px 4px #f3b01b;
  text-transform: uppercase;
  box-shadow: inset 0px 1px 14px #28a74524, -1px 2px #dabf1475;
  color: #fff;
  margin-top: 10px;
  border-bottom-right-radius: 21px;
  border-top-left-radius: 30px;
`;

// -----------------------------
// Functional Component
// -----------------------------
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
  const [selectedCreatorBalance, setSelectedCreatorBalance] = useState('');
  const [rank, setRank] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // For player "status" details
  const [status, setStatus] = useState('');

  // Stats
  const [actorType, setActorType] = useState('Both');
  const [gameType, setGameType] = useState('All');
  const [timeType, setTimeType] = useState('24');

  // Local stats from getCustomerStatisticsData
  const [gameLogList, setGameLogList] = useState([]);
  const [deposit, setDeposit] = useState(0);
  const [withdraw, setWithdraw] = useState(0);
  const [gameProfit, setGameProfit] = useState(0);
  const [playerBalance, setPlayerBalance] = useState(balance); // local copy
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
  // Effects / Lifecycle
  // -----------------------------
  // Equivalent to componentDidMount
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
  }, []);

  // Simulate componentWillReceiveProps to detect changes in some prop
  // (This is rarely needed, but included to match your original code.)
  useEffect(() => {
    // If the parent updates `_id` prop (not typical, but if so):
    // set isLoading(false) or re-fetch data as needed
  }, [props._id]);

  // -----------------------------
  // Data Fetching
  // -----------------------------
  const fetchStatisticsData = useCallback(async () => {
    const result = await dispatchGetCustomerStatisticsData(id, actorType, gameType, timeType);
    const userData = await acGetCustomerInfo(selectedCreator);

    // If either API call fails or returns null, handle gracefully
    if (!result || !userData) return;

    setGameLogList(result.gameLogList || []);
    setDeposit(result.deposit || 0);
    setWithdraw(result.withdraw || 0);
    setGameProfit(result.gameProfit || 0);
    setPlayerBalance(result.balance || balance); // fallback to existing balance
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
        return { color: '#ffc107', title: 'UNCONSCIOUS COMPETENT', message: 'You’re doing fine, but bitch don’t get too comfortable.', progress: 60 };
      case 'bad':
        return { color: '#fd7e14', title: 'PEASANT PUPPET', message: 'Consider revisiting your spending strategy.', progress: 40 };
      case 'very bad':
        return { color: '#dc3545', title: 'MISERABLE MULE', message: 'Your spending habits make you miserable.', progress: 20 };
      default:
        return { color: '#6c757d', title: 'Unknown', message: 'Unable to determine spending habits.', progress: 0 };
    }
  }, []);

  const { color, title, message: spendingMessage, progress } = getStatusDetails(status);
  const barStyle = {
    width: `${progress}%`,
    backgroundColor: progress <= 50 ? 'yellow' : 'red'
  };

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleMessage = (event) => {
    setMessage(event.target.value);
  };

  const handleOpenOfferModal = () => {
    openOfferLoanModal();
    closeModal();
  };

  const handleOpenChat = (e) => {
    const selected = selectedCreator;
    const chatExists = false; // replicate logic if needed

    if (!chatExists) {
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
    } else {
      // If chat exists, do whatever the original code did
      setChatRoomInfo({
        avatar,
        rank,
        accessory,
        username,
        chatLogs: []
      });
      history.push('/chat/' + selected);
    }
  };

  const handleCloseModal = () => {
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

  // Example for "Send Offer" if needed:
  // (your original code has a handleSendOffer, not triggered in the UI except in `handleOpenOfferModal`)
  // You could replicate that logic or remove it if no longer used.

  const handleDropdownChange = async (dropdownName, selectedValue) => {
    if (dropdownName === 'actorType') setActorType(selectedValue);
    if (dropdownName === 'gameType') setGameType(selectedValue);
    if (dropdownName === 'timeType') setTimeType(selectedValue);

    // Re-fetch stats after state updates
    setTimeout(() => {
      fetchStatisticsData();
    }, 0);
  };

  // -----------------------------
  // Conditions / Display Flags
  // -----------------------------
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
    'NO BROKIES'
  ];
  const isSystem = systemUsernames.includes(username);
  const isBio = /^https?:\/\//.test(bio);

  return (
    <>
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
              zIndex: '3'
            }
          }}
        />
      )}

      {!isLoading && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={handleCloseModal}
          style={customStyles}
          contentLabel="Player Modal"
        >
          <div className={isDarkMode ? 'dark_mode' : ''}>
            {/* Header */}
            <div className="modal-header">
              <h2 className="modal-title title">
                {isBot ? (
                  <>
                    <FontAwesomeIcon icon={faRobot} className="mr-2" style={{ color: 'red' }} />
                    Bot Card
                  </>
                ) : isSystem ? (
                  <>
                    <FontAwesomeIcon icon={faCog} className="mr-2" style={{ color: 'grey' }} />
                    ADMIN
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUser} className="mr-2" />
                    Player Card
                  </>
                )}
              </h2>
              <Button className="btn-close" variant='text' color='error'  onClick={handleCloseModal}>
                ×
              </Button>
            </div>

            {/* Body */}
            <div className="modal-body player-modal edit-modal-body">
              <div className="align-center">
                {!avatar ? (
                  // Could show a skeleton or loading state if avatar not loaded
                  null
                ) : (
                  <>
                    <div
                      style={{
                        margin: '30px auto -10px',
                        padding: '10px',
                        borderRadius: '4px',
                        maxWidth: '150px',
                        background: '#6c757d26',
                        position: 'fixed',
                        left: '15px',
                        top: '65px',
                      }}
                    >
                      <span>
                        {onlineUserList.includes(selectedCreator) ? 'online' : 'offline'}
                      </span>
                      &nbsp;
                      <i
                        style={{ margin: 'unset', transform: 'unset' }}
                        className={`online-status${onlineUserList.includes(selectedCreator) ? ' online' : ''}`}
                      />
                    </div>

                    <div className="avatar-border">
                      <Avatar
                        src={avatar || '/img/profile-thumbnail.svg'}
                        accessory={accessory}
                        username={username}
                        rank={rank}
                        alt=""
                      />
                      <h1 className="player-username" style={{ marginTop: '60px' }}>
                        {username}
                      </h1>
                      <div
                        id="user-bio"
                        style={{
                          position: 'relative',
                          marginTop: '20px',
                          borderBottom: '2px solid',
                          borderTop: '2px solid'
                        }}
                      >
                        <div
                          className="player-username"
                          style={{ color: isDarkMode ? '#e5e5e5' : '#333' }}
                        >
                          {isBio ? (
                            <a
                              href={bio}
                              style={{
                                fontSize: '1.1em',
                                marginBottom: '2px',
                                color: isDarkMode ? '#e5e5e5' : '#333'
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {bio}
                            </a>
                          ) : (
                            <span
                              style={{
                                fontSize: '1.1em',
                                marginBottom: '20px',
                                paddingBottom: '10px',
                                color: isDarkMode ? '#e5e5e5' : '#333'
                              }}
                            >
                              {bio}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Statistics / Skeleton */}
              {!username ? (
                <Box className="user-statistics" sx={{ width: '100%' }}>
                  <Skeleton
                    variant="rectangular"
                    sx={{ width: '100%', height: 300, marginBottom: 2, borderRadius: 1 }}
                  />
                  {[...Array(5)].map((_, idx) => (
                    <Box sx={{ marginBottom: 1 }} key={idx}>
                      <Skeleton variant="text" sx={{ width: `${30 + idx * 10}%`, height: 20 }} />
                      <Skeleton variant="text" sx={{ width: `${70 - idx * 10}%`, height: 20 }} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <div className="user-statistics">
                  <StatisticsForm
                    onDropdownChange={handleDropdownChange}
                    username={username}
                    title={title}
                    barStyle={barStyle}
                    solPrice={solPrice}
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
                </div>
              )}

              {/* INVENTORY */}
              <MarketplaceContainer>
                <h5>INVENTORY</h5>
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
                    {/* Skeleton inventory placeholders */}
                    {[...Array(6)].map((_, index) => (
                      <ProductCard key={index}>
                        <Skeleton
                          variant="rect"
                          width="100%"
                          height={150}
                          style={{ marginBottom: '10px', borderRadius: '8px' }}
                        />
                        <ProductInfo>
                          <Skeleton
                            variant="text"
                            width="60%"
                            height={20}
                            style={{ marginBottom: '8px' }}
                          />
                          <Skeleton variant="text" width="40%" height={15} />
                        </ProductInfo>
                      </ProductCard>
                    ))}
                  </ProductGrid>
                )}
              </MarketplaceContainer>
            </div>

            {/* Footer (only if current user != selected user) */}
            {userInfo._id !== id && (
              <div className="modal-footer">
                {onlineUserList.includes(selectedCreator) && (
                  <Button className="tip-button" onClick={handleOpenOfferModal}>
                    Lend&nbsp;
                    <FontAwesomeIcon icon={faCoins} />
                  </Button>
                )}
                <Button className="tip-button" onClick={handleTip}>
                  Tip&nbsp;
                  <FontAwesomeIcon icon={faMoneyBill} />
                </Button>
                <Button className="send-msg" onClick={handleOpenChat}>
                  DM&nbsp;
                  <FontAwesomeIcon icon={faEnvelope} />
                </Button>
              </div>
            )}
          </div>

          {/* Tip Modal */}
          <Modal
            isOpen={isTipModalOpen}
            onRequestClose={handleCloseTipModal}
            style={customStyles}
            contentLabel="Tip Modal"
          >
            <div className={isDarkMode ? 'dark_mode' : ''}>
              <div className="modal-header">
                <h2 className="modal-title title">
                  <FontAwesomeIcon icon={faMoneyBill} className="mr-2" />
                  ENTER TIP AMOUNT
                </h2>
                <Button className="btn-close" variant='text' color='error'  onClick={handleCloseModal}>
                  ×
                </Button>
              </div>
              <div className="modal-body">
                <div className="modal-content-wrapper">
                  <div className="modal-content-panel">
                    <div className="input-amount">
                       <TextField color="secondary" 
                        label="Amount"
                        value={tipAmount || 0}
                        type="number"
                        onChange={handleTipAmountChange}
                        pattern="^\\d*\\.?\\d*$"
                        variant="filled"
                        autoComplete="off"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">RPS</InputAdornment>
                        }}
                        className="form-control"
                      />
                    </div>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <span>IN-GAME BALANCE:</span>
                          </TableCell>
                          <TableCell>
                            {convertToCurrency(balance, solPrice)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <span>TIP AMOUNT:</span>
                          </TableCell>
                          <TableCell style={{ color: 'red' }}>
                            {convertToCurrency(tipAmount * -1, solPrice)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <span>NEW BALANCE:</span>
                          </TableCell>
                          <TableCell>
                            {convertToCurrency(balance - tipAmount, solPrice)}&nbsp;
                            {balance - tipAmount < 0 && <Warning width="15pt" />}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    <div className="input-amount">
                      <Typography>Add Message?</Typography>
                       <TextField color="secondary" 
                        label="Message"
                        value={message}
                        onChange={handleMessage}
                        variant="filled"
                        autoComplete="off"
                        className="form-control"
                        inputProps={{ maxLength: 8 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant='contained' color='error' onClick={handleSendTip}>
                  Send Tip
                </Button>
                <Button variant='contained' color='secondary' onClick={handleCloseTipModal}>
                  Cancel
                </Button>
              </div>
            </div>
          </Modal>
        </Modal>
      )}
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