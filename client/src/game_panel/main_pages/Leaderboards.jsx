import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
import { convertToCurrency } from '../../util/conversion';
import { withStyles } from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import LoopIcon from '@material-ui/icons/Loop';

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
      period: 'all time',
      data: [],
      actionList: null
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    return null;
  }

  getRoomData = async roomId => {
    try {
      const actionList = await this.props.getRoomStatisticsData(roomId._id);
      this.setState({
        actionList: actionList
      });

    } catch (error) {
      console.error('Error fetching room data:', error);
    }
  };

  componentDidMount() {
    this.IsAuthenticatedReroute();

    this.getRoomData(this.props.getRoomInfo);
  }

  IsAuthenticatedReroute = () => {
    if (!this.props.auth) {
      history.push('/');
    }
  };

  onPeriodChanged = e => {
    e.preventDefault();
    this.setState({ period: e.target.value });
  };

  refreshTable = e => {
    e.preventDefault();
  };

  render() {
    const { classes } = this.props;
    const roomStatistics = this.state.actionList || []; // Assuming you set the fetched data to state

    return (
      <div className="leaderboards-page">
        <div
          className="leaderboards-content"
        >
          <table className="table leaderboards-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="player">PLAYER</th>
                <th>WAGERED</th>
                <th>NET PROFIT</th>
                <th>PLAYS</th>
              </tr>
            </thead>
            <tbody>
              {roomStatistics.map((playerData, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className="actor">{playerData.actor}</td>
                  <td>{convertToCurrency(playerData.wagered)}</td>
                  <td>{convertToCurrency(playerData.net_profit)}</td>
                  <td>{playerData.bets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  user_id: state.auth.user._id
});

const mapDispatchToProps = {
  getRoomStatisticsData
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(Leaderboards));
