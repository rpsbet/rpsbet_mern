import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import InlineSVG from 'react-inlinesvg';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import { Button } from '@material-ui/core';
import {
  validateIsAuthenticated,
  validateCreatorId,
  validateBetAmount,
  validateLocalStorageLength,
  validateBankroll
} from '../modal/betValidations';
import Lottie from 'react-lottie';
import animationData from '../LottieAnimations/spinningIcon';
import { FaClipboard } from 'react-icons/fa';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice"
  }
};


const twitterLink = window.location.href;


class Spleesh extends Component {
  constructor(props) {
    super(props);
        this.socket = this.props.socket;

    this.state = {
      betting: false,
      timer: null,
      timerValue: 1000,
      holdTime: 0,
      clicked: true,
      intervalId: null,
      spleesh_guesses1Received: false,
      items: [],
      bet_amount: this.props.spleesh_bet_unit,
      advanced_status: '',
      copied: false,
      spleesh_guesses: [],
      is_anonymous: false,
      balance: this.props.balance,
      isPasswordCorrect: false
    };
    this.panelRef = React.createRef();

  }

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

  onShowButtonClicked = e => {
    e.preventDefault();
  };

  componentDidMount() {
    this.socket.on('SPLEESH_GUESSES', data => {
      this.setState({spleesh_guesses: data });
    });
    this.socket.on('SPLEESH_GUESSES1', data => {
      if (!this.state.spleesh_guesses1Received) {
        this.setState({
          spleesh_guesses: data,
          spleesh_guesses1Received: true,
        });
      }
    });
  }
  

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.isPasswordCorrect !== this.state.isPasswordCorrect &&
      this.state.isPasswordCorrect === true
    ) {
      this.props.join({
        bet_amount: this.state.bet_amount,
        is_anonymous: this.state.is_anonymous
      });
    }
  }

  componentWillUnmount = () => {
    clearInterval(this.state.intervalId);
    document.removeEventListener('mousedown', this.handleClickOutside);
  }; 

  joinGame = async () => {
    const { bet_amount, is_anonymous } = this.state;
    const { join, isDarkMode, spleesh_bet_unit, refreshHistory } = this.props;
  
    const result = await join({ bet_amount, is_anonymous });
  
    if (result.status === 'success') {
      let text = 'HAHAA, YOU LOST!!!';
  
      if (result.betResult === 1) {
        text = 'NOT BAD, WINNER!';
      } else if (result.betResult === 0) {
        text = 'DRAW, NO WINNER!';
      }
  
      const storageName = spleesh_bet_unit === 10 ? 'spleesh_10_array' : 'spleesh_array';
      const storedArray = JSON.parse(localStorage.getItem(storageName)) || [];
  
      while (storedArray.length >= 30) {
        storedArray.shift();
      }
  
      storedArray.push({ spleesh: bet_amount });
      localStorage.setItem(storageName, JSON.stringify(storedArray));
  
      const okCallback = () => {
        if (result.roomStatus === 'finished') {
          history.push('/');
        }
      };
  
      gameResultModal(
        isDarkMode,
        text,
        result.betResult,
        'Okay',
        null,
        okCallback,
        () => {}
      );
    } else {
      if (result.message) {
        alertModal(isDarkMode, result.message);
      }
    }
  
    refreshHistory();
  };
  
  onBtnBetClick = async (bet_amount) => {
    const {
      isAuthenticated,
      isDarkMode,
      creator_id,
      user_id,
      balance,
      is_private,
      roomInfo,
      openGamePasswordModal,
    } = this.props;
  
    const { bankroll } = this.state;
  
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
  
    const hideConfirmModal = localStorage.getItem('hideConfirmModal') === 'true';
  
    if (hideConfirmModal || (is_private !== true || passwordCorrect === true)) {
      await this.joinGame(bet_amount);
    } else {
      openGamePasswordModal();
    }
  };
  

