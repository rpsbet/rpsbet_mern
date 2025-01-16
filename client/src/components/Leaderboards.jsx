import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { convertToCurrency } from '../util/conversion';
import { Box, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress, Typography, Tooltip } from '@mui/material';
import Avatar from './Avatar';
import PlayerModal from '../game_panel/modal/PlayerModal';
import { getRoomStatisticsData } from '../redux/Customer/customer.action';
import ReactApexChart from 'react-apexcharts';

const Leaderboards = ({
  auth,
  roomStatsLoaded,
  actionList,
  solPrice,
  isDarkMode,
  getRoomStatisticsData,
  roomId
}) => {
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  useEffect(() => {
    const fetchRoomStatistics = async () => {
      await getRoomStatisticsData(roomId, 30);
      isAuthenticatedReroute();
    };
    fetchRoomStatistics();
  }, [getRoomStatisticsData, roomId]);

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
              {actionList && actionList.hostBetsValue.length > 0 ? (
                <Table 
                  className="leaderboards-table" 
                  sx={{ 
                    minWidth: 650, 
                    bgcolor: isDarkMode ? '#1e1e1e' : '#f9f9f9', 
                    borderRadius: 2, 
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
                        <TableCell>
                          <ReactApexChart
                            options={{
                              chart: {
                                animations: { enabled: false },
                                toolbar: { show: false },
                                zoom: { enabled: false }
                              },
                              grid: { show: false },
                              tooltip: { enabled: false },
                              fill: {
                                type: 'gradient',
                                gradient: {
                                  shade: 'light',
                                  gradientToColors:
                                    playerData.net_profit > 0
                                      ? ['#00FF00']
                                      : playerData.net_profit < 0
                                      ? ['#FF0000']
                                      : ['#808080'],
                                  shadeIntensity: 1,
                                  opacityFrom: 0.7,
                                  opacityTo: 0.9,
                                  stops: [0, 100, 100]
                                }
                              },
                              stroke: { curve: 'smooth' },
                              xaxis: {
                                labels: { show: false },
                                axisTicks: { show: false },
                                axisBorder: { show: false }
                              },
                              yaxis: {
                                labels: { show: false },
                                axisTicks: { show: false },
                                axisBorder: { show: false }
                              }
                            }}
                            type="line"
                            width={120}
                            height={100}
                            series={[
                              {
                                data: playerData.net_profit_values.map((value, idx) => [
                                  playerData.bets_values[idx],
                                  value
                                ])
                              }
                            ]}
                          />
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
              <LinearProgress color="secondary" />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
  user_id: state.auth.user._id,
  isDarkMode: state.auth.isDarkMode,
  actionList: state.customerReducer.actionList,
  roomStatsLoaded: state.customerReducer.roomStatsLoaded,
  solPrice: state.logic.solPrice
});

const mapDispatchToProps = { getRoomStatisticsData };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Leaderboards);