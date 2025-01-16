import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import history from '../redux/history';
import { convertToCurrency } from '../util/conversion';
import { withStyles } from '@material-ui/core/styles';
import Avatar from './Avatar';
import PlayerModal from '../game_panel/modal/PlayerModal';
import { getRoomStatisticsData } from '../redux/Customer/customer.action';

import ReactApexChart from 'react-apexcharts';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress
} from '@material-ui/core';

const styles = (theme) => ({
  root: {
    width: '150px',
    padding: '8px 15px',
    fontSize: '16px',
  },
  dropdownStyle: {}
});

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

  const isAuthenticatedReroute = () => {
    if (!auth) {
      history.push('/');
    }
  };

  const handleOpenPlayerModal = (creatorId) => {
    setShowPlayerModal(true);
    setSelectedCreator(creatorId);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  return (
    <div className="leaderboards-page">
      <div className="leaderboards-content">
        {roomStatsLoaded ? (
          <>
            {actionList && actionList.hostBetsValue.length > 0 ? (
              <Table className="table leaderboards-table">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell className="player">Player</TableCell>
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
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <a
                          className="player"
                          onClick={() => handleOpenPlayerModal(playerData._id)}
                        >
                          <Avatar
                            className="avatar"
                            src={playerData.avatar}
                            rank={playerData.rank}
                            username={playerData.actor}
                            accessory={playerData.accessory}
                            alt=""
                            darkMode={isDarkMode}
                          />
                        </a>
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
                          height="100"
                          series={[
                            {
                              data: playerData.net_profit_values.map(
                                (value, index) => [
                                  playerData.bets_values[index],
                                  value
                                ]
                              )
                            }
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p
                style={{
                  color: 'rgb(153, 153, 153)',
                  textAlign: 'center',
                  fontSize: '16px'
                }}
              >
                No Winners
              </p>
            )}
          </>
        ) : (
          <LinearProgress color="secondary" />
        )}
      </div>
    </div>
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
)(withStyles(styles)(Leaderboards));