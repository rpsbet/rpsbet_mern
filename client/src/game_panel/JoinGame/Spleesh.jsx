import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import InlineSVG from 'react-inlinesvg';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import { Button } from '@material-ui/core';

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
          // Add event listener to detect end of scroll
  this.panelRef.current.addEventListener("scroll", this.handleScroll);
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
  

  joinGame = async () => {
    console.log(this.state.spleesh_guesses);
    const result = await this.props.join({
      bet_amount: this.state.bet_amount,
      is_anonymous: this.state.is_anonymous
    });
    if (result.status === 'success') {
      let text = 'HAHAA, YOU LOST!!!';

      if (result.betResult === 1) {
        text = 'NOT BAD, WINNER!';
      } else if (result.betResult === 0) {
        text = 'DRAW, NO WINNER!';
      }

      let stored_spleesh_array = JSON.parse(localStorage.getItem("spleesh_array")) || [];
      let stored_spleesh_10_array = JSON.parse(localStorage.getItem("spleesh_10_array")) || [];
      
      while (stored_spleesh_array.length >= 30) {
        stored_spleesh_array.shift();
      }
      
      if (this.props.spleesh_bet_unit === 10) {
        while (stored_spleesh_10_array.length >= 30) {
          stored_spleesh_10_array.shift();
        }
        stored_spleesh_10_array.push({ spleesh: this.state.bet_amount });
        localStorage.setItem("spleesh_10_array", JSON.stringify(stored_spleesh_10_array));
        console.log(stored_spleesh_10_array);
      } else {
        stored_spleesh_array.push({ spleesh: this.state.bet_amount });
        localStorage.setItem("spleesh_array", JSON.stringify(stored_spleesh_array));
        console.log(stored_spleesh_array);
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
            // history.push('/');
          },
          () => {}
        );
      }
    } else {
      if (result.message) {
        alertModal(this.props.isDarkMode, result.message);
      }
    }
    this.props.refreshHistory();

  };

  onBtnBetClick = async (betAmount) => {
    if (this.props.creator_id === this.props.user_id) {
      alertModal(
        this.props.isDarkMode,
        `THIS IS YOUR OWN STAKE? ARE YOU OKAY!?`
      );
      return;
    }
  
    if (betAmount > this.state.balance) {
      alertModal(this.props.isDarkMode, `MAKE A DEPOSIT, BROKIE!`);
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
  

  createNumberPanel = () => {
    let panel = [];
    for (let i = 1; i <= 10; i++) {
      panel.push(
        <Button
          className={
            this.state.bet_amount / this.props.spleesh_bet_unit === i
              ? ' active'
              : ''
          }
          onClick={() => {
            const betAmount = i * this.props.spleesh_bet_unit;
            const endgameAmount = this.props.spleesh_bet_unit * (55 - i);
            this.setState({
              bet_amount: betAmount,
              endgame_amount: endgameAmount
            }, () => {
              this.onBtnBetClick(betAmount);
            });
          }}
          key={i}
        >
          {convertToCurrency(updateDigitToPoint2(i * this.props.spleesh_bet_unit))}
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
    const intervalId = setInterval(() => {
      let storageKey = "spleesh_array";
      if (this.props.spleesh_bet_unit === 10) {
        storageKey = "spleesh_10_array";
      }

      if (storageKey.length < 3) {
        alertModal(this.props.isDarkMode, "MORE TRAINING DATA NEEDED!");
        return;
      }
    
      const nextGuess = this.predictNext(JSON.parse(localStorage.getItem(storageKey)), this.state.spleesh_guesses);
      this.joinGame2(nextGuess);
    }, 3500);
  
    this.setState({ intervalId, betting: true });
  };
  

stopBetting = () => {
  clearInterval(this.state.intervalId);
  this.setState({ intervalId: null, betting: false, timerValue: 1000 });
};

joinGame2 = async (nextGuess) => {
  const result = await this.props.join({
    bet_amount: nextGuess,
    is_anonymous: this.state.is_anonymous
  });
  if (result.status === 'success') {
    let text = 'HAHAA, YOU LOST!!!';

    if (result.betResult === 1) {
      text = 'NOT BAD, WINNER!';
    } else if (result.betResult === 0) {
      text = 'DRAW, NO WINNER!';
    }
  }
   
  this.props.refreshHistory();

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
        <div className="pre-summary-panel" ref={this.panelRef} onScroll={this.handleScroll}>
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
    ? this.state.spleesh_guesses.map((guess, index) => <span key={index} style={{background: '#d8171866', borderRadius: '6px', padding: '0.3em 0.9em', marginRight: '20px' }}> <InlineSVG id='busd' src={require('./busd.svg')} /> {guess.bet_amount + '.00'}</span>)
    : `No guesses yet`}



            </p>
            <h3 className="game-sub-title">Your Number</h3>
            <div id="select-buttons-panel bet-amounts">{this.createNumberPanel()}</div>
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
            {/* <button id="btn_bet" onClick={this.onBtnBetClick}>
              Place Bet
            </button> */}
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
  creator: state.logic.curRoomInfo.creator_name
});

const mapDispatchToProps = {
  openGamePasswordModal
};

export default connect(mapStateToProps, mapDispatchToProps)(Spleesh);
