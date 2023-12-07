import React, { Component } from 'react';
import { connect } from 'react-redux';
import BetArray from '../../components/BetArray';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import ReactApexChart from 'react-apexcharts';
import { YouTubeVideo } from '../../components/YoutubeVideo';
import Moment from 'moment';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import Lottie from 'react-lottie';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';

import { Button, Switch, FormControlLabel } from '@material-ui/core';
import InlineSVG from 'react-inlinesvg';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
  validateLocalStorageLength
} from '../modal/betValidations';

import animationData from '../LottieAnimations/spinningIcon';
import drop from '../LottieAnimations/drop.json';
import BetAmountInput from '../../components/BetAmountInput';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import Share from '../../components/Share';
import loadingChart from '../LottieAnimations/loadingChart.json';

import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import { convertToCurrency } from '../../util/conversion';

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

const styles = {
  focused: {
    borderColor: '#fa3fa0'
  }
};

const calcWinChance = prevStates => {
  let total = prevStates.length;
  let counts = {};
  prevStates.forEach(state => {
    if (counts[state.drop_amount]) {
      counts[state.drop_amount]++;
    } else {
      counts[state.drop_amount] = 1;
    }
  });
  let lowest = Infinity;
  let highest = -Infinity;
  Object.keys(counts).forEach(key => {
    const chance = (counts[key] / total) * 100;
    if (chance < lowest) {
      lowest = chance;
    }
    if (chance > highest) {
      highest = chance;
    }
  });
  if (lowest === highest) {
    return lowest.toFixed(2) + '%';
  }
  return lowest.toFixed(2) + '% - ' + highest.toFixed(2) + '%';
};

class DropGame extends Component {
  constructor(props) {
    super(props);

    this.settingsRef = React.createRef();
    this.socket = this.props.socket;
    this.state = {
      betting: false,
      timer: null,
      timerValue: 2000,
      intervalId: null,
      showAnimation: false,
      bgColorChanged: false,
      drop_guesses: [],
      advanced_status: '',
      is_anonymous: false,
      bet_amount: 0.01,
      bankroll: parseFloat(this.props.bet_amount) - this.getPreviousBets(),
      drop_guesses1Received: false,
      betResult: null,
      balance: this.props.balance,
      isPasswordCorrect: this.props.isPasswordCorrect,
      slippage: 100,
      betResults: props.betResults,
      settings_panel_opened: false
    };
    this.panelRef = React.createRef();

    this.onChangeState = this.onChangeState.bind(this);
  }

  onChangeState(e) {
    this.setState({ bet_amount: e.target.value });
    this.setState({ potential_return: e.target.value * 2 });
  }

  getPreviousBets() {
    let previousBets = 0;
    if (this.props.roomInfo && this.props.roomInfo.game_log_list) {
      this.props.roomInfo.game_log_list.forEach(room_history => {
        if (room_history.bet_amount) {
          previousBets += parseFloat(room_history.bet_amount);
        }
      });
    }
    return previousBets;
  }

  changeBgColor = async result => {
    this.setState({ betResult: result, bgColorChanged: true });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 1 second
    this.setState({ bgColorChanged: false });
  };

  handleClickOutside = e => {
    if (this.settingsRef && !this.settingsRef.current.contains(e.target)) {
      this.setState({ settings_panel_opened: false });
    }
  };
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
    if (prevProps.roomInfo && this.props.roomInfo) {
      if (prevProps.roomInfo.bet_amount !== this.props.roomInfo.bet_amount) {
        this.setState({
          bankroll:
            parseFloat(this.props.roomInfo.bet_amount) - this.getPreviousBets()
        });
      }
    }

