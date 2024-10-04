import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import Share from '../../components/Share';
import ReactApexChart from 'react-apexcharts';
import Moment from 'moment';
import Avatar from '../../components/Avatar';
import progress from '../LottieAnimations/progress.json';
import pressHold from '../LottieAnimations/pressHold.json';
import PlayerModal from '../modal/PlayerModal';
import AiPanel from '../../components/AiPanel';
import ViewIcon from '@material-ui/icons/Visibility';
import SwordsIcon from '@material-ui/icons/VisibilityOff';
import InfoIcon from '@material-ui/icons/Info';
import { getQsLottieAnimation } from '../../util/helper';
import { updateRoomBot, kickBots, endGame, getQbot } from '../../redux/Logic/logic.actions';
import { setSpectateMode } from '../../redux/Auth/user.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import WarningIcon from '@material-ui/icons/Warning';
import { faRobot, faMoneyBillWave, faBrain, faBan } from '@fortawesome/free-solid-svg-icons';
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
  callBot,
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
      qs: [],
      ballClassApplied: false,
      qsValueAtLastIndex: '',
      startedPlaying: false,
      prev_qs: [],
      bet_amount: 1,
      isQbot: false,
      players: [],
      botsCount: 0,
      potential_return: 1.25,
      bankroll: this.props.user_bet,
      host_pr: this.props.roomInfo.host_pr,
      balance: this.props.balance,
      productName: '',
      status: this.props.roomInfo.status,
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
    const qBotStatus = await this.props.getQbot(this.props.roomInfo.creator_id);
    console.log("qBotStatus", qBotStatus);
    this.setState({
      botsCount: botsCount,
      isQbot: qBotStatus,
    });
  }

  setupSocket() {
    document.addEventListener('keydown', this.handleKeyPress);
    this.setState({ intervalId: setInterval(this.toggleBlueishHue, this.state.intervalDuration) });

    const initializeSocket = async () => {
      try {
        const { socket, playSound, roomInfo } = this.props;
        const initializedSocket = socket || null;
        this.setState({ socket: initializedSocket });

        if (initializedSocket) {

          initializedSocket.on(`UPDATED_BANKROLL_QS_${roomInfo._id}`, this.handleSocketData);
          initializedSocket.on(`UPDATED_BANKROLL_QS2_${roomInfo._id}`, this.handleSocketData2);
        } else {
          setTimeout(initializeSocket, 3000);
        }
      } catch (error) {
        console.error('Socket initialization failed:', error);
        setTimeout(initializeSocket, 3000);
      }
    };

    initializeSocket();
  }

  removeSocketListeners() {
    const { socket, roomInfo } = this.props;
    if (socket) {
      socket.off(`UPDATED_BANKROLL_QS_${roomInfo._id}`, this.handleSocketData);
    }
  }

  handleSocketData = (data) => {
    this.setState(prevState => {
      let updatedPlayers = [...prevState.players, data.user];
      if (updatedPlayers.length > 5) {
        updatedPlayers.shift();
      }
      this.props.playSound('blip');
      // Check if the filtered result is empty
      let filteredQS = data.qs.filter(game => game.joiner === this.props.user_id);
      let qsState = filteredQS.length > 0 ? filteredQS : prevState.qs;
      let qsValueAtLastIndex = data.qs.length > 0 ? parseInt(data.qs[data.qs.length - 1].joiner_qs) : null;

      return {
        bankroll: data.bankroll,
        host_pr: data.host_pr,
        qs: this.props.isWatching ? qsState : data.qs,
        prev_qs: data.qs,
        startedPlaying: true,
        players: updatedPlayers,
        qsValueAtLastIndex: qsValueAtLastIndex
      };
    }, () => {
      if (!(this.props.isWatching && data.qs.every(game => game.joiner !== this.props.user_id))) {
        this.updateAnimation();
      }
    });
  };


  handleClickOutside = e => {
    if (
      this.settingsRef &&
      this.settingsRef.current &&
      !this.settingsRef.current.contains(e.target)
    ) {
      this.setState({ settings_panel_opened: false });
    }
  };


  handleSocketData2 = (data) => {
    this.setState({ bankroll: data.bankroll });
  };

  handleSpectateMode = () => {
    this.props.setSpectateMode(!this.props.isWatching);
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

  updateAnimation = async () => {

    let qsIndex = parseInt(this.state.qs[this.state.qs.length - 1].qs);
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
      position_short_name[qsIndex]
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
    // if (position_short_name[qsIndex] === 'center') {
    //   this.props.playSound('grunt2');
    // } else {
    //   this.props.playSound('grunt')
    // }
  };

  async componentDidUpdate(prevProps, prevState) {
    const { roomInfo, actionList, is_betting, bgColorChanged } = this.props;
    const { isPasswordCorrect, qs, qsValueAtLastIndex } = this.state;

    if (prevProps.actionList !== actionList) {
      this.setState({
        actionList: actionList
      });
    }
    if (prevState.bankroll !== this.state.bankroll && this.state.bankroll <= 0.05) {
      this.state.status = 'finished';
    }
    if (prevProps.isWatching !== this.props.isWatching) {
      this.removeSocketListeners();
      this.setupSocket();
    }
    if (prevProps.balance !== this.props.balance && this.props.gameResult !== -1 && this.state.isMax) {
      this.handleMaxButtonClick();
    }

    if (prevProps.is_betting !== is_betting && !is_betting) {
      const prevLastItemId = this.props.qsbetitems.length > 4 ? this.props.qsbetitems.slice(0, 5).reverse()[4]._id : null;
      const currentLastItemId = qs.length > 4 ? qs[4]._id : null;


      if (prevLastItemId === currentLastItemId) {
        await this.props.getQsBetItems(roomInfo._id);
        this.setState({
          qs: this.props.qsbetitems.slice(0, 5).reverse(),
          prev_qs: this.props.qsbetitems.slice(0, 5).reverse()
        });
      }
    }


    if (prevProps.roomInfo && roomInfo) {
      if (prevProps.roomInfo.bet_amount !== roomInfo.bet_amount) {
        this.setState({
          bankroll: parseFloat(roomInfo.bet_amount)
        });
      }
    }
    if (prevProps.roomInfo && roomInfo) {
      if (prevProps.roomInfo.host_pr !== roomInfo.host_pr) {
        this.setState({
          host_pr: parseFloat(roomInfo.host_pr)
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
      qs_game_type,
      onChangeState,
      playSound,
      selected_qs_position,
      changeBgColor,
    } = this.props;
    const { bet_amount } = this.state;
    onChangeState({ result: '' });

    const result = await this.props.join({
      bet_amount: parseFloat(bet_amount),
      selected_qs_position: selected_qs_position,
      qs_bet_item_id: qs_bet_item_id
    });

    playSound('ballKick');

    let text;
    let color;

    if (result.betResult === 1) {
      playSound('win');
      text = '+';
      changeBgColor(result.betResult);
    } else {
      playSound('lose');
      text = '-';
      changeBgColor(result.betResult);
    }

    const currencyElement = convertToCurrency(Math.abs(result.amount));

    const fragmentStyle = {
      color: color,
    };

    onChangeState({
      result: (
        <React.Fragment>
          <span style={fragmentStyle}> {text} {currencyElement}</span>
        </React.Fragment>
      ), gameResult: result.betResult
    });
  }


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
        (this.state.bet_amount / (this.props.qs_game_type - 1) +
          parseFloat(this.state.bet_amount) - this.state.bet_amount)/* 0.95 */
    });
  };

  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };

  onChangeState(e) {
    this.setState({ bet_amount: e.target.value, }, this.updatePotentialReturn);
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

    if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
      callBot(creator_id, roomInfo._id, user_id, isDarkMode, async () => {
        const botAttached = await updateRoomBot(roomInfo._id);
        if (botAttached) {
          this.setState(prevState => ({
            botsCount: prevState.botsCount + 1
          }));
        }
      });
      return;
    }

    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
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

  handleBotClick = () => {
    const { creator_id, user_id, roomInfo, isDarkMode, updateRoomBot } = this.props;
    if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
      callBot(creator_id, roomInfo._id, user_id, isDarkMode, async () => {
        const botAttached = await updateRoomBot(roomInfo._id);
        if (botAttached) {
          this.setState(prevState => ({
            botsCount: prevState.botsCount + 1
          }));
        }
      });
    }
  }


  bootBots = async () => {
    const { creator_id, user_id, roomInfo, kickBots } = this.props;
    this.setState({ botsCount: 0 }, async () => {
      if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
        await kickBots(roomInfo._id);
      }
    });
  }

  handleEndClick = async () => {
    const { roomInfo } = this.props;
    if (roomInfo.status !== 'finished') {
      await this.props.endGame(roomInfo._id);
      this.setState({ status: 'finished' });
    } else {
      alertModal(
        this.props.isDarkMode,
        "THIS GAME HAS ALREADY ENDED."
      );
    }
  }


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
    const { betResult, bgColorChanged, is_betting } = this.props;
    const { qsValueAtLastIndex, showBall } = this.state;

    // Initialize the classes array
    let classes = [];

    // Add the active class if the position matches
    if (qsValueAtLastIndex === position) {
      classes.push('active');
    }

    if (bgColorChanged && qsValueAtLastIndex === position && !is_betting) {
      setTimeout(() => {
        this.setState({ showBall: true }); // setState to show the ball image
      }, 1000);
    }

    if (bgColorChanged && betResult === -1 && qsValueAtLastIndex === position) {
      classes.push('lose-bg');
    } else if (betResult === 0 && qsValueAtLastIndex === position) {
      classes.push('draw-bg');
    } else if (betResult === 1 && qsValueAtLastIndex === position) {
      classes.push('win-bg');
    }

    // Add the disabled class if is_betting is true
    if (is_betting) {
      classes.push('disabled');
    }

    // Join all classes with a space
    const className = classes.join(' ');

    const buttonStyle = {
      opacity: 1,
      position: 'relative' // Ensure position relative to position the ball image
    };

    return (
      <IconButton
        id={id}
        onClick={() => {
          this.onBtnBetClick(position);
          this.props.playSound('select');
        }}
        className={className}
        style={buttonStyle}
        disabled={is_betting} // Optionally disable the button directly
      >
        <span className="roll-tag">{this.getPositionLetter(position)}</span>
        {showBall && bgColorChanged && qsValueAtLastIndex === position && !is_betting && (
          <img
            src="/img/football.svg"
            alt="ball"
            className="ball-kicked"
            onAnimationEnd={() => this.setState({ showBall: false })} // Hide ball after animation
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '30px',
              height: '30px'
            }}
          />
        )}
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
      productName,
      botsCount,
      status,
      startedPlaying,
      host_pr,
      qs,
      players,
      isQbot,
      prev_qs
    } = this.state;
    const {
      selectedCreator,
      showPlayerModal,
      roomInfo,
      creator_id,
      qs_game_type,
      youtubeUrl,
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
      playSound,
      isWatching,
      isMusicEnabled,
      predictedBetAmount,
      gameBackground,
      ai_mode,
      balance,
      user_id,
      attached,
      betting,
      handleDetachAttachChange,
      getAttachedRooms,
      is_betting,
      strategies,
      selected_qs_position
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

    const isLowProfit = (host_pr - roomInfo.total_stakes) > 0;
    const isHighCommission = this.props.cp > 15;
    const isLowBankroll = bankroll <= 1;
    return (
      <div className="game-page">
        <div className="page-title">
          <h2 className="title">PLAY - Quick Shoot</h2>
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
        <div className="game-contents title">
          <div
            className="pre-summary-panel title"
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
                        {!isLowBankroll ? (
                          <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                        ) : (
                          <WarningIcon style={{ fontSize: 16, marginLeft: 4 }} />
                        )
                        }
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
                            {this.props.qs_game_type} * your Bet Amount, then deduct Host(s)'s(')
                            commission, if any, (which is Returned to Bankroll or RTB) and
                            finally deduct 2.5% platform tax.
                          </p>
                          <span>CALCULATION: </span>
                          <div>
                            {convertToCurrency(bet_amount)} x 2 = {convertToCurrency(bet_amount * 2)}
                          </div>
                          <div>
                            -({cp} + 2.5)% ={' '}
                            {convertToCurrency(
                              bet_amount * 2 * ((100 - (cp + 2.5)) / 100)
                            )}
                          </div>
                        </div>
                      }
                    >
                      <div
                        className="value"
                        style={{
                          color:
                            (bet_amount / (qs_game_type - 1) + parseFloat(bet_amount)) *
                              (1 - (this.props.cp + 2.5) / 100) -
                              bet_amount > 0
                              ? '#00ff3a'
                              : 'red',
                        }}
                      >
                        {convertToCurrency(
                          (bet_amount / (qs_game_type - 1) + parseFloat(bet_amount)) *
                          (1 - ((this.props.cp + 2.5) / 100)) -
                          bet_amount
                        )}
                        <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                      </div>
                    </Tooltip>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label chance">Win Chance</div>
                    </div>
                    <div className="value">
                      {(((qs_game_type - 1) / qs_game_type) * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label commission">Commission</div>
                    </div>
                    <Tooltip title="Host's Accessory's Commission Power (CP) - Player's Accessory's Battle Power (BP) (MINIMUM 2.5% TOWARDS PLATFORM)">
                      <div style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>

                        <div className={`value ${isHighCommission ? 'red-text' : ''}`} style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <div className="value">{this.props.cp < 1 ? 1 : this.props.cp}% </div>
                          {!isHighCommission ? (
                            <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                          ) : (
                            <WarningIcon style={{ fontSize: 16, marginLeft: 4 }} />
                          )
                          }
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                  {this.props.endgame_type && (
                    <div className="data-item">
                      <div>
                        <div className="label created">Auto-Payout</div>
                      </div>
                      <Tooltip title="Automatic dividends paid out to Hosts & CoHosts upon meeting the set payout threshold">
                        <div style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>

                          <div className="payout-bar">
                            <div className="value" style={barStyle}></div>
                          </div>
                          <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                        </div>

                      </Tooltip>
                    </div>
                  )}
                  <div className="data-item">
                    <div>
                      <div className="label net-profit">Room Profit</div>
                    </div>
                    <div className="value bankroll">

                      <Tooltip title="Current bankroll + Payouts - Initial bankroll">
                        <div className="value" style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <span className={`value ${!isLowProfit ? 'red-text' : 'green-text'}`} >
                            {convertToCurrency(host_pr - roomInfo.total_stakes)}
                          </span>
                          {isLowProfit ? (
                            <InfoIcon style={{ color: "#00ff3a", fontSize: 16, marginLeft: 4 }} />
                          ) : (
                            <WarningIcon style={{ color: "red", fontSize: 16, marginLeft: 4 }} />
                          )
                          }

                        </div>
                      </Tooltip>

                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label public-interest">Interest Received</div>
                    </div>
                    <div className="value" >
                      <Tooltip title="Paid every 33 minutes, at a rate of 0.00001% of the bankroll. Room must be public.">
                        <div style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <span style={{ color: "#00fff5" }}>
                            {convertToCurrency(this.props.pr)}
                          </span>
                          <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                        </div>
                      </Tooltip>

                    </div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label host-display-name">Creator</div>
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
                      {isQbot && (<span style={{ fontSize: "xx-small", position: "absolute", top: "65px", border: "1px solid rgb(255, 208, 0)", background: "linear-gradient(45deg, #7a5958, #a27955)", borderRadius: "4px", color: "rgb(255, 208, 0)", padding: "0px 5px", lineHeight: "20px", marginLeft: "7.5px" }} >
                        Q-BOT
                      </span>)}
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
            <div className="guesses">
              <div>

                {prev_qs
                  .slice()
                  .map((item, index) => (
                    <p key={index}>{item.qs}</p>
                  ))}
              </div>
              <div>

                {this.state.players.length !== 0 && (
                  <>
                    {this.state.players.slice(0, 5).map((player, index) => (
                      <div key={index} style={{ opacity: "0.4", width: "29px", cursor: "pointer" }}>
                        <a
                          className="avatar"
                          onClick={() =>
                            handleOpenPlayerModal(player._id)
                          }
                        >
                          <Avatar
                            className="avatar"
                            src={player.avatar}
                            rank={player.totalWagered}
                            username={player.username}
                            accessory={player.accessory}
                            alt=""
                            darkMode={this.props.isDarkMode}
                          />
                        </a>

                      </div>
                    ))}
                  </>

                )}
              </div>
            </div>

            <div className="guesses">
              <div>
                {prev_qs
                  .slice()
                  .map((item, index) => (
                    <p key={index}>{item.qs}</p>
                  ))}
              </div>
              <div>

                {this.state.players.length !== 0 && (
                  <>
                    {this.state.players.slice(0, 5).map((player, index) => (
                      <div key={index} style={{ opacity: "0.4", width: "29px", cursor: "pointer" }}>
                        <a
                          className="avatar"
                          onClick={() =>
                            handleOpenPlayerModal(player._id)
                          }
                        >
                          <Avatar
                            className="avatar"
                            src={player.avatar}
                            rank={player.totalWagered}
                            username={player.username}
                            accessory={player.accessory}
                            alt=""
                            darkMode={this.props.isDarkMode}
                          />
                        </a>

                      </div>
                    ))}
                  </>

                )}
              </div>
            </div>
            {status === 'open' ? (
              <>
                <Tooltip title={!isWatching ? "CLICK TO STOP WATCHING" : "CLICK TO START WATCHING"}>
                  <IconButton className="spectate title" onClick={this.handleSpectateMode}>
                    {isWatching ? <>PLAY&nbsp;<SwordsIcon /></> : <>SPECTATE&nbsp;<ViewIcon /></>}

                  </IconButton>
                </Tooltip>
                <div className="game-info-panel">
                  <div className={`rps-radio-host ${this.props.is_betting || this.props.betting ? 'blueish-hue' : ''}`} style={{ top: "25px", right: "25px", boxShadow: "0px 0 5px 0px #ffc107", background: "radial-gradient(#ffd000, rgb(255, 0, 0, 0.2)", position: "absolute", width: "12.5px", height: "12.5px", borderRadius: "50%" }}>
                    <span className='result' style={{ display: (!startedPlaying) ? 'none' : 'flex' }}>
                      {this.props.result !== '' ? (
                        <>
                          {this.props.result}
                          {/* Second Lottie Animation */}
                          {this.props.betting && (

                            <div className='lottie-pressHold'>
                              <Lottie
                                options={{
                                  loop: isLowGraphics ? false : true,
                                  autoplay: isLowGraphics ? false : true,
                                  animationData: pressHold
                                }}
                                style={{
                                  position: 'relative',
                                  filter: `hue-rotate(${this.props.gameResult === -1 ? 0 : (this.props.gameResult === 0 ? 195 : (this.props.gameResult === 1 ? 80 : 20))}deg)`
                                }}
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <span><FontAwesomeIcon icon={faBrain} />&nbsp;<span className='desktop-only'>thinking...</span></span>
                          {/* First Lottie Animation */}
                          <div className='lottie-progress'>
                            <Lottie
                              options={{
                                loop: isLowGraphics ? false : true,
                                autoplay: isLowGraphics ? false : true,
                                animationData: progress
                              }}
                              style={{
                                position: 'relative',
                              }}
                            />
                          </div>
                        </>
                      )}
                    </span>
                  </div>
                  {/* {renderLottieAvatarAnimation(
              gameBackground,
              isLowGraphics
            )} */}
                  {!startedPlaying &&
                    <h3 className="game-sub-title">Choose WHERE TO SHOOT</h3>
                  }

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
                        boxShadow: `0 0 20px ${borderColor}`,
                        opacity: '0.5',
                        height: '238px'
                      }}
                    />

                    {this.props.result !== '' && (

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
                    )}
                    {this.props.result !== '' && (
                      <>
                        {this.state.animation}
                      </>
                    )}

                    {this.renderButtons()}
                  </div>


                  {creator_id && user_id && creator_id.toString() === user_id.toString() ? (
                    <div className='host-controls'>
                      <Button
                        onClick={this.handleBotClick}
                        className="hover-text-button"
                      >
                        <FontAwesomeIcon className="button-icon" icon={faRobot} />
                        <span className="button-text">&nbsp;CALL BOT? [{botsCount}]</span>
                      </Button>
                      {botsCount > 0 && (

                        <Button
                          onClick={this.bootBots}
                          className="hover-text-button"
                        >
                          <FontAwesomeIcon className="button-icon" icon={faBan} />
                          <span className="button-text">&nbsp;KICK BOTS?</span>
                        </Button>
                      )}
                      <Button
                        onClick={this.handleEndClick}
                        className="hover-text-button special-button"
                      >
                        <FontAwesomeIcon className="button-icon" icon={faMoneyBillWave} />
                        <span className="button-text">&nbsp;QUICK RUG&nbsp;{convertToCurrency(bankroll)}&nbsp;&nbsp;&nbsp;</span>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <BetAmountInput
                        betAmount={this.state.bet_amount}
                        handle2xButtonClick={this.handle2xButtonClick}
                        handleHalfXButtonClick={this.handleHalfXButtonClick}
                        handleMaxButtonClick={this.handleMaxButtonClick}
                        onChangeState={this.onChangeState}
                        isDarkMode={isDarkMode}
                        balance={this.state.balance}
                        bankroll={this.state.bankroll}
                      />
                      {this.props.is_mobile && (
                        <AiPanel
                          qsbetitems={this.props.qsbetitems}
                          updateUserStrategy={this.props.updateUserStrategy}
                          strategies={strategies}
                          betting={betting}
                          is_betting={is_betting}
                          predictedBetAmount={predictedBetAmount}
                          roomId={roomInfo._id}
                          handleSwitchChange={this.props.handleSwitchChange}
                          game_type={roomInfo.game_type}
                          rank={this.props.rank}
                          user_id={user_id}
                          ai_mode={ai_mode}
                          user_balance={balance}
                          handleDetachAttachChange={handleDetachAttachChange}
                          attached={attached}
                          creator_id={roomInfo.creator_id}
                          getAttachedRooms={getAttachedRooms}
                          rps_game_type={roomInfo.rps_game_type}
                          brain_game_type={roomInfo.brain_game_type}
                          spleesh_bet_unit={roomInfo.spleesh_bet_unit}
                          isDarkMode={this.props.isDarkMode}
                        />
                      )}
                    </>

                  )}
                </div>
              </>

            ) : (
              <span style={{ color: "#ff0000" }}>THIS GAME HAS ENDED</span>
            )}
          </div>

          <div className="action-panel">
            <Share roomInfo={roomInfo} />
          </div>
        </div>
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
  isWatching: state.auth.isWatching,
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
  getRoomBotCount,
  getQsBetItems,
  updateRoomBot,
  getQbot,
  kickBots,
  setSpectateMode,
  endGame,
};
export default connect(mapStateToProps, mapDispatchToProps)(QuickShoot);