createNumberPanel = () => {
  const { bet_amount } = this.state;
  const { spleesh_bet_unit } = this.props;

  const panel = [];

  for (let i = 1; i <= 10; i++) {
    const amount = i * spleesh_bet_unit;

    panel.push(
      <Button
        className={bet_amount / spleesh_bet_unit === i ? ' active' : ''}
        onClick={() => {
          const endgameAmount = spleesh_bet_unit * (55 - i);
          this.setState(
            {
              bet_amount: amount,
              endgame_amount: endgameAmount,
            },
            () => {
              this.onBtnBetClick(amount);
            }
          );
        }}
        key={i}
      >
        {convertToCurrency(updateDigitToPoint2(amount))}
      </Button>
    );
  }

  return panel;
};

  

  predictNext = (array1, array2) => {
    const frequencyMap = {};
    let maxValue = 0;
    let maxKey = 0;
  
    // Create a frequency map of the spleesh values in array1
    array1.forEach(item => {
      if (!frequencyMap[item.spleesh]) {
        frequencyMap[item.spleesh] = 0;
      }
      frequencyMap[item.spleesh] += 1;
  
      // Keep track of the spleesh value with the highest frequency
      if (frequencyMap[item.spleesh] > maxValue) {
        maxValue = frequencyMap[item.spleesh];
        maxKey = item.spleesh;
      }
    });
  
    // Get all the spleesh values from the frequency map
    const spleeshValues = Object.keys(frequencyMap);
  
    let prediction = maxKey;
    let i = 0;
    const maxAttempts = spleeshValues.length * 2; // set a maximum number of attempts to find a value
    while (array2.some(item => item.bet_amount === prediction)) {
      // Randomize a value from the spleesh values until one is found that doesn't exist in array2 or until the maximum number of attempts is reached
      const randomIndex = Math.floor(Math.random() * spleeshValues.length);
      prediction = Number(spleeshValues[randomIndex]);
  
      i++;
      if (i >= maxAttempts) {
        alertModal(this.props.isDarkMode, `NO MORE AVAILABLE OPTIONS MTF!!`);

        break;
      }
    }
  
    return prediction;
  }
  
  handleButtonClick = () => {
    const { isAuthenticated, creator_id, user_id, isDarkMode } = this.props;
    const { betting, timer } = this.state;
  
    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
      return;
    }
  
    if (!validateCreatorId(creator_id, user_id, isDarkMode)) {
      return;
    }
  
    if (!betting) {
      this.setState({
        timer: setInterval(() => {
          this.setState((state) => {
            if (state.timerValue === 0) {
              clearInterval(timer);
              this.startBetting();
              return { timerValue: 1000 };
            } else {
              return { timerValue: state.timerValue - 10 };
            }
          });
        }, 10),
        betting: true,
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
    const {roomInfo, isDarkMode, is_private, openGamePasswordModal} = this.props;
    const {is_anonymous, spleesh_guesses} = this.state;

    const intervalId = setInterval(() => {
      let storageKey = "spleesh_array";
      if (this.props.spleesh_bet_unit === 10) {
        storageKey = "spleesh_10_array";
      }

      if (!validateLocalStorageLength(storageKey, isDarkMode)) {
        return;
      }

      const rooms = JSON.parse(localStorage.getItem("rooms")) || {};
      const passwordCorrect = rooms[roomInfo._id];
      const nextGuess = this.predictNext(JSON.parse(localStorage.getItem(storageKey)), spleesh_guesses);
        if (is_private === true && passwordCorrect !== true) {
          openGamePasswordModal();

        } else {
        this.joinGame2(nextGuess);
        }
    }, 3500);
  
    this.setState({ intervalId, betting: true });
  };
  

stopBetting = () => {
  clearInterval(this.state.intervalId);
  this.setState({ intervalId: null, betting: false, timerValue: 1000 });
};

joinGame2 = async (nextGuess) => {
const {refreshHistory} = this.props;
const {is_anonymous} = this.state;

  const result = await this.props.join({
    bet_amount: nextGuess,
    is_anonymous: is_anonymous
  });
  if (result.status === 'success') {
    let text = 'HAHAA, YOU LOST!!!';

    if (result.betResult === 1) {
      text = 'NOT BAD, WINNER!';
    } else if (result.betResult === 0) {
      text = 'DRAW, NO WINNER!';
    }
  }
   
  refreshHistory();

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
          <h2>
            PLAY - <i>Spleesh!</i>
          </h2>
        </div>
        <div className="game-contents">
        <div className="pre-summary-panel">
        <div className="pre-summary-panel__inner spleesh">
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
                  <div className="label your-bet-amount">Bet Amount</div>
                </div>
                <div className="value">{convertToCurrency(this.state.bet_amount)}</div>
              </div>
              <div className="data-item">
        <div className="label your-max-return">Potential Return</div>
        <div className="value">
            {convertToCurrency(
                updateDigitToPoint2(
                  this.state.spleesh_guesses.reduce((a, b) => a + b.bet_amount, 0) +
                    // this.props.game_log_list.reduce((a, b) => a + b, 0) +
                    this.state.bet_amount * 2 /* 0.9 */
                )
            )}
        </div>
    </div>
            </React.Fragment>
          ))}
    </div>
</div>
          <div className="game-info-panel">
            <h3 className="game-sub-title">Previous Guesses</h3>
            <p className="previous-guesses">
              
            {this.state.spleesh_guesses.length > 0
    ? this.state.spleesh_guesses.map((guess, index) => <span key={index} style={{background: '#6c757d66', borderRadius: '6px', padding: '0.3em 0.9em', marginRight: '20px' }}> <InlineSVG id='busd' src={require('./busd.svg')} /> {guess.bet_amount + '.00'}</span>)
    : `No guesses yet`}



            </p>
            <h3 className="game-sub-title">Your Number</h3>
            <div id="select-buttons-panel">{this.createNumberPanel()}</div>
            <button
            id="aiplay"
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
  isAuthenticated: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  isDarkMode: state.auth.isDarkMode,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name
});

const mapDispatchToProps = {
  openGamePasswordModal
};

export default connect(mapStateToProps, mapDispatchToProps)(Spleesh);
