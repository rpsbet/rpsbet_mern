import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setBalance } from '../../redux/Auth/user.actions';
import Modal from 'react-modal';
import axios from '../../util/Api';
import { Warning, Link } from '@material-ui/icons';
import SettingsRef from '../../components/SettingsRef';
import {
  getMyGames,
  endGame,
  unstake,
  addNewTransaction,
  getStrategies,
  updateRoomStrategy
} from '../../redux/Logic/logic.actions';
import { getRank } from '../../util/getRank';
import { faFilter, faSort, faEdit, faPiggyBank, faMoneyCheckAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Battle from '../icons/Battle';
import blob from '../LottieAnimations/blob.json';
import {
  setGameMode,
  createRoom,
  reCreateRoom
} from '../../redux/Logic/logic.actions';
import { alertModal, confirmModalClosed, confirmModalCreate } from '../modal/ConfirmAlerts';
// import Pagination from '../../components/Pagination';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import AddCircleOutline from '@material-ui/icons/AddCircleOutline';
import EditOutline from '@material-ui/icons/EditOutlined';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/add';
import loadingChart from '../LottieAnimations/loadingChart';
import pressHold from '../LottieAnimations/pressHold.json';

import { Box, Button, ButtonGroup, Menu, MenuItem, Tooltip, IconButton, TextField, Table, TableBody, TableRow, TableCell, Radio, RadioGroup, FormControlLabel } from '@material-ui/core';
const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];
const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

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
      selectedSort: 'desc',
      creatingRoom: false,
      myGames: this.props.myGames,
      isLoading: true,
      selectedStrategy: null,
      isTopUpModalOpen: false,
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

    if (
      this.props.myGamesWithStats !== prevProps.myGamesWithStats) {
      this.setState({ myGames: this.props.myGames, isLoading: false })
    }

    if (prevProps.myGames !== this.props.myGames) {
      this.setState({ myGames: this.props.myGames, isLoading: false });
    }
  }

  handleSettingsIconClick = (row) => {
    if (!row.coHost) {
      this.setState({ settings_panel_opened: !this.state.settings_panel_opened, selectedRow: row });
    } else {
      alertModal(this.props.isDarkMode, "YOU ARE NOT THE HOST, UNABLE TO CHANGE STRATEGY.");
    }
  };

  fetchData = () => {
    const { selectedFilter, selectedGameType, selectedSort } = this.state;
    this.setState({
      myGames: this.props.myGames,
    });
    this.props.getStrategies();

    this.props.getMyGames({
      game_type: selectedGameType,
      status: selectedFilter === 'open' ? 'open' : 'finished',
      sort: selectedSort
    }, () => {
      this.setState({
        myGames: this.props.myGames,
      });
    });
  };

  handleTopUp = (row) => {
    this.setState({ isTopUpModalOpen: true, selectedRow: row });
  };

  handleCloseTopUpModal = () => {
    this.setState({ isTopUpModalOpen: false });
  };

  handleTopUpAmountChange = event => {
    this.setState({ topUpAmount: event.target.value });
  };

  handleSendTopUp = async () => {
    try {
      if (this.state.topUpAmount < 0) {
        alertModal(
          this.props.isDarkMode,
          `R U FURR-REAL? TOPUP AMOUNT MUST BE MORE THAN 0!`
        );
        return;
      }

      if (this.state.topUpAmount > this.props.balance) {
        alertModal(this.props.isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
        return;
      }

      this.setState({ isLoading: true });
      const result = await axios.post('/game/topUp/', {
        amount: this.state.topUpAmount,
        rowId: this.state.selectedRow._id,
      });

      if (result.data.success) {
        this.props.setBalance(result.data.balance);
        this.props.addNewTransaction(result.data.newTransaction);
        await this.fetchData();
        alertModal(this.props.isDarkMode, result.data.message, '-cat');
        this.setState({ isLoading: false });
        this.handleCloseTopUpModal();
      } else {
        this.setState({ isLoading: false });
        alertModal(this.props.isDarkMode, result.data.message);
      }
    } catch (e) {
      this.setState({ isLoading: false });
      if (this.state.amount <= 0) {
        alertModal(this.props.isDarkMode, `FAILED TRANSACTION`);
        return;
      }
    }
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
    try {
      if (this.state.payoutAmount < 0) {
        alertModal(
          this.props.isDarkMode,
          `R U FURR-REAL? PAYOUT AMOUNT MUST BE MORE THAN 0!`
        );
        return;
      }

      this.setState({ isLoading: true });
      const result = await axios.post('/game/editPayout/', {
        amount: this.state.payoutAmount,
        rowId: this.state.selectedRow._id,
      });

      if (result.data.success) {
        await this.fetchData();
        alertModal(this.props.isDarkMode, result.data.message, '-cat');
        this.setState({ isLoading: false });
        this.handleClosePayoutModal();
      } else {
        this.setState({ isLoading: false });
        alertModal(this.props.isDarkMode, result.data.message);
      }
    } catch (e) {
      this.setState({ isLoading: false });
      if (this.state.amount <= 0) {
        alertModal(this.props.isDarkMode, `Failed to adjust payout.`);
        return;
      }
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
        youtubeUrl: row.youtubeUrl,
        gameBackground: row.gameBackground,
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
    this.setState(prevState => ({
      [room_id]: {
        ...prevState[room_id],
        closing: true
      }
    }), async () => {
      try {
        await this.props.endGame(room_id);
        await this.props.getMyGames({
          game_type: this.state.selectedGameType,
          status: this.state.selectedFilter,
          sort: this.state.selectedSort
        });
        await this.props.addNewTransaction({ amount: winnings, room_id });
        this.props.setBalance(this.state.balance + parseFloat(winnings));
        this.fetchData();
      } catch (error) {
        console.error('Error ending room:', error);
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

  unstake = async (winnings, room_id) => {
    this.setState(prevState => ({
      [room_id]: {
        ...prevState[room_id],
        closing: true
      }
    }), async () => {
      try {
        await this.props.unstake(room_id);
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
      brain_game_type: this.props.brain_game_type,
      brain_game_score: this.state.score,
      bet_amount: this.props.bet_amount,
      is_private: this.props.is_private,
      selectedStrategy: this.props.selectedStrategy,
      endgame_amount: this.props.endgame_amount,
      // is_anonymous: this.props.is_anonymous,
      room_password: this.props.room_password,
      youtubeUrl: this.props.youtubeUrl,
      gameBackground: this.props.gameBackground

    });
  }

  render() {
    const { loading, strategies, user, updateRoomStrategy } = this.props;
    const { isLoading, anchorEl, selectedRow, selectedStrategy, settings_panel_opened, isFocused, selectedFilter, sortAnchorEl, selectedSort } = this.state;

    return (
      <div className="my-open-games">
        <div className="filter-container overflowX">

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
          <div className="create-room-btn-panel">
            <Button
              className="btn-create-room"
              onClick={this.handleCreateBtnClicked}
            >
              CREATE
            </Button>
          </div>
        </div>
        {isLoading && loading ? (
          <div className="loading-gif-container">
            <img src={randomGifUrl} id="isLoading" alt="loading" />
          </div>
        ) : (
          <div className="table my-open-game-table">
            {this.props.myGames.length > 0 && (
              <div className="table-header">
                <div className="table-cell room-id">Room ID</div>
                <div className="table-cell payout" style={{ paddingLeft: "100px", paddingRight: "20px" }}>
                  STAKE
                </div>
                <div className="table-cell winnings" style={{ paddingLeft: "40px" }}>Payout</div>
                <div className="table-cell bet-info" style={{ paddingLeft: "10px" }}>Net Profit</div>
                <div className="table-cell winnings">Plays</div>
                <div className="table-cell winnings desktop-only">Strategy</div>

                <div className="table-cell action desktop-only">Action</div>
              </div>
            )}
            {this.state.myGames.length === 0 ? (
              <div className="dont-have-game-msg">
                <Lottie options={defaultOptions} width={50} />
                <span>
                  CLICK "CREATE"
                </span>
              </div>
            ) : (
              this.state.myGames.map(
                (row, key) => (
                  <div
                    className={`table-row ${key < 10 ? 'slide-in' : 'slide-in'}`}
                    style={{ animationDelay: `${key * 0.1}s` }}
                    key={row._id}
                  >
                    <div>
                      <div className="table-cell room-id">
                        <a href={`/join/${row._id}`}>
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
                          <Link style={{ paddingRight: "5px", paddingLeft: "2.5px" }} />
                        </a>
                      </div>
                      <div className="table-cell bet-info">
                        <span className="bet-pr">
                          {convertToCurrency(row.winnings)}
                          <span className='desktop-only' style={{ fontSize: '10px' }}> ({((row.share).toFixed(2))}%)</span>
                        </span>

                        {selectedFilter === 'open' && (

                          <a
                            className="ml-1"
                            onClick={() => this.handleTopUp(row)}
                            style={{ color: "#ffb000", cursor: "pointer", borderRadius: "30px", display: "inline-flex", verticalAlign: "middle", marginBottom: "4px" }}
                          >
                            <AddCircleOutline />
                          </a>
                        )}
                      </div>

                      <div className="table-cell endgame">
                        <span className="end-amount">
                          {!row.endgame_type ? "M" : convertToCurrency(row.endgame_amount)}
                        </span>
                        {(!row.coHost) &&
                          (selectedFilter === 'open') && (
                            <a
                              className="ml-1"
                              onClick={() => this.handlePayout(row)}
                              style={{ color: "#ff0000", cursor: "pointer", borderRadius: "30px", display: "inline-flex", verticalAlign: "middle", marginBottom: "4px" }}
                            >
                              <EditOutline style={{ padding: "2.5px", width: "22px" }} />
                            </a>
                          )}
                      </div>
                      <div className="table-cell winnings">
                        <span>{convertToCurrency((row.winnings - row.stake))}</span>
                      </div>
                      {!this.props.myGamesWithStats ? (
                        <>
                          <div className="table-cell bets" style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                            <Battle width="24px" />
                            &nbsp;
                            <Lottie
                              options={{
                                loop: true,
                                autoplay: true,
                                animationData: loadingChart
                              }}
                              style={{
                                width: '32px'
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <>

                          <div className="table-cell bets">
                            <Battle width="24px" />
                            &nbsp;
                            <span>{row.bets}</span>
                          </div>

                        </>
                      )}
                      <div className="table-cell winnings desktop-only">

                        <Tooltip title="CHANGE AUTOPLAY STRATEGY">
                          <a
                            style={{ borderRadius: "200px", cursor: "pointer", padding: "1px", display: "flex", justifyContent: "center", alignItems: "center" }}
                            onClick={() => this.handleSettingsIconClick(row)}
                          >

                            <SettingsOutlinedIcon
                            />
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
                                {row.coHost ? (
                                  <Button
                                    className="btn_withdraw btn_end"
                                    onClick={() => this.unstake(row.winnings, row._id)}

                                  >
                                    Unstake
                                  </Button>
                                ) : (
                                  <Button
                                    className="btn_end"
                                    onMouseDown={() => this.handleButtonClick(row.winnings, row._id)}
                                    onMouseUp={() => this.handleButtonRelease(row._id)}
                                    onMouseLeave={() => this.handleButtonRelease(row._id)}
                                    onTouchStart={() => this.handleButtonClick(row.winnings, row._id)}
                                    onTouchEnd={() => this.handleButtonRelease(row._id)}
                                    onTouchCancel={() => this.handleButtonRelease(row._id)}
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
                                            loop: true,
                                            autoplay: true,
                                            animationData: pressHold
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        RUG
                                      </>
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
                      <div className="table-cell action" style={{ width: "auto", float: "right", display: "flex", flexDirection: "row", justifyContent: "space-between"}}>

                        <Tooltip title="CHANGE AUTOPLAY STRATEGY">
                          <a
                            style={{ borderRadius: "200px", cursor: "pointer", padding: "1px", display: "flex", justifyContent: "center", alignItems: "center" }}
                            onClick={() => this.handleSettingsIconClick(row)}
                          >

                            <SettingsOutlinedIcon
                            />
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
                                {row.coHost ? (
                                  <Button
                                    className="btn_withdraw btn_end"
                                    onClick={() => this.unstake(row.winnings, row._id)}

                                  >
                                    Unstake
                                  </Button>
                                ) : (
                                  <Button
                                    className="btn_end"
                                    onMouseDown={() => this.handleButtonClick(row.winnings, row._id)}
                                    onMouseUp={() => this.handleButtonRelease(row._id)}
                                    onMouseLeave={() => this.handleButtonRelease(row._id)}
                                    onTouchStart={() => this.handleButtonClick(row.winnings, row._id)}
                                    onTouchEnd={() => this.handleButtonRelease(row._id)}
                                    onTouchCancel={() => this.handleButtonRelease(row._id)}
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
                                            loop: true,
                                            autoplay: true,
                                            animationData: pressHold
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        RUG
                                      </>
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
          isOpen={this.state.isTopUpModalOpen}
          onRequestClose={this.handleCloseTopUpModal}
          style={customStyles}
          contentLabel="TopUp Modal"
        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">
                <FontAwesomeIcon icon={faPiggyBank} className="mr-2" />

                STAKE
              </h2>
              <Button className="btn-close" onClick={this.handleCloseTopUpModal}>
                ×
              </Button>
            </div>
            <div className="modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <div className="input-amount">

                    <TextField
                      label="Amount"
                      value={this.state.topUpAmount}
                      onChange={this.handleTopUpAmountChange}
                      pattern="^\\d*\\.?\\d*$"
                      variant="filled"
                      autoComplete="off"
                      id="payout"

                      className="form-control"
                      InputProps={{
                        onFocus: this.handleFocus,
                        endAdornment: !this.state.isFocused ? ' RPS ' : (
                          <ButtonGroup
                            className={isFocused ? 'fade-in' : 'fade-out'}
                          >
                            <Button
                              variant="contained"
                              color="secondary"
                              onClick={() => this.handleMaxButtonClick()}
                              style={{ marginRight: '-10px' }}
                            >
                              Max
                            </Button>
                          </ButtonGroup>
                        ),
                      }}
                    />
                  </div>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <span>IN-GAME BALANCE:</span>
                        </TableCell>
                        <TableCell>
                          {convertToCurrency(this.props.balance)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <span>TOP-UP AMOUNT:</span>
                        </TableCell>
                        <TableCell style={{ color: 'red' }}>
                          {convertToCurrency(this.state.topUpAmount * -1)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <span>CURRENT BANKROLL:</span>
                        </TableCell>
                        <TableCell style={{ color: "#ffb000" }}>
                          {this.state.selectedRow ? (
                            convertToCurrency(this.state.selectedRow.bet_amount)
                          ) : (
                            null
                          )}
                        </TableCell>

                      </TableRow>

                      <TableRow>
                        <TableCell>
                          <span>NEW BALANCE:</span>
                        </TableCell>
                        <TableCell>
                          {convertToCurrency(
                            this.props.balance - this.state.topUpAmount
                          )}
                          &nbsp;
                          {this.props.balance - this.state.topUpAmount <
                            0 && <Warning width="15pt" />}
                        </TableCell>

                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <span>NEW BANKROLL:</span>
                        </TableCell>
                        <TableCell style={{ color: "#ffb000" }}>
                          {this.state.selectedRow ? (
                            convertToCurrency(this.state.selectedRow.bet_amount + parseFloat(this.state.topUpAmount))
                          ) : (
                            null
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.handleSendTopUp}>
                TOP-UP
              </Button>
              <Button
                className="btn-back"
                onClick={this.handleCloseTopUpModal}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
        <Modal
          isOpen={this.state.isPayoutModalOpen}
          onRequestClose={this.handleClosePayoutModal}
          style={customStyles}
          contentLabel="Payout Modal"
        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">
                <FontAwesomeIcon icon={faMoneyCheckAlt} className="mr-2" />

                AUTO-PAYOUT
              </h2>
              <Button className="btn-close" onClick={this.handleClosePayoutModal}>
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
                          <TableCell style={{ color: "#ffb000" }}>
                            {this.state.selectedRow && this.state.selectedRow.endgame_type ? (
                              convertToCurrency(this.state.selectedRow.endgame_amount)
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
                      <h4 style={{ textAlign: "center", padding: "0" }}>Change Auto-Payout</h4>
                      <FormControlLabel value="manual" control={<Radio />} label="MANUAL" />
                      <FormControlLabel value="automatic" control={<Radio />} label="AUTOMATIC" />
                    </RadioGroup>

                    <div className="input-amount">
                      <TextField
                        label="Amount"
                        value={this.state.payoutAmount}
                        onChange={this.handlePayoutAmountChange}
                        pattern="^\\d*\\.?\\d*$"
                        variant="filled"
                        autoComplete="off"
                        InputProps={{
                          endAdornment: 'RPS'
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
  myGames: state.logic.myGames,
  myGamesWithStats: state.logic.myGamesWithStats,
  pageNumber: state.logic.myGamesPageNumber,
  socket: state.auth.socket,
  game_mode: state.logic.game_mode,
  balance: state.auth.balance,
  user: state.auth.user,
  strategies: state.logic.strategies,
  loading: state.logic.isActiveLoadingOverlay
});

const mapDispatchToProps = {
  endGame,
  unstake,
  createRoom,
  getMyGames,
  getStrategies,
  addNewTransaction,
  setGameMode,
  updateRoomStrategy,
  setBalance,
  reCreateRoom
};

export default connect(mapStateToProps, mapDispatchToProps)(MyGamesTable);
