import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { getRoomList, setCurRoomInfo } from '../../redux/Logic/logic.actions';
import { alertModal } from '../modal/ConfirmAlerts';
import PlayerModal from '../modal/PlayerModal';
import Battle from '../icons/Battle';
import IconButton from '@material-ui/core/IconButton';
import { Box, Button } from '@material-ui/core';

import { updateDigitToPoint2 } from '../../util/helper';

import Avatar from '../../components/Avatar';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import Pagination from '../../components/Pagination';
import { convertToCurrency } from '../../util/conversion';

class OpenGamesTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedGameType: 'All',
      showPlayerModal: false,
      selectedCreator: '',
      mouseDown: false
    };
  }

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  joinRoom = e => {
    this.setState({ isClicked: true });

    const creator_id = e.currentTarget.dataset.creatorId;
    const bet_amount = e.currentTarget.dataset.betAmount;

    // if (!this.props.isAuthenticated) {
    //   alertModal(this.props.isDarkMode, `LOGIN TO PLAY THIS GAME, MTF!!`);
    //   return;
    // }

    if (e.currentTarget.dataset.roomStatus === 'finished') {
      alertModal(this.props.isDarkMode, `THIS GAME HAS ENDED ALREADY`);
      return;
    }

    const room_id = e.currentTarget.dataset.id;
    this.props.setCurRoomInfo({
      _id: room_id,
      game_type: e.currentTarget.dataset.gameType,
      bet_amount: bet_amount,
      creator_id: creator_id,
      spleesh_bet_unit: parseInt(e.currentTarget.dataset.spleeshBetUnit),
      box_price: parseFloat(e.currentTarget.dataset.boxPrice),
      game_log_list: [],
      box_list: [],
      brain_game_type: {
        _id: e.currentTarget.dataset.brainGameTypeId,
        game_type_name: e.currentTarget.dataset.brainGameTypeName
      },
      brain_game_score: e.currentTarget.dataset.brainGameScore
    });
    history.push('/join/' + room_id);
  };

  handleGameTypeButtonClicked = async short_name => {
    this.setState({ selectedGameType: short_name });
    this.props.getRoomList({
      game_type: short_name
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
      RPS: 'rps',
      'S!': 'spleesh',
      MB: 'mystery-box',
      BG: 'brain-game',
      QS: 'quick-shoot',
      DG: 'drop-game'
    };

    const gameTypePanel = (
      <Box display="flex" justifyContent="space-evenly" flexWrap="nowrap">
        <Box item key="open-game-left-button">
          <IconButton
            className="btn-arrow-left"
            onClick={this.handleBtnLeftClicked}
          >
            <ChevronLeftIcon />
          </IconButton>
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
          All Games
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
            {gameType.game_type_name}
          </Button>
        ))}
        <IconButton
          className="btn-arrow-right"
          key="open-game-right-button"
          onClick={this.handleBtnRightClicked}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
    );

    return gameTypePanel;
  };

  componentDidMount() {
    window.addEventListener('load', () => {
      this.setState({ loaded: true });
    });
  }

  handlePageNumberClicked = page => {
    this.props.getRoomList({
      page: page,
      game_type: this.state.selectedGameType
    });
  };

  handlePrevPageClicked = () => {
    if (this.props.pageNumber === 1) return;
    this.props.getRoomList({
      page: this.props.pageNumber - 1,
      game_type: this.state.selectedGameType
    });
  };

  handleNextPageClicked = () => {
    if (this.props.pageNumber === this.props.totalPage) return;
    this.props.getRoomList({
      page: this.props.pageNumber + 1,
      game_type: this.state.selectedGameType
    });
  };

  render() {
    const gameTypePanel = this.generateGameTypePanel();
    return (
      <div className="overflowX">
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
        <div className="table main-game-table">
          {this.props.roomList.length === 0 && (
            <div className="dont-have-game-msg">
              <div>NO BATTLES YET, GO TO 'MY BATTLES'</div>
            </div>
          )}
          {this.state.showPlayerModal && (
            <PlayerModal
              selectedCreator={this.state.selectedCreator}
              modalIsOpen={this.state.showPlayerModal}
              closeModal={this.handleClosePlayerModal}
              // {...this.state.selectedRow}
            />
          )}

          {this.props.roomList.map(
            (row, key) => (
              <div className="table-row" key={row._id}>
                <div>
                  <div className="table-cell cell-room-info">
                    <img
                      src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                      alt=""
                      className="game-type-icon"
                    />
                    <div>
                      {/* <div className="cell-game-type">
                        {row.game_type.game_type_name}
                      </div> */}
                      <div className="cell-game-id">{'#' + row.index}</div>
                    </div>
                  </div>
                  <div className="table-cell desktop-only cell-user-name">
                    <a
                      className="player"
                      onClick={() => this.handleOpenPlayerModal(row.creator_id)}
                    >
                      <Avatar
                        className="avatar"
                        src={row.creator_avatar}
                        alt=""
                        darkMode={this.props.isDarkMode}
                      />
                      {/* <span>{row.creator}</span> */}
                    </a>
                    <i
                      className={`online-status${
                        this.props.onlineUserList.filter(
                          user => user === row.creator_id
                        ).length > 0
                          ? ' online'
                          : ''
                      }`}
                    ></i>
                    {row.joiners && row.joiners.length > 0 ? (
                      <div className="table-cell desktop-only cell-joiners">
                        <Battle />
                        {row.joiner_avatars.slice(0, 5).map((avatar, index) => (
                          // <a className="player" onClick={() => this.handleOpenPlayerModal(row.curRoomInfo.j)}>

                          <Avatar
                            className="avatar"
                            key={index}
                            src={avatar}
                            alt=""
                            darkMode={this.props.isDarkMode}
                          />
                          // </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="table-cell desktop-only cell-amount-info">
                    {row.game_type.game_type_name === 'Spleesh!' ? (
                      <>
                        {/* {convertToCurrency(row.spleesh_bet_unit)} -  */}
                        {convertToCurrency(row.spleesh_bet_unit * 10)}
                        {/* / 
      '???' */}
                      </>
                    ) : row.game_type.game_type_name === 'Mystery Box' ? (
                      <>
                        {convertToCurrency(row.pr)}
                      </>
                    ) : (
                      <>
                        {convertToCurrency(updateDigitToPoint2(row.user_bet))}
                        {/* / 
      {convertToCurrency(row.winnings)} */}
                      </>
                    )}
                  </div>
                  <div className="table-cell cell-action">
                    <Button
                      className="btn_join"
                      onMouseDown={event => {
                        this.setState({ mouseDown: true });
                        event.currentTarget.classList.add('active');
                      }}
                      onMouseUp={event => {
                        this.setState({ mouseDown: false });
                        event.currentTarget.classList.remove('active');
                        this.joinRoom(event);
                      }}
                      onTouchStart={event => {
                        this.setState({ mouseDown: true });
                        event.currentTarget.classList.add('active');
                      }}
                      onTouchEnd={event => {
                        this.setState({ mouseDown: false });
                        event.currentTarget.classList.remove('active');
                        this.joinRoom(event);
                      }}
                      data-id={row._id}
                      data-creator-id={row.creator_id}
                      data-room-status={row.status}
                      data-game-type={row.game_type.game_type_name}
                      data-bet-amount={row.user_bet}
                      data-spleesh-bet-unit={row.spleesh_bet_unit}
                      data-box-price={row.box_price}
                      data-brain-game-type-id={
                        row.brain_game_type ? row.brain_game_type._id : ''
                      }
                      data-brain-game-type-name={
                        row.brain_game_type
                          ? row.brain_game_type.game_type_name
                          : ''
                      }
                      data-brain-game-score={
                        row.brain_game_score ? row.brain_game_score : 0
                      }
                    >
                      {row.is_private && (
                        <img
                          src="/img/icon-lock.png"
                          alt=""
                          className="lock-icon"
                        />
                      )}
                      PLAY
                    </Button>
                  </div>
                </div>
                <div className="mobile-only">
                  <div className="table-cell cell-user-name">
                    <a
                      className="player"
                      onClick={() => this.handleOpenPlayerModal(row.creator_id)}
                    >
                      <Avatar
                        className="avatar"
                        src={row.creator_avatar}
                        alt=""
                        darkMode={this.props.isDarkMode}
                      />
                      {/* <span>{row.creator}</span> */}
                    </a>
                    <i
                      className={`online-status${
                        this.props.onlineUserList.filter(
                          user => user === row.creator_id
                        ).length > 0
                          ? ' online'
                          : ''
                      }`}
                    ></i>
                    {row.joiners && row.joiners.length > 0 ? (
                      <div className="table-cell mobile-only cell-joiners">
                        <Battle />
                        {row.joiner_avatars.slice(0, 5).map((avatar, index) => (
                          <Avatar
                            className="avatar"
                            key={index}
                            src={avatar}
                            alt=""
                            darkMode={this.props.isDarkMode}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="table-cell cell-amount-info">
                    {row.game_type.game_type_name === 'Spleesh!' ? (
                      <>
                        {/* {convertToCurrency(row.spleesh_bet_unit)} -  */}
                        {convertToCurrency(row.spleesh_bet_unit * 10)}
                        {/* / 
      '???' */}
                      </>
                    ) : row.game_type.game_type_name === 'Mystery Box' ? (
                      <>
                        {convertToCurrency(row.pr)}
                      </>
                    ) : (
                      <>
                        {convertToCurrency(updateDigitToPoint2(row.user_bet))}
                        {/* / 
      {convertToCurrency(row.winnings)} */}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ),
            this
          )}
        </div>

        {this.props.roomList.length > 0 && (
          <Pagination
            handlePageNumberClicked={this.handlePageNumberClicked}
            handlePrevPageClicked={this.handlePrevPageClicked}
            handleNextPageClicked={this.handleNextPageClicked}
            pageNumber={this.props.pageNumber}
            totalPage={this.props.totalPage}
            prefix="LiveGames"
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  creator: state.logic.curRoomInfo.creator_name,
  joiners: state.logic.curRoomInfo.joiners
});

const mapDispatchToProps = {
  getRoomList,
  setCurRoomInfo
};

export default connect(mapStateToProps, mapDispatchToProps)(OpenGamesTable);
