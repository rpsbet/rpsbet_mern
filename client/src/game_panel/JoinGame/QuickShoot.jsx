import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import Share from '../../components/Share';
import ReactApexChart from 'react-apexcharts';
import Moment from 'moment';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import { getQsLottieAnimation } from '../../util/helper';
import {
  IconButton,
} from '@material-ui/core';
import { YouTubeVideo } from '../../components/YoutubeVideo';
import BetAmountInput from '../../components/BetAmountInput';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
  validateLocalStorageLength,
  validateBankroll
} from '../modal/betValidations';

import Lottie from 'react-lottie';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import ImageResultModal from '../modal/ImageResultModal';

import animationData from '../LottieAnimations/spinningIcon';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';
import loadingChart from '../LottieAnimations/loadingChart.json';
import football from '../LottieAnimations/football.json';

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};
class QuickShoot extends Component {
  constructor(props) {
    super(props);
    this.settingsRef = React.createRef();

    this.socket = this.props.socket;
    this.state = {
      items: [],
      betting: false,
      timer: null,
      timerValue: 2000,
      intervalId: null,
      selected_qs_position: this.props.selected_qs_position,
      advanced_status: '',
      is_anonymous: false,
      animation: <div />,
      bet_amount: 0.001,
      potential_return: 1.25,
      bankroll: parseFloat(this.props.bet_amount) - this.getPreviousBets(),
      balance: this.props.balance,
      productName: '',
      qs: '',
      image: '',
      showImageModal: false,
      isPasswordCorrect: this.props.isPasswordCorrect
    };
    this.onChangeState = this.onChangeState.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.panelRef = React.createRef();
  }
  componentDidMount() {
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
    socket.on('UPDATED_BANKROLL_QS', data => {
      this.setState({ bankroll: data.bankroll, qs: data.qs }, () => {
        this.updateAnimation();
      });
    });
  }

  componentWillUnmount() {
    clearInterval(this.state.intervalId);
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  handleKeyPress(event) {
    switch (event.key) {
      case 'p':
        this.onBtnBetClick(0);
        break;
      case 'q':
        this.onBtnBetClick(1);
        break;
      case 'w':
        this.onBtnBetClick(2);
        break;
      case 'e':
        this.onBtnBetClick(3);
        break;
      case 'r':
        this.onBtnBetClick(4);
        break;
      default:
        break;
    }
  }


  static getDerivedStateFromProps(props, current_state) {
    const { isPasswordCorrect, balance } = props;

    if (
      current_state.isPasswordCorrect !== isPasswordCorrect ||
      current_state.balance !== balance
    ) {
      return {
        ...current_state,
        balance,
        isPasswordCorrect
      };
    }

    return null;
  }

  getPreviousBets() {
    let previousBets = 0;
    const { roomInfo } = this.props;

    if (roomInfo && roomInfo.game_log_list) {
      roomInfo.game_log_list.forEach(room_history => {
        if (room_history.bet_amount) {
          previousBets += parseFloat(room_history.bet_amount);
        }
      });
    }

    return previousBets;
  }

  updateAnimation = async () => {
    let position_short_name = ['center', 'tl', 'tr', 'bl', 'br'];

    if (this.props.qs_game_type === 2) {
      position_short_name = ['bl', 'br'];

    } else if (this.props.qs_game_type === 3) {
      position_short_name = ['bl', 'center', 'br'];
    } else if (this.props.qs_game_type === 4) {
      position_short_name = ['tl', 'tr', 'bl', 'br'];
    }

    const animationData = await getQsLottieAnimation(
      this.props.roomInfo.qs_nation,
      position_short_name[this.state.qs]
    );


    this.setState({
      animation: (
        <div className="qs-image-panel">
          <Lottie
            options={{
              loop: false,
              autoplay: true,
              animationData
            }}
            style={{ maxWidth: '100%', width: '600px', borderRadius: '10px' }}
          />
        </div>
      )
    });
  };

  componentDidUpdate(prevProps, prevState) {
    const { roomInfo, actionList } = this.props;
    const { isPasswordCorrect } = this.state;

    if (prevProps.actionList !== actionList) {
      this.setState({
        actionList: actionList
      });
    }

    if (prevProps.roomInfo && roomInfo) {
      if (prevProps.roomInfo.bet_amount !== roomInfo.bet_amount) {
        this.setState({
          bankroll: parseFloat(roomInfo.bet_amount) - this.getPreviousBets()
        });
      }
    }

    if (
      prevState.isPasswordCorrect !== isPasswordCorrect &&
      isPasswordCorrect === true
    ) {
      this.joinGame();
    }
  }

  joinGame = async () => {
    const {
      qs_bet_item_id,
      isDarkMode,
      qs_game_type,
      refreshHistory,
      playSound,
      selected_qs_position,
      changeBgColor,
    } = this.props;
    const { bet_amount } = this.state;

    const result = await this.props.join({
      bet_amount: parseFloat(bet_amount),
      selected_qs_position: selected_qs_position,
      qs_bet_item_id: qs_bet_item_id
    });

    if (result.status === 'success') {
      let text = 'LOST, SAVED BY THE KEEPER!';
      changeBgColor(result.betResult);
      playSound('lose');
      if (result.betResult === 1) {
        playSound('win');
        text = 'WIN, EXCELLENT SHOT!';
        changeBgColor(result.betResult);
      } else if (result.betResult === 0) {
        playSound('split');
        text = 'Draw, No Winner!';
        changeBgColor(result.betResult);
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
          'Okay',
          null,
          () => {
            // history.go(0);
          },
          () => {
            // history.push('/');
          }
        );
      }
    } else {
      if (result.message) {
        alertModal(isDarkMode, result.message);
      }
    }

    let stored_qs_array;

    if (qs_game_type === 2) {
      stored_qs_array = JSON.parse(localStorage.getItem('qs_array_2')) || [];
    } else if (qs_game_type === 3) {
      stored_qs_array = JSON.parse(localStorage.getItem('qs_array_3')) || [];
    } else if (qs_game_type === 4) {
      stored_qs_array = JSON.parse(localStorage.getItem('qs_array_4')) || [];
    } else if (qs_game_type === 5) {
      stored_qs_array = JSON.parse(localStorage.getItem('qs_array_5')) || [];
    }

    while (stored_qs_array.length >= 20) {
      stored_qs_array.shift();
    }

    stored_qs_array.push({ qs: selected_qs_position, room_id: qs_bet_item_id });

    if (qs_game_type === 2) {
      localStorage.setItem('qs_array_2', JSON.stringify(stored_qs_array));
    } else if (qs_game_type === 3) {
      localStorage.setItem('qs_array_3', JSON.stringify(stored_qs_array));
    } else if (qs_game_type === 4) {
      localStorage.setItem('qs_array_4', JSON.stringify(stored_qs_array));
    } else if (qs_game_type === 5) {
      localStorage.setItem('qs_array_5', JSON.stringify(stored_qs_array));
    }
    refreshHistory();
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
    const multipliedBetAmount = this.state.bet_amount * 2;
    const limitedBetAmount = Math.min(multipliedBetAmount, this.state.balance);
    const roundedBetAmount = Math.floor(limitedBetAmount * 100000) / 100000;
    if (
      (this.state.bet_amount * 2) / (this.props.qs_game_type - 1) >
      this.state.bankroll
    ) {
      alertModal(this.props.isDarkMode, 'EXCEEDED BANKROLL');
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
    const maxBetAmount = Math.floor(this.state.balance * 100000) / 100000;

    this.setState(
        {
            bet_amount: Math.floor(Math.min(
                maxBetAmount,
                this.state.bankroll * (this.props.qs_game_type - 1)
            ) * 100000) / 100000
        },
        () => {
            document.getElementById('betamount').focus();
        }
    );
};



  updatePotentialReturn = () => {
    this.setState({
      potential_return:
        this.state.bet_amount / (this.props.qs_game_type - 1) +
        parseFloat(this.state.bet_amount) /* 0.95 */
    });
  };

  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };

