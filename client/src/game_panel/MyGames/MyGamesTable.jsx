import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setBalance, updateTutorialCompleted } from '../../redux/Auth/user.actions';
import Modal from 'react-modal';
import { Skeleton } from '@material-ui/lab';
import { Info } from '@mui/icons-material';
import { Warning, Link } from '@mui/icons-material';
import SettingsRef from '../../components/SettingsRef';
import {
  getMyGames,
  unstake,
  addNewTransaction,
  getStrategies,
  updateRoomStrategy,
  editPayout,
  setGameMode,
  createRoom,
  reCreateRoom,
  getRoomList,
  endGame,
  coHost
} from '../../redux/Logic/logic.actions';
import { getRank } from '../../util/getRank';
import { faFilter, faSort, faEdit, faPiggyBank, faMoneyCheckAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Battle from '../icons/Battle';
import blob from '../LottieAnimations/blob.json';
import { alertModal, confirmModalClosed, confirmModalCreate } from '../modal/ConfirmAlerts';
// import Pagination from '../../components/Pagination';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import EditOutline from '@mui/icons-material/EditOutlined';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/add';
import loadingChart from '../LottieAnimations/loadingChart';
import pressHold from '../LottieAnimations/pressHold.json';
import Joyride from 'react-joyride';
import CoHostModal from '../modal/CoHostModal';
import { tutorialStepsCreate } from '../../util/tutorialStepsCreate';
import { InputAdornment, Button, ButtonGroup, Tooltip, TextField, Table, TableBody, TableRow, TableCell, Radio, RadioGroup, FormControlLabel } from '@material-ui/core';

const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];
const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];

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
    padding: 0
  }
};

class MyGamesTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedGameType: 'All',
      holding: false,
      timer: null,
      balance: this.props.balance,
      selectedFilter: 'open',
      anchorEl: null,
      closing: false,
      sortAnchorEl: null,
      run: !(this.props.user?.completedTutorials?.includes(3)),
      currentTutorial: 3,
      selectedSort: 'desc',
      creatingRoom: false,
      myGames: this.props.myGames,
      isCoHostModalOpen: false,
      isLoading: true,
      selectedStrategy: null,
      isPayoutModalOpen: false,
      selectedRow: null,
      paymentMethod: 'manual',
      payoutAmount: 0,
      isFocused: false,
      settings_panel_opened: false
    };
    this.settingsRef = React.createRef();
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleSettingsIconClick = this.handleSettingsIconClick.bind(this);
  }

  async componentDidMount() {
    await this.fetchData();
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.selectedFilter !== prevState.selectedFilter ||
      this.state.selectedSort !== prevState.selectedSort
    ) {
      this.fetchData();
    }

    if (prevProps.myGames !== this.props.myGames) {
      console.log("cd", prevProps.myGames, this.props.myGames)
      this.setState({ myGames: this.props.myGames, isLoading: false });
    }
  }


  handleCoHost = (row) => {
    this.setState({ isCoHostModalOpen: true, selectedRow: row });
  };

  handleCloseCoHostModal = () => {
    this.setState({ isCoHostModalOpen: false });
  };

  handleCoHostAmountChange = event => {
    this.setState({ coHostAmount: event.target.value });
  };


  handleSendCoHost = async () => {
    const { coHostAmount, selectedRow } = this.state;
    const { balance, isDarkMode, setBalance, addNewTransaction, getRoomList, selectedGameType } = this.props;

    try {
      if (coHostAmount <= 0) {
        alertModal(isDarkMode, 'R U FURR-REAL? AMOUNT MUST BE MORE THAN 0!');
        return;
      }

      if (coHostAmount > balance) {
        alertModal(isDarkMode, 'NOT ENUFF FUNDS AT THIS MEOWMENT');
        return;
      }

      const result = await this.props.coHost(coHostAmount, selectedRow._id);
      if (result.success) {
        // alertModal(isDarkMode, result.message, '-cat');
        setBalance(result.balance);
        addNewTransaction(result.newTransaction);
        await getRoomList({
          game_type: 'All',
        });
      } else {
        alertModal(isDarkMode, result.message);
      }
    } catch (e) {
      alertModal(isDarkMode, 'ROOM TOO BUSY, TRY AGAIN LATER');
    }
  };

  handleSettingsIconClick = (event, row) => {
    event.preventDefault(); // Prevent the default action
    event.stopPropagation();
    if (row.coHost) {
      this.setState({ settings_panel_opened: !this.state.settings_panel_opened, selectedRow: row });
    } else {
      alertModal(this.props.isDarkMode, "YOU MUST OWN 100% TO CHANGE STRATEGY.");
    }
  };

  fetchData = () => {
    const { selectedFilter, selectedGameType, selectedSort } = this.state;
  
    // Quick return of myGames from props/localStorage
    this.setState({ myGames: this.props.myGames });
  
    // Fetch strategies in the background
    this.props.getStrategies();
  
    // Fetch updated games in the background
    this.props.getMyGames(
      {
        game_type: selectedGameType,
        status: selectedFilter === 'open' ? 'open' : 'finished',
        sort: selectedSort
      },
      updatedGames => {
        // Update the state with the new data when available
        this.setState({ myGames: updatedGames });
      }
    );
  };


  handlePayout = (row) => {
    let paymentMethod = 'automatic';
    let payoutAmount = row.endgame_amount;

    if (!row.endgame_type) {
      paymentMethod = 'manual';
    }

    this.setState({
      isPayoutModalOpen: true,
      selectedRow: row,
      paymentMethod: paymentMethod,
      payoutAmount: payoutAmount
    });
  };



  handleClosePayoutModal = () => {
    this.setState({ isPayoutModalOpen: false });
  };

  handlePayoutAmountChange = event => {
    this.setState({ payoutAmount: event.target.value });
  };

  handleSendPayout = async () => {
    const { payoutAmount, selectedRow } = this.state;
    const { isDarkMode, editPayout } = this.props;

    try {
      if (payoutAmount <= 0) {
        alertModal(isDarkMode, 'R U FURR-REAL? PAYOUT AMOUNT MUST BE MORE THAN 0!');
        return;
      }

      this.setState({ isLoading: true });

      const result = await editPayout(payoutAmount, selectedRow._id);
      if (result.success) {
        await this.fetchData();
        alertModal(isDarkMode, result.message, '-cat');
        this.handleClosePayoutModal();
      } else {
        alertModal(isDarkMode, result.message);
      }
    } catch (e) {
      alertModal(isDarkMode, 'Failed to adjust payout.');
    } finally {
      this.setState({ isLoading: false });
    }
  };

  handlePaymentMethodChange = (event) => {
    const selectedMethod = event.target.value;
    this.setState({ paymentMethod: selectedMethod });
    if (selectedMethod !== 'manual') {
      this.setState({ payoutAmount: this.state.selectedRow.endgame_amount });
    } else {
      this.setState({ payoutAmount: 0 });
    }
  };

  handleFilterClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleFilterClose = filter => {
    this.setState({ anchorEl: null, selectedFilter: filter });
  };

  handleSortClick = event => {
    this.setState({ sortAnchorEl: event.currentTarget });
  };

  handleSortClose = selectedSort => {
    this.setState({ sortAnchorEl: null, selectedSort });
  };

  openRecreateModal = (row) => {
    alertModal(this.props.isDarkMode, `YOU DO NOT OWN A GAME RESTORER. GO TO MARKETPLACE TO PURCHASE`);
    return;
  }

  onCreateRoom = async (row) => {
    if (localStorage.getItem('hideConfirmModal') === 'true') {
      this.setState({ creatingRoom: true });
      await this.props.createRoom({
        game_type: row.game_type,
        bet_amount: row.bet_amount,
        endgame_amount: row.endgame_amount,
      });

      this.setState({ creatingRoom: false });
    } else {
      confirmModalCreate(
        this.props.isDarkMode,
        'CONFIRM GAME SETTINGS?',
        'LFG',
        'Cancel',
        async () => {
          this.setState({ creatingRoom: true });
          await this.props.createRoom(this.state);
          this.setState({ creatingRoom: false });
        }
      );
    }
  };


  handleButtonClick = (winnings, room_id) => {
    const startTime = 400;
    const updateInterval = 10;
    let countdown = startTime;
    const timer = setInterval(() => {
      countdown -= updateInterval;
      if (countdown <= 0) {
        clearInterval(timer);
        this.endRoom(winnings, room_id);
        this.setState(prevState => ({
          [room_id]: {
            ...prevState[room_id],
            holding: false,
            timeLeft: 0
          }
        }));
      } else {
        this.setState(prevState => ({
          [room_id]: {
            ...prevState[room_id],
            timeLeft: countdown
          }
        }));
      }
    }, updateInterval);

    this.setState(prevState => ({
      [room_id]: {
        ...prevState[room_id],
        holding: true,
        timeLeft: startTime,
        timer: timer
      }
    }));
  };

  handleButtonRelease = room_id => {
    if (this.state[room_id] && this.state[room_id].timer) {
      clearTimeout(this.state[room_id].timer);
    }
    this.setState({
      [room_id]: { holding: false }
    });
  };

  endRoom = async (winnings, room_id) => {
    console.log("winnings, room_id", winnings, room_id);
    this.setState(prevState => ({
      [room_id]: {
        ...prevState[room_id],
        closing: true
      }
    }), async () => {
      try {
        await this.props.endGame(room_id);
        await this.props.addNewTransaction({ amount: winnings, room_id });
        this.props.setBalance(this.state.balance + parseFloat(winnings));
      } catch (error) {
        console.error('Error ending room:', error);
      } finally {
        this.setState(prevState => ({
          [room_id]: {
            ...prevState[room_id],
            closing: false
          }
        }));
    console.log("finishedeeddd");

      }
    });
  };

  unstake = async (winnings, room_id, stakeAmount) => {
    this.setState(prevState => ({
      [room_id]: {
        ...prevState[room_id],
        closing: true
      }
    }), async () => {
      try {
        await this.props.unstake(room_id, stakeAmount);
        await this.props.getMyGames({
          game_type: this.state.selectedGameType,
          status: this.state.selectedFilter,
          sort: this.state.selectedSort
        });
        await this.props.addNewTransaction({ amount: winnings, room_id });
        this.props.setBalance(this.state.balance + parseFloat(winnings));
        this.fetchData();
      } catch (error) {
        console.error('Error unstaking from room:', error);
      } finally {
        this.setState(prevState => ({
          [room_id]: {
            ...prevState[room_id],
            closing: false
          }
        }));
      }
    });
  };

  handleJoyrideCallback = (data) => {
    const { status, type } = data;

    if (status === 'finished' || status === 'skipped') {
      const { currentTutorial } = this.state;
      this.props.updateTutorialCompleted(currentTutorial);
      this.setState({ run: false });
    }
  };

  handleGameTypeButtonClicked = async short_name => {
    this.setState({ selectedGameType: short_name }, () => {
      this.props.getMyGames({
        game_type: short_name,
        status: this.state.selectedFilter,
        sort: this.state.selectedSort
      });
      return;
    });

  };

  handleClickOutside = e => {
    if (
      this.settingsRef &&
      this.settingsRef.current &&
      !this.settingsRef.current.contains(e.target)
    ) {
      this.setState({ settings_panel_opened: false });
    }
  };

  handleMaxButtonClick = () => {
    if (this.props.balance) {
      const maxPayoutAmount = this.state.balance;
      const roundedMaxPayoutAmount = Math.floor(maxPayoutAmount * 1e6) / 1e6;
      this.setState(
        {
          topUpAmount: roundedMaxPayoutAmount,
        },
        () => {
          document.getElementById('payout').focus();
        }
      );
    }
  };

  handleFocus = () => {
    this.setState({ isFocused: true });
  };

  setSelectedStrategy = (selectedStrategy) => {
    this.setState({ selectedStrategy });
  }

  handleCreateBtnClicked = e => {
    e.preventDefault();
    if (!this.state.selectedGameType) {
      alertModal(this.props.isDarkMode, `SELECT A GAME FURR-ST!!!`);
      return;
    }
    this.props.setGameMode('');
    history.push(`/create/`);
  };


  createRoom() {
    this.props.createRoom({
      game_type: 3,
      bet_amount: this.props.bet_amount,
      is_private: this.props.is_private,
      selectedStrategy: this.props.selectedStrategy,
      endgame_amount: this.props.endgame_amount,
      room_password: this.props.room_password,

    });
  }

  render() {
    const { loading, strategies, solPrice, updateRoomStrategy, isLowGraphics, isDarkMode } = this.props;
    const { isLoading, anchorEl, coHostAmount, selectedRow, selectedStrategy, settings_panel_opened, isFocused, selectedFilter, sortAnchorEl, selectedSort } = this.state;
    const defaultOptions = {
      loop: this.props.isLowGraphics ? false : true,
      autoplay: this.props.isLowGraphics ? false : true,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
      }
    };

    return (
      <div className="my-open-games">
        <div className="filter-container overflowX">
          <Joyride
            steps={tutorialStepsCreate}
            run={this.state.run}
            callback={this.handleJoyrideCallback}
            continuous
            showProgress
            showSkipButton
            styles={{
              options: {
                zIndex: 10000,
                backgroundColor: isDarkMode ? 'rgb(208 0 47)' : '#ccc9',
                primaryColor: '#ff0000',
                arrowColor: isDarkMode ? 'rgb(208 0 47)' : '#ccc9',
                textColor: isDarkMode ? '#f9f9f9' : '#333',
                width: 300,
                padding: 20,
                borderRadius: 5,
              },
              buttonClose: {
                borderRadius: '0.3em',
                color: isDarkMode ? '#f9f9f9' : '#333',
              },
              buttonBack: {
                borderRadius: '0.3em',
                color: isDarkMode ? '#f9f9f9' : '#333',
              },
              buttonNext: {
                borderRadius: '0.3em',
                color: isDarkMode ? '#f9f9f9' : '#333',
              },
              buttonSkip: {
                borderRadius: '0.3em',
                color: isDarkMode ? '#f9f9f9' : '#333',
              },
            }}
          />

          {selectedRow && (

            <SettingsRef
              strategies={strategies}
              ai_mode={selectedRow.selectedStrategy}
              user_id={selectedRow._id}
              rank={getRank(this.props.user.totalWagered)}
              settings_panel_opened={settings_panel_opened}
              setSelectedStrategy={this.setSelectedStrategy}
              settingsRef={this.settingsRef}
              selectedStrategy={selectedStrategy}
              updateUserStrategy={updateRoomStrategy}
            />
          )}

        </div>
        {isLoading && loading ? (
          <>
          {[...Array(5)].map((_, key) => (  // You can adjust the number of skeleton rows
            <div
              className="table-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 2fr 1fr 2fr 2fr",
                gap: "10px",
                padding: "10px 20px",
                animationDelay: `${key * 0.1}s`,
              }}
              key={key}
            >
              <Skeleton variant="rect" width="100%" height={40} />
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="50%" height={20} />
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="90%" height={20} />
            </div>
          ))}
          </>

        ) : (
          <div className="table my-open-game-table">
            {this.props.myGames && this.props.myGames.length > 0 && (
              <div
                className="table-header"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 2fr 1fr 2fr 2fr", // Define column widths
                  gap: "10px", // Spacing between cells
                  alignItems: "center",
                  padding: "10px 20px",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                <div className="table-cell mobile-only"></div>
                <div className="table-cell room-id">Room ID</div>
                <div className="table-cell "></div>
                <div className="table-cell winnings">LQY / SHARE</div>
                <div className="table-cell payout">Payout</div>
                <div className="table-cell bet-info">
                  Net Profit&nbsp;
                  <Tooltip title="NOT INCLUDING FEES">
                    <Info style={{ width: "18px", cursor: "pointer" }} />
                  </Tooltip>
                </div>
                <div className="table-cell winnings ">PLAYS</div>
                <div className="table-cell action desktop-only">Action</div>
              </div>
            )}
            {this.props.myGames && this.props.myGames.length === 0 ? (
              <div className="dont-have-game-msg">
                <Lottie options={defaultOptions} width={50} />
                <span>
                  You Have No Games
                </span>
              </div>
            ) : (
              this.props.myGames?.map(
                (row, key) => (
                  <div
                    className={`table-row ${key < 10 ? 'slide-in' : 'slide-in'}`}
                    style={{ animationDelay: `${key * 0.1}s`, cursor: "pointer" }}
                    key={row._id}
                    onClick={() => history.push(`/join/${row._id}`)}
                  >
                    <div>
                      <div className="table-cell room-id">

                        <img
                          src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                          alt=""
                          className="game-type-icon"
                        />
                        {row.game_type.short_name + '-' + row.index}
                        {row.is_private && (
                          <img
                            src="/img/icon-lock.png"
                            alt=""
                            className="lock-icon"
                          />
                        )}

                      </div>
                      <div className="table-cell bet-info">
                        <span className="bet-pr">
                          {convertToCurrency(row.user_bet, solPrice)}<br className='mobile-only' />
                          <span style={{ fontSize: '10px' }}> / {((row.share).toFixed(2))}%</span>
                        </span>
                      </div>

                      <div className="table-cell endgame">
                        <span className="end-amount">
                          {!row.endgame_type ? "M" : convertToCurrency(row.endgame_amount, solPrice)}
                        </span>
                        {(row.coHost) &&
                          (selectedFilter === 'open') && (
                            <a
                              className="ml-1"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                this.handlePayout(row);
                              }}
                              style={{
                                color: "#ff0000",
                                cursor: "pointer",
                                borderRadius: "30px",
                                display: "inline-flex",
                                verticalAlign: "middle",
                                marginBottom: "4px",
                              }}
                            >
                              <EditOutline style={{ padding: "2.5px", width: "22px" }} />
                            </a>
                          )}
                      </div>
                      <div className="table-cell winnings">
                        <span>{row.coHost ? convertToCurrency((row.share / 100 * parseFloat(row.user_bet)) - row.initial_stake, solPrice) : convertToCurrency((row.share / 100 * parseFloat(row.user_bet)) - row.initial_stake, solPrice)}&nbsp;
                        </span>

                      </div>


                      <div className="table-cell bets" style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>

                        <Battle width="24px" />
                        &nbsp;
                        <span>{row.battles}</span>
                      </div>

                      <div className="table-cell winnings desktop-only">

                        <Tooltip title="CHANGE AI PLAY STRATEGY">
                          <a
                            style={{
                              borderRadius: "200px",
                              cursor: "pointer",
                              padding: "1px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              this.handleSettingsIconClick(event, row);
                            }}
                          >
                            <SettingsOutlinedIcon />
                          </a>
                        </Tooltip>
                      </div>
                      <div className="table-cell action desktop-only">
                        {row.status === 'finished' ? (
                          <Button
                            className="btn_recreate"
                            onClick={() => this.openRecreateModal(row)}
                          >
                            RE-CREATE
                          </Button>
                        ) : (
                          <div>
                            {this.state[row._id] && this.state[row._id].closing ? (
                              <span style={{ color: 'red' }}>closing...</span>
                            ) : (
                              <div>
                                {!row.coHost ? (
                                  <Button
                                    className="btn_withdraw btn_end"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleCoHost(row);
                                    }}
                                  >
                                    TRADE
                                  </Button>
                                ) : (
                                  <Button
                                    className="btn_end"
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonClick(row.winnings, row._id);
                                    }}
                                    onMouseUp={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonRelease(row._id);
                                    }}
                                    onMouseLeave={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonRelease(row._id);
                                    }}
                                    onTouchStart={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonClick(row.winnings, row._id);
                                    }}
                                    onTouchEnd={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonRelease(row._id);
                                    }}
                                    onTouchCancel={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonRelease(row._id);
                                    }}
                                    _id={row._id}
                                    style={
                                      this.state[row._id] && this.state[row._id].holding
                                        ? { filter: 'hue-rotate(-10deg)' }
                                        : {}
                                    }
                                  >
                                    {this.state[row._id] && this.state[row._id].holding ? (
                                      <>
                                        <span style={{ position: 'absolute', zIndex: '2' }}>
                                          {(this.state[row._id].timeLeft / 100).toFixed(1)}
                                          <span style={{ paddingTop: '5px', fontSize: 'xx-small' }}>s</span>
                                        </span>
                                        <Lottie
                                          options={{
                                            loop: isLowGraphics ? false : true,
                                            autoplay: isLowGraphics ? false : true,
                                            animationData: pressHold
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>RUG</>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mobile-only" style={{ display: "table" }}>
                      <div className="table-cell action" style={{ width: "auto", float: "right", display: "flex", flexDirection: "row", justifyContent: "space-between" }}>

                        <Tooltip title="CHANGE AI PLAY STRATEGY">
                          <a
                            style={{
                              borderRadius: "200px",
                              cursor: "pointer",
                              padding: "1px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              this.handleSettingsIconClick(row);
                            }}
                          >
                            <SettingsOutlinedIcon />
                          </a>
                        </Tooltip>
                        {row.status === 'finished' ? (
                          <Button
                            className="btn_recreate"
                            onClick={() => this.openRecreateModal(row)}
                          >
                            RE-CREATE
                          </Button>
                        ) : (
                          <div>
                            {this.state[row._id] && this.state[row._id].closing ? (
                              <span style={{ color: 'red' }}>closing...</span>
                            ) : (
                              <div>
                                {!row.coHost ? (
                                  <Button
                                    className="btn_withdraw btn_end"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleCoHost(row);
                                    }}
                                  >
                                    TRADE
                                  </Button>
                                ) : (
                                  <Button
                                    className="btn_end"
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonClick(row.winnings, row._id);
                                    }}
                                    onMouseUp={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonRelease(row._id);
                                    }}
                                    onMouseLeave={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonRelease(row._id);
                                    }}
                                    onTouchStart={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonClick(row.winnings, row._id);
                                    }}
                                    onTouchEnd={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonRelease(row._id);
                                    }}
                                    onTouchCancel={(event) => {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      this.handleButtonRelease(row._id);
                                    }}
                                    _id={row._id}
                                    style={
                                      this.state[row._id] && this.state[row._id].holding
                                        ? { filter: 'hue-rotate(-10deg)' }
                                        : {}
                                    }
                                  >
                                    {this.state[row._id] && this.state[row._id].holding ? (
                                      <>
                                        <span style={{ position: 'absolute', zIndex: '2' }}>
                                          {(this.state[row._id].timeLeft / 100).toFixed(1)}
                                          <span style={{ paddingTop: '5px', fontSize: 'xx-small' }}>s</span>
                                        </span>
                                        <Lottie
                                          options={{
                                            loop: isLowGraphics ? false : true,
                                            autoplay: isLowGraphics ? false : true,
                                            animationData: pressHold
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>RUG</>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ),
                this
              )
            )}
          </div>
        )}

        <Modal
          isOpen={this.state.isCoHostModalOpen}
          onRequestClose={this.handleCloseCoHostModal}
          style={customStyles}
          contentLabel="CoHost Modal"
        >
          <CoHostModal
            isDarkMode={this.props.isDarkMode}
            coHostAmount={coHostAmount}
            selectedRow={selectedRow}
            balance={this.props.balance}
            user={this.props.user}
            togglePopup={this.togglePopup}
            handleClose={this.handleCloseCoHostModal}
            handleSendCoHost={this.handleSendCoHost}
            handleCoHostAmountChange={this.handleCoHostAmountChange}
            has_joined={false}
            input_only={false}
            solPrice={solPrice}
          />
        </Modal>
        <Modal
          isOpen={this.state.isPayoutModalOpen}
          onRequestClose={this.handleClosePayoutModal}
          style={customStyles}
          contentLabel="Payout Modal"
        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title title">
                <FontAwesomeIcon icon={faMoneyCheckAlt} className="mr-2" />

                AUTO-PAYOUT
              </h2>
              <Button className="btn-close title" onClick={this.handleClosePayoutModal}>
                ×
              </Button>
            </div>
            <div className="modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <div>
                    <Table>
                      <TableBody>

                        <TableRow>
                          <TableCell>
                            <span>CURRENT PAYOUT:</span>
                          </TableCell>
                          <TableCell style={{ color: "#ff8500" }}>
                            {this.state.selectedRow && this.state.selectedRow.endgame_type ? (
                              convertToCurrency(this.state.selectedRow.endgame_amount, solPrice)
                            ) : (
                              <span>MANUAL</span>
                            )}
                          </TableCell>

                        </TableRow>

                      </TableBody>
                    </Table>
                    <RadioGroup
                      aria-label="paymentMethod"
                      name="paymentMethod"
                      value={this.state.paymentMethod}
                      onChange={this.handlePaymentMethodChange}
                    >
                      <h4 className="title" style={{ textAlign: "center", padding: "0" }}>Change Auto-Payout</h4>
                      <FormControlLabel value="manual" control={<Radio />} label="MANUAL" />
                      <FormControlLabel value="automatic" control={<Radio />} label="AUTOMATIC" />
                    </RadioGroup>

                    <div className="input-amount">
                      <TextField
                        label="Amount"
                        value={this.state.payoutAmount || 0}
                        type="number"
                        onChange={this.handlePayoutAmountChange}
                        pattern="^\\d*\\.?\\d*$"
                        variant="filled"
                        autoComplete="off"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              &nbsp;RPS
                            </InputAdornment>
                          ),
                        }}
                        className="form-control"
                        disabled={this.state.paymentMethod === "manual"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.handleSendPayout}>
                Update
              </Button>
              <Button
                className="btn-back"
                onClick={this.handleClosePayoutModal}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  isLowGraphics: state.auth.isLowGraphics,
  myGames: state.logic.myGames,
  pageNumber: state.logic.myGamesPageNumber,
  game_mode: state.logic.game_mode,
  balance: state.auth.balance,
  user: state.auth.user,
  strategies: state.logic.strategies,
  strategies: state.logic.solPrice,
  solPrice: state.logic.solPrice
});

const mapDispatchToProps = {
  unstake,
  createRoom,
  getMyGames,
  getStrategies,
  coHost,
  addNewTransaction,
  setGameMode,
  updateRoomStrategy,
  setBalance,
  reCreateRoom,
  editPayout,
  endGame,
  updateTutorialCompleted
};

export default connect(mapStateToProps, mapDispatchToProps)(MyGamesTable);
