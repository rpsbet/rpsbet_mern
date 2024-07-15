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
  Button,
  IconButton,
  Tooltip,
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
import {
  getQsBetItems,
  getRoomBotCount,
} from '../../redux/Logic/logic.actions';
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
      bet_amount: 1,
      potential_return: 1.25,
      bankroll: parseFloat(this.props.bet_amount) - this.getPreviousBets(),
      balance: this.props.balance,
      productName: '',
      qs: '',
      host_pr: this.props.pr,
      image: '',
      showImageModal: false,
      isPasswordCorrect: this.props.isPasswordCorrect
    };
    this.onChangeState = this.onChangeState.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.panelRef = React.createRef();
  }

  async componentDidMount() {
    document.addEventListener('keydown', this.handleKeyPress);
    this.setState({ intervalId: setInterval(this.toggleBlueishHue, this.state.intervalDuration) });
    this.setupSocket();

    const botsCount = await this.props.getRoomBotCount(this.props.roomInfo._id);
    this.setState({ botsCount: botsCount });
  }

  setupSocket() {
    document.addEventListener('keydown', this.handleKeyPress);
    this.setState({ intervalId: setInterval(this.toggleBlueishHue, this.state.intervalDuration) });

    const initializeSocket = async () => {
      try {
        const { socket, playSound, roomInfo } = this.props;
        const initializedSocket = socket || socketIOClient(this.state.endpoint);
        this.setState({ socket: initializedSocket });

        if (initializedSocket) {

          initializedSocket.on(`UPDATED_BANKROLL_QS${roomInfo._id}`, this.handleSocketData);
          initializedSocket.on(`UPDATED_BANKROLL_QS2_${roomInfo._id}`, this.handleSocketData2);
        }

      } catch (error) {
        console.error('Socket initialization failed:', error);
        setTimeout(initializeSocket, 3000); // Retry after 3 seconds
      }
    };

    initializeSocket();
  }

  removeSocketListeners() {
    const { socket, roomInfo } = this.props;
    if (socket) {
      socket.off(`UPDATED_BANKROLL_QS${roomInfo._id}`, this.handleSocketData);
    }
  }

  handleSocketData = (data) => {
    this.setState(prevState => {
      let updatedPlayers = [...prevState.players, data.user];
      if (updatedPlayers.length > 5) {
        updatedPlayers.shift(); // Remove the oldest player
      }
      if (!this.props.isMuted) {
        this.props.playSound('blip');
      }

      // Check if the filtered result is empty
      let filteredQS = data.qs.filter(game => game.joiner === this.props.user_id);
      let qsState = filteredQS.length > 0 ? filteredQS : prevState.qs;

      return {
        bankroll: data.bankroll,
        host_pr: data.host_pr,
        qs: this.props.isWatching ? qsState : data.qs,
        prev_qs: data.qs,
        startedPlaying: true,
        players: updatedPlayers
      };
    });
  };
  handleSocketData2 = (data) => {
    this.setState({ bankroll: data.bankroll });
  };



  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
    document.removeEventListener('mousedown', this.handleClickOutside);
    clearInterval(this.state.intervalId);
    this.removeSocketListeners();
  }

  handleKeyPress(event) {
    if (!this.props.isFocused) {
      // Check if the Ctrl key is pressed (for Windows/Linux) or the Cmd key is pressed (for macOS)
      const ctrlKeyPressed = event.ctrlKey || event.metaKey;

      // Check if the key pressed is 'r'
      const isRKeyPressed = event.key === 'r';

      // Check if both conditions are met: Ctrl (or Cmd) key is pressed AND 'r' key is pressed
      if (!(ctrlKeyPressed && isRKeyPressed)) {
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
    if (position_short_name[this.props.selected_qs_position] === 'center') {
      this.props.playSound('grunt2');

    } else {
      this.props.playSound('grunt')
    }
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
        <div
          className="qs-image-panel"
          id="quickShoot_lottie"

        >
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
          result.amount,
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
    const { betResult, selected_qs_position, bgColorChanged, is_betting } = this.props;

    // Define the base classes
    let classes = `${selected_qs_position === position ? 'active' : ''}${bgColorChanged && betResult === -1 && selected_qs_position === position
      ? ' lose-bg'
      : ''
      }${betResult === 0 && selected_qs_position === position ? ' draw-bg' : ''}${betResult === 1 && selected_qs_position === position ? ' win-bg' : ''
      }`;

    // Add the 'disabled' class if is_betting is true
    if (is_betting) {
      classes += ' disabled';
    }

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
        disabled={is_betting} // Optionally disable the button directly
      >
        <span className="roll-tag">{this.getPositionLetter(position)}</span>
      </IconButton>
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
      username,
      creator_avatar,
      cp,
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
    const isLowBankroll = bankroll <= 1;
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
                    <Tooltip title={isLowBankroll ? "LOW BANKROLL CAN CAUSE A BET TO FAIL" : "A.K.A Liquidity / Pool / Pot"}>
                      <div className={`value ${isLowBankroll ? 'red-text' : ''}`}>
                        {convertToCurrency(bankroll)}
                        {isLowBankroll && <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />}
                      </div>
                    </Tooltip>
                  </div>

                  <div className="data-item">
                    <div>
                      <div className="label your-max-return">Your Return</div>
                    </div>
                    <Tooltip
                      title={
                        <div>
                          <span>EXPLANATION: </span>
                          <p>
                            {this.props.qs_game_type} * your Bet Amount, then deduct Host(s)'s(') commission, if any, (which is Returned to Bankroll or RTB)
                            and finally deduct 1% platform tax.
                          </p>
                          <span>CALCULATION: </span>
                          <div>{convertToCurrency(bet_amount)} x 2 = {convertToCurrency(bet_amount * 2)}</div>
                          <div>
                            -({cp} + 1)% = {convertToCurrency(bet_amount * 2 * ((100 - (cp + 1)) / 100))}
                          </div>
                        </div>
                      }
                    >
                      <div className="value">
                        {convertToCurrency(
                          (bet_amount / (qs_game_type - 1) + parseFloat(bet_amount)) * (1 - ((this.props.cp + 1) / 100))
                        )}
                      </div>
                    </Tooltip>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label win-chance">Win Chance</div>
                    </div>
                    <div className="value">
                      {(((qs_game_type - 1) / qs_game_type) * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label win-chance">Commission</div>
                    </div>
                    <Tooltip title="Determined by the Host's equipped accessory">

                      <div className="value">{this.props.cp}% </div>
                    </Tooltip>
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
                      <div className="label net-profit">Room Profit</div>
                    </div>
                    <div className="value bankroll">

                      <Tooltip title="Current bankroll + Payouts - Initial bankroll">
                        <div className="value" style={{ color: (roomInfo.pr - roomInfo.total_stakes) > 0 ? 'rgb(87, 202, 34)' : (roomInfo.pr  - roomInfo.total_stakes) < 0 ? '#ff0000' : 'inherit' }}>
                          {convertToCurrency(roomInfo.pr  - roomInfo.total_stakes)}
                        </div>
                      </Tooltip>

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
                          username={username}
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
            {/* {renderLottieAvatarAnimation(
              gameBackground,
              isLowGraphics
            )} */}

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
                  style={{ transform: 'translate(15px, 60px)', width: '100px', }}
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

          <div className="action-panel">
            <Share roomInfo={roomInfo} />
          </div>
        </div >
      </div >
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  isAuthenticated: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  balance: state.auth.balance,
  isDarkMode: state.auth.isDarkMode,
  is_betting: state.logic.is_betting,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  rank: state.logic.curRoomInfo.rank,
  accessory: state.logic.curRoomInfo.accessory,
  username: state.logic.curRoomInfo.username,
  isLowGraphics: state.auth.isLowGraphics,
  isFocused: state.auth.isFocused,
  isMusicEnabled: state.auth.isMusicEnabled
});

const mapDispatchToProps = {
  openGamePasswordModal,
  getRoomBotCount
};
export default connect(mapStateToProps, mapDispatchToProps)(QuickShoot);
