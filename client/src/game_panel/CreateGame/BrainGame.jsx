import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentQuestionInfo } from '../../redux/Question/question.action';
import axios from '../../util/Api';
import { FaPoundSign } from 'react-icons/fa';

class BrainGame extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected_rps: 1,
            bet_amount: 0,
            brain_game_type: this.props.brain_game_type,
            game_type_list: this.props.game_type_list,
            advanced_status: '',
            is_private: false,
            endgame_type: false,
            endgame_amount: '',
            is_anonymous: false,
            room_password: '',
            is_started: false,
            remaining_time: 60,
            score: 0,
            intervalId: null,
            balance: this.props.balance,
            question: { _id: '', question: '' },
            answers: [],
            next_question: null,
            next_answers: []
        };
        this.onShowButtonClicked = this.onShowButtonClicked.bind(this);
        this.onCountDown = this.onCountDown.bind(this);
        this.onChangeBetAmount = this.onChangeBetAmount.bind(this);
        this.onChangeRoomPassword = this.onChangeRoomPassword.bind(this);
        this.onChangeEndgameAmount = this.onChangeEndgameAmount.bind(this);
        this.onCreateGame = this.onCreateGame.bind(this);
        this.onClickAnswer = this.onClickAnswer.bind(this);
        this.getNextQuestion = this.getNextQuestion.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.balance !== props.balance || current_state.brain_game_type !== props.brain_game_type) {
            return {
                ...current_state,
                balance: props.balance,
                brain_game_type: props.brain_game_type
            };
        }
        return null;
    }

    async getNextQuestion(brain_game_type) {
        try {
            const res = await axios.get('/game/question/' + brain_game_type);
            if (res.data.success) {
                this.setState({
                    next_question: res.data.question,
                    next_answers: res.data.answers
                })
            }
        } catch (err) {
            console.log('err***', err);
        }
    }

    componentDidMount() {
        this.getNextQuestion(this.state.brain_game_type);
    }

    onChangeBetAmount(e) {
        this.setState({bet_amount: e.target.value});
    }

    onChangeRoomPassword(e) {
        this.setState({room_password: e.target.value});
    }

    onShowButtonClicked(e) {
        e.preventDefault();
        if (this.state.advanced_status === "") {
            this.setState({advanced_status: "hidden"});
        } else {
            this.setState({advanced_status: ""});
        }
    }

    onChangeEndgameAmount(e) {
        this.setState({endgame_amount: e.target.value});
    }

    onCreateGame(e) {
        e.preventDefault();
        if (this.state.bet_amount === 0) {
            alert("Please input the bet amount!");
            return;
        }

        if (this.state.bet_amount > this.state.balance / 100.0) {
            alert("Not enough balance!");
            return;
        }

        if (this.state.is_private === true && this.state.room_password === "") {
            alert("You have set the Privacy to 'Private'. Please input the password!");
            return;
        }

        if (window.confirm('Do you want to create new game now?')) {
            const intervalId = setInterval(this.onCountDown, 1000);
            this.setState({
                is_started: true,
                intervalId,
                question: this.state.next_question,
                answers: this.state.next_answers,
                remaining_time: 60
            });

            this.getNextQuestion(this.state.brain_game_type);
        }
    }

    onCountDown() {
        const remaining_time = this.state.remaining_time - 1;
        this.setState({ remaining_time });

        if (remaining_time === 0) {
            clearInterval(this.state.intervalId);
            this.setState({
                // is_started: false,
                intervalId: null,
                remaining_time: 'FIN'
            });

            this.props.createRoom({
                game_type: 3,
                brain_game_type: this.state.brain_game_type,
                brain_game_score: this.state.score,
                bet_amount: this.state.bet_amount,
                is_private: this.state.is_private,
                is_anonymous: this.state.is_anonymous,
                room_password: this.state.room_password
            });
        }
    }

    async onClickAnswer(e) {
        try {
            if (this.state.remaining_time === 'FIN') {
                return;
            }
            const data = {
                question_id: this.state.question._id,
                answer_id: e.target.getAttribute('_id')
            }

            const res = await axios.post('/game/answer/', data);
            if (res.data.success) {
                this.setState({
                    score: this.state.score + res.data.answer_result
                });
            }

            this.setState({
                question: this.state.next_question,
                answers: this.state.next_answers,
            });
        } catch (err) {
            console.log('err***', err);
        }
        this.getNextQuestion(this.state.brain_game_type);
    }

    render() {
        const { is_started } = this.state;
        return is_started === true ? 
            (
                <>
                    <div className="col-md-12">
                        <div className="timer">
                            <div className="timer_title">Timer:</div>
                            <div className="countdown">{this.state.remaining_time}</div>
                            <div className="timer_footer">seconds left</div>
                        </div>
                        <div className="brain_score">
                            Score: <label>{this.state.score}</label>
                        </div>
                    </div>
                    <div className="row" style={{justifyContent: 'center'}}>
                        <div className="col-md-offset-2 col-md-8 clearfix question_panel">
                            {this.state.question.question}
                        </div>
                        {this.state.answers.map((answer, index) => (
                            <label key={index} className="answer col-md-8 radio-inline checked" onClick={this.onClickAnswer} _id={answer._id}>{answer.answer}</label>
                        ))}
                    </div>
                </>
            )
            :
            (
                <form onSubmit={this.onCreateGame}>
                    <hr/>
                    <label className="lbl_game_option">Game Type</label>
                    {this.state.game_type_list.map((game_type, index) => (
                        <label className={"radio-inline" + (this.state.brain_game_type === game_type._id ? ' checked' : '')} 
                            onClick={(e) => { 
                                this.props.setCurrentQuestionInfo({brain_game_type: game_type._id}); 
                                this.getNextQuestion(game_type._id);
                            }} key={index}>
                            {game_type.game_type_name}
                        </label>
                    ))}
                    <hr/>
                    <label className="lbl_game_option">Bet Amount</label>
                    <span class="pound-symbol"><FaPoundSign />
                    <input type="number" pattern="[0-9]*" name="betamount" id="betamount" value={this.state.bet_amount} onChange={this.onChangeBetAmount} className="form-control col-md-6 input-sm bet-input" placeholder="Bet Amount" /></span>
                    <div>The global cost to play this game</div>
                    <hr/>
                    <label className="lbl_game_option">Max Return</label>
                    <input type="text" readOnly name="potential" id="potential" className="form-control input-sm" value="∞ * 0.9" />
                    <div>The global max return with the chosen settings</div>
                    <button className="btn-advanced" onClick={this.onShowButtonClicked}>Show/Hide Advanced Settings</button>
                    <div id="advanced_panel" className={this.state.advanced_status}>
                        <hr/>
                        <label className="lbl_game_option">Privacy</label>
                        <div>
                            <label className={"radio-inline" + (this.state.is_private === false ? ' checked' : '')} onClick={() => { this.setState({is_private: false, room_password: ''}); }}>Public</label>
                            <label className={"radio-inline" + (this.state.is_private === true ? ' checked' : '')} onClick={() => { this.setState({is_private: true}); }}>Private</label>
                            <input type="password" id="room_password" value={this.state.room_password} onChange={this.onChangeRoomPassword} className={"form-control" + (this.state.is_private === true ? "" : " hidden")} />
                        </div>
                        <div>Set to 'Private' to require a password to Join</div>

                        <hr/>
                        <label className="lbl_game_option">END Game Type</label>
                        <div>
                            <label className={"radio-inline" + (this.state.endgame_type === false ? ' checked' : '')} onClick={() => { this.setState({endgame_type: false}); }}>Manual</label>
                            <label className={"radio-inline" + (this.state.endgame_type === true ? ' checked' : '')} onClick={() => { this.setState({endgame_type: true}); }}>Automatic</label>
                            <label className={"lbl_endgame_type" + (this.state.endgame_type === true ? "" : " hidden")}>
                                <span class="pound-symbol"><FaPoundSign /><input pattern="[0-9]*" type="text" id="endgame_amount" value={this.state.endgame_amount} onChange={this.onChangeEndgameAmount} className="col-md-6 form-control bet-input endgame_amount" /></span>
                            </label>
                        </div>
                        <div>Make your game END automatically when your PR reaches an amount. This will put a cap on your Winnings but at least keep them safe.</div>

                        <hr/>
                        <label style={{pointerEvents: "none", opacity: "0.6"}} className="lbl_game_option">(DISABLED) Anonymous Bet</label>
                        <div style={{pointerEvents: "none", opacity: "0.6"}}>
                            <label className={"radio-inline" + (this.state.is_anonymous === true ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: true}); }}>Yes</label>
                            <label className={"radio-inline" + (this.state.is_anonymous === false ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: false}); }}>No</label>
                        </div>
                        <div style={{pointerEvents: "none", opacity: "0.6"}}>Choose 'Yes' to place an anonymous bet. £0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your £0.10 back.</div>

                        <hr/>
                        <label style={{fontSize: 20, fontWeight: 700}}>You will have 60 seconds to score as high as possible. Wrong answers are penalised.</label>
                    </div>
                    <div className="text-center">
                        <button className="btn btn_secondary" id="btn_bet">START</button>
                    </div>
                </form>
            );
    }
}

const mapStateToProps = state => ({
    auth: state.auth.isAuthenticated,
    balance: state.auth.balance,
    brain_game_type: state.questionReducer.brain_game_type,
    game_type_list: state.questionReducer.game_type_list
});

const mapDispatchToProps = {
    setCurrentQuestionInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrainGame);
