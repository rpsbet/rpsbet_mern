import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentQuestionInfo } from '../../redux/Question/question.action';
import axios from '../../util/Api';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/spinningIcon';
import { Button } from '@material-ui/core';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
  validateLocalStorageLength,
  validateBankroll
} from '../modal/betValidations';
import { deductBalanceWhenStartBrainGame } from '../../redux/Logic/logic.actions';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';
import { FaClipboard } from 'react-icons/fa';
import { TwitterShareButton, TwitterIcon } from 'react-share';

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

const twitterLink = window.location.href;

class BrainGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      brain_game_type: this.props.brain_game_type,
      advanced_status: '',
      betting: false,
      bgColorChanged: false,
      timer: null,
      timerValue: 2000,
      clicked: true,
      is_anonymous: false,
      is_started: false,
      remaining_time: 60,
      score: 0,
      isOpen: true,
      intervalId: null,
      balance: this.props.balance,
      question: { _id: '', question: '' },
      answers: [],
      items: [],
      next_question: null,
      next_answers: [],
      isPasswordCorrect: this.props.isPasswordCorrect
    };
    this.panelRef = React.createRef();
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
        const intervalId = setInterval(this.onCountDown, 2000);
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
    clearInterval(this.state.intervalId);
    if (this.state.is_started && this.state.remaining_time > 0) {
      this.props.join({
        bet_amount: this.props.bet_amount,
        brain_game_score: -2000,
        is_anonymous: this.state.is_anonymous
      });
    }
  }

  changeBgColor = async result => {
    this.setState({ betResult: result, bgColorChanged: true });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 1 second
    this.setState({ bgColorChanged: false });
  };

  onStartGame = async e => {
    e.preventDefault();
    const {
      playSound,
      bet_amount,
      isAuthenticated,
      isDarkMode,
      creator_id,
      roomInfo,
      user_id,
      balance,
      roomStatus,
      is_private,
      openGamePasswordModal,
      deductBalanceWhenStartBrainGame
    } = this.props;

    playSound('select');

    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }

    if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
      return;
    }

    if (roomStatus === 'finished') {
      alertModal(isDarkMode, 'THIS STAKE HAS ENDED');
      return;
    }

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const passwordCorrect = rooms[roomInfo._id];

    confirmModalCreate(
      isDarkMode,
      'YOU SURE YOU GOT THIS?',
      'Hell Yeah!',
      'Cancel',
      async () => {
        if (is_private === true && passwordCorrect !== true) {
          openGamePasswordModal();
        } else {
          const response = await deductBalanceWhenStartBrainGame({
            bet_amount: bet_amount
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
    const {
      playSound,
      isDarkMode,
      bet_amount,
      refreshHistory,
      brain_game_type
    } = this.props;
    const { is_anonymous, score } = this.state;

    const remaining_time = this.state.remaining_time - 1;
    this.setState({ remaining_time });

    if (remaining_time === 0) {
      let stored_score_array =
        JSON.parse(localStorage.getItem(`score_array_${brain_game_type}`)) ||
        [];

      stored_score_array.push({ score: score, room_id: brain_game_type });

      localStorage.setItem(
        `score_array_${brain_game_type}`,
        JSON.stringify(stored_score_array)
      );

      clearInterval(this.state.intervalId);
      this.setState({
        intervalId: null,
        remaining_time: 'FIN'
      });

      const result = await this.props.join({
        bet_amount: bet_amount,
        brain_game_score: score,
        is_anonymous: is_anonymous
      });

      if (result.status === 'success') {
        let text = 'HAHAA, WHAT A LOSER!!';
        this.changeBgColor(result.betResult);
        playSound('lose');
        if (result.betResult === 1) {
          text = 'NOT BAD, WINNER!';
          this.changeBgColor(result.betResult);
          playSound('win');
        } else if (result.betResult === 0) {
          text = 'DRAW, NO WINNER!';
          this.changeBgColor(result.betResult);
          playSound('split');
        }

        if (result.roomStatus === 'finished') {
          gameResultModal(
            isDarkMode,
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
            isDarkMode,
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
          alertModal(isDarkMode, result.message);
        }
      }
      refreshHistory();
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

  handleButtonClick = () => {
    const {
      isAuthenticated,
      isDarkMode,
      creator_id,
      user_id,
      balance
    } = this.props;
    const { bet_amount, bankroll, betting, timerValue } = this.state;

    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }

    if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
      return;
    }

    if (!validateBankroll(bet_amount, bankroll, isDarkMode)) {
      return;
    }

    if (!betting) {
      this.setState({
        timer: setInterval(() => {
          this.setState(state => {
            if (state.timerValue === 0) {
              clearInterval(state.timer);
              this.startBetting();
              return { timerValue: 2000 };
            } else {
              return { timerValue: state.timerValue - 10 };
            }
          });
        }, 10)
      });
    } else {
      this.stopBetting();
    }
  };

  predictNext = score_array => {
    if (score_array.length < 5) {
      return Math.round(
        score_array.reduce((total, item) => total + item.score, 0) /
          score_array.length
      );
    }

    const oldScores = score_array.slice(0, 5).map(item => item.score);
    const newScores = score_array
      .slice(score_array.length - 5)
      .map(item => item.score);

    const oldAvg =
      oldScores.reduce((total, score) => total + score, 0) / oldScores.length;
    const newAvg =
      newScores.reduce((total, score) => total + score, 0) / newScores.length;

    if (newAvg > oldAvg) {
      let diff = newAvg - oldAvg;
      return Math.round(score_array[score_array.length - 1].score + diff);
    } else {
      return Math.round(
        score_array.reduce((total, item) => total + item.score, 0) /
          score_array.length
      );
    }
  };

  startBetting = () => {
    let stored_score_array;
    stored_score_array =
      JSON.parse(
        localStorage.getItem(`score_array_${this.props.brain_game_type}`)
      ) || [];

    if (stored_score_array.length < 1) {
      alertModal(this.props.isDarkMode, 'MORE TRAINING DATA NEEDED!');
      return;
    }

    const intervalId = setInterval(() => {
      const prediction = this.predictNext(stored_score_array);
      const randomPrediction = this.getRandomPrediction(
        prediction,
        stored_score_array
      );
      const randomizeAgain = this.randomize(randomPrediction);
      this.joinGame2(randomizeAgain, this.props.bet_amount);
    }, 3500);
    this.props.playSound('start');
    this.setState({ intervalId, betting: true, is_started: true });
  };

  randomize = prediction => {
    const randomOffset = Math.floor(Math.random() * 8) - 3;
    return prediction + randomOffset;
  };

  getRandomPrediction = (prediction, score_array) => {
    const random = Math.random();

    if (score_array && score_array.length > 0 && random < 0.4) {
      const randomIndex = Math.floor(Math.random() * score_array.length);
      return score_array[randomIndex].score;
    } else {
      const offset = Math.floor(Math.random() * 2) + 1; // either 1 or 2
      const sign = Math.random() < 0.5 ? -1 : 1; // either -1 or 1
      return prediction + offset * sign;
    }
  };

  handleButtonRelease = () => {
    if (this.state.timer) {
      clearInterval(this.state.timer);
      this.setState({ timerValue: 2000 });
    }
  };

  stopBetting = () => {
    this.props.playSound('stop');
    clearInterval(this.state.intervalId);
    this.setState({ intervalId: null, betting: false, timerValue: 2000 });
  };

  joinGame2 = async (score, bet_amount) => {
    const { betting, is_anonymous } = this.state;
    const { refreshHistory, playSound } = this.props;

    if (!betting) {
      return;
    }
    const result = await this.props.join({
      bet_amount: bet_amount,
      brain_game_score: score,
      is_anonymous: is_anonymous
    });
    this.props.deductBalanceWhenStartBrainGame({
      bet_amount: bet_amount
    });

    if (result.status === 'success') {
      let text = 'HAHAA, WHAT A LOSER!!';
      this.changeBgColor(result.betResult);
      playSound('lose');
      if (result.betResult === 1) {
        this.changeBgColor(result.betResult);
        playSound('win');
        text = 'NOT BAD, WINNER!';
      } else if (result.betResult === 0) {
        this.changeBgColor(result.betResult);
        playSound('split');
        text = 'DRAW, NO WINNER!';
      }
    }
    this.setState({ is_started: false });
    refreshHistory();
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
                  <Button
                    key={index}
                    className="answer other"
                    onClick={this.onClickAnswer}
                    _id={answer._id}
                  >
                    {answer.answer}
                  </Button>
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
            <div className="pre-summary-panel__inner">
              {[...Array(2)].map((_, i) => (
                <React.Fragment key={i}>
                  <div className="data-item">
                    <div>
                      <div className="label host-display-name">Host</div>
                    </div>
                    <div className="value">{this.props.creator}</div>
                  </div>

                  <div className="data-item">
                    <div>
                      <div className="label your-bet-amount">Bet Amount</div>
                    </div>
                    <div className="value">
                      {convertToCurrency(this.props.bet_amount)}
                    </div>
                  </div>
                  <div className="data-item">
                    <div className="label public-max-return">Pot</div>
                    <div className="value">
                      {convertToCurrency(
                        updateDigitToPoint2(
                          this.props.bet_amount * this.props.joined_count
                        )
                      )}
                    </div>
                  </div>
                  <div className="data-item">
                    <div className="label your-max-return">
                      Potential Return
                    </div>
                    <div className="value">
                      {convertToCurrency(
                        updateDigitToPoint2(
                          this.props.bet_amount *
                            (this.props.joined_count + 2) /* 0.9 */
                        )
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="game-info-panel">
            <h3 className="game-sub-title">Game Type:</h3>
            <p>{this.props.brain_game_type.game_type_name}</p>
            <h3 className="game-sub-title">Score to BEAT:</h3>
            <p>{this.props.brain_game_score}</p>
            <Button
              id="aiplay"
              onMouseDown={this.handleButtonClick}
              onMouseUp={this.handleButtonRelease}
              onTouchStart={this.handleButtonClick}
              onTouchEnd={this.handleButtonRelease}
            >
              {this.state.betting ? (
                <div id="stop">
                  <span>Stop</span>
                  <Lottie options={defaultOptions} width={22} />
                </div>
              ) : (
                <div>
                  {this.state.timerValue !== 2000 ? (
                    <span>{(this.state.timerValue / 2000).toFixed(2)}s</span>
                  ) : (
                    <span>AI Play</span>
                  )}
                </div>
              )}
            </Button>
          </div>

          <div className="action-panel">
            <span></span>
            <Button id="btn_bet" onClick={this.onStartGame}>
              Start
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  balance: state.auth.balance,
  isDarkMode: state.auth.isDarkMode,
  roomStatus: state.logic.roomStatus,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name
});

const mapDispatchToProps = {
  setCurrentQuestionInfo,
  openGamePasswordModal,
  deductBalanceWhenStartBrainGame
};

export default connect(mapStateToProps, mapDispatchToProps)(BrainGame);
