import React, { Component  } from 'react';
import { connect } from 'react-redux';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import { updateBetResult } from '../../redux/Logic/logic.actions';
import Lottie from 'react-lottie';
import { Button, TextField  } from '@material-ui/core';
import InlineSVG from 'react-inlinesvg';

import animationData from '../LottieAnimations/spinningIcon';
import Avatar from '../../components/Avatar';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
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


const twitterLink = window.location.href;

const calcWinChance = (prevStates) => {
  let total = prevStates.length;
  let counts = {};
  prevStates.forEach((state) => {
    if (counts[state.drop_amount]) {
      counts[state.drop_amount]++;
    } else {
      counts[state.drop_amount] = 1;
    }
  });
  let lowest = Infinity;
  let highest = -Infinity;
  Object.keys(counts).forEach((key) => {
    const chance = (counts[key] / total) * 100;
    if (chance < lowest) {
      lowest = chance;
    }
    if (chance > highest) {
      highest = chance;
    }
  });
  if (lowest === highest) {
    return lowest.toFixed(2) + "%";
  }
  return lowest.toFixed(2) + "% - " + highest.toFixed(2) + "%";
};


class DropGame extends Component {
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
      drop_guesses: [],
      advanced_status: '',
      is_anonymous: false,
      bet_amount: 1,
      bankroll: parseFloat(this.props.bet_amount) - this.getPreviousBets(),
      drop_guesses1Received: false,
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

// changeBgColor = async (result) => {
//   this.setState({ betResult: result, bgColorChanged: true });
//   await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 1 second
//   this.setState({ bgColorChanged: false });
// };


  // handleClickOutside = e => {
  //   if (this.settingsRef && !this.settingsRef.current.contains(e.target)) {
    //     this.setState({ settings_panel_opened: false });
    //   }
  // };
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

  componentDidMount = () => {
      // Add event listener to detect end of scroll
  this.panelRef.current.addEventListener("scroll", this.handleScroll);
    
  this.socket.on('DROP_GUESSES1', data => {
    if (!this.state.drop_guesses1Received) {
      this.setState({
        drop_guesses: data,
        drop_guesses1Received: true,
      });
    }
  });
  this.socket.on('DROP_GUESSES', data => {
    this.setState({drop_guesses: data });
  });

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
    this.panelRef.current.removeEventListener("scroll", this.handleScroll);
  }; 
  

  predictNext = (dropAmounts) => {
    const minValue = Math.min(...dropAmounts.map(drop => drop.drop_amount));
    const maxValue = Math.max(...dropAmounts.map(drop => drop.drop_amount));
    const rangeSize = Math.ceil((maxValue - minValue) / 200);
  
    const rangeCounts = {};
    dropAmounts.forEach((drop) => {
      const range = Math.floor((drop.drop_amount - minValue) / rangeSize);
      rangeCounts[range] = rangeCounts[range] ? rangeCounts[range] + 1 : 1;
    });
  
    const totalCounts = dropAmounts.length;
    const rangeProbabilities = {};
    Object.keys(rangeCounts).forEach((range) => {
      const rangeProbability = rangeCounts[range] / totalCounts;
      rangeProbabilities[range] = rangeProbability;
    });
  
    let randomValue = Math.random();
    let chosenRange = null;
    Object.entries(rangeProbabilities).some(([range, probability]) => {
      randomValue -= probability;
      if (randomValue <= 0) {
        chosenRange = range;
        return true;
      }
      return false;
    });
  
    const rangeMinValue = parseInt(chosenRange) * rangeSize + minValue;
    const rangeMaxValue = Math.min(rangeMinValue + rangeSize, maxValue);
  
    const getRandomNumberInRange = (min, max) => {
      return Math.random() * (max - min) + min;
    };
  
    return parseFloat(getRandomNumberInRange(rangeMinValue, rangeMaxValue).toFixed(2));
  };
  

  joinGame = async () => {

    this.setState({bet_amount: this.state.bet_amount});
    const result = await this.props.join({
      bet_amount: parseFloat(this.state.bet_amount),
      is_anonymous: this.state.is_anonymous,
      drop_bet_item_id: this.props.drop_bet_item_id,
      // slippage: this.state.slippage
    });
  
    let text = 'HAHAA, YOU LOST!!!';
  
    if (result.betResult === 1) {
      this.props.updateBetResult('win')
      text = 'NOT BAD, WINNER!';
      // this.changeBgColor(result.betResult); // Add this line
    } else if (result.betResult === 0) {
  
      this.props.updateBetResult('draw')
      // this.changeBgColor(result.betResult); // Add this line
      text = 'DRAW, NO WINNER!';
    }else{
      // this.changeBgColor(result.betResult); // Add this line
      this.props.updateBetResult('lose')
    }
  
    let stored_drop_array = JSON.parse(localStorage.getItem("drop_array")) || [];
  
    while (stored_drop_array.length >= 30) {
      stored_drop_array.shift();
    }
    stored_drop_array.push({ drop: this.state.bet_amount });
    localStorage.setItem("drop_array", JSON.stringify(stored_drop_array));
  
  
    gameResultModal(
      this.props.isDarkMode,
      text,
      result.betResult,
      'Okay',
      null,
      () => {
        // history.push('/');
      },
      () => {}
    );
  
    if (result.status === 'success') {
      const currentUser = this.props.user;
      const currentRoom = this.props.room;
      this.setState(prevState => ({
        betResults: [...prevState.betResults, {...result, user: currentUser, room: currentRoom}]
      }));
    } else {
      if (result.message) {
        alertModal(this.props.isDarkMode, result.message);
      }
    }
  
    this.props.refreshHistory();
  };
  
