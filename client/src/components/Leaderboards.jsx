import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { convertToCurrency } from '../util/conversion';
import { Box, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress, Typography, Tooltip } from '@mui/material';
import Avatar from './Avatar';
import PlayerModal from '../game_panel/modal/PlayerModal';
import { getRoomStatisticsData } from '../redux/Customer/customer.action';

const Leaderboards = ({ roomId }) => {
  const dispatch = useDispatch();

  // Access Redux state using hooks
  const auth = useSelector((state) => state.auth.isAuthenticated);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const actionList = useSelector((state) => state.customerReducer.actionList);
  const roomStatsLoaded = useSelector((state) => state.customerReducer.roomStatsLoaded);
  const solPrice = useSelector((state) => state.logic.solPrice);

  // Local component state
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  useEffect(() => {
    const fetchRoomStatistics = async () => {
      await dispatch(getRoomStatisticsData(roomId, 30));
    };
    fetchRoomStatistics();
  }, [dispatch, roomId]);

  const handleOpenPlayerModal = (creatorId) => {
    setSelectedCreator(creatorId);
    setShowPlayerModal(true);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  return (
    <Box 
      sx={{ 
        padding: '20px',
        backgroundColor: isDarkMode ? '#121212' : '#ffffff',
        minHeight: '100vh' 
      }}
    >
      <Box className="leaderboards-page">
        <Box className="leaderboards-content">
          {roomStatsLoaded ? (
            <>
              {actionList && actionList.hostBetsValue && actionList.hostBetsValue.length > 0 ? (
                <Table 
                  className="leaderboards-table" 
                  sx={{ 
                    minWidth: 650, 
                    bgcolor: isDarkMode ? '#1e1e1e' : '#f9f9f9', 
                    borderRadius: 1, 
                    overflow: 'hidden' 
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Player</TableCell>
                      <TableCell>Wagered</TableCell>
                      <TableCell>Net Profit</TableCell>
                      <TableCell>Plays</TableCell>
                      <TableCell>Graph</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {showPlayerModal && (
                      <PlayerModal
                        selectedCreator={selectedCreator}
                        modalIsOpen={showPlayerModal}
                        closeModal={handleClosePlayerModal}
                      />
                    )}
                    {actionList.room_info.map((playerData, index) => (
                      <TableRow 
                        key={playerData._id || index} 
                        hover 
                        sx={{ 
                          bgcolor: isDarkMode ? '#2c2c2c' : '#ffffff', 
                          '&:nth-of-type(odd)': { bgcolor: isDarkMode ? '#2a2a2a' : '#f1f1f1' } 
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Box 
                            component="span" 
                            onClick={() => handleOpenPlayerModal(playerData._id)} 
                            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Avatar
                              src={playerData.avatar}
                              username={playerData.actor}
                              rank={playerData.rank}
                              accessory={playerData.accessory}
                              elite={playerData.elite}
                              alt={`${playerData.actor}'s avatar`}
                              darkMode={isDarkMode}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {playerData.bets >= 10 ? (
                            <>
                              {convertToCurrency(playerData.wagered, solPrice)}+
                            </>
                          ) : (
                            convertToCurrency(playerData.wagered, solPrice)
                          )}
                        </TableCell>
                        <TableCell>
                          {playerData.bets >= 10 ? (
                            <>
                              {convertToCurrency(playerData.net_profit, solPrice)}+
                            </>
                          ) : (
                            convertToCurrency(playerData.net_profit, solPrice)
                          )}
                        </TableCell>
                        <TableCell>
                          {playerData.bets >= 10 ? '10+' : playerData.bets}
                        </TableCell>
                        
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgb(153, 153, 153)',
                    textAlign: 'center',
                    fontSize: '16px',
                    mt: 2
                  }}
                >
                  No Winners
                </Typography>
              )}
            </>
          ) : (
            <Box sx={{ width: '100%', mt: 4 }}>
              <LinearProgress color="error" />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Leaderboards;