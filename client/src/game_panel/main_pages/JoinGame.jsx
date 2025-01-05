import React, { Component } from 'react';
import { connect } from 'react-redux';
import TabbedContent from '../../components/TabbedContent';
import Moment from 'moment';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
import { Button, Drawer } from '@material-ui/core';
import { toggleDrawer, updateTutorialCompleted, setBalance } from '../../redux/Auth/user.actions';
import PreSummaryPanel from '../../components/PreSummaryPanel';
import CoHostModal from '../modal/CoHostModal';
import AiPanel from '../../components/AiPanel';
import RoomTokenDetails from '../../components/RoomTokenDetails';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { getCustomerStatisticsData } from '../../redux/Customer/customer.action';
import { getRank } from '../../util/getRank';
import { convertToCurrency } from '../../util/conversion';

import {
  bet,
  bet2,
  bet3,
  getRoomInfo,
  setCurRoomInfo,
  loadRoomInfo,
  fetchAccessory,
  getGameTypeList,
  updateUserStrategy,
  getRpsBetItems,
  getQbot,
  getQsBetItems,
  getStrategies,
  attachPlayerToRoom,
  detachPlayerFromRoom,
  checkPlayerAttachment,
  getAttachedRooms,
  addNewTransaction,
  coHost,
  getRoomList,
  getSolToUsdPrice
} from '../../redux/Logic/logic.actions';
import { predictNext, reinforcementAI, innovate, martingaleStrategy, patternBasedAI, counterSwitchAI, generatePattern, counterRandomness, NPC } from '../../util/predictNext';
import { predictNextQs, reinforcementAI_qs, innovate_qs, martingaleStrategy_qs, patternBasedAI_qs, counterSwitchAI_qs, generatePattern_qs, counterRandomness_qs, NPC_qs, getCopyCatItem_qs, getRandomItem_qs } from '../../util/predictNextQs';
import ChatPanel from '../ChatPanel/ChatPanel';
import { Tabs, Tab } from '@material-ui/core';
import MyGamesTable from '../MyGames/MyGamesTable';
import MyHistoryTable from '../MyGames/MyHistoryTable';
import HistoryTable from '../LiveGames/HistoryTable';
import DrawerButton from './DrawerButton';
import SupportButton from './SupportButton';
import Footer from './Footer';

import {
  validateIsAuthenticated,
  validateCreatorId,
} from '../modal/betValidations';
import { alertModal } from '../modal/ConfirmAlerts'

function updateFromNow(history) {
  const result = JSON.parse(JSON.stringify(history));
  for (let i = 0; i < result.length; i++) {
    result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
  }
  return result;
}

const customStyles = {
  tabRoot: {
    textTransform: 'none',
    width: '50%'
  }
};

class JoinGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      actionList: null,
      showPlayerModal: false,
      betting: false,
      selectedCreator: '',
      is_mobile: window.innerWidth < 1024 ? true : false,
      selectedMobileTab: 'live_games',
      roomInfo: this.props.roomInfo,
      bankroll: this.props.roomInfo.bankroll,
      limit: 10,
      cp: 0,
      selected_rps: '',
      selected_qs_position: 0,
      index: 0,
      qs_game_type: 2,
      run: false,
      currentTutorial: 2,
      selected_id: '',
      image: '',
      loading: this.props.loading,
      bgColorChanged: false,
      borderColor: '',
      gameResult: -100,
      betResult: null,
      result: 0,
      productName: '',
      coHostAmount: 0.1,
      intervalId: null,
      isMax: false,
      bet_amount: 0.0001,
      predictedBetAmount: 0,
      history: this.props.history,
      showAnimation: false,
      sounds: {
        win: new Audio('/sounds/win-sound.mp3'),
        split: new Audio('/sounds/split-sound.mp3'),
        lose: new Audio('/sounds/lose-sound.mp3'),
        start: new Audio('/sounds/start.mp3'),
        stop: new Audio('/sounds/stop.mp3'),
        select: new Audio('/sounds/select.mp3'),
        wrong: new Audio('/sounds/wrong.mp3'),
        correct: new Audio('/sounds/correct.mp3'),
        shine: new Audio('/sounds/shine.mp3'),
        ballKick: new Audio('/sounds/ball_kick.mp3'),
        grunt2: new Audio('/sounds/grunt2.mp3'),
        grunt: new Audio('/sounds/grunt.mp3'),
      },
      currentSound: null
    };
    this.isComponentMounted = false;
    this.toggleDrawer = this.toggleDrawer.bind(this);
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.history?.length === 0 ||
      (props.history &&
        current_state.history[0]['created_at'] !==
        props.history[0]['created_at'])
    ) {
      return {
        ...current_state,
        history: updateFromNow(props.history)
      };
    }
    if (current_state.roomInfo._id !== props.roomInfo._id) {
      return {
        roomInfo: props.roomInfo,
        bankroll: props.roomInfo.user_bet
      };
    }
    return null;
  }

  async componentDidMount() {
    this.isComponentMounted = true;
    const { id } = this.props.match.params;
    await this.initializeRoomData(id);
    await this.fetchAccessory();
    await this.props.checkPlayerAttachment(id);
    if (!this.props.solPrice) {
      await this.props.getSolToUsdPrice();
    }
    window.addEventListener('unload', this.handleUnload);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.user !== prevProps.user && !this.state.qBotFetched) {

      this.setState({ run: !this.props.user.completedTutorials.includes(2) });
    }

    if (prevProps.roomInfo !== this.props.roomInfo) {

      this.state.bankroll = this.props.roomInfo.user_bet;
      const qBotStatus = this.props.getQbot(this.props.roomInfo.creator_id);
      if (this.isComponentMounted && this.props.attached) {
        this.setState({ betting: true, isQbot: qBotStatus });
      }
    }
    if (prevState.bankroll !== this.state.bankroll && this.state.bankroll <= 0.0005) {

      this.state.status = 'finished';
    }

    if (prevProps.user_balance !== this.props.user_balance && this.state.gameResult !== -1 && this.state.isMax) {

      this.handleMaxButtonClick();
    }
  }

  async initializeRoomData(id) {
    try {
      await Promise.all([
        this.props.getRpsBetItems(id),
        this.props.getQsBetItems(id),
        this.loadSounds(),
        this.props.getStrategies(),
        this.props.getRoomInfo(this.props.match.params.id, this.state.limit, true)
      ]);
    } catch (error) {
      console.error('Error initializing room data:', error);
    }
  }

  async loadSounds() {
    await Promise.all(
      Object.values(this.state.sounds).map(async sound => {
        await sound.load();
      })
    );
  }

  handleUnload = () => {
    this.stopAllSounds();
  };

  componentWillUnmount() {
    window.removeEventListener('unload', this.handleUnload);
    this.isComponentMounted = false;
    clearInterval(this.interval);
  }

  stopAllSounds = () => {
    const { currentSound } = this.state;
    if (currentSound) {
      currentSound.pause();
      currentSound.currentTime = 0;
      this.setState({ currentSound: null });
    }
  };

  toggleDrawer = () => {
    this.props.toggleDrawer(!this.props.isDrawerOpen);
  };

  updateReminderTime = () => {
    this.setState({ history: updateFromNow(this.state.history) });
  };

  // manual bet
  join = async betInfo => {
    const result = await this.props.bet3({
      _id: this.props.roomInfo._id,
      user: this.props.user_id,
      game_type: this.props.roomInfo.game_type,
      ...betInfo
    });
    return result;
  };

  async fetchAccessory() {
    try {
      const creatorId = this.props.roomInfo.creator_id;

      if (!creatorId) {
        return;
      }

      const _id = creatorId.toString();
      const accessory = await this.props.fetchAccessory({ _id });
      const dp = await this.props.fetchAccessory({ _id: this.props.user_id });

      if (this.isComponentMounted && accessory.accessory.CP !== undefined) {
        this.setState({ cp: accessory.accessory.CP - dp.accessory.DP });
      }
    } catch (error) {
      console.error("Error fetching accessory:", error);
    }
  }
  // auto bet
  join2 = async betInfo => {
    const result = await this.props.bet2({
      _id: this.state.roomInfo._id,
      user: this.props.user_id,
      game_type: this.props.roomInfo.game_type,
      ...betInfo
    });
    return result;
  };

  updateSelectedRps = (selection, callback) => {
    this.setState({ selected_rps: selection }, callback);
  }
  updateSelectedQs = (position, callback) => {
    this.setState({ selected_qs_position: position }, callback);
  }

  createTransitionMatrix(betArray, smoothingFactor = 0.01, decayFactor = 0.9) {
    const transitionMatrix = {};
    const betArrayLength = betArray.length;

    for (let i = 0; i < betArrayLength - 1; i++) {
      const currentBet = betArray[i];
      const nextBet = betArray[i + 1];
      const distance = betArrayLength - i;

      if (!transitionMatrix[currentBet]) {
        transitionMatrix[currentBet] = {};
      }

      if (!transitionMatrix[currentBet][nextBet]) {
        transitionMatrix[currentBet][nextBet] = smoothingFactor * Math.pow(decayFactor, distance);
      } else {
        transitionMatrix[currentBet][nextBet] += smoothingFactor * Math.pow(decayFactor, distance);
      }
    }

    const allStates = Array.from(new Set(betArray));

    allStates.forEach((currentState) => {
      if (!transitionMatrix[currentState]) {
        transitionMatrix[currentState] = {};
      }

      allStates.forEach((nextState) => {
        if (!transitionMatrix[currentState][nextState]) {
          transitionMatrix[currentState][nextState] = smoothingFactor;
        }
      });
    });

    Object.keys(transitionMatrix).forEach((currentState) => {
      const possibleNextStates = Object.keys(transitionMatrix[currentState]);

      possibleNextStates.forEach((nextState) => {
        transitionMatrix[currentState][nextState] += smoothingFactor;
      });
    });

    return transitionMatrix;
  }


  chooseRandomIndex(probabilities) {
    const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0);
    const randomValue = Math.random() * totalProbability;

    let cumulativeProbability = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProbability += probabilities[i];
      if (randomValue <= cumulativeProbability) {
        return i;
      }
    }

    return probabilities.length - 1;
  }

  async predictNextBetAmount(betArray, penultimateSameAsLast, smoothingFactor = 0.01, randomnessFactor = 0.2, threshold = 0.0005) {
    if (betArray.length < 2) {
      return null;
    }

    const allStates = Array.from(new Set(betArray));

    if (penultimateSameAsLast !== 0) {
      if (penultimateSameAsLast >= 3) {
        // Return the highest value from allStates without 50%
        const maxState = Math.max(...allStates);
        return Math.min(Math.max(maxState, 0.05), this.state.bankroll);
      } else if (penultimateSameAsLast === 2) {
        // Return the second highest value from allStates
        const sortedStates = allStates.sort((a, b) => b - a);

        if (sortedStates.length >= 2) {
          const secondHighestState = sortedStates[this.state.index] || sortedStates[0];
          this.setState({ index: this.state.index + 1 });
          return Math.min(Math.max(secondHighestState, 0.05), this.props.roomInfo.bet_amount);
        } else {
          // If there is no second state, return the first state from allStates
          const firstState = sortedStates[0];
          return Math.min(Math.max(firstState, 0.05), this.props.roomInfo.bet_amount);
        }
      } else if (penultimateSameAsLast === 1) {
        this.setState({ index: 0 });

        // Return the lowest value from allStates
        const minState = Math.min(...allStates);
        return Math.min(Math.max(minState, 0.05), this.props.roomInfo.bet_amount);
      }
    }

    const transitionMatrix = await this.createTransitionMatrix(betArray, smoothingFactor);
    const lastBet = betArray[betArray.length - 1];
    const possibleNextStates = transitionMatrix[lastBet] ? Object.keys(transitionMatrix[lastBet]) : [];

    if (possibleNextStates.length === 0) {
      const fallbackState = allStates[Math.floor(Math.random() * betArray.length)];
      const returnValue = Math.min(Math.max(fallbackState, threshold), this.props.roomInfo.bet_amount);
      return Math.max(returnValue, 0.05);
    }

    const adjustedProbabilities = possibleNextStates.map(
      (nextState) => transitionMatrix[lastBet][nextState] + Math.random() * randomnessFactor
    );

    const nextStateIndex = this.chooseRandomIndex(adjustedProbabilities);
    const nextState = possibleNextStates[nextStateIndex];

    // Ensure the return value is at least 0.05
    const returnValue = Math.min(Math.max(nextState, threshold), this.props.roomInfo.bet_amount);
    return Math.max(returnValue, 0.05);
  }

  handleSwitchChange = async () => {
    const {
      auth,
      isDarkMode,
      user_id,
      roomInfo,
    } = this.props;
    const { betting } = this.state;

    let betArray = [];


    if (!validateIsAuthenticated(auth, isDarkMode)) {
      return;
    }
    if (!validateCreatorId(roomInfo.creator_id, user_id, isDarkMode)) {
      return;
    }

    if (betting) {
      this.stopBetting();
    } else {
      this.playSound('start');
      this.setState({ betting: true });

      if (!this.props.attached) {

        this.startBetting(betArray);
      }

    }
  };

  startBetting = async betArray => {
    const { bankroll } = this.state;
    const { isDarkMode, openGamePasswordModal, roomInfo, user_balance, getRpsBetItems, getQsBetItems } = this.props;
    const interval = this.props.ai_mode === 'Adam' || this.props.ai_mode === 'Sniper' ? 6200 :
      this.props.ai_mode === 'Skill-issue' || this.props.ai_mode === 'Innovate' ? 3000 :
        5000;

    const intervalId = setInterval(async () => {
      try {
        let randomItem;
        let predictedBetAmount;

        await getRpsBetItems(roomInfo._id);
        await getQsBetItems(roomInfo._id);
        switch (roomInfo.game_type) {
          case 'Quick Shoot':
            if (this.props.qsbetitems && this.props.qsbetitems.length > 0) {
              if (this.props.ai_mode === 'Random') {
                randomItem = await getRandomItem_qs(roomInfo.qs_game_type);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Adam') {
                const nextMove = await reinforcementAI_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                randomItem = nextMove.move;
                predictedBetAmount = await this.predictNextBetAmount(betArray, nextMove.risk, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Sniper') {
                const nextMove = await reinforcementAI_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                randomItem = nextMove.move;
                predictedBetAmount = nextMove.risk === 4 ? (this.props.user_balance < bankroll ? this.props.user_balance : bankroll) : Math.min(...betArray);
              } else if (this.props.ai_mode === 'Hertz') {
                randomItem = await patternBasedAI_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Feedback') {
                randomItem = await counterSwitchAI_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Innovate') {
                const randomnessResult = await innovate_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                randomItem = randomnessResult.counterMove;
                const penultimateSameAsLast = randomnessResult.risk;
                const predictedBet = await this.predictNextBetAmount(betArray, penultimateSameAsLast, 0.01, 0.2);
                predictedBetAmount = penultimateSameAsLast === 1
                  ? Math.max(predictedBet / 5, 0.1)
                  : predictedBet;
              } else if (this.props.ai_mode === 'Skill-issue-old' || this.props.ai_mode === 'Skill-issue') {
                const randomnessResult = await counterRandomness_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                randomItem = randomnessResult.counterMove;
                const penultimateSameAsLast = randomnessResult.risk;
                if (this.props.ai_mode === 'Skill-issue-old') {
                  predictedBetAmount = await this.predictNextBetAmount(betArray, penultimateSameAsLast, 0.01, 0.2);
                } else if (this.props.ai_mode === 'Skill-issue') {

                  if (penultimateSameAsLast !== 3) {
                    const outcome = await martingaleStrategy_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                    predictedBetAmount = outcome.lastResult === 'loss' || outcome.lastResult === 'draw' ? this.props.qsbetitems[0].bet_amount * 1.4 : Math.min(...betArray);
                  } else {
                    predictedBetAmount = await this.predictNextBetAmount(betArray, penultimateSameAsLast, 0.01, 0.2);
                  }
                  if (predictedBetAmount > this.props.user_balance / 2) {
                    predictedBetAmount = this.props.user_balance / 4;
                  }
                }

              } else if (this.props.ai_mode === 'NPC') {
                randomItem = await NPC_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Tesla') {
                randomItem = await generatePattern_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'CopyCat') {
                randomItem = await getCopyCatItem_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Hidden Markov') {
                if (this.props.qsbetitems.length > 0) {
                  const transformedItems = this.props.qsbetitems.map(item => ({ qs: item.joiner_qs }));
                  randomItem = await predictNextQs(transformedItems, roomInfo.qs_game_type);
                }
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Markov') {
                randomItem = await predictNextQs(this.props.qsbetitems, roomInfo.qs_game_type);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Martingale') {
                const outcome = await martingaleStrategy_qs(this.props.qsbetitems, roomInfo.qs_game_type);
                randomItem = outcome.move;
                predictedBetAmount = outcome.lastResult === 'loss' || outcome.lastResult === 'draw' ? this.props.qsbetitems[0].bet_amount * 2 : Math.min(...betArray);
              }
            }
            break;

          default:
            // RPS
            if (this.props.rpsbetitems && this.props.rpsbetitems.length > 0) {
              if (this.props.ai_mode === 'Random') {
                const randomIndex = Math.floor(Math.random() * 3);
                const rpsOptions = ['R', 'P', 'S'];
                randomItem = rpsOptions[randomIndex];
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Adam') {
                const nextMove = await reinforcementAI(this.props.rpsbetitems);
                randomItem = nextMove.move;
                predictedBetAmount = await this.predictNextBetAmount(betArray, nextMove.risk, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Sniper') {
                const nextMove = await reinforcementAI(this.props.rpsbetitems);
                randomItem = nextMove.move;
                predictedBetAmount = nextMove.risk === 4 ? (this.props.user_balance < bankroll ? this.props.user_balance : bankroll) : Math.min(...betArray);
              } else if (this.props.ai_mode === 'Hertz') {
                randomItem = await patternBasedAI(this.props.rpsbetitems);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Innovate') {
                const randomnessResult = await innovate(this.props.rpsbetitems);
                randomItem = randomnessResult.counterMove;
                const penultimateSameAsLast = randomnessResult.risk;
                const predictedBet = await this.predictNextBetAmount(betArray, penultimateSameAsLast, 0.01, 0.2);
                predictedBetAmount = penultimateSameAsLast === 1
                  ? Math.max(predictedBet / 5, 0.1)
                  : predictedBet;
              } else if (this.props.ai_mode === 'Feedback') {
                randomItem = await counterSwitchAI(this.props.rpsbetitems);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Skill-issue-old' || this.props.ai_mode === 'Skill-issue') {
                const randomnessResult = await counterRandomness(this.props.rpsbetitems);
                randomItem = randomnessResult.counterMove;
                const penultimateSameAsLast = randomnessResult.risk;
                if (this.props.ai_mode === 'Skill-issue-old') {
                  predictedBetAmount = await this.predictNextBetAmount(betArray, penultimateSameAsLast, 0.01, 0.2);
                } else if (this.props.ai_mode === 'Skill-issue') {
                  const outcome = await martingaleStrategy(this.props.rpsbetitems);
                  if (penultimateSameAsLast === 3) {
                    predictedBetAmount = outcome.lastResult === 'loss' || outcome.lastResult === 'draw' ? this.props.rpsbetitems[0].bet_amount * 1.4 : Math.min(...betArray);
                  } else {
                    predictedBetAmount = await this.predictNextBetAmount(betArray, penultimateSameAsLast, 0.01, 0.2);
                  }
                  if (predictedBetAmount > this.props.user_balance / 2) {
                    predictedBetAmount = this.props.user_balance / 4;
                  }
                }
              } else if (this.props.ai_mode === 'NPC') {
                randomItem = await NPC(this.props.rpsbetitems);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Tesla') {
                randomItem = await generatePattern(this.props.rpsbetitems);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'CopyCat') {
                const copyCatBetItem = this.props.rpsbetitems[0];
                if (copyCatBetItem) {
                  randomItem = copyCatBetItem.rps;
                } else {
                  const randomIndex = Math.floor(Math.random() * 3);
                  const rpsOptions = ['R', 'P', 'S'];
                  randomItem = rpsOptions[randomIndex];
                }
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Hidden Markov') {
                if (this.props.rpsbetitems.length > 0) {
                  const transformedItems = this.props.rpsbetitems.map(item => ({ rps: item.joiner_rps }));
                  randomItem = await predictNext(transformedItems);
                }
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Markov') {
                randomItem = await predictNext(this.props.rpsbetitems, true);
                predictedBetAmount = await this.predictNextBetAmount(betArray, 0, 0.01, 0.2);
              } else if (this.props.ai_mode === 'Martingale') {
                const outcome = await martingaleStrategy(this.props.rpsbetitems);
                randomItem = outcome.move;
                predictedBetAmount = outcome.lastResult === 'loss' || outcome.lastResult === 'draw' ? this.props.rpsbetitems[0].bet_amount * 2 : Math.min(...betArray);
              }
            }
            break;
        }
        const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
        const passwordCorrect = rooms[roomInfo._id];
        if (roomInfo.is_private === true && passwordCorrect !== true) {
          openGamePasswordModal();
        } else {
          await this.joinGame2(randomItem, predictedBetAmount);
        }
      } catch (error) {
        console.error('Error in interval function:', error);
      }
    }, interval);
    this.setState({ intervalId });
  };

  stopBetting = async () => {
    try {
      this.playSound('stop');
      clearInterval(this.state.intervalId);
      this.setState({ intervalId: null, betting: false, timerValue: 2000 });
      if (this.props.attached) {
        this.handleDetachAttachChange(this.props.roomInfo._id);
      }

    } catch (error) {
      console.error("Error detaching player:", error);
    }
  };

  changeBgColor = async result => {
    this.setState({ betResult: result }, async () => {
      const flickerCount = 3;
      const delay = 50;

      for (let i = 0; i < flickerCount; i++) {
        this.setState({ bgColorChanged: i % 2 === 0 });
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      this.setState({ bgColorChanged: false, betResult: null });
    });
  };

  changeBgColorQs = async result => {
    this.setState({ betResult: result, bgColorChanged: true }, async () => {
      let borderColor = '';
      let defaultColor = '';
      if (this.props.roomInfo.game_type === 'Mystery Box') {
        defaultColor = '#ffd000';
      } else {
        defaultColor = 'grey';
      }

      switch (result) {
        case 1:
          borderColor = '#49ff08';
          break;
        case -1:
          borderColor = '#ffd000';
          break;
        default:
          borderColor = defaultColor;
          break;
      }

      this.setState({ borderColor });
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.setState({ borderColor: '', bgColorChanged: false, betResult: null });
    });
  };

  joinGame2 = async (randomItem, predictedBetAmount) => {
    const { balance, solPrice, isMuted, roomInfo, getRpsBetItems, getQsBetItems } = this.props;
    let { betting, selected_qs_position, selected_rps, selected_id, bankroll } = this.state;
    const gameType = roomInfo.game_type;
    if (!betting) {
      return;
    }

    if (roomInfo.status !== 'open') {
      return;
    }

    if (gameType === 'RPS') {
      selected_rps = randomItem;
    } else if (gameType === 'Quick Shoot') {
      selected_qs_position = parseInt(randomItem);
    }

    this.setState({ selected_rps, result: '', predictedBetAmount, selected_qs_position, selected_id }, async () => {

      let result;
      try {
        if (gameType === 'RPS') {
          result = await this.join2({
            bet_amount: parseFloat(predictedBetAmount),
            selected_rps: selected_rps,
          });

        }
        else if (gameType === 'Quick Shoot') {


          result = await this.join2({
            bet_amount: parseFloat(predictedBetAmount),
            selected_qs_position: selected_qs_position,
          });
          if (result.status === 'success' && !isMuted) {
            this.playSound('ballKick');
          }
        }

        if (result && result.status === 'success') {
          let text;
          let color;

          if (result.betResult === 1) {
            this.playSound('win');
            text = '+';
            color = '#7ed321';
            if (gameType === 'Quick Shoot') {
              this.changeBgColorQs(result.betResult);
            } else {
              this.changeBgColor(result.betResult);
            }
          } else if (result.betResult === 0) {
            this.playSound('split');
            text = '-';
            color = 'grey';
            if (gameType === 'Quick Shoot') {
              this.changeBgColorQs(result.betResult);
            } else {
              this.changeBgColor(result.betResult);
            }
          } else {
            if (gameType === 'Quick Shoot') {
              this.changeBgColorQs(result.betResult);
            } else {
              this.changeBgColor(result.betResult);
            }
            text = '-';
            color = '#f50000';
            this.playSound('lose');
          }
          const currencyElement = convertToCurrency(Math.abs(result.amount), solPrice);
          const fragmentStyle = {
            color: color,
          };
          this.onChangeState({
            result: (
              <React.Fragment>
                <span style={fragmentStyle}> {text} {currencyElement}</span>
              </React.Fragment>
            ), gameResult: result.betResult
          });
          await getRpsBetItems(roomInfo._id)
          await getQsBetItems(roomInfo._id)
        }
      } catch (error) {
        console.error('Error in joinGame2:', error);
      }
    });
  };

  playSound = sound => {
    if (!this.props.isMuted || !this.props.gameSounds) {
      const audio = this.state.sounds[sound];

      if (audio && audio.paused !== undefined) {
        if (!audio.paused) {
          return;
        }
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log(`Error playing sound "${sound}":`, error);
          });
        }
        this.setState({ currentSound: audio });
      }
    }
  };

  handleCoHostAmountChange = event => {
    this.setState({ coHostAmount: event.target.value });
  };

  onChangeState = async newState => {
    await this.setState(newState);
  };

  stopSound = sound => {
    const { currentSound } = this.state;
    if (currentSound && currentSound.src.includes(sound)) {
      currentSound.pause();
      currentSound.currentTime = 0;
      this.setState({ currentSound: null });
    }
  };

  handleDetachAttachChange = () => {
    const { rpsbetitems, qsbetitems, roomInfo, attachPlayerToRoom, detachPlayerFromRoom, attached } = this.props;
    const gameType = roomInfo.game_type;
    const items = gameType === "RPS" ? rpsbetitems : qsbetitems;

    if (!Array.isArray(items)) {
      console.error("Items is not an array:", items);
      return;
    }

    const uniqueBetAmounts = [...new Set(items.map(item => item.bet_amount))];

    if (attached) {
      detachPlayerFromRoom(roomInfo._id)
        .then((result) => {
          if (result) {
            this.startBetting(uniqueBetAmounts);
            this.props.checkPlayerAttachment(roomInfo._id);
          }
        })
        .catch((error) => console.error("Error detaching player:", error));
    } else {
      attachPlayerToRoom(roomInfo._id, uniqueBetAmounts)
        .then(() => {
          clearInterval(this.state.intervalId);
          this.setState({ intervalId: null, timerValue: 2000 });
        })
        .catch((error) => console.error("Error attaching player:", error));
    }
  };

  handleJoyrideCallback = (data) => {
    const { status, type } = data;

    if (status === 'finished' || status === 'skipped') {
      const { currentTutorial } = this.state;
      this.props.updateTutorialCompleted(currentTutorial);
      this.setState({ run: false });
    }
  };

  handleSendCoHost = async () => {
    const { coHostAmount } = this.state;
    const { user_balance, roomInfo, isDarkMode, setBalance, addNewTransaction, getRoomList } = this.props;

    try {
      if (coHostAmount <= 0) {
        alertModal(isDarkMode, 'R U FURR-REAL? AMOUNT MUST BE MORE THAN 0!');
        return;
      }

      if (coHostAmount > user_balance) {
        alertModal(isDarkMode, 'NOT ENUFF FUNDS AT THIS MEOWMENT');
        return;
      }

      const result = await this.props.coHost(coHostAmount, roomInfo._id);

      if (result.success) {
        setBalance(result.balance);
        addNewTransaction(result.newTransaction);
        await getRoomList({
          pageSize: this.state.roomList.length,
          game_type: roomInfo.game_type,
        });
      } else {
        alertModal(isDarkMode, result.message);
      }
    } catch (e) {
      alertModal(isDarkMode, 'ROOM TOO BUSY, TRY AGAIN LATER');
    }
  };

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  refreshHistory = async () => {
    await this.props.getRoomInfo(
      this.props.match.params.id,
      this.state.limit,
      false
    );
  };

  showOpenGameOrHistory = (e, newValue) => {
    e.preventDefault();
    this.setState({
      show_open_game: newValue
    });
  };

  getActiveTabText = () =>
    (this.state.is_mobile && this.state.selectedMobileTab === 'live_games') ||
      (!this.state.is_mobile && this.props.selectedMainTabIndex === 0) ? (
      <div id="liveStakes">
        {this.props.roomCount} LIVE GAMES
      </div>
    ) : (
      'Your Games'
    );

  handleHalfXButtonClick = () => {
    const multipliedBetAmount = this.state.bet_amount * 0.5;
    this.setState({ bet_amount: multipliedBetAmount, isMax: false }, () => {
      document.getElementById('betamount').focus();
    });
  };

  handle2xButtonClick = () => {
    const maxBetAmount = this.props.user_balance;
    const multipliedBetAmount = this.state.bet_amount * 2;
    const limitedBetAmount = Math.min(multipliedBetAmount, maxBetAmount);
    
    this.setState({ bet_amount: limitedBetAmount, isMax: false }, () => {
      document.getElementById('betamount').focus();
    });
  };

  handleMaxButtonClick = () => {
    const maxBetAmount = Math.min(this.props.user_balance, this.state.bankroll);
    this.setState({ bet_amount: maxBetAmount, isMax: true }, () => {
      document.getElementById('betamount').focus();
    });
  };

  render() {
    const {
      showPlayerModal,
      is_mobile,
      selectedCreator,
      actionList,
      show_open_game,
      predictedBetAmount,
      selectedMobileTab,
      betting,
      betResult,
      borderColor,
      bankroll,
      bgColorChanged,
      selected_rps,
      selected_qs_position,
      result,
      isQbot,
      cp,
      run
    } = this.state;
    const {
      roomInfo,
      gameTypeList,
      isDrawerOpen,
      is_betting,
      user_id,
      user_balance,
      creator_accessory,
      strategies,
      ai_mode,
      user,
      selectedMainTabIndex,
      rpsbetitems,
      qsbetitems,
      total_wagered,
      isDarkMode,
      attached,
      getAttachedRooms,
      creator_avatar,
      username,
      solPrice,
      rank
    } = this.props;

    const payoutPercentage = isNaN((bankroll / roomInfo.endgame_amount) * 100)
      ? 0
      : (bankroll / roomInfo.endgame_amount) * 100;

    const barStyle = {
      width: `${payoutPercentage}%`,
      backgroundColor: payoutPercentage <= 50 ? 'yellow' : 'red'
    };

    const isLowBankroll = bankroll <= 0.01;
    const isHighCommission = cp > 16;
    const isLowProfit = (roomInfo.host_pr - roomInfo.total_stakes) > 0;
    const hostProfit = parseFloat(roomInfo.host_pr) || 0;
    const totalStakes = parseFloat(roomInfo?.total_stakes) || 0;
    const winChance =
      roomInfo.game_type === 'Quick Shoot'
        ? (((roomInfo.qs_game_type - 1) / roomInfo.qs_game_type) * 100).toFixed(2)
        : 33;

    const maxBankroll = 80;
    const progressPercentage = Math.min((bankroll / maxBankroll) * 100, 100).toFixed(2);


    return (
      <>

        <div
          className="main-game join"
          style={{
            gridTemplateColumns: this.props.isDrawerOpen
              ? '260px calc(100% - 610px) 350px'
              : 'calc(100% - 350px) 350px'
          }}
        >
          {((is_mobile && selectedMobileTab === 'chat') || !is_mobile) && (
            <Drawer
              className="mat-chat"
              style={{ display: isDrawerOpen ? 'flex' : 'none' }}
              variant="persistent"
              anchor="left"
              open={isDrawerOpen}
            >
              <ChatPanel />
            </Drawer>
          )}
          {!is_mobile &&
            (!selectedMobileTab === 'live_games' ||
              !selectedMobileTab === 'my_games') && (
              <Tabs
                value={show_open_game}
                onChange={this.showOpenGameOrHistory}
                TabIndicatorProps={{ style: { background: '#ff0000' } }}
                className="main-game-page-tabs"
                isDarkMode={isDarkMode}
                selectedRow={roomInfo}
                balance={user_balance}
                user={user}
              >
                <Tab
                  label={
                    selectedMobileTab === 'live_games'
                      ? 'Live Battles'
                      : 'Your Games'
                  }
                  style={customStyles.tabRoot}
                />
                <Tab label="History" style={customStyles.tabRoot} />
              </Tabs>
            )}

          <div className="main-panel" style={{margin: '8px'}}>
            <PreSummaryPanel
              status={roomInfo.status}
              bankroll={bankroll}
              isDarkMode={isDarkMode}
              solPrice={solPrice}
              cp={cp}
              isQbot={isQbot}
              winChance={winChance}
              barStyle={barStyle}
              roomInfo={roomInfo}
              handleOpenPlayerModal={this.handleOpenPlayerModal}
              creator_id={roomInfo.creator_id}
              creator_avatar={creator_avatar}
              username={username}
              rank={rank}
              accessory={creator_accessory}
              rps_game_type={roomInfo.rps_game_type}
              qs_game_type={roomInfo.qs_game_type}
              endgame_type={roomInfo.endgame_type}
              pr={roomInfo.pr}
              isLowBankroll={isLowBankroll}
              isHighCommission={isHighCommission}
              isLowProfit={isLowProfit}
              hostProfit={hostProfit}
              totalStakes={totalStakes}
              bet_amount={this.state.bet_amount}
            />
            <TabbedContent
              changeBgColor={this.changeBgColor}
              bgColorChanged={bgColorChanged}
              betting={betting}
              strategies={strategies}
              result={result}
              solPrice={solPrice}
              ai_mode={ai_mode}
              getAttachedRooms={getAttachedRooms}
              handleDetachAttachChange={this.handleDetachAttachChange}
              onChangeState={this.onChangeState}
              cp={cp}
              bet_amount={this.state.bet_amount}
              is_mobile={this.state.is_mobile}
              gameResult={this.state.gameResult}
              rpsbetitems={rpsbetitems}
              attached={attached}
              run={run}
              updateSelectedRps={this.updateSelectedRps}
              selected_rps={selected_rps}
              handleJoyrideCallback={this.handleJoyrideCallback}
              refreshHistory={this.refreshHistory}
              playSound={this.playSound}
              join={this.join}
              handleSwitchChange={this.handleSwitchChange}
              betResult={betResult}
              roomInfo={roomInfo}
              rps_game_type={roomInfo.rps_game_type}
              user_id={user_id}
              rank={getRank(total_wagered)}
              handleOpenPlayerModal={this.handleOpenPlayerModal}
              handleClosePlayerModal={this.handleClosePlayerModal}
              selectedCreator={selectedCreator}
              showPlayerModal={showPlayerModal}
              creator_id={roomInfo.creator_id}
              pr={roomInfo.pr}
              updateUserStrategy={this.props.updateUserStrategy}
              bankroll={bankroll}
              predictedBetAmount={predictedBetAmount}
              is_private={roomInfo.is_private}
              isDarkMode={this.props.isDarkMode}
              endgame_type={roomInfo.endgame_type}
              actionList={actionList}
              getRoomData={this.getRoomData}
              user={this.props.user}
              coHostAmount={this.state.coHostAmount}
              getRoomInfo={this.props.getRoomInfo}
              balance={this.props.user_balance}
              isLowGraphics={this.props.isLowGraphics}
              handleCoHostAmountChange={this.handleCoHostAmountChange}
              handleSendCoHost={this.handleSendCoHost}
              has_joined={true}
              borderColor={borderColor}
              updateSelectedQs={this.updateSelectedQs}
              qsbetitems={qsbetitems}
              qs_game_type={roomInfo.qs_game_type}
              selected_qs_position={selected_qs_position}
            />
            <div>
              {((!is_mobile && selectedMainTabIndex === 1) ||
                (is_mobile &&
                  selectedMobileTab === 'my_games' &&
                  show_open_game === 0)) && (
                  <MyGamesTable gameTypeList={gameTypeList} />
                )}
              {is_mobile &&
                selectedMobileTab === 'live_games' &&
                show_open_game === 1 && <HistoryTable userId={user_id} />}
              {is_mobile &&
                selectedMobileTab === 'my_games' &&
                show_open_game === 1 && <MyHistoryTable />}
            </div>
          </div>
          <div className="sub-panel">

            {!this.state.is_mobile &&
              this.props.selectedMainTabIndex === 0 && (
                <>
                  <AiPanel
                    handleDetachAttachChange={this.handleDetachAttachChange}
                    rpsbetitems={this.props.rpsbetitems}
                    qsbetitems={this.props.qsbetitems}
                    updateUserStrategy={this.props.updateUserStrategy}
                    strategies={strategies}
                    betting={betting}
                    bet_amount={this.state.bet_amount}
                    handle2xButtonClick={this.handle2xButtonClick}
                    handleHalfXButtonClick={this.handleHalfXButtonClick}
                    handleMaxButtonClick={this.handleMaxButtonClick}
                    onChangeState={this.onChangeState}
                    bankroll={this.state.bankroll}
                    is_betting={is_betting}
                    attached={attached}
                    creator_id={roomInfo.creator_id}
                    getAttachedRooms={getAttachedRooms}
                    predictedBetAmount={predictedBetAmount}
                    roomId={roomInfo._id}
                    handleSwitchChange={this.handleSwitchChange}
                    game_type={roomInfo.game_type}
                    rank={getRank(total_wagered)}
                    qs_game_type={roomInfo.qs_game_type}
                    user_id={user_id}
                    ai_mode={ai_mode}
                    user_balance={user_balance}
                    isDarkMode={isDarkMode}
                  />
                  <CoHostModal
                    isDarkMode={this.props.isDarkMode}
                    coHostAmount={this.state.coHostAmount}
                    selectedRow={roomInfo}
                    balance={this.props.balance}
                    solPrice={solPrice}
                    user={this.props.user}
                    togglePopup={this.togglePopup}
                    handleClose={this.handleCloseCoHostModal}
                    handleSendCoHost={this.props.handleSendCoHost}
                    handleCoHostAmountChange={this.handleCoHostAmountChange}
                    has_joined={this.props.has_joined}
                    input_only={true}
                  />
                  
                  <RoomTokenDetails progressPercentage={progressPercentage} handleOpenPlayerModal={this.handleOpenPlayerModal} roomInfo={roomInfo} />

                </>

              )}

            <DrawerButton
              open={isDrawerOpen}
              toggleDrawer={this.toggleDrawer}
            />
            {/* <SupportButton
              open={this.props.isSupportOpen}
            // toggleDrawer={this.toggleDrawer}
            /> */}
            {!is_mobile && selectedMainTabIndex === 1 && <MyHistoryTable />}
          </div>
          {!is_mobile && (
            <div className="mobile-only main-page-nav-button-group">
              <Button
                className={`mobile-tab-live ${selectedMobileTab === 'live_games' ? 'active' : ''
                  }`}
                onClick={e => {
                  this.setState({ selectedMobileTab: 'live_games' });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="none"
                  viewBox="0 0 32 32"
                >
                  <path
                    stroke={
                      selectedMobileTab === 'live_games' ? '#fff' : '#8E9297'
                    }
                    strokeWidth="1.5"
                    d="M24.9 25.945c2.625-2.578 4.1-6.076 4.1-9.722 0-3.647-1.475-7.144-4.1-9.723M7.1 25.945C4.476 23.367 3 19.87 3 16.223 3 12.576 4.475 9.079 7.1 6.5M21 22.5c1.92-1.658 3-3.906 3-6.25s-1.08-4.592-3-6.25M14 17.678v-3.356c0-.79.871-1.268 1.537-.844l2.637 1.678c.618.393.618 1.295 0 1.688l-2.637 1.678c-.666.424-1.537-.055-1.537-.844zM11 22.5c-1.92-1.658-3-3.906-3-6.25s1.08-4.592 3-6.25"
                  />
                </svg>
                {selectedMobileTab === 'live_games' && 'LIVE GAMES'}
              </Button>
              <Button
                className={`mobile-tab-my ${selectedMobileTab === 'my_games' ? 'active' : ''
                  }`}
                onClick={e => {
                  this.setState({ selectedMobileTab: 'my_games' });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="33"
                  height="32"
                  fill="none"
                  viewBox="0 0 33 32"
                >
                  <path
                    stroke={
                      selectedMobileTab === 'my_games' ? '#fff' : '#8E9297'
                    }
                    strokeWidth="1.5"
                    d="M27.5 27.5c0-2.917-1.159-5.715-3.222-7.778-2.063-2.063-4.86-3.222-7.778-3.222-2.917 0-5.715 1.159-7.778 3.222C6.659 21.785 5.5 24.582 5.5 27.5"
                  />
                  <path
                    fill={
                      selectedMobileTab === 'my_games' ? '#fff' : '#8E9297'
                    }
                    d="M18.651 12.702l-.674.33.674-.33zm-.294-.602l.674-.33c-.126-.257-.387-.42-.674-.42v.75zm-3.714 0v-.75c-.287 0-.548.163-.674.42l.674.33zm7.607-4.75v4.302h1.5V7.35h-1.5zm-2.925 5.022l-.294-.601-1.348.658.294.602 1.348-.659zm-.968-1.022h-3.714v1.5h3.714v-1.5zm-4.388.42l-.294.602 1.348.66.294-.603-1.348-.658zm-3.219-.118V7.35h-1.5v4.302h1.5zm2.036-6.402h7.428v-1.5h-7.428v1.5zm-.49 8c-.838 0-1.546-.7-1.546-1.598h-1.5c0 1.695 1.348 3.098 3.046 3.098v-1.5zm8.408 0c-.576 0-1.113-.333-1.379-.878l-1.348.66c.512 1.046 1.565 1.718 2.727 1.718v-1.5zm1.546-1.598c0 .899-.708 1.598-1.546 1.598v1.5c1.698 0 3.046-1.403 3.046-3.098h-1.5zm-8.575.72c-.266.545-.803.878-1.38.878v1.5c1.163 0 2.216-.672 2.728-1.719l-1.348-.659zM23.75 7.35c0-1.972-1.567-3.6-3.536-3.6v1.5c1.109 0 2.036.924 2.036 2.1h1.5zm-13 0c0-1.176.928-2.1 2.036-2.1v-1.5c-1.969 0-3.536 1.628-3.536 3.6h1.5zm1.571 1.7h2.786v-1.5h-2.786v1.5zm.643-2.175v2.85h1.5v-2.85h-1.5zM19.75 8.1h.929V6.6h-.929v1.5zM17.893 10h.928V8.5h-.928V10z"
                  />
                </svg>
                {selectedMobileTab === 'my_games' && 'YOUR GAMES'}
              </Button>
              <button
                className={`mobile-tab-marketplace ${selectedMobileTab === 'marketplace' ? 'active' : ''
                  }`}
                onClick={e => {
                  this.setState({ selectedMobileTab: 'marketplace' });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  fill="none"
                  viewBox="0 0 32 32"
                >
                  <path
                    stroke={
                      selectedMobileTab === 'marketplace' ? '#fff' : '#8E9297'
                    }
                    strokeWidth="1.5"
                    d="M10.083 6.083h11.833v8.584c0 3.268-2.649 5.917-5.916 5.917-3.268 0-5.917-2.65-5.917-5.917V6.083zM9.333 26.666h13.333M22.223 14.597c3.528-.571 4.444-4.538 4.444-6.597H22M9.777 14.597C6.25 14.026 5.333 10.06 5.333 8H10M16 21.334v5.333"
                  />
                </svg>
                {selectedMobileTab === 'marketplace' && 'MARKETPLACE'}
              </button>
              <Button
                className={`mobile-tab-chat ${selectedMobileTab === 'chat' ? 'active' : ''
                  }`}
                onClick={e => {
                  this.setState({ selectedMobileTab: 'chat' });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="33"
                  height="32"
                  fill="none"
                  viewBox="0 0 33 32"
                >
                  <path
                    stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                    strokeWidth="1.5"
                    d="M28 16c0 6.351-5.149 11.5-11.5 11.5-1.407 0-2.754-.253-4-.715-2.75-1.02-4.091 1.378-4.75.965-.685-.43 1.328-2.929.75-3.489C6.342 22.171 5 19.242 5 16 5 9.649 10.149 4.5 16.5 4.5S28 9.649 28 16z"
                  />
                  <circle
                    cx="10.5"
                    cy="16"
                    r="2"
                    stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="16.5"
                    cy="16"
                    r="2"
                    stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="22.5"
                    cy="16"
                    r="2"
                    stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                    strokeWidth="1.5"
                  />
                </svg>
                {selectedMobileTab === 'chat' && 'CHAT'}
              </Button>
            </div>
          )}
          <Footer
            className="footer"
            open={isDrawerOpen}
            style={{ marginLeft: isDrawerOpen ? '270px' : '0' }}
          />
        </div>
      </>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  history: state.logic.history,
  strategies: state.logic.strategies,
  roomInfo: state.logic.curRoomInfo,
  rpsbetitems: state.logic.rpsbetitems,
  qsbetitems: state.logic.qsbetitems,
  user_id: state.auth.user._id,
  total_wagered: state.auth.user.totalWagered,
  rank: state.logic.curRoomInfo.rank,
  user: state.auth.user,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  creator_accessory: state.logic.curRoomInfo.accessory,
  username: state.logic.curRoomInfo.username,
  accessory: state.auth.user.accessory,
  user_balance: state.auth.user.balance,
  ai_mode: state.auth.user.ai_mode,
  isMuted: state.auth.isMuted,
  gameSounds: state.auth.gameSounds,
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
  isDrawerOpen: state.auth.isDrawerOpen,
  loading: state.logic.isActiveLoadingOverlay,
  isDarkMode: state.auth.isDarkMode,
  isLowGraphics: state.auth.isLowGraphics,
  is_betting: state.logic.is_betting,
  attached: state.logic.attached,
  solPrice: state.logic.solPrice
});

const mapDispatchToProps = {
  getRoomInfo,
  getStrategies,
  bet,
  bet2,
  bet3,
  setCurRoomInfo,
  loadRoomInfo,
  detachPlayerFromRoom,
  attachPlayerToRoom,
  checkPlayerAttachment,
  updateUserStrategy,
  addNewTransaction,
  setBalance,
  coHost,
  getQbot,
  getRoomList,
  getRoomStatisticsData,
  getAttachedRooms,
  toggleDrawer,
  getGameTypeList,
  getRpsBetItems,
  getQsBetItems,
  openGamePasswordModal,
  getCustomerStatisticsData,
  fetchAccessory,
  updateTutorialCompleted,
  getSolToUsdPrice
};

export default connect(mapStateToProps, mapDispatchToProps)(JoinGame);
