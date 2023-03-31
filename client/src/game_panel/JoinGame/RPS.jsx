import React, { Component  } from 'react';
import { connect } from 'react-redux';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
// import { updateBetResult } from '../../redux/Logic/logic.actions';
import Lottie from 'react-lottie';
import { Button, TextField  } from '@material-ui/core';
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
// import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
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

const styles = {
  focused: {
    borderColor: '#fa3fa0',
  },
};

const options = [
  { classname: 'rock', selection: 'R' },
  { classname: 'paper', selection: 'P' },
  { classname: 'scissors', selection: 'S' }
];

const twitterLink = window.location.href;

const calcWinChance = (prevStates) => {
  let total = prevStates.length;
  let rock = 0;
  let paper = 0;
  let scissors = 0;
  prevStates.map((el) => {
    if (el.rps === "R") {
      rock++;
    } else if (el.rps === "P") {
      paper++;
    } else if (el.rps === "S") {
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
    return lowest.toFixed(2) + "%";
  }
  return lowest.toFixed(2) + "% - " + highest.toFixed(2) + "%";
};

const predictNext = (rps_list) => {
  // Create a transition matrix to store the probability of transitioning from one state to another
  const transitionMatrix = {
    R: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
    P: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
    S: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
  };

  // Iterate through the previous states to populate the transition matrix
  for (let i = 0; i < rps_list.length - 3; i++) {
    transitionMatrix[rps_list[i].rps][rps_list[i + 1].rps][rps_list[i + 2].rps][rps_list[i + 3].rps]++;
  }

  // Normalize the transition matrix
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

// Check for consistency
const winChance = calcWinChance(rps_list);
let deviation = 0;
if (winChance !== "33.33%") {
    deviation = (1 - (1 / 3)) / 2;
}
// Use the transition matrix to predict the next state based on the current state
let currentState1 = rps_list[rps_list.length - 3].rps;
let currentState2 = rps_list[rps_list.length - 2].rps;
let currentState3 = rps_list[rps_list.length - 1].rps;
let nextState = currentState3;
let maxProb = 0;
Object.keys(transitionMatrix[currentState1][currentState2][currentState3]).forEach((state) => {
  if (transitionMatrix[currentState1][currentState2][currentState3][state] > maxProb) {
    maxProb = transitionMatrix[currentState1][currentState2][currentState3][state];
    nextState = state;
  }
});

// Add randomness
let randomNum = Math.random();
if (randomNum < deviation) {
  let randomState = '';
  do {
      randomNum = Math.random();
      if (randomNum < (1 / 3)) {
          randomState = 'R';
      } else if (randomNum < (2 / 3)) {
          randomState = 'P';
      } else {
          randomState = 'S';
      }
  } while (randomState === currentState3);
  nextState = randomState;
}
return nextState;
}

class RPS extends Component {
  constructor(props) {
    super(props);

    this.settingsRef = React.createRef();
    this.socket = this.props.socket;
    this.state = {
      betting: false,
    timer: null,
    timerValue: 1000,
      clicked: true,
      intervalId: null,
      items: [],
      bgColorChanged: false,

      selected_rps: '',
      advanced_status: '',
      is_anonymous: false,
      bet_amount: 1,
      bankroll: parseFloat(this.props.bet_amount) - this.getPreviousBets(),
      // bankroll: 0,
      betResult: null,
      copied: false,
      balance: this.props.balance,
      isPasswordCorrect: this.props.isPasswordCorrect,
      slippage: 100,
      betResults: props.betResults,
      settings_panel_opened: false,
      
    };
    this.panelRef = React.createRef();
    this.onChangeState = this.onChangeState.bind(this);

  }

  onChangeState(e) {
    this.setState({bet_amount: e.target.value});
    this.setState({potential_return: e.target.value*2});
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

changeBgColor = async (result) => {
  this.setState({ betResult: result, bgColorChanged: true });
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 1 second
  this.setState({ bgColorChanged: false });
};


  // handleClickOutside = e => {
  //   if (this.settingsRef && !this.settingsRef.current.contains(e.target)) {
  //     this.setState({ settings_panel_opened: false });
  //   }
  // };

  componentDidMount = () => {
    
  // Initialize items array
  const items = [
    {
      label: "Host",
      value: this.props.creator
    },
    {
      label: "Bankroll",
      value: convertToCurrency(this.state.bankroll)
    },
    {
      label: "Bet Amount",
      value: convertToCurrency(this.state.bet_amount)
    },
    {
      label: "Potential Return",
      value: convertToCurrency(
        updateDigitToPoint2(this.state.bet_amount * 2 /* * 0.95 */)
      )
    }
  ];
  this.setState({ items });
    const { socket } = this.props
    socket.on('UPDATED_BANKROLL', data => {
      this.setState({ bankroll: data.bankroll })
    })
    document.addEventListener('mousedown', this.handleClickOutside);
  };

  componentWillUnmount = () => {
    clearInterval(this.state.intervalId);
    document.removeEventListener('mousedown', this.handleClickOutside);
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
    const { roomInfo } = this.props;
    const { isPasswordCorrect, selected_rps } = this.state;
  
    if (prevProps.roomInfo && roomInfo) {
      if (prevProps.roomInfo.bet_amount !== roomInfo.bet_amount) {
        this.setState({
          bankroll: parseFloat(roomInfo.bet_amount) - this.getPreviousBets()
        });
      }
    }
  
    if (prevState.isPasswordCorrect !== isPasswordCorrect && isPasswordCorrect === true) {
      this.joinGame(selected_rps);
    }
  }
  

  joinGame = async () => {
    const {
      rps_bet_item_id,
      isDarkMode,
      refreshHistory,
      join,
    } = this.props;
  
    const { selected_rps, is_anonymous, slippage, bet_amount } = this.state;
  
    const result = await join({
      bet_amount: parseFloat(bet_amount),
      selected_rps: selected_rps,
      is_anonymous: is_anonymous,
      rps_bet_item_id: rps_bet_item_id,
      slippage: slippage,
    });
  
    let text;
    if (result.betResult === 1) {
      text = 'NOT BAD, WINNER!';
      this.changeBgColor(result.betResult);
    } else if (result.betResult === 0) {
      text = 'DRAW, NO WINNER!';
      this.changeBgColor(result.betResult);
    } else {
      text = 'HAHAA, YOU LOST!!!';
      this.changeBgColor(result.betResult);
    }
  
    gameResultModal(
      isDarkMode,
      text,
      result.betResult,
      'Okay',
      null,
      () => {},
      () => {}
    );
  
    if (result.status === 'success') {
      const { user, room } = this.props;
      this.setState((prevState) => ({
        betResults: [
          ...prevState.betResults,
          { ...result, user: user, room: room },
        ],
      }));
    } else {
      if (result.message) {
        alertModal(isDarkMode, result.message);
      }
    }
  
    const stored_rps_array = JSON.parse(
      localStorage.getItem('rps_array')
    ) || [];
  
    while (stored_rps_array.length >= 20) {
      stored_rps_array.shift();
    }
  
    stored_rps_array.push({ rps: selected_rps });
    localStorage.setItem('rps_array', JSON.stringify(stored_rps_array));
  
    refreshHistory();
  };
  
  
  
onBtnBetClick = async () => {
  const { openGamePasswordModal, isAuthenticated, isDarkMode, creator_id, user_id, balance, is_private, roomInfo } = this.props;
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
  
  if (!validateBankroll(bet_amount, bankroll, isDarkMode)) {
    return;
  }

  const rooms = JSON.parse(localStorage.getItem("rooms")) || {};
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
  

  handlehalfxButtonClick() {
    const multipliedBetAmount = this.state.bet_amount * 0.5;
    const roundedBetAmount = Math.floor(multipliedBetAmount * 100) / 100;
    this.setState({
    bet_amount: roundedBetAmount
    }, () => {
    document.getElementById("betamount").focus();
    });
    }

  handle2xButtonClick() {
    const maxBetAmount = this.state.balance;
    const multipliedBetAmount = this.state.bet_amount * 2;
    const limitedBetAmount = Math.min(multipliedBetAmount, maxBetAmount, this.props.bet_amount);
    const roundedBetAmount = Math.floor(limitedBetAmount * 100) / 100;
    if (roundedBetAmount < -2330223) {
      alertModal(this.props.isDarkMode, "NOW, THAT'S GETTING A BIT CRAZY NOW ISN'T IT?");
    } else {
      this.setState({
        bet_amount: roundedBetAmount
      }, () => {
      document.getElementById("betamount").focus();
      });
    }
  }

    handleMaxButtonClick() {
      const maxBetAmount = (this.state.balance).toFixed(2);
      this.setState({
        bet_amount: Math.min(maxBetAmount, this.props.bet_amount)
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
    const { isDarkMode, is_private, openGamePasswordModal, roomInfo } = this.props;
    
    const storageName = "rps_array";
    if (!validateLocalStorageLength(storageName, isDarkMode)) {
      return;
    }
    const stored_rps_array = JSON.parse(localStorage.getItem(storageName)) || [];
  
    const intervalId = setInterval(() => {
      const randomItem = predictNext(stored_rps_array);
      const rooms = JSON.parse(localStorage.getItem("rooms")) || {};
      const passwordCorrect = rooms[roomInfo._id];
      if (is_private === true && passwordCorrect !== 'true') {
        openGamePasswordModal();
      } else {
        this.joinGame2(randomItem);
      }
    }, 3500);
  
    this.setState({ intervalId, betting: true });
  };

  stopBetting = () => {

    clearInterval(this.state.intervalId);
    this.setState({ intervalId: null, betting: false, timerValue: 1000 });
  };

  joinGame2 = async (randomItem) => {
    const { rps_bet_item_id, balance, isDarkMode, refreshHistory } = this.props;
    const { bet_amount, bankroll, slippage, is_anonymous, selected_rps } = this.state;
  
    this.setState({ selected_rps: randomItem });

    if (!validateBetAmount(bet_amount, balance, isDarkMode)) {
      return;
    }
    if (!validateBankroll(bet_amount, bankroll, isDarkMode)) {
      return;
    }

    const result = await this.props.join({
      bet_amount: parseFloat(bet_amount),
      selected_rps: selected_rps,
      is_anonymous: is_anonymous,
      rps_bet_item_id: rps_bet_item_id,
      slippage: slippage
    });
  
    const currentUser = this.props.user;
    const currentRoom = this.props.room;
    if (result.status === 'success') {
      this.setState(prevState => ({
        betResults: [...prevState.betResults, {...result, user: currentUser, room: currentRoom}]
      }));
      let text = 'HAHAA, YOU LOST!!!';
  
      if (result.betResult === 1) {
        // this.props.updateBetResult('win')
        text = 'NOT BAD, WINNER!';
        this.changeBgColor(result.betResult); // Add this line
      } else if (result.betResult === 0) {
        // this.props.updateBetResult('draw')
        text = 'DRAW, NO WINNER!';
        this.changeBgColor(result.betResult); // Add this line
      } else {
        this.changeBgColor(result.betResult); // Add this line
        //  this.props.updateBetResult('lose')
      }
  
      refreshHistory();
    }
  };

  render() {
    const styles = ['copy-btn'];
    let text = 'COPY CONTRACT';

   if (this.state.clicked) {
   styles.push('clicked');
   text = 'COPIED!';
   }
    return (
      <div className="game-page">
        <div className="page-title">
          <h2>PLAY - RPS</h2>
        </div>
        <div className="game-contents">
        <div className="pre-summary-panel">
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
                    updateDigitToPoint2(this.state.bet_amount * 2 /* * 0.95 */)
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
            {/* <SettingsOutlinedIcon
              id="btn-rps-settings"
              onClick={() =>
                this.setState({
                  settings_panel_opened: !this.state.settings_panel_opened
                })
              }
            />
            <div
              ref={this.settingsRef}
              className={`transaction-settings game-info-panel ${
                this.state.settings_panel_opened ? 'active' : ''
              }`}
            >
              <h5>Transaction Settings</h5>
              <p>Slippage tolerance</p>
              <div className="slippage-select-panel">
                <button
                  className={this.state.slippage === 100 ? 'active' : ''}
                  onClick={() => {
                    this.setState({ slippage: 100 });
                  }}
                >
                  100%
                </button>
                <button
                  className={this.state.slippage === 200 ? 'active' : ''}
                  onClick={() => {
                    this.setState({ slippage: 200 });
                  }}
                >
                  200%
                </button>
                <button
                  className={this.state.slippage === 500 ? 'active' : ''}
                  onClick={() => {
                    this.setState({ slippage: 500 });
                  }}
                >
                  500%
                </button>
                <button
                  className={this.state.slippage === 'unlimited' ? 'active' : ''}
                  onClick={() => {
                    this.setState({ slippage: 'unlimited' });
                  }}
                >
                  Unlimited
                </button>
              </div>
            </div> */}
          </div>
          <div
            className="game-info-panel"
            style={{ position: 'relative', zIndex: 10 }}
          >
            <h3 className="game-sub-title">Select: Rock - Paper - Scissors!</h3>
            <div id="rps-radio" style={{ zIndex: 1 }}>
              {options.map(({ classname, selection }) => (
    <Button
    variant="contained"
    id={`rps-${classname}`}
    className={`rps-option ${classname}${this.state.selected_rps === selection ? ' active' : ''}${this.state.bgColorChanged && this.state.betResult === -1 && this.state.selected_rps === selection ? ' lose-bg' : ''}${this.state.betResult === 0 && this.state.selected_rps === selection ? ' draw-bg' : ''}${this.state.betResult === 1 && this.state.selected_rps === selection ? ' win-bg' : ''}`}
    onClick={() => {
      this.setState({ selected_rps: selection });
      this.onBtnBetClick(selection);
    }}
  />

  ))}



</div>
<div className="your-bet-amount">
         
   <TextField
  id="betamount"
  label="BET AMOUNT"
  type="text"
  inputProps={{
    pattern: "[0-9]*",
    maxLength: 9,
  }}
  InputLabelProps={{
    shrink: true,
  }}
  value={this.state.bet_amount}
  onChange={this.onChangeState}
  InputProps={{
    endAdornment: "BUSD",
  }}
/>

          <div className='max'>
            <Button variant="contained" color="primary" onClick={() => this.handlehalfxButtonClick()}>0.5x</Button>
            <Button variant="contained" color="primary" onClick={() => this.handle2xButtonClick()}>2x</Button>
            <Button variant="contained" color="primary" onClick={() => this.handleMaxButtonClick()}>Max</Button>
          </div>

        </div>
        <Button
        id="aiplay"
        variant="contained"
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
        </Button>
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
  isAuthenticated: state.auth.isAuthenticated,

  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  isDarkMode: state.auth.isDarkMode,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name,
  betResults: state.logic.betResults

});

const mapDispatchToProps = {
  openGamePasswordModal

  // updateBetResult: (betResult) => dispatch(updateBetResult(betResult))
};

export default connect(mapStateToProps, mapDispatchToProps)(RPS);
