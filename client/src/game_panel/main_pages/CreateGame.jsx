import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import ClassicRPS from '../CreateGame/ClassicRPS';
import Spleesh from '../CreateGame/Spleesh';
import MysteryBox from '../CreateGame/MysteryBox';
import BrainGame from '../CreateGame/BrainGame';
import PlayBrainGame from '../CreateGame/PlayBrainGame';
import { createRoom, getGameTypeList, setGameMode, getRoomList } from "../../redux/Logic/logic.actions";
import { getBrainGameType } from '../../redux/Question/question.action';
import { FaRegQuestionCircle, FaPoundSign } from 'react-icons/fa';
import { openAlert } from '../../redux/Notification/notification.actions';

class CreateGame extends Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 1,
            game_type: 1,
            game_mode : this.props.game_mode,
            isPlayingBrain: false,
            selected_rps: 1,
            bet_amount: 0,
            is_private: false,
            is_anonymous: false,
            room_password: '',
            endgame_type: true,
            endgame_amount: 0,
            box_list: [],
            max_return: 0,
            max_prize: 0,
            lowest_box_price: 0,
            brain_game_type: this.props.brain_game_type,
        }

        this.onNextButtonClicked = this.onNextButtonClicked.bind(this);
        this.onSkipButtonClicked = this.onSkipButtonClicked.bind(this);
        this.onCreateRoom = this.onCreateRoom.bind(this);
        this.onChangeState = this.onChangeState.bind(this);
        this.onStartBrainGame = this.onStartBrainGame.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.game_mode !== props.game_mode || current_state.balance !== props.balance || current_state.brain_game_type !== props.brain_game_type) {
            return {
                ...current_state,
                game_mode: props.game_mode,
                brain_game_type: props.brain_game_type,
                balance: props.balance,
            };
        }
        return null;
    }

    onChangeState(newState) {
        this.setState(newState);
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

    onSkipButtonClicked() {
        this.setState({
            is_private: false,
            is_anonymous: false,
            endgame_type: false,
            step: this.state.step + 1
        });
    }

    onStartBrainGame(e) {
        e.preventDefault();
        if (window.confirm('Do you want to create new game now?')) {
            this.setState({
                step: 5,
                isPlayingBrain: true
            });
        }
        console.log(123123123);
    }

    onNextButtonClicked() {
        if (this.state.step === 1) {
            if (this.state.game_mode === "Spleesh!") {
                this.setState({
                    bet_amount: 1,
                    endgame_amount: 54,
                    max_return: 54,
                });
            } else if (this.state.game_mode === "Brain Game") {
                this.setState({
                    max_return: "∞ * 0.9"
                });
            }
        } else if (this.state.step === 2) {
            if (this.state.bet_amount === 0) {
                this.props.openAlert('warning', 'Warning!', 'Please input the bet amount!');
                return;
            }
    
            if (this.state.bet_amount > this.state.balance / 100.0) {
                this.props.openAlert('warning', 'Warning!', 'Not enough balance!');
                return;
            }
        } else if (this.state.step === 3) {
            if (this.state.is_private === true && this.state.room_password === "") {
                this.props.openAlert('warning', 'Warning!', "You have set the Privacy to 'Private'. Please create a password!");
                return;
            }

            if (this.state.endgame_amount === 0) {
                this.setState({endgame_type: false});
            }
        }

        this.setState({step: (this.state.step < 4 ? this.state.step + 1 : this.state.step)});
    }

    async onCreateRoom() {
        if (window.confirm('Do you want to create new game now?')) {
            await this.props.createRoom(this.state);
        }
    }

    header() {
        if (this.state.game_mode === 'Brain Game' && this.state.isPlayingBrain) {
            return (
                <>
                    <h1 className="main_title">Brain Game</h1>
                    <label className="tbl_title" style={{width: '100%', margin: 0}}>YOU HAVE 60 SECONDS TO GUESS AS MANY QUESTIONS CORRECTLY</label>
                    <hr style={{borderColor: "#C83228", margin: 0}}/>
                </>
            )
        } else {
            return (<h1 className="main_title">Create a bet</h1>)
        }
    }

    step1() {
        return (
            <>
                <hr/>
                <label className="lbl_game_option">Choose a Game Mode</label>
                <div className="row game_types">
                    {this.props.gameTypeList.map((gameType, index) => (
                        <div className={`game_type ${gameType.short_name} ${(this.state.game_mode === gameType.game_type_name? " checked" : "")}`} onClick={() => { this.setState({game_type: index + 1}); this.props.setGameMode(gameType.game_type_name); }} key={index}>
                            <img src={`/img/gametype/${gameType.short_name ? gameType.short_name : 'blank'}.png`} alt="" />
                            {gameType.game_type_name}
                        </div>
                    ))}
                </div>
                <div>
                    Click the '<FaRegQuestionCircle />' in the top bar to see How To Play
                </div>
            </>
        );
    }

    step2() {
        return (
            <>
                { this.state.game_mode === 'Classic RPS' && 
                    <ClassicRPS 
                        onChangeState={this.onChangeState} 
                        selected_rps={this.state.selected_rps} 
                        bet_amount={this.state.bet_amount} 
                        is_private={this.state.is_private} 
                        is_anonymous={this.state.is_anonymous} 
                        room_password={this.state.room_password} 
                    />
                }
                {this.state.game_mode === 'Spleesh!' && 
                    <Spleesh 
                        onChangeState={this.onChangeState} 
                        bet_amount={this.state.bet_amount}
                        is_private={this.state.is_private}
                        is_anonymous={this.state.is_anonymous}
                        room_password={this.state.room_password}
                        endgame_type={this.state.endgame_type}
                        endgame_amount={this.state.endgame_amount}
            
                    />
                }
                {this.state.game_mode === 'Mystery Box' && 
                    <MysteryBox 
                        onChangeState={this.onChangeState} 
                        box_list={this.state.box_list}
                        bet_amount={this.state.bet_amount}
                        max_return={this.state.max_return}
                        max_prize={this.state.max_prize}
                        endgame_amount={this.state.endgame_amount}
                    />
                }
                {this.state.game_mode === 'Brain Game' && 
                    <BrainGame 
                        onChangeState={this.onChangeState}
                        bet_amount = {this.state.bet_amount}
                        brain_game_type = {this.state.brain_game_type}
                    />
                }
            </>
        )
    }

    step3() {
        return (
            <div id="advanced_panel" className={this.state.advanced_status}>
                <hr/>
                <label className="lbl_game_option">Privacy</label>
                <div>
                    <label className={"radio-inline" + (this.state.is_private === false ? ' checked' : '')} onClick={() => { this.setState({is_private: false, room_password: ''}); }}>Public</label>
                    <label className={"radio-inline" + (this.state.is_private === true ? ' checked' : '')} onClick={() => { this.setState({is_private: true}); }}>Private</label>
                    <input type="password" id="room_password" value={this.state.room_password} onChange={(e) => {this.setState({room_password: e.target.value})}} className={"form-control" + (this.state.is_private === true ? "" : " hidden")} />
                </div>
                <div>Set to 'Private' to require a password to Join</div>

                { this.state.game_mode !== 'Classic RPS' && <>
                    <hr/>
                    <label className="lbl_game_option">END Game Type</label>
                    <div>
                        <label className={"radio-inline" + (this.state.endgame_type === false ? ' checked' : '')} onClick={() => { this.setState({endgame_type: false}); }}>Manual</label>
                        <label className={"radio-inline" + (this.state.endgame_type === true ? ' checked' : '')} onClick={() => { this.setState({endgame_type: true}); }}>Automatic</label>
                        <label className={"lbl_endgame_type" + (this.state.endgame_type === true ? "" : " hidden")}>
                            <span className="pound-symbol"><FaPoundSign /><input type="text" id="endgame_amount" value={this.state.endgame_amount} onChange={(e)=>{this.setState({endgame_amount: e.target.value})}} className="col-md-6 form-control bet-input endgame_amount" /></span>
                        </label>
                    </div>
                    <div>Make your game END automatically when your PR reaches an amount. This will put a cap on your Winnings but at least keep them safe.</div>
                </>
                }

                <hr/>
                <label style={{pointerEvents: "none", opacity: "0.6"}} className="lbl_game_option">(DISABLED) Anonymous Bet</label>
                <div style={{pointerEvents: "none", opacity: "0.6"}}>
                    <label className={"radio-inline" + (this.state.is_anonymous === true ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: true}); }}>Yes</label>
                    <label className={"radio-inline" + (this.state.is_anonymous === false ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: false}); }}>No</label>
                </div>
                <div style={{pointerEvents: "none", opacity: "0.6"}}>Choose 'Yes' to place an anonymous bet. £0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your £0.10 back.</div>
            </div>
        )
    }

    step4() {
        return (
            <div className="summary_panel">
                <hr/>
                <label className="lbl_game_option">Game Summary</label>
                <div className="summary_item row">
                    <div className="col-md-3 col-sm-6">Bet Amount</div>
                    <div className="col-md-3 col-sm-6">£{this.state.bet_amount}</div>
                </div>
                <div className="summary_item row">
                    <div className="col-md-3 col-sm-6">Max Return Amount</div>
                    <div className="col-md-3 col-sm-6">£{this.state.max_return}</div>
                </div>
                {this.state.endgame_type && <div className="summary_item row">
                    <div className="col-md-3 col-sm-6">End Game Amount</div>
                    <div className="col-md-3 col-sm-6">£{this.state.endgame_amount}</div>
                </div>}
                <div className="summary_item row">
                    <div className="col-md-3 col-sm-6">Status</div>
                    <div className="col-md-3 col-sm-6">{this.state.is_private ? "Private" : "Public"}</div>
                </div>
            </div>
        )
    }

    action_panel() {
        return (
            <>
                <hr/>
                <div className="action_panel">
                    {this.state.step > 1 && this.state.step < 5 ? <button id="btn_prev" className="btn" onClick={() => { this.setState({step: this.state.step > 1 ? this.state.step - 1 : this.state.step}) }}>Previous</button> : <label>&nbsp;</label>}
                    {this.state.step === 3 && <button id="btn_skip" className="btn" onClick={this.onSkipButtonClicked}>Skip</button>}
                    {this.state.step === 4 && this.state.game_mode === "Brain Game" && <button id="btn_bet" className="btn btn_secondary" onClick={this.onStartBrainGame}>Start</button>}
                    {this.state.step === 4 && this.state.game_mode !== "Brain Game" && <button id="btn_bet" className="btn" onClick={this.onCreateRoom}>Place Bet Game</button>}
                    {this.state.step < 4 && <button id="btn_next" className="btn" onClick={this.onNextButtonClicked}>Next</button>}
                </div>
            </>
        )
    }
    
    render() {
        return (
            <>
                {this.header()}
                {this.state.step === 1 && this.step1()}
                {this.state.step === 2 && this.step2()}
                {this.state.step === 3 && true && this.step3()}
                {this.state.step === 4 && this.step4()}
                {this.state.step === 5 && this.state.game_mode === "Brain Game" && this.state.isPlayingBrain && 
                    <PlayBrainGame 
                        brain_game_type={this.state.brain_game_type}
                        bet_amount={this.state.bet_amount}
                        is_private={this.state.is_private}
                        is_anonymous={this.state.is_anonymous}
                        room_password={this.state.room_password}
                    />
                }
                {this.state.step !== 5 && this.action_panel()}
            </>
        );
    }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  landingItemList: state.landingReducer.landingItemList,
  gameTypeList: state.logic.gameTypeList,
  game_mode: state.logic.game_mode,
  socket: state.auth.socket,
  balance: state.auth.balance,
  brain_game_type: state.questionReducer.brain_game_type,
});

const mapDispatchToProps = {
    createRoom,
    getGameTypeList,
    setGameMode,
    getRoomList,
    getBrainGameType,
    openAlert
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateGame);
