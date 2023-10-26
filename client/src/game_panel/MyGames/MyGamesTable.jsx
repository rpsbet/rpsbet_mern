import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setBalance } from '../../redux/Auth/user.actions';
import {
  getMyGames,
  endGame,
  addNewTransaction
} from '../../redux/Logic/logic.actions';
import { faFilter, faSort } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Battle from '../icons/Battle';

import {
  createRoom,
} from '../../redux/Logic/logic.actions';import { alertModal, confirmModalClosed, confirmModalCreate } from '../modal/ConfirmAlerts';
import Pagination from '../../components/Pagination';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/add';
import InlineSVG from 'react-inlinesvg';
import { Box, Button, Menu, MenuItem } from '@material-ui/core';

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
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
      anchorEl: null,
      selectedFilter: 'open',
      sortAnchorEl: null,
      selectedSort: 'desc',
      creatingRoom: false
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.selectedFilter !== prevState.selectedFilter ||
      this.state.selectedSort !== prevState.selectedSort
    ) {
      // Filter value has changed, re-fetch data
      this.fetchData();
    }
  }

  fetchData = () => {
    const { selectedFilter, selectedGameType, selectedSort } = this.state;

    this.props.getMyGames({
      game_type: selectedGameType,
      status: selectedFilter === 'open' ? 'open' : 'finished',
      sort: selectedSort
    });
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
    confirmModalCreate(
      this.props.isDarkMode,
      'CONFIRM RE-CREATE GAME?',
      'LFG',
      'Fuck No',
      async () => {
        this.setState({ creatingRoom: true });
        await this.onCreateRoom(row);
        this.setState({ creatingRoom: false });
      }
    );
  }

  

  onCreateRoom = async (row) => {
    
    if (localStorage.getItem('hideConfirmModal') === 'true') {
      this.setState({ creatingRoom: true });
      await this.props.createRoom({
        game_type: row.game_type,
				bet_amount: row.bet_amount,
				endgame_amount: row.endgame_amount,
				// is_anonymous: row.is_anonymous,
				youtubeUrl: row.youtubeUrl
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
    let startTime = 1500;
    this.setState({
      [room_id]: {
        holding: true,
        timeLeft: startTime,
        timer: setInterval(() => {
          this.setState(prevState => {
            const timeLeft = prevState[room_id].timeLeft - 10;
            if (timeLeft === 0) {
              clearInterval(prevState[room_id].timer);
              this.endRoom(winnings, room_id);
            }
            return {
              [room_id]: {
                ...prevState[room_id],
                timeLeft
              }
            };
          });
        }, 10)
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
    try {
      await this.props.endGame(room_id);
      await this.props.getMyGames({
        game_type: this.state.selectedGameType,
        status: this.state.selectedFilter,
        sort: this.state.selectedSort
      });
      await this.props.addNewTransaction({ amount: winnings, room_id });
      this.props.setBalance((this.state.balance += parseFloat(winnings)));
    } catch (error) {
      console.error('Error ending room:', error);
    }
  };

  handleGameTypeButtonClicked = async short_name => {
    this.setState({ selectedGameType: short_name });
    this.props.getMyGames({
      game_type: short_name,
      status: this.state.selectedFilter,
      sort: this.state.selectedSort
    });
    return;
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
          className={`btn-game-type btn-icon all-games ${
            this.state.selectedGameType === 'All' ? 'active' : ''
          }`}
          key="open-game-all-game-button"
          onClick={() => {
            this.handleGameTypeButtonClicked('All');
          }}
        >
          <div className="icon">
            <img src={`/img/gametype/icons/All.svg`} alt={`All Games`} />
            <span>All Games</span>
          </div>
        </Button>
        {this.props.gameTypeList.map((gameType, index) => (
          <Button
            className={`btn-game-type btn-icon ${
              gameTypeStyleClass[gameType.short_name]
            } ${
              this.state.selectedGameType === gameType.short_name
                ? 'active'
                : ''
            }`}
            key={index}
            onClick={() => {
              this.handleGameTypeButtonClicked(gameType.short_name);
            }}
          >
            <div className="icon">
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

  handleCreateBtnClicked = e => {
    e.preventDefault();

    if (this.state.selectedGameType === 'All') {
      alertModal(this.props.isDarkMode, `SELECT A GAME FIRST!!!`);
      return;
    }

    for (let i = 0; i < this.props.gameTypeList.length; i++) {
      if (
        this.props.gameTypeList[i].short_name === this.state.selectedGameType
      ) {
        history.push(`/create/${this.props.gameTypeList[i].game_type_name}`);
        break;
      }
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
      youtubeUrl: this.props.youtubeUrl
    });
  }

  render() {
    const gameTypePanel = this.generateGameTypePanel();
    const { row } = this.props;
    const { anchorEl, selectedFilter, sortAnchorEl, selectedSort } = this.state;

    return (
      <div className="my-open-games">
        <div className="filter-container">
          <div className="game-type-container">
            <div
              className="game-type-panel"
              ref={elem => {
                this.game_type_panel = elem;
              }}
            >
              {gameTypePanel}
            </div>
          </div>
          <div className="filters">
            <Button
              className="game-type-panel"
              onClick={this.handleFilterClick}
              variant="contained"
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
              variant="contained"
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
          </div>
        </div>
        <div className="create-room-btn-panel">
          <label>15% APY ➜</label>
          <Button
            className="btn-create-room"
            onClick={this.handleCreateBtnClicked}
          >
            CREATE AI
          </Button>
        </div>
        <div className="table my-open-game-table">
          {this.props.myGames.length > 0 && (
            <div className="table-header">
              <div className="table-cell room-id">Room ID</div>
              <div className="table-cell payout">
                INITIAL BET
              </div>
              <div className="table-cell winnings">Payout</div>
              <div className="table-cell bet-info">Net Profit</div>
              <div className="table-cell winnings">Plays</div>

              <div className="table-cell action desktop-only">Bankroll/Re-Create</div>
            </div>
          )}
          {this.props.myGames.length === 0 ? (
            <div className="dont-have-game-msg">
              <Lottie options={defaultOptions} width={50} />
              <span>
                SELECT A GAME <br />
                AND CLICK "CREATE AI"
              </span>
            </div>
          ) : (
            this.props.myGames.map(
              (row, key) => (
                <div className="table-row" key={row._id}>
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
                        </a>
                    </div>
                    <div className="table-cell bet-info">
                      <span className="bet-pr">
                        {/* {'('} */}
                        {convertToCurrency(row.bet_amount)}
                        {/* {') '} */}

                        {/* {convertToCurrency(updateDigitToPoint2(row.pr))} */}
                      </span>
                    </div>
                    <div className="table-cell endgame">
                      <span className="end-amount">
                      {row.endgame_amount === 0 ? "M" : convertToCurrency(row.endgame_amount)}
                      </span>
                    </div>
                    <div className="table-cell winnings">
                      <span>{convertToCurrency(row.net_profit)}</span>
                    </div>
                    <div className="table-cell bets">
                      <Battle width="24px" />
                      &nbsp;
                      <span>{row.bets}</span>
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
                        <Button
                          className="btn_end"
                          onMouseDown={() =>
                            this.handleButtonClick(row.winnings, row._id)
                          }
                          onMouseUp={() => this.handleButtonRelease(row._id)}
                          onMouseLeave={() => this.handleButtonRelease(row._id)}
                          _id={row._id}
                        >
                          {this.state[row._id] &&
                          this.state[row._id].holding ? (
                            `${(this.state[row._id].timeLeft / 1000).toFixed(
                              2
                            )}s`
                          ) : (
                            <>
                              {' '}
                              TAKE&nbsp;
                              <span>{convertToCurrency(row.winnings)}</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mobile-only">
                    <div className="table-cell room-id"></div>
                    <div className="table-cell action">
                      <Button
                        className="btn_end"
                        onMouseDown={() =>
                          this.handleButtonClick(row.bet_amount, row._id)
                        }
                        onMouseUp={() => this.handleButtonRelease(row._id)}
                        onMouseLeave={() => this.handleButtonRelease(row._id)}
                        onTouchStart={() =>
                          this.handleButtonClick(row.bet_amount, row._id)
                        }
                        onTouchEnd={() => this.handleButtonRelease(row._id)}
                        onTouchCancel={() => this.handleButtonRelease(row._id)}
                        _id={row._id}
                      >
                        {this.state[row._id] && this.state[row._id].holding ? (
                          `${(this.state[row._id].timeLeft / 2000).toFixed(2)}s`
                        ) : (
                          <>
                            {' '}
                            TAKE&nbsp;
                            <span>{convertToCurrency(row.winnings)}</span>
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
        {this.props.myGames.length > 0 && (
          <Pagination
            handlePageNumberClicked={this.handlePageNumberClicked}
            handlePrevPageClicked={this.handlePrevPageClicked}
            handleNextPageClicked={this.handleNextPageClicked}
            pageNumber={this.props.pageNumber}
            totalPage={this.props.totalPage}
            prefix="MyGames"
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  myGames: state.logic.myGames,
  totalPage: state.logic.myGamesTotalPage,
  pageNumber: state.logic.myGamesPageNumber,
  socket: state.auth.socket,
  balance: state.auth.balance
});

const mapDispatchToProps = {
  endGame,
  createRoom,
  getMyGames,
  addNewTransaction,
  setBalance
};

export default connect(mapStateToProps, mapDispatchToProps)(MyGamesTable);
