import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  actionRoom,
  getRoomList,
  setCurRoomInfo,
  fetchMoreRooms,
  getRecentlyClosed
} from '../../redux/Logic/logic.actions';
import { Box, Button, Typography, IconButton, ButtonGroup, TextField, Table, TableBody, TableCell, TableRow, Tooltip } from '@material-ui/core';
import { Warning, Add, Remove, Visibility } from '@material-ui/icons';
// import ReactApexChart from 'react-apexcharts';
import { Help } from '@material-ui/icons';
import Moment from 'moment';
import { faHeart, faHeartBroken, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import animationData from '../LottieAnimations/live';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons'; // Choose an appropriate icon
import {
  addNewTransaction
} from '../../redux/Logic/logic.actions';
import { setBalance } from '../../redux/Auth/user.actions';

import busdSvg from '../JoinGame/busd.svg';
// import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import Avatar from '../../components/Avatar';
import AddBoxOutlined from '@material-ui/icons/AddBoxOutlined';
// import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
// import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import Modal from 'react-modal';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
// import blob from '../LottieAnimations/blob.json';
import Battle from '../icons/Battle';
import axios from '../../util/Api';

import {
  ThumbUp,
  ThumbDown,
  ThumbUpOutlined,
  ThumbDownOutlined
} from '@material-ui/icons';

import { alertModal } from '../modal/ConfirmAlerts';
import PlayerModal from '../modal/PlayerModal';

import like from '../LottieAnimations/like.json';
import loadingChart from '../LottieAnimations/loadingChart.json';
import history from '../../redux/history';
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

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};


class OpenGamesTable extends Component {
  constructor(props) {
    super(props);
    this._isMounted = true;
    this.state = {
      selectedGameType: this.props.selectedGameType,
      showPlayerModal: false,
      selectedCreator: '',
      mouseDown: false,
      roomList: [],
      fetchedRoomIds: [],
      fetchedDataIds: [],
      showPopup: false,
      // hostNetProfitLists: [],
      actionList: null,
      isCoHostModalOpen: false,
      isFocused: false,
      isLoading: true,
    };
  }

  // generateGameTypePanel = () => {
  //   const { isLowGraphics, selectedGameType } = this.props;
  //   const gameTypeStyleClass = {
  //     R: 'roll',
  //     RPS: 'rps',
  //     'S!': 'spleesh',
  //     MB: 'mystery-box',
  //     BG: 'brain-game',
  //     QS: 'quick-shoot',
  //     DG: 'drop-game',
  //     'B!': 'bang',
  //     BJ: 'blackjack',
  //     CR: 'craps'
  //   };

  //   const gameTypePanel = (
  //     <Box
  //       display="flex"
  //       justifyContent="space-evenly"
  //       flexWrap="nowrap"
  //       gap="15px"
  //       ref={ref => (this.game_type_panel = ref)}
  //     >
  //       <Box key="open-game-left-button">
  //         <Button
  //           className="btn-arrow-left"
  //           onClick={this.handleBtnLeftClicked}
  //         >
  //           <ChevronLeftIcon />
  //         </Button>
  //       </Box>

