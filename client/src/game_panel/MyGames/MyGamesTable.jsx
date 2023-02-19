import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setBalance } from '../../redux/Auth/user.actions';
import { getMyGames, endGame, addNewTransaction } from '../../redux/Logic/logic.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import { alertModal, confirmModalClosed } from '../modal/ConfirmAlerts';
import Pagination from '../../components/Pagination';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/add';
import InlineSVG from 'react-inlinesvg';



const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice"
  }
};



class MyGamesTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedGameType: 'All',
      holding: false,
      timer: null,
      balance: this.props.balance
    };
  }

  componentDidMount() {
    this.props.getMyGames({
      game_type: this.state.selectedGameType
    });
    console.log('balance', this.state.balance)
  }

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
    let startTime = 2000;
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
              this.props.addNewTransaction({ amount: winnings, room_id });
              this.props.setBalance(this.state.balance += parseFloat(winnings));

            }
            return {
              [room_id]: {
                ...prevState[room_id],
                timeLeft,
              },
            };
          });
        }, 10),
      },
    });
  };
  
    handleButtonRelease = (room_id) => {
      if (this.state[room_id] && this.state[room_id].timer) {
        clearTimeout(this.state[room_id].timer);
      }
      this.setState({
        [room_id]: { holding: false },
      });
    };
    
    
    endRoom = (winnings, room_id) => {
    this.props.endGame(room_id, () => {
    this.props.getMyGames({
    game_type: this.state.selectedGameType
    });
    });
    };
  
  handleGameTypeButtonClicked = async short_name => {
    this.setState({ selectedGameType: short_name });
    this.props.getMyGames({
      game_type: short_name
    });
    return;
  };

  handleBtnLeftClicked = e => {
    this.game_type_panel.scrollLeft = 0;
  };

  handleBtnRightClicked = e => {
    this.game_type_panel.scrollLeft = this.game_type_panel.scrollWidth;
  };

  generateGameTypePanel = () => {
    const gameTypeStyleClass = {
      RPS: 'rps',
      'S!': 'spleesh',
      MB: 'mystery-box',
      BG: 'brain-game',
      QS: 'quick-shoot',
      DG: 'drop-game'
    };

    const gameTypePanel = [
      <div
        className="btn-arrow-left"
        key="open-game-left-button"
        onClick={this.handleBtnLeftClicked}
      >
        <ChevronLeftIcon />
      </div>,
      <div
        className="btn-arrow-right"
        key="open-game-right-button"
        onClick={this.handleBtnRightClicked}
      >
        <ChevronRightIcon />
      </div>,
      <div
        className={`btn-game-type btn-icon all-games ${
          this.state.selectedGameType === 'All' ? 'active' : ''
        }`}
        key="open-game-all-game-button"
        game_type_id={null}
        short_name="All"
        onClick={e => {
          this.handleGameTypeButtonClicked('All');
        }}
      >
        {/* <img src={`/img/gametype/icons/All.svg`} alt="" /> */}
        <div>All Games</div>
      </div>
    ];

    this.props.gameTypeList.map((gameType, index) => {
      gameTypePanel.push(
        <div
          className={`btn-game-type btn-icon ${
            gameTypeStyleClass[gameType.short_name]
          } ${
            this.state.selectedGameType === gameType.short_name ? 'active' : ''
          }`}
          game_type_id={gameType._id}
          short_name={gameType.short_name}
          key={index}
          onClick={e => {
            this.handleGameTypeButtonClicked(gameType.short_name);
          }}
        >
          {/* <img src={`/img/gametype/icons/${gameType.short_name}.svg`} alt="" /> */}
          <div>{gameType.game_type_name}</div>
        </div>
      );
      return true;
    });

    return gameTypePanel;
  };

  handlePageNumberClicked = page => {
    this.props.getMyGames({
      page: page,
      game_type: this.state.selectedGameType
    });
  };

  handlePrevPageClicked = () => {
    if (this.props.pageNumber === 1) return;
    this.props.getMyGames({
      page: this.props.pageNumber - 1,
      game_type: this.state.selectedGameType
    });
  };

  handleNextPageClicked = () => {
    if (this.props.pageNumber === this.props.totalPage) return;
    this.props.getMyGames({
      page: this.props.pageNumber + 1,
      game_type: this.state.selectedGameType
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

  render() {
    const gameTypePanel = this.generateGameTypePanel();
    const { row } = this.props;
    return (
      <div className="my-open-games">
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
        <div className="create-room-btn-panel">
          <label>BECOME THE HOUSE ➜</label>
          <button
            className="btn-create-room"
            onClick={this.handleCreateBtnClicked}
          >
            + STAKE
          </button>
        </div>
        <div className="table my-open-game-table">
          {this.props.myGames.length > 0 && (
            <div className="table-header">
              <div className="table-cell room-id">Room ID</div>
              <div className="table-cell bet-info">BANKROLL</div>
              <div className="table-cell payout">PAYOUT</div>
              <div className="table-cell winnings">WINNINGS</div>
              <div className="table-cell action desktop-only">Action</div>
            </div>
          )}
          {this.props.myGames.length === 0 ? (
            <div className="dont-have-game-msg">
              <Lottie 
        options={defaultOptions}
          width={50}
        />
              <span>
                FIRST SELECT A GAME <br />
                THEN CLICK "+ STAKE"
              </span>
            </div>
          ) : (
            this.props.myGames.map(
              (row, key) => (
                <div className="table-row" key={row._id}>
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
    {'('}{convertToCurrency(updateDigitToPoint2(row.bet_amount))}{') '}
    
    {convertToCurrency(updateDigitToPoint2(row.pr))}
  </span>
  <span className="end-amount">
    {convertToCurrency(updateDigitToPoint2(row.endgame_amount))}
  </span>
</div>
<div className="table-cell winnings">
  <span>{convertToCurrency(row.winnings)}</span>
</div>

                    <div className="table-cell action desktop-only">
                    <button
      className="btn_end"
      onMouseDown={() => this.handleButtonClick(row.winnings, row._id)}
      onMouseUp={() => this.handleButtonRelease(row._id)}
      onMouseLeave={() => this.handleButtonRelease(row._id)}
      _id={row._id}
    >
      {this.state[row._id] && this.state[row._id].holding ? `${(this.state[row._id].timeLeft / 1000).toFixed(2)}s` : 'UNSTAKE'}
    </button>
                    </div>
                  </div>
                  <div className="mobile-only">
                    <div className="table-cell room-id"></div>
                    <div className="table-cell action">
                    <button
      className="btn_end"
      onMouseDown={() => this.handleButtonClick(row.bet_amount, row._id)}
      onMouseUp={() => this.handleButtonRelease(row._id)}
      onMouseLeave={() => this.handleButtonRelease(row._id)}
      onTouchStart={() => this.handleButtonClick(row.bet_amount, row._id)}
  onTouchEnd={() => this.handleButtonRelease(row._id)}
  onTouchCancel={() => this.handleButtonRelease(row._id)}
      _id={row._id}
    >
      {this.state[row._id] && this.state[row._id].holding ? `${(this.state[row._id].timeLeft / 1000).toFixed(2)}s` : 'UNSTAKE'}
    </button>
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
  getMyGames,
  addNewTransaction,
  setBalance
};

export default connect(mapStateToProps, mapDispatchToProps)(MyGamesTable);
