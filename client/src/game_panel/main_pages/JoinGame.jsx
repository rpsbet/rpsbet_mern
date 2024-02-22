import React, { Component } from 'react';
import { connect } from 'react-redux';
import TabbedContent from '../../components/TabbedContent';
import Moment from 'moment';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
import { Button, Drawer, LinearProgress } from '@material-ui/core';
import LoadingOverlay from 'react-loading-overlay';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import RPS from '../JoinGame/RPS';
import Blackjack from '../JoinGame/Blackjack';
import Spleesh from '../JoinGame/Spleesh';
import MysteryBox from '../JoinGame/MysteryBox';
import BrainGame from '../JoinGame/BrainGame';
import QuickShoot from '../JoinGame/QuickShoot';
import DropGame from '../JoinGame/DropGame';
import Bang from '../JoinGame/Bang';
import AiPanel from '../../components/AiPanel';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { getCustomerStatisticsData } from '../../redux/Customer/customer.action';
import Roll from '../JoinGame/Roll';
import {
  bet,
  getRoomInfo,
  setCurRoomInfo,
  loadRoomInfo,
  getMyChat,
  getMyGames,
  getMyHistory,
  getHistory,
  getGameTypeList,
  deductBalanceWhenStartBrainGame
} from '../../redux/Logic/logic.actions';

import ChatPanel from '../ChatPanel/ChatPanel';
import { Tabs, Tab } from '@material-ui/core';
import MyGamesTable from '../MyGames/MyGamesTable';
import MyHistoryTable from '../MyGames/MyHistoryTable';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/live';
import HistoryTable from '../LiveGames/HistoryTable';
import DrawerButton from './DrawerButton';
import SupportButton from './SupportButton';
import Footer from './Footer';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
  validateLocalStorageLength,
  validateBankroll
} from '../modal/betValidations';

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
const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];

const getRandomGifUrl = () => {
  const randomIndex = Math.floor(Math.random() * gifUrls.length);
  return gifUrls[randomIndex];
};

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
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
      limit: 10,
      spleesh_guesses: [],
      selected_rps: '',
      selected_qs_position: 0,
      selected_id: '',
      image: '',
      bgColorChanged: false,
      borderColor: '',
      betResult: null,
      productName: '',
      bankroll: '',
      intervalId: null,
      history: this.props.history,
      showAnimation: false,
      sounds: {
        win: new Audio('/sounds/win-sound.mp3'),
        split: new Audio('/sounds/split-sound.mp3'),
        lose: new Audio('/sounds/lose-sound.mp3'),
        start: new Audio('/sounds/start.mp3'),
        countDown: new Audio('/sounds/countDown.mp3'),
        stop: new Audio('/sounds/stop.mp3'),
        sweep: new Audio('/sounds/sweep.mp3'),
        select: new Audio('/sounds/select.mp3'),
        wrong: new Audio('/sounds/wrong.mp3'),
        correct: new Audio('/sounds/correct.mp3'),
        bang: new Audio('/sounds/bang.mp3'),
        shine: new Audio('/sounds/shine.mp3'),
        cards: new Audio('/sounds/card.mp3')
      },
      currentSound: null
    };

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
        roomInfo: props.roomInfo
        // bankroll: props.roomInfo.bet_amount - this.getPreviousBets()
      };
    }

    return null;
  }

  async componentDidMount() {
    const { id } = this.props.match.params;
    await this.initializeRoomData(id);
    window.addEventListener('unload', this.handleUnload);
  }

  async initializeRoomData(id) {
    try {
      await Promise.all([
        this.getRoomData(id),
        this.loadSounds(),
        this.props.getHistory(),
        this.props.getGameTypeList(),
        this.props.isAuthenticated && this.props.getMyGames(),
        this.props.isAuthenticated && this.props.getMyHistory(),
        this.props.isAuthenticated && this.props.getMyChat(),
        this.props.getRoomInfo(
          this.props.match.params.id,
          this.state.limit,
          true
        )
      ]);
    } catch (error) {
      console.error('Error initializing room data:', error);
    }
  }

  async getRoomData(roomId) {
    try {
      const actionList = await this.props.getRoomStatisticsData(roomId);
      this.setState({
        actionList
      });
    } catch (error) {
      console.error('Error fetching room data:', error);
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

  join = async betInfo => {
    const result = await this.props.bet({
      _id: this.state.roomInfo._id,
      game_type: this.props.roomInfo.game_type,
      ...betInfo
    });
// console.log(result)
    return result;
  };

  calcWinChance = prevStates => {
    let total = prevStates.length;
    let rock = 0;
    let paper = 0;
    let scissors = 0;
    prevStates.map(el => {
      if (el.rps === 'R') {
        rock++;
      } else if (el.rps === 'P') {
        paper++;
      } else if (el.rps === 'S') {
        scissors++;
      }
    });
    const rockWinChance = (rock / total) * 100;
    const paperWinChance = (paper / total) * 100;
    const scissorsWinChance = (scissors / total) * 100;
    let lowest = rockWinChance;
    let highest = rockWinChance;
    if (paperWinChance < lowest) {
      lowest = paperWinChance;
    }
    if (scissorsWinChance < lowest) {
      lowest = scissorsWinChance;
    }
    if (paperWinChance > highest) {
      highest = paperWinChance;
    }
    if (scissorsWinChance > highest) {
      highest = scissorsWinChance;
    }
    if (lowest === highest) {
      return lowest.toFixed(2) + '%';
    }
    return lowest.toFixed(2) + '% - ' + highest.toFixed(2) + '%';
  };

  predictNext = rps_list => {
    // Create a transition matrix to store the probability of transitioning from one state to another
    const transitionMatrix = {
      R: {
        R: {
          R: { R: 0, P: 0, S: 0 },
          P: { R: 0, P: 0, S: 0 },
          S: { R: 0, P: 0, S: 0 }
        },
        P: {
          R: { R: 0, P: 0, S: 0 },
          P: { R: 0, P: 0, S: 0 },
          S: { R: 0, P: 0, S: 0 }
        },
        S: {
          R: { R: 0, P: 0, S: 0 },
          P: { R: 0, P: 0, S: 0 },
          S: { R: 0, P: 0, S: 0 }
        }
      },
      P: {
        R: {
          R: { R: 0, P: 0, S: 0 },
          P: { R: 0, P: 0, S: 0 },
          S: { R: 0, P: 0, S: 0 }
        },
        P: {
          R: { R: 0, P: 0, S: 0 },
          P: { R: 0, P: 0, S: 0 },
          S: { R: 0, P: 0, S: 0 }
        },
        S: {
          R: { R: 0, P: 0, S: 0 },
          P: { R: 0, P: 0, S: 0 },
          S: { R: 0, P: 0, S: 0 }
        }
      },
      S: {
        R: {
          R: { R: 0, P: 0, S: 0 },
          P: { R: 0, P: 0, S: 0 },
          S: { R: 0, P: 0, S: 0 }
        },
        P: {
          R: { R: 0, P: 0, S: 0 },
          P: { R: 0, P: 0, S: 0 },
          S: { R: 0, P: 0, S: 0 }
        },
        S: {
          R: { R: 0, P: 0, S: 0 },
          P: { R: 0, P: 0, S: 0 },
          S: { R: 0, P: 0, S: 0 }
        }
      }
    };

    // Iterate through the previous states to populate the transition matrix
    for (let i = 0; i < rps_list.length - 3; i++) {
      transitionMatrix[rps_list[i].rps][rps_list[i + 1].rps][
        rps_list[i + 2].rps
      ][rps_list[i + 3].rps]++;
    }

    // Normalize the transition matrix
    Object.keys(transitionMatrix).forEach(fromState1 => {
      Object.keys(transitionMatrix[fromState1]).forEach(fromState2 => {
        Object.keys(transitionMatrix[fromState1][fromState2]).forEach(
          fromState3 => {
            const totalTransitions = Object.values(
              transitionMatrix[fromState1][fromState2][fromState3]
            ).reduce((a, b) => a + b);
            Object.keys(
              transitionMatrix[fromState1][fromState2][fromState3]
            ).forEach(toState => {
              transitionMatrix[fromState1][fromState2][fromState3][
                toState
              ] /= totalTransitions;
            });
          }
        );
      });
    });

    // Check for consistency
    const winChance = this.calcWinChance(rps_list);
    let deviation = 0;
    if (winChance !== '33.33%') {
      deviation = (1 - 1 / 3) / 2;
    }
    // Use the transition matrix to predict the next state based on the current state
    let currentState1 = rps_list[rps_list.length - 3].rps;
    let currentState2 = rps_list[rps_list.length - 2].rps;
    let currentState3 = rps_list[rps_list.length - 1].rps;
    let nextState = currentState3;
    let maxProb = 0;
    Object.keys(
      transitionMatrix[currentState1][currentState2][currentState3]
    ).forEach(state => {
      if (
        transitionMatrix[currentState1][currentState2][currentState3][state] >
        maxProb
      ) {
        maxProb =
          transitionMatrix[currentState1][currentState2][currentState3][state];
        nextState = state;
      }
    });

    // Add randomness
    let randomNum = Math.random();
    if (randomNum < deviation) {
      let randomState = '';
      do {
        randomNum = Math.random();
        if (randomNum < 1 / 3) {
          randomState = 'R';
        } else if (randomNum < 2 / 3) {
          randomState = 'P';
        } else {
          randomState = 'S';
        }
      } while (randomState === currentState3);
      nextState = randomState;
    }
    return nextState;
  };


  calcWinChanceQs = (gametype, rounds) => {
    let positionCounts = new Array(gametype + 1).fill(0);
    for (let i = 0; i < rounds.length; i++) {
      positionCounts[rounds[i].qs]++;
    }
    let entropy = 0;
    for (let i = 0; i < gametype; i++) {
      if (positionCounts[i] === 0) {
        continue;
      }
      let probability = positionCounts[i] / rounds.length;
      entropy -= probability * Math.log2(probability);
    }
    let winChanceMin = Math.max(
      0,
      (1 - entropy / Math.log2(gametype)) / gametype
    );
    let winChanceMax = Math.min(1, 1 - entropy / Math.log2(gametype));
    winChanceMin *= 100;
    winChanceMax *= 100;
    return winChanceMin.toFixed(2) + '% - ' + winChanceMax.toFixed(2) + '%';
  };

  predictNextQs = (qs_list, gameType) => {
    const options = [...Array(gameType).keys()];
    const transitionMatrix = {};
    options.forEach(option1 => {
      transitionMatrix[option1] = {};
      options.forEach(option2 => {
        transitionMatrix[option1][option2] = {};
        options.forEach(option3 => {
          transitionMatrix[option1][option2][option3] = {};
          options.forEach(option4 => {
            transitionMatrix[option1][option2][option3][option4] = 0;
          });
        });
      });
    });

    for (let i = 0; i < qs_list.length - 3; i++) {
      transitionMatrix[qs_list[i].qs][qs_list[i + 1].qs][qs_list[i + 2].qs][
        qs_list[i + 3].qs
      ]++;
    }

    Object.keys(transitionMatrix).forEach(fromState1 => {
      Object.keys(transitionMatrix[fromState1]).forEach(fromState2 => {
        Object.keys(transitionMatrix[fromState1][fromState2]).forEach(
          fromState3 => {
            const totalTransitions = Object.values(
              transitionMatrix[fromState1][fromState2][fromState3]
            ).reduce((a, b) => a + b);
            Object.keys(
              transitionMatrix[fromState1][fromState2][fromState3]
            ).forEach(toState => {
              transitionMatrix[fromState1][fromState2][fromState3][
                toState
              ] /= totalTransitions;
            });
          }
        );
      });
    });

    const winChance = this.calcWinChanceQs(this.props.roomInfo.qs_game_type, qs_list);
    let deviation = 0;
    if (winChance !== '33.33%') {
      deviation = (1 - 1 / gameType) / 2;
    }

    let currentState1 = qs_list[qs_list.length - 3].qs;
    let currentState2 = qs_list[qs_list.length - 2].qs;
    let currentState3 = qs_list[qs_list.length - 1].qs;
    let nextState = currentState3;
    let maxProb = 0;
    Object.keys(
      transitionMatrix[currentState1][currentState2][currentState3]
    ).forEach(state => {
      if (
        transitionMatrix[currentState1][currentState2][currentState3][state] >
        maxProb
      ) {
        maxProb =
          transitionMatrix[currentState1][currentState2][currentState3][state];
        nextState = state;
      }
    });

    let randomNum = Math.random();
    if (randomNum < deviation) {
      let randomState = '';
      do {
        randomNum = Math.random();
        randomState = options[Math.floor(randomNum * gameType)];
      } while (randomState === nextState);
      nextState = randomState;
    }

    return nextState;
  };

  predictNextBetAmount(betArray, smoothingFactor = 0.01, randomnessFactor = 0.2, threshold = 0.0005) {
    if (betArray.length < 2) {
      // console.log("Insufficient data for prediction.");
      return null;
    }

    const transitionMatrix = this.createTransitionMatrix(betArray, smoothingFactor);
    const lastBet = betArray[betArray.length - 1];
    const possibleNextStates = transitionMatrix[lastBet] ? Object.keys(transitionMatrix[lastBet]) : [];
    if (possibleNextStates.length === 0) {

      const allStates = Array.from(new Set(betArray)); // Get all unique states
      const fallbackState = allStates[Math.floor(Math.random() * allStates.length)];
      return Math.min(Math.max(fallbackState, threshold), this.props.roomInfo.bet_amount);
    }

    const adjustedProbabilities = possibleNextStates.map(
      (nextState) => transitionMatrix[lastBet][nextState] + Math.random() * randomnessFactor
    );

    const nextStateIndex = this.chooseRandomIndex(adjustedProbabilities);
    const nextState = possibleNextStates[nextStateIndex];
    // console.log("Predicted next bet:", nextState);
    return Math.min(Math.max(nextState, threshold), this.props.roomInfo.bet_amount);
  }

  predictNextDg = dropAmounts => {
    const sortedDrops = dropAmounts.map(drop => drop.drop).sort((a, b) => a - b);
    const uniqueValues = [...new Set(sortedDrops)];

    if (uniqueValues.length === 1) {
      return uniqueValues[0];
    } else {
      let finalValue;

      do {
        const minDrop = Math.min(...sortedDrops);
        const maxDrop = Math.max(...sortedDrops);
        const difference = maxDrop - minDrop;
        const segmentSize = difference / 20;

        const segments = Array.from({ length: 20 }, (_, index) => {
          const lowerBound = minDrop + index * segmentSize;
          const upperBound = minDrop + (index + 1) * segmentSize;
          const dropsInSegment = sortedDrops.filter(drop => drop >= lowerBound && (drop < upperBound || (index === 19 && drop === upperBound)));

          return {
            segment: index + 1,
            drops: dropsInSegment
          };
        });

        const totalDropsCount = sortedDrops.length;
        const weights = segments.map(segment => segment.drops.length / totalDropsCount);

        const randomValue = Math.random();
        let cumulativeWeight = 0;
        let selectedSegment;

        for (let i = 0; i < segments.length; i++) {
          cumulativeWeight += weights[i];
          if (randomValue <= cumulativeWeight) {
            selectedSegment = segments[i];
            break;
          }
        }

        const switchChance = Math.random();

        if (switchChance <= 0.4) {
          const bottom5PercentIndex = Math.floor(0.25 * totalDropsCount);
          finalValue = sortedDrops[Math.floor(Math.random() * bottom5PercentIndex)];
        } else if (switchChance <= 0.8) {
          const top30PercentIndex = Math.floor(0.6 * totalDropsCount);
          finalValue = sortedDrops[Math.floor(top30PercentIndex + Math.random() * (totalDropsCount - top30PercentIndex))];
        } else {
          const randomAddition = Math.random() * segmentSize;
          finalValue = selectedSegment ? selectedSegment.drops[0] + randomAddition : null;
        }

      } while (finalValue !== null && finalValue < 0.000001);
      // console.log(finalValue)
      return finalValue;
    }
  };

  predictNextMb = (betAmountArray, boxList) => {
    let transitions = {};
    let probabilities = {};
    let startProbabilities = {};
    let distinctBoxes = [...new Set(boxList)];

    for (let i = 0; i < boxList.length; i++) {
      if (startProbabilities[boxList[i]]) {
        startProbabilities[boxList[i]]++;
      } else {
        startProbabilities[boxList[i]] = 1;
      }
    }

    let totalStartStates = Object.values(startProbabilities).reduce(
      (a, b) => a + b
    );

    for (let box in startProbabilities) {
      startProbabilities[box] /= totalStartStates;
    }

    for (let i = 0; i < boxList.length - 1; i++) {
      let currentBox = boxList[i];
      let nextBox = boxList[i + 1];

      if (transitions[currentBox]) {
        if (transitions[currentBox][nextBox]) {
          transitions[currentBox][nextBox]++;
        } else {
          transitions[currentBox][nextBox] = 1;
        }
      } else {
        transitions[currentBox] = {};
        transitions[currentBox][nextBox] = 1;
      }
    }

    for (let currentBox in transitions) {
      let currentBoxTransitions = transitions[currentBox];
      let totalCurrentBoxTransitions = Object.values(
        currentBoxTransitions
      ).reduce((a, b) => a + b);

      probabilities[currentBox] = {};

      for (let nextBox in currentBoxTransitions) {
        probabilities[currentBox][nextBox] =
          currentBoxTransitions[nextBox] / totalCurrentBoxTransitions;
      }
    }

    // Make prediction
    let prediction = null;
    let maxProbability = -1;

    const maxBetAmount = Math.max(...betAmountArray);
    betAmountArray = [boxList[boxList.length - 1]];
    for (let i = 0; i < distinctBoxes.length; i++) {
      let currentBox = distinctBoxes[i];
      if (currentBox > maxBetAmount) {
        continue;
      }
      let currentBoxProbability =
        startProbabilities[currentBox] *
        probabilities[currentBox][betAmountArray[betAmountArray.length - 1]];

      if (currentBoxProbability > maxProbability) {
        maxProbability = currentBoxProbability;
        prediction = currentBox;
      }
    }

    return parseFloat(prediction.box_price);
  };


  predictNextS = (array1, array2) => {
    const frequencyMap = {};
    let maxValue = 0;
    let maxKey = 0;

    array1.forEach(item => {
      if (!frequencyMap[item.spleesh]) {
        frequencyMap[item.spleesh] = 0;
      }
      frequencyMap[item.spleesh] += 1;

      if (frequencyMap[item.spleesh] > maxValue) {
        maxValue = frequencyMap[item.spleesh];
        maxKey = item.spleesh;
      }
    });

    const spleeshValues = Object.keys(frequencyMap);

    let prediction = maxKey;
    let i = 0;
    const maxAttempts = spleeshValues.length * 1;
    let shouldStopBetting = false;
    while (array2.some(item => item.bet_amount === prediction)) {
      const randomIndex = Math.floor(Math.random() * spleeshValues.length);
      prediction = Number(spleeshValues[randomIndex]);

      i++;
      if (i >= maxAttempts) {
        alertModal(this.props.isDarkMode, `NO MORE AVAILABLE OPTIONS MTF!!`);
        shouldStopBetting = true;
        break;
      }
    }

    return { prediction, shouldStopBetting };
  };

  predictNextBg = (score_array) => {
    // if (score_array.length < 5) {
    //   return Math.round(
    //     score_array.reduce((total, item) => total + item.score, 0) /
    //     score_array.length
    //   );
    // }

    const oldScores = score_array.slice(0, 5).map(item => item.score);
    const newScores = score_array
      .slice(score_array.length - 5)
      .map(item => item.score);

    const oldAvg =
      oldScores.reduce((total, score) => total + score, 0) / oldScores.length;
    const newAvg =
      newScores.reduce((total, score) => total + score, 0) / newScores.length;

      let prediction;
    if (newAvg > oldAvg) {
      let diff = newAvg - oldAvg;
      prediction =  Math.round(score_array[score_array.length - 1].score + diff);
    } else {
      prediction = Math.round(
        score_array.reduce((total, item) => total + item.score, 0) /
        score_array.length
      );
    }

    const random = Math.random();

    if (score_array && score_array.length > 0 && random < 0.4) {
      const randomIndex = Math.floor(Math.random() * score_array.length);
      prediction =  score_array[randomIndex].score;
    } else {
      const offset = Math.floor(Math.random() * 2) + 1; // either 1 or 2
      const sign = Math.random() < 0.5 ? -1 : 1; // either -1 or 1
      prediction = prediction + offset * sign;
    }

    // const randomOffset = Math.floor(Math.random() * 8) - 3;
    return prediction;
  };


  updateSelectedRps = (selection, callback) => {
    this.setState({ selected_rps: selection }, callback);
  }
  updateSelectedQs = (position, callback) => {
    this.setState({ selected_qs_position: position }, callback);
  }
  updateSelectedMb = (_id, callback) => {
    this.setState({ selected_id: _id }, callback);
  }
  updateDropAnimation = () => {
    this.setState({ showAnimation: true });
    setTimeout(() => {
      this.setState({ showAnimation: false });
    }, 2000);
  }
  updateSpleeshGuesses = (guesses) => {
    this.setState({ spleesh_guesses: guesses });
  }


  createTransitionMatrix(betArray, smoothingFactor = 0.01) {
    const transitionMatrix = {};

    for (let i = 0; i < betArray.length - 1; i++) {
      const currentBet = betArray[i];
      const nextBet = betArray[i + 1];

      if (!transitionMatrix[currentBet]) {
        transitionMatrix[currentBet] = {};
      }

      if (!transitionMatrix[currentBet][nextBet]) {
        transitionMatrix[currentBet][nextBet] = smoothingFactor; // Add smoothing factor
      } else {
        transitionMatrix[currentBet][nextBet]++;
      }
    }

    // Ensure all possible transitions have some default value
    const allStates = Array.from(new Set(betArray)); // Get all unique states

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

    // Apply Laplace smoothing to all transitions
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

    // This should not happen, but just in case
    return probabilities.length - 1;
  }

  handleSwitchChange = async () => {
    const {
      auth,
      isDarkMode,
      creator_id,
      user_id,
      getCustomerStatisticsData,
      roomInfo
    } = this.props;
    const { betting } = this.state;

    const game_type = roomInfo.game_type;
    let gameType;

    if (game_type === 'RPS') {
      gameType = '62a25d2a723b9f15709d1ae7';
    } else if (game_type === 'Spleesh!') {
      gameType = '62a25d2a723b9f15709d1ae8';
    } else if (game_type === 'Brain Game') {
      gameType = '62a25d2a723b9f15709d1ae9'
    } else if (game_type === 'Mystery Box') {
      gameType = '62a25d2a723b9f15709d1aea';
    } else if (game_type === 'Quick Shoot') {
      gameType = '62a25d2a723b9f15709d1aeb';
    } else if (game_type === 'Drop Game') {
      gameType = '63dac60ba1316a1e70a468ab';
    } else if (game_type === 'Bang!') {
      gameType = '6536a82933e70418b45fbe32'.$and.push({ description: /B!/i });
    } else if (game_type === 'Roll') {
      gameType = '6536946933e70418b45fbe2f'.$and.push({ description: /R/i });
    } else if (game_type === 'BlackJack') {
      gameType = '656cd55bb2c2d9dfb59a4bfa'.$and.push({ description: /BJ/i });
    }

    if (!validateIsAuthenticated(auth, isDarkMode)) {
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }

    const result = await getCustomerStatisticsData(
      user_id,
      'As Player',
      gameType,
      'All'
    );

    let betArray = [];

    if (result && result.gameLogList && result.gameLogList.length > 0) {
      betArray = result.gameLogList.map(entry => entry.bet);
    }

    if (!betting) {
      this.startBetting(betArray);
    } else {
      this.stopBetting();
    }
  };

  startBetting = betArray => {
    const { isDarkMode, openGamePasswordModal, roomInfo, balance } = this.props;
    let storageName;

    if (roomInfo.status !== 'open') {
      return;
    }

    switch (roomInfo.game_type) {
      case 'Quick Shoot':
        storageName = `qs_array_${roomInfo.qs_game_type}`;

        // if (
        //   !validateBankroll(
        //     bet_amount / (qs_game_type - 1) +
        //     parseFloat(bet_amount) -
        //     bankroll * (qs_game_type - 1),
        //     bankroll,
        //     isDarkMode
        //   )
        // ) {
        //   // Display an error message or handle the case when bankroll validation fails
        //   return;
        // }

        break;
      case 'Bang!':
        storageName = 'bang_array';
        break;
      case 'Spleesh!':
        if (this.props.spleesh_bet_unit === 0.1) {
          storageName = 'spleesh_10_array';
        } else if (this.props.spleesh_bet_unit === 0.01) {
          storageName = 'spleesh_001_array';
        } else {
          storageName = 'spleesh_array';
        }

        
        break;
      case 'Mystery Box':
        storageName = 'bet_array';
       
        break;
      case 'Blackjack':
        storageName = 'bj_array';
        break;
      case 'Brain Game':
        storageName = `score_array_${roomInfo.brain_game_type}`;
        break;
      case 'Drop Game':
        storageName = 'drop_array';
       
        break;
      default:
        storageName = `rps_array`;
       
    }
    if (!validateLocalStorageLength(storageName, isDarkMode)) {
      return;
    }
    const stored_array =
      JSON.parse(localStorage.getItem(storageName)) || [];

    const intervalId = setInterval(() => {
      let randomItem;
      let predictedBetAmount;
      switch (roomInfo.game_type) {
        case 'Quick Shoot':
          randomItem = this.predictNextQs(stored_array, roomInfo.qs_game_type);
          predictedBetAmount = this.predictNextBetAmount(betArray, 0.01, 0.2);
          if (!validateBetAmount(predictedBetAmount, balance, isDarkMode)) {
            return;
          }
          break;
        case 'Spleesh!':
          randomItem = this.predictNextS(stored_array, this.state.spleesh_guesses);
          randomItem = randomItem.prediction;
          if (!validateBetAmount(randomItem, balance, isDarkMode)) {
            return;
          }
          break;
        case 'Mystery Box':
          randomItem = this.predictNextMb(stored_array, roomInfo.box_list);
          if (!validateBetAmount(randomItem, balance, isDarkMode)) {
            return;
          }
          break;
        case 'Drop Game':
          randomItem = this.predictNextDg(stored_array);
          break;
          case 'Brain Game':
            randomItem = this.predictNextBg(stored_array);
          predictedBetAmount = roomInfo.bet_amount;
          
          break;
        default:
          randomItem = this.predictNext(stored_array);
          predictedBetAmount = this.predictNextBetAmount(betArray, 0.01, 0.2);
          if (!validateBetAmount(predictedBetAmount, balance, isDarkMode)) {
            return;
          }
      }

      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const passwordCorrect = rooms[roomInfo._id];
      if (roomInfo.is_private === true && passwordCorrect !== 'true') {
        openGamePasswordModal();
      } else {
        this.joinGame2(randomItem, predictedBetAmount);
        
      }
    }, 5000);

    this.playSound('start');
    this.setState({ intervalId, betting: true });
  };

  stopBetting = () => {
    this.playSound('stop');
    clearInterval(this.state.intervalId);
    this.setState({ intervalId: null, betting: false, timerValue: 2000 });
  };


  changeBgColor = async result => {
    this.setState({ betResult: result, bgColorChanged: true }, async () => {
      await new Promise(resolve => setTimeout(resolve, 4000)); // Wait for 1 second
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
        defaultColor = 'grey'; // Set default color to grey for other gametypes
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
      await new Promise(resolve => setTimeout(resolve, 4000));
      this.setState({ borderColor: '', bgColorChanged: false, betResult: null });

    });

  };

  joinGame2 = async (randomItem, predictedBetAmount) => {
    const { balance, isDarkMode, roomInfo, deductBalanceWhenStartBrainGame } = this.props;
    let { betting, selected_qs_position, selected_rps, selected_id, bankroll } = this.state;
    const gameType = roomInfo.game_type;
    if (!betting) {
      return;
    }
    if (gameType !== 'Drop Game' && gameType !== 'Spleesh!' && gameType !== 'Mystery Box') {
      if (!validateBetAmount(predictedBetAmount, balance, isDarkMode)) {
        return;
      }

      if (!validateBankroll(predictedBetAmount, roomInfo.bet_amount, isDarkMode)) {
        return;
      }
    } else if (gameType === 'Mystery Box') {


      if (!validateBetAmount(randomItem, balance, isDarkMode)) {
        return;
      }

      if (!validateBankroll(randomItem, roomInfo.pr, isDarkMode)) {
        return;
      }
    }  else if  (gameType === 'Spleesh!') {
      if (!validateBetAmount(randomItem, balance, isDarkMode)) {
        return;
      }
      if (!validateBankroll(randomItem, roomInfo.bet_amount, isDarkMode)) {
        return;
      }
    } else {
      if (!validateBetAmount(randomItem, balance, isDarkMode)) {
        return;
      }

      if (!validateBankroll(randomItem, roomInfo.bet_amount, isDarkMode)) {
        return;
      }
    }


    // Set randomItem based on gameType
    if (gameType === 'RPS') {
      selected_rps = randomItem;
    } else if (gameType === 'Quick Shoot') {
      selected_qs_position = parseInt(randomItem);
    }

    // Set state with a callback to ensure randomItem is properly set
    this.setState({ selected_rps, selected_qs_position, selected_id }, async () => {
      let result;

      try {
        if (gameType === 'RPS') {
          result = await this.join({
            bet_amount: parseFloat(predictedBetAmount),
            selected_rps: selected_rps,
            rps_bet_item_id: roomInfo.rps_bet_item_id
          });
        } else if (gameType === 'Quick Shoot') {
          result = await this.join({
            bet_amount: parseFloat(predictedBetAmount),
            selected_qs_position: selected_qs_position,
            qs_bet_item_id: roomInfo.qs_bet_item_id,
          });
        } else if (gameType === 'Drop Game') {
          this.updateDropAnimation();
          result = await this.join({
            bet_amount: parseFloat(randomItem),
            drop_bet_item_id: roomInfo.drop_bet_item_id,
          });
        } else if (gameType === 'Mystery Box') {
          const availableBoxes = roomInfo.box_list.filter(
            box => box.status === 'init' && box.box_price <= randomItem + 0.001
          );
          if (availableBoxes.length === 0) {
            alertModal(
              isDarkMode,
              `NO MORE AVAILABLE BOXES THAT FIT THE TRAINING DATA`
            );
            return;
          }

          const randomIndex = Math.floor(Math.random() * availableBoxes.length);
          const selectedBox = availableBoxes[randomIndex];

          result = await this.join({
            bet_amount: parseFloat(randomItem),
            selected_id: selectedBox._id,
          });
        } else if (gameType === 'Spleesh!') {
          result = await this.join({
            bet_amount: parseFloat(randomItem),
          });
        } else if (gameType === 'Brain Game') {
          result = await this.join({
            brain_game_score: randomItem,
            bet_amount: parseFloat(predictedBetAmount),
          });
          deductBalanceWhenStartBrainGame({
            bet_amount: predictedBetAmount
          });
        } 
       

        if (result && result.status === 'success') {
          let text = 'HAHAA, YOU LOST!!!';

          if (result.betResult === 1) {
            this.playSound('win');
            text = 'NOT BAD, WINNER!';
            if (gameType === 'Quick Shoot' || gameType === 'Mystery Box') {
              this.changeBgColorQs(result.betResult);
            } else {
              this.changeBgColor(result.betResult);
            }
          } else if (result.betResult === 0) {
            this.playSound('split');
            text = 'DRAW, NO WINNER!';
            if (gameType === 'Quick Shoot' || gameType === 'Mystery Box') {
              this.changeBgColorQs(result.betResult);
            } else {
              this.changeBgColor(result.betResult);
            }
          } else {
            if (gameType === 'Quick Shoot' || gameType === 'Mystery Box') {
              this.changeBgColorQs(result.betResult);
            } else {
              this.changeBgColor(result.betResult);
            }
            this.playSound('lose');
          }
          this.refreshHistory();
        }
      } catch (error) {
        console.error('Error in joinGame2:', error);
      }
    });
  };


  playSound = sound => {
    if (!this.props.isMuted) {
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

  playSoundLoop = sound => {
    if (!this.props.isMuted) {
      const audio = this.state.sounds[sound];
      if (audio.paused) {
        audio.currentTime = 3;
        audio.loop = true;
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

  onChangeState = async newState => {
    await this.setState(newState);
  };

  stopSound = sound => {
    const { currentSound } = this.state;
    // console.log("stop", currentSound);
    if (currentSound && currentSound.src.includes(sound)) {
      currentSound.pause();
      currentSound.currentTime = 0;
      this.setState({ currentSound: null }); // Clear the reference to the currently playing sound
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
    ); // room call
    await this.getRoomData(this.props.match.params.id); // room stats
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
        {this.props.roomCount} LIVE BATTLES
        <Lottie options={defaultOptions} width={40} />
      </div>
    ) : (
      'Your Battles'
    );

  render() {
    const {
      showPlayerModal,
      is_mobile,
      selectedCreator,
      bankroll,
      actionList,
      show_open_game,
      selectedMobileTab,
      betting,
      betResult,
      borderColor,
      bgColorChanged,
      selected_rps,
      selected_qs_position,
      spleesh_guesses,
      selected_id,
      showAnimation,
    } = this.state;
    const {
      open,
      roomInfo,
      loading,
      gameTypeList,
      isDrawerOpen,
      user_id,
      selectedMainTabIndex
    } = this.props;

    return (
      <>
        <LoadingOverlay
          className="custom-loading-overlay"
          active={loading}
          spinner={
            <div className="rpsLoader">
              <img
                src={getRandomGifUrl()}
                alt="Random Spinner"
                style={{
                  width: '40px',
                  display: 'block',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  marginBottom: '10px'
                }}
              />
              <div>{loading ? 'Loading Room...' : 'Please wait...'}</div>
            </div>
          }
        >
          <div
            className="main-game"
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
                >
                  <Tab
                    label={
                      selectedMobileTab === 'live_games'
                        ? 'Live Battles'
                        : 'Your Battles'
                    }
                    style={customStyles.tabRoot}
                  />
                  <Tab label="History" style={customStyles.tabRoot} />
                </Tabs>
              )}

            <div className="main-panel">
              {roomInfo.game_type ? (
                <div className="join-game-panel">
                  {roomInfo.game_type === 'RPS' && (
                    <RPS
                      changeBgColor={this.changeBgColor}
                      bgColorChanged={bgColorChanged}
                      betting={betting}
                      updateSelectedRps={this.updateSelectedRps}
                      selected_rps={selected_rps}
                      refreshHistory={this.refreshHistory}
                      playSound={this.playSound}
                      join={this.join}
                      betResult={betResult}
                      roomInfo={roomInfo}
                      rps_game_type={roomInfo.rps_game_type}
                      user_id={user_id}
                      handleOpenPlayerModal={this.handleOpenPlayerModal}
                      handleClosePlayerModal={this.handleClosePlayerModal}
                      selectedCreator={selectedCreator}
                      showPlayerModal={showPlayerModal}
                      creator_id={roomInfo.creator_id}
                      bet_amount={roomInfo.bet_amount}
                      // bankroll={bankroll}
                      rps_bet_item_id={roomInfo.rps_bet_item_id}
                      is_private={roomInfo.is_private}
                      youtubeUrl={roomInfo.youtubeUrl}
                      gameBackground={roomInfo.gameBackground}
                      actionList={actionList}
                      getRoomData={this.getRoomData}
                    />
                  )}
                  {roomInfo.game_type === 'Spleesh!' && (
                    <Spleesh
                      refreshHistory={this.refreshHistory}
                      handleOpenPlayerModal={this.handleOpenPlayerModal}
                      handleClosePlayerModal={this.handleClosePlayerModal}
                      selectedCreator={selectedCreator}
                      showPlayerModal={showPlayerModal}
                      betResult={betResult}
                      join={this.join}
                      bet_amount={roomInfo.bet_amount}
                      bankroll={roomInfo.host_pr}
                      spleesh_guesses={spleesh_guesses}
                      updateSpleeshGuesses={this.updateSpleeshGuesses}
                      spleesh_bet_unit={roomInfo.spleesh_bet_unit}
                      game_log_list={roomInfo.game_log_list || []}
                      user_id={user_id}
                      changeBgColor={this.changeBgColor}
                      bgColorChanged={bgColorChanged}
                      creator_id={roomInfo.creator_id}
                      roomInfo={roomInfo}
                      endgame_amount={roomInfo.endgame_amount}
                      playSound={this.playSound}
                      is_private={roomInfo.is_private}
                      youtubeUrl={roomInfo.youtubeUrl}
                      gameBackground={roomInfo.gameBackground}
                      actionList={actionList}
                      getRoomData={this.getRoomData}
                    />
                  )}
                  {roomInfo.game_type === 'Mystery Box' &&
                    roomInfo.box_list.length > 0 && (
                      <MysteryBox
                        handleOpenPlayerModal={this.handleOpenPlayerModal}
                        handleClosePlayerModal={this.handleClosePlayerModal}
                        selectedCreator={selectedCreator}
                        showPlayerModal={showPlayerModal}
                        refreshHistory={this.refreshHistory}
                        join={this.join}
                        borderColor={borderColor}
                        box_list={roomInfo.box_list}
                        box_price={roomInfo.box_price}
                        user_id={user_id}
                        selected_id={selected_id}
                        changeBgColor={this.changeBgColorQs}
                        bgColorChanged={bgColorChanged}
                        updateSelectedMb={this.updateSelectedMb}
                        creator_id={roomInfo.creator_id}
                        is_private={roomInfo.is_private}
                        roomInfo={roomInfo}
                        playSound={this.playSound}
                        betResult={betResult}
                        youtubeUrl={roomInfo.youtubeUrl}
                        gameBackground={roomInfo.gameBackground}
                        actionList={actionList}
                        getRoomData={this.getRoomData}
                      />
                    )}
                  {roomInfo.game_type === 'Brain Game' && (
                    <BrainGame
                      handleOpenPlayerModal={this.handleOpenPlayerModal}
                      handleClosePlayerModal={this.handleClosePlayerModal}
                      selectedCreator={selectedCreator}
                      showPlayerModal={showPlayerModal}
                      refreshHistory={this.refreshHistory}
                      join={this.join}
                      brain_game_type={roomInfo.brain_game_type}
                      brain_game_score={roomInfo.brain_game_score}
                      bet_amount={roomInfo.bet_amount}
                      user_id={this.props.user_id}
                      creator_id={roomInfo.creator_id}
                      joined_count={
                        roomInfo.game_log_list
                          ? roomInfo.game_log_list.length
                          : 0
                      }
                      is_private={roomInfo.is_private}
                      roomInfo={roomInfo}
                      playSound={this.playSound}
                      youtubeUrl={roomInfo.youtubeUrl}
                      gameBackground={roomInfo.gameBackground}
                      actionList={actionList}
                      getRoomData={this.getRoomData}
                    />
                  )}
                  {roomInfo.game_type === 'Quick Shoot' && (
                    <QuickShoot
                      handleOpenPlayerModal={this.handleOpenPlayerModal}
                      handleClosePlayerModal={this.handleClosePlayerModal}
                      selectedCreator={selectedCreator}
                      showPlayerModal={showPlayerModal}
                      refreshHistory={this.refreshHistory}
                      join={this.join}
                      borderColor={borderColor}
                      bgColorChanged={bgColorChanged}
                      changeBgColor={this.changeBgColorQs}
                      updateSelectedQs={this.updateSelectedQs}
                      user_id={user_id}
                      betResult={betResult}
                      creator_id={roomInfo.creator_id}
                      qs_game_type={roomInfo.qs_game_type}
                      bet_amount={roomInfo.bet_amount}
                      // bankroll={bankroll}
                      qs_bet_item_id={roomInfo.qs_bet_item_id}
                      is_private={roomInfo.is_private}
                      selected_qs_position={selected_qs_position}
                      roomInfo={roomInfo}
                      playSound={this.playSound}
                      youtubeUrl={roomInfo.youtubeUrl}
                      gameBackground={roomInfo.gameBackground}
                      actionList={actionList}
                      getRoomData={this.getRoomData}
                    />
                  )}
                  {roomInfo.game_type === 'Drop Game' && (
                    <DropGame
                      handleOpenPlayerModal={this.handleOpenPlayerModal}
                      handleClosePlayerModal={this.handleClosePlayerModal}
                      selectedCreator={selectedCreator}
                      showPlayerModal={showPlayerModal}
                      refreshHistory={this.refreshHistory}
                      join={this.join}
                      user_id={user_id}
                      showAnimation={showAnimation}
                      updateDropAnimation={this.updateDropAnimation}
                      creator_id={roomInfo.creator_id}
                      bet_amount={roomInfo.bet_amount}
                      // bankroll={bankroll}
                      drop_bet_item_id={roomInfo.drop_bet_item_id}
                      is_private={roomInfo.is_private}
                      roomInfo={roomInfo}
                      playSound={this.playSound}
                      youtubeUrl={roomInfo.youtubeUrl}
                      gameBackground={roomInfo.gameBackground}
                      actionList={actionList}
                      getRoomData={this.getRoomData}
                    />
                  )}
                  {roomInfo.game_type === 'Bang!' && (
                    <Bang
                      refreshHistory={this.refreshHistory}
                      join={this.join}
                      handleOpenPlayerModal={this.handleOpenPlayerModal}
                      handleClosePlayerModal={this.handleClosePlayerModal}
                      selectedCreator={selectedCreator}
                      showPlayerModal={showPlayerModal}
                      user_id={user_id}
                      creator_id={roomInfo.creator_id}
                      aveMultiplier={roomInfo.aveMultiplier}
                      bet_amount={roomInfo.bet_amount}
                      crashed={roomInfo.crashed}
                      cashoutAmount={roomInfo.cashoutAmount}
                      // bankroll={bankroll}
                      bang_bet_item_id={roomInfo.bang_bet_item_id}
                      is_private={roomInfo.is_private}
                      roomInfo={roomInfo}
                      playSound={this.playSound}
                      playSoundLoop={this.playSoundLoop}
                      stopSound={this.stopSound}
                      youtubeUrl={roomInfo.youtubeUrl}
                      gameBackground={roomInfo.gameBackground}
                      actionList={actionList}
                      getRoomData={this.getRoomData}
                    />
                  )}
                  {roomInfo.game_type === 'Roll' && (
                    <Roll
                      handleOpenPlayerModal={this.handleOpenPlayerModal}
                      handleClosePlayerModal={this.handleClosePlayerModal}
                      selectedCreator={selectedCreator}
                      showPlayerModal={showPlayerModal}
                      refreshHistory={this.refreshHistory}
                      join={this.join}
                      user_id={user_id}
                      creator_id={roomInfo.creator_id}
                      aveMultiplier={roomInfo.aveMultiplier}
                      bet_amount={roomInfo.bet_amount}
                      crashed={roomInfo.crashed}
                      cashoutAmount={roomInfo.cashoutAmount}
                      bankroll={bankroll}
                      roll_bet_item_id={roomInfo.roll_bet_item_id}
                      is_private={roomInfo.is_private}
                      roomInfo={roomInfo}
                      playSound={this.playSound}
                      stopSound={this.stopSound}
                      youtubeUrl={roomInfo.youtubeUrl}
                      gameBackground={roomInfo.gameBackground}
                      actionList={actionList}
                      getRoomData={this.getRoomData}
                    />
                  )}
                  {roomInfo.game_type === 'Blackjack' && (
                    <Blackjack
                      handleOpenPlayerModal={this.handleOpenPlayerModal}
                      handleClosePlayerModal={this.handleClosePlayerModal}
                      selectedCreator={selectedCreator}
                      showPlayerModal={showPlayerModal}
                      refreshHistory={this.refreshHistory}
                      playSound={this.playSound}
                      join={this.join}
                      roomInfo={roomInfo}
                      user_id={user_id}
                      creator_id={roomInfo.creator_id}
                      bet_amount={roomInfo.bet_amount}
                      bankroll={bankroll}
                      bj_bet_item_id={roomInfo.bj_bet_item_id}
                      is_private={roomInfo.is_private}
                      youtubeUrl={roomInfo.youtubeUrl}
                      gameBackground={roomInfo.gameBackground}
                      actionList={actionList}
                      getRoomData={this.getRoomData}
                    />
                  )}
                </div>
              ) : (
                <LinearProgress color="secondary" />
              )}
              <TabbedContent
                actionList={actionList}
                roomInfo={roomInfo}
                getRoomData={this.getRoomData}
                isLowGraphics={this.props.isLowGraphics}
                isDarkMode={this.props.isDarkMode}
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
                  show_open_game === 1 && <HistoryTable />}
                {is_mobile &&
                  selectedMobileTab === 'my_games' &&
                  show_open_game === 1 && <MyHistoryTable />}
              </div>
            </div>
            <div className="sub-panel">
              <h2 className="main-title desktop-only">AI PANEL</h2>
              {!this.state.is_mobile &&
                this.props.selectedMainTabIndex === 0 && (
                  <AiPanel
                    betting={betting}
                    handleSwitchChange={this.handleSwitchChange}
                    game_type={roomInfo.game_type}
                    qs_game_type={roomInfo.qs_game_type}
                    brain_game_type={roomInfo.brain_game_type}
                    spleesh_bet_unit={roomInfo.spleesh_bet_unit}
                    user_id={this.props.user_id}
                  />
                )}
              <h2 className="main-title desktop-only">HISTORY</h2>
              {!is_mobile && selectedMainTabIndex === 0 && <HistoryTable />}
              <DrawerButton
                open={isDrawerOpen}
                toggleDrawer={this.toggleDrawer}
              />
              <SupportButton
                open={this.props.isSupportOpen}
              // toggleDrawer={this.toggleDrawer}
              />
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
                  {selectedMobileTab === 'live_games' && 'LIVE BATTLES'}
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
                  {selectedMobileTab === 'my_games' && 'YOUR BATTLES'}
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
        </LoadingOverlay>
      </>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  history: state.logic.history,
  roomInfo: state.logic.curRoomInfo,
  user_id: state.auth.user._id,
  isMuted: state.auth.isMuted,
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
  isDrawerOpen: state.auth.isDrawerOpen,
  loading: state.logic.isActiveLoadingOverlay,
  isDarkMode: state.auth.isDarkMode,
  isLowGraphics: state.auth.isLowGraphics
});

const mapDispatchToProps = {
  getRoomInfo,
  bet,
  setCurRoomInfo,
  loadRoomInfo,
  getMyChat,
  getMyGames,
  getMyHistory,
  getRoomStatisticsData,
  getHistory,
  toggleDrawer,
  getGameTypeList,
  openGamePasswordModal,
  getCustomerStatisticsData,
  deductBalanceWhenStartBrainGame
};

export default connect(mapStateToProps, mapDispatchToProps)(JoinGame);
