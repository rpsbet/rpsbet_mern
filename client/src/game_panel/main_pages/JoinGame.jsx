import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import RPS from '../JoinGame/RPS';
import Spleesh from '../JoinGame/Spleesh';
import MysteryBox from '../JoinGame/MysteryBox';
import BrainGame from '../JoinGame/BrainGame';
import QuickShoot from '../JoinGame/QuickShoot';
import { bet, getRoomInfo } from '../../redux/Logic/logic.actions';

class JoinGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      roomInfo: this.props.roomInfo
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (current_state.roomInfo._id !== props.roomInfo._id) {
      return {
        roomInfo: props.roomInfo
      };
    }
    return null;
  }

  componentDidMount() {
    this.IsAuthenticatedReroute();
    this.props.getRoomInfo(this.props.match.params.id);
  }

  IsAuthenticatedReroute = () => {
    if (!this.props.auth) {
      history.push('/');
    }
  };

  join = async betInfo => {
    const result = await this.props.bet({
      _id: this.state.roomInfo._id,
      game_type: this.props.roomInfo.game_type,
      ...betInfo
    });

    return result;
  };

  render() {
    return (
      <>
        {this.props.roomInfo.game_type === 'RPS' && (
          <RPS
            join={this.join}
            user_id={this.props.user_id}
            creator_id={this.props.roomInfo.creator_id}
            bet_amount={this.props.roomInfo.bet_amount}
            rps_bet_item_id={this.props.roomInfo.rps_bet_item_id}
            is_private={this.props.roomInfo.is_private}
          />
        )}
        {this.props.roomInfo.game_type === 'Spleesh!' && (
          <Spleesh
            join={this.join}
            spleesh_bet_unit={this.props.roomInfo.spleesh_bet_unit}
            game_log_list={this.props.roomInfo.game_log_list || []}
            user_id={this.props.user_id}
            creator_id={this.props.roomInfo.creator_id}
            is_private={this.props.roomInfo.is_private}
          />
        )}
        {this.props.roomInfo.game_type === 'Mystery Box' &&
          this.props.roomInfo.box_list.length > 0 && (
            <MysteryBox
              join={this.join}
              box_list={this.props.roomInfo.box_list}
              box_price={this.props.roomInfo.box_price}
              user_id={this.props.user_id}
              creator_id={this.props.roomInfo.creator_id}
              is_private={this.props.roomInfo.is_private}
            />
          )}
        {this.props.roomInfo.game_type === 'Brain Game' && (
          <BrainGame
            join={this.join}
            brain_game_type={this.props.roomInfo.brain_game_type}
            brain_game_score={this.props.roomInfo.brain_game_score}
            bet_amount={this.props.roomInfo.bet_amount}
            user_id={this.props.user_id}
            creator_id={this.props.roomInfo.creator_id}
            joined_count={
              this.props.roomInfo.game_log_list
                ? this.props.roomInfo.game_log_list.length
                : 0
            }
            is_private={this.props.roomInfo.is_private}
          />
        )}
        {this.props.roomInfo.game_type === 'Quick Shoot' && (
          <QuickShoot
            join={this.join}
            user_id={this.props.user_id}
            creator_id={this.props.roomInfo.creator_id}
            qs_game_type={this.props.roomInfo.qs_game_type}
            bet_amount={this.props.roomInfo.bet_amount}
            is_private={this.props.roomInfo.is_private}
          />
        )}
        {this.props.roomInfo.room_history && (
          <div className="room-history-panel">
            <h2 className="room-history-title">Staking History</h2>
            <div className="table main-history-table">
              {this.props.roomInfo.room_history.map(
                (row, key) => (
                  <div className="table-row" key={'my_history' + row._id}>
                    <div>
                      <div className="table-cell">
                        <div className="room-id">{row.room_name}</div>
                        <div
                          dangerouslySetInnerHTML={{ __html: row.history }}
                        ></div>
                      </div>
                      <div className="table-cell">{row.from_now}</div>
                    </div>
                  </div>
                ),
                this
              )}
            </div>
          </div>
        )}
      </>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  roomInfo: state.logic.curRoomInfo,
  user_id: state.auth.user._id
});

const mapDispatchToProps = {
  getRoomInfo,
  bet
};

export default connect(mapStateToProps, mapDispatchToProps)(JoinGame);
