import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import ClassicRPS from '../CreateGame/ClassicRPS';
import { createRoom, getGameTypeList, setGameMode, getRoomList } from "../../redux/Logic/logic.actions";

class CreateGame extends Component {
    constructor(props) {
        super(props);
        this.state = {
            game_mode : this.props.game_mode,
        }
        this.onCreateRoom = this.onCreateRoom.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.game_mode !== props.game_mode) {
            return {
                game_mode: props.game_mode
            };
        }
        return null;
    }

    componentDidMount() {
        this.IsAuthenticatedReroute();
        this.props.getGameTypeList();
    }
    
    IsAuthenticatedReroute = () => {
        if (!this.props.auth) {
            history.push('/');
        }
    };

    onCreateRoom(game_info) {
        this.props.createRoom(game_info);
        this.props.getRoomList({});
    }
    
    render() {
        return (
            <>
                <h1 className="main_title">Create a bet</h1>
                <hr/>
                <label className="lbl_game_option">Game Mode:</label>
                <div>
                    {this.props.gameTypeList.map((gameType, index) => (
                        <label className={"radio-inline" + (this.state.game_mode === gameType.game_type_name? " checked" : "")} onClick={() => { this.props.setGameMode(gameType.game_type_name); }} key={index}>{gameType.game_type_name}</label>
                    ))}
                </div>
                <div>
                    Start by choosing which game, you can find instructions for each game by clicking 'How To Play' in the top left.
                </div>
                {this.state.game_mode === 'Classic RPS' && <ClassicRPS createRoom={this.onCreateRoom} />}
            </>
        );
    }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  landingItemList: state.landingReducer.landingItemList,
  gameTypeList: state.logic.gameTypeList,
  game_mode: state.logic.game_mode,
  socket: state.auth.socket
});

const mapDispatchToProps = {
    createRoom,
    getGameTypeList,
    setGameMode,
    getRoomList
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateGame);