  //       <Button
  //         className={`btn-game-type btn-icon all-games ${selectedGameType === 'All' ? 'active' : ''
  //           }`}
  //         key="open-game-all-game-button"
  //         onClick={() => {
  //           this.handleGameTypeButtonClicked('All');
  //         }}
  //       >
  //         {selectedGameType === 'All' && (
  //           <Lottie
  //             options={{
  //               loop: false,
  //               autoplay: false,
  //               animationData: blob
  //             }}
  //             style={{
  //               width: '100px',
  //               position: 'absolute',
  //               // filter: 'hue-rotate(222deg)',
  //               opacity: '0.4',
  //               margin: '0px -18px 0 auto',
  //               zIndex: '-1'
  //             }}
  //           />
  //         )}
  //         <div className="icon">
  //           <img src={`/img/gametype/icons/All.svg`} alt={`All Games`} />
  //           <span>All Games</span>
  //         </div>
  //       </Button>
  //       {this.props.gameTypeList.map((gameType, index) => (
  //         <Button
  //           className={`btn-game-type btn-icon ${gameTypeStyleClass[gameType.short_name]
  //             } ${selectedGameType === gameType.short_name
  //               ? 'active'
  //               : ''
  //             }`}
  //           key={index}
  //           onClick={() => {
  //             this.handleGameTypeButtonClicked(gameType.short_name);
  //           }}
  //         >
  //           {selectedGameType === gameType.short_name && (
  //             <Lottie
  //               options={{
  //                 loop: false,
  //                 autoplay: false,
  //                 animationData: blob
  //               }}
  //               style={{
  //                 width: '100px',
  //                 position: 'absolute',
  //                 // filter: 'hue-rotate(222deg)',
  //                 opacity: '0.4',
  //                 margin: '0px -18px 0 auto',
  //                 zIndex: '-1'
  //               }}
  //             />
  //           )}
  //           <div className="icon">
  //             <img
  //               src={`/img/gametype/icons/${gameType.short_name}.svg`}
  //               alt={gameType.game_type_name}
  //             />
  //             <span>{gameType.game_type_name}</span>
  //           </div>
  //         </Button>
  //       ))}
  //       <Button
  //         className="btn-arrow-right"
  //         key="open-game-right-button"
  //         onClick={this.handleBtnRightClicked}
  //       >
  //         <ChevronRightIcon />
  //       </Button>
  //     </Box>
  //   );

  //   return gameTypePanel;
  // };

