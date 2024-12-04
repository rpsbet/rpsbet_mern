import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  actionRoom,
  getRoomList,
  setCurRoomInfo,
  fetchMoreRooms,
  getRecentlyClosed,
  getQbot,
  addNewTransaction,
  coHost
} from '../../redux/Logic/logic.actions';
import { TrendingUpOutlined, TrendingDownOutlined } from "@material-ui/icons";
import { Grid, Tooltip, Typography } from '@material-ui/core';
import { Warning, Add, Remove, Visibility } from '@material-ui/icons';
import FilterListIcon from "@material-ui/icons/FilterList";
import Moment from 'moment';
import { faHeart, faHeartBroken, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import animationData from '../LottieAnimations/live';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setBalance } from '../../redux/Auth/user.actions';
import CoHostModal from '../modal/CoHostModal';
import Avatar from '../../components/Avatar';
import ShowChartOutlined from '@material-ui/icons/ShowChartOutlined';
import LockOutlined from '@material-ui/icons/LockOutlined';
import Modal from 'react-modal';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
import Battle from '../icons/Battle';

import { alertModal } from '../modal/ConfirmAlerts';
import PlayerModal from '../modal/PlayerModal';

import blob from '../LottieAnimations/loadingChart.json';
import history from '../../redux/history';
const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];
const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];
const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'unset'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    border: 'none',
    padding: 0
  }
};

class OpenGamesTable extends Component {
  constructor(props) {
    super(props);
    this._isMounted = true;
    this.state = {
      selectedGameType: this.props.selectedGameType,
      mouseDown: false,
      roomList: [],
      qBotStatuses: {},
      fetchedRoomIds: [],
      fetchedDataIds: [],
      invertFilter: false,
      actionList: null,
      isCoHostModalOpen: false,
      isFocused: false,
      isLoading: true,
      filter: "Live Games",
    };
  }

  async componentDidMount() {
    await this.props.getRoomList({ pageSize: 7 });
    await this.props.getRecentlyClosed();
    window.addEventListener('load', this.handleLoad);
    this.debouncedHandleScroll = this.debounce(this.handleScroll, 300);

    window.addEventListener('scroll', this.debouncedHandleScroll);

    const qBotStatuses = {};
    for (const room of this.state.roomList) {
      const isQbot = await this.props.getQbot(room.creator_id);
      qBotStatuses[room.creator_id] = isQbot;
    }
    this.setState({ qBotStatuses });
    this.props.handleRefresh();
  }


  componentWillUnmount() {
    window.removeEventListener('scroll', this.debouncedHandleScroll);
    window.removeEventListener('load', this.handleLoad);
  }

  componentDidUpdate(prevProps, prevState) {
    const roomIds = this.props.roomList.map(room => room._id);

    if (prevProps.roomList[0] !== this.props.roomList[0]) {
      const significantChange = this.props.roomList.slice(0, 5).some((room, index) => {
        const prevRoom = prevProps.roomList.find(prevRoom => prevRoom._id === room._id);

        if (prevRoom) {
          const previousBet = parseFloat(prevRoom.user_bet);
          const newBet = parseFloat(room.user_bet);

          // Ensure both values are valid numbers before calculating the change
          if (!isNaN(previousBet) && !isNaN(newBet) && previousBet !== 0) {
            const change = Math.abs(newBet - previousBet) / previousBet;
            return change >= 0.01; // 30% or more change
          }
        }
        return false; // No previous room found, or invalid bet values
      }) || prevProps.roomList.length !== this.props.roomList.length && this.props.roomList.length === this.state.roomList.length;

      this.setState(prevState => ({
        roomList: [
          ...prevState.roomList,
          ...this.props.roomList.filter(room => !prevState.fetchedRoomIds.includes(room._id))
        ],
        fetchedRoomIds: [...prevState.fetchedRoomIds, ...roomIds],
        isLoading: false,
        loaded: true
      }));

      this.setState({
        roomList: this.props.roomList
      });

      if (significantChange) {
        this.props.handleRefresh();
      }
    }

    if (prevProps.selectedGameType !== this.props.selectedGameType) {
      this.setState({ isLoading: true });
    }
  }

