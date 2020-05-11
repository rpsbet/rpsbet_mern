import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentQuestionInfo } from '../../redux/Question/question.action';
import axios from '../../util/Api';

class BrainGame extends Component {
    constructor(props) {
        super(props);
        this.state = {
            brain_game_type: this.props.brain_game_type,
            advanced_status: '',
            is_anonymous: false,
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
        this.onStartGame = this.onStartGame.bind(this);
        this.onClickAnswer = this.onClickAnswer.bind(this);
        this.getNextQuestion = this.getNextQuestion.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.balance !== props.balance) {
            return {
                ...current_state,
                balance: props.balance,
            };
        }
        return null;
    }

    async getNextQuestion() {
        try {
            const res = await axios.get('/game/question/' + this.state.brain_game_type._id);
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
        this.getNextQuestion();
    }

    onShowButtonClicked(e) {
        e.preventDefault();
        if (this.state.advanced_status === "") {
            this.setState({advanced_status: "hidden"});
        } else {
            this.setState({advanced_status: ""});
        }
    }

    onStartGame(e) {
        e.preventDefault();
        if (this.state.bet_amount === 0) {
            alert("Please input the bet amount!");
            return;
        }

        if (this.state.bet_amount > this.state.balance / 100.0) {
            alert("Not enough balance!");
            return;
        }

        if (window.confirm('Do you want to bet on this game now?')) {
            const intervalId = setInterval(this.onCountDown, 1000);
            this.setState({
                is_started: true,
                intervalId,
                question: this.state.next_question,
                answers: this.state.next_answers,
                remaining_time: 60
            });

            this.getNextQuestion();
        }
    }

    onCountDown() {
        const remaining_time = this.state.remaining_time - 1;
        this.setState({ remaining_time });

        if (remaining_time === 0) {
            clearInterval(this.state.intervalId);
            this.setState({
                intervalId: null,
                remaining_time: 'FIN'
            });

            this.props.join({
                bet_amount: this.state.bet_amount,
                brain_game_score: this.state.score,
                is_anonymous: this.state.is_anonymous
            });
        }
    }

    async onClickAnswer(e) {
        try {
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
        this.getNextQuestion();
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
                <form onSubmit={this.onStartGame}>
                    <h1 className="main_title" style={{textTransform: 'initial'}}>Click START to begin BRAIN GAME: 60 secs</h1>
                    <hr/>
                    <label className="lbl_game_option">Bet Amount:</label>
                    <div style={{fontSize: 36, paddingLeft: 10}}>£{this.props.bet_amount}</div>
                    <hr/>
                    <label className="lbl_game_option">Game Type:</label>
                    <div style={{fontSize: 36, paddingLeft: 10}}>{this.props.brain_game_type.game_type_name}</div>
                    <hr/>
                    <label className="lbl_game_option">Score to BEAT:</label>
                    <div style={{color: '#C83228', fontSize: 36, paddingLeft: 10}}>{this.props.brain_game_score}</div>
                    <button className="btn-advanced" onClick={this.onShowButtonClicked}>Show/Hide Advanced Settings</button>
                    <div id="advanced_panel" className={this.state.advanced_status}>
                        <hr/>
                        <label className="lbl_game_option">Anonymous Bet:</label>
                        <div>
                            <label className={"radio-inline" + (this.state.is_anonymous === true ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: true}); }}>Yes</label>
                            <label className={"radio-inline" + (this.state.is_anonymous === false ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: false}); }}>No</label>
                        </div>
                        <div>Choose 'Yes' to place an anonymous bet. £0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your £0.10 back.</div>
                    </div>
                    <div className="text-center">
                        <button className="btn btn_secondary" id="btn_bet">Start</button>
                    </div>
                </form>
            );
    }
}

const mapStateToProps = state => ({
    auth: state.auth.isAuthenticated,
    balance: state.auth.balance,
});

const mapDispatchToProps = {
    setCurrentQuestionInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrainGame);