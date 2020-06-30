import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import ClassicRPS from '../CreateGame/ClassicRPS';
import Spleesh from '../CreateGame/Spleesh';
import MysteryBox from '../CreateGame/MysteryBox';
import BrainGame from '../CreateGame/BrainGame';
import { createRoom, getGameTypeList, setGameMode, getRoomList } from "../../redux/Logic/logic.actions";
import { getBrainGameType } from '../../redux/Question/question.action';
import { FaRegQuestionCircle } from 'react-icons/fa';

class CreateGame extends Component {
    constructor(props) {
        super(props);
        this.state = {
            game_mode : this.props.game_mode,
            isPlayingBrain: this.props.isPlayingBrain
        }
        this.onCreateRoom = this.onCreateRoom.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.game_mode !== props.game_mode || current_state.isPlayingBrain !== props.isPlayingBrain) {
            return {
                game_mode: props.game_mode,
                isPlayingBrain: props.isPlayingBrain
            };
        }
        return null;
    }

    componentDidMount() {
        this.IsAuthenticatedReroute();
        this.props.getGameTypeList();
        this.props.getBrainGameType();
    }
    
    IsAuthenticatedReroute = () => {
        if (!this.props.auth) {
            history.push('/');
        }
    };

    async onCreateRoom(game_info) {
        await this.props.createRoom(game_info);
    }

    createPanelHeader() {
        if (this.state.game_mode === 'Brain Game' && this.state.isPlayingBrain) {
            return (
                <>
                    <h1 className="main_title">Brain Game</h1>
                    <label className="tbl_title" style={{width: '100%', margin: 0}}>YOU HAVE 60 SECONDS TO GUESS AS MANY QUESTIONS CORRECTLY</label>
                    <hr style={{borderColor: "#C83228", margin: 0}}/>
                </>
            )
        } else {
            return (
                <>
                    <h1 className="main_title">Create a bet</h1>
                    <hr/>
                    <label className="lbl_game_option">Game Mode</label>
                    <div>
                        {this.props.gameTypeList.map((gameType, index) => (
                            <label className={"radio-inline" + (this.state.game_mode === gameType.game_type_name? " checked" : "")} onClick={() => { this.props.setGameMode(gameType.game_type_name); }} key={index}>{gameType.game_type_name}</label>
                        ))}
                    </div>
                    <div>
                        Click the '<FaRegQuestionCircle />' in the top bar to see How To Play
                    </div>
                </>
            );
        }
    }
    
    render() {
        return (
            <>
                {this.createPanelHeader()}
                {this.state.game_mode === 'Classic RPS' && <ClassicRPS createRoom={this.onCreateRoom} />}
                {this.state.game_mode === 'Spleesh!' && <Spleesh createRoom={this.onCreateRoom} />}
                {this.state.game_mode === 'Mystery Box' && <MysteryBox createRoom={this.onCreateRoom} />}
                {this.state.game_mode === 'Brain Game' && <BrainGame createRoom={this.onCreateRoom} />}
            </>
        );
    }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  landingItemList: state.landingReducer.landingItemList,
  gameTypeList: state.logic.gameTypeList,
  game_mode: state.logic.game_mode,
  isPlayingBrain: state.logic.isPlayingBrain,
  socket: state.auth.socket
});

const mapDispatchToProps = {
    createRoom,
    getGameTypeList,
    setGameMode,
    getRoomList,
    getBrainGameType
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateGame);
