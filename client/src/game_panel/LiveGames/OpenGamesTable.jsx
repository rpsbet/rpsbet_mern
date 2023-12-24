import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  actionRoom,
  getRoomList,
  setCurRoomInfo
} from '../../redux/Logic/logic.actions';
import { Box, Button, Typography, IconButton } from '@material-ui/core';
import { Add, Remove, Visibility } from '@material-ui/icons';
import ReactApexChart from 'react-apexcharts';
import palmTree from '../icons/palm-tree.svg'
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
// import gemBg from '../LottieAnimations/gem-bg.json';
import Avatar from '../../components/Avatar';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
// import Pagination from '.. /../components/Pagination';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
import blob from '../LottieAnimations/blob.json';
import Battle from '../icons/Battle';
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

class OpenGamesTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedGameType: '',
      isLoading: this.props.isLoading,
      showPlayerModal: false,
      selectedCreator: '',
      mouseDown: false,
      roomList: [],
      hostNetProfitList: [],
      actionList: null
    };
  }

  generateGameTypePanel = () => {
    const { isLowGraphics } = this.props;
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
                // filter: 'hue-rotate(222deg)',
                opacity: '0.4',
                margin: '0px -18px 0 auto',
                zIndex: '-1'
              }}
            />
          )}
          <div className="icon">
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
                  zIndex: '-1'
                }}
              />
            )}
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


  componentDidMount() {
    const { roomList } = this.props;
    this.setState({ roomList });
    const roomIds = roomList.map(room => room._id);
    this.getRoomData(roomIds);
    window.addEventListener('load', this.handleLoad);
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('load', this.handleLoad);

  }

  componentDidUpdate(prevProps, prevState) {
    const { roomList } = this.props;
    const roomIds = roomList.map(room => room._id);
    if (prevProps.roomList !== this.props.roomList) {
      this.setState({ roomList, isLoading: false });
      this.getRoomData(roomIds);
    }
    if (prevState.selectedGameType !== this.state.selectedGameType) {
      this.setState({ isLoading: true });

    }
  }

  handleLoad = () => {
    this.setState({ loaded: true, selectedGameType: 'All' });
  };

  handleScroll = async () => {
    const tableElement = document.querySelector('.table.main-game-table');
    if (tableElement) {
      const { bottom } = tableElement.getBoundingClientRect();
      const isTableAtBottom = bottom <= window.innerHeight;

      if (isTableAtBottom && this.state.roomList.length !== this.props.roomCount) {
        await this.props.getRoomList({
          pageSize: this.state.roomList.length + 6,
          game_type: this.state.selectedGameType
        });
      }
    }
  };

  getRoomData = async roomIds => {
    try {
      const hostNetProfitListPromises = roomIds.map(roomId =>
        this.props.getRoomStatisticsData(roomId)
      );

      const hostNetProfitLists = await Promise.all(hostNetProfitListPromises);

      const netProfitsByRoom = hostNetProfitLists.map(hostNetProfitList => {
        const hostNetProfit = hostNetProfitList.hostNetProfit;
        const lastIndexNetProfit = hostNetProfit[hostNetProfit.length - 1];
        return lastIndexNetProfit;
      });

      const hostNetProfits = hostNetProfitLists.map(item => item.hostNetProfit);
      const hostBetsValue = hostNetProfitLists.map(item => item.hostBetsValue);

      this.setState({
        hostNetProfitList: netProfitsByRoom,
        actionList: {
          hostNetProfits,
          hostBetsValue
        }
      });
    } catch (error) {
      console.error('Error fetching room data:', error);
    }
  };

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleLike = ({ _id }) => {
    const updatedRoomList = this.state.roomList.map(room => {
      if (room._id === _id) {
        const likesIndex = room.likes.indexOf(this.props.user._id);
        const dislikesIndex = room.dislikes.indexOf(this.props.user._id);

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

  handleDislike = ({ _id }) => {
    const updatedRoomList = this.state.roomList.map(room => {
      if (room._id === _id) {
        const likesIndex = room.likes.indexOf(this.props.user._id);
        const dislikesIndex = room.dislikes.indexOf(this.props.user._id);

        if (dislikesIndex > -1) {
          room.dislikes.splice(dislikesIndex, 1);
        } else if (likesIndex > -1) {
          room.likes.splice(likesIndex, 1);
          room.dislikes.push(this.props.user._id);
          this.handleAction({ roomId: _id, type: 'like' });
        } else {
          room.dislikes.push(this.props.user._id);
        }
      }
      return room;
    });

    this.setState({ roomList: updatedRoomList });
    this.handleAction({ roomId: _id, type: 'dislike' });
  };

  handleAction = ({ roomId, type }) => {
    const { user, pageNumber } = this.props;
    if (user && user._id) {
      this.props.actionRoom({
        roomId,
        type,
        conditions: {
          page: pageNumber !== undefined ? pageNumber : 0,
          game_type: this.state.selectedGameType
        }
      });
    }
  };

  handleView = ({ _id }) => {
    this.handleViewAction({ roomId: _id, type: 'view' });
  };

  handleViewAction = ({ roomId, type }) => {
    const { user, pageNumber } = this.props;
    if (user && user._id) {
      this.props.actionRoom({
        roomId,
        type,
        conditions: {
          page: pageNumber !== undefined ? pageNumber : 0,
          game_type: this.state.selectedGameType
        }
      });
    }
  };

  joinRoom = e => {
    this.setState({ isClicked: true });

    const creator_id = e.currentTarget.getAttribute('data-creatorId');
    const bet_amount = e.currentTarget.getAttribute('data-betAmount');

    if (e.currentTarget.getAttribute('data-roomStatus') === 'finished') {
      alertModal(this.props.isDarkMode, `THIS GAME HAS ENDED ALREADY`);
      return;
    }

    const room_id = e.currentTarget.getAttribute('data-id');

    this.props.setCurRoomInfo({
      _id: room_id,
      game_type: e.currentTarget.getAttribute('data-gameType'),
      bet_amount: bet_amount,
      creator_id: creator_id,
      // endgame_amount: e.currentTarget.getAttribute('data-endgame_amount'),
      spleesh_bet_unit: parseInt(
        e.currentTarget.getAttribute('data-spleeshBetUnit')
      ),
      box_price: parseFloat(e.currentTarget.getAttribute('data-boxPrice')),
      game_log_list: [],
      box_list: [],
      brain_game_type: {
        _id: e.currentTarget.getAttribute('data-brainGameTypeId'),
        game_type_name: e.currentTarget.getAttribute('data-brainGameTypeName')
      },
      brain_game_score: e.currentTarget.getAttribute('data-brainGameScore')
    });
    history.push('/join/' + room_id);
  };

  handleGameTypeButtonClicked = async short_name => {
    this.setState({ selectedGameType: short_name });
    await this.props.getRoomList({
      game_type: short_name
    });

  };

  handleBtnLeftClicked = e => {
    const scrollAmount = 200;
    this.game_type_panel.scrollLeft -= scrollAmount;
  };

  handleBtnRightClicked = e => {
    const scrollAmount = 200;
    this.game_type_panel.scrollLeft += scrollAmount;
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

  render() {
    const gameTypePanel = this.generateGameTypePanel();
    const {
      hostNetProfitList,
      isLoading,
      showPlayerModal,
      selectedCreator
    } = this.state;
    const { isLowGraphics, loading } = this.props;
    const roomStatistics = this.state.actionList || {
      hostNetProfits: [],
      hostBetsValue: []
    };
    // console.log(roomStatistics)
    return (
      <>
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
          {/* <div className="table-header">
            <div className="table-cell room-id">Room ID</div>
            <div className="table-cell bet-info">host / PLAYER</div>
            <div className="table-cell payout">Net profit </div>
            <div className="table-cell action desktop-only">Bet/Bankroll</div>
          </div>*/}
        </div>
        {isLoading && loading ? (
          <div className="loading-gif-container">
            <img src={randomGifUrl} id="isLoading" alt="loading" />
          </div>
        ) : (
          <div className="table main-game-table">
            {this.props.roomList.length === 0 && (
              <div className="dont-have-game-msg">
                <div>NO BATTLES YET, GO TO 'MANAGE' AND CREATE ONE</div>
              </div>
            )}
            {showPlayerModal && (
              <PlayerModal
                selectedCreator={selectedCreator}
                modalIsOpen={showPlayerModal}
                closeModal={this.handleClosePlayerModal}
              // {...this.state.selectedRow}
              />
            )}

            {this.state.roomList.map(
              (row, key) => (
                <div
                  className={`table-row ${key < 10 ? 'slide-in' : ''}`}
                  style={{ animationDelay: `${key * 0.1}s` }}
                  key={row._id}
                >
                  {' '}
                  {renderLottieAvatarAnimation(
                    row.gameBackground,
                    isLowGraphics
                  )}
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
                      {row.joiners && row.joiners.length > 0 ? (
                        <div className="table-cell avatar desktop-only cell-joiners">
                          <Battle />
                          {row.joiner_avatars
                            .slice(0, 1)
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
                          {row.joiner_avatars.length > 1 && (
                            <div className="avatar-square">
                              <div className="avatar-count">
                                +{row.joiner_avatars.length - 1}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <div className="table-cell cell-amount">
                      {roomStatistics &&
                        roomStatistics.hostBetsValue.length > 0 ? (
                        <>
                          <ReactApexChart
                            className="bankroll-graph"
                            options={{
                              chart: {
                                animations: {
                                  enabled: false
                                },
                                toolbar: {
                                  show: false
                                },
                                events: {},
                                zoom: {
                                  enabled: false
                                }
                              },
                              grid: {
                                show: false
                              },
                              tooltip: {
                                enabled: false
                              },
                              fill: {
                                type: 'gradient',
                                gradient: {
                                  shade: 'light',
                                  gradientToColors:
                                    hostNetProfitList[key] > 0
                                      ? ['#00FF00']
                                      : hostNetProfitList[key] < 0
                                        ? ['#FF0000']
                                        : ['#808080'],
                                  shadeIntensity: 1,
                                  type: 'vertical',
                                  opacityFrom: 0.7,
                                  opacityTo: 0.9,
                                  stops: [0, 100, 100]
                                }
                              },

                              stroke: {
                                curve: 'smooth'
                              },
                              xaxis: {
                                labels: {
                                  show: false
                                },
                                axisTicks: {
                                  show: false
                                },
                                axisBorder: {
                                  show: false
                                }
                              },
                              yaxis: {
                                labels: {
                                  show: false
                                },
                                axisTicks: {
                                  show: false
                                },
                                axisBorder: {
                                  show: false
                                }
                              }
                            }}
                            type="line"
                            width={120}
                            height="100"
                            series={[
                              {
                                data:
                                  roomStatistics.hostNetProfits[key] &&
                                    roomStatistics.hostBetsValue[key]
                                    ? roomStatistics.hostNetProfits[
                                      key
                                    ].map((value, index) => [
                                      roomStatistics.hostBetsValue[key][
                                      index
                                      ],
                                      value
                                    ])
                                    : []
                              }
                            ]}
                          />
                          <div
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            {/* {this.renderArrow(hostNetProfitList[key])} */}
                            <span
                              style={{
                                color: this.calculateColor(
                                  hostNetProfitList[key]
                                )
                              }}
                            >
                              {convertToCurrency(hostNetProfitList[key])}
                            </span>
                          </div>
                          {row.joiners && row.joiners.length > 0 ? (

                            <div id="palmTree">

                              <img className="palm-trees desktop-only" src={palmTree} />
                            </div>
                          ) : (null)
                          }
                        </>
                      ) : (
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
                      )}
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
                          <>WIN {convertToCurrency(row.pr)}</>
                        )}
                        {/* {row.game_type.game_type_name === 'Drop Game' && (
                          <>WIN ?</>
                        )} */}
                        {row.game_type.game_type_name !== 'Spleesh!' &&
                          // row.game_type.game_type_name !== 'Drop Game' &&
                          row.game_type.game_type_name !== 'Mystery Box' && (
                            <>WIN {convertToCurrency(row.user_bet)}</>
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
                            .slice(0, 5)
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
                          {row.joiner_avatars.length > 5 && (
                            <div className="avatar-square">
                              <div className="avatar-count">
                                +{row.joiner_avatars.length - 5}
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
            )}
          </div>
        )}
        {!isLoading && (this.props.roomList.length !== this.props.roomCount) && (
          <div className='loading-spinner'></div>
        )}
      </>
    )
  }
}

const mapStateToProps = state => ({
  creator: state.logic.curRoomInfo.creator_name,
  joiners: state.logic.curRoomInfo.joiners,
  isAuthenticated: state.auth.isAuthenticated,
  userName: state.auth.userName,
  user: state.auth.user,
  isLowGraphics: state.auth.isLowGraphics,
  loading: state.logic.isActiveLoadingOverlay
});

const mapDispatchToProps = {
  getRoomList,
  setCurRoomInfo,
  actionRoom,
  getRoomStatisticsData
};

export default connect(mapStateToProps, mapDispatchToProps)(OpenGamesTable);