  async componentDidMount() {
    this.props.getRoomList({ pageSize: 7 });
    await this.props.getRecentlyClosed();
    window.addEventListener('load', this.handleLoad);
    window.addEventListener('scroll', this.handleScroll);
  }


  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('load', this.handleLoad);
  }

  componentDidUpdate(prevProps, prevState) {
    const roomIds = this.props.roomList.map(room => room._id);

    if (prevProps.roomList !== this.props.roomList) {
      this.setState(prevState => ({
        roomList: [...prevState.roomList, ...this.props.roomList.filter(room => !prevState.fetchedRoomIds.includes(room._id))],
        fetchedRoomIds: [...prevState.fetchedRoomIds, ...roomIds],
        isLoading: false,
        loaded: true
      }));
      this.setState({
        roomList: this.props.roomList
      })
    }

    if (this.props.rooms_count !== prevProps.roomList.length) {
      this.props.handleRefresh();
    }

    if (prevProps.refreshing !== this.props.refreshing) {
      if (this.props.refreshing) {
        this.setState({
          roomList: []
        })
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
      const isTableAtBottom = bottom <= window.innerHeight;

      if (!loading && isTableAtBottom && rooms_count !== roomList.length) {
        await this.props.fetchMoreRooms({
          pageSize: roomList.length + 3,
          game_type: selectedGameType,
          excludeIds: fetchedRoomIds, // Pass already fetched room IDs to exclude them
        }, roomList);
      }
    }
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

  togglePopup = () => {
    this.setState({ showPopup: !this.state.showPopup });
  };

  handleSendCoHost = async () => {
    try {
      if (this.state.coHostAmount < 0) {
        alertModal(
          this.props.isDarkMode,
          `R U FURR-REAL? COHOST AMOUNT MUST BE MORE THAN 0!`
        );
        return;
      }

      if (this.state.coHostAmount > this.props.balance) {
        alertModal(this.props.isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
        return;
      }

      const result = await axios.post('/game/coHost/', {
        amount: this.state.coHostAmount,
        rowId: this.state.selectedRow._id,
      });

      if (result.data.success) {

        alertModal(this.props.isDarkMode, result.data.message, '-cat');
        this.props.setBalance(result.data.balance);
        this.props.addNewTransaction(result.data.newTransaction);
        await this.props.getRoomList({
          pageSize: this.state.roomList.length,
          game_type: this.props.selectedGameType
        });
        // this.setState({ isLoading: false });
        this.handleCloseCoHostModal();
      } else {
        // this.setState({ isLoading: false });
        alertModal(this.props.isDarkMode, result.data.message);
      }
    } catch (e) {
      // this.setState({ isLoading: false });
      if (this.state.amount <= 0) {
        alertModal(this.props.isDarkMode, `FAILED TRANSACTION`);
        return;
      }
    }
  };

  customFromNow(date) {
    const now = Moment();
    const duration = Moment.duration(now.diff(date));

    if (duration.asSeconds() < 60) {
      return `${Math.round(duration.asSeconds())}s ago`;
    } else if (duration.asMinutes() < 60) {
      return `${Math.round(duration.asMinutes())}m ago`;
    } else if (duration.asHours() < 24) {
      return `${Math.round(duration.asHours())}h ago`;
    } else {
      return `${Math.round(duration.asDays())}d ago`;
    }
  }

  updateFromNow(history) {
    const result = JSON.parse(JSON.stringify(history));
    for (let i = 0; i < result.length; i++) {
      result[i]['from_now'] = this.customFromNow(Moment(result[i]['updated_at']));
    }
    return result;
  }

  // getRoomData = async (roomIds) => {
  //   try {
  //     const newRoomIds = roomIds.filter(roomId => !this.state.fetchedDataIds.includes(roomId));
  //     const hostNetProfitListPromises = newRoomIds.map(roomId =>
  //       this.props.getRoomStatisticsData(roomId, 20)
  //     );

  //     const newHostNetProfitLists = await Promise.all(hostNetProfitListPromises);

  //     this.setState(prevState => {
  //       const updatedHostNetProfitLists = [...prevState.hostNetProfitLists, ...newHostNetProfitLists];
  //       const uniqueRoomIds = new Set([...prevState.fetchedDataIds, ...newRoomIds]);
  //       const updatedFetchedDataIds = Array.from(uniqueRoomIds);

  //       const netProfitsByRoom = updatedHostNetProfitLists.map(hostNetProfitList => {
  //         const hostNetProfit = hostNetProfitList.hostNetProfit;
  //         const lastIndexNetProfit = hostNetProfit[hostNetProfit.length - 1];
  //         return lastIndexNetProfit;
  //       });

  //       const hostNetProfits = updatedHostNetProfitLists.map(item => item.hostNetProfit);
  //       const hostBetsValue = updatedHostNetProfitLists.map(item => item.hostBetsValue);

  //       return {
  //         hostNetProfitLists: updatedHostNetProfitLists,
  //         fetchedDataIds: updatedFetchedDataIds,
  //         hostNetProfitList: netProfitsByRoom,
  //         actionList: {
  //           hostNetProfits,
  //           hostBetsValue
  //         }
  //       };
  //     });

  //   } catch (error) {
  //     console.error('Error fetching room data:', error);
  //   }
  // };

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

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

  // handleDislike = ({ _id }) => {
  //   const updatedRoomList = this.state.roomList.map(room => {
  //     if (room._id === _id) {
  //       const likesIndex = room.likes.indexOf(this.props.user._id);
  //       const dislikesIndex = room.dislikes.indexOf(this.props.user._id);

  //       if (dislikesIndex > -1) {
  //         room.dislikes.splice(dislikesIndex, 1);
  //       } else if (likesIndex > -1) {
  //         room.likes.splice(likesIndex, 1);
  //         room.dislikes.push(this.props.user._id);
  //         this.handleAction({ roomId: _id, type: 'like' });
  //       } else {
  //         room.dislikes.push(this.props.user._id);
  //       }
  //     }
  //     return room;
  //   });

  //   this.setState({ roomList: updatedRoomList });
  //   this.handleAction({ roomId: _id, type: 'dislike' });
  // };

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

  joinRoom = e => {
    this.setState({ isClicked: true });

    const creator_id = e.currentTarget.getAttribute('data-creatorId');
    const bet_amount = e.currentTarget.getAttribute('data-betAmount');

    if (e.currentTarget.getAttribute('data-roomStatus') === 'finished') {
      alertModal(this.props.isDarkMode, `THIS BATTLE HAS NOW ENDED`);
      return;
    }

    const room_id = e.currentTarget.getAttribute('data-id');

    this.props.setCurRoomInfo({
      _id: room_id,
      game_type: e.currentTarget.getAttribute('data-gameType'),
      bet_amount: bet_amount,
      creator_id: creator_id,
      hosts: [],
      // endgame_amount: e.currentTarget.getAttribute('data-endgame_amount'),
      // spleesh_bet_unit: parseInt(
      //   e.currentTarget.getAttribute('data-spleeshBetUnit')
      // ),
      // box_price: parseFloat(e.currentTarget.getAttribute('data-boxPrice')),
      game_log_list: [],
      // box_list: [],
      // brain_game_type: {
      //   _id: e.currentTarget.getAttribute('data-brainGameTypeId'),
      //   game_type_name: e.currentTarget.getAttribute('data-brainGameTypeName')
      // },
      // brain_game_score: e.currentTarget.getAttribute('data-brainGameScore')
    });
    history.push('/join/' + room_id);
  };

  // handleGameTypeButtonClicked = async short_name => {
  //   await this.props.onChangeGameType(short_name, async () => {
  //     this.setState({ roomList: [], fetchedRoomIds: [] }, async () => {
  //       await this.props.getRoomList({
  //         pageSize: 7,
  //         game_type: short_name
  //       });
  //     });
  //   });
  // };

  // handleBtnLeftClicked = e => {
  //   const scrollAmount = 200;
  //   this.game_type_panel.scrollLeft -= scrollAmount;
  // };

  // handleBtnRightClicked = e => {
  //   const scrollAmount = 200;
  //   this.game_type_panel.scrollLeft += scrollAmount;
  // };

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

  handleMaxButtonClick = () => {
    if (this.props.balance) {
      const maxPayoutAmount = this.props.balance;
      const roundedMaxPayoutAmount = Math.floor(maxPayoutAmount * 1e6) / 1e6;

      this.setState(
        {
          coHostAmount: roundedMaxPayoutAmount,
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

  render() {
    // const gameTypePanel = this.generateGameTypePanel();
    const {
      // hostNetProfitList,
      showPlayerModal,
      selectedCreator,
      isFocused,
    } = this.state;
    const { isLowGraphics, isDarkMode, recentlyClosed } = this.props;
    let recent = recentlyClosed ? this.updateFromNow(recentlyClosed) : [];

    return (
      <>
        <div className="overflowX">
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
          {/* <div className="table-header">
            <div className="table-cell room-id">Room ID</div>
            <div className="table-cell bet-info">host / PLAYER</div>
            <div className="table-cell payout">Net profit </div>
            <div className="table-cell action desktop-only">Bet/Bankroll</div>
          </div>*/}
        </div>
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={this.handleClosePlayerModal}
          // {...this.state.selectedRow}
          />
        )}

        <div className="table main-game-table">
          {this.state.isLoading ? (
            <>
              <span style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>Fetching Rooms&nbsp;</span>

              <div className="loading-gif-container">
                <img src={randomGifUrl} id="isLoading" alt="loading" />
              </div>
            </>
          ) : (
            <>
              {(this.props.roomList.length === 0 && !this.state.isLoading && !this.props.loading) ? (
                <div className="dont-have-game-msg">
                  <div>NO LIVE BATTLES, GO TO 'MANAGE' TO CREATE ONE</div>
                </div>
              ) : (
                <>
                  {this.state.roomList.map(
                    (row, key) => (
                      <div
                        className={`table-row ${key < 10 ? 'slide-in' : 'slide-in'}`}
                        style={{ animationDelay: `${key * 0.1}s` }}
                        key={row._id}
                      >
                        {' '}
                        {/* {renderLottieAvatarAnimation(
                        row.gameBackground,
                        isLowGraphics
                      )} */}
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
                                className="avatar desktop-only"
                                src={row.creator_avatar}
                                accessory={row.accessory}
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
                                    onClick={() => this.handleOpenPlayerModal(host.host._id)}
                                  >
                                    <Avatar
                                      className="avatar desktop-only"
                                      src={host.avatar}
                                      accessory={host.accessory}
                                      rank={host.rank}
                                      alt=""
                                      darkMode={this.props.isDarkMode}
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
                                      className="player"
                                      onClick={() =>
                                        this.handleOpenPlayerModal(row.joiners)
                                      }
                                    >
                                      <Avatar
                                        className="avatar desktop-only"
                                        key={index}
                                        accessory={joiner.accessory}
                                        src={joiner.avatar}
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


                          <div className="table-cell desktop-only cell-likes">
                            <div id="view">
                              <Visibility style={{ fontSize: '1rem' }} />
                              <Typography variant="body1">
                                {row.views?.length || 0}
                              </Typography>
                            </div>

                            <div>
                              <IconButton onClick={() => this.handleLike(row)}>
                                {row.likes?.includes(this.props.user._id) ? (
                                  <>
                                    {!row.likeAnimation && (
                                      <ThumbUp
                                        style={{ fontSize: '1rem', color: 'red' }}
                                      />
                                    )}
                                    {row.likeAnimation && (
                                      <Lottie
                                        options={{
                                          loop: false,
                                          autoplay: true,
                                          animationData: like
                                        }}
                                        style={{
                                          width: '32px',
                                          height: '38px',
                                          margin: '-26px -8px -20px -8px'
                                        }}
                                      />
                                    )}
                                  </>
                                ) : (
                                  <ThumbUpOutlined style={{ fontSize: '1rem' }} />
                                )}
                              </IconButton>
                              <Typography variant="body1">
                                {row.likes?.length || 0}
                              </Typography>
                            </div>
                          </div>
                          <div
                            className="table-cell cell-action"
                            onClick={() => this.handleView(row)}
                          >
                            {row.creator_id !== this.props.user._id && (

                              <a
                                className="ml-1"
                                onClick={() => this.handleCoHost(row)}
                                style={{ color: "#28a745", padding: "2.5px ", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(45deg, #28a74544, #33e74533)", border: "2px solid #28a745", cursor: "pointer", borderRadius: "0.3em", display: "inline-flex", verticalAlign: "middle" }}
                              >
                                <AddBoxOutlined style={{ width: "25px" }} /><img style={{ width: "15px" }} src={busdSvg} />
                              </a>
                            )}
                            <Button
                              className="btn_join"
                              onClick={event => {
                                event.currentTarget.classList.add('active');
                                this.joinRoom(event);
                              }}
                              data-id={row._id}
                              // data-endgame-amount={row.endgame_amount}
                              data-creator-id={row.creator_id}
                              data-room-status={row.status}
                              data-game-type={row.game_type.game_type_name}
                              data-bet-amount={row.user_bet}
                            // data-spleesh-bet-unit={row.spleesh_bet_unit}
                            // data-box-price={row.box_price}
                            // data-brain-game-type-id={
                            //   row.brain_game_type ? row.brain_game_type._id : ''
                            // }
                            // data-brain-game-type-name={
                            //   row.brain_game_type
                            //     ? row.brain_game_type.game_type_name
                            //     : ''
                            // }
                            // data-brain-game-score={
                            //   row.brain_game_score ? row.brain_game_score : 0
                            // }
                            >
                              {row.is_private && (
                                <img
                                  src="/img/icon-lock.png"
                                  alt=""
                                  className="lock-icon"
                                />
                              )}
                              {row.game_type.game_type_name !== 'Spleesh!' &&
                                // row.game_type.game_type_name !== 'Drop Game' &&
                                row.game_type.game_type_name !== 'Mystery Box' && (
                                  <>WIN&nbsp;{convertToCurrency(row.user_bet)}</>
                                )}
                            </Button>
                          </div>
                        </div>
                        <div className="mobile-only" style={{ marginTop: '7.5px', marginBottom: '-5px' }}>
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
                                accessory={row.accessory}
                                rank={row.rank}
                                alt=""
                                darkMode={this.props.isDarkMode}
                              />
                              {/* <span>{row.creator}</span> */}
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
                                    <Avatar
                                      className="avatar"
                                      key={index}
                                      src={joiner_avatar.avatar}
                                      rank={joiner_avatar.rank}
                                      alt=""
                                      accessory={joiner_avatar.accessory}
                                      darkMode={this.props.isDarkMode}
                                    />
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
                          <div className="table-cell mobile-only cell-likes">
                            <div id="view">
                              <Visibility style={{ fontSize: '1rem' }} />
                              <Typography variant="body1">
                                {row.views?.length || 0}
                              </Typography>
                            </div>

                            <div>
                              <IconButton onClick={() => this.handleLike(row)}>
                                {row.likes?.includes(this.props.user._id) ? (
                                  <>
                                    {!row.likeAnimation && (
                                      <ThumbUp
                                        style={{ fontSize: '1rem', color: 'red' }}
                                      />
                                    )}
                                    {row.likeAnimation && (
                                      <Lottie
                                        options={{
                                          loop: false,
                                          autoplay: true,
                                          animationData: like
                                        }}
                                        style={{
                                          width: '32px',
                                          height: '38px',
                                          margin: '-26px -8px -20px -8px'
                                        }}
                                      />
                                    )}
                                  </>
                                ) : (
                                  <ThumbUpOutlined style={{ fontSize: '1rem' }} />
                                )}
                              </IconButton>
                              <Typography variant="body1">
                                {row.likes?.length || 0}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                    this
                  )}</>
              )}
              <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}>

                <h2 class="main-title recently-closed-title" style={{ paddingTop: "5px" }}>RECENTLY ENDED</h2> <Lottie style={{ filter: 'grayscale(1)' }} options={defaultOptions} width={40} />
              </div>
              <div className='recently-closed'>
                {recent?.map((row) => (
                  <div key={row._id} className="carousel-content table-row slide-in">
                    <a href={`/join/${row._id}`} className="table-cell">
                      <img
                        src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                        alt=""
                        className="game-type-icon"
                      />
                      <div className="cell">
                        {row.game_type.game_type_name}
                      </div>
                      <div className="cell">{'-' + row.room_number}</div>
                    </a>
                    <div className="cell">
                      {row.status}&nbsp;{<FontAwesomeIcon icon={faHeartBroken} />}
                    </div>
                    <div className="cell">{row.from_now}&nbsp;{<FontAwesomeIcon icon={faStopwatch} />}</div>
                    <div className={"cell"}>
                      <span className={`${this.getColorClass(row.host_pr - row.bet_amount)}`}>{convertToCurrency(row.host_pr - row.bet_amount)}</span>
                    </div>
                    <a
                      href="#"
                      className="player"
                      onClick={() => this.handleOpenPlayerModal(row.creator._id)}
                    >
                      <Avatar
                        className="avatar"
                        src={row.creator.avatar}
                        accessory={row.creator.accessory}
                        rank={row.creator.totalWagered}
                        alt=""
                        darkMode={this.props.isDarkMode}
                      />
                      <i
                        className={`online-status${this.props.onlineUserList.filter((user) => user === row.creator._id).length > 0
                          ? ' online'
                          : ''
                          }`}
                      ></i>
                    </a>
                  </div>
                ))}
              </div>
            </>

          )}

          {this.props.loading && (!this.state.isLoading) && (
            <>
              <div className="loading-spinner">
              </div>


            </>
          )}


        </div>

        <Modal
          isOpen={this.state.isCoHostModalOpen}
          onRequestClose={this.handleCloseCoHostModal}
          style={customStyles}
          contentLabel="CoHost Modal"
        >
          <div className={`${this.props.isDarkMode ? 'dark_mode' : ''} big-modal`}>
            <div className="modal-header">

              <h2 className="modal-title">
                <FontAwesomeIcon icon={faUsers} className="mr-2" />
                CO-HOST
              </h2>
              <Button className="btn-close" onClick={this.handleCloseCoHostModal}>
                ×
              </Button>
            </div>
            <div className="modal-body">
              <div className="modal-content-wrapper">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h1 className='modal-title'>BECOME A CO-HOST</h1>

                  <div style={{ width: '50%', textAlign: 'right', padding: '20px' }}>
                    <span>HELP</span>&nbsp;
                    <span>
                      <Help style={{ width: '16', marginTop: '-3px', cursor: 'pointer' }} onClick={this.togglePopup} />
                    </span>
                  </div>

                </div>
                <div className="modal-content-panel">
                  <div className="input-amount">

                    <TextField
                      label="Amount"
                      value={this.state.coHostAmount}
                      onChange={this.handleCoHostAmountChange}
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
                          <span>NEW BALANCE:</span>
                        </TableCell>
                        <TableCell>
                          {convertToCurrency(
                            (this.props.balance || 0) - (this.state.coHostAmount || 0)
                          )}
                          &nbsp;
                          {((this.props.balance || 0) - (this.state.coHostAmount || 0)) < 0 && <Warning width="15pt" />}
                        </TableCell>


                      </TableRow>


                      <TableRow>
                        <TableCell>
                          <span>CURRENT BANKROLL:</span>
                        </TableCell>
                        <TableCell style={{ color: "#ffb000" }}>
                          {this.state.selectedRow ? (
                            convertToCurrency(this.state.selectedRow.user_bet)
                          ) : (
                            null
                          )}
                        </TableCell>

                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <span>NEW BANKROLL:</span>
                        </TableCell>
                        <TableCell style={{ color: "#ffb000" }}>
                          {this.state.selectedRow ? (
                            convertToCurrency(parseFloat(this.state.selectedRow.user_bet) + parseFloat(this.state.coHostAmount || 0))
                          ) : (
                            null
                          )}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>
                          <span>CURRENT SHARE:</span>
                        </TableCell>
                        {this.state.selectedRow ? (

                          <TableCell style={{ color: 'red' }}>
                            {this.state.selectedRow.hosts && this.state.selectedRow.hosts.some(host => host.host === this.props.user._id) ? (
                              <>
                                {`${(this.state.selectedRow.hosts.find(host => host.host === this.props.user._id).share).toFixed(2)}%`}

                              </>
                            ) : (
                              convertToCurrency('0')
                            )}
                          </TableCell>
                        ) : (
                          null
                        )}

                      </TableRow>


                      <TableRow>
                        <TableCell>
                          <span>NEW SHARE:</span>
                        </TableCell>
                        {this.state.selectedRow ? (
                          <TableCell style={{ color: 'red' }}>
                            {this.state.selectedRow.hosts && this.state.selectedRow.hosts.some(host => host.host === this.props.user._id) ? (
                              // Assuming selectedRow.hosts is an array of objects with a structure like { host: 'user_id', share: 'share_value' }
                              <>
                                {(`
                                ${(((((this.state.selectedRow.hosts.find(host => host.host === this.props.user._id).share) / 100) *
                                    parseFloat(this.state.selectedRow.user_bet)) + parseFloat(this.state.coHostAmount || 0)) / (parseFloat(this.state.selectedRow.user_bet) + parseFloat(this.state.coHostAmount || 0)) * 100).toFixed(2)}%
                                `)}
                              </>

                            ) : (
                              <>
                                {(((parseFloat(this.state.coHostAmount || 0)) / (parseFloat(this.state.coHostAmount || 0) + parseFloat(this.state.selectedRow.user_bet))) * 100).toFixed(2)}%
                              </>


                            )}
                          </TableCell>

                        ) : (
                          null
                        )}

                      </TableRow>

                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.handleSendCoHost}>
                CONTRIBUTE
              </Button>
              <Button
                className="btn-back"
                onClick={this.handleCloseCoHostModal}
              >
                Cancel
              </Button>
            </div>
          </div>
          {this.state.showPopup && (
            <div className={`${isDarkMode ? 'popup-overlay dark_mode' : 'popup-overlay'}`}>

              <div className="popup">
                <h2 className='modal-title' style={{ textAlign: 'center', marginBottom: "20px" }}>Co-Hosting Information</h2>
                <div className="popup-content">
                  <img src={'../img/co-host.svg'} style={{ borderRadius: '20px', border: '1px solid aaa9', overflow: 'hidden' }} />

                  <h3>Co-Hosting Overview</h3>
                  <p>Co-Hosting, allows you to invest in existing games and own a share of its profits.</p>
                  <p>Steps to become a co-host:</p>
                  <ol>
                    <li>Go To 'Live Battles'</li>
                    <li>Pick a game from the list (check the mini-charts for steady growth games).</li>
                    <li>Click the green plus <span style={{ color: 'green' }}>[+]</span> next to the 'WIN' button.</li>
                    <li>In the Co-Hosting Popup, enter the amount you want to invest and click 'CONTRIBUTE'.</li>
                    <li>Sit back and wait for automatic payouts (if Host has enabled) or your share value to increase as its bankroll increases.</li>
                  </ol>
                  <i>PRO TIP: You can track your earnings by searching for 'co-host' in All Transactions by clicking your wallet then View-All.</i>

                  <Button style={{ display: 'block', margin: 'auto' }} onClick={this.togglePopup}>OK, GOT IT!</Button>
                </div>
                <button className="popup-close" onClick={this.togglePopup}>&times;</button>
              </div>
            </div>
          )}
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
  addNewTransaction
};

export default connect(mapStateToProps, mapDispatchToProps)(OpenGamesTable);
