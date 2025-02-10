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
    pageNumber,
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
  const [isLoading, setIsLoading] = useState(true);
  const theme = getCustomTheme(isDarkMode);
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();

  const pageSize = 30;
  // total rooms from server, so we can calculate how many pages
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedRooms = roomList.slice(startIndex, endIndex);
  const prevRoomListRef = useRef(roomList);

  useEffect(() => {
    getRoomList({ game_type: 'All' });
  }, [getRoomList]);

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

  // Handling filter toggle: "Live Games" <-> "Recently Bonded"
  const handleFilterChange = useCallback(
    async (option) => {
      setFilter(option);
      if (option === 'Recently Bonded') {
        await getRecentlyClosed();
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
    return '#ff0000';
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
            handleFilterChange(isLiveGames ? 'Recently Bonded' : 'Live Games')
          }
        >
          <FilterListIcon style={{ marginRight: '5px' }} />
          <span>{filter}</span>
        </div>
      </div>

      {isLiveGames ? (
        <div className="table main-game-table open-games">
          {displayedRooms.length === 0 && !isLoading && !loading ? (
            <div className="dont-have-game-msg">
              <div>NO LIVE GAMES, GO TO 'MANAGE' TO CREATE ONE</div>
            </div>
          ) : (
            <Grid
              container
              className="grid-container"
              spacing={1}
              style={{ padding: '20px' }}
            >
              {displayedRooms.length === 0
                ? // Skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Skeleton
                        variant="rectangular"
                        sx={{ width: '100%', height: 100 }}
                      />
                      <Skeleton sx={{ width: '60%' }} />
                      <Skeleton sx={{ width: '40%' }} />
                    </Grid>
                  ))
                : displayedRooms.map((row, key) => (
                    <div
                      key={row._id}
                      className={`table-row ${highlightedRooms.includes(row._id) ? 'highlighted-row' : ''}`}
                      onClick={(event) => {
                        if (!event.defaultPrevented) {
                          joinRoom({
                            id: row._id,
                            roomStatus: row.status,
                          });
                        }
                      }}
                    >
                      {/* Info panel */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="table-cell cell-room-info">
                          <img
                            src={row.image}
                            alt={row.image}
                            className="game-type-icon"
                          />
                          <Box className="cell-game-description">
                            <Typography variant="body2">
                              {row.name}{' '}
                              <Typography
                                component="span"
                                color="warning"
                                variant="body2"
                                sx={{ fontWeight: 'bold', fontSize: '0.75em' }}
                              >
                                ({row.ticker})
                              </Typography>
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#b9bbbe',
                                mt: 0.5,
                                fontSize: '0.7em',
                              }}
                            >
                              {row.description.length > 16
                                ? `${row.description.slice(0, 16)}...`
                                : row.description}
                            </Typography>
                          </Box>
                          <div className="cell-game-id ">
                            <img
                              src={`/img/gametype/icons/${row.game_type?.short_name}.svg`}
                              alt={row.game_type?.short_name}
                              className="game-type-icon"
                            />
                            {row.selectedStrategy && (
                              <span id="ai_mode">{row.selectedStrategy}</span>
                            )}
                          </div>
                        </div>
                        {/* CoHost icon / Private icon */}
                        <div className="cell-coHost">
                          {/* <Button
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
                            borderRadius: 1,
                            fontSize: '14px',
                            textDecoration: 'none',

                          }}
                        >
                          <ShowChartOutlined sx={{ fontSize: 20 }} />
                        </Button> */}
                          {row.is_private && (
                            <Tooltip
                              title="A password is required to battle this room."
                              arrow
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  cursor: 'default',
                                  marginTop: '5px',
                                }}
                              >
                                <LockOutlined
                                  style={{ color: '#808080', fontSize: '18px' }}
                                />
                              </div>
                            </Tooltip>
                          )}
                        </div>

                        <div
                          className="table-cell cell-user-name"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                          }}
                        >
                          {/* HOSTS */}
                          {row.hosts?.length > 0 && (
                            <div
                              className="table-cell avatar hosts"
                              style={{ border: 'none', marginRight: '8px' }}
                            >
                              <AvatarGroup
                                max={1}
                                // Enforce uniform 32x32, remove borders, and fix dot to bottom-left
                                sx={{
                                  '& .MuiAvatar-root': {
                                    width: 32,
                                    height: 32,
                                    minWidth: 32,
                                    minHeight: 32,
                                    borderRadius: 1,
                                    border: 'none !important',
                                    boxShadow: 'none !important',
                                    margin: '0 !important',
                                  },
                                  '& .MuiAvatarGroup-avatar:not(:first-of-type)':
                                    {
                                      marginLeft: '-8px !important', // or 0 for no overlap
                                    },
                                  // Force the online dot to bottom-left
                                  '& .MuiBadge-anchorOriginBottomLeftCircular, & .MuiBadge-anchorOriginBottomLeftRectangular':
                                    {
                                      bottom: '0 !important',
                                      left: '0 !important',
                                      transform: 'none !important',
                                    },
                                }}
                              >
                                {row.hosts.map((host, index) => (
                                  <div
                                    key={index}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Avatar
                                      alt={host.username}
                                      username={host.username}
                                      src={host.avatar}
                                      rank={host.rank}
                                      accessory={host.accessory}
                                      user_id={host.host}
                                      darkMode={isDarkMode}
                                      sx={{ cursor: 'pointer' }}
                                      onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        handleOpenPlayerModal(row.hosts[index]);
                                      }}
                                    />
                                  </div>
                                ))}
                              </AvatarGroup>
                            </div>
                          )}

                          {/* BATTLE ICON IN THE MIDDLE with spacing */}
                          <div style={{ margin: '0 4px', border: 'none' }}>
                            <Battle />
                          </div>

                          {/* JOINERS */}
                          {row.joiners?.length > 0 && (
                            <div
                              className="table-cell avatar joiners"
                              style={{ border: 'none', marginLeft: '8px' }}
                            >
                              <AvatarGroup
                                max={1}
                                sx={{
                                  '& .MuiAvatar-root': {
                                    width: 32,
                                    height: 32,
                                    minWidth: 32,
                                    minHeight: 32,
                                    borderRadius: 1,
                                    border: 'none !important',
                                    boxShadow: 'none !important',
                                    margin: '0 !important',
                                  },
                                  '& .MuiAvatarGroup-avatar:not(:first-of-type)':
                                    {
                                      marginLeft: '-8px !important',
                                    },
                                  '& .MuiBadge-anchorOriginBottomLeftCircular, & .MuiBadge-anchorOriginBottomLeftRectangular':
                                    {
                                      bottom: '0 !important',
                                      left: '0 !important',
                                      transform: 'none !important',
                                    },
                                }}
                              >
                                {row.joiners.map((joiner, index) => (
                                  <div
                                    key={index}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Avatar
                                      username={joiner.username}
                                      alt={joiner.username}
                                      src={joiner.avatar}
                                      rank={joiner.rank}
                                      accessory={joiner.accessory}
                                      user_id={joiner.user_id}
                                      darkMode={isDarkMode}
                                      sx={{ cursor: 'pointer' }}
                                      onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        handleOpenPlayerModal(
                                          row.joiners[index],
                                        );
                                      }}
                                    />
                                  </div>
                                ))}
                              </AvatarGroup>
                            </div>
                          )}
                        </div>

                        {/* Cell-likes info */}
                        <div className="cell-likes title">
                          <div
                            id="view"
                            style={{
                              color:
                                row.user_bet > row.bet_amount
                                  ? '#03ff3b'
                                  : row.user_bet < row.bet_amount
                                    ? '#ff033e'
                                    : '#808080',
                            }}
                          >
                            <Typography
                              variant="body2"
                              className={`label ${
                                row.user_bet > row.bet_amount
                                  ? 'green-text'
                                  : row.user_bet < row.bet_amount
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
                                className={`number ${
                                  row.user_bet > row.bet_amount
                                    ? 'green-text'
                                    : row.user_bet < row.bet_amount
                                      ? 'red-text'
                                      : 'grey-text'
                                }`}
                              >
                                {convertToCurrency(row.user_bet, solPrice)}
                              </Typography>

                              {row.user_bet > row.bet_amount && (
                                <div className="chart-arrow">
                                  <TrendingUpOutlined
                                    style={{ marginRight: '-5px' }}
                                  />
                                  <span
                                    style={{
                                      marginLeft: '5px',
                                      fontSize: 'xx-small',
                                    }}
                                  >
                                    {`(${(
                                      ((row.user_bet - row.bet_amount) /
                                        row.bet_amount) *
                                      100
                                    ).toFixed(2)}%)`}
                                  </span>
                                </div>
                              )}
                              {row.user_bet < row.bet_amount && (
                                <div className="chart-arrow">
                                  <TrendingDownOutlined
                                    style={{ marginRight: '-5px' }}
                                  />
                                  <span
                                    style={{
                                      marginLeft: '5px',
                                      fontSize: 'xx-small',
                                    }}
                                  >
                                    {`(${(
                                      ((row.bet_amount - row.user_bet) /
                                        row.bet_amount) *
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
                    </div>
                  ))}
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
        // If filter === "Recently Bonded"
        <Grid container spacing={2} sx={{ p: 2 }}>
          {recent.length === 0
            ? Array.from({ length: 4 }).map((_, index) => (
                <Grid item xs={6} sm={4} md={3} lg={3} xl={3} key={index}>
                  <Box
                    className="carousel-content table-row slide-in "
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <Skeleton
                      variant="rectangular"
                      sx={{ width: '100%', height: 200 }}
                    />
                    <Skeleton sx={{ width: '60%' }} />
                    <Skeleton sx={{ width: '40%' }} />
                    <Skeleton sx={{ width: '80%' }} />
                  </Box>
                </Grid>
              ))
            : recent.map((row) => {
                const hostPrizeMinusBetAmount = row.host_pr - row.bet_amount;
                return (
                  <Grid item xs={6} sm={4} md={3} lg={3} xl={3} key={row._id}>
                    <Card
                      onClick={() =>
                        (window.location.href = `/join/${row._id}`)
                      } // or use Next.js router.push
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
                      <Box
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
                        {/* Example layout: Icon + "fromNow" text */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <FontAwesomeIcon icon={faStopwatch} />
                          {/* e.g. "2 minutes ago" */}
                          {customFromNow(Moment(row.created_at))}
                        </Box>
                        {/* Another icon */}
                        <FontAwesomeIcon icon={faHeartBroken} />
                      </Box>

                      {/* Bottom Section: Currency Info */}
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          color: getColorClass(hostPrizeMinusBetAmount), // or a direct color
                        }}
                      >
                        {convertToCurrency(hostPrizeMinusBetAmount, solPrice)}
                      </Typography>
                    </Card>
                  </Grid>
                );
              })}
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
            togglePopup={() => {}}
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
  pumpGame,
};

export default connect(mapStateToProps, mapDispatchToProps)(OpenGamesTable);