  handleLoad = () => {
    this.setState({ loaded: true, selectedGameType: 'All' });
  };

  handleScroll = async () => {
    const { loading, selectedGameType, rooms_count, roomList } = this.props;
    const { fetchedRoomIds } = this.state;

    const tableElement = document.querySelector('.table.main-game-table');

    if (tableElement) {
      const { bottom } = tableElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const offset = 100;

      const isTableNearBottom = bottom <= viewportHeight + offset;
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight;

      if (!loading && (isTableNearBottom || isAtBottom)) {
        await this.props.fetchMoreRooms({
          pageSize: roomList.length + 3,
          game_type: selectedGameType,
          excludeIds: fetchedRoomIds,
        }, roomList);
      }
    }
  };

  debounce = (func, delay) => {
    let debounceTimer;
    return function (...args) {
      const context = this;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  };

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
        alertModal(isDarkMode, result.message, '-cat');
        setBalance(result.balance);
        addNewTransaction(result.newTransaction);
        await getRoomList({
          pageSize: this.state.roomList.length,
          game_type: selectedGameType,
        });
      } else {
        alertModal(isDarkMode, result.message);
      }
    } catch (e) {
      alertModal(isDarkMode, 'ROOM TOO BUSY, TRY AGAIN LATER');
    }
  };


  customFromNow(date) {
    const now = Moment();
    const duration = Moment.duration(now.diff(date));

    const style = {
      fontSize: 'xx-small',
    };

    if (duration.asSeconds() < 60) {
      return (
        <>
          {Math.round(duration.asSeconds())}
          <span style={style}>s</span>
        </>
      );
    } else if (duration.asMinutes() < 60) {
      return (
        <>
          {Math.round(duration.asMinutes())}
          <span style={style}>m</span>
        </>
      );
    } else if (duration.asHours() < 24) {
      return (
        <>
          {Math.round(duration.asHours())}
          <span style={style}>h</span>
        </>
      );
    } else {
      return (
        <>
          {Math.round(duration.asDays())}
          <span style={style}>d</span>
        </>
      );
    }
  }

  updateFromNow(history) {
    const result = JSON.parse(JSON.stringify(history));
    for (let i = 0; i < result.length; i++) {
      result[i]['from_now'] = this.customFromNow(Moment(result[i]['updated_at']));
    }
    return result;
  }

  handleLike = ({ _id }) => {
    const updatedRoomList = this.state.roomList.map(room => {
      if (room._id === _id) {
        const likesIndex = room.likes ? room.likes.indexOf(this.props.user._id) : -1;
        const dislikesIndex = room.dislikes ? room.dislikes.indexOf(this.props.user._id) : -1;

        if (likesIndex > -1) {
          room.likes.splice(likesIndex, 1);
        } else if (dislikesIndex > -1) {
          room.dislikes.splice(dislikesIndex, 1);
          room.likes.push(this.props.user._id);
          this.handleAction({ roomId: _id, type: 'dislike' });
        } else {
          room.likes.push(this.props.user._id);
        }

        room.likeAnimation = true;

        setTimeout(() => {
          room.likeAnimation = false;
          this.setState({ roomList: [...this.state.roomList] });
        }, 1500);
      }
      return room;
    });

    this.setState({ roomList: updatedRoomList });
    this.handleAction({ roomId: _id, type: 'like' });
  };
  handleAction = ({ roomId, type }) => {
    const { user, pageNumber } = this.props;
    if (user && user._id) {
      this.props.actionRoom({
        roomId,
        type,
        conditions: {
          page: pageNumber !== undefined ? pageNumber : 0,
          game_type: this.props.selectedGameType
        }
      });
    }
  };

  handleView = ({ _id }) => {
    this.handleViewAction({ roomId: _id, type: 'view' });
  };

  handleViewAction = ({ roomId, type }) => {
    const { user, pageNumber, selectedGameType } = this.props;
    if (user && user._id) {
      this.props.actionRoom({
        roomId,
        type,
        conditions: {
          page: pageNumber !== undefined ? pageNumber : 0,
          game_type: selectedGameType
        }
      });
    }
  };
  joinRoom = (roomDetails) => {
    const { id, roomStatus, gameType, betAmount, creatorId, qsGameType } = roomDetails;

    this.setState({ isClicked: true });

    if (roomStatus === "finished") {
      alertModal(this.props.isDarkMode, "THIS GAME HAS NOW ENDED");
      return;
    }

    this.props.setCurRoomInfo({
      _id: id,
      game_type: gameType,
      bet_amount: parseFloat(betAmount),
      user_bet: parseFloat(betAmount),
      creator_id: creatorId,
      hosts: [],
      status: roomStatus,
      qs_game_type: qsGameType,
      game_log_list: [],
    });

    history.push(`/join/${id}`);
  };

  getColorClass = (value) => {
    if (value > 0) {
      return 'green';
    } else if (value === 0) {
      return 'grey';
    } else {
      return 'red';
    }
  };


  renderArrow = value => {
    return value >= 0 ? (
      <Add style={{ color: '#57ca22' }} />
    ) : (
      <Remove style={{ color: 'red' }} />
    );
  };

  calculateColor = value => {
    return value >= 0 ? '#57ca22' : 'red';
  };

  handleFilterChange = (filterOption) => {
    this.setState({ filter: filterOption });
  };

  render() {
    const {
      coHostAmount,
      selectedRow,
      filter
    } = this.state;
    const { showPlayerModal, selectedCreator, roomList, isDarkMode, recentlyClosed, handleOpenPlayerModal, handleClosePlayerModal } = this.props;
    let recent = recentlyClosed ? this.updateFromNow(recentlyClosed) : [];
    const isLiveGames = filter === "Live Games";
    const defaultOptions = {
      loop: this.props.isLowGraphics ? false : true,
      autoplay: this.props.isLowGraphics ? false : true,
      animationData: animationData,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
      }
    };
    return (
      <>
        <div className="overflowX">
        </div>
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <div
            className="filter-container"
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => this.handleFilterChange(isLiveGames ? "Recently Ended" : "Live Games")}
          >
            <i className="filter-icon" style={{ marginRight: "5px" }}></i>
            <FilterListIcon style={{ marginRight: "5px" }} />
            <span>{filter}</span>
          </div>
        </div>

        {isLiveGames ? (
          <>
            <div className="table main-game-table">

              {(this.props.roomList.length === 0 && !this.state.isLoading && !this.props.loading) ? (
                <div className="dont-have-game-msg">
                  <div>NO LIVE GAMES, GO TO 'MANAGE' TO CREATE ONE</div>
                </div>
              ) : (
                <Grid container className="grid-container" spacing={1} style={{ padding: "20px", width: "100%" }}>
                  {this.state.roomList.map(
                    (row, key) => (
                      <div

                        key={row._id}

                        className={`table-row ${key < 10 ? 'slide-in' : 'slide-in'}`}
                        style={{ animationDelay: `${key * 0.1}s` }}
                        onClick={() => this.joinRoom({
                          id: row._id,
                          creatorId: row.creator_id,
                          roomStatus: row.status,
                          gameType: row.game_type.game_type_name,
                          betAmount: row.user_bet,
                          qsGameType: row.qs_game_type,
                          pr: row.pr,
                          host_pr: row.host_pr
                        })}

                      >
                        {' '}

                        <div className="" style={{ display: 'flex', flexDirection: 'column' }}>
                          {/* Room Info Row */}
                          <div className="table-cell cell-room-info">
                            <img
                              src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                              alt=""
                              className="game-type-icon"
                            />
                            <div>
                              <div className="cell-game-id">{'#' + row.index}</div>
                              {this.state.qBotStatuses[row.creator_id] ? (
                                <span
                                  style={{
                                    fontSize: "xx-small",
                                    position: "absolute",
                                    top: "22px",
                                    left: "14px",
                                    border: "1px solid rgb(255, 208, 0)",
                                    background: "linear-gradient(45deg, #7a5958, #a27955)",
                                    borderRadius: "4px",
                                    color: "rgb(255, 208, 0)",
                                    padding: "0px 5px",
                                    lineHeight: "20px",
                                    marginLeft: "7.5px"
                                  }}
                                >
                                  Q-BOT
                                </span>
                              ) : (
                                <div >
                                  <Lottie
                                    options={{
                                      loop: false,
                                      autoplay: false,
                                      animationData: blob
                                    }}
                                    style={{
                                      width: '32px',
                                      height: '38px',
                                      position: "absolute",
                                      top: "10px",
                                      left: "15px",
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* User Name Row */}
                          <div className="table-cell desktop-only cell-user-name">
                            <a
                              className="player"
                              onClick={(event) => {
                                event.preventDefault(); // Prevent the default behavior (e.g., navigating to a link)
                                event.stopPropagation(); // Stop the event from bubbling up to parent elements
                                handleOpenPlayerModal(row.creator_id); // Execute your function
                              }}
                            >
                              <Avatar
                                className="avatar desktop-only"
                                src={row.creator_avatar}
                                accessory={row.accessory}
                                username={row.username}
                                rank={row.rank}
                                alt=""
                                darkMode={this.props.isDarkMode}
                              />
                            </a>
                            <i
                              className={`online-status${this.props.onlineUserList.filter(
                                user => user === row.creator_id
                              ).length > 0
                                ? ' online'
                                : ''
                                }`}
                            ></i>
                            {row.hosts && row.hosts
                              .slice(1, 2)
                              .map((host, index) => (
                                <div className="hosts" key={index}>
                                  <a
                                    className="player"
                                    onClick={() => {
                                      handleOpenPlayerModal(host.host);
                                    }}
                                  >
                                    <Avatar
                                      className="avatar desktop-only"
                                      src={host.avatar}
                                      accessory={host.accessory}
                                      username={host.username}
                                      rank={host.rank}
                                      alt=""
                                      darkMode={isDarkMode}
                                    />
                                  </a>
                                </div>
                              ))}

                            {row.hosts.length > 2 && (
                              <div className="hosts avatar-square">
                                <div className="avatar-count">
                                  +{row.hosts.length - 2}
                                </div>
                              </div>
                            )}
                            {row.joiners && row.joiners.length > 0 ? (
                              <div className="table-cell avatar desktop-only cell-joiners">
                                <Battle />
                                {row.joiner_avatars
                                  .slice(0, 2)
                                  .map((joiner, index) => (
                                    <a
                                      key={index}
                                      className="player"
                                      onClick={() =>
                                        handleOpenPlayerModal(row.joiners[index])
                                      }
                                    >
                                      <Avatar
                                        className="avatar desktop-only"
                                        key={index}
                                        accessory={joiner.accessory}
                                        src={joiner.avatar}
                                        username={joiner.username}
                                        rank={joiner.rank}
                                        alt=""
                                        darkMode={this.props.isDarkMode}
                                      />
                                    </a>
                                  ))}
                                {row.joiner_avatars.length > 2 && (
                                  <div className="avatar-square">
                                    <div className="avatar-count">
                                      +{row.joiner_avatars.length - 2}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>

                          {/* Likes Row */}
                          <div className="table-cell cell-likes title">
                            <div
                              id="view"
                              style={{
                                color:
                                  parseFloat(row.user_bet) > row.bet_amount
                                    ? "#03ff3b" // Green
                                    : parseFloat(row.user_bet) < row.bet_amount
                                      ? "#ff033e" // Red
                                      : "#808080", // Grey
                              }}
                            >
                              <Typography
                                variant="body2"
                                className={`label ${parseFloat(row.user_bet) > row.bet_amount
                                  ? "green-text"
                                  : parseFloat(row.user_bet) < row.bet_amount
                                    ? "red-text"
                                    : "grey-text"
                                  }`}
                                style={{ display: "flex", alignItems: "center" }} // Align text and icon
                              >
                                Liquidity

                              </Typography>
                              <div style={{ display: "flex", flexDirection: "row", whiteSpace: "nowrap" }}>
                                <Typography
                                  variant="body1"
                                  className={`number ${parseFloat(row.user_bet) > row.bet_amount
                                    ? "green-text"
                                    : parseFloat(row.user_bet) < row.bet_amount
                                      ? "red-text"
                                      : "grey-text"
                                    }`}
                                >
                                  {convertToCurrency(row.user_bet)}
                                </Typography>

                                {parseFloat(row.user_bet) > row.bet_amount && (
                                  <div className='chart-arrow'>
                                    <TrendingUpOutlined style={{ marginRight: "-5px", }} />
                                    <span style={{ marginLeft: "5px", fontSize: "xx-small" }}>
                                      {`(${(
                                        ((parseFloat(row.user_bet) - row.bet_amount) / row.bet_amount) *
                                        100
                                      ).toFixed(2)}%)`}
                                    </span>
                                  </div>
                                )}
                                {parseFloat(row.user_bet) < row.bet_amount && (
                                  <div className='chart-arrow'>
                                    <TrendingDownOutlined style={{ marginRight: "-5px" }} />
                                    <span style={{ marginLeft: "5px", fontSize: "xx-small" }}>
                                      {`(${(
                                        ((row.bet_amount - parseFloat(row.user_bet)) / row.bet_amount) *
                                        100
                                      ).toFixed(2)}%)`}
                                    </span>
                                  </div>
                                )}
                              </div>

                            </div>
                            <div id="view" style={{ filter: isDarkMode ? "brightness(3)" : "none" }}>
                              <Typography variant="body2" className="label">
                                Battles
                              </Typography>
                              <Typography variant="body1" className="number">
                                {row.battles}
                              </Typography>
                            </div>
                            <div id="view" style={{ filter: isDarkMode ? "brightness(3)" : "none" }}>
                              <Typography variant="body2" className="label">
                                Age
                              </Typography>
                              <Typography variant="body1" className="number">
                                {this.customFromNow(Moment(row.created_at))}
                              </Typography>
                            </div>
                          </div>

                          {/* Action Row */}
                          <div
                            className="table-cell desktop-only cell-action"
                            style={{
                              display: 'flex',                // Use Flexbox for a row layout
                              alignItems: 'center',           // Vertically align items
                              justifyContent: 'flex-start',   // Align items to the left (default behavior)
                              gap: '10px',                    // Space between the items
                            }}
                          >
                            {/* Co-host button */}
                            <a
                              className="ml-1"
                              onClick={(event) => {
                                event.preventDefault(); // Prevent default anchor tag behavior
                                event.stopPropagation();
                                this.handleCoHost(row); // Call the function with the row
                              }}
                              style={{
                                color: "rgb(0 255 58)",
                                padding: "8px 12px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                background: "linear-gradient(45deg, #28a74544, #33e74533)",
                                border: "2px solid rgb(0 255 58)",
                                cursor: "pointer",
                                borderRadius: "0.3em",
                                fontSize: "14px",
                                textDecoration: "none", // Remove default anchor styles
                              }}
                            >
                              <ShowChartOutlined style={{ width: "20px" }} />
                            </a>

                            {row.is_private && (
                              <Tooltip title="A password is required to battle this room." arrow>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    padding: "8px",
                                    borderRadius: "0.3em", // Matching border radius to co-host button
                                    backgroundColor: "#f1f1f1", // Light background color for the icon
                                    border: "2px solid #cccccc", // Subtle border
                                    cursor: "default", // Add cursor pointer to indicate interactivity
                                  }}
                                >
                                  <LockOutlined style={{ color: "#808080", fontSize: "18px" }} />
                                </div>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                        <div className="mobile-only" style={{ marginTop: '7.5px', marginBottom: '-5px' }}>
                          <div className="table-cell cell-user-name">
                            <a
                              className="player"
                              onClick={() =>
                                handleOpenPlayerModal(row.creator_id)
                              }
                            >
                              <Avatar
                                className="avatar"
                                src={row.creator_avatar}
                                accessory={row.accessory}
                                username={row.username}
                                rank={row.rank}
                                alt=""
                                darkMode={this.props.isDarkMode}
                              />
                              <i
                                className={`online-status${this.props.onlineUserList.filter(
                                  user => user === row.creator_id
                                ).length > 0
                                  ? ' online'
                                  : ''
                                  }`}
                              ></i>
                            </a>
                            {row.joiners && row.joiners.length > 0 ? (
                              <div className="table-cell mobile-only cell-joiners">
                                <Battle />
                                {row.joiner_avatars
                                  .slice(0, 3)
                                  .map((joiner_avatar, index) => (

                                    <a
                                      key={index}
                                      className="player"
                                      onClick={() =>
                                        handleOpenPlayerModal(row.joiners[index])
                                      }
                                    >
                                      <Avatar
                                        className="avatar mobile-only"
                                        key={index}
                                        src={joiner_avatar.avatar}
                                        rank={joiner_avatar.rank}
                                        username={joiner_avatar.username}
                                        alt=""
                                        accessory={joiner_avatar.accessory}
                                        darkMode={this.props.isDarkMode}
                                      />
                                    </a>
                                  ))}
                                {row.joiner_avatars.length > 3 && (
                                  <div className="avatar-square">
                                    <div className="avatar-count">
                                      +{row.joiner_avatars.length - 3}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>

                        </div>
                      </div>
                    ),
                    this
                  )}
                </Grid>
              )}

              {this.props.loading && (!this.state.isLoading) && (
                <>
                  <div className="loading-spinner">
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          null
        )}
        {!isLiveGames && (
          <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}>
            <h2 className="main-title recently-closed-title" style={{ paddingTop: "5px" }}>
              RECENTLY ENDED
            </h2>
            <Lottie style={{ filter: 'grayscale(1)' }} options={defaultOptions} width={40} />
          </div>
        )}

        {/* Show Recently Ended if the filter is "Recently Ended" */}
        {!isLiveGames && (
          <Grid container spacing={2}>
            {recent.map((row) => {
              const hostPrizeMinusBetAmount = row.host_pr - row.bet_amount;

              return (
                <Grid item xs={6} sm={4} md={3} lg={3} xl={3} key={row._id}>
                  <div
                    className="carousel-content table-row slide-in glass-container"
                    style={{
                      padding: '25px',
                      color: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      borderRadius: '8px',
                    }}
                  >
                    <a href={`/join/${row._id}`} className="table-cell">
                      <img
                        src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                        alt=""
                        className="game-type-icon"
                        width={32}
                        style={{ marginRight: "5px" }}
                      />
                      <span className="cell">{row.game_type.short_name + '-' + row.room_number}</span>
                    </a>
                    <div className="cell">
                      {row.status} <FontAwesomeIcon icon={faHeartBroken} />
                    </div>
                    <div className="cell">
                      {row.from_now} <FontAwesomeIcon icon={faStopwatch} />
                    </div>
                    <div className="cell">
                      <span className={`${this.getColorClass(hostPrizeMinusBetAmount)}`}>
                        {convertToCurrency(hostPrizeMinusBetAmount)}
                      </span>
                      <span
                        className={`${this.getColorClass(hostPrizeMinusBetAmount)}`}
                        style={{ fontSize: 'xx-small', marginLeft: '5px' }}
                      >
                        (${(hostPrizeMinusBetAmount * this.props.tokenPrice).toFixed(2)})
                      </span>
                    </div>
                  </div>
                </Grid>
              );
            })}
          </Grid>
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
          />
        </Modal>
      </>
    )
  }
}

const mapStateToProps = state => ({
  creator: state.logic.curRoomInfo.creator_name,
  joiners: state.logic.curRoomInfo.joiners,
  isAuthenticated: state.auth.isAuthenticated,
  userName: state.auth.userName,
  recentlyClosed: state.logic.recentlyClosed,
  user: state.auth.user,
  isLowGraphics: state.auth.isLowGraphics,
  loading: state.logic.isActiveLoadingOverlay
});

const mapDispatchToProps = {
  getRoomList,
  setCurRoomInfo,
  actionRoom,
  getRoomStatisticsData,
  getRecentlyClosed,
  setBalance,
  fetchMoreRooms,
  getQbot,
  addNewTransaction,
  coHost
};

export default connect(mapStateToProps, mapDispatchToProps)(OpenGamesTable);
