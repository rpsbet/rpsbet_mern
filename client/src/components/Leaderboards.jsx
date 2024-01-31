import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../redux/history';
import { convertToCurrency } from '../util/conversion';
import { withStyles } from '@material-ui/core/styles';
import Avatar from './Avatar';

import ReactApexChart from 'react-apexcharts';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@material-ui/core';
import PlayerModal from '../game_panel/modal/PlayerModal';
// import Select from '@material-ui/core/Select';
// import MenuItem from '@material-ui/core/MenuItem';
// import LoopIcon from '@material-ui/icons/Loop';

const styles = theme => ({
  root: {
    width: '150px',
    padding: '8px 15px',
    fontSize: '16px',
    background: '#191a1d'
  },
  dropdownStyle: {}
});

class Leaderboards extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // period: 'all time',
      // data: []
      actionList: [],
      showPlayerModal: false,
      selectedCreator: ''
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    return null;
  }

  componentDidMount() {
    const { actionList } = this.props;
    console.log(actionList)
    this.setState({
      actionList: actionList
    });
    this.IsAuthenticatedReroute();
  }

  componentDidUpdate(prevProps) {
    const { actionList } = this.props;

    if (prevProps.actionList !== actionList) {
      this.setState(
        {
          actionList: actionList
        }
      );
    }
  }

  IsAuthenticatedReroute = async () => {
    if (!this.props.auth) {
      history.push('/');
    }
  };

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  // onPeriodChanged = e => {
  //   e.preventDefault();
  //   this.setState({ period: e.target.value });
  // };

  // refreshTable = e => {
  //   e.preventDefault();
  // };

  render() {
    const { classes } = this.props;
    const { actionList } = this.props;
    return (
      <div className="leaderboards-page">
        <div className="leaderboards-content">
          <div className="leaderboards-panel">
            <h2 className="room-history-title">Leaderboards</h2>

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
                  {this.state.showPlayerModal && (
                    <PlayerModal
                      selectedCreator={this.state.selectedCreator}
                      modalIsOpen={this.state.showPlayerModal}
                      closeModal={this.handleClosePlayerModal}
                    />
                  )}
                  {actionList.room_info.map((playerData, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <a
                          className="player"
                          onClick={() =>
                            this.handleOpenPlayerModal(playerData._id)
                          }
                        >
                          <Avatar
                            className="avatar"
                            src={playerData.avatar}
                            rank={playerData.rank}
                            accessory={playerData.accessory}
                            alt=""
                            darkMode={this.props.isDarkMode}
                          />
                          {/* <span>{playerData.actor}</span> */}
                        </a>
                        {/* <i
                        className={`online-status${
                          this.props.onlineUserList.filter(
                            user => user === playerData._id
                          ).length > 0
                            ? ' online'
                            : ''
                        }`}
                      ></i> */}
                        {/* {playerData._id} */}
                      </TableCell>
                      <TableCell>
                        {convertToCurrency(playerData.wagered)}
                      </TableCell>
                      <TableCell>
                        {convertToCurrency(playerData.net_profit)}
                      </TableCell>
                      <TableCell>{playerData.bets}</TableCell>
                      <TableCell>
                        <ReactApexChart
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
                                  playerData.net_profit > 0
                                    ? ['#00FF00']
                                    : playerData.net_profit < 0
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
              <p>No Winners Yet</p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  user_id: state.auth.user._id,
  isDarkMode: state.auth.isDarkMode
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(Leaderboards));
