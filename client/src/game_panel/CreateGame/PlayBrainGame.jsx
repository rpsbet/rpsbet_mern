import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createRoom } from "../../redux/Logic/logic.actions";
import { openAlert } from '../../redux/Notification/notification.actions';
import axios from '../../util/Api';

class PlayBrainGame extends Component {
    constructor(props) {
        super(props);
        this.state = {
            remaining_time: 60,
            score: 0,
            intervalId: null,
            question: { _id: '', question: '' },
            answers: ['','','',''],
            next_question: { _id: '', question: '' },
            next_answers: ['','','','']
        };
        this.onCountDown = this.onCountDown.bind(this);
        this.onClickAnswer = this.onClickAnswer.bind(this);
        this.getNextQuestion = this.getNextQuestion.bind(this);
    }

    async getNextQuestion() {
        try {
            const res = await axios.get('/game/question/' + this.props.brain_game_type);
            if (res.data.success) {
                if (this.state.question._id === '') {
                    this.setState({
                        question: res.data.question,
                        answers: res.data.answers
                    })
                    this.getNextQuestion();
                } else {
                    this.setState({
                        next_question: res.data.question,
                        next_answers: res.data.answers
                    })
                }
            }
        } catch (err) {
            console.log('err***', err);
        }
    }

    async componentDidMount() {
        await this.getNextQuestion();
        const intervalId = setInterval(this.onCountDown, 1000);
        this.setState({
            intervalId,
            remaining_time: 60
        });
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

            this.props.createRoom({
                game_type: 3,
                brain_game_type: this.props.brain_game_type,
                brain_game_score: this.state.score,
                bet_amount: this.props.bet_amount,
                is_private: this.props.is_private,
                is_anonymous: this.props.is_anonymous,
                room_password: this.props.room_password
            });
        }
    }

    async onClickAnswer(e) {
        try {
            const answer_id = e.target.getAttribute('_id');
            if (this.state.remaining_time === 'FIN' || !answer_id) {
                return;
            }
            const data = {
                question_id: this.state.question._id,
                answer_id: answer_id
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
                next_question: { _id: '', question: '' },
                next_answers: ['','','','']
            });

            this.getNextQuestion();
        } catch (err) {
            console.log('err***', err);
        }
    }

    render() {
        return (
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
                    <div className="row" style={{marginBottom: '15px', justifyContent: 'center'}}>
                        <div className="col-md-offset-2 col-md-8 clearfix question_panel">
                            {this.state.question.question}
                        </div>
                        {this.state.answers.map((answer, index) => (
                            <label key={index} className="answer col-md-8 radio-inline checked" onClick={this.onClickAnswer} _id={answer._id}>{answer.answer}</label>
                        ))}
                    </div>
                </>
            )
    }
}

const mapStateToProps = state => ({
});

const mapDispatchToProps = {
    createRoom,
    openAlert
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PlayBrainGame);