    if (
      prevState.isPasswordCorrect !== this.state.isPasswordCorrect &&
      this.state.isPasswordCorrect === true
    ) {
      this.joinGame();
    }
  }

  componentDidMount = () => {
    this.socket.on('DROP_GUESSES1', data => {
      if (!this.state.drop_guesses1Received) {
        this.setState({
          drop_guesses: data,
          drop_guesses1Received: true
        });
      }
    });
    this.socket.on('DROP_GUESSES', data => {
      this.setState({ drop_guesses: data });
    });
    const { socket } = this.props;
    socket.on('UPDATED_BANKROLL', data => {
      this.setState({ bankroll: data.bankroll });
    });

    document.addEventListener('mousedown', this.handleClickOutside);
  };

  componentWillUnmount = () => {
    clearInterval(this.state.intervalId);
    document.removeEventListener('mousedown', this.handleClickOutside);
  };

  predictNext = dropAmounts => {
    // Find the unique values in dropAmounts
    const uniqueValues = [...new Set(dropAmounts.map(drop => drop.drop))];

    if (uniqueValues.length === 1) {
      // If there is only one unique value, return that value
      return uniqueValues[0];
    } else {
      // Log all the drops
      const allDrops = dropAmounts.map(drop => drop.drop);
      // console.log('All drops:', allDrops.join(', '));

      // Calculate the segment size
      const minDrop = Math.min(...allDrops);
      const maxDrop = Math.max(...allDrops);
      const difference = maxDrop - minDrop;
      const segmentSize = difference / 20;

      // Sort drops into segments
      const segments = Array.from({ length: 20 }, (_, index) => {
        const lowerBound = minDrop + index * segmentSize;
        const upperBound = minDrop + (index + 1) * segmentSize;
        const dropsInSegment = allDrops.filter(drop => {
          return (
            drop >= lowerBound &&
            (drop < upperBound || (index === 19 && drop === upperBound))
          );
        });

        return {
          segment: index + 1,
          drops: dropsInSegment
        };
      });

      // Calculate the weights for each segment based on segment length
      const totalDropsCount = allDrops.length;
      const weights = segments.map(
        segment => segment.drops.length / totalDropsCount
      );

      // Generate a random number to select a segment
      const randomValue = Math.random();
      let cumulativeWeight = 0;
      let selectedSegment;

      for (let i = 0; i < segments.length; i++) {
        cumulativeWeight += weights[i];
        if (randomValue <= cumulativeWeight) {
          selectedSegment = segments[i];
          // console.log('Randomly selected segment:', selectedSegment);
          break;
        }
      }

      // Generate a random number to add to the selected segment range
      const randomAddition = Math.random() * segmentSize; // Random value between 0 and segmentSize
      const newNumber = selectedSegment
        ? selectedSegment.drops[0] + randomAddition
        : null;
      // console.log('Randomly generated new number:', newNumber);
      return newNumber;
    }
  };

  joinGame = async () => {
    const { playSound } = this.props;

    this.setState({ bet_amount: this.state.bet_amount });
    const result = await this.props.join({
      bet_amount: parseFloat(this.state.bet_amount),
      is_anonymous: this.state.is_anonymous,
      drop_bet_item_id: this.props.drop_bet_item_id
      // slippage: this.state.slippage
    });

    let text = 'HAHAA, YOU LOST!!!';

    if (result.betResult === 1) {
      playSound('win');
      text = 'WINNER, WINNER, VEGAN FUCKING DINNER!';
      // this.changeBgColor(result.betResult);
    } else if (result.betResult === 0) {
      text = 'SPLIT! EQUALLY SHIT!';
      playSound('split');
      // this.changeBgColor(result.betResult);
    } else {
      text = 'TROLLOLOLOL! LOSER!';
      playSound('lose');
      // this.changeBgColor(result.betResult);
    }

    let stored_drop_array =
      JSON.parse(localStorage.getItem('drop_array')) || [];

    while (stored_drop_array.length >= 20) {
      stored_drop_array.shift();
    }
    stored_drop_array.push({ drop: this.state.bet_amount });
    localStorage.setItem('drop_array', JSON.stringify(stored_drop_array));

    gameResultModal(
      this.props.isDarkMode,
      text,
      result.betResult,
      'Okay',
      null,
      () => {
        // history.push('/');
      },
      () => {}
    );

    if (result.status === 'success') {
      const currentUser = this.props.user;
      const currentRoom = this.props.room;
      this.setState(prevState => ({
        betResults: [
          ...prevState.betResults,
          { ...result, user: currentUser, room: currentRoom }
        ]
      }));
    } else {
      if (result.message) {
        alertModal(this.props.isDarkMode, result.message);
      }
    }

    this.props.refreshHistory();
  };

  onBtnBetClick = async () => {
    this.props.playSound('select');
    this.setState({ showAnimation: true });
    setTimeout(() => {
      this.setState({ showAnimation: false });
    }, 5000);
    const {
      openGamePasswordModal,
      isAuthenticated,
      isDarkMode,
      creator_id,
      user_id,
      balance,
      is_private,
      roomInfo
    } = this.props;
    const { bet_amount, bankroll } = this.state;

    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }

    if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
      return;
    }

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const passwordCorrect = rooms[roomInfo._id];

    if (localStorage.getItem('hideConfirmModal') === 'true') {
      if (is_private === true && passwordCorrect !== true) {
        openGamePasswordModal();
      } else {
        await this.joinGame();
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
            await this.joinGame();
          }
        }
      );
    }
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

  handleBetAmountChange = event => {
    this.setState({ bet_amount: event.target.value });
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

  handleSwitchChange = () => {
    const {
      isAuthenticated,
      isDarkMode,
      creator_id,
      user_id,
      balance
    } = this.props;
    const { betting, bet_amount } = this.state;

    // Add the necessary validation checks here
    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      // Display an error message or handle the case when authentication fails
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      // Display an error message or handle the case when creator ID validation fails
      return;
    }

    if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
      // Display an error message or handle the case when bet amount validation fails
      return;
    }

    if (!betting) {
      // User has turned on the switch
      this.startBetting();
    } else {
      // User has turned off the switch
      this.stopBetting();
    }
  };

  startBetting = () => {
    const { isDarkMode, playSound, is_private, roomInfo } = this.props;

    if (!validateLocalStorageLength('drop_array', isDarkMode)) {
      return;
    }
    const stored_drop_array =
      JSON.parse(localStorage.getItem('drop_array')) || [];

    const intervalId = setInterval(() => {
      const randomItem = this.predictNext(stored_drop_array);

      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const passwordCorrect = rooms[roomInfo._id];
      if (is_private === true && passwordCorrect !== true) {
        openGamePasswordModal();
      } else {
        this.joinGame2(randomItem);
      }
    }, 3500);
    playSound('start');

    this.setState({ intervalId, betting: true });
  };

  handleChange = event => {
    this.setState({ bet_amount: event.target.value });
  };

  stopBetting = () => {
    this.props.playSound('stop');
    clearInterval(this.state.intervalId, this.state.timer);
    this.setState({ intervalId: null, betting: false, timerValue: 2000 });
  };

  joinGame2 = async randomItem => {
    const {
      drop_bet_item_id,
      balance,
      isDarkMode,
      refreshHistory,
      playSound
    } = this.props;
    const {
      bet_amount,
      bankroll,
      slippage,
      is_anonymous,
      betting
    } = this.state;

    // Check if betting is true before continuing
    if (!betting) {
      return;
    }

    this.setState({ bet_amount: randomItem });

    if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
      return;
    }

    const result = await this.props.join({
      bet_amount: parseFloat(bet_amount),
      is_anonymous: is_anonymous,
      drop_bet_item_id: drop_bet_item_id,
      slippage: slippage
    });

    const currentUser = this.props.user;
    const currentRoom = this.props.room;

    if (result.status === 'success') {
      this.setState(prevState => ({
        betResults: [
          ...prevState.betResults,
          { ...result, user: currentUser, room: currentRoom }
        ]
      }));
      let text = 'HAHAA, YOU LOST!!!';

      if (result.betResult === 1) {
        playSound('win');

        text = 'NOT BAD, WINNER!';
        // this.changeBgColor(result.betResult);
      } else if (result.betResult === 0) {
        playSound('split');

        text = 'DRAW, NO WINNER!';
        // this.changeBgColor(result.betResult);
      } else {
        // this.changeBgColor(result.betResult);
        playSound('lose');
      }

      // gameResultModal(
      //   this.props.isDarkMode,
      //   text,
      //   result.betResult,
      //   'Okay',
      //   null,
      //   () => {
      //     // history.push('/');
      //   },
      //   () => {}
      // );

      refreshHistory();
    }
  };

  render() {
    const {
      showAnimation,
      isDisabled,
      bankroll,
      betting,
      timerValue,
      actionList,
      drop_guesses,
      bet_amount,
      slippage,
      settings_panel_opened
    } = this.state;

    const {
      selectedCreator,
      showPlayerModal,
      accessory,
      rank,
      creator_id,
      roomInfo,
      youtubeUrl,
      handleOpenPlayerModal,
      handleClosePlayerModal,
      creator_avatar,
      gameBackground,
      isDarkMode,
      isLowGraphics,
      isMusicEnabled,
    } = this.props;

    const payoutPercentage = (bankroll / roomInfo.endgame_amount) * 100;

    const barStyle = {
      width: `${payoutPercentage + 10}%`,
      backgroundColor: payoutPercentage <= 50 ? 'yellow' : 'red'
    };
    return (
      <div className="game-page">
        <div className="page-title">
          <h2>PLAY - Drop Game</h2>
        </div>
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
            // {...this.state.selectedRow}
          />
        )}
        <div className="game-contents">
          <div className="pre-summary-panel" ref={this.panelRef}>
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
                    <div className="value bankroll">
                      {convertToCurrency(bankroll)}
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label your-max-return">
                        Potential Return
                      </div>
                    </div>
                    <div className="value">
                      {convertToCurrency(
                        // updateDigitToPoint2(
                        this.state.bet_amount + ' + ??'
                        // )
                      )}
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
                          accessory={accessory}
                          rank={rank}
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
                      <YouTubeVideo url={youtubeUrl} isMusicEnabled={isMusicEnabled}/>
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
            style={{ position: 'relative', zIndex: 10 }}
          >
            {renderLottieAvatarAnimation(gameBackground, isLowGraphics)}

            <div className="game-info-panel">
              <h3 className="game-sub-title">Previous Drops</h3>
              <div className="gradient-container">
                <p className="previous-guesses drop">
                  <div>
                    {drop_guesses.length > 0 ? (
                      drop_guesses.map((guess, index) => (
                        <span
                          key={index}
                          style={{
                            background:
                              guess.host_drop > guess.bet_amount
                                ? '#e30303c2'
                                : '#e3e103c2',

                            border: '3px solid',
                            borderColor:
                              guess.host_drop > guess.bet_amount
                                ? '#e30303'
                                : '#e3e103',
                            padding: '0.3em 0.2em'
                          }}
                        >
                          {/* <InlineSVG id="busd" src={require('./busd.svg')} />{' '} */}
                          {convertToCurrency(guess.host_drop)}
                        </span>
                      ))
                    ) : (
                      <span id="no-guesses">No drops yet</span>
                    )}
                  </div>
                  <div>
                    {drop_guesses.length > 0 ? (
                      drop_guesses.map((guess, index) => (
                        <span
                          key={index}
                          style={{
                            background:
                              guess.host_drop > guess.bet_amount
                                ? '#e3e103c2'
                                : '#e30303c2',
                            border: '3px solid',
                            borderColor:
                              guess.host_drop > guess.bet_amount
                                ? '#e3e103'
                                : '#e30303',
                            padding: '0.3em 0.2em'
                          }}
                        >
                          {/* <InlineSVG id="busd" src={require('./busd.svg')} />{' '} */}
                          {convertToCurrency(guess.bet_amount)}
                        </span>
                      ))
                    ) : (
                      <span id="no-guesses"></span>
                    )}
                  </div>
                </p>
              </div>
            </div>
            <div
              className={`animation-container${
                showAnimation ? ' animate' : ''
              }`}
            >
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: drop
                }}
                width={200}
                height={200}
                style={{
                  filter: 'hue-rotate(95deg)'
                }}
              />
            </div>
            <div className="drop-amount">
              <h3 className="game-sub-title">Highest Drop Wins!</h3>
            </div>
            <BetAmountInput
              betAmount={bet_amount}
              handle2xButtonClick={this.handle2xButtonClick}
              handleHalfXButtonClick={this.handleHalfXButtonClick}
              handleMaxButtonClick={this.handleMaxButtonClick}
              onChangeState={this.onChangeState}
              isDarkMode={isDarkMode}
            />
            <Button
              className="place-bet"
              color="primary"
              onClick={() => this.onBtnBetClick()}
              variant="contained"
            >
              DROP AMOUNT
            </Button>

            
            <div>
              <FormControlLabel
                control={
                  <Switch
                    id="aiplay-switch"
                    checked={betting}
                    onChange={this.handleSwitchChange}
                  />
                }
                label={betting ? 'AI ON' : 'AI OFF'}
              />
              {betting ? (
                <div id="stop">
                  {/* <span>Stop</span> */}
                  <Lottie options={defaultOptions} width={22} />
                </div>
              ) : (
                <div>
                  {timerValue !== 2000 ? (
                    <span>{(timerValue / 2000).toFixed(2)}s</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <BetArray arrayName="drop_array" label="drop" />

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
  accessory: state.logic.curRoomInfo.accessory,
  betResults: state.logic.betResults,
  isLowGraphics: state.auth.isLowGraphics,
  isMusicEnabled: state.auth.isMusicEnabled
});

const mapDispatchToProps = {
  openGamePasswordModal
  // updateBetResult: (betResult) => dispatch(updateBetResult(betResult))
};

export default connect(mapStateToProps, mapDispatchToProps)(DropGame);
