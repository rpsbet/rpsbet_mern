import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import ReactApexChart from 'react-apexcharts';
import { YouTubeVideo } from '../../components/YoutubeVideo';
import Moment from 'moment';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import Lottie from 'react-lottie';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';

import { Button } from '@material-ui/core';
import InlineSVG from 'react-inlinesvg';
import busdSvg from '../JoinGame/busd.svg';

import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
  validateLocalStorageLength
} from '../modal/betValidations';
import ImageResultModal from '../modal/ImageResultModal';

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
import catBowl from '../LottieAnimations/cat_bowl.json';

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

class DropGame extends Component {
  constructor(props) {
    super(props);

    this.settingsRef = React.createRef();
    this.socket = this.props.socket;
    this.state = {
      timer: null,
      timerValue: 2000,
      intervalId: null,
      showImageModal: false,
      image: '',
      drop_guesses: [],
      advanced_status: '',
      productName: '',
      bet_amount: 0.001,
      bankroll: parseFloat(this.props.bet_amount) - this.getPreviousBets(),
      drop_guesses1Received: false,
      balance: this.props.balance,
      isPasswordCorrect: this.props.isPasswordCorrect,
    };
    this.panelRef = React.createRef();
    this.handleKeyPress = this.handleKeyPress.bind(this);
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
    const { socket, playSound } = this.props;
    document.addEventListener('keydown', this.handleKeyPress);
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
    socket.on('DROP_GUESSES1', data => {
      if (!this.state.drop_guesses1Received) {
        this.setState({
          drop_guesses: data,
          drop_guesses1Received: true
        });
      }
    });
    socket.on('DROP_GUESSES', data => {
      this.setState({ drop_guesses: data });
    });
    socket.on('UPDATED_BANKROLL', data => {
      this.setState({ bankroll: data.bankroll });
    });
  };

  componentWillUnmount = () => {
    clearInterval(this.state.intervalId);
    document.removeEventListener('keydown', this.handleKeyPress);
  };

  handleKeyPress(event) {
    const {isFocused} = this.props;
    if (!isFocused) {
      switch (event.key) {
        case ' ':
          event.preventDefault();
          this.onBtnBetClick(0);
          break;
        default:
          break;
      }
    }
  }

  joinGame = async () => {
    const { playSound } = this.props;

    this.setState({ bet_amount: this.state.bet_amount });
    const result = await this.props.join({
      bet_amount: parseFloat(this.state.bet_amount),
      drop_bet_item_id: this.props.drop_bet_item_id
    });

    let text = 'HAHAA, YOU LOST!!!';
    if (result.status === 'success') {

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
        () => { }
      );
      this.props.refreshHistory();
    } else {
      if (result.message) {
        alertModal(this.props.isDarkMode, result.message);
      }
    }
  };

  onBtnBetClick = async () => {
    this.props.playSound('select');
    this.props.updateDropAnimation();
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


  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };

  handleChange = event => {
    this.setState({ bet_amount: event.target.value });
  };


  render() {
    const {
      bankroll,
      actionList,
      drop_guesses,
      bet_amount,
      showImageModal,
      image,
      productName
    } = this.state;

    const {
      selectedCreator,
      showPlayerModal,
      accessory,
      rank,
      creator_id,
      showAnimation,
      roomInfo,
      youtubeUrl,
      handleOpenPlayerModal,
      handleClosePlayerModal,
      creator_avatar,
      gameBackground,
      isDarkMode,
      isLowGraphics,
      isMusicEnabled
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
                        parseFloat(this.state.bet_amount))} + ??


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
                      <YouTubeVideo url={youtubeUrl} isMusicEnabled={isMusicEnabled} />
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
            style={{ position: 'relative', zIndex: 10, padding: "30px" }}
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
              className={`animation-container${showAnimation ? ' animate' : ''
                }`}
              style={{ height: "200px", width: "300px" }}
            >
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: drop
                }}
                width={drop_guesses.length > 0 ? drop_guesses[drop_guesses.length - 1].bet_amount * 200000 : 100}
                height={drop_guesses.length > 0 ? drop_guesses[drop_guesses.length - 1].bet_amount * 200000 : 100}
                style={{
                  position: 'absolute',
                  transform: 'translateY(-60px)',
                  maxWidth: "300px",
                  maxHeight: "300px"
                }}
              />
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: drop
                }}
                width={drop_guesses.length > 0 ? drop_guesses[drop_guesses.length - 1].host_drop * 200000 : 100}
                height={drop_guesses.length > 0 ? drop_guesses[drop_guesses.length - 1].host_drop * 200000 : 100}
                style={{
                  position: 'absolute',
                  transform: 'translateY(60px)', filter: 'hue-rotate(45deg)',

                  maxWidth: "300px",
                  maxHeight: "300px"
                }}
              />
            </div>
            <div className="drop-amount">
              <h3 className="game-sub-title">Biggest Drop Wins!</h3>
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
              DROP AMOUNT&nbsp;<span className="roll-tag">[space]</span>
            </Button>

            <Lottie
              options={{
                loop: true,
                autoplay: true,
                animationData: catBowl
              }}
              style={{ width: "350px", position: "absolute", bottom: "-20px", zIndex: "-1", opacity: "0.5", filter: "drop-shadow(0px 0px 6px #ff0000)" }}
            />
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
  accessory: state.logic.curRoomInfo.accessory,
  isLowGraphics: state.auth.isLowGraphics,
  isMusicEnabled: state.auth.isMusicEnabled,
  isFocused: state.auth.isFocused

});

const mapDispatchToProps = {
  openGamePasswordModal
  // updateBetResult: (betResult) => dispatch(updateBetResult(betResult))
};

export default connect(mapStateToProps, mapDispatchToProps)(DropGame);
