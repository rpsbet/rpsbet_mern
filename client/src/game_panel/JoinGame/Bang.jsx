import React, { Component } from 'react';
import { connect } from 'react-redux';
import CountUp from 'react-countup';
import Share from '../../components/Share';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { Button, TextField } from '@material-ui/core';
import { YouTubeVideo } from '../../components/YoutubeVideo';
import BetAmountInput from '../../components/BetAmountInput';
import Moment from 'moment';
import loadingChart from '../LottieAnimations/loadingChart.json';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import ImageResultModal from '../modal/ImageResultModal';
import CustomCounter from '../../components/CustomCounter';
import ReactApexChart from 'react-apexcharts';
import PlayerModal from '../modal/PlayerModal';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
} from '../modal/betValidations';
import Lottie from 'react-lottie';
import { getBangGuesses } from '../../redux/Logic/logic.actions';

import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import bomb from '../LottieAnimations/bomb.json';
import explosion from '../LottieAnimations/explosion.json';
import animationData from '../LottieAnimations/spinningIcon';
import Avatar from '../../components/Avatar';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';


const styles = {
  focused: {
    borderColor: '#fa3fa0'
  }
};


class Bang extends Component {
  constructor(props) {
    super(props);

    this.runsRef = React.createRef();
    this.socket = this.props.socket;
    this.state = {
      betting: false,
      timer: null,
      timerValue: 2000,
      showImageModal: false,
      intervalId: null,
      requestId: null,
      nextBangInterval: null,
      countdown: null,
      executeBet: false,
      newRound: false,
      productName: '',
      image: '',
      count: 0,
      buttonClicked: false,
      cashoutAmount: 1,
      bang_guesses: [],
      advanced_status: '',
      waiting: false,
      bet_amount: 0.001,
      bankroll: this.props.bet_amount,
      bang_guesses1Received: false,
      autoCashout: '',
      crashed: true,
      betResult: null,
      balance: this.props.balance,
      isPasswordCorrect: this.props.isPasswordCorrect,
      listen: true,
      runs_panel_opened: false
    };
    this.panelRef = React.createRef();
    this.onChangeState = this.onChangeState.bind(this);
  }

