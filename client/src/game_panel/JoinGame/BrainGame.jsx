import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentQuestionInfo } from '../../redux/Question/question.action';
import axios from '../../util/Api';
import { YouTubeVideo } from '../../components/YoutubeVideo';
import Moment from 'moment';
import Avatar from '../../components/Avatar';
import ReactApexChart from 'react-apexcharts';
import loadingChart from '../LottieAnimations/loadingChart.json';

import PlayerModal from '../modal/PlayerModal';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import Lottie from 'react-lottie';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import animationData from '../LottieAnimations/spinningIcon';
import brain from '../LottieAnimations/brain.json';
import { Button } from '@material-ui/core';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBankroll
} from '../modal/betValidations';
import { deductBalanceWhenStartBrainGame } from '../../redux/Logic/logic.actions';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import Share from '../../components/Share';

import { convertToCurrency } from '../../util/conversion';

class BrainGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      brain_game_type: this.props.brain_game_type,
      advanced_status: '',
      bgColorChanged: false,
      timer: null,
      timerValue: 2000,
      is_started: false,
      remaining_time: 60,
      score: 0,
      isOpen: true,
      intervalId: null,
      balance: this.props.balance,
      question: { _id: '', question: '' },
      answers: [],
      items: [],
      bankroll: this.props.roomInfo.user_bet,
      showImageModal: false,
      productName: '',
      next_question: null,
      next_answers: [],
      isPasswordCorrect: this.props.isPasswordCorrect,
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
      });
    }
    document.removeEventListener('mousedown', this.handleClickOutside);
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

    if (roomStatus === 'finished') {
      alertModal(isDarkMode, 'THIS STAKE HAS ENDED');
      return;
    }

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const passwordCorrect = rooms[roomInfo._id];

    if (localStorage.getItem('hideConfirmModal') === 'true') {
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
    } else {
      confirmModalCreate(
        isDarkMode,
        'ARE YOU SURE YOU WANT TO PLACE THIS BET?',
        'Yes',
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
    }
    // }
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

    if (remaining_time === 10) {
      playSound('countDown');
    }

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
            () => { }
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
        const answerResult = res.data.answer_result;
        if (answerResult === 1) {
          this.props.playSound('correct');
        } else if (answerResult === -1) {
          this.props.playSound('wrong');
        }
        this.setState(
          {
            score: this.state.score + answerResult,
            question: this.state.next_question,
            answers: this.state.next_answers
          },
          () => {
            this.getNextQuestion();
          }
        );
      }
    } catch (err) {
      console.log('err***', err);
    }
  };


  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };


  handleButtonRelease = () => {
    if (this.state.timer) {
      clearInterval(this.state.timer);
      this.setState({ timerValue: 2000 });
    }
  };


  render() {
    const {
      is_started,
      clicked,
      showAnimation,
      remaining_time,
      bankroll,
      answers,
      score,
      showImageModal
    } = this.state;
    const {
      brain_game_type,
      creator_id,
      selectedCreator,
      showPlayerModal,
      handleOpenPlayerModal,
      handleClosePlayerModal,
      roomInfo,
      bet_amount,
      actionList,
      isLowGraphics,
      isMusicEnabled,
    } = this.props;
    const payoutPercentage = (bankroll / roomInfo.endgame_amount) * 100;

    const barStyle = {
      width: `${payoutPercentage + 10}%`,
      backgroundColor: payoutPercentage <= 50 ? 'yellow' : 'red'
    };
    const styles = ['copy-btn'];
    let text = 'COPY CONTRACT';

    if (clicked) {
      styles.push('clicked');
      text = 'COPIED!';
    }

    let arrayName = `score_array_${brain_game_type}`;
    return is_started === true ? (
      <div className="game-page">
        {showImageModal && (
          <ImageResultModal
            modalIsOpen={showImageModal}
            closeModal={this.toggleImageModal}
            isDarkMode={isDarkMode}
            image={image}
            productName={productName}
          />
        )}

        <div className="game-contents">
          <div className="game-info-panel brain-game-play-panel">
            {renderLottieAvatarAnimation(this.props.gameBackground, isLowGraphics)}

            <div className="play-panel-header">
              <div className="timer">
                <div className="timer-title">Timer: </div>
                <div className="countdown">{remaining_time}</div>
                <div className="timer-footer">seconds left</div>
                <div className="timer-footer2">S</div>
              </div>

              <div className="brain-score">
                Score: <span>{score}</span>
              </div>
            </div>
            <div className="quiz-panel">
              <div className="question-image"><img width="150px" src={this.state.question.image} /></div>
              <div className="question">{this.state.question.question}</div>
              <div className="answer-panel">
                {answers.map((answer, index) => (
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
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}
        <div className="page-title">
          <h2>Play - Brain Game</h2>
        </div>
        <div className="game-contents">
          <div className="pre-summary-panel">
            <div className="pre-summary-panel__inner">
              {[...Array(1)].map((_, i) => (
                <React.Fragment key={i}>
                  <div className="data-item">
                    <div>
                      <div className="label room-id">STATUS</div>
                    </div>
                    <div className="value">{roomInfo.status}</div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label public-bet-amount">Bet Amount</div>
                    </div>
                    <div className="value">{convertToCurrency(bet_amount)}</div>
                  </div>
                  <div className="data-item">
                    <div className="label your-bet-amount">Bankroll</div>
                    <div className="value">
                      {convertToCurrency(
                        // updateDigitToPoint2(
                        roomInfo.host_pr
                        // )
                      )}
                    </div>
                  </div>
                  <div className="data-item">
                    <div className="label your-max-return">Your Return</div>
                    <div className="value">
                      {convertToCurrency(bet_amount * 2)}
                    </div>
                  </div>

                  {roomInfo.endgame_amount > 0 && (
                    <div className="data-item">
                      <div>
                        <div className="label created">Auto-Payout</div>
                      </div>
                      <div className="payout-bar">
                        <div className="value" style={barStyle}></div>
                      </div>
                    </div>
                  )}
                  <div className="data-item">
                    <div>
                      <div className="label net-profit">Host Profit</div>
                    </div>
                    <div className="value bankroll">
                      {actionList && actionList.hostBetsValue.length > 0 ? (
                        <>
                          {actionList.hostNetProfit?.slice(-1)[0] != null
                            ? convertToCurrency(
                              actionList.hostNetProfit?.slice(-1)[0]
                            )
                            : convertToCurrency(0)}
                          <ReactApexChart
                            className="bankroll-graph"
                            options={{
                              chart: {
                                animations: {
                                  enabled: false
                                },
                                toolbar: {
                                  show: false
                                },
                                events: {},
                                zoom: {
                                  enabled: false
                                }
                              },
                              grid: {
                                show: false
                              },
                              tooltip: {
                                enabled: false
                              },
                              fill: {
                                type: 'gradient',
                                gradient: {
                                  shade: 'light',
                                  gradientToColors:
                                    actionList.hostNetProfit?.slice(-1)[0] > 0
                                      ? ['#00FF00']
                                      : actionList.hostNetProfit?.slice(-1)[0] <
                                        0
                                        ? ['#FF0000']
                                        : ['#808080'],
                                  shadeIntensity: 1,
                                  type: 'vertical',
                                  opacityFrom: 0.7,
                                  opacityTo: 0.9,
                                  stops: [0, 100, 100]
                                }
                              },

                              stroke: {
                                curve: 'smooth'
                              },
                              xaxis: {
                                labels: {
                                  show: false
                                },
                                axisTicks: {
                                  show: false
                                },
                                axisBorder: {
                                  show: false
                                }
                              },
                              yaxis: {
                                labels: {
                                  show: false
                                },
                                axisTicks: {
                                  show: false
                                },
                                axisBorder: {
                                  show: false
                                }
                              }
                            }}
                            type="line"
                            width={120}
                            height="100"
                            series={[
                              {
                                data: actionList.hostNetProfit.map(
                                  (value, index) => [
                                    actionList.hostBetsValue[index],
                                    value
                                  ]
                                )
                              }
                            ]}
                          />
                        </>
                      ) : (
                        <Lottie
                          options={{
                            loop: true,
                            autoplay: true,
                            animationData: loadingChart
                          }}
                          style={{
                            width: '32px',
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label host-display-name">Host</div>
                    </div>
                    <div className="value host">
                      <a
                        className="player"
                        onClick={() => handleOpenPlayerModal(creator_id)}
                      >
                        <Avatar
                          className="avatar"
                          src={this.props.creator_avatar}
                          rank={this.props.rank}
                          accessory={this.props.accessory}
                          alt=""
                          darkMode={this.props.isDarkMode}
                        />
                      </a>
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label room-name">Room ID</div>
                    </div>
                    <div className="value">{this.props.roomInfo.room_name}</div>
                  </div>
                  {this.props.youtubeUrl && (
                    <div className="data-item">
                      <YouTubeVideo url={this.props.youtubeUrl} isMusicEnabled={isMusicEnabled} />
                    </div>
                  )}
                  <div className="data-item">
                    <div>
                      <div className="label public-max-return">Created</div>
                    </div>
                    <div className="value">
                      {Moment(this.props.roomInfo.created_at).fromNow()}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div
            style={{
              zIndex: '1',
              position: 'relative'
            }}
            className="game-info-panel brain-game"
          >
            <div
              style={{
                zIndex: '-1',
                position: 'relative'
                // transform: 'translate: (50%, 50%)'
              }}
            >
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: brain
                }}
                style={{
                  maxWidth: '100%',
                  width: '500px',
                  margin: '-30px auto -300px',
                  opacity: 0.9
                }}
              />
            </div>

            <h3 className="game-sub-title">Game Type:</h3>
            <p className="game-type">
              {this.props.brain_game_type.game_type_name}
            </p>
            <h3 className="game-sub-title">Score to Beat:</h3>
            <p
              style={{
                backgroundColor: 'grey',
                borderRadius: '7px',
                padding: '10px'
              }}
            >
              {this.props.brain_game_score}
            </p>

            <Button id="btn_bet" onClick={this.onStartGame}>
              Start
            </Button>


          </div>

          <div className="action-panel">
            <div className="action-panel">
              <Share roomInfo={roomInfo} />
            </div>
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
  creator: state.logic.curRoomInfo.creator_name,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  accessory: state.logic.curRoomInfo.accessory,
  rank: state.logic.curRoomInfo.rank,
  isLowGraphics: state.auth.isLowGraphics,
  isMusicEnabled: state.auth.isMusicEnabled
});

const mapDispatchToProps = {
  setCurrentQuestionInfo,
  openGamePasswordModal,
  deductBalanceWhenStartBrainGame
};

export default connect(mapStateToProps, mapDispatchToProps)(BrainGame);
