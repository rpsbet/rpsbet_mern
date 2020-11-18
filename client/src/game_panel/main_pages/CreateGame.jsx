import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import ClassicRPS from '../CreateGame/ClassicRPS';
import Spleesh from '../CreateGame/Spleesh';
import MysteryBox from '../CreateGame/MysteryBox';
import BrainGame from '../CreateGame/BrainGame';
import PlayBrainGame from '../CreateGame/PlayBrainGame';
import QuickShoot from '../CreateGame/QuickShoot';
import Summary from '../CreateGame/Summary';
import { createRoom, getGameTypeList, setGameMode } from "../../redux/Logic/logic.actions";
import { getBrainGameType } from '../../redux/Question/question.action';
import { FaRegQuestionCircle } from 'react-icons/fa';
import { openAlert } from '../../redux/Notification/notification.actions';
import AdvancedSettings from '../CreateGame/AdvancedSettings';

class CreateGame extends Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 1,
            child_step: 1,
            game_type: 1,
            game_mode : this.props.game_mode,
            isPlayingBrain: false,
            selected_rps: 1,
            qs_game_type: 2,
            selected_qs_position: 0,
            bet_amount: 0,
            endgame_amount: 0,
            spleesh_bet_unit: 1, 
            max_return: 0,
            max_prize: 0,
            lowest_box_price: 0,
            public_bet_amount: "£0",
            is_private: false,
            is_anonymous: false,
            room_password: '',
            endgame_type: true,
            box_list: [],
            brain_game_type: this.props.brain_game_type,
        }

        this.onPrevButtonClicked = this.onPrevButtonClicked.bind(this);
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
    }

    onPrevButtonClicked() {
        if (this.state.game_mode !== 'Mystery Box' && this.state.step < 4) {
            if (this.state.step === 3 && this.state.child_step === 1) {
                if (this.state.game_mode === "Quick Shoot") {
                    this.setState({
                        step: 2,
                        child_step: 3
                    });
                } else {
                    this.setState({
                        step: 2,
                        child_step: 2
                    });
                }
                return;
            } else if (this.state.child_step > 1) {
                this.setState({
                    child_step: this.state.child_step - 1
                });
        
                return;
            }
        }

        this.setState({
            step: this.state.step > 1 ? this.state.step - 1 : this.state.step
        });
    }

    onNextButtonClicked() {
        if (this.state.step === 1) {
            let newState = { 
                child_step: 1, 
                bet_amount: 0,
                endgame_amount: 0,
                max_return: 0,
                max_prize: 0,
                lowest_box_price: 0,
                public_bet_amount: "£0",
            };

            if (this.state.game_mode === "Spleesh!") {
                newState = {
                    ...newState,
                    bet_amount: 1,
                    endgame_amount: 54,
                    max_return: 54,
                };
            } else if (this.state.game_mode === "Classic RPS") {
                newState = {
                    ...newState,
                    bet_amount: 1,
                    max_return: 2 * 0.95
                };
            } else if (this.state.game_mode === "Brain Game") {
                newState = {
                    ...newState,
                    bet_amount: 1,
                    max_return: "∞ * 0.9"
                };
            } else if (this.state.game_mode === "Quick Shoot") {
                console.log(this.state)
                newState = {
                    ...newState,
                    bet_amount: 1,
                    public_bet_amount: "£1",
                    max_return: "2"
                };
            }

            this.setState(newState);
        } else if (this.state.step === 2) {
            if (parseFloat(this.state.bet_amount) === 0) {
                this.props.openAlert('warning', 'Warning!', 'Please input the bet amount!');
                return;
            }
    
            if (this.state.bet_amount > this.state.balance / 100.0) {
                this.props.openAlert('warning', 'Warning!', 'Not enough balance!');
                return;
            }


            if (this.state.game_mode === 'Quick Shoot' && this.state.child_step < 3) {
                this.setState({
                    child_step: this.state.child_step + 1
                });
                return;
            }else if (this.state.game_mode !== 'Mystery Box' && this.state.child_step === 1) {
                this.setState({
                    child_step: this.state.child_step + 1
                });
                return;
            } else {
                this.setState({
                    step: 3,
                    child_step: 1
                });
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

            if (this.state.game_mode !== 'Classic RPS' && this.state.game_mode !== 'Quick Shoot' && this.state.child_step === 1) {
                this.setState({
                    child_step: this.state.child_step + 1
                });
                return;
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
                        <div className={`game_type ${gameType.short_name} ${(this.state.game_mode === gameType.game_type_name? " checked" : "")}`} 
                            onClick={ async () => { await this.setState({game_type: index + 1}); await this.props.setGameMode(gameType.game_type_name); this.onNextButtonClicked(); }} key={index}>
                            <img src={`/img/gametype/${gameType.short_name ? gameType.short_name : 'blank'}.png`} alt="" />
                            {gameType.game_type_name}
                        </div>
                    ))}
                </div>
                <div className="tip">
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
                        step={this.state.child_step}
                    />
                }
                {this.state.game_mode === 'Spleesh!' && 
                    <Spleesh 
                        onChangeState={this.onChangeState} 
                        bet_amount={this.state.bet_amount}
                        spleesh_bet_unit={this.state.spleesh_bet_unit}
                        is_private={this.state.is_private}
                        is_anonymous={this.state.is_anonymous}
                        room_password={this.state.room_password}
                        endgame_type={this.state.endgame_type}
                        endgame_amount={this.state.endgame_amount}
                        step={this.state.child_step}
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
                        step={this.state.child_step}
                    />
                }
                {this.state.game_mode === 'Quick Shoot' && 
                    <QuickShoot 
                        onChangeState={this.onChangeState} 
                        bet_amount={this.state.bet_amount}
                        is_private={this.state.is_private}
                        is_anonymous={this.state.is_anonymous}
                        room_password={this.state.room_password}
                        endgame_type={this.state.endgame_type}
                        endgame_amount={this.state.endgame_amount}
                        qs_game_type={this.state.qs_game_type}
                        selected_qs_position={this.state.selected_qs_position}
                        step={this.state.child_step}
                    />
                }
            </>
        )
    }

    action_panel() {
        return (
            <>
                <hr/>
                <div className="action_panel">
                    {this.state.step > 1 && this.state.step < 5 ? <button id="btn_prev" className="btn" onClick={this.onPrevButtonClicked}>Previous</button> : <label>&nbsp;</label>}
                    {this.state.step === 3 && <button id="btn_skip" className="btn" onClick={this.onSkipButtonClicked}>Skip</button>}
                    {this.state.step === 4 && this.state.game_mode === "Brain Game" && <button id="btn_bet" className="btn btn_secondary" onClick={this.onStartBrainGame}>Start</button>}
                    {this.state.step === 4 && this.state.game_mode !== "Brain Game" && <button id="btn_bet" className="btn" onClick={this.onCreateRoom}>Place Bet</button>}
                    {this.state.step < 4 && this.state.step !== 1 && <button id="btn_next" className="btn" onClick={this.onNextButtonClicked}>Next</button>}
                </div>
            </>
        )
    }
    
    render() {
        return (
            <>
                {this.header()}
                {
                    <Summary 
                        bet_amount={this.state.bet_amount}
                        max_return={this.state.max_return}
                        endgame_type={this.state.endgame_type}
                        endgame_amount={this.state.endgame_amount}
                        is_private={this.state.is_private}
                        step={this.state.step}
                        child_step={this.state.child_step}
                        game_mode={this.state.game_mode}
                        max_prize={this.state.max_prize}
                        public_bet_amount={this.state.public_bet_amount}
                    />
                }
                {this.state.step === 1 && this.step1()}
                {this.state.step === 2 && this.step2()}
                {this.state.step === 3 && 
                    <AdvancedSettings 
                        onChangeState={this.onChangeState}
                        is_private={this.state.is_private}
                        room_password={this.state.room_password}
                        game_mode={this.state.game_mode}
                        endgame_type={this.state.endgame_type}
                        endgame_amount={this.state.endgame_amount}
                        is_anonymous={this.state.is_anonymous}
                        step={this.state.child_step}
                    />
                }
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
    getBrainGameType,
    openAlert
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateGame);