  onChangeState(e) {
    this.setState({ bet_amount: e.target.value }, this.updatePotentialReturn);
  }

  onBtnBetClick = (position) => {
    const {
      isAuthenticated,
      isDarkMode,
      creator_id,
      user_id,
      balance,
      qs_game_type,
      is_private,
      roomInfo,
      openGamePasswordModal,
      updateSelectedQs
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

    if (
      !validateBankroll(
        bet_amount / (qs_game_type - 1) +
        parseFloat(bet_amount) -
        bankroll * (qs_game_type - 1),
        bankroll,
        isDarkMode
      )
    ) {
      return;
    }

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const passwordCorrect = rooms[roomInfo._id];

    updateSelectedQs(position, () => {


      if (localStorage.getItem('hideConfirmModal') === 'true') {
        if (is_private === true && passwordCorrect !== true) {
          openGamePasswordModal();
        } else {
          this.joinGame();
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
    });

  };

  // Define a function to map position to letter
 getPositionLetter = (position) => {
  switch (position) {
      case 0:
          return 'P';
      case 1:
          return 'q';
      case 2:
          return 'w';
      case 3:
          return 'e';
      case 4:
          return 'r';
      default:
          return '';
  }
};

renderButton(id, position) {
  const { betResult, selected_qs_position, bgColorChanged } = this.props;

  const classes = `${selected_qs_position === position ? 'active' : ''}${bgColorChanged && betResult === -1 && selected_qs_position === position
    ? ' lose-bg'
    : ''
    }${betResult === 0 && selected_qs_position === position ? ' draw-bg' : ''}${betResult === 1 && selected_qs_position === position ? ' win-bg' : ''
    }`;

    const buttonStyle = {
      opacity: 0.9
  };

  return (
      <IconButton
          id={id}
          onClick={() => {
              this.onBtnBetClick(position);
              this.props.playSound('select');
          }}
          className={classes}
          style={buttonStyle}
      ><span className="roll-tag">{this.getPositionLetter(position)}</span></IconButton>
  );
}


  renderButtons() {
    const { qs_game_type } = this.props;

    if (qs_game_type === 2) {
      return (
        <div className="qs-buttons">
          {this.renderButton('l', 0)}
          {this.renderButton('r', 1)}
        </div>
      );
    } else if (qs_game_type === 3) {
      return (
        <div className="qs-buttons">
          {this.renderButton('l', 0)}
          {this.renderButton('cc', 1)}
          {this.renderButton('r', 2)}
        </div>
      );
    } else if (qs_game_type === 4) {
      return (
        <div className="qs-buttons">
          {this.renderButton('tl', 0)}
          {this.renderButton('tr', 1)}
          {this.renderButton('bl', 2)}
          {this.renderButton('br', 3)}
        </div>
      );
    } else if (qs_game_type === 5) {
      return (
        <div className="qs-buttons">
          {this.renderButton('tl', 1)}
          {this.renderButton('tr', 2)}
          {this.renderButton('bl', 3)}
          {this.renderButton('br', 4)}
          {this.renderButton('c', 0)}
        </div>
      );
    }
  }

  render() {
    const {
      bankroll,
      actionList,
      showImageModal,
      bet_amount,
      image,
      productName
    } = this.state;
    const {
      selectedCreator,
      showPlayerModal,
      roomInfo,
      creator_id,
      qs_game_type,
      youtubeUrl,
      selected_qs_position,
      accessory,
      creator_avatar,
      rank,
      handleClosePlayerModal,
      handleOpenPlayerModal,
      isDarkMode,
      isLowGraphics,
      borderColor,
      isMusicEnabled,
      gameBackground
    } = this.props;
    const payoutPercentage = (bankroll / roomInfo.endgame_amount) * 100;

    const barStyle = {
      width: `${payoutPercentage + 10}%`,
      backgroundColor: payoutPercentage <= 50 ? 'yellow' : 'red'
    };
    let position_name = [
      'Center',
      'Top-Left',
      'Top-Right',
      'Bottom-Left',
      'Bottom-Right'
    ];
    let position_short_name = ['c', 'tl', 'tr', 'bl', 'br'];
    let arrayName;
    if (qs_game_type === 2) {
      position_name = ['Left', 'Right'];
      position_short_name = ['bl', 'br'];
      arrayName = 'qs_array_2';
    } else if (qs_game_type === 3) {
      position_name = ['Bottom-Left', 'Center', 'Bottom-Right'];
      position_short_name = ['bl', 'c', 'br'];
      arrayName = 'qs_array_3';
    } else if (qs_game_type === 4) {
      position_name = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'];
      position_short_name = ['tl', 'tr', 'bl', 'br'];
      arrayName = 'qs_array_4';
    } else if (qs_game_type === 5) {
      arrayName = 'qs_array_5';
    }

    return (
      <div className="game-page">
        <div className="page-title">
          <h2>PLAY - Quick Shoot</h2>
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
                    <div className="value bankroll">
                      {convertToCurrency(bankroll)}
                    </div>
                  </div>

                  <div className="data-item">
                    <div>
                      <div className="label your-max-return">Your Return</div>
                    </div>
                    <div className="value">
                      {convertToCurrency(
                        bet_amount / (qs_game_type - 1) +
                        parseFloat(bet_amount) /* 0.95 */
                      )}
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label win-chance">Win Chance</div>
                    </div>
                    <div className="value">
                      {(((qs_game_type - 1) / qs_game_type) * 100).toFixed(2)}%
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
            style={{ position: 'relative', zIndex: 10 }}
          >
            {renderLottieAvatarAnimation(
              gameBackground,
              isLowGraphics
            )}

            <h3 className="game-sub-title">Choose WHERE TO SHOOT</h3>
            <div
              className="qs-image-panel"
              style={{
                zIndex: '1'
              }}
            >
              <img
                src={`/img/gametype/quick_shoot/gametype${qs_game_type}/type${qs_game_type}-${position_short_name[selected_qs_position]}.png`}
                alt=""
                style={{
                  width: '600px',
                  maxWidth: '100%',
                  borderRadius: '10px',
                  border: `3px solid ${borderColor}`,
                  boxShadow: `0 0 20px ${borderColor}`

                }}
                />
                <div 
                id="cat-football"
                
                >

                <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: football
                }}
                style={{ transform: 'translate(15px, 60px)', width: '100px',  }}
                />
                </div>
                {this.state.animation}
              {this.renderButtons()}
            </div>

            <BetAmountInput
              betAmount={bet_amount}
              handle2xButtonClick={this.handle2xButtonClick}
              handleHalfXButtonClick={this.handleHalfXButtonClick}
              handleMaxButtonClick={this.handleMaxButtonClick}
              onChangeState={this.onChangeState}
              isDarkMode={isDarkMode}
            />

            {/* <div>
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
                  <Lottie options={defaultOptions} width={22} />
                </div>
              ) : (
                <div>
                  {timerValue !== 2000 ? (
                    <span>{(timerValue / 2000).toFixed(2)}s</span>
                  ) : null}
                </div>
              )}
            </div> */}
          </div>
          {/* <BetArray arrayName={arrayName} label="qs" /> */}

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
  balance: state.auth.balance,
  isDarkMode: state.auth.isDarkMode,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  rank: state.logic.curRoomInfo.rank,
  accessory: state.logic.curRoomInfo.accessory,
  isLowGraphics: state.auth.isLowGraphics,
  isMusicEnabled: state.auth.isMusicEnabled
});

const mapDispatchToProps = {
  openGamePasswordModal
};
export default connect(mapStateToProps, mapDispatchToProps)(QuickShoot);
