import React, { Component } from 'react';
import { connect } from 'react-redux';
import BetArray from '../../components/BetArray';
import Share from '../../components/Share';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import YouTubeModal from '../modal/YouTubeModal';
import Moment from 'moment';
import { acQueryMyItem } from '../../redux/Item/item.action';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import ReactApexChart from 'react-apexcharts';
import Avatar from '../../components/Avatar';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import progress from '../LottieAnimations/progress.json';
import PlayerModal from '../modal/PlayerModal';
import pressHold from '../LottieAnimations/pressHold.json';
import AiPanel from '../../components/AiPanel';
import loadingChart from '../LottieAnimations/loadingChart.json';
import { YouTubeVideo } from '../../components/YoutubeVideo';
import { updateRoomBot, kickBots, endGame } from '../../redux/Logic/logic.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faMoneyBillWave, faBrain } from '@fortawesome/free-solid-svg-icons';
import ViewIcon from '@material-ui/icons/Visibility';
import InfoIcon from '@material-ui/icons/Info';
import SwordsIcon from '@material-ui/icons/VisibilityOff';
import {
  getRpsBetItems,
  getRoomBotCount,
} from '../../redux/Logic/logic.actions';
import {
  Button,
  Switch,
  IconButton,
  Tooltip,
  FormControlLabel
} from '@material-ui/core';
import BetAmountInput from '../../components/BetAmountInput';
import Lottie from 'react-lottie';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import {
  validateIsAuthenticated,
  validateCreatorId,
  callBot,
  validateBetAmount,
  validateBankroll
} from '../modal/betValidations';

import animationData from '../LottieAnimations/spinningIcon';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import styled from 'styled-components';
import { convertToCurrency } from '../../util/conversion';
import ImageResultModal from '../modal/ImageResultModal';
import { setSpectateMode } from '../../redux/Auth/user.actions';

const ProductImage = styled.img`
  width: 100px;
  height: auto;
  background: #fff;
  border: 1px solid #f9f9;
  box-shadow: 0 1px 1px #ccc9;
  border-radius: 10px;
`;

const ProductCarousel = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 20px;
  margin-top: -30px;
  max-width: 460px;
  height: 270px;
  padding: 0;
  @media (max-width: 768px) {
    /* Adjust the width for mobile devices */
    max-width: 300px;
  }
`;

const ProductCard = styled.div`
  position: relative;
  border-radius: 0.8em;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-align-items: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  cursor: pointer;
  -webkit-transition: -webkit-transform 0.2s;
  -webkit-transition: transform 0.2s;
  transition: transform 0.2s, width 0.2s;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 20px;
  }

  &:hover {
    transform: scale(1.2);
    width: 350px;
    border: 2px solid #fff;

  }
