import React, { Component } from 'react';
import { connect } from 'react-redux';
import BetArray from '../../components/BetArray';
import Share from '../../components/Share';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import Lottie from 'react-lottie';
import loadingChart from '../LottieAnimations/loadingChart.json';

import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import { YouTubeVideo } from '../../components/YoutubeVideo';
import BetAmountInput from '../../components/BetAmountInput';
import { Button } from '@material-ui/core';
import { deductBalanceWhenStartBlackjack } from '../../redux/Logic/logic.actions';
import Moment from 'moment';
import ImageResultModal from '../modal/ImageResultModal';

import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import ReactApexChart from 'react-apexcharts';
import PlayerModal from '../modal/PlayerModal';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
  validateLocalStorageLength,
  validateBankroll
} from '../modal/betValidations';

import animationData from '../LottieAnimations/spinningIcon';
import Avatar from '../../components/Avatar';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';
import { LensOutlined } from '@material-ui/icons';

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
  let rock = 0;
  let paper = 0;
  let scissors = 0;
  prevStates.map(el => {
    if (el.bj === 'R') {
      rock++;
    } else if (el.bj === 'P') {
      paper++;
    } else if (el.bj === 'S') {
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

const predictNext = bj_list => {
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
  for (let i = 0; i < bj_list.length - 3; i++) {
    transitionMatrix[bj_list[i].bj][bj_list[i + 1].bj][bj_list[i + 2].bj][
      bj_list[i + 3].bj
    ]++;
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
  const winChance = calcWinChance(bj_list);
  let deviation = 0;
  if (winChance !== '33.33%') {
    deviation = (1 - 1 / 3) / 2;
  }
  // Use the transition matrix to predict the next state based on the current state
  let currentState1 = bj_list[bj_list.length - 3].bj;
  let currentState2 = bj_list[bj_list.length - 2].bj;
  let currentState3 = bj_list[bj_list.length - 1].bj;
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

class Blackjack extends Component {
  constructor(props) {
    super(props);

    this.settingsRef = React.createRef();
    this.socket = this.props.socket;
    this.state = {
      betting: false,
      timer: null,
      timerValue: 2000,
      intervalId: null,
      items: [],
      disabledButtons: true,
      bgColorChanged: false,
      selected_bj: '',
      cardVisibility: false,
      is_started: false,
      advanced_status: '',
      is_anonymous: false,
      showImageModal: false,
      image: '',
      bet_amount: 0.001,
      cards: [],
      productName: '',
      cards_host: [],
      cardsArray: [],
      score: 0,
      score_host: 0,
      bankroll: parseFloat(this.props.bet_amount),
      betResult: null,
      balance: this.props.balance,
      isPasswordCorrect: this.props.isPasswordCorrect,
      settings_panel_opened: false,
      blackjack: false,
    };
    this.panelRef = React.createRef();
    this.onChangeState = this.onChangeState.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);

  }

  onChangeState(e) {
    this.setState({ bet_amount: e.target.value });
    this.setState({ potential_return: e.target.value * 2 });
  }

  changeBgColor = async result => {
    this.setState({ betResult: result, bgColorChanged: true });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 1 second
    this.setState({ bgColorChanged: false });
  };


  componentDidMount = () => {
    const { socket, playSound } = this.props;
    document.addEventListener('keydown', this.handleKeyPress);

    this.resetGame();
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
      socket.on('UPDATED_BANKROLL', data => {
        this.setState({ bankroll: data.bankroll });
      });
      socket.on('CARDS_ARRAY', data => {
        this.setState({ cardsArray: data.cardsArray }, () => {
          // console.log("cardsArray: ", data.cardsArray)
          if (data.cardsArray === null) [
            this.resetGame()
          ]
        });
      });
    }
  };


  componentWillUnmount = () => {
    clearInterval(this.state.intervalId);
    document.removeEventListener('keydown', this.handleKeyPress);

  };

  handleKeyPress = (event) => {
    const { disabledButtons } = this.state;
    const { isFocused } = this.props;
    if (!isFocused) {
      switch (event.key) {
        case 'h':
          if (!disabledButtons) {
            this.handleHit();
          }
          break;
        case 's':
          if (!disabledButtons) {
            this.handleStand();
          }
          break;
        case ' ':
          event.preventDefault();
          if (disabledButtons) {
            this.setState({
              disabledButtons: true
            }, () => {
              this.onBtnBetClick();
            })
          }
          break;
        default:
          break;
      }

    }
  }
  dealRemaining = (score) => {
    // Ensure cardsArray is properly initialized and contains data
    const cardsArray = this.state.cardsArray || [];

    if (score <= 21 && cardsArray.length > 0) {
      // Make a copy of cards_host and initialize visibility array
      const updatedCardsHost = [...this.state.cards_host];
      const updatedCardVisibility = Array(this.state.cards_host.length).fill(true);

      // Set the second card of the host
      updatedCardsHost[1] = cardsArray[0]?.card;

      // Ensure visibility is true for index > 2
      updatedCardVisibility.forEach((visibility, index) => {
        if (index > 2) {
          updatedCardVisibility[index] = true;
        }
      });

      // Update state with score_host, cards_host, and cardVisibility
      this.setState({
        score_host: cardsArray[cardsArray.length - 1]?.score,
        cards_host: updatedCardsHost,
        cardVisibility: updatedCardVisibility,
        disabledButtons: true
      });

      // Introduce a delay between rendering each card
      const delay = 1000; // Adjust the delay as needed (in milliseconds)
      let cardIndex = 1;

      const drawCardInterval = setInterval(() => {
        if (cardIndex < cardsArray.length) {
          // Push the next card to the host's cards array
          updatedCardsHost.push(cardsArray[cardIndex]?.card);

          // Update state with the new cards array
          this.setState({
            cards_host: updatedCardsHost,
          });

          cardIndex++;
        } else {
          clearInterval(drawCardInterval); // Stop the interval when all cards are drawn
        }
      }, delay);
    }
  };




  dealCards = (drawCardsFunc, calculateScoreFunc, cardsType, scoreType) => {
    const cards = drawCardsFunc(2);
    const score = calculateScoreFunc(cards);
    const cardVisibility = cards.map((_, index) =>
      index !== 1 || index > 2 ? true : false
    );

    this.setState(
      { [cardsType]: cards, [scoreType]: score, cardVisibility },
      () => {
        const drawnCards = document.querySelectorAll(
          `.${cardsType === 'cards' ? 'card' : 'card_host'}`
        );

        drawnCards.forEach((card, index) => {
          card.style.animationDelay = `${index * 0.2}s`;
          const cardNumber = card.querySelector('.card-number');
          const cardSuit = card.querySelector('.card-suit');

          if (!this.state.cardVisibility[index]) {
            card.classList.add('card-hidden');
            cardNumber.classList.add('card-hidden');
            cardSuit.classList.add('card-hidden');
          }
        });

        setTimeout(() => {
          drawnCards.forEach((card, index) => {
            if (index >= 2 && !this.state.cardVisibility[index]) {
              card.classList.remove('card-hidden');
              const cardNumber = card.querySelector('.card-number');
              const cardSuit = card.querySelector('.card-suit');
              cardNumber.classList.remove('card-hidden');
              cardSuit.classList.remove('card-hidden');
            }
          });
        }, 300);
      }
    );

    if (score === 21) {
      this.setState({ blackjack: true }, () => {
        this.joinGame();
      })
    }


  };

  dealJoiner = () => {
    this.dealCards(this.drawCards, this.calculateScore, 'cards', 'score');
  };

  dealHost = () => {
    this.dealCards(
      this.drawCardsHost,
      this.calculateScoreHost,
      'cards_host',
      'score_host'
    );
  };

  drawCard = () => {
    const suits = ['♠', '♣', '♥', '♦'];
    const deck = [
      'A',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K'
    ];

    const randomSuitIndex = Math.floor(Math.random() * suits.length);
    const randomCardIndex = Math.floor(Math.random() * deck.length);

    const suit = suits[randomSuitIndex];
    const card = deck[randomCardIndex];

    return { card, suit };
  };

  drawCards = count => {
    const cards = [];
    for (let i = 0; i < count; i++) {
      const card = this.drawCard();
      cards.push(card);
    }
    this.props.playSound('cards');

    return cards;
  };

  drawCardHost = () => {
    const suits = ['♠', '♣', '♥', '♦'];
    const deck = [
      'A',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      'J',
      'Q',
      'K'
    ];

    const randomSuitIndex = Math.floor(Math.random() * suits.length);
    const randomCardIndex = Math.floor(Math.random() * deck.length);

    const suit = suits[randomSuitIndex];
    const card_host = deck[randomCardIndex];

    return { card_host, suit };
  };

  drawCardsHost = count => {
    const cards_host = [];
    for (let i = 0; i < count; i++) {
      const card_host = this.drawCardHost();
      cards_host.push(card_host);
    }
    return cards_host;
  };

  // Update the calculateScore function to trigger the animation
  calculateScore = cards => {
    let score = 0;
    let hasAce = false;

    cards.forEach(card => {
      if (card.card === 'A') {
        score += 11;
        hasAce = true;
      } else if (['K', 'Q', 'J'].includes(card.card)) {
        score += 10;
      } else {
        score += parseInt(card.card, 10);
      }
    });

    if (hasAce && score > 21) {
      score -= 10;
    }

    this.setState({ scoreAnimation: true }, () => {
      setTimeout(() => {
        this.setState({ scoreAnimation: false });
      }, 500); // Adjust the duration of the animation as needed
    });

    return score;
  };

  // Update the calculateScore function to trigger the animation
  calculateScoreHost = cards_host => {
    const firstCard = cards_host[0]; // Get the first card

    let score = 0;
    let hasAce = false;

    if (firstCard.card_host === 'A') {
      score += 11;
      hasAce = true;
    } else if (['K', 'Q', 'J'].includes(firstCard.card_host)) {
      score += 10;
    } else {
      score += parseInt(firstCard.card_host, 10);
    }

    if (hasAce && score > 21) {
      score -= 10;
    }

    // Update the animation code to trigger animation for the first card only
    if (firstCard) {
      this.setState({ scoreAnimation: true }, () => {
        setTimeout(() => {
          this.setState({ scoreAnimation: false });
        }, 500); // Adjust the duration of the animation as needed
      });
    }

    return score;
  };

  hit = () => {
    const newCard = this.drawCard();
    const newCards = [...this.state.cards, newCard];
    const newScore = this.calculateScore(newCards);

    if (newScore >= 21) {
      this.setState({ cards: newCards, score: newScore }, () => {
        this.joinGame();
      })
    } else {
      this.setState({ cards: newCards, score: newScore }, () => {
        // Trigger the animation for the newly drawn card
        const drawnCards = document.querySelectorAll('.card');
        const newCardElement = drawnCards[drawnCards.length - 1]; // Get the last card element
        newCardElement.style.animationDelay = `${(drawnCards.length - 1) *
          0.2}s`; // Delay the animation
        newCardElement.style.animation =
          'cardAnimation 0.5s ease-in-out forwards';
      });
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
    const { roomInfo, actionList } = this.props;
    const {
      isPasswordCorrect,
      selected_bj,
      isWaiting,
      disabledButtons
    } = this.state;

    if (prevProps.actionList !== actionList) {
      this.setState({
        actionList: actionList
      });
    }

    if (
      prevState.isPasswordCorrect !== isPasswordCorrect &&
      isPasswordCorrect === true
    ) {
      this.joinGame();
    }
  }

  getSuitSymbol = card => {
    switch (card) {
      case '♥':
        return <span className="suit-hearts">&hearts;</span>;
      case '♦':
        return <span className="suit-diamonds">&diams;</span>;
      case '♠':
        return <span className="suit-spades">&spades;</span>;
      case '♣':
        return <span className="suit-clubs">&clubs;</span>;
      default:
        return '';
    }
  };

  toggleImageModal = () => {
    this.setState({
      showImageModal: false
    });
  };

  joinGame = async () => {
    const {
      bj_bet_item_id,
      isDarkMode,
      refreshHistory,
      join,
      playSound
    } = this.props;

    const {
      selected_bj,
      bet_amount,
      score,
      score_host
    } = this.state;

    let finalScore = score;

    if (this.state.blackjack) {
      finalScore = 6198;
    }

    const result = await join({
      bet_amount: parseFloat(bet_amount),
      score: finalScore,
      score_host: score_host,
      bj_bet_item_id: bj_bet_item_id,
    });

    let text;
    if (result.betResult === 1) {
      playSound('win');
      text = 'WINNER, WINNER, VEGAN FUCKING DINNER!';
      this.changeBgColor(result.betResult);
    } else if (result.betResult === 0) {
      text = 'SPLIT! EQUALLY SHIT!';
      playSound('split');
      this.changeBgColor(result.betResult);
    } else {
      text = 'TROLLOLOLOL! LOSER!';
      playSound('lose');
      this.changeBgColor(result.betResult);
    }

    gameResultModal(
      isDarkMode,
      text,
      result.betResult,
      'Okay',
      null,
      () => { },
      () => { }
    );

    if (result.status === 'success') {
      const { user, room } = this.props;

    } else {
      if (result.message) {
        alertModal(isDarkMode, result.message);
      }
    }

    let stored_bj_array = JSON.parse(localStorage.getItem('bj_array')) || [];
    while (stored_bj_array.length >= 20) {
      stored_bj_array.shift();
    }
    stored_bj_array = stored_bj_array.filter(item => item && item.bj);

    stored_bj_array.push({ bj: selected_bj });
    localStorage.setItem('bj_array', JSON.stringify(stored_bj_array));


    this.dealRemaining(score)
    if (score > 21) {
      this.setState({ disabledButtons: true });

    }
    refreshHistory();

    // this.resetGame();
  };

  resetGame = () => {
    this.setState({
      cards: [],
      cards_host: [],
      score: 0,
      score_host: 0,
      is_started: false,
      disabledButtons: true,
      blackjack: false
    });
  };

  onBtnBetClick = async () => {
    const {
      openGamePasswordModal,
      isAuthenticated,
      isDarkMode,
      creator_id,
      user_id,
      balance,
      is_private,
      roomInfo,
      deductBalanceWhenStartBlackjack
    } = this.props;
    const { bet_amount, bankroll, is_started, cards, cards_host } = this.state;

    if (cards || cards_host !== null) {
      this.resetGame();
    }

    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      return;
    }

    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }

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
        deductBalanceWhenStartBlackjack({
          bet_amount: bet_amount
        });
        this.setState({
          is_started: true,
          disabledButtons: false
        });
        this.dealJoiner();
        this.dealHost();
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
            deductBalanceWhenStartBlackjack({
              bet_amount: bet_amount
            });
            this.setState({
              is_started: true,
              disabledButtons: false
            });
            this.dealJoiner();
            this.dealHost();
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


  handleHit = () => {
    this.hit();
    this.setState({ selected_bj: "hit" }, () => {
      this.animateButton('.hit');
    })
  }

  handleStand = () => {
    this.joinGame();
    this.setState({ selected_bj: "stand" }, () => {

      this.animateButton('.stand');
    })
  }

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
    const { isAuthenticated, isDarkMode, creator_id, user_id } = this.props;
    const { betting } = this.state;

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

  startBetting = () => {
    const {
      isDarkMode,
      playSound,
      is_private,
      openGamePasswordModal,
      roomInfo
    } = this.props;

    const storageName = 'bj_array';
    if (!validateLocalStorageLength(storageName, isDarkMode)) {
      return;
    }
    const stored_bj_array = JSON.parse(localStorage.getItem(storageName)) || [];
    const intervalId = setInterval(() => {
      const randomItem = predictNext(stored_bj_array);
      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const passwordCorrect = rooms[roomInfo._id];
      if (is_private === true && passwordCorrect !== 'true') {
        openGamePasswordModal();
      } else {
        this.joinGame2(randomItem);
      }
    }, 3500);
    playSound('start');
    this.setState({ intervalId, betting: true });
  };

  stopBetting = () => {
    this.props.playSound('stop');
    clearInterval(this.state.intervalId);
    this.setState({ intervalId: null, betting: false, timerValue: 2000 });
  };

  joinGame2 = async randomItem => {
    const {
      bj_bet_item_id,
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
      selected_bj,
      betting
    } = this.state;

    // Check if betting is true before continuing
    if (!betting) {
      return;
    }

    this.setState({ selected_bj: randomItem });

    if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
      return;
    }
    if (!validateBankroll(bet_amount, bankroll, isDarkMode)) {
      return;
    }

    const result = await this.props.join({
      bet_amount: parseFloat(bet_amount),
      selected_bj: selected_bj,
      is_anonymous: is_anonymous,
      bj_bet_item_id: bj_bet_item_id,
      slippage: slippage
    });

    const currentUser = this.props.user;
    const currentRoom = this.props.room;
    if (result.status === 'success') {

      let text = 'HAHAA, YOU LOST!!!';

      if (result.betResult === 1) {
        playSound('win');

        text = 'NOT BAD, WINNER!';
        this.changeBgColor(result.betResult);
      } else if (result.betResult === 0) {
        playSound('split');

        text = 'DRAW, NO WINNER!';
        this.changeBgColor(result.betResult);
      } else {
        this.changeBgColor(result.betResult); // Add this line
        playSound('lose');
      }

      refreshHistory();
    }
  };

  animateButton = (selector) => {
    const currentActive = document.querySelector(selector);
    if (currentActive) {
      currentActive.style.animation = 'none';
      void currentActive.offsetWidth;
      currentActive.style.animation = 'pulse 0.2s ease-in-out ';
    }
  }

  render() {
    const {
      score,
      cards,
      cards_host,
      score_host,
      scoreAnimation,
      cardVisibility,
      selected_bj,
      disabledButtons,
      bankroll,
      image,
      showImageModal,
      bet_amount,
      actionList,
      productName
    } = this.state;

    const {
      isLowGraphics,
      isMusicEnabled,
      roomInfo,
      accessory,
      handleOpenPlayerModal,
      creator_avatar,
      rank,
      isDarkMode,
      showPlayerModal,
      selectedCreator,
      handleClosePlayerModal,
      youtubeUrl
    } = this.props;

    const payoutPercentage = (bankroll / roomInfo.endgame_amount) * 100;

    const barStyle = {
      width: `${payoutPercentage + 10}%`,
      backgroundColor: payoutPercentage <= 50 ? 'yellow' : 'red'
    };
    return (
      <div className="game-page">
        <div className="page-title">
          {/* <h1> DEMO ONLY, GAME UNDER DEVELOPMENT 🚧</h1> */}
          <h2>PLAY - Blackjack</h2>
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
                      <div className="label your-max-return">Your Return</div>
                    </div>
                    <div className="value">
                      {convertToCurrency(
                        (bet_amount * 2)
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
                        onClick={() =>
                          handleOpenPlayerModal(this.props.creator_id)
                        }
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
            style={{ position: 'relative', zIndex: 10 }}
          >
            {renderLottieAvatarAnimation(
              this.props.gameBackground,
              isLowGraphics
            )}

            <div className="deck">
              <div className="card-back">
                <div className="rps-logo">
                  <img src={'/img/rps-logo-white.svg'} alt="RPS Game Logo" />
                </div>
              </div>
            </div>
            <div className="card-container">
              {cards_host.map((card_host, index) => (
                <div
                  key={index}
                  className={`card suit-${card_host.suit.toLowerCase()} ${!cardVisibility[index] ? 'animated' : ''
                    }`}
                >
                  <div
                    className={`card-suit ${!cardVisibility[index] ? 'animated' : ''
                      }`}
                  >
                    {this.getSuitSymbol(card_host.suit)}
                  </div>
                  <div
                    className={`card-number ${!cardVisibility[index] ? 'animated' : ''
                      }`}
                  >
                    {card_host.card_host}
                  </div>
                </div>
              ))}
            </div>

            <h6
              id="upper-score"
              className={scoreAnimation ? 'score animated' : 'score'}
            >
              {score_host}
            </h6>
            <div className="bow">
              <h3 className="game-sub-title">pays 3 to 2</h3>
              <img src={'/img/bow.svg'} alt="Blackjack pays 3 to 2" />
            </div>
            <div style={{ marginTop: '-30px' }} className="card-container">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className={`card suit-${card.suit.toLowerCase()}`}
                >
                  <div className="card-suit">
                    {this.getSuitSymbol(card.suit)}
                  </div>
                  <div className="card-number">{card.card}</div>
                </div>
              ))}
            </div>
            <h6 className={scoreAnimation ? 'score animated' : 'score'}>
              {score}
            </h6>
            <BetAmountInput
              disabledButtons={!disabledButtons}
              betAmount={bet_amount}
              handle2xButtonClick={this.handle2xButtonClick}
              handleHalfXButtonClick={this.handleHalfXButtonClick}
              handleMaxButtonClick={this.handleMaxButtonClick}
              onChangeState={this.onChangeState}
              isDarkMode={isDarkMode}
            />
            <div style={{ marginBottom: "60px" }}>
              <div id="bj-radio" style={{ zIndex: 1 }}>
                <Button
                  className={'hit' + (selected_bj === 'hit' ? ' active' : '')}
                  variant="contained"
                  disabled={disabledButtons}
                  style={{ opacity: disabledButtons ? 0.5 : 1 }}
                  onClick={this.handleHit}
                >
                  HIT!&nbsp;<span className="roll-tag">[H]</span>
                </Button>
                <Button
                  className={'stand' + (selected_bj === 'stand' ? ' active' : '')}
                  variant="contained"
                  disabled={disabledButtons}
                  style={{ opacity: disabledButtons ? 0.5 : 1 }}
                  onClick={this.handleStand}
                >
                  STAND&nbsp;<span className="roll-tag">[S]</span>
                </Button>

                {/* <Button
                  className={'hit' + (selected_bj === 'hit' ? ' active' : '')}
                  variant="contained"
                  disabled={disabledButtons}
                  style={{ opacity: disabledButtons ? 0.5 : 1 }}
                  onClick={() => {
                    this.hit();
                    const currentActive = document.querySelector('.active');
                    if (currentActive) {
                      currentActive.style.animation = 'none';
                      void currentActive.offsetWidth;
                      currentActive.style.animation = 'pulse 0.2s ease-in-out ';
                    }
                  }}
                >
                  SPLIT
                </Button>
                <Button
                  className={
                    'stand' + (selected_bj === 'stand' ? ' active' : '')
                  }
                  variant="contained"
                  disabled={disabledButtons}
                  style={{ opacity: disabledButtons ? 0.5 : 1 }}
                  onClick={() => {
                    this.joinGame();
                    const currentActive = document.querySelector('.active');
                    if (currentActive) {
                      currentActive.style.animation = 'none';
                      void currentActive.offsetWidth;
                      currentActive.style.animation = 'pulse 0.2s ease-in-out ';
                    }
                  }}
                >
                  DOUBLE
                </Button> */}
              </div>
              <Button
                className="place-bet btnBlackjack"
                color="primary"
                onClick={() => this.onBtnBetClick()}
                variant="contained"
                style={{ opacity: !disabledButtons ? 0.5 : 1 }}

                disabled={!disabledButtons}
              >
                PLACE BET&nbsp;<span className="roll-tag">[SPACE]</span>
              </Button>
            </div>


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
  isDarkMode: state.auth.isDarkMode,
  isAuthenticated: state.auth.isAuthenticated,
  accessory: state.logic.curRoomInfo.accessory,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name,
  rank: state.logic.curRoomInfo.rank,
  isLowGraphics: state.auth.isLowGraphics,
  isFocused: state.auth.isFocused,
  isMusicEnabled: state.auth.isMusicEnabled
});

const mapDispatchToProps = {
  openGamePasswordModal,
  deductBalanceWhenStartBlackjack
  // updateBetResult: (betResult) => dispatch(updateBetResult(betResult))
};

export default connect(mapStateToProps, mapDispatchToProps)(Blackjack);
