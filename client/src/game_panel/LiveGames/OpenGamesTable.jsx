import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { actionRoom, getRoomList, setCurRoomInfo } from '../../redux/Logic/logic.actions';
import { alertModal } from '../modal/ConfirmAlerts';
import PlayerModal from '../modal/PlayerModal';
import Battle from '../icons/Battle';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import ThumbUpOutlinedIcon from '@material-ui/icons/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@material-ui/icons/ThumbDownOutlined';
import {
  ArrowUpward,
  ArrowDownward } from '@material-ui/icons';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { Box, Button, Typography, IconButton } from '@material-ui/core';
import { updateDigitToPoint2 } from '../../util/helper';
import Avatar from '../../components/Avatar';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Pagination from '../../components/Pagination';
import { convertToCurrency } from '../../util/conversion';

const gifUrls = [
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641ef8e1ce09cd9cf53a4829_rock1.gif',
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641ef98d7e17a610c3ed83b9_paper2.gif',
  'https://uploads-ssl.webflow.com/6097a2499efec713b2cb1c07/641efdcadd850ab47a768e04_scissors1.gif'
];
const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];


class OpenGamesTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedGameType: 'All',
      isLoading: false,
      showPlayerModal: false,
      selectedCreator: '',
      mouseDown: false,
      borderColor: '',
      likes: [],
      dislikes: [],
      views: [],
      liked: false,
  disliked: false
    };
  }

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  // handleLike = ({ _id }) => {
  //   if (!this.state.liked) {
  //     this.setState({ liked: true, disliked: false });
  //     this.handleAction({ roomId: _id, type: 'like' });
  //   }
  // };
  
  // handleDislike = ({ _id }) => {
  //   if (!this.state.disliked) {
  //     this.setState({ liked: false, disliked: true });
  //     this.handleAction({ roomId: _id, type: 'dislike' });
  //   }
  // };
  

  handleLike = ({ _id }) => this.handleAction({ roomId: _id, type: 'like' });
  handleDislike = ({ _id }) => this.handleAction({ roomId: _id, type: 'dislike' });

  handleAction = ({ roomId, type }) => {
    if (this.props.user?._id) {
      this.props.actionRoom({ roomId, type, conditions: {
        page: this.props.pageNumber ?? 0,
        game_type: this.state.selectedGameType
      } })
    }
  }

  handleView = ({ _id }) => this.handleViewAction({ roomId: _id, type: 'view' });

  handleViewAction = ({ roomId, type }) => {
    console.log(roomId)
    if (this.props.user?._id) {
      this.props.actionRoom({ roomId, type, conditions: {
        page: this.props.pageNumber ?? 0,
        game_type: this.state.selectedGameType
      } })
    }
  }

  calculatePercentageChange = (originalValue, newValue) => {
    const difference = newValue - originalValue;
    const percentageChange = (difference / originalValue) * 100;
    return percentageChange;
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
      borderColor: '',
      brain_game_type: {
        _id: e.currentTarget.dataset.brainGameTypeId,
        game_type_name: e.currentTarget.dataset.brainGameTypeName
      },
      brain_game_score: e.currentTarget.dataset.brainGameScore
    });
    history.push('/join/' + room_id);
  };

  handleGameTypeButtonClicked = async short_name => {
    this.setState({ selectedGameType: short_name, isLoading: true });
    try {
      await this.props.getRoomList({
        game_type: short_name
      });
    } catch (error) {
      this.setState({ isLoading: false });
    }
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
      BJ: 'blackjack'
    };
  
    const gameTypePanel = (
      <Box
        display="flex"
        justifyContent="space-evenly"
        flexWrap="nowrap"
        gap="15px"
      >
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
          <img
            src={`/img/gametype/ALL.png`}
            alt={`All Games`}
          />
          <div className='icon'>
            <img
              src={`/img/gametype/icons/All.svg`}
              alt={`All Games`}
              />
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
            <img
              src={`/img/gametype/${gameType.short_name}.png`}
              alt={gameType.game_type_name}
            />
            <div className='icon'>
            <img
              src={`/img/gametype/icons/${gameType.short_name}.svg`}
              alt={gameType.game_type_name}
              />
            <span>{gameType.game_type_name}</span>
              </div>
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
  

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.roomList !== this.props.roomList) {
      this.setState({ isLoading: false });
    }
  }

  componentDidMount() {
    window.addEventListener('load', () => {
      this.setState({ loaded: true });
    });
  }

  handlePageNumberClicked = page => {
    this.setState({ isLoading: true });

    this.props.getRoomList({
      page: page,
      game_type: this.state.selectedGameType
    });
  };

  handlePrevPageClicked = () => {
    this.setState({ isLoading: true });

    if (this.props.pageNumber === 1) return;
    this.props.getRoomList({
      page: this.props.pageNumber - 1,
      game_type: this.state.selectedGameType
    });
  };

  handleNextPageClicked = () => {
    this.setState({ isLoading: true });

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
        {this.state.isLoading ? (
          <div className="loading-gif-container">
            <img src={randomGifUrl} id="isLoading" alt="loading" />
          </div>
        ) : (
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
                        onClick={() =>
                          this.handleOpenPlayerModal(row.creator_id)
                        }
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
                          {row.joiner_avatars
                            .slice(0, 5)
                            .map((avatar, index) => (
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
                    <div className="table-cell desktop-only cell-amount">
                    {row.game_type.game_type_name === 'Mystery Box' ? (
                        <>
                        <div style={{ display: "flex", alignItems: "center" }}>
  {this.calculatePercentageChange(row.bet_amount, (parseFloat(row.pr) + parseFloat(row.user_bet))) > 0 ?
    <ArrowUpward style={{ color: "green" }} /> :
    <ArrowDownward style={{ color: "red" }} />
  }
  <span style={{ color: this.calculatePercentageChange(row.bet_amount, (parseFloat(row.pr) + parseFloat(row.user_bet))) > 0 ? "green" : "red" }}>
    {updateDigitToPoint2(this.calculatePercentageChange(row.bet_amount, (parseFloat(row.pr) + parseFloat(row.user_bet))))}%
  </span>
</div>
                        </>
                      ) : (
                        <>
<div style={{ display: "flex", alignItems: "center" }}>
  {this.calculatePercentageChange(row.bet_amount, row.user_bet) > 0 ?
    <ArrowUpward style={{ color: "green" }} /> :
    <ArrowDownward style={{ color: "red" }} />
  }
  <span style={{ color: this.calculatePercentageChange(row.bet_amount, row.user_bet) > 0 ? "green" : "red" }}>
    {updateDigitToPoint2(this.calculatePercentageChange(row.bet_amount, row.user_bet))}%
  </span>
</div>
                        </>
                      )}
                      </div>
                    <div className="table-cell cell-likes">
                      <div id="view">

                    <VisibilityIcon style={{ fontSize: '1rem' }} />
                      <Typography variant="body1">{row.views?.length || 0}</Typography>
                      </div>

                      <div>
                      

                    <IconButton onClick={() => this.handleLike(row)}>
    {row.likes?.includes(this.props.user.id) ? <span role="img" aria-label="Thumbs up">&#x1F44D;</span> : <ThumbUpIcon style={{ fontSize: '1rem' }} />}
</IconButton>
<Typography variant="body1">{row.likes?.length || 0}</Typography>
</div>
<div>
<IconButton onClick={() => this.handleDislike(row)}>
    {row.dislikes?.includes(this.props.user.id) ? <span role="img" aria-label="Thumbs down">&#x1F44E;</span> : <ThumbDownIcon style={{ fontSize: '1rem' }} />}
</IconButton>
<Typography variant="body1">{row.dislikes?.length || 0}</Typography>
</div>
</div>
                    <div className="table-cell cell-action" onClick={() => this.handleView(row)}>
                      <Button
                        className="btn_join"
                        onClick={event => {
                          event.currentTarget.classList.add('active');
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
                        {row.game_type.game_type_name === 'Spleesh!' && (
      <>
        WIN {convertToCurrency(row.spleesh_bet_unit * 10)}
      </>
    )}
    {row.game_type.game_type_name === 'Mystery Box' && (
      <>
        WIN {convertToCurrency(row.pr)}
      </>
    )}
    {row.game_type.game_type_name === 'Drop Game' && (
      <>
        WIN ???
      </>
    )}
    {row.game_type.game_type_name !== 'Spleesh!' &&
    row.game_type.game_type_name !== 'Drop Game' && 
      row.game_type.game_type_name !== 'Mystery Box' && (
      <>
        WIN {convertToCurrency(updateDigitToPoint2(row.user_bet))}
      </>
    )}
  </Button>
                    </div>
                  </div>
                  <div className="mobile-only">
                    <div className="table-cell cell-user-name">
                      <a
                        className="player"
                        onClick={() =>
                          this.handleOpenPlayerModal(row.creator_id)
                        }
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
                          {row.joiner_avatars
                            .slice(0, 10)
                            .map((avatar, index) => (
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
                    <div className="table-cell mobile-only cell-amount">
                    {row.game_type.game_type_name === 'Mystery Box' ? (
                        <>
                        <div style={{ display: "flex", alignItems: "center" }}>
  {this.calculatePercentageChange(row.bet_amount, (parseFloat(row.pr) + parseFloat(row.user_bet))) > 0 ?
    <ArrowUpward style={{ color: "green" }} /> :
    <ArrowDownward style={{ color: "red" }} />
  }
  <span style={{ color: this.calculatePercentageChange(row.bet_amount, (parseFloat(row.pr) + parseFloat(row.user_bet))) > 0 ? "green" : "red" }}>
    {updateDigitToPoint2(this.calculatePercentageChange(row.bet_amount, (parseFloat(row.pr) + parseFloat(row.user_bet))))}%
  </span>
</div>
                        </>
                      ) : (
                        <>
<div style={{ display: "flex", alignItems: "center" }}>
  {this.calculatePercentageChange(row.bet_amount, row.user_bet) > 0 ?
    <ArrowUpward style={{ color: "green" }} /> :
    <ArrowDownward style={{ color: "red" }} />
  }
  <span style={{ color: this.calculatePercentageChange(row.bet_amount, row.user_bet) > 0 ? "green" : "red" }}>
    {updateDigitToPoint2(this.calculatePercentageChange(row.bet_amount, row.user_bet))}%
  </span>
</div>
                        </>
                      )}
                      </div>
                  </div>
                </div>
              ),
              this
            )}
          </div>
        )}
        {!this.state.isLoading && this.props.roomList.length > 0 && (
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
  joiners: state.logic.curRoomInfo.joiners,
  isAuthenticated: state.auth.isAuthenticated,
  userName: state.auth.userName,
  user: state.auth.user,
});

const mapDispatchToProps = {
  getRoomList,
  setCurRoomInfo,
  actionRoom
};

export default connect(mapStateToProps, mapDispatchToProps)(OpenGamesTable);
