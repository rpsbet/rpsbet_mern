import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getMyGames, endGame } from '../../redux/Logic/logic.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import { alertModal, confirmModalClosed } from '../modal/ConfirmAlerts';
import Pagination from '../../components/Pagination';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';

class MyGamesTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedGameType: 'All'
    };
  }

  componentDidMount() {
    this.props.getMyGames({
      game_type: this.state.selectedGameType
    });
  }

  endRoom = (winnings, room_id) => {
    confirmModalClosed(
      true,
      `Do you want to end this game now? You will take [${convertToCurrency(
        winnings
      )}]`,
      'Okay',
      'Cancel',
      () => {
        this.props.endGame(room_id, () => {
          this.props.getMyGames({
            game_type: this.state.selectedGameType
          });
        });
      }
    );
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
      QS: 'quick-shoot'
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
        <img src={`/img/gametype/icons/All.svg`} alt="" />
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
          <img src={`/img/gametype/icons/${gameType.short_name}.svg`} alt="" />
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
      alertModal(true, `Please choose a game type!`);
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
    return (
      <div className="my-open-games">
        <div className="create-room-btn-panel">
          <label>Unlimited APY ➜</label>
          <button
            className="btn-create-room"
            onClick={this.handleCreateBtnClicked}
          >
            + STAKE
          </button>
        </div>
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
        <div className="table my-open-game-table">
          {this.props.myGames.length > 0 && (
            <div className="table-header">
              <div className="table-cell room-id">Room ID</div>
              <div className="table-cell bet-info">Bet / PR</div>
              <div className="table-cell winnings">Winnings</div>
              <div className="table-cell action desktop-only">Action</div>
            </div>
          )}
          {this.props.myGames.length === 0 ? (
            <div className="dont-have-game-msg">
              <div>You don't have any stakes right now.</div>
              <span>
                To Create a New Stake, Choose a Gamemode <br />
                then "+ STAKE"
              </span>
            </div>
          ) : (
            this.props.myGames.map(
              (row, key) => (
                <div className="table-row" key={row._id}>
                  <div>
                    <div className="table-cell room-id">
                      <img
                        src={`/img/gametype/i${row.game_type.short_name}.png `}
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
                        {convertToCurrency(
                          updateDigitToPoint2(row.bet_amount)
                        ) +
                          ' / ' +
                          convertToCurrency(updateDigitToPoint2(row.pr))}
                      </span>
                      <span className="end-amount">
                        {convertToCurrency(
                          updateDigitToPoint2(row.endgame_amount)
                        )}
                      </span>
                    </div>
                    <div className="table-cell winnings">
                      <span>{convertToCurrency(row.winnings)}</span>
                    </div>
                    <div className="table-cell action desktop-only">
                      <button
                        className="btn_end"
                        onClick={e => {
                          this.endRoom(
                            row.winnings,
                            e.target.getAttribute('_id')
                          );
                        }}
                        _id={row._id}
                      >
                        UNSTAKE
                      </button>
                    </div>
                  </div>
                  <div className="mobile-only">
                    <div className="table-cell room-id"></div>
                    <div className="table-cell action">
                      <button
                        className="btn_end"
                        onClick={e => {
                          this.endRoom(
                            row.winnings,
                            e.target.getAttribute('_id')
                          );
                        }}
                        _id={row._id}
                      >
                        UNSTAKE
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
  pageNumber: state.logic.myGamesPageNumber
});

const mapDispatchToProps = {
  endGame,
  getMyGames
};

export default connect(mapStateToProps, mapDispatchToProps)(MyGamesTable);
