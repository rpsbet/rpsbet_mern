import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createRoom } from "../../redux/Logic/logic.actions";
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
	}

	getNextQuestion = async () => {
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

	onCountDown = () => {
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
				endgame_amount: this.props.endgame_amount,
				is_anonymous: this.props.is_anonymous,
				room_password: this.props.room_password
			});
		}
	}

	onClickAnswer = async (e) => {
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
			<div className="game-info-panel brain-game-play-panel">
				<div className="play-panel-header">
					<div className="timer">
						<div className="timer-title">Timer :</div>
						<div className="countdown">{this.state.remaining_time}</div>
						<div className="timer-footer">seconds left</div>
						<div className="timer-footer2">S</div>
					</div>
					<div className="brain-score">
						Score: <span>{this.state.score}</span>
					</div>
				</div>
				<div className="quiz-panel">
					<div className="question">
						{this.state.question.question}
					</div>
					<div className="answer-panel">
						{this.state.answers.map((answer, index) => (
							<button key={index} className="answer other" onClick={this.onClickAnswer} _id={answer._id}>{answer.answer}</button>
						))}
					</div>
				</div>
			</div>
		)
	}
}

const mapStateToProps = state => ({
});

const mapDispatchToProps = {
	createRoom,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PlayBrainGame);
