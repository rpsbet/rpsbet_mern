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

import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import AddCircleOutline from '@material-ui/icons/AddCircleOutline';
import EditOutline from '@material-ui/icons/EditOutlined';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/add';
import loadingChart from '../LottieAnimations/loadingChart';
import pressHold from '../LottieAnimations/pressHold.json';
import InlineSVG from 'react-inlinesvg';
import busdSvg from '../JoinGame/busd.svg';

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
      // Filter value has changed, re-fetch data
      this.fetchData();
    }

    if (
      this.props.myGamesWithStats !== prevProps.myGamesWithStats) {
        console.log("this.props.myGamesWithStats", this.props.myGamesWithStats)
      this.setState({ myGames: this.props.myGames, isLoading: false })
    }

    if (prevProps.myGames !== this.props.myGames) {
      console.log("wed", this.props.myGames)
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
        alertModal(this.props.isDarkMode, `Failed transaction.`);
        return;
      }
    }
  };
  handlePayout = (row) => {
    let paymentMethod = 'automatic';
    let payoutAmount = row.endgame_amount;

    if (row.endgame_amount === 0) {
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
    // Update the payment method state
    this.setState({ paymentMethod: selectedMethod });
    // If "manual" is selected, set the payoutAmount to "0"
    if (selectedMethod !== 'manual') {
      this.setState({ payoutAmount: this.state.selectedRow.bet_amount });
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
    // confirmModalCreate(
    //   this.props.isDarkMode,
    //   'CONFIRM RE-CREATE GAME?',
    //   'LFG',
    //   'Fuck No',
    //   async () => {
    //     this.setState({ creatingRoom: true });
    //     await this.props.reCreateRoom(row._id);
    //     this.setState({ creatingRoom: false });
    //   }
    // );
  }

  onCreateRoom = async (row) => {

    if (localStorage.getItem('hideConfirmModal') === 'true') {
      this.setState({ creatingRoom: true });
      await this.props.createRoom({
        game_type: row.game_type,
        bet_amount: row.bet_amount,
        endgame_amount: row.endgame_amount,
        // is_anonymous: row.is_anonymous,
        youtubeUrl: row.youtubeUrl,
        gameBackground: row.gameBackground,

      }
      );

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

  // endRoom = (winnings, room_id) => {
  //   const convertToCurrency = input => {
  //     let number = Number(input);
  //     if(!isNaN(number)){
  //       let [whole, decimal] = number.toFixed(2).toString().split('.');
  //       whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  //       return <><InlineSVG src={`<svg id='busd' width="0.7em" height="0.7em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 336.41 337.42"><defs><style>.cls-1{fill:#f0b90b;stroke:#f0b90b;}</style></defs><title>BUSD Icon</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M168.2.71l41.5,42.5L105.2,147.71l-41.5-41.5Z"/><path class="cls-1" d="M231.2,63.71l41.5,42.5L105.2,273.71l-41.5-41.5Z"/><path class="cls-1" d="M42.2,126.71l41.5,42.5-41.5,41.5L.7,169.21Z"/><path class="cls-1" d="M294.2,126.71l41.5,42.5L168.2,336.71l-41.5-41.5Z"/></g></g></svg>`} /> {`${whole}.${decimal}`}</>;
  //     }else{
  //       return input;
  //     }
  //   };
  //   confirmModalClosed(
  //     true,
  //     `TERMINATE GAME?`, //   YOU WILL TAKE  ${updateDigitToPoint2(winnings)} BUSD
  //     'Okay',
  //     'Cancel',
  //     () => {
  //       this.props.endGame(room_id, () => {
  //         this.props.getMyGames({
  //           game_type: this.state.selectedGameType
  //         });
  //       });
  //     }
  //   );
  // };

  handleButtonClick = (winnings, room_id) => {

    let startTime = 700;
    const updateInterval = 10; // Interval in milliseconds
    const updatesPerInterval = 1; // Update the display every interval

    this.setState({
      [room_id]: {
        holding: true,
        timeLeft: startTime,
        timer: setInterval(() => {
          this.setState(prevState => {
            let timeLeft = prevState[room_id].timeLeft - updateInterval * updatesPerInterval;
            if (timeLeft <= 0) {
              clearInterval(prevState[room_id].timer);
              timeLeft = 0;
              this.endRoom(winnings, room_id);
            }
            return {
              [room_id]: {
                ...prevState[room_id],
                timeLeft
              }
            };
          });
        }, updateInterval)
      }
    });
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

    // Set the closing state to indicate the process
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
        // Reset the closing state once the operation is done
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
    // Set the closing state to indicate the process
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
        // Reset the closing state once the operation is done
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

  handleBtnLeftClicked = e => {
    const scrollAmount = 200; // Change this value to adjust the scroll amount
    this.game_type_panel.scrollLeft -= scrollAmount;
  };

  handleBtnRightClicked = e => {
    const scrollAmount = 200; // Change this value to adjust the scroll amount
    this.game_type_panel.scrollLeft += scrollAmount;
  };

  generateGameTypePanel = () => {
    const gameTypeStyleClass = {
      R: 'roll',
      RPS: 'rps',
      'S!': 'spleesh',
      MB: 'mystery-box',
      BG: 'brain-game',
      QS: 'quick-shoot',
      DG: 'drop-game',
      'B!': 'bang',
      BJ: 'blackjack',
      CR: 'craps'
    };

    const gameTypePanel = (
      <Box
        display="flex"
        justifyContent="space-evenly"
        flexWrap="nowrap"
        gap="15px"
        ref={ref => (this.game_type_panel = ref)}
      >
        <Box item key="open-game-left-button">
          <Button
            className="btn-arrow-left"
            onClick={this.handleBtnLeftClicked}
          >
            <ChevronLeftIcon />
          </Button>
        </Box>

        <Button
          className={`btn-game-type btn-icon all-games ${this.state.selectedGameType === 'All' ? 'active' : ''
            }`}
          key="open-game-all-game-button"
          onClick={() => {
            this.handleGameTypeButtonClicked('All');
          }}
        >
          {this.state.selectedGameType === 'All' && (
            <Lottie
              options={{
                loop: false,
                autoplay: false,
                animationData: blob
              }}
              style={{
                width: '100px',
                position: 'absolute',
                filter: 'hue-rotate(222deg)',
                opacity: '0.4',
                margin: '0px -18px 0 auto',
                zIndex: '0'
              }}
            />
          )}
          <div className="icon" style={{
            zIndex: '1'
          }}>
            <img src={`/img/gametype/icons/All.svg`} alt={`All Games`} />
            <span>All Games</span>
          </div>
        </Button>
        {this.props.gameTypeList.map((gameType, index) => (
          <Button
            className={`btn-game-type btn-icon ${gameTypeStyleClass[gameType.short_name]
              } ${this.state.selectedGameType === gameType.short_name
                ? 'active'
                : ''
              }`}
            key={index}
            onClick={() => {
              this.handleGameTypeButtonClicked(gameType.short_name);
            }}
          >
            {this.state.selectedGameType === gameType.short_name && (
              <Lottie
                options={{
                  loop: false,
                  autoplay: false,
                  animationData: blob
                }}
                style={{
                  width: '100px',
                  position: 'absolute',
                  // filter: 'hue-rotate(222deg)',
                  opacity: '0.4',
                  margin: '0px -18px 0 auto',
                  zIndex: '0'
                }}
              />
            )}
            <div className="icon" style={{
              zIndex: '1'
            }}>
              <img
                src={`/img/gametype/icons/${gameType.short_name}.svg`}
                alt={gameType.game_type_name}
              />
              <span>{gameType.game_type_name}</span>
            </div>
          </Button>
        ))}
        <Button
          className="btn-arrow-right"
          key="open-game-right-button"
          onClick={this.handleBtnRightClicked}
        >
          <ChevronRightIcon />
        </Button>
      </Box>
    );

    return gameTypePanel;
  };

  handlePageNumberClicked = page => {
    this.props.getMyGames({
      page: page,
      game_type: this.state.selectedGameType,
      status: this.state.selectedFilter,
      sort: this.state.selectedSort
    });
  };

  handlePrevPageClicked = () => {
    if (this.props.pageNumber === 1) return;
    this.props.getMyGames({
      page: this.props.pageNumber - 1,
      game_type: this.state.selectedGameType,
      status: this.state.selectedFilter,
      sort: this.state.selectedSort
    });
  };

  handleNextPageClicked = () => {
    if (this.props.pageNumber === this.props.totalPage) return;
    this.props.getMyGames({
      page: this.props.pageNumber + 1,
      game_type: this.state.selectedGameType,
      status: this.state.selectedFilter,
      sort: this.state.selectedSort
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
    // Check if there's a selectedLoan
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
    const selectedGameType = this.props.gameTypeList.find(
      gameType => gameType.short_name === this.state.selectedGameType
    );
    if (selectedGameType) {
      this.props.setGameMode(selectedGameType.game_type_name);
      history.push(`/create/${selectedGameType.game_type_name}`);
    } else {
      this.props.setGameMode('');
      history.push(`/create/`);
    }
  };


  createRoom() {
    this.props.createRoom({
      game_type: 3,
      brain_game_type: this.props.brain_game_type,
      brain_game_score: this.state.score,
      bet_amount: this.props.bet_amount,
      is_private: this.props.is_private,
      endgame_amount: this.props.endgame_amount,
      is_anonymous: this.props.is_anonymous,
      room_password: this.props.room_password,
      youtubeUrl: this.props.youtubeUrl,
      gameBackground: this.props.gameBackground

    });
  }

  render() {
    const gameTypePanel = this.generateGameTypePanel();
    const { loading, strategies, user, updateRoomStrategy } = this.props;
    const { isLoading, anchorEl, selectedRow, selectedStrategy, settings_panel_opened, isFocused, selectedFilter, sortAnchorEl, selectedSort } = this.state;

    return (
      <div className="my-open-games">
        <div className="filter-container overflowX">
          {/* <div className="game-type-container">
            <div
              className="game-type-panel"
              ref={elem => {
                this.game_type_panel = elem;
              }}
            >
              {gameTypePanel}
            </div>
          </div> */}
          {/* <div className="filters">
            <Button
              className="game-type-panel"
              onClick={this.handleFilterClick}
            // variant="contained"
            >
              <FontAwesomeIcon icon={faFilter} />
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => this.handleFilterClose(null)}
            >
              <MenuItem
                onClick={() => this.handleFilterClose('open')}
                selected={selectedFilter === 'open'}
              >
                OPEN
              </MenuItem>
              <MenuItem
                onClick={() => this.handleFilterClose('finished')}
                selected={selectedFilter === 'finished'}
              >
                FINISHED
              </MenuItem>
            </Menu>
            <Button
              className="game-type-panel"
              onClick={this.handleSortClick}
            // variant="contained"
            >
              <FontAwesomeIcon icon={faSort} />
            </Button>
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={() => this.handleSortClose(null)}
            >
              <MenuItem
                onClick={() => this.handleSortClose('desc')}
                selected={selectedSort === 'desc'}
              >
                Newest First
              </MenuItem>
              <MenuItem
                onClick={() => this.handleSortClose('asc')}
                selected={selectedSort === 'asc'}
              >
                Oldest First
              </MenuItem>
              <MenuItem
                onClick={() => this.handleSortClose('net_profit_desc')}
                selected={selectedSort === 'net_profit_desc'}
              >
                Net Profit (High to Low)
              </MenuItem>
              <MenuItem
                onClick={() => this.handleSortClose('net_profit_asc')}
                selected={selectedSort === 'net_profit_asc'}
              >
                Net Profit (Low to High)
              </MenuItem>
              <MenuItem
                onClick={() => this.handleSortClose('bets_desc')}
                selected={selectedSort === 'bets_desc'}
              >
                Plays (High to Low)
              </MenuItem>
              <MenuItem
                onClick={() => this.handleSortClose('bets_asc')}
                selected={selectedSort === 'bets_asc'}
              >
                Plays (Low to High)
              </MenuItem>
            </Menu>
          </div> */}
          {selectedRow && (

            <SettingsRef
              strategies={strategies}
              ai_mode={selectedRow.selectedStrategy}
              user_id={selectedRow._id}
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
                <div className="table-cell winnings">Strategy</div>

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
                          {/* Display the bet amount */}
                          {convertToCurrency(row.winnings)}

                          {/* Add the Font Awesome edit icon with onClick functionality */}
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
                          {row.endgame_amount === 0 ? "M" : convertToCurrency(row.endgame_amount)}
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
                      {!this.props.myGamesWithStats ? (
                        <>
                          <div className="table-cell winnings">
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
                          <div className="table-cell winnings">
                            <span>{convertToCurrency(row.net_profit)}</span>
                          </div>
                          <div className="table-cell bets">
                            <Battle width="24px" />
                            &nbsp;
                            <span>{row.bets}</span>
                          </div>

                        </>
                      )}
                      <div className="table-cell winnings">

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
                    <div className="mobile-only">
                      <div className="table-cell room-id"></div>
                      <div className="table-cell action">
                        <Button
                          className="btn_end"
                          onMouseDown={() =>
                            this.handleButtonClick(row.winnings, row._id)
                          }
                          onMouseUp={() => this.handleButtonRelease(row._id)}
                          onMouseLeave={() => this.handleButtonRelease(row._id)}
                          _id={row._id}
                          style={
                            this.state[row._id] && this.state[row._id].holding
                              ? { filter: 'hue-rotate(-10deg)' }
                              : {}
                          }
                        >
                          {this.state[row._id] &&
                            this.state[row._id].holding ? (
                            <>
                              <span style={{ position: 'absolute', zIndex: '2' }}>
                                {(this.state[row._id].timeLeft / 100).toFixed(
                                  1
                                )}<span style={{ paddingTop: '5px', fontSize: 'xx-small' }}>s</span>
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
                      </div>
                    </div>
                  </div>
                ),
                this
              )
            )}

          </div>

        )}



        {/* {this.props.myGames.length > 0 && (
          <Pagination
            handlePageNumberClicked={this.handlePageNumberClicked}
            handlePrevPageClicked={this.handlePrevPageClicked}
            handleNextPageClicked={this.handleNextPageClicked}
            pageNumber={this.props.pageNumber}
            totalPage={this.props.totalPage}
            prefix="MyGames"
          />
        )} */}
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
                            {this.state.selectedRow && this.state.selectedRow.endgame_amount !== 0 ? (
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
  totalPage: state.logic.myGamesTotalPage,
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
