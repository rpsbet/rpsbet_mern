import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';
import {
  actionRoom,
  getRoomList,
  setCurRoomInfo,
  setRoomList,
  getRecentlyClosed,
  addNewTransaction,
  pumpGame,
  endLoading,
  startLoading
} from '../../redux/Logic/logic.actions';
import isEqual from 'lodash/isEqual';

import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  ShowChartOutlined,
  LockOutlined,
  Add,
  Remove,
} from '@mui/icons-material';
import {
  AvatarGroup,
  Grid,
  Pagination,
  Tooltip,
  Typography,
  Skeleton,
  Box,
  Button,
  Card,
  Modal,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import Moment from 'moment';
import {
  faHeart,
  faHeartBroken,
  faStopwatch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CoHostModal from '../modal/CoHostModal';
import Avatar from '../../components/Avatar';
import { convertToCurrency } from '../../util/conversion';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
import Battle from '../icons/Battle';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import PlayerModal from '../modal/PlayerModal';
import history from '../../redux/history';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

function OpenGamesTable(props) {
  const {
    selectedGameType,
    loading,
    isDarkMode,
    showPlayerModal,
    selectedCreator,
    handleOpenPlayerModal,
    handleClosePlayerModal,
    onlineUserList,
    balance,
    connectedAccount,
    user,
    solPrice,
    endLoading,
    startLoading,
    // Redux actions
    getRoomList,
    roomList,
    setCurRoomInfo,
    highlightedRooms,
    getRecentlyClosed,
    addNewTransaction,
    pumpGame,
  } = props;
  // ------------------ LOCAL STATE ------------------
  const [localRoomList, setLocalRoomList] = useState(roomList);
  const [filter, setFilter] = useState('Live Games');
  const [isCoHostModalOpen, setIsCoHostModalOpen] = useState(false);
  const [coHostAmount, setCoHostAmount] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const theme = getCustomTheme(isDarkMode);
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const [loadingRecent, setLoadingRecent] = useState(true);

  const pageSize = 30;
  // total rooms from server, so we can calculate how many pages
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedRooms = roomList.slice(startIndex, endIndex);
  const prevRoomListRef = useRef(roomList);
  useEffect(() => {
    if (!isEqual(prevRoomListRef.current, roomList)) {
      prevRoomListRef.current = roomList;
    }
    const mergedRooms = [
      ...roomList,
      ...localRoomList.filter(
        (room) => !roomList.some((newRoom) => newRoom._id === room._id),
      ),
    ];

    // If localRoomList has extra rooms not in roomList, override
    const extraRoomsInState = localRoomList.some(
      (stateRoom) =>
        !roomList.some((propRoom) => propRoom._id === stateRoom._id),
    );
    if (extraRoomsInState) {
      setLocalRoomList([...roomList]);
      return;
    }

    // If there's a highlighted room, bring it to the front
    const highlightId = Array.from(highlightedRooms)[0];
    if (highlightId) {
      const index = mergedRooms.findIndex((r) => r._id === highlightId);
      if (index !== -1 && index !== 0) {
        const [highlighted] = mergedRooms.splice(index, 1);
        mergedRooms.unshift(highlighted);

        dispatch(setRoomList(mergedRooms));
      }
    }
    setLocalRoomList(mergedRooms);
  }, [roomList, highlightedRooms]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
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
      dispatch(errorMsgBar('R U FURR-REAL? AMOUNT MUST BE MORE THAN 0!'));
      return;
    }
    if (coHostAmount > balance) {
      dispatch(errorMsgBar('NOT ENUFF FUNDS AT THIS MEOWMENT'));
      return;
    }
    try {
      const result = await pumpGame(
        coHostAmount,
        selectedRow._id,
        connectedAccount,
      );
      if (result.success) {
        addNewTransaction(result.newTransaction);
        await getRoomList({
          game_type: selectedGameType,
        });
      } else {
        dispatch(errorMsgBar(result.message));
      }
    } catch (e) {
      dispatch(errorMsgBar('ROOM TOO BUSY, TRY AGAIN LATER'));
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

  const handleFilterChange = useCallback(
    async (option) => {
      setFilter(option);
      if (option === 'Recently Graduated') {
        setLoadingRecent(true); // Start loading
        await getRecentlyClosed();
        setLoadingRecent(false); // Finished loading
      }
    },
    [getRecentlyClosed],
  );

  const joinRoom = useCallback(
    (roomDetails) => {
      const { roomStatus, id } = roomDetails;
      if (roomStatus === 'finished') {
        dispatch(errorMsgBar('THIS GAME HAS NOW ENDED'));
        return;
      }
      window.location.href = `/join/${id}`;
    },
    [dispatch],
  );

  // -------------- UI HELPERS --------------
  const getColorClass = (value) => {
    if (value > 0) return '#03ff3b';
    if (value === 0) return 'grey';
    return '#D32F2F';
  };

  // Filter state
  const isLiveGames = filter === 'Live Games';

  const recent = props.recentlyClosed
    ? updateFromNow(props.recentlyClosed)
    : [];

  return (
    <ThemeProvider theme={theme}>
      {showPlayerModal && (
        <PlayerModal
          selectedCreator={selectedCreator}
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
        />
      )}

      <div
        style={{
          marginLeft: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div
          className="filter-container"
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() =>
            handleFilterChange(isLiveGames ? 'Recently Graduated' : 'Live Games')
          }
        >
          <FilterListIcon style={{ marginRight: '5px' }} />
          <span>{filter}</span>
        </div>
      </div>

      {isLiveGames ? (
        <div className="table main-game-table open-games">
          {displayedRooms.length === 0 || loading ? (
            // Skeleton loader while loading
            <Grid container className="grid-container" spacing={1} style={{ padding: '20px' }}>
              {Array.from({ length: 9 }).map((_, index) => (
                <Grid
                  item
                  xs={12}  // Full width on extra small screens
                  sm={6}   // Half width on small screens
                  md={4}   // One-third width on medium and larger screens (3 columns)
                  key={index}
                  sx={{
                    flexBasis: { xs: '100%', }, // Ensure 3x3 on medium+
                    maxWidth: { xs: '100%', },
                    flexGrow: 1,
                  }}
                >
                  <Card
                    sx={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: isDarkMode ? '#1E2A38' : '#FFFFFF',
                      boxShadow: isDarkMode
                        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: '4px', mr: 2 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" />
                      </Box>
                      <Skeleton variant="circular" width={24} height={24} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                      <Skeleton variant="rectangular" width={24} height={24} sx={{ mx: 2 }} />
                      <Skeleton variant="circular" width={32} height={32} sx={{ ml: 2 }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Skeleton variant="text" width="30%" />
                      <Skeleton variant="text" width="20%" />
                      <Skeleton variant="text" width="20%" />
                    </Box>
                    <Skeleton variant="rectangular" width="100%" height={10} sx={{ borderRadius: '4px' }} />
                  </Card>
                </Grid>
              ))}
            </Grid> 
          ) : displayedRooms.length === 0 ? (
            <div className="dont-have-game-msg">
              <div>NO LIVE GAMES, GO TO 'CREATE A GAME' TO CREATE ONE</div>
            </div>
          ) : (
            <Grid
              container
              className="grid-container"
              spacing={1}
              style={{ padding: '20px' }}
            >
              {displayedRooms.map((row, key) => {
                // Calculate progress percentage (ensure no division by zero)
                const progressPercentage = row.endgame_amount
                  ? Math.min((row.user_bet / row.endgame_amount) * 100, 100)
                  : 0;

                return (
                  <Grid
                    item
                    xs={12}
                    key={row._id}
                    sx={{
                      flexBasis: '100% !important',
                      maxWidth: '100% !important',
                      flexGrow: 1,
                    }}
                  >
                    <Card
                      className={`table-row ${highlightedRooms.includes(row._id) ? 'highlighted-row' : ''}`}
                      onClick={(event) => {
                        if (!event.defaultPrevented) {
                          joinRoom({
                            id: row._id,
                            roomStatus: row.status,
                          });
                        }
                      }}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: isDarkMode ? '#1E2A38' : '#FFFFFF',
                        boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                          cursor: 'pointer',
                        },
                      }}
                    >
                      {/* Header Section */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <img
                          src={row.image}
                          alt={row.name}
                          style={{ width: 40, height: 40, borderRadius: '4px', marginRight: '12px' }}
                        />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {row.name}{' '}
                            <Typography component="span" color="text.secondary" variant="body2">
                              ({row.ticker})
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                            {row.description.length > 16 ? `${row.description.slice(0, 16)}...` : row.description}
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                          <img
                            src={`/img/gametype/icons/${row.game_type?.short_name}.svg`}
                            alt={row.game_type?.short_name}
                            style={{ width: 24, height: 24, marginRight: '8px' }}
                          />
                          {/* Removed selectedStrategy */}
                        </Box>
                      </Box>

                      {/* Hosts and Joiners Section */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        {row.hosts?.length > 0 && (
                          <AvatarGroup
                            max={2}
                            sx={{
                              '& .MuiAvatar-root': {
                                width: 32,
                                height: 32,
                                borderRadius: '6px',
                                border: 'none',
                              },
                              '& .MuiAvatarGroup-avatar:not(:first-of-type)': {
                                marginLeft: '-8px',
                              },
                            }}
                          >
                            {row.hosts.map((host, index) => (
                              <Avatar
                                key={index}
                                alt={host.username}
                                src={host.avatar}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPlayerModal(row.hosts[index]);
                                }}
                                sx={{ cursor: 'pointer' }}
                              />
                            ))}
                          </AvatarGroup>
                        )}
                        <Battle sx={{ mx: 2, color: isDarkMode ? '#FFFFFF' : '#000000' }} />
                        {row.joiners?.length > 0 && (
                          <AvatarGroup
                            max={2}
                            sx={{
                              '& .MuiAvatar-root': {
                                width: 32,
                                height: 32,
                                borderRadius: '6px',
                                border: 'none',
                              },
                              '& .MuiAvatarGroup-avatar:not(:first-of-type)': {
                                marginLeft: '-8px',
                              },
                            }}
                          >
                            {row.joiners.map((joiner, index) => (
                              <Avatar
                                key={index}
                                alt={joiner.username}
                                src={joiner.avatar}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPlayerModal(row.joiners[index]);
                                }}
                                sx={{ cursor: 'pointer' }}
                              />
                            ))}
                          </AvatarGroup>
                        )}
                      </Box>

                      {/* Stats Section */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Liquidity
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ color: getColorClass(row.user_bet - row.bet_amount), fontWeight: 600 }}
                          >
                            {convertToCurrency(row.user_bet, solPrice)}
                            {row.user_bet !== row.bet_amount && (
                              <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>
                                {row.user_bet > row.bet_amount ? (
                                  <TrendingUpOutlined fontSize="small" />
                                ) : (
                                  <TrendingDownOutlined fontSize="small" />
                                )}
                                {` (${(((row.user_bet - row.bet_amount) / row.bet_amount) * 100).toFixed(2)}%)`}
                              </span>
                            )}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Battles
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {row.battles}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Age
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {customFromNow(Moment(row.created_at))}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Progress Bar */}
                      <Box
                        sx={{
                          width: '100%',
                          height: '10px', // Adjust height as needed
                          background: 'rgb(224, 224, 224)', // progress-bar-remaining style
                          borderRadius: '4px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <Box
                          className="progress-bar-filled"
                          sx={{
                            width: `${progressPercentage}%`,
                            height: '100%',
                            background: 'linear-gradient(#e1ff00, #fdb500)', // progress-bar-filled style
                            position: 'relative',
                            zIndex: 2,
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              width: 0,
                              height: 0,
                              borderStyle: 'solid',
                              borderWidth: '0 2px 20px 4px',
                              borderColor: '#eeff0098', // progress-bar-filled::after style
                              zIndex: 3,
                            },
                          }}
                        />
                      </Box>

                      {/* Private Indicator */}
                      {row.is_private && (
                        <Tooltip title="A password is required to battle this room." arrow>
                          <LockOutlined
                            sx={{
                              fontSize: 18,
                              color: isDarkMode ? '#808080' : '#666666',
                              position: 'absolute',
                              top: 8,
                              right: 8,
                            }}
                          />
                        </Tooltip>
                      )}
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
          <Pagination
            color="error"
            sx={{
              display: 'flex',
              justifyContent: 'center',
              '& .MuiPaginationItem-root': {
                borderRadius: '4px',
              },
            }}
            count={Math.ceil(roomList.length / pageSize)}
            page={page}
            onChange={handleChangePage}
          />
        </div>
      ) : (
        <Grid container spacing={2} sx={{ p: 2 }}>
          {loadingRecent ? (
            // While loading, show 4 skeleton placeholders.
            Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={6} sm={4} md={3} lg={3} xl={3} key={index}>
                <Box
                  className="carousel-content table-row slide-in"
                  sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                >
                  <Skeleton variant="rectangular" sx={{ width: '100%', height: 200 }} />
                  <Skeleton sx={{ width: '60%' }} />
                  <Skeleton sx={{ width: '40%' }} />
                  <Skeleton sx={{ width: '80%' }} />
                </Box>
              </Grid>
            ))
          ) : recent.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" align="center">
                NO RECENT GRADS
              </Typography>
            </Grid>
          ) : (
            // Otherwise, map through the "recent" data.
            recent.map((row) => {
              const hostPrizeMinusBetAmount = row.host_pr - row.bet_amount;
              return (
                <Grid item xs={6} sm={4} md={3} lg={3} xl={3} key={row._id}>
                  <Card
                    onClick={() => (window.location.href = `/join/${row._id}`)}
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: '#3a2d41',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                    className="carousel-content table-row slide-in"
                  >
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
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
                          sx={{ fontWeight: 'bold', paddingRight: 0.625 }}
                        >
                          {row.name}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ fontSize: 'xx-small', paddingRight: 0.625 }}
                        >
                          {`${row.game_type.short_name}-${row.room_number}`}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Middle Section: Time/Icons */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                        typography: 'body2',
                        color: 'text.secondary',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FontAwesomeIcon icon={faStopwatch} />
                        {customFromNow(Moment(row.created_at))}
                      </Box>
                      <FontAwesomeIcon icon={faHeartBroken} />
                    </Box>

                    {/* Bottom Section: Currency Info */}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color: getColorClass(hostPrizeMinusBetAmount),
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
            bgcolor: '#2D3A4B',
            borderRadius: 1,
            p: 3,
            color: '#fff', // for readable text
          }}
        >
          <CoHostModal
            isDarkMode={isDarkMode}
            coHostAmount={coHostAmount}
            connectedAccount={connectedAccount}
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
    </ThemeProvider>
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
  highlightedRooms: state.logic.highlightedRooms,
  isLowGraphics: state.auth.isLowGraphics,
  loading: state.logic.isActiveLoadingOverlay,
  solPrice: state.logic.solPrice,
  roomList: state.logic.roomList,
  connectedAccount: state.auth.connectedAccount,
});

const mapDispatchToProps = {
  getRoomList,
  setCurRoomInfo,
  actionRoom,
  getRoomStatisticsData,
  getRecentlyClosed,
  setRoomList,
  addNewTransaction,
  startLoading,
  endLoading,
  pumpGame,
};

export default connect(mapStateToProps, mapDispatchToProps)(OpenGamesTable);
