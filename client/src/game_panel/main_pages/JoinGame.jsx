import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import ClassicRPS from '../JoinGame/ClassicRPS';
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

    join(selected_rps, is_anonymous) {
        console.log(this.state.roomInfo._id, selected_rps, is_anonymous);
        this.props.bet({
            _id: this.state.roomInfo._id,
            selected_rps,
            is_anonymous
        });
    }

    render() {
        return (
            <>
                {this.props.roomInfo.game_type === 'Classic RPS' && <ClassicRPS join={this.join} />}
            </>
        );
    }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  roomInfo: state.logic.curRoomInfo
});

const mapDispatchToProps = {
    getRoomInfo,
    bet
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JoinGame);
