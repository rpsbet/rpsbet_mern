import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  actionRoom,
  getRoomList,
  setCurRoomInfo,
  fetchMoreRooms,
  getRecentlyClosed,
  addNewTransaction,
  coHost,
} from '../../redux/Logic/logic.actions';

import { TrendingUpOutlined, TrendingDownOutlined, ShowChartOutlined, LockOutlined, Add, Remove, } from '@mui/icons-material';
import { Grid, Link, Tooltip, Typography, Skeleton, Box, Button, Card, Modal } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import Moment from 'moment';
import { faHeart, faHeartBroken, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import animationData from '../LottieAnimations/live';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { setBalance } from '../../redux/Auth/user.actions';
import CoHostModal from '../modal/CoHostModal';
import Avatar from '../../components/Avatar';
import { convertToCurrency } from '../../util/conversion';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
import Battle from '../icons/Battle';
import { alertModal } from '../modal/ConfirmAlerts';
import PlayerModal from '../modal/PlayerModal';
import history from '../../redux/history';


function OpenGamesTable(props) {
  const {
    // Props from Redux or parent
    roomList: propRoomList = [],
    highlightedRooms = new Set(),
    selectedGameType,
    loading,
    isDarkMode,
    showPlayerModal,
    selectedCreator,
    handleOpenPlayerModal,
    handleClosePlayerModal,
    onlineUserList,
    balance,
    isLowGraphics,
    user,
    solPrice,
    pageNumber,
    // Redux actions
    getRoomList,
    setCurRoomInfo,
    actionRoom,
    getRoomStatisticsData,
    getRecentlyClosed,
    setBalance,
    fetchMoreRooms,
    addNewTransaction,
    coHost,
  } = props;

  // ------------------ LOCAL STATE ------------------
  const [localRoomList, setLocalRoomList] = useState(propRoomList);
  const [filter, setFilter] = useState('Live Games');
  const [isCoHostModalOpen, setIsCoHostModalOpen] = useState(false);
  const [coHostAmount, setCoHostAmount] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // If you had more original state (e.g. invertFilter, isFocused, actionList, etc.), you could add them here as well.

  // For debouncing scroll
  const scrollTimeout = useRef(null);

  // Equivalent to componentDidMount:
  useEffect(() => {
    let isMounted = true;
    const doMountThings = async () => {
      setIsLoading(true);
      // Fetch initial room list
      try {
        await getRoomList({ pageSize: 7 });
      } catch (error) {
        console.error('Error fetching Room List', error);
      }
      // Mark as done
      if (isMounted) setIsLoading(false);
    };
    doMountThings();

    // Setup scroll listener
    window.addEventListener('scroll', debouncedHandleScroll);
    // Cleanup on unmount
    return () => {
      isMounted = false;
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, []);

  // Watch for changes in props.roomList, highlightedRooms, etc. 
  // This mimics componentDidUpdate
  useEffect(() => {
    // Merge new props.roomList with localRoomList if needed
    // Or replace localRoomList if there's new data
    // Also handle highlighted rooms
    const mergedRooms = [
      ...propRoomList,
      ...localRoomList.filter(
        (room) => !propRoomList.some((newRoom) => newRoom._id === room._id)
      ),
    ];

    // If localRoomList has extra rooms not in propRoomList, override
    const extraRoomsInState = localRoomList.some(
      (stateRoom) => !propRoomList.some((propRoom) => propRoom._id === stateRoom._id)
    );
    if (extraRoomsInState) {
      setLocalRoomList([...propRoomList]);
      return;
    }

    // If there's a highlighted room, bring it to the front
    const highlightId = Array.from(highlightedRooms)[0];
    if (highlightId) {
      const index = mergedRooms.findIndex((r) => r._id === highlightId);
      if (index !== -1 && index !== 0) {
        const [highlighted] = mergedRooms.splice(index, 1);
        mergedRooms.unshift(highlighted);
      }
    }
    setLocalRoomList(mergedRooms);
  }, [propRoomList, highlightedRooms]);

  // If selectedGameType changes, we might want to refetch or mark isLoading
  useEffect(() => {
    setIsLoading(true);
  }, [selectedGameType]);

  // ------------------ SCROLL HANDLING (debounce) ------------------
  const debouncedHandleScroll = useCallback(() => {
    // Cancel previous
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    // Set new
    scrollTimeout.current = setTimeout(() => handleScroll(), 300);
  }, []);

  // The actual handleScroll logic
  const handleScroll = async () => {
    if (loading) return;
    const tableElement = document.querySelector('.table.main-game-table');
    if (!tableElement) return;

    const { bottom } = tableElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const offset = 100;
    const isTableNearBottom = bottom <= viewportHeight + offset;
    const isAtBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight;

    if (isTableNearBottom || isAtBottom) {
      // fetch more
      await fetchMoreRooms({
        pageSize: localRoomList.length + 3,
        game_type: selectedGameType,
      });
    }
  };

  // ------------------ CO-HOST LOGIC ------------------
  const handleCoHost = (row) => {
    setSelectedRow(row);
    setIsCoHostModalOpen(true);
  };

  const handleCloseCoHostModal = () => {
    setIsCoHostModalOpen(false);
  };

  const handleCoHostAmountChange = (event) => {
    setCoHostAmount(event.target.value);
  };

  const handleSendCoHost = async () => {
    if (coHostAmount <= 0) {
      alertModal(isDarkMode, 'R U FURR-REAL? AMOUNT MUST BE MORE THAN 0!');
      return;
    }
    if (coHostAmount > balance) {
      alertModal(isDarkMode, 'NOT ENUFF FUNDS AT THIS MEOWMENT');
      return;
    }
    try {
      const result = await coHost(coHostAmount, selectedRow._id);
      if (result.success) {
        setBalance(result.balance);
        addNewTransaction(result.newTransaction);
        await getRoomList({
          pageSize: localRoomList.length,
          game_type: selectedGameType,
        });
      } else {
        alertModal(isDarkMode, result.message);
      }
    } catch (e) {
      alertModal(isDarkMode, 'ROOM TOO BUSY, TRY AGAIN LATER');
    }
  };

  // ------------------ UTILS ------------------
  const customFromNow = (date) => {
    const now = Moment();
    const duration = Moment.duration(now.diff(date));
    const style = { fontSize: 'xx-small' };

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
  };

  // If we need to transform a recentlyClosed array, we can do so
  const updateFromNow = (historyArr) => {
    const result = JSON.parse(JSON.stringify(historyArr));
    for (let i = 0; i < result.length; i++) {
      result[i]['from_now'] = customFromNow(Moment(result[i]['updated_at']));
    }
    return result;
  };

  // Handling filter toggle: "Live Games" <-> "Recently Ended"
  const handleFilterChange = useCallback(
    async (option) => {
      setFilter(option);
      if (option === 'Recently Ended') {
        await getRecentlyClosed();
      }
    },
    [getRecentlyClosed]
  );

  // "Join" a game
  const joinRoom = useCallback(
    (roomDetails) => {
      const { roomStatus, id } = roomDetails;
      if (roomStatus === 'finished') {
        alertModal(isDarkMode, 'THIS GAME HAS NOW ENDED');
        return;
      }
      setCurRoomInfo({
        _id: id,
        game_type: roomDetails.gameType,
        bankroll: parseFloat(roomDetails.user_bet),
        creator_id: roomDetails.creatorId,
        accessory: roomDetails.accessory,
        rank: roomDetails.rank,
        image: roomDetails.image,
        name: roomDetails.name,
        x_link: roomDetails.x_link,
        telegram_link: roomDetails.telegram_link,
        website_link: roomDetails.website_link,
        selectedStrategy: roomDetails.selectedStrategy,
        description: roomDetails.description,
        creator_status: roomDetails.creatorStatus,
        creator_avatar: roomDetails.creatorAvatar,
        username: roomDetails.username,
        total_stakes: roomDetails.totalStakes,
        created_at: roomDetails.createdAt,
        room_name: roomDetails.roomName,
        hosts: roomDetails.hosts,
        status: roomDetails.roomStatus,
        qs_game_type: roomDetails.qsGameType,
        pr: roomDetails.pr,
        host_pr: roomDetails.host_pr,
        game_log_list: [],
      });
      history.push(`/join/${id}`);
    },
    [alertModal, isDarkMode, setCurRoomInfo]
  );

  // -------------- UI HELPERS --------------
  const getColorClass = (value) => {
    if (value > 0) return 'green';
    if (value === 0) return 'grey';
    return 'red';
  };
  const renderArrow = (value) => {
    return value >= 0 ? (
      <Add style={{ color: '#57ca22' }} />
    ) : (
      <Remove style={{ color: 'red' }} />
    );
  };
  const calculateColor = (value) => {
    return value >= 0 ? '#57ca22' : 'red';
  };

  // Filter state
  const isLiveGames = filter === 'Live Games';

  // If we have recentlyClosed data from Redux
  // (the original code references `recentlyClosed`, updated by getRecentlyClosed)
  const recent = props.recentlyClosed ? updateFromNow(props.recentlyClosed) : [];

  // Lottie animation defaults
  const defaultOptions = {
    loop: isLowGraphics ? false : true,
    autoplay: isLowGraphics ? false : true,
    animationData: animationData,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
  };

  return (
    <>
      {showPlayerModal && (
        <PlayerModal
          selectedCreator={selectedCreator}
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div
          className="filter-container"
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => handleFilterChange(isLiveGames ? 'Recently Ended' : 'Live Games')}
        >
          <FilterListIcon style={{ marginRight: '5px' }} />
          <span>{filter}</span>
        </div>
      </div>

      {isLiveGames ? (
        <div className="table main-game-table open-games">
          {localRoomList.length === 0 && !isLoading && !loading ? (
            <div className="dont-have-game-msg">
              <div>NO LIVE GAMES, GO TO 'MANAGE' TO CREATE ONE</div>
            </div>
          ) : (
            <Grid container className="grid-container" spacing={1} style={{ padding: '20px', width: '100%' }}>
              {localRoomList.length === 0 ? (
                // Skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Skeleton variant="rectangular" sx={{ width: '100%', height: 100 }} />
                    <Skeleton sx={{ width: '60%' }} />
                    <Skeleton sx={{ width: '40%' }} />
                  </Grid>
                ))
              ) : (
                localRoomList.map((row, key) => (
                  <div
                    key={row._id}
                    className={`table-row ${key < 10 ? 'slide-in' : 'slide-in'}`}
                    style={{
                      animation: highlightedRooms.has(row._id)
                        ? 'flicker 0.2s 2, shake 0.2s'
                        : 'none',
                    }}
                    onClick={(event) => {
                      if (!event.defaultPrevented) {
                        joinRoom({
                          id: row._id,
                          roomId: row._id,
                          name: row.name,
                          x_link: row.x_link,
                          website_link: row.website_link,
                          selectedStrategy: row.selectedStrategy,
                          image: row.image,
                          telegram_link: row.telegram_link,
                          creatorId: row.creator_id,
                          creatorAvatar: row.creator_avatar,
                          creatorStatus: row.creator_status,
                          accessory: row.accessory,
                          rank: row.rank,
                          hosts: row.hosts,
                          roomStatus: row.status,
                          username: row.username,
                          gameType: row.game_type.game_type_name,
                          user_bet: row.user_bet,
                          totalStakes: row.total_stakes,
                          createdAt: row.created_at,
                          roomName: row.room_name,
                          qsGameType: row.qs_game_type,
                          pr: row.pr,
                          host_pr: row.host_pr,
                        });
                      }
                    }}
                  >
                    {/* Info panel */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="table-cell cell-room-info">
                        <img src={row.image} alt={row.image} className="game-type-icon" />
                        <div className="cell-game-description">
                          {row.name}{' '}
                          <span style={{ color: '#ff8500', fontWeight: 'bold' }}>
                            ({row.room_name})
                          </span>
                          <br />
                          <span>{row.description}</span>
                        </div>
                        <div className="cell-game-id ">
                          <img
                            src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                            alt={row.game_type.short_name}
                            className="game-type-icon"
                          />
                          {row.selectedStrategy && (
                            <span
                              style={{
                                fontSize: 'xx-small',
                                border: '1px solid rgb(255, 208, 0)',
                                background: 'linear-gradient(45deg, #7a5958, #a27955)',
                                borderRadius: '0.3em',
                                color: 'rgb(255, 208, 0)',
                                padding: '0px 5px',
                                lineHeight: '20px',
                              }}
                            >
                              {row.selectedStrategy}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* CoHost icon / Private icon */}
                      <div className="cell-coHost">
                        <Button
                          variant='outlined'
                          color='error'
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleCoHost(row);
                          }}
                          sx={{
                            padding: '8px 12px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            borderRadius: 1, // Rounded corners but not fully circular
                            fontSize: '14px',
                            textDecoration: 'none',

                          }}
                        >
                          <ShowChartOutlined sx={{ fontSize: 20 }} />
                        </Button>
                        {row.is_private && (
                          <Tooltip title="A password is required to battle this room." arrow>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '8px',
                                borderRadius: 1,
                                backgroundColor: '#f1f1f1',
                                border: '2px solid #cccccc',
                                cursor: 'default',
                                marginTop: '5px',
                              }}
                            >
                              <LockOutlined style={{ color: '#808080', fontSize: '18px' }} />
                            </div>
                          </Tooltip>
                        )}
                      </div>
                      {/* Desktop-only info */}
                      <div className="table-cell desktop-only cell-user-name">
                        <a
                          className="player"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleOpenPlayerModal(row.creator_id);
                          }}
                        >
                          <Avatar
                            className="avatar desktop-only"
                            src={row.creator_avatar}
                            accessory={row.accessory}
                            username={row.username}
                            rank={row.rank}
                            alt=""
                            darkMode={isDarkMode}
                          />
                        </a>
                        <i
                          className={`online-status${onlineUserList.filter((u) => u === row.creator_id).length > 0
                            ? ' online'
                            : ''
                            }`}
                        ></i>
                        {row.hosts && row.hosts.slice(1, 1).map((host, index) => (
                          <div className="hosts" key={index}>
                            <a
                              className="player"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
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
                        {row.hosts.length > 1 && (
                          <div className="hosts avatar-square">
                            <div className="avatar-count">+{row.hosts.length - 1}</div>
                          </div>
                        )}
                        {row.joiners && row.joiners.length > 0 && (
                          <div className="table-cell avatar desktop-only cell-joiners">
                            <Battle />
                            {row.joiner_avatars.slice(0, 1).map((joiner, index) => (
                              <a
                                key={index}
                                className="player"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleOpenPlayerModal(row.joiners[index]);
                                }}
                              >
                                <Avatar
                                  className="avatar desktop-only"
                                  key={index}
                                  accessory={joiner.accessory}
                                  src={joiner.avatar}
                                  username={joiner.username}
                                  rank={joiner.rank}
                                  alt=""
                                  darkMode={isDarkMode}
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
                        )}
                      </div>
                      {/* Cell-likes info */}
                      <div className="table-cell cell-likes title">
                        <div
                          id="view"
                          style={{
                            color:
                              parseFloat(row.user_bet) > row.bet_amount
                                ? '#03ff3b'
                                : parseFloat(row.user_bet) < row.bet_amount
                                  ? '#ff033e'
                                  : '#808080',
                          }}
                        >
                          <Typography
                            variant="body2"
                            className={`label ${parseFloat(row.user_bet) > row.bet_amount
                              ? 'green-text'
                              : parseFloat(row.user_bet) < row.bet_amount
                                ? 'red-text'
                                : 'grey-text'
                              }`}
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            Liquidity
                          </Typography>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Typography
                              variant="body1"
                              className={`number ${parseFloat(row.user_bet) > row.bet_amount
                                ? 'green-text'
                                : parseFloat(row.user_bet) < row.bet_amount
                                  ? 'red-text'
                                  : 'grey-text'
                                }`}
                            >
                              {convertToCurrency(row.user_bet, solPrice)}
                            </Typography>

                            {parseFloat(row.user_bet) > row.bet_amount && (
                              <div className="chart-arrow">
                                <TrendingUpOutlined style={{ marginRight: '-5px' }} />
                                <span style={{ marginLeft: '5px', fontSize: 'xx-small' }}>
                                  {`(${(
                                    ((parseFloat(row.user_bet) - row.bet_amount) / row.bet_amount) *
                                    100
                                  ).toFixed(2)}%)`}
                                </span>
                              </div>
                            )}
                            {parseFloat(row.user_bet) < row.bet_amount && (
                              <div className="chart-arrow">
                                <TrendingDownOutlined style={{ marginRight: '-5px' }} />
                                <span style={{ marginLeft: '5px', fontSize: 'xx-small' }}>
                                  {`(${(
                                    ((row.bet_amount - parseFloat(row.user_bet)) / row.bet_amount) *
                                    100
                                  ).toFixed(2)}%)`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          id="view"
                          style={{
                            filter: isDarkMode ? 'brightness(3)' : 'none',
                          }}
                        >
                          <Typography variant="body2" className="label">
                            Battles
                          </Typography>
                          <Typography variant="body1" className="number">
                            {row.battles}
                          </Typography>
                        </div>
                        <div
                          id="view"
                          style={{
                            filter: isDarkMode ? 'brightness(3)' : 'none',
                          }}
                        >
                          <Typography variant="body2" className="label">
                            Age
                          </Typography>
                          <Typography variant="body1" className="number">
                            {customFromNow(Moment(row.created_at))}
                          </Typography>
                        </div>
                      </div>
                    </div>
                    {/* Mobile-only user info */}
                    <div
                      className="mobile-only"
                      style={{ marginTop: '7.5px', marginBottom: '-5px' }}
                    >
                      <div className="table-cell cell-user-name">
                        <a
                          className="player"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleOpenPlayerModal(row.creator_id);
                          }}
                        >
                          <Avatar
                            className="avatar"
                            src={row.creator_avatar}
                            accessory={row.accessory}
                            username={row.username}
                            rank={row.rank}
                            alt=""
                            darkMode={isDarkMode}
                          />
                          <i
                            className={`online-status${onlineUserList.filter((u) => u === row.creator_id).length > 0
                              ? ' online'
                              : ''
                              }`}
                          ></i>
                        </a>
                        {row.joiners && row.joiners.length > 0 && (
                          <div className="table-cell mobile-only cell-joiners">
                            <Battle />
                            {row.joiner_avatars.slice(0, 3).map((joinerAvatar, index) => (
                              <a
                                key={index}
                                className="player"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleOpenPlayerModal(row.joiners[index]);
                                }}
                              >
                                <Avatar
                                  className="avatar mobile-only"
                                  src={joinerAvatar.avatar}
                                  rank={joinerAvatar.rank}
                                  username={joinerAvatar.username}
                                  alt=""
                                  accessory={joinerAvatar.accessory}
                                  darkMode={isDarkMode}
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
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Grid>
          )}
        </div>
      ) : (
        // If filter === "Recently Ended"
        <Grid container spacing={2}>
          {recent.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={6} sm={4} md={3} lg={3} xl={3} key={index}>
                <Box className="carousel-content table-row slide-in " sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Skeleton variant="rectangular" sx={{ width: '100%', height: 200 }} />
                  <Skeleton sx={{ width: '60%' }} />
                  <Skeleton sx={{ width: '40%' }} />
                  <Skeleton sx={{ width: '80%' }} />
                </Box>
              </Grid>
            ))
          ) : (
            recent.map((row) => {
              const hostPrizeMinusBetAmount = row.host_pr - row.bet_amount;
              return (
                <Grid
                  item
                  xs={6}
                  sm={4}
                  md={3}
                  lg={3}
                  xl={3}
                  key={row._id}
                >
                  <Card
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                    className="carousel-content table-row slide-in"
                  >
                    <Link
                      href={`/join/${row._id}`}
                      sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
                    >
                      {row.image && (
                        <Box sx={{ mr: 1.25, display: 'block' }}>
                          <img
                            src={row.image}
                            alt=""
                            className="game-type-icon"
                            width={32}
                            style={{ display: 'block' }}
                          />
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 'bold',
                            paddingRight: 0.625,
                          }}
                        >
                          {row.name}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: 'xx-small',
                            paddingRight: 0.625,
                          }}
                        >
                          {`${row.game_type.short_name}-${row.room_number}`}
                        </Typography>
                      </Box>
                    </Link>
                    <Box sx={{ display: 'flex', alignItems: 'center', typography: 'body2' }}>
                      {customFromNow(Moment(row.created_at))}{' '}
                      <FontAwesomeIcon icon={faStopwatch} /> &nbsp;
                      <FontAwesomeIcon icon={faHeartBroken} />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '0.8em',
                        color: getColorClass(hostPrizeMinusBetAmount),  // Assuming this returns a valid CSS color
                      }}
                    >
                      {convertToCurrency(hostPrizeMinusBetAmount, solPrice)}
                    </Typography>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* CoHost Modal */}
      <Modal
        open={isCoHostModalOpen}
        onClose={handleCloseCoHostModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        closeAfterTransition

      >
        <Box
          sx={{
            width: '95%',
            maxWidth: 1000,
            maxHeight: '90vh',
            overflowY: 'auto',
            bgcolor: '#1f1a25',
            borderRadius: 1,
            p: 3,
            color: '#fff'  // for readable text
          }}
        >

          <CoHostModal
            isDarkMode={isDarkMode}
            coHostAmount={coHostAmount}
            selectedRow={selectedRow}
            balance={balance}
            user={user}
            togglePopup={() => { }}
            handleClose={handleCloseCoHostModal}
            handleSendCoHost={handleSendCoHost}
            handleCoHostAmountChange={handleCoHostAmountChange}
            has_joined={false}
            input_only={false}
            solPrice={solPrice}
          />
        </Box>

      </Modal>
    </>
  );
}

// -------------- REDUX CONNECT --------------
const mapStateToProps = (state) => ({
  creator: state.logic.curRoomInfo.creator_name,
  joiners: state.logic.curRoomInfo.joiners,
  isAuthenticated: state.auth.isAuthenticated,
  userName: state.auth.userName,
  recentlyClosed: state.logic.recentlyClosed,
  user: state.auth.user,
  isLowGraphics: state.auth.isLowGraphics,
  loading: state.logic.isActiveLoadingOverlay,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  getRoomList,
  setCurRoomInfo,
  actionRoom,
  getRoomStatisticsData,
  getRecentlyClosed,
  setBalance,
  fetchMoreRooms,
  addNewTransaction,
  coHost,
};

export default connect(mapStateToProps, mapDispatchToProps)(OpenGamesTable);