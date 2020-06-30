import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import ClassicRPS from '../JoinGame/ClassicRPS';
import Spleesh from '../JoinGame/Spleesh';
import MysteryBox from '../JoinGame/MysteryBox';
import BrainGame from '../JoinGame/BrainGame';
import { bet, getRoomInfo } from "../../redux/Logic/logic.actions";

class JoinGame extends Component {
    constructor(props) {
        super(props);
        this.state = {
            roomInfo : this.props.roomInfo
        }

        this.join = this.join.bind(this);
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

    join(betInfo) {
        this.props.bet({
            _id: this.state.roomInfo._id,
            game_type: this.props.roomInfo.game_type,
            ...betInfo
        });
    }

    render() {
        return (
            <>
                {this.props.roomInfo.game_type === 'Classic RPS' && <ClassicRPS join={this.join} user_id={this.props.user_id} creator_id={this.props.roomInfo.creator_id} />}
                {this.props.roomInfo.game_type === 'Spleesh!' && <Spleesh join={this.join} spleesh_bet_unit={this.props.roomInfo.spleesh_bet_unit} game_log_list={this.props.roomInfo.game_log_list} user_id={this.props.user_id} creator_id={this.props.roomInfo.creator_id} />}
                {this.props.roomInfo.game_type === 'Mystery Box' && this.props.roomInfo.box_list.length > 0 && <MysteryBox join={this.join} box_list={this.props.roomInfo.box_list} box_price={this.props.roomInfo.box_price} user_id={this.props.user_id} creator_id={this.props.roomInfo.creator_id} />}
                {this.props.roomInfo.game_type === 'Brain Game' && <BrainGame join={this.join} brain_game_type={this.props.roomInfo.brain_game_type} brain_game_score={this.props.roomInfo.brain_game_score} bet_amount={this.props.roomInfo.bet_amount} user_id={this.props.user_id} creator_id={this.props.roomInfo.creator_id} />}
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JoinGame);
