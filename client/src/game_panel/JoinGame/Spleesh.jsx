import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import Share from '../../components/Share';
import waves from '../LottieAnimations/waves.json';
import safe from '../LottieAnimations/safe.json';
import ReactApexChart from 'react-apexcharts';
import { getSpleeshGuesses } from '../../redux/Logic/logic.actions';

import Moment from 'moment';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import loadingChart from '../LottieAnimations/loadingChart.json';
import ImageResultModal from '../modal/ImageResultModal';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import {
  Button,
} from '@material-ui/core';
import bear from '../LottieAnimations/bear.json';
import { YouTubeVideo } from '../../components/YoutubeVideo';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
  validateBankroll
} from '../modal/betValidations';
import Lottie from 'react-lottie';

import animationData from '../LottieAnimations/spinningIcon';
import { alertModal, gameResultModal } from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion'

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

class Spleesh extends Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;
    this.settingsRef = React.createRef();

    this.state = {
      betting: false,
      timer: null,
      timerValue: 2000,
      holdTime: 0,
      intervalId: null,
      items: [],
      bet_amount: this.props.spleesh_bet_unit,
      advanced_status: '',
      productName: '',
      showImageModal: false,
      spleesh_guesses: this.props.spleesh_guesses,
      bankroll: this.props.roomInfo.host_pr,
      balance: this.props.balance,
      isPasswordCorrect: false,
      settings_panel_opened: false
    };
    this.panelRef = React.createRef();
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.isPasswordCorrect !== props.isPasswordCorrect ||
      current_state.balance !== props.balance ||
      current_state.spleesh_guesses !== props.spleesh_guesses

    ) {
      return {
        ...current_state,
        balance: props.balance,
        spleesh_guesses: props.spleesh_guesses,
        isPasswordCorrect: props.isPasswordCorrect
      };
    }

    return null;
  }

  onShowButtonClicked = e => {
    e.preventDefault();
  };


  onShowButtonClicked = e => {
    e.preventDefault();
  };



  async componentDidMount() {
    const roomId = this.props.roomInfo._id;
    setTimeout(async () => {

      await this.props.getSpleeshGuesses({
        roomId: roomId
      });
    }, 1000);
    document.addEventListener('keydown', this.handleKeyPress);
    this.socket.on('CARD_PRIZE', data => {
      if (data) {
        this.setState(
          {
            image: data.image,
            productName: data.productName,
            showImageModal: true
          },
          () => this.props.playSound('')
        );
      }
    });

    this.socket.on('SPLEESH_GUESSES', data => {
      this.props.updateSpleeshGuesses(data);
    });


  }

  componentDidUpdate(prevProps, prevState) {
    const { actionList } = this.props;
    const { isPasswordCorrect, bet_amount, is_anonymous } = this.state;

    if (prevProps.actionList !== actionList) {
      this.setState({
        actionList: actionList
      });

    }

    if (
      prevState.isPasswordCorrect !== isPasswordCorrect &&
      isPasswordCorrect === true
    ) {
      this.props.join({
        bet_amount: bet_amount
      });
    }
  }

  componentWillUnmount = () => {
    clearInterval(this.state.intervalId);
    document.removeEventListener('keydown', this.handleKeyPress);
  };

  handleKeyPress(event) {
    if (!isFocused) {
      switch (event.key) {
        case '1':
          this.onBtnBetClick(0);
          break;
        case '2':
          this.onBtnBetClick(1);
          break;
        case '3':
          this.onBtnBetClick(2);
          break;
        case '4':
          this.onBtnBetClick(3);
          break;
        case '5':
          this.onBtnBetClick(4);
          break;
        default:
          break;
      }
    }
  }


  joinGame = async () => {
    const { bet_amount } = this.state;
    const {
      spleesh_bet_unit,
      playSound,
      refreshHistory,
      isDarkMode,
      join,
      changeBgColor
    } = this.props;

    const result = await join({
      bet_amount: bet_amount,
    });

    if (result.status === 'success') {
      let text = 'HAHAA, YOU LOST!!!';
      playSound('lose');
      changeBgColor(result.betResult);
      if (result.betResult === 1) {
        text = 'NOT BAD, WINNER!';
        changeBgColor(result.betResult);
        playSound('win');
      } else if (result.betResult === 0) {
        text = 'DRAW, NO WINNER!';
        playSound('split');
        changeBgColor(result.betResult);
      }

      let stored_spleesh_array =
        JSON.parse(localStorage.getItem('spleesh_array')) || [];
      let stored_spleesh_10_array =
        JSON.parse(localStorage.getItem('spleesh_10_array')) || [];
      let stored_spleesh_001_array =
        JSON.parse(localStorage.getItem('spleesh_001_array')) || [];

      while (stored_spleesh_array.length >= 30) {
        stored_spleesh_array.shift();
      }

      if (spleesh_bet_unit === 0.1) {
        while (stored_spleesh_10_array.length >= 30) {
          stored_spleesh_10_array.shift();
        }
        stored_spleesh_10_array.push({ spleesh: bet_amount });
        localStorage.setItem(
          'spleesh_10_array',
          JSON.stringify(stored_spleesh_10_array)
        );
      } else if (spleesh_bet_unit === 0.001) {
        stored_spleesh_001_array.push({ spleesh: bet_amount });
        localStorage.setItem(
          'spleesh_001_array',
          JSON.stringify(stored_spleesh_001_array)
        );
      } else {
        stored_spleesh_array.push({ spleesh: bet_amount });
        localStorage.setItem(
          'spleesh_array',
          JSON.stringify(stored_spleesh_array)
        );
      }

      if (result.roomStatus === 'finished') {
        gameResultModal(
          isDarkMode,
          text,
          result.amount,
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
          'Okay',
          null,
          () => {
            // history.push('/');
          },
          () => { }
        );
      }
    } else {
      if (result.message) {
        alertModal(isDarkMode, result.message);
      }
    }
    refreshHistory();
  };

  // joinGame2 = async (nextGuess, shouldStopBetting) => {
  //   const { playSound, refreshHistory, join } = this.props;

  //   if (shouldStopBetting) {
  //     this.stopBetting();
  //     return;
  //   }

  //   const result = await join({
  //     bet_amount: nextGuess,
  //   });

  //   if (result.status === 'success') {
  //     let text = 'HAHAA, YOU LOST!!!';
  //     playSound('lose');
  //     if (result.betResult === 1) {
  //       text = 'NOT BAD, WINNER!';
  //       playSound('win');
  //     } else if (result.betResult === 0) {
  //       text = 'DRAW, NO WINNER!';
  //       playSound('split');
  //     }
  //   }

  //   refreshHistory();
  // };

  onBtnBetClick = async bet_amount => {
    const {
      isAuthenticated,
      isDarkMode,
      creator_id,
      user_id,
      balance,
      is_private,
      roomInfo,
      openGamePasswordModal
    } = this.props;

    const { bankroll } = this.state;

    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }

    if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
      return;
    }

    // if (!validateBankroll(bet_amount, bankroll, isDarkMode)) {
    //   return;
    // }

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const passwordCorrect = rooms[roomInfo._id];

    const hideConfirmModal =
      localStorage.getItem('hideConfirmModal') === 'true';

    if (hideConfirmModal || is_private !== true || passwordCorrect === true) {
      await this.joinGame(bet_amount);
    } else {
      openGamePasswordModal();
    }
  };

  createNumberPanel = () => {
    const { spleesh_bet_unit, bgColorChanged, betResult } = this.props;
    const { spleesh_guesses, bet_amount } = this.state;

    let panel = [];

    for (let i = 0; i < 10; i++) {
      const betAmount = (i + 1) * spleesh_bet_unit;
      const isDisabled = spleesh_guesses.some(
        item => item.bet_amount === betAmount
      );

      const classes = ` ${betAmount === bet_amount ? 'active' : ''} 
        ${bgColorChanged && betResult === -1 && betAmount === bet_amount ? 'lose-bg' : ''}
        ${betResult === 0 && betAmount === bet_amount ? 'draw-bg' : ''}
        ${betResult === 1 && betAmount === bet_amount ? 'win-bg' : ''}
        ${isDisabled ? 'disabled' : ''}`;

      panel.push(
        <Button
          className={classes}
          onClick={() => {
            const endgameAmount = spleesh_bet_unit * (55 - i - 1);
            this.setState(
              {
                bet_amount: betAmount,
                endgame_amount: endgameAmount
              },
              () => {
                this.onBtnBetClick(betAmount);
                this.props.playSound('select');
              }
            );
          }}
          key={i}
          disabled={isDisabled}
        >
          {convertToCurrency(betAmount)} &nbsp;<span className="roll-tag">{i + 1}</span>
        </Button>
      );
    }

    const grid = [];
    for (let i = 0; i < 2; i++) {
      const row = [];
      for (let j = 0; j < 5; j++) {
        row.push(panel[i * 5 + j]);
      }
      grid.push(<div className="button-row" key={i}>{row}</div>);
    }

    return grid;
  };


  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };

  // startBetting = () => {
  //   this.props.playSound('start');
  //   const intervalId = setInterval(() => {
  //     let storageKey = 'spleesh_array';
  //     if (this.props.spleesh_bet_unit === 0.1) {
  //       storageKey = 'spleesh_10_array';
  //     } else if (this.props.spleesh_bet_unit === 0.001) {
  //       storageKey = 'spleesh_001_array';
  //     }

  //     if (storageKey.length < 3) {
  //       alertModal(this.props.isDarkMode, 'MORE TRAINING DATA NEEDED!');
  //       return;
  //     }

  //     const predictionResult = this.predictNext(
  //       JSON.parse(localStorage.getItem(storageKey)),
  //       this.state.spleesh_guesses
  //     );
  //     const nextGuess = predictionResult.prediction;
  //     const shouldStopBetting = predictionResult.shouldStopBetting;
  //     this.joinGame2(nextGuess, shouldStopBetting);
  //   }, 3500);

  //   this.setState({ intervalId, betting: true });
  // };


  render() {
    const {
      selectedCreator,
      showPlayerModal,
      roomInfo,
      spleesh_bet_unit,
      endgame_amount,
      isLowGraphics,
      gameBackground,
      bankroll,
      isDarkMode,
      isMusicEnabled,
      youtubeUrl,
      accessory,
      creator_avatar,
      creator_id,
      handleClosePlayerModal,
      handleOpenPlayerModal,
      rank,
    } = this.props;

    const {
      showAnimation,
      showImageModal,
      image,
      productName,
      actionList,
      spleesh_guesses
    } = this.state;

    const payoutPercentage = ((roomInfo.host_pr + roomInfo.pr) / roomInfo.endgame_amount) * 100;

    const barStyle = {
      width: `${payoutPercentage + 10}%`,
      backgroundColor: payoutPercentage <= 50 ? 'yellow' : 'red'
    };

    const guessedAmounts = spleesh_guesses.map(number => number.bet_amount);

    const remainingSum =
      endgame_amount - guessedAmounts.reduce((sum, amount) => sum + amount, 0);

    let minSum = 0;
    let minGuesses = 0;

    if (spleesh_bet_unit === 0.1) {
      for (let i = 1; i >= 0.1; i -= 0.1) {
        if (!guessedAmounts.includes(i)) {
          minSum += i;
          minGuesses++;
          if (minSum >= remainingSum) {
            break;
          }
        }
      }
    } else if (spleesh_bet_unit === 0.01) {
      for (let i = 0.1; i >= 0.01; i -= 0.01) {
        if (!guessedAmounts.includes(i)) {
          minSum += i;
          minGuesses++;
          if (minSum >= remainingSum) {
            break;
          }
        }
      }

    } else {
      for (let i = 0.01; i >= 0.001; i -= 0.001) {
        if (!guessedAmounts.includes(i)) {
          minSum += i;
          minGuesses++;
          if (minSum >= remainingSum) {
            break;
          }
        }
      }
    }

    let maxSum = 0;
    let maxGuesses = 0;

    if (spleesh_bet_unit === 0.1) {
      for (let i = 0.1; i <= 1; i += 0.1) {
        if (!guessedAmounts.includes(i)) {
          maxSum += i;
          maxGuesses++;
          if (maxSum >= remainingSum) {
            break;
          }
        }
      }
    } else if (spleesh_bet_unit === 0.01) {

      for (let i = 0.01; i <= 0.1; i += 0.01) {
        if (!guessedAmounts.includes(i)) {
          maxSum += i;
          maxGuesses++;
          if (maxSum >= remainingSum) {
            break;
          }
        }
      }
    } else {
      for (let i = 0.001; i <= 0.01; i += 0.001) {

        if (!guessedAmounts.includes(i)) {
          maxSum += i;
          maxGuesses++;
          if (maxSum >= remainingSum) {
            break;
          }
        }
      }
    }

    let remainingGuessesText = `${minGuesses} - ${maxGuesses} guesses`;
    if (minGuesses === maxGuesses) {
      remainingGuessesText =
        minGuesses === 1 ? `${minGuesses} guess` : `${minGuesses} guesses`;
    }
    const averageGuesses = (minGuesses + maxGuesses) / 2;
    const top = 2.05;
    const marginTopScaled = (top ** (averageGuesses)) - 130;

    return (
      <div className="game-page">

        <div className="page-title">
          <h2>
            PLAY - <i>Spleesh!</i>
          </h2>
        </div>
        {showImageModal && (
          <ImageResultModal
            modalIsOpen={showImageModal}
            closeModal={this.toggleImageModal}
            isDarkMode={isDarkMode}
            image={image}
            productName={productName}
          />
        )}
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}
        <div className="game-contents">
          <div
            className="pre-summary-panel"
            ref={this.panelRef}
          >
            <div className="pre-summary-panel__inner spleesh">
              {[...Array(1)].map((_, i) => (
                <React.Fragment key={i}>
                  <div className="data-item">
                    <div>
                      <div className="label room-id">STATUS</div>
                    </div>
                    <div className="value">{this.props.roomInfo.status}</div>
                  </div>

                  <div className="data-item">
                    <div>
                      <div className="label your-bet-amount">Bankroll</div>
                    </div>
                    <div className="value bankroll">
                      {convertToCurrency(bankroll)} + ??
                    </div>
                  </div>


                  <div className="data-item">
                    <div className="label your-max-return">Your Return</div>
                    <div className="value">
                      {convertToCurrency(
                        spleesh_guesses.reduce(
                          (a, b) => a + b.bet_amount,
                          0
                        ) +
                        this.state.bet_amount * 2 /* 0.9 */
                      )}
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label win-chance">Win Chance</div>
                    </div>
                    <div className="value">
                      {(
                        (averageGuesses /
                          (10 - spleesh_guesses.length)) *
                        100
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                  {this.props.roomInfo.endgame_amount > 0 && (
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
                          {convertToCurrency(
                            actionList.hostNetProfit?.slice(-1)[0]
                          )}
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
                            width: '32px'
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
                        onClick={() =>
                          handleOpenPlayerModal(
                            creator_id
                          )
                        }
                      >
                        <Avatar
                          className="avatar"
                          src={creator_avatar}
                          alt=""
                          rank={rank}
                          accessory={accessory}
                          darkMode={isDarkMode}
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
                  {youtubeUrl && (
                    <div className="data-item">
                      <YouTubeVideo url={youtubeUrl} isMusicEnabled={isMusicEnabled} />
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
            className="game-info-panel"
            style={{ position: 'relative', zIndex: 10 }}
          >
            {renderLottieAvatarAnimation(
              gameBackground,
              isLowGraphics
            )}

            <h3 className="game-sub-title">{remainingGuessesText} remaining<Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: safe
              }}
              style={{
                width: "30px", marginTop: "-5px"
              }}
            /></h3>

            <div className="waves">
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: waves
                }}
                style={{
                  zIndex: '-1',
                  left: '0',
                  position: 'absolute',
                  filter: 'invert(1)',
                  maxWidth: '100%',
                  top: `${marginTopScaled}px`
                }}
              />
            </div>
            <div
              className="mosquito"
              style={{
                zIndex: '-2',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: bear
                }}
                style={{
                  position: 'absolute',
                  width: "200px",
                  top: "0"
                }}
              />
            </div>


            <div id="select-buttons-panel">{this.createNumberPanel()}</div>


          </div>

          <div className="action-panel">
            <Share roomInfo={this.props.roomInfo} />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  isAuthenticated: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  isDarkMode: state.auth.isDarkMode,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  rank: state.logic.curRoomInfo.rank,
  isFocused: state.auth.isFocused,
  accessory: state.logic.curRoomInfo.accessory,
  // spleesh_guesses:  state.logic.spleesh_guesses
});

const mapDispatchToProps = {
  openGamePasswordModal,
  getSpleeshGuesses
};

export default connect(mapStateToProps, mapDispatchToProps)(Spleesh);
