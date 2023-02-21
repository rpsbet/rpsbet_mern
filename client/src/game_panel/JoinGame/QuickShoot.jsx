import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/spinningIcon';
import { updateBetResult } from '../../redux/Logic/logic.actions';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';
import { FaClipboard } from 'react-icons/fa';

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice"
  }
};
const twitterLink = window.location.href;

class QuickShoot extends Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;
    this.state = {
      items: [],
      betting: false,
    timer: null,
    timerValue: 1000,
        clicked: true,
        intervalId: null,
      selected_qs_position: 0,
      advanced_status: '',
      copied: false,
      is_anonymous: false,
      bet_amount: 1,
      potential_return: 1.25,
      bankroll: parseFloat(this.props.bet_amount) - this.getPreviousBets(),
      balance: this.props.balance,
      betResults: props.betResults,
      isPasswordCorrect: this.props.isPasswordCorrect
    };
    this.handlePositionSelection = this.handlePositionSelection.bind(this);
    this.onChangeState = this.onChangeState.bind(this);
    this.panelRef = React.createRef();

  }


  componentDidMount = () => {
    
    const { socket } = this.props
    socket.on('UPDATED_BANKROLL', data => {
      this.setState({ bankroll: data.bankroll })
    })

    // document.addEventListener('mousedown', this.handleClickOutside);
  };

  componentWillUnmount = () => {
    clearInterval(this.state.intervalId);
    document.removeEventListener('mousedown', this.handleClickOutside);
    this.panelRef.current.removeEventListener("scroll", this.handleScroll);
  }; 

  handleScroll = (event) => {
    const panel = event.target;
    const scrollLeft = panel.scrollLeft;
    const maxScrollLeft = panel.scrollWidth - panel.clientWidth;
    
    if (scrollLeft >= maxScrollLeft) {
      // Scrolled to or beyond end of panel, so append items to array and restart animation
      const items = this.state.items.concat(this.state.items);
      this.setState({ items }, () => {
        panel.style.animation = "none";
        panel.scrollTo({ left: 0, behavior: "auto" });
        void panel.offsetWidth;
        panel.style.animation = "ticker 20s linear infinite";
      });
    } else {
      panel.style.animation = "none";
    }
  };
  


  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.isPasswordCorrect !== props.isPasswordCorrect ||
      current_state.balance !== props.balance
    ) {
      return {
        ...current_state,
        balance: props.balance,
        isPasswordCorrect: props.isPasswordCorrect
      };
    }

    return null;
  }

  getPreviousBets() {
    let previousBets = 0;
    if (this.props.roomInfo && this.props.roomInfo.game_log_list) {
      this.props.roomInfo.game_log_list.forEach(room_history => {
        if(room_history.bet_amount){
          previousBets += parseFloat(room_history.bet_amount);
        }
      });
    }
    return previousBets;
  }
  

  handlePositionSelection(position) {
    this.setState({ selected_qs_position: position });
    this.onBtnBetClick(position);
    // console.log('selected qs', position);
    // console.log('bet_amount', this.state.bet_amount);
  }

  // onLeftPositionButtonClicked = e => {
  //   e.preventDefault();
  //   if (this.state.selected_qs_position > 0) {
  //     this.setState({
  //       selected_qs_position: this.state.selected_qs_position - 1
  //     });
  //   }
  // };

  // onRightPositionButtonClicked = e => {
  //   e.preventDefault();
  //   if (this.state.selected_qs_position < this.props.qs_game_type - 1) {
  //     this.setState({
  //       selected_qs_position: this.state.selected_qs_position + 1
  //     });
  //   }
  // };

  
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.roomInfo && this.props.roomInfo) {
      if (prevProps.roomInfo.bet_amount !== this.props.roomInfo.bet_amount) {
        this.setState({
          bankroll: parseFloat(this.props.roomInfo.bet_amount) - this.getPreviousBets()
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

  joinGame = async (selected_qs_position, bet_amount) => {
    this.setState({selected_qs_position: selected_qs_position, bet_amount: this.state.bet_amount});

    const result = await this.props.join({
      bet_amount: parseFloat(this.state.bet_amount),

      selected_qs_position: selected_qs_position,
      is_anonymous: this.state.is_anonymous,
      qs_bet_item_id: this.props.qs_bet_item_id,

    });
    this.onBtnBetClick(result);

    if (result.status === 'success') {
      let text = 'HAHAA, YOU SUCK!!!';

      if (result.betResult === 1) {
        text = 'NICE SHOT, WINNER!!';
      } else if (result.betResult === 0) {
        text = 'Draw, No Winner!';
      }

      if (result.roomStatus === 'finished') {
        gameResultModal(
          this.props.isDarkMode,
          text,
          result.betResult,
          'Okay',
          null,
          () => {
            history.push('/');
          },
          () => {}
        );
      } else {
        gameResultModal(
          this.props.isDarkMode,
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
        alertModal(this.props.isDarkMode, result.message);
      }
    }

   
    let stored_qs_array;

    if (this.props.qs_game_type === 2) {
      stored_qs_array = JSON.parse(localStorage.getItem("qs_array_2")) || [];
    } else if (this.props.qs_game_type === 3) {
      stored_qs_array = JSON.parse(localStorage.getItem("qs_array_3")) || [];
    } else if (this.props.qs_game_type === 4) {
      stored_qs_array = JSON.parse(localStorage.getItem("qs_array_4")) || [];
    } else if (this.props.qs_game_type === 5) {
      stored_qs_array = JSON.parse(localStorage.getItem("qs_array_5")) || [];
    }
    stored_qs_array.push({qs: selected_qs_position, room_id: this.props.qs_bet_item_id});
    
    if (this.props.qs_game_type === 2) {
      localStorage.setItem("qs_array_2", JSON.stringify(stored_qs_array));
    } else if (this.props.qs_game_type === 3) {
      localStorage.setItem("qs_array_3", JSON.stringify(stored_qs_array));
    } else if (this.props.qs_game_type === 4) {
      localStorage.setItem("qs_array_4", JSON.stringify(stored_qs_array));
    } else if (this.props.qs_game_type === 5) {
      localStorage.setItem("qs_array_5", JSON.stringify(stored_qs_array));
    }
    
    console.log(JSON.parse(localStorage.getItem("qs_array_" + this.props.qs_game_type)));
    this.props.refreshHistory();
    
  };

  
  
  handlehalfxButtonClick() {
    const multipliedBetAmount = this.state.bet_amount * 0.5;
    const roundedBetAmount = Math.floor(multipliedBetAmount * 100) / 100;
    this.setState({
    bet_amount: roundedBetAmount
    }, () => {
    document.getElementById("betamount").focus();
    });
    }

  
    handle2xButtonClick = () => {
      const multipliedBetAmount = this.state.bet_amount * 2;
      const limitedBetAmount = Math.min(multipliedBetAmount, this.state.balance);
      const roundedBetAmount = Math.floor(limitedBetAmount * 100) / 100;
    // console.log(( (this.state.bet_amount * 2)/ (this.props.qs_game_type - 1)));
    // console.log(this.state.bankroll);
      if (roundedBetAmount < -2330223) {
        alertModal(this.props.isDarkMode, "NOW, THAT'S GETTING A BIT CRAZY NOW ISN'T IT?");
      } else if (( (this.state.bet_amount * 2)/ (this.props.qs_game_type - 1)) > (this.state.bankroll)) {
        alertModal(this.props.isDarkMode, "EXCEEDED BANKROLL");
      } else {
        this.setState({
          bet_amount: roundedBetAmount
        }, () => {
        document.getElementById("betamount").focus();
        });
      }
    };
        
calcWinChance = (gametype, rounds) => {
    let positionCounts = new Array(gametype + 1).fill(0);
    for (let i = 0; i < rounds.length; i++) {
      positionCounts[rounds[i].qs]++;

    }
    // console.log('position counts', positionCounts)
    let entropy = 0;
    for (let i = 0; i < gametype; i++) {
      if (positionCounts[i] === 0) {
        continue;
      }
      let probability = positionCounts[i] / rounds.length;
      entropy -= probability * Math.log2(probability);
    }
    // console.log('entropy', entropy)
    let winChanceMin = Math.max(0, (1 - entropy / Math.log2(gametype)) / gametype);
    let winChanceMax = Math.min(1, (1 - entropy / Math.log2(gametype)));
    winChanceMin *= 100;
    winChanceMax *= 100;
    return winChanceMin.toFixed(2) + '% - ' + winChanceMax.toFixed(2) + '%';
  }

 predictNext = (qs_list, gameType) => {
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
      transitionMatrix[qs_list[i].qs][qs_list[i + 1].qs][qs_list[i + 2].qs][qs_list[i + 3].qs]++;
    }
  
    Object.keys(transitionMatrix).forEach((fromState1) => {
      Object.keys(transitionMatrix[fromState1]).forEach((fromState2) => {
        Object.keys(transitionMatrix[fromState1][fromState2]).forEach((fromState3) => {
          const totalTransitions = Object.values(transitionMatrix[fromState1][fromState2][fromState3]).reduce((a, b) => a + b);
          Object.keys(transitionMatrix[fromState1][fromState2][fromState3]).forEach((toState) => {
            transitionMatrix[fromState1][fromState2][fromState3][toState] /= totalTransitions;
          });
        });
      });
    });
  
    const winChance = this.calcWinChance(this.props.qs_game_type, qs_list);
    let deviation = 0;
    if (winChance !== "33.33%") {
        deviation = (1 - (1 / gameType)) / 2;
    }
  
    let currentState1 = qs_list[qs_list.length - 3].qs;
    let currentState2 = qs_list[qs_list.length - 2].qs;
    let currentState3 = qs_list[qs_list.length - 1].qs;
    let nextState = currentState3;
    let maxProb = 0;
    Object.keys(transitionMatrix[currentState1][currentState2][currentState3]).forEach((state) => {
      if (transitionMatrix[currentState1][currentState2][currentState3][state] > maxProb) {
        maxProb = transitionMatrix[currentState1][currentState2][currentState3][state];
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


  handleMaxButtonClick() {
    const maxBetAmount = (this.state.balance).toFixed(2);
    
    this.setState({
      bet_amount: Math.min(maxBetAmount, this.state.bankroll * (this.props.qs_game_type - 1))
    }, () => {
    document.getElementById("betamount").focus();
    });
  }
  
  toggleBtnHandler = () => {
    this.setState({
      clicked:!this.state.clicked,
      text: 'LINK GRABBED'
    });
    setTimeout(() => {
      this.setState({
        clicked:!this.state.clicked,
        text: ''
      });
    }, 1000);
  }

  copy() {
    navigator.clipboard.writeText(twitterLink)
  }


updatePotentialReturn = () => {
  this.setState({
    potential_return: (this.state.bet_amount / (this.props.qs_game_type - 1)) + parseFloat(this.state.bet_amount)  /* 0.95 */
  });
};

  onChangeState(e) {
    this.setState({ bet_amount: e.target.value }, this.updatePotentialReturn);
}


calcWinChance = (gametype, rounds) => {
  let positionCounts = new Array(gametype + 1).fill(0);
  for (let i = 0; i < rounds.length; i++) {
    positionCounts[rounds[i].qs]++;

  }
  // console.log('position counts', positionCounts)
  let entropy = 0;
  for (let i = 0; i < gametype; i++) {
    if (positionCounts[i] === 0) {
      continue;
    }
    let probability = positionCounts[i] / rounds.length;
    entropy -= probability * Math.log2(probability);
  }
  // console.log('entropy', entropy)
  let winChanceMin = Math.max(0, (1 - entropy / Math.log2(gametype)) / gametype);
  let winChanceMax = Math.min(1, (1 - entropy / Math.log2(gametype)));
  winChanceMin *= 100;
  winChanceMax *= 100;
  return winChanceMin.toFixed(2) + '% - ' + winChanceMax.toFixed(2) + '%';
}

predictNext = (qs_list, gameType) => {
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
    transitionMatrix[qs_list[i].qs][qs_list[i + 1].qs][qs_list[i + 2].qs][qs_list[i + 3].qs]++;
  }

  Object.keys(transitionMatrix).forEach((fromState1) => {
    Object.keys(transitionMatrix[fromState1]).forEach((fromState2) => {
      Object.keys(transitionMatrix[fromState1][fromState2]).forEach((fromState3) => {
        const totalTransitions = Object.values(transitionMatrix[fromState1][fromState2][fromState3]).reduce((a, b) => a + b);
        Object.keys(transitionMatrix[fromState1][fromState2][fromState3]).forEach((toState) => {
          transitionMatrix[fromState1][fromState2][fromState3][toState] /= totalTransitions;
        });
      });
    });
  });

  const winChance = this.calcWinChance(this.props.qs_game_type, qs_list);
  let deviation = 0;
  if (winChance !== "33.33%") {
      deviation = (1 - (1 / gameType)) / 2;
  }

  let currentState1 = qs_list[qs_list.length - 3].qs;
  let currentState2 = qs_list[qs_list.length - 2].qs;
  let currentState3 = qs_list[qs_list.length - 1].qs;
  let nextState = currentState3;
  let maxProb = 0;
  Object.keys(transitionMatrix[currentState1][currentState2][currentState3]).forEach((state) => {
    if (transitionMatrix[currentState1][currentState2][currentState3][state] > maxProb) {
      maxProb = transitionMatrix[currentState1][currentState2][currentState3][state];
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

  onBtnBetClick = (selected_qs_position) => {
    // e.preventDefault();

    if (this.props.creator_id === this.props.user_id) {
      alertModal(
        this.props.isDarkMode,
        `DIS YOUR OWN STAKE CRAZY FOO-!`
      );
      return;
    }
    if (isNaN(this.state.bet_amount)) {
      alertModal(this.props.isDarkMode, 'ENTER A VALID NUMBER WANKER!');
      return;
      }

      if (((this.state.bet_amount / (this.props.qs_game_type - 1)) + parseFloat(this.state.bet_amount)) - (this.state.bankroll *  (this.props.qs_game_type - 1)) > (this.state.bankroll)) {
        alertModal(this.props.isDarkMode, `NOT ENOUGHT BANKROLL!`);
        return;
      }
  
      if (this.state.bet_amount <= 0) {
        alertModal(this.props.isDarkMode, `ENTER AN AMOUNT DUMBASS!`);
        return;
      }


    if (this.state.bet_amount > this.state.balance) {
      alertModal(this.props.isDarkMode, `MAKE A DEPOSIT, BROKIE!`);
      return;
    }

    confirmModalCreate(
      this.props.isDarkMode,
      'ARE YOU SURE YOU WANT TO PLACE THIS BET?',
      'Yes',
      'Cancel',
      async () => {
        if (this.props.is_private === true) {
          this.props.openGamePasswordModal();
        } else {
          this.joinGame(selected_qs_position);
        }
      }
    );
  };
  handleButtonClick = () => {

    if (this.props.creator_id === this.props.user_id) {
      alertModal(
        this.props.isDarkMode,
        `DIS YOUR OWN STAKE CRAZY FOO-!`
      );
      return;
    }
    if (isNaN(this.state.bet_amount)) {
      alertModal(this.props.isDarkMode, 'ENTER A VALILD NUMBER WANKER!');
      return;
      }
      if (this.state.bet_amount <= 0) {
        alertModal(this.props.isDarkMode, `ENTER AN AMOUNT DUMBASS!`);
        return;
      }


    if (this.state.bet_amount > this.state.balance) {
      alertModal(this.props.isDarkMode, `MAKE A DEPOSIT, BROKIE!`);
      return;
    }



    if (!this.state.betting) {
      this.setState({
        timer: setInterval(() => {
          this.setState(state => {
            if (state.timerValue === 0) {
              clearInterval(this.state.timer);
              this.startBetting();
              return { timerValue: 1000 };
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
      this.setState({ timerValue: 1000 });
    }
  };

  startBetting = () => {
    let stored_qs_array;
  
    if (this.props.qs_game_type === 2) {
      stored_qs_array = JSON.parse(localStorage.getItem("qs_array_2")) || [];
    } else if (this.props.qs_game_type === 3) {
      stored_qs_array = JSON.parse(localStorage.getItem("qs_array_3")) || [];
    } else if (this.props.qs_game_type === 4) {
      stored_qs_array = JSON.parse(localStorage.getItem("qs_array_4")) || [];
    } else if (this.props.qs_game_type === 5) {
      stored_qs_array = JSON.parse(localStorage.getItem("qs_array_5")) || [];
    }
    

  
    if (stored_qs_array.length < 3) {
      alertModal(this.props.isDarkMode, "MORE TRAINING DATA NEEDED!");
      return;
    }
  
    const intervalId = setInterval(() => {
      const randomItem = this.predictNext(stored_qs_array, this.props.qs_game_type);
      // console.log('wwedw', randomItem)
      this.joinGame2(randomItem, this.state.bet_amount);
    }, 3500);
  
    this.setState({ intervalId, betting: true  });
  };
    

  stopBetting = () => {
    clearInterval(this.state.intervalId);
    this.setState({ intervalId: null,  betting: false, timerValue: 1000 });
  };

  joinGame2 = async (selected_qs_position, bet_amount) => {
    if ( ((this.state.bet_amount / (this.props.qs_game_type - 1)) + parseFloat(this.state.bet_amount) )- (this.state.bankroll *  (this.props.qs_game_type - 1)) > (this.state.bankroll)) {
      alertModal(this.props.isDarkMode, `NOT ENOUGHT BANKROLL!`);
      return;
    }
    this.setState({selected_qs_position: selected_qs_position, bet_amount: this.state.bet_amount});
    const result = await this.props.join({
      bet_amount: parseFloat(this.state.bet_amount),
      selected_qs_position: selected_qs_position,
      is_anonymous: this.state.is_anonymous,
      qs_bet_item_id: this.props.qs_bet_item_id,
      slippage: this.state.slippage
    });

 

    const currentUser = this.props.user;
    const currentRoom = this.props.room;
    if (result.status === 'success') {
      this.setState(prevState => ({
        betResults: [...prevState.betResults, {...result, user: currentUser, room: currentRoom}]
    }));
      let text = 'HAHAA, YOU LOST!!!';

      if (result.betResult === 1) {
        this.props.updateBetResult('win')
        text = 'NOT BAD, WINNER!';
      } else if (result.betResult === 0) {
        this.props.updateBetResult('draw')
        text = 'DRAW, NO WINNER!';
      }else{
         this.props.updateBetResult('lose')
      }

   
    this.props.refreshHistory();
  };

  }

  renderButtons() {
    const { qs_game_type } = this.props;
    

    if (qs_game_type === 2) {
      return (
        <div className='qs-buttons'>
          <button id="l" onClick={() => this.handlePositionSelection(0)}>
            {/* Left */}
          </button>
          <button id="r" onClick={() => this.handlePositionSelection(1)}>
            {/* Right */}
          </button>
        </div>
      );
    } else if (qs_game_type === 3) {
      return (
        <div className='qs-buttons'>
          <button id="l" onClick={() => this.handlePositionSelection(0)}>
            {/* Left */}
          </button>
          <button id="cc" onClick={() => this.handlePositionSelection(1)}>
            {/* Center */}
          </button>
          <button id="r" onClick={() => this.handlePositionSelection(2)}>
            {/* Right */}
          </button>
        </div>
      );
    } else if (qs_game_type === 4) {
      return (
        <div className='qs-buttons'>
          <button id="tl" onClick={() => this.handlePositionSelection(0)}>
            {/* Top Left */}
          </button>
          <button id="tr" onClick={() => this.handlePositionSelection(1)}>
            {/* Top Right */}
          </button>
          <button id="bl" onClick={() => this.handlePositionSelection(2)}>
            {/* Bottom Left */}
          </button>
          <button id="br" onClick={() => this.handlePositionSelection(3)}>
            {/* Bottom Right */}
          </button>
        </div>
      );
    } else if (qs_game_type === 5) {
      return (
        <div className='qs-buttons'>
          <button id="tl" onClick={() => this.handlePositionSelection(1)}>
            {/* TL */}
          </button>
          <button id="tr"  onClick={() => this.handlePositionSelection(2)}>
            {/* TR */}
          </button>
          <button id="bl"  onClick={() => this.handlePositionSelection(3)}>
            {/* BL */}
          </button>
          <button id="br"  onClick={() => this.handlePositionSelection(4)}>
            {/* BR */}
          </button>
          <button id="c"  onClick={() => this.handlePositionSelection(0)}>
            {/* C */}
          </button>
        </div>
      );
    }
  }

  render() {
    const styles = ['copy-btn'];
    let text = 'COPY CONTRACT';

   if (this.state.clicked) {
   styles.push('clicked');
   text = 'COPIED!';
   }
    let position_name = [
      'Center',
      'Top-Left',
      'Top-Right',
      'Bottom-Left',
      'Bottom-Right'
    ];
    let position_short_name = ['c', 'tl', 'tr', 'bl', 'br'];

    if (this.props.qs_game_type === 2) {
      position_name = ['Left', 'Right'];
      position_short_name = ['bl', 'br'];
    } else if (this.props.qs_game_type === 3) {
      position_name = ['Bottom-Left', 'Center', 'Bottom-Right'];
      position_short_name = ['bl', 'c', 'br'];
    } else if (this.props.qs_game_type === 4) {
      position_name = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'];
      position_short_name = ['tl', 'tr', 'bl', 'br'];
    }

    const host_bet = this.props.bet_amount / (this.props.qs_game_type - 1);

    return (
      <div className="game-page">
        <div className="page-title">
          <h2>PLAY - Quick Shoot</h2>
        </div>
        <div className="game-contents">
        <div className="pre-summary-panel" ref={this.panelRef} onScroll={this.handleScroll}>
        <div className="pre-summary-panel__inner">
          {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="data-item">
                <div>
                  <div className="label host-display-name">Host</div>
                </div>
                <div className="value">{this.props.creator}</div>
              </div>
              <div className="data-item">
                <div>
                  <div className="label your-bet-amount">Bankroll</div>
                </div>
                <div className="value">{convertToCurrency(this.state.bankroll)}</div>
              </div>
              <div className="data-item">
                <div>
                  <div className="label your-bet-amount">Bet Amount</div>
                </div>
                <div className="value">{convertToCurrency(this.state.bet_amount)}</div>
              </div>
              <div className="data-item">
                <div>
                  <div className="label your-max-return">Potential Return</div>
                </div>
                <div className="value">
                  {convertToCurrency(
                  (this.state.bet_amount / (this.props.qs_game_type - 1)) + parseFloat(this.state.bet_amount)  /* 0.95 */
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
    </div>
</div>
          <div className="game-info-panel">
            <h3 className="game-sub-title">Choose WHERE TO SHOOT</h3>
            <div className="qs-image-panel">
              <img
                src={`/img/gametype/quick_shoot/gametype${
                  this.props.qs_game_type
                }/type${this.props.qs_game_type}-${
                  position_short_name[this.state.selected_qs_position]
                }.png`}
                alt=""
                style={{ width: '600px', maxWidth: '100%', borderRadius: '20px',
                boxShadow: '0 0 20px #0e0e0e' }}
              />
                      {this.renderButtons()}

            </div>
            
            <div className="your-bet-amount">
         
          <input
            type="text"
            pattern="[0-9]*"
            name="betamount"
            id="betamount"
            maxLength="9"
            value={this.state.bet_amount}
            onChange={this.onChangeState}
            placeholder="BET AMOUNT"
          />
          <span style={{ marginLeft: '-3.2rem' }}>BUSD</span>
          <a id='max' onClick={() => this.handlehalfxButtonClick()}>0.5x</a>
          <a id='max' onClick={() => this.handle2xButtonClick()}>2x</a>
          <a id='max' onClick={() => this.handleMaxButtonClick()}>Max</a>

        </div>
            {/* <div className="qs-action-panel">
            
              <button
                className="btn-left"
                onClick={this.onLeftPositionButtonClicked}
              ></button>
              <label>{position_name[this.state.selected_qs_position]}</label>
              <button
                className="btn-right"
                onClick={this.onRightPositionButtonClicked}
              ></button>
            </div> */}
            <button
        onMouseDown={this.handleButtonClick}
        onMouseUp={this.handleButtonRelease}
        onTouchStart={this.handleButtonClick}
        onTouchEnd={this.handleButtonRelease}
        >
        {this.state.betting ? (
          <div id="stop">
            <span>Stop</span>
           <Lottie 
        options={defaultOptions}
          width={22}
        />
          </div>
        ) : (
          <div>
            {this.state.timerValue !== 1000 ? (
              <span>
                {(this.state.timerValue / 1000).toFixed(2)}s
              </span>
            ) : (
              <span>AI Play</span>
            )}
          </div>
        )}
        </button>
          </div>
      
          <div className="action-panel">
          <div className="share-options">
          <TwitterShareButton
    url={twitterLink}
    title={`Play against me: ⚔`} // ${this.props.roomInfo.room_name}
    className="Demo__some-network__share-button"
  >
    <TwitterIcon size={32} round />
  </TwitterShareButton>
  {/* <button onClick={() => this.CopyToClipboard()}>Grab Link</button> */}
  <a className={styles.join('')} onClick={() => {
                                    this.toggleBtnHandler();
                                    this.copy();
                                }}>{this.state.clicked ? <input type="text" value={twitterLink} readOnly onClick={this.toggleBtnHandler}/> : null }
  <FaClipboard />&nbsp;{this.state.text}</a>

        </div>
           
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  auth: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  balance: state.auth.balance,
  isDarkMode: state.auth.isDarkMode,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name,
  betResults: state.logic.betResults
});

const mapDispatchToProps = dispatch => ({
  openGamePasswordModal,
  updateBetResult: (betResult) => dispatch(updateBetResult(betResult))
});
export default connect(mapStateToProps, mapDispatchToProps)(QuickShoot);