`;

const UseItemButton = styled.div`
  opacity: 0;
    position: absolute;
    margin-top: auto;
    bottom: 0;
    
    margin
    right: 0; 
      cursor: pointer;
      -webkit-transition: -webkit-transform 0.2s;
      -webkit-transition: transform 0.2s;
      transition: transform 0.2s,  bottom 0.2s;

      ${ProductCard}:hover & {
        opacity: 1;
          bottom: calc(50%);;
  `;


const styles = {
  focused: {
    borderColor: '#fa3fa0'
  }
};

const options = [
  { classname: 'rock', selection: 'R' },
  { classname: 'paper', selection: 'P' },
  { classname: 'scissors', selection: 'S' }
];


class RPS extends Component {
  constructor(props) {
    super(props);

    this.socket = this.props.socket;
    this.state = {
      timer: null,
      showImageModal: false,
      image: '',
      productName: '',
      selected_rps: this.props.selected_rps,
      modalOpen: false,
      players: [],
      botsCount: 0,
      intervalDuration: 500,
      roomsCount: 0,
      startedPlaying: false,
      advanced_status: '',
      status: this.props.roomInfo.status,
      isMax: false,
      cardDealt: false,
      bet_amount: 1,
      betResult: 0,
      bankroll: this.props.user_bet,
      host_pr: this.props.roomInfo.host_pr,
      rps: [],
      prev_rps: [],
      isPasswordCorrect: this.props.isPasswordCorrect,
      animateCard: false
    };
    this.panelRef = React.createRef();
    this.onChangeState = this.onChangeState.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);

  }

  onChangeState(e) {
    this.setState({ bet_amount: e.target.value });
    this.setState({ potential_return: e.target.value * 2 });
  }
  handleOpenModal = () => {
    this.setState({ modalOpen: true });
  };

  handleCloseModal = () => {
    this.setState({ modalOpen: false });
  };

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

  handleClickOutside = e => {
    if (
      this.settingsRef &&
      this.settingsRef.current &&
      !this.settingsRef.current.contains(e.target)
    ) {
      this.setState({ settings_panel_opened: false });
    }
  };


  handleSpectateMode = () => {
    this.props.setSpectateMode(!this.props.isWatching);
  };

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
        const { socket, rps_game_type, acQueryMyItem, playSound, roomInfo, user_id } = this.props;
        const initializedSocket = socket || null;
        this.setState({ socket: initializedSocket });

        if (initializedSocket) {

          initializedSocket.on(`UPDATED_BANKROLL_${roomInfo._id}`, this.handleSocketData);
          initializedSocket.on(`UPDATED_BANKROLL2_${roomInfo._id}`, this.handleSocketData2);
        } else {
          setTimeout(initializeSocket, 3000);
        }

        // initializedSocket.on('CARD_PRIZE', data => {
        //   if (data) {
        //     this.setState(
        //       {
        //         image: data.image,
        //         productName: data.productName,
        //         showImageModal: true
        //       },
        //       () => playSound('')
        //     );
        //   }
        // });


        //   initializedSocket.on('RPS_1', data => {
        //     if (data && data.length > 0) {
        //       this.setState({
        //         rps: this.props.isWatching ? data.filter(game => game.joiner === user_id) : data,
        //         prev_rps: data,
        //         startedPlaying: true
        //       });
        //     }
        //   });

        //   initializedSocket.emit('emitRps');
        // }

        // // Add event listener conditionally based on rps_game_type
        // if (rps_game_type === 0) {
        //   document.addEventListener('mousedown', this.handleClickOutside);
        // }

        // if (rps_game_type === 1) {
        //   // Ensure acQueryMyItem is available
        //   if (acQueryMyItem) {
        //     await acQueryMyItem(100, 1, 'price', '653ee7ac17c9f5ee21245649');
        //     setTimeout(() => {
        //       if (!this.state.cardDealt) {
        //         this.dealCard();
        //       }
        //     }, 1500);
        //   }
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
      socket.off(`UPDATED_BANKROLL_${roomInfo._id}`, this.handleSocketData);
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
      let filteredRPS = data.rps.filter(game => game.joiner === this.props.user_id);
      let rpsState = filteredRPS.length > 0 ? filteredRPS : prevState.rps;

      return {
        bankroll: data.bankroll,
        host_pr: data.host_pr,
        rps: this.props.isWatching ? rpsState : data.rps,
        prev_rps: data.rps,
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
    const { isFocused } = this.props;

    // Check if the Ctrl key is pressed (for Windows/Linux) or the Cmd key is pressed (for macOS)
    const ctrlKeyPressed = event.ctrlKey || event.metaKey;

    // Check if the key pressed is 'r'
    const isRKeyPressed = event.key === 'r';

    // Check if both conditions are met: Ctrl (or Cmd) key is pressed AND 'r' key is pressed
    if (!isFocused && !(ctrlKeyPressed && isRKeyPressed)) {
      switch (event.key) {
        case 'r':
          this.onBtnBetClick('R');
          break;
        case 'p':
          this.onBtnBetClick('P');
          break;
        case 's':
          this.onBtnBetClick('S');
          break;
        default:
          break;
      }
    }
  }



  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };
  dealCard = () => {
    // Check if the DOM is fully loaded
    if (document.readyState !== 'loading') {
      // If it's already loaded, call the dealCardLogic directly
      this.dealCardLogic();
    } else {
      // If the DOM is still loading, wait for the 'DOMContentLoaded' event
      document.addEventListener('DOMContentLoaded', this.dealCardLogic);
    }
  };

  dealCardLogic = () => {
    const newCard = document.createElement('div');
    newCard.className = 'card-hidden upside-down animated-card';
    newCard.style.height = '200px';
    newCard.style.width = '130px';
    newCard.style.borderRadius = '1rem';
    newCard.style.marginRight = '10px';

    // Add the new card to the card-container
    const cardContainer = document.querySelector('.card-container');

    // Check if cardContainer exists before manipulating it
    if (cardContainer) {
      cardContainer.insertBefore(newCard, cardContainer.firstChild);

      this.props.playSound('cards');

      const firstCardDashed = cardContainer.querySelector('.card-hidden.dashed');
      if (firstCardDashed && firstCardDashed.style.display !== 'none') {
        firstCardDashed.style.display = 'none';
      } else {
        // If '.card-hidden.dashed' doesn't exist, look for an element with 'flipped' class
        const firstCardFlipped = cardContainer.querySelector('.flipped');
        if (firstCardFlipped) {
          firstCardFlipped.style.display = 'none';
        }
      }
      this.setState({ cardDealt: true });
    }
  };


  flipCard = () => {
    const rpsValueAtLastIndex = this.state.rps[this.state.rps.length - 1]?.rps;
    const cardContainer = document.querySelector('.card-container');
    if (cardContainer) {
      const card = cardContainer.querySelector('div');

      if (card) {
        const card = cardContainer.querySelector('div');
        if (card.classList.contains('card-hidden')) {
          card.classList.remove('card-hidden');
        }

        if (card.classList.contains('animated-card')) {
          card.classList.remove('animated-card');
        }

        this.props.playSound('cards');
        card.classList.add('flipped');

        const backgroundImageURL = '/img/marketplace/blender.svg';
        const updatedBackgroundImageURL = backgroundImageURL.replace(
          'blender',
          rpsValueAtLastIndex
        );
        card.style.backgroundImage = `url('${updatedBackgroundImageURL}')`;
        card.style.backgroundSize = `100%`;

      } else {
        console.error("No 'div' element found inside .card-container");
      }
    } else {
      console.error("No element found with the class .card-container");
    }

    setTimeout(() => {

      if (!this.state.cardDealt) {
        this.dealCard();
      }

    }, 5500);
  };

  drawCard = () => {
    // Create a new card element
    const newCard = document.createElement('div');
    newCard.className = 'animated-rrps-card';
    newCard.style.height = '200px';
    newCard.style.width = '130px';
    newCard.style.borderRadius = '1rem';
    newCard.style.marginLeft = '10px';

    // Replace 'blender' with the value of this.state.selected in the background image URL
    const backgroundImageURL = '/img/marketplace/blender.svg';
    const updatedBackgroundImageURL = backgroundImageURL.replace(
      'blender',
      this.props.selected_rps
    );
    newCard.style.backgroundImage = `url('${updatedBackgroundImageURL}')`;

    const cardContainer = document.querySelector('.card-container');
    const lastCard = cardContainer.querySelector('div:last-child');
    lastCard.style.display = 'none';

    cardContainer.appendChild(newCard);

    this.props.playSound('cards');
  };

  async componentDidUpdate(prevProps, prevState) {
    const { roomInfo, actionList, selected_rps, is_betting } = this.props;
    const { isPasswordCorrect, rps } = this.state;

    if (prevProps.isWatching !== this.props.isWatching) {
      this.removeSocketListeners();
      this.setupSocket();
    }
    if (prevProps.balance !== this.props.balance && this.props.gameResult !== -1 && this.state.isMax) {
      this.handleMaxButtonClick();
    }
    if (prevProps.actionList !== actionList) {
      this.setState({
        actionList: actionList
      });
    }

    if (prevState.bankroll !== this.state.bankroll && this.state.bankroll <= 0.05) {
      this.state.status = 'finished';
    }

    if (prevProps.is_betting !== is_betting && !is_betting) {
      const prevLastItemId = this.props.rpsbetitems.length > 4 ? this.props.rpsbetitems.slice(0, 5).reverse()[4]._id : null; // Get _id of the last item in previous props
      const currentLastItemId = rps.length > 4 ? rps[4]._id : null; // Get _id of the last item in current props


      if (prevLastItemId === currentLastItemId) {
        await this.props.getRpsBetItems(roomInfo._id);
        this.setState({
          rps: this.props.rpsbetitems.slice(0, 5).reverse(),
          prev_rps: this.props.rpsbetitems.slice(0, 5).reverse()
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
      this.joinGame(selected_rps);
    }

    // if (prevState.rps !== rps && rps_game_type === 1) {
    //   this.flipcard();
    // }
  }


  toggleBlueishHue() {
    const elements = document.querySelectorAll('.rps-radio-host');
    elements.forEach(element => {
      element.classList.toggle('blueish-hue');
    });
  }

  joinGame = async () => {
    const {
      rps_bet_item_id,
      isDarkMode,
      join,
      playSound,
      rps_game_type,
      changeBgColor,
      selected_rps,
      onChangeState
    } = this.props;

    const { bet_amount } = this.state;
    onChangeState({ result: '' });
    const result = await join({
      bet_amount: parseFloat(bet_amount),
      selected_rps: selected_rps,
      rps_bet_item_id: rps_bet_item_id,
    });


    let text;
    let color;

    if (result.betResult === 1) {
      playSound('win');
      text = '+';
      color = '#7ed321';
      changeBgColor(result.betResult);
    } else if (result.betResult === 0) {
      text = '-';
      color = 'grey';
      playSound('split');
      changeBgColor(result.betResult);
    } else {
      text = '-';
      color = '#f50000';
      playSound('lose');
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

  // Child Component
  onBtnBetClick = async (selection) => {
    const {
      openGamePasswordModal,
      isAuthenticated,
      isDarkMode,
      creator_id,
      user_id,
      balance,
      is_private,
      roomInfo,
      updateSelectedRps,
      bankroll
    } = this.props;

    const { bet_amount } = this.state;

    // Call the function passed from the parent to update selected_rps
    updateSelectedRps(selection, async () => {
      // Code to execute after the state has been updated

      if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
        return;
      }


      if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
        callBot(creator_id, roomInfo._id, user_id, isDarkMode, this.props.updateRoomBot);
        return;
      }     // if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      //    return;
      // }

      if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
        return;
      }

      if (!validateBankroll(bet_amount, bankroll, isDarkMode)) {
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
    });
  };

  // Function to round down to 2 decimal places
  roundDownToTwoDecimalPlaces = (number) => {
    return Math.floor(number * 100) / 100;
  };

  handleHalfXButtonClick = () => {
    const multipliedBetAmount = this.state.bet_amount * 0.5;
    const roundedBetAmount = this.roundDownToTwoDecimalPlaces(multipliedBetAmount);
    this.setState({ bet_amount: roundedBetAmount, isMax: false }, () => {
      document.getElementById('betamount').focus();
    });
  };

  handle2xButtonClick = () => {

    const maxBetAmount = this.props.balance;
    const multipliedBetAmount = this.state.bet_amount * 2;
    const limitedBetAmount = Math.min(multipliedBetAmount, maxBetAmount);
    const roundedBetAmount = this.roundDownToTwoDecimalPlaces(limitedBetAmount);
    if (roundedBetAmount < -2330223) {
      alertModal(this.props.isDarkMode, "NOW, THAT'S GETTING A BIT CRAZY NOW ISN'T IT?");
    } else {
      this.setState({ bet_amount: roundedBetAmount, isMax: false }, () => {
        document.getElementById('betamount').focus();
      });
    }
  };

  handleMaxButtonClick = () => {
    const maxBetAmount = Math.min(this.props.balance, this.state.bankroll);
    const roundedMaxBetAmount = this.roundDownToTwoDecimalPlaces(maxBetAmount);
    this.setState({ bet_amount: roundedMaxBetAmount, isMax: true }, () => {
      document.getElementById('betamount').focus();
    });
  };

  render() {
    const {
      showImageModal,
      image,
      bankroll,
      startedPlaying,
      rps,
      productName,
      actionList,
      botsCount,
      players,
      prev_rps,
      host_pr,
      status,
      intervalDuration
    } = this.state;
    const {
      bgColorChanged,
      selectedCreator,
      accessory,
      rank,
      username,
      isDarkMode,
      selected_rps,
      isLowGraphics,
      isMusicEnabled,
      handleClosePlayerModal,
      showPlayerModal,
      ai_mode,
      balance,
      betting,
      is_betting,
      predictedBetAmount,
      betResult,
      roomInfo,
      handleOpenPlayerModal,
      creator_avatar,
      rps_game_type,
      strategies,
      creator_id,
      user_id,
      isWatching,
      playSound,
    } = this.props;
    const payoutPercentage = (bankroll / roomInfo.endgame_amount) * 100;

    const barStyle = {
      width: `${payoutPercentage}%`,
      backgroundColor: payoutPercentage <= 50 ? 'yellow' : 'red'
    };
    const rpsValueAtLastIndex = rps[rps.length - 1]?.rps;
    const joinerRpsValueAtLastIndex = rps[rps.length - 1]?.joiner_rps;

    if (this.props.is_betting) {
      const intervalId = setInterval(this.toggleBlueishHue, intervalDuration);
      const flashingDuration = 2000;
      setTimeout(() => {
        clearInterval(intervalId);
        document.querySelectorAll('.rps-radio-host').forEach(element => {
          element.classList.remove('blueish-hue');
        });
      }, flashingDuration);
    }
    const isLowBankroll = bankroll <= 1;

    return (
      <div className="game-page">
        <div className="page-title">
          {rps_game_type === 1 ? <h2>PLAY - RRPS</h2> : <h2>PLAY - RPS</h2>}{' '}
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
          <div className="pre-summary-panel" ref={this.panelRef}>
            <div className="pre-summary-panel__inner">
              {[...Array(1)].map((_, i) => (
                <React.Fragment key={i}>
                  <div className="data-item">
                    <div>
                      <div className="label room-id">STATUS</div>
                    </div>
                    <div className="value">{status}</div>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label your-bet-amount">Bankroll</div>
                    </div>
                    <Tooltip title={isLowBankroll ? "LOW BANKROLL CAN CAUSE A BET TO FAIL" : "A.K.A Liquidity / Pool / Pot"}>
                      <div className={`value ${isLowBankroll ? 'red-text' : ''}`}  style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {convertToCurrency(bankroll)}
                        {isLowBankroll && <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />}
                        <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />

                      </div>
                    </Tooltip>
                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label your-max-return">Your Return</div>
                    </div>
                    <Tooltip title={<div>
                      <span>EXPLANATION: </span>
                      <p>2x your Bet Amount, then deduct Host(s)'s(') commission, if any, (which is Returned to Bankroll or RTB) and finally deduct 1% platform tax.</p>
                      <span>CALCULATION: </span>
                      <div>{convertToCurrency(this.state.bet_amount)} x 2  = {convertToCurrency(this.state.bet_amount * 2)}</div>
                      <div>-({this.props.cp} + 1)% = {convertToCurrency(this.state.bet_amount * 2 * ((100 - (this.props.cp + 1)) / 100))}</div>
                    </div>}>
                      <div className="value"  style={{cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        {convertToCurrency(this.state.bet_amount * 2 * ((100 - (this.props.cp + 1)) / 100))}
                      <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                      </div>

                    </Tooltip>

                  </div>
                  <div className="data-item">
                    <div>
                      <div className="label net-profit">Room Profit</div>
                    </div>
                    <div className="value bankroll">

                      <Tooltip title="Current bankroll + Payouts - Initial bankroll">
                        <div className="value"  style={{cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <span style={{ color: (host_pr - roomInfo.total_stakes) > 0 ? 'rgb(87, 202, 34)' : (host_pr - roomInfo.total_stakes) < 0 ? '#ff0000' : 'inherit' }}>
                            {convertToCurrency(host_pr - roomInfo.total_stakes)}
                            </span>
                          <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />

                        </div>
                      </Tooltip>

                    </div>
                  </div>
                  {this.props.rps_game_type === 0 && (
                    <div className="data-item">
                      <div>
                        <div className="label win-chance">Commission</div>
                      </div>
                      <Tooltip title="Host's Accessory's Commission Power (CP) - Player's Accessory's Battle Power (BP) (MINIMUM 1% TOWARDS PLATFORM)">
                        <div style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>

                          <div className="value">{this.props.cp < 1 ? 1 : this.props.cp}% </div>
                          <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                        </div>
                      </Tooltip>
                    </div>
                  )}
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
                        onClick={() =>
                          handleOpenPlayerModal(this.props.creator_id)
                        }
                      >
                        <Avatar
                          className="avatar"
                          src={creator_avatar}
                          username={username}
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
                  {/* {youtubeUrl && (
                    <div className="data-item">
                      <YouTubeVideo
                        url={youtubeUrl}
                        isMusicEnabled={isMusicEnabled}
                      />
                    </div>
                  )} */}
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
            {/* {renderLottieAvatarAnimation(gameBackground, isLowGraphics)} */}
            {this.props.rps_game_type === 1 && (
              <div className="game-background-panel game-info-panel">
                <YouTubeModal
                  open={this.state.modalOpen}
                  onClose={this.handleCloseModal}
                  rps={rpsValueAtLastIndex}
                />

                <div
                  className="card-container"
                  style={{ margin: '-30px auto 10px' }}
                >
                  <div
                    className="card-hidden dashed"
                    style={{
                      height: '100%',
                      width: '130px',
                      borderRadius: '1rem',
                      marginRight: '10px'
                    }}
                  ></div>
                  <div
                    className="card-hidden dashed"
                    style={{
                      height: '100%',
                      width: '130px',
                      borderRadius: '1rem',
                      transform: 'rotate(0deg)'
                    }}
                  ></div>
                </div>
                <h3 className="game-sub-title">Select a Card</h3>
                <ProductCarousel>
                  {this.props.data
                    .filter(row => row.item_type === '653ee7ac17c9f5ee21245649')
                    .map(row => (
                      <ProductCard
                        key={row._id}
                        onClick={() => {
                          this.setState(
                            {
                              selected_rps: row.productName
                            },
                            () => {
                              this.drawCard();
                            }
                          );
                        }}
                        className={
                          selected_rps === row.productName ? 'selected' : ''
                        }
                      >
                        <ProductImage src={row.image} alt={row.productName} />
                        {/* <div>{row.productName}</div> */}
                        <UseItemButton>
                          <Tooltip title={'Use Item'}>
                            <IconButton
                              className="btn-back"
                              onClick={() => {
                                this.onBtnBetClick(row.productName);
                              }}
                            >
                              Play
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                        </UseItemButton>
                      </ProductCard>
                    ))}
                </ProductCarousel>

                <BetAmountInput
                  betAmount={this.state.bet_amount}
                  handle2xButtonClick={this.handle2xButtonClick}
                  handleHalfXButtonClick={this.handleHalfXButtonClick}
                  handleMaxButtonClick={this.handleMaxButtonClick}
                  onChangeState={this.onChangeState}
                  isDarkMode={isDarkMode}
                />

              </div>
            )}
            {this.props.rps_game_type === 1 && (
              <div style={{ position: 'absolute' }}>
                <div className="card-back">
                  <div className="rps-logo">
                    <img src={'/img/rps-logo-white.svg'} alt="RPS Game Logo" />
                  </div>
                </div>
              </div>
            )}
            <div className="guesses">
              <div>

                {prev_rps
                  .slice()
                  .map((item, index) => (
                    <p key={index}>{item.rps}</p>
                  ))}
              </div>
              <div>

                {this.state.players.length !== 0 && (
                  <>
                    {this.state.players.slice(0, 5).map((player, index) => (
                      <div key={index} style={{ opacity: "0.4", width: "30px" }}>
                        <Avatar
                          className="avatar"
                          src={player.avatar}
                          rank={player.totalWagered}
                          username={player.username}
                          accessory={player.accessory}
                          alt=""
                          darkMode={this.props.isDarkMode}
                        />
                      </div>
                    ))}
                  </>

                )}
              </div>


            </div>
            {status === 'open' && rps_game_type === 0 ? (
              <>
                <Tooltip title={!isWatching ? "CLICK TO STOP WATCHING" : "CLICK TO START WATCHING"}>
                  <IconButton className="spectate" onClick={this.handleSpectateMode}>
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



                  {startedPlaying && (
                    <div
                      id="rps-radio"
                      style={{ zIndex: 1 }}
                      className={this.props.ai_mode !== 'Skill-issue-2' ? '' : ''}
                    >

                      <div
                        className={`rps-option ${rps[this.state.rps.length - 1]?.rps === 'R'
                          ? 'rock'
                          : ''
                          }${rpsValueAtLastIndex === 'R' ? ' active' : ''}${bgColorChanged &&
                            betResult === -1 &&
                            rpsValueAtLastIndex === 'R'
                            ? ' win-bg'
                            : ''
                          }${betResult === 0 && rpsValueAtLastIndex === 'R'
                            ? ' draw-bg'
                            : ''
                          }${betResult === 1 && rpsValueAtLastIndex === 'R'
                            ? ' lose-bg'
                            : ''
                          }`}
                      ></div>

                      <div
                        className={`rps-option ${rps[this.state.rps.length - 1]?.rps === 'P'
                          ? 'paper'
                          : ''
                          }${rpsValueAtLastIndex === 'P' ? ' active' : ''}${bgColorChanged &&
                            betResult === -1 &&
                            rpsValueAtLastIndex === 'P'
                            ? ' win-bg'
                            : ''
                          }${betResult === 0 && rpsValueAtLastIndex === 'P'
                            ? ' draw-bg'
                            : ''
                          }${betResult === 1 && rpsValueAtLastIndex === 'P'
                            ? ' lose-bg'
                            : ''
                          }`}
                      ></div>
                      <div
                        className={`rps-option ${rps[rps.length - 1]?.rps === 'S' ? 'scissors' : ''
                          }${rpsValueAtLastIndex === 'S' ? ' active' : ''}${bgColorChanged &&
                            betResult === -1 &&
                            rpsValueAtLastIndex === 'S'
                            ? ' win-bg'
                            : ''
                          }${betResult === 0 && rpsValueAtLastIndex === 'S'
                            ? ' draw-bg'
                            : ''
                          }${betResult === 1 && rpsValueAtLastIndex === 'S'
                            ? ' lose-bg'
                            : ''
                          }`}
                      ></div>
                    </div>
                  )}
                  {!startedPlaying ? (
                    <h3 style={{ zIndex: 9 }} className="game-sub-title">
                      Select: R - P - S!
                    </h3>
                  ) : (
                    <h3 style={{ zIndex: 9 }} className="game-sub-title fade-out">
                      Select: R - P - S!
                    </h3>
                  )}
                  <div id="rps-radio" style={{ zIndex: 1 }}>
                    {options.map(({ classname, selection }, index) => (
                      <Button
                      key={index}
                        variant="contained"
                        id={`rps-${classname}`}
                        className={`rps-option ${classname}${joinerRpsValueAtLastIndex === selection ? ' active' : ''}${bgColorChanged && betResult === -1 && joinerRpsValueAtLastIndex === selection ? ' lose-bg' : ''}${betResult === 0 && joinerRpsValueAtLastIndex === selection ? ' draw-bg' : ''}${betResult === 1 && joinerRpsValueAtLastIndex === selection ? ' win-bg' : ''}${this.props.is_betting ? ' disabled' : ''}`} // Add 'disabled' class when this.props.betting is true
                        onClick={() => {
                          if (!this.props.is_betting) { // Check if betting is not in progress
                            this.onBtnBetClick(selection);
                            playSound('select');
                          }
                        }}
                      >&nbsp;<span className="roll-tag">[{selection}]</span></Button>
                    ))}
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
                        <span className="button-text">&nbsp;QUICK RUG&nbsp;{convertToCurrency(bankroll)}</span>
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
                          rpsbetitems={this.props.rpsbetitems}
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
      </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  isAuthenticated: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  isDarkMode: state.auth.isDarkMode,
  isWatching: state.auth.isWatching,
  balance: state.auth.balance,
  rpsbetitems: state.logic.rpsbetitems,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  accessory: state.logic.curRoomInfo.accessory,
  username: state.logic.curRoomInfo.username,
  data: state.itemReducer.myItemArray,
  rank: state.logic.curRoomInfo.rank,
  isLowGraphics: state.auth.isLowGraphics,
  isMusicEnabled: state.auth.isMusicEnabled,
  isFocused: state.auth.isFocused,
  isMuted: state.auth.isMuted,
  is_betting: state.logic.is_betting,
});

const mapDispatchToProps = {
  openGamePasswordModal,
  acQueryMyItem,
  updateRoomBot,
  kickBots,
  setSpectateMode,
  endGame,
  getRpsBetItems,
  getRoomBotCount
};

export default connect(mapStateToProps, mapDispatchToProps)(RPS);