  onChangeState(e) {
    this.setState({ bet_amount: e.target.value });
    this.setState({ potential_return: e.target.value * 2 });
  }
  updateCountUp() {
    this.setState({ bet_amount: e.target.value });
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

  componentDidUpdate(prevProps, prevState) {
    const {
      waiting,
      newRound,
      showBang,
      showCountdown,
      executeBet,
      cashoutAmount
    } = this.state;

    const { playSound, roomInfo, actionList, stopSound } = this.props;

    const { isWaiting, disabledButtons } = this.state;

    if (prevProps.actionList !== actionList) {
      this.setState({
        actionList: actionList
      });
    }

    if (!showBang && !showCountdown) {
      stopSound('countDown');
      // playSoundLoop('fuse');
    } else if (showBang || !showCountdown) {
      // stopSound('fuse');
      playSound('bang');
    } else if (showCountdown || !showBang) {
      stopSound('bang');
      // stopSound('fuse');
      playSound('countDown');
    }

    if (!showBang && !showCountdown && waiting && newRound && !executeBet) {
      this.setState(
        {
          newRound: false,
          executeBet: true,
          crashed: false,
          cashoutAmount: cashoutAmount
        },
        () => {
          this.onBtnBetClick();
        }
      );
    }

    if (
      prevState.isPasswordCorrect !== this.state.isPasswordCorrect &&
      this.state.isPasswordCorrect === true
    ) {
      this.joinGame();
    }
  }

  componentDidMount = () => {
    const { roomInfo, socket, getBangGuesses, playSound } = this.props;
    const { _id: roomId } = roomInfo;
    const fetchBangGuesses = () => {
      const roomId = this.props.roomInfo._id;
      // console.log("SSs  ")

      getBangGuesses({
        roomId: roomId
      });
    };
    fetchBangGuesses();


    if (socket) {
      socket.on('CARD_PRIZE', data => {
        if (data) {
          this.setState(
            {
              image: data.image,
              productName: data.productName,
              showImageModal: true
            },
            () => playSound('')
          );
        }
      });

      socket.on(`BANG_GUESSES_${roomId}`, data => {
        if (data && data.bangs && data.bangs.length > 0) {
          const lastBang = data.bangs[data.bangs.length - 1];

          this.setState({
            bang_guesses: data.bangs,
            nextBangInterval: lastBang.toFixed(2)
          }, () => {
            setTimeout(() => {
              // console.log("sss", this.state.nextBangInterval * 1000 + 7000)
              fetchBangGuesses();
            }, (this.state.nextBangInterval * 1000 + 7000));
          });

          // this.socket.on(`BANG_GUESSES1_${roomId}`, (data) => {
          //   if (data && data.bangs && data.bangs.length > 0 && this.state.listen) {
          //     updateBangGuesses(data);
          //   }
          // });

          socket.on('UPDATED_BANKROLL', (data) => {
            this.setState({ bankroll: data.bankroll });
          });
        }
      })
    }

  };

  componentWillUnmount = () => {
    clearInterval(this.fetchInterval, this.state.intervalId);
  };

  // predictNext = bangAmounts => {
  //   const uniqueValues = [...new Set(bangAmounts.map(bang => bang.bang))];

  //   if (uniqueValues.length === 1) {
  //     return uniqueValues[0];
  //   } else {
  //     const minValue = Math.min(...uniqueValues);
  //     const maxValue = Math.max(...uniqueValues);
  //     const rangeSize = Math.ceil((maxValue - minValue) / 200);

  //     const rangeCounts = {};
  //     bangAmounts.forEach(bang => {
  //       const range = Math.floor((bang.bang - minValue) / rangeSize);
  //       rangeCounts[range] = rangeCounts[range] ? rangeCounts[range] + 1 : 1;
  //     });

  //     const totalCounts = bangAmounts.length;
  //     const rangeProbabilities = {};
  //     Object.keys(rangeCounts).forEach(range => {
  //       const rangeProbability = rangeCounts[range] / totalCounts;
  //       rangeProbabilities[range] = rangeProbability;
  //     });

  //     let randomValue = Math.random();
  //     let chosenRange = null;
  //     Object.entries(rangeProbabilities).some(([range, probability]) => {
  //       randomValue -= probability;
  //       if (randomValue <= 0) {
  //         chosenRange = range;
  //         return true;
  //       }
  //       return false;
  //     });

  //     const rangeMinValue = parseInt(chosenRange) * rangeSize + minValue;
  //     const rangeMaxValue = Math.min(rangeMinValue + rangeSize, maxValue);

  //     const getRandomNumberInRange = (min, max) => {
  //       return Math.random() * (max - min) + min;
  //     };
  //     return parseFloat(getRandomNumberInRange(rangeMinValue, rangeMaxValue));
  //   }
  // };

  joinGame = async () => {
    const { playSound } = this.props;
    // console.log("bet_amount", this.state.bet_amount)
    // console.log("crashed", this.state.crashed)
    // console.log("autoCashout", this.state.autoCashout)
    // console.log("cashoutAmount", this.state.cashoutAmount)

    const result = await this.props.join({
      bet_amount: parseFloat(this.state.bet_amount),
      crashed: this.state.crashed,
      multiplier: this.state.autoCashout,
    });

    let text = 'HAHAA, YOU LOST!!!';

    if (result.betResult === 1) {
      playSound('win');
      text = 'WINNER, WINNER, VEGAN FUCKING DINNER!';
    } else if (result.betResult === 0) {
      text = 'SPLIT! EQUALLY SHIT!';
      playSound('split');
    } else {
      text = 'TROLLOLOLOL! LOSER!';
      playSound('lose');
    }

    let stored_bang_array =
      JSON.parse(localStorage.getItem('bang_array')) || [];

    while (stored_bang_array.length >= 20) {
      stored_bang_array.shift();
    }
    stored_bang_array.push({ bang: this.state.bet_amount });
    localStorage.setItem('bang_array', JSON.stringify(stored_bang_array));

    gameResultModal(
      this.props.isDarkMode,
      text,
      result.betResult,
      'Okay',
      null,
      () => {
        // history.push('/');
      },
      () => { }
    );

    if (result.status === 'success') {
      const currentUser = this.props.user;
      const currentRoom = this.props.room;

    } else {
      if (result.message) {
        alertModal(this.props.isDarkMode, result.message);
      }
    }

    this.props.refreshHistory();
  };

  onBtnBetClick = async () => {
    const { isAuthenticated, isDarkMode, creator_id, user_id } = this.props;
    const { buttonClicked, waiting, executeBet, cashoutAmount, showCountdown, newRound, showBang } = this.state;
    // console.log(showBang, showCountdown, waiting, newRound, executeBet)
    if (!validateBetAmount(cashoutAmount, balance, isDarkMode)) {
      return;
    }
    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }

    if (!buttonClicked) {
      if (!waiting) {
        this.setState({ waiting: true });
      } else if (!executeBet) {
        this.resetButtonState();
      } else {
        this.startAutoCashout();
      }
    } else {
      this.pushBet();
    }
  };

  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };


  pushBet = async () => {
    const {
      openGamePasswordModal,
      balance,
      isDarkMode,
      is_private,
      roomInfo
    } = this.props;

    cancelAnimationFrame(this.state.requestId);

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const passwordCorrect = rooms[roomInfo._id];

    if (is_private === true && passwordCorrect !== true) {
      if (localStorage.getItem('hideConfirmModal') === 'true') {
        openGamePasswordModal();
      } else {
        confirmModalCreate(
          isDarkMode,
          'ARE YOU SURE YOU WANT TO PLACE THIS BET?',
          'Yes',
          'Cancel',
          async () => {
            await this.joinGame();
            this.resetButtonState();
          }
        );
      }
    } else {
      await this.joinGame();
      this.resetButtonState();
    }
  };

  resetButtonState = () => {
    this.setState({
      buttonClicked: false,
      cashoutAmount: 1,
      newRound: false,
      waiting: false,
      executeBet: false,
      requestId: null
    });
  };

  startAutoCashout = () => {
    const { bet_amount, autoCashout } = this.state;
    let cashoutAmount = 1;
    const increment = 0.01;
    let previousTimestamp = null;
    const animate = timestamp => {
      if (!previousTimestamp) {
        previousTimestamp = timestamp;
      }
      const elapsed = timestamp - previousTimestamp;
      if (elapsed >= 8.3303) {
        cashoutAmount += increment * Math.floor(elapsed / 8.3303);
        this.setState({ cashoutAmount });
        previousTimestamp = timestamp;
      }
      if (cashoutAmount >= autoCashout && autoCashout !== '') {
        // console.log("autocashout")
        this.setState({ cashoutAmount: autoCashout, crashed: false }, () => {
          this.pushBet();
        });
        return;
      } else if (cashoutAmount >= this.state.nextBangInterval) {
        // console.log("crashed")

        this.setState({ crashed: true }, () => {
          this.pushBet();
        });
        return;
      }
      const requestId = window.requestAnimationFrame(animate);
      this.setState({ requestId });
    };
    const requestId = window.requestAnimationFrame(animate);
    this.setState({ buttonClicked: true, cashoutAmount, requestId });
  };
  handleHalfXButtonClick = () => {
    const multipliedBetAmount = this.state.bet_amount * 0.5;
    const roundedBetAmount = Math.floor(multipliedBetAmount * 100000) / 100000;
    this.setState(
      {
        bet_amount: roundedBetAmount
      },
      () => {
        document.getElementById('betamount').focus();
      }
    );
  };

  handle2xButtonClick = () => {
    const maxBetAmount = this.state.balance;
    const multipliedBetAmount = this.state.bet_amount * 2;
    const limitedBetAmount = Math.min(multipliedBetAmount, maxBetAmount);
    const roundedBetAmount = Math.floor(limitedBetAmount * 100000) / 100000;
    if (roundedBetAmount < -2330223) {
      alertModal(
        this.props.isDarkMode,
        "NOW, THAT'S GETTING A BIT CRAZY NOW ISN'T IT?"
      );
    } else {
      this.setState(
        {
          bet_amount: roundedBetAmount
        },
        () => {
          document.getElementById('betamount').focus();
        }
      );
    }
  };

  handleMaxButtonClick = () => {
    const maxBetAmount = this.state.balance;
    this.setState(
      {
        bet_amount: maxBetAmount
      },
      () => {
        document.getElementById('betamount').focus();
      }
    );
  };

  handleButtonClick = () => {
    const { isAuthenticated, creator_id, user_id, isDarkMode } = this.props;
    const { betting, timer } = this.state;

    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }
    if (!betting) {
      this.setState({
        timer: setInterval(() => {
          this.setState(state => {
            if (state.timerValue === 0) {
              clearInterval(this.state.timer);
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

  handleButtonRelease = () => {
    if (this.state.timer) {
      clearInterval(this.state.timer);
      this.setState({ timerValue: 2000 });
    }
  };
  // startBetting = () => {
  //   const { isDarkMode, playSound, is_private, roomInfo } = this.props;

  //   if (!validateLocalStorageLength('bang_array', isDarkMode)) {
  //     return;
  //   }
  //   const stored_bang_array =
  //     JSON.parse(localStorage.getItem('bang_array')) || [];

  //   const intervalId = setInterval(() => {
  //     const randomItem = this.predictNext(stored_bang_array);

  //     const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
  //     const passwordCorrect = rooms[roomInfo._id];
  //     if (is_private === true && passwordCorrect !== true) {
  //       openGamePasswordModal();
  //     } else {
  //       this.joinGame2(randomItem);
  //     }
  //   }, 3500);
  //   playSound('start');

  //   this.setState({ intervalId, betting: true });
  // };

  // stopBetting = () => {
  //   this.props.playSound('stop');
  //   clearInterval(this.state.intervalId, this.state.timer);
  //   this.setState({ intervalId: null, betting: false, timerValue: 2000 });
  // };

  // joinGame2 = async randomItem => {
  //   const {
  //     bang_bet_item_id,
  //     balance,
  //     isDarkMode,
  //     refreshHistory,
  //     playSound
  //   } = this.props;
  //   const {
  //     bet_amount,
  //     bankroll,
  //     slippage,
  //     is_anonymous,
  //     betting
  //   } = this.state;

  //   // Check if betting is true before continuing
  //   if (!betting) {
  //     return;
  //   }

  //   this.setState({ bet_amount: randomItem });

  //   if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
  //     return;
  //   }

  //   const result = await this.props.join({
  //     bet_amount: parseFloat(bet_amount),
  //     bang_bet_item_id: bang_bet_item_id,
  //   });

  //   const currentUser = this.props.user;
  //   const currentRoom = this.props.room;

  //   if (result.status === 'success') {

  //     let text = 'HAHAA, YOU LOST!!!';

  //     if (result.betResult === 1) {
  //       playSound('win');

  //       text = 'NOT BAD, WINNER!';
  //       // this.changeBgColor(result.betResult);
  //     } else if (result.betResult === 0) {
  //       playSound('split');

  //       text = 'DRAW, NO WINNER!';
  //       // this.changeBgColor(result.betResult);
  //     } else {
  //       // this.changeBgColor(result.betResult);
  //       playSound('lose');
  //     }
  //     refreshHistory();
  //   }
  // };

  render() {
    const {
      bang_guesses,
      nextBangInterval,
      showBang,
      elapsedTime,
      showCountdown,
      waiting,
      bankroll,
      runs_panel_opened,
      productName,
      image,
      showImageModal,
      countdown,
      actionList
    } = this.state;
    const {
      isLowGraphics,
      isMusicEnabled,
      creator_id,
      handleOpenPlayerModal,
      creator_avatar,
      rank,
      accessory,
      youtubeUrl,
      roomInfo,
      showPlayerModal,
      selectedCreator,
      isDarkMode,
      handleClosePlayerModal
    } = this.props;
    const payoutPercentage = (bankroll / roomInfo.endgame_amount) * 100;

    const barStyle = {
      width: `${payoutPercentage + 10}%`,
      backgroundColor: payoutPercentage <= 50 ? 'yellow' : 'red'
    };
    let content;
    if (showBang) {
      if (
        elapsedTime &&
        elapsedTime / 1000 > nextBangInterval &&
        elapsedTime / 1000 < nextBangInterval + 2
      ) {
        const bangDuration = 2 - (elapsedTime / 1000 - nextBangInterval);

        content = (
          <div>
            {' '}

            <Lottie
              options={{
                // loop: isLowGraphics ? false : true,
                // autoplay: isLowGraphics ? false : true,
                animationData: explosion
              }}
              style={{
                // filter: 'grayscale(100%)',
                maxWidth: '100%',
                width: '300px',
                marginBottom: '-50px'
              }}
            />
            <span id="bang-text">
              {' '}
              BANG
              <br /> @ x{nextBangInterval}!
            </span>
            <br />
            {setTimeout(
              () => this.setState({ elapsedTime: '' }),
              bangDuration * 1000
            )}
          </div>
        );
      } else {
        content = (
          <div>
            {' '}
            <Lottie
              options={{
                // loop: isLowGraphics ? false : true,
                // autoplay: isLowGraphics ? false : true,
                animationData: explosion
              }}
              style={{
                // filter: 'grayscale(100%)',
                maxWidth: '100%',
                width: '300px',
                marginBottom: '-50px'
              }}
            />
            <span id="bang-text">
              {' '}
              BANG
              <br /> @ x{nextBangInterval}!
            </span>
          </div>
        );
      }
    } else if (showCountdown) {
      // show countdown
      content = <span id="nextBangIn">Next Bang in...{countdown}</span>;

    } else {
      // show bang
      let countupStart;
      countupStart = elapsedTime ? elapsedTime / 1000 : 1;
      content = (
        <div>
          <Lottie
            id="bomb"
            options={{
              // loop: isLowGraphics ? false : true,
              // autoplay: isLowGraphics ? false : true,
              animationData: bomb
            }}
            style={{
              // filter: 'grayscale(100%)',
              maxWidth: '100%',
              width: '200px',
              // position: 'absolute',
              marginLeft: '60px',
              marginBottom: '30px',
              transform: 'translateY(20px)'
            }}
          />
          <p>
            <div id="x">x</div>
            <CustomCounter
              start={countupStart}
              end={nextBangInterval}
              decimals={2}
              duration={
                elapsedTime
                  ? nextBangInterval - elapsedTime / 1000
                  : nextBangInterval
              }
              onEnd={() => {
                // Show the bang message for 2 seconds, then start the countdown
                this.setState({
                  showBang: true,
                }, () => {

                  setTimeout(() => {
                    this.setState({
                      showBang: false,
                      showCountdown: true,
                      countdown: 5,
                    }, () => {
                      if (waiting) {
                        this.setState({ newRound: true });
                      }
                    });

                    // console.log('oooo');

                    const countdownTimer = setInterval(() => {
                      const { countdown } = this.state; // Correct variable name
                      const countdownValue = countdown - 1;

                      if (countdownValue <= 0) {
                        // console.log('eww');

                        // Countdown is finished, restart everything
                        clearInterval(countdownTimer);
                        this.setState({
                          showCountdown: false,
                          countdown: null,
                        });
                      } else {
                        // console.log('qw');

                        this.setState({ countdown: countdownValue, elapsedTime: '' });
                      }
                    }, 1000);
                  }, 2000);
                });
              }}

            />

          </p>
        </div>
      );
    }

    return (
      <div className="game-page">
        <div className="page-title">
          <h2>PLAY - Bang!</h2>
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
          // onScroll={this.handleScroll}
          >
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
                      <div className="label your-bet-amount">Bankroll</div>
                    </div>
                    <div className="value">{convertToCurrency(bankroll)}</div>
                  </div>

                  <div className="data-item">
                    <div>
                      <div className="label your-max-return">
                        Ave. Multiplier
                      </div>
                    </div>
                    <div className="value">
                      {convertToCurrency(this.props.aveMultiplier)
                      }
                      x
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
                        onClick={() => handleOpenPlayerModal(creator_id)}
                      >
                        <Avatar
                          className="avatar"
                          src={creator_avatar}
                          rank={rank}
                          accessory={accessory}
                          alt=""
                          darkMode={isDarkMode}
                        />
                      </a>
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label room-name">Room ID</div>
                    </div>
                    <div className="value">{roomInfo.room_name}</div>
                  </div>
                  {youtubeUrl && (
                    <div className="data-item">
                      <YouTubeVideo
                        url={youtubeUrl}
                        isMusicEnabled={isMusicEnabled}
                      />
                    </div>
                  )}
                  <div className="data-item">
                    <div>
                      <div className="label public-max-return">Created</div>
                    </div>
                    <div className="value">
                      {Moment(roomInfo.created_at).fromNow()}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div
            className="game-info-panel"
            style={{ position: 'relative', zIndex: 10, paddingBottom: "30px" }}
          >
            {renderLottieAvatarAnimation(
              this.props.gameBackground,
              isLowGraphics
            )}

            <div className="game-info-panel">
              <Button
                onClick={() =>
                  this.setState({
                    runs_panel_opened: !runs_panel_opened
                  })
                }
                style={{
                  background: '#f8f9fa54',
                  border: 'unset',
                  boxShadow: 'unset',
                  borderRadius: '7px',
                  marginTop: '30px',
                  marginRight: '0'
                }}
              >
                {' '}
                <span>Bang History</span>
              </Button>
              <div
                ref={this.runsRef}
                className={`runs-modal ${runs_panel_opened ? 'active' : ''}`}
              >
                <div className="slippage-select-panel">
                  <div>
                    {bang_guesses
                      .slice(-101, -1)
                      .reverse()
                      .map((bang, index) => (
                        <div
                          style={{
                            textAlign: 'center',
                            borderRadius: '5px',
                            marginBottom: '1px',
                            border: '2px solid',
                            backgroundColor:
                              bang < 2.0 ? '#e3e103c2' : '#e30303c2',
                            borderColor: bang < 2.0 ? '#e3e103c2' : '#e30303c2'
                          }}
                          key={index}
                        >
                          {bang.toFixed(2)}x
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="gradient-container">
                <p className="previous-guesses drop">
                  <div>
                    {bang_guesses.length > 0 ? (
                      bang_guesses.slice(0, -1).map((guess, index) => (
                        <span
                          key={index}
                          style={{
                            background: guess < 2 ? '#e3e103c2' : '#e30303c2',
                            border: '3px solid',
                            borderColor: guess < 2 ? '#e3e103' : '#e30303',
                            padding: '0.3em 0.2em',
                            textAlign: 'center'
                          }}
                        >
                          x{guess.toFixed(2)}
                        </span>
                      ))
                    ) : (
                      <span id="no-guesses"></span>
                    )}
                  </div>

                </p>
              </div>
            </div>

            <div className="bangTimer">
              {bang_guesses.length ? (
                content
              ) : (
                <span id="no-guesses">Connecting...</span>
              )}
            </div>

            <BetAmountInput
              betAmount={this.state.bet_amount}
              handle2xButtonClick={this.handle2xButtonClick}
              handleHalfXButtonClick={this.handleHalfXButtonClick}
              handleMaxButtonClick={this.handleMaxButtonClick}
              onChangeState={this.onChangeState}
              isDarkMode={this.props.isDarkMode}
            />
            <div className="your-multiplier">
              <TextField
                type="text"
                name="autoCashout"
                variant="filled"
                id="betamount"
                label="AUTO-CASHOUT"
                value={this.state.autoCashout}
                onChange={event =>
                  this.setState({ autoCashout: event.target.value })
                }
                inputProps={{
                  pattern: '[0-9]*',
                  maxLength: 9
                }}
                InputLabelProps={{
                  shrink: true
                }}
                InputProps={{
                  endAdornment: 'x'
                }}
              />
            </div>

            <Button
              className="place-bet"
              color="primary"
              onClick={() => this.onBtnBetClick()}
              variant="contained"

            >
              {this.state.buttonClicked ? (
                <>Cash Out @ {convertToCurrency(this.state.cashoutAmount)}</>
              ) : waiting ? (
                <span style={{ animation: 'blink 0.75s linear infinite' }}>
                  Joining Next Round
                </span>
              ) : (
                'BANG OUT'
              )}
            </Button>
          </div>

          <div className="action-panel">
            <Share roomInfo={roomInfo} />
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
  accessory: state.logic.curRoomInfo.accessory,
  creator: state.logic.curRoomInfo.creator_name,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  isLowGraphics: state.auth.isLowGraphics,
  rank: state.logic.curRoomInfo.rank,
  isMusicEnabled: state.auth.isMusicEnabled
});

const mapDispatchToProps = {
  openGamePasswordModal,
  getBangGuesses
  // updateBetResult: (betResult) => dispatch(updateBetResult(betResult))
};

export default connect(mapStateToProps, mapDispatchToProps)(Bang);