  onBtnBetClick = async () => {

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
  
    if (this.state.bet_amount <= 0) {
      alertModal(this.props.isDarkMode, `ENTER AN AMOUNT DUMBASS!`);
      return;
    }
  
    if (this.state.bet_amount > this.state.balance) {
      alertModal(this.props.isDarkMode, `TOO BROKE FOR THIS BET`);
      return;
    }
  
    if (localStorage.getItem('hideConfirmModal') === 'true') {
      if (this.props.is_private === true) {
        this.props.openGamePasswordModal();
      } else {
        await this.joinGame();
      }
    } else {
      confirmModalCreate(
        this.props.isDarkMode,
        'ARE YOU SURE YOU WANT TO PLACE THIS BET?',
        'Yes',
        'Cancel',
        async () => {
          if (this.props.is_private === true) {
            this.props.openGamePasswordModal();
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
    
    let stored_drop_array = JSON.parse(localStorage.getItem("drop_array")) || [];
    if (stored_drop_array.length  < 3) {
      alertModal(this.props.isDarkMode, "MORE TRAINING DATA NEEDED!");
      return;
    }

    const intervalId = setInterval(() => {
      const randomItem = this.predictNext(stored_drop_array);
      if (this.props.is_private === true) {
        this.props.openGamePasswordModal();
      } else {
        // this.joinGame(selected_drop);
        this.joinGame2(randomItem, this.state.bet_amount);
      }
    }, 3500);

  
    this.setState({ intervalId,betting: true });
  };

  stopBetting = () => {
    clearInterval(this.state.intervalId, this.state.timer);
    this.setState({ intervalId: null, betting: false, timerValue: 1000 });
  };

  joinGame2 = async (selected_drop, bet_amount) => {
    
if (this.state.bet_amount > this.state.bankroll) {
      alertModal(this.props.isDarkMode, `NOT ENOUGHT BANKROLL!`);
      return;
    }

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

    if (this.state.bet_amount >this.state.balance) {
      alertModal(this.props.isDarkMode, `TOO BROKE FOR THIS BET`);
      return;
    }


    this.setState({selected_drop: selected_drop, bet_amount: this.state.bet_amount});
    const result = await this.props.join({
      bet_amount: parseFloat(this.state.bet_amount),
      selected_drop: selected_drop,
      is_anonymous: this.state.is_anonymous,
      drop_bet_item_id: this.props.drop_bet_item_id,
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
        // this.changeBgColor(result.betResult); // Add this line
      } else if (result.betResult === 0) {
        this.props.updateBetResult('draw')
        text = 'DRAW, NO WINNER!';
        // this.changeBgColor(result.betResult); // Add this line
      }else{
        // this.changeBgColor(result.betResult); // Add this line
         this.props.updateBetResult('lose')
      }

   
    this.props.refreshHistory();
  };


   
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
          <h1> DEMO ONLY, GAME UNDER DEVELOPMENT 🚧</h1>
          <h2>PLAY - Drop Game</h2>
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
                <div className="value">???</div>
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
              id="btn-drop-settings"
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
            <div className="game-info-panel">

            <h3 className="game-sub-title">Previous Drops</h3>
            <div className='gradient-container'>

          <p className="previous-guesses drop">
          <div>
  {this.state.drop_guesses.length > 0 ? 
    this.state.drop_guesses.map((guess, index) => 
      <span key={index} 
        style={{
          background: guess.host_drop > guess.bet_amount ? '#e30303c2' : '#e3e103c2', 
          padding: '0.3em 0.9em'
        }}> 
        <InlineSVG id='busd' src={require('./busd.svg')} /> {guess.host_drop}
      </span>
    ) 
    : 
    <span id="no-guesses">No drops yet</span>
  }
</div>
<div>
  {this.state.drop_guesses.length > 0 ? 
    this.state.drop_guesses.map((guess, index) => 
      <span key={index} 
        style={{
          background: guess.host_drop > guess.bet_amount ? '#e3e103c2' : '#e30303c2', 
          padding: '0.3em 0.9em'
        }}> 
        <InlineSVG id='busd' src={require('./busd.svg')} /> {guess.bet_amount}
      </span>
    ) 
    : 
    <span id="no-guesses"></span>
  }
</div>

          </p>
  </div>
  </div>
            <h3 className="game-sub-title">Drop an amount!</h3>
            <div className="your-bet-amount">
              <TextField
                type="text"
                name="betamount"
                variant="outlined"
                id="betamount"
                label="BET AMOUNT"
                value={this.state.bet_amount}
                onChange={(event) => this.setState({ bet_amount: event.target.value })}
                placeholder="DROP AMOUNT"
                inputProps={{
                  pattern: "[0-9]*",
                  maxLength: 9,
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: "BUSD",
                }}
              />
              <div>
              <div className='max'>
            <Button variant="contained" color="primary" onClick={() => this.handlehalfxButtonClick()}>0.5x</Button>
            <Button variant="contained" color="primary" onClick={() => this.handle2xButtonClick()}>2x</Button>
            <Button variant="contained" color="primary" onClick={() => this.handleMaxButtonClick()}>Max</Button>
          </div>
          <Button
        className="place-bet"
        color="primary"
        onClick={() => this.onBtnBetClick()}
        variant="contained"
        >
        DROP AMOUNT
        </Button>
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
  auth: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  isDarkMode: state.auth.isDarkMode,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name,
  betResults: state.logic.betResults

});

const mapDispatchToProps = dispatch => ({
  openGamePasswordModal,

  updateBetResult: (betResult) => dispatch(updateBetResult(betResult))
});

export default connect(mapStateToProps, mapDispatchToProps)(DropGame);
