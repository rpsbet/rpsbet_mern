import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentQuestionInfo } from '../../redux/Question/question.action';
import axios from '../../util/Api';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import { deductBalanceWhenStartBrainGame } from '../../redux/Logic/logic.actions';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';

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
      next_answers: [],
      isPasswordCorrect: this.props.isPasswordCorrect
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.balance !== props.balance ||
      current_state.isPasswordCorrect !== props.isPasswordCorrect
    ) {
      return {
        ...current_state,
        isPasswordCorrect: props.isPasswordCorrect,
        balance: props.balance
      };
    }
    return null;
  }

  getNextQuestion = async () => {
    try {
      const res = await axios.get(
        '/game/question/' + this.state.brain_game_type._id
      );
      if (res.data.success) {
        this.setState({
          next_question: res.data.question,
          next_answers: res.data.answers
        });
      }
    } catch (err) {
      console.log('err***', err);
    }
  };

  componentDidMount() {
    this.getNextQuestion();
  }

  onShowButtonClicked = e => {
    e.preventDefault();
    // if (this.state.advanced_status === "") {
    //     this.setState({advanced_status: "hidden"});
    // } else {
    //     this.setState({advanced_status: ""});
    // }
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.isPasswordCorrect !== this.state.isPasswordCorrect &&
      this.state.isPasswordCorrect === true
    ) {
      if (
        this.props.deductBalanceWhenStartBrainGame({
          bet_amount: this.props.bet_amount
        })
      ) {
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
  }

  componentWillUnmount() {
    if (this.state.is_started && this.state.remaining_time > 0) {
      this.props.join({
        bet_amount: this.props.bet_amount,
        brain_game_score: -1000,
        is_anonymous: this.state.is_anonymous
      });
    }
  }

  onStartGame = async e => {
    e.preventDefault();

    if (this.props.creator_id === this.props.user_id) {
      alertModal(
        this.props.isDarkMode,
        `THIS IS YOUR OWN STAKE?!?`
      );
      return;
    }

    if (this.props.bet_amount > this.state.balance) {
      alertModal(this.props.isDarkMode, `MAKE A DEPOSIT, BROKIE!`);
      return;
    }

    confirmModalCreate(
      this.props.isDarkMode,
      'Are you sure you want to place this bet?',
      'Yes',
      'Cancel',
      async () => {
        if (this.props.is_private === true) {
          this.props.openGamePasswordModal();
        } else {
          const response = await this.props.deductBalanceWhenStartBrainGame({
            bet_amount: this.props.bet_amount
          });
          if (response) {
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
      }
    );
  };

  onCountDown = async () => {
    const remaining_time = this.state.remaining_time - 1;
    this.setState({ remaining_time });

    if (remaining_time === 0) {
      clearInterval(this.state.intervalId);
      this.setState({
        intervalId: null,
        remaining_time: 'FIN'
      });

      const result = await this.props.join({
        bet_amount: this.props.bet_amount,
        brain_game_score: this.state.score,
        is_anonymous: this.state.is_anonymous
      });

      if (result.status === 'success') {
        let text = 'HAHAA, WHAT A LOSER!!';

        if (result.betResult === 1) {
          text = 'NOT BAD, WINNER!';
        } else if (result.betResult === 0) {
          text = 'DRAW, NO WINNER!';
        }

        if (result.roomStatus === 'finished') {
          gameResultModal(
            this.props.isDarkMode,
            text,
            result.betResult,
            'Okay',
            null,
            () => {
              history.push('/');
            },
            () => {}
          );
        } else {
          gameResultModal(
            this.props.isDarkMode,
            text,
            result.betResult,
            'Try again',
            'Close',
            () => {
              history.go(0);
            },
            () => {
              history.push('/');
            }
          );
        }
      } else {
        if (result.message) {
          alertModal(this.props.isDarkMode, result.message);
        }
      }
    }
  };

  onClickAnswer = async e => {
    try {
      const data = {
        question_id: this.state.question._id,
        answer_id: e.target.getAttribute('_id')
      };

      const res = await axios.post('/game/answer/', data);
      if (res.data.success) {
        this.setState({
          score: this.state.score + res.data.answer_result
        });
      }

      this.setState({
        question: this.state.next_question,
        answers: this.state.next_answers
      });
    } catch (err) {
      console.log('err***', err);
    }
    this.getNextQuestion();
  };

  render() {
    const { is_started } = this.state;

    return is_started === true ? (
      <div className="game-page">
        <div className="game-contents">
          <div className="game-info-panel brain-game-play-panel">
            <div className="play-panel-header">
              <div className="timer">
                <div className="timer-title">Timer: </div>
                <div className="countdown">{this.state.remaining_time}</div>
                <div className="timer-footer">seconds left</div>
                <div className="timer-footer2">S</div>
              </div>
              <div className="brain-score">
                Score: <span>{this.state.score}</span>
              </div>
            </div>
            <div className="quiz-panel">
              <div className="question">{this.state.question.question}</div>
              <div className="answer-panel">
                {this.state.answers.map((answer, index) => (
                  <button
                    key={index}
                    className="answer other"
                    onClick={this.onClickAnswer}
                    _id={answer._id}
                  >
                    {answer.answer}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="game-page">
        <div className="page-title">
          <h2>Play - Brain Game</h2>
        </div>
        <div className="game-contents">
          <div className="pre-summary-panel">
          <div className="host-display-name">
              Host: {this.props.creator}
            </div>
            <div className="your-bet-amount">
              Bet Amount:{' '}
              {convertToCurrency(updateDigitToPoint2(this.props.bet_amount))}
            </div>
            <div className="public-max-return">
              Pot:{' '}
              {convertToCurrency(
                updateDigitToPoint2(
                  this.props.bet_amount * this.props.joined_count
                )
              )}
            </div>
            <div className="your-max-return">
              Potential Return:{' '}
              {convertToCurrency(
                updateDigitToPoint2(
                  this.props.bet_amount *
                    (this.props.joined_count + 2) /* 0.9 */
                )
              )}
            </div>
          </div>
          <div className="game-info-panel">
            <h3 className="game-sub-title">Game Type:</h3>
            <p>{this.props.brain_game_type.game_type_name}</p>
            <h3 className="game-sub-title">Score to BEAT:</h3>
            <p>{this.props.brain_game_score}</p>
          </div>
          <hr />
          <div className="action-panel">
            <span></span>
            <button id="btn_bet" onClick={this.onStartGame}>
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  balance: state.auth.balance,
  isDarkMode: state.auth.isDarkMode,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name
});

const mapDispatchToProps = {
  setCurrentQuestionInfo,
  openGamePasswordModal,
  deductBalanceWhenStartBrainGame
};

export default connect(mapStateToProps, mapDispatchToProps)(BrainGame);
