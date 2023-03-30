import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
// import { updateBetResult } from '../../redux/Logic/logic.actions';
import Lottie from 'react-lottie';
import { Button } from '@material-ui/core';

import animationData from '../LottieAnimations/spinningIcon';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { convertToCurrency } from '../../util/conversion';
import { updateDigitToPoint2 } from '../../util/helper';
import { alertModal, confirmModalCreate } from '../modal/ConfirmAlerts';
import ReactModal from 'react-modal';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import { FaClipboard } from 'react-icons/fa';
import { Card, CardContent, Typography } from '@material-ui/core';

const twitterLink = window.location.href;

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice"
  }
};

const customStyles = {
  overlay: {
      zIndex: 3,
      backgroundColor: 'rgba(47, 49, 54, 0.8)',
      backdropFilter: 'blur(4px)'
  },
  content: {
      top         : '50%',
      left        : '50%',
      right       : 'auto',
      bottom      : 'auto',
      transform   : 'translate(-50%, -50%)',
      background: 'transparent',
      padding: 0,
      border: 0
  }
}


class MysteryBox extends Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;

    this.state = {

      items: [],
      bet_amount: 0,
      selected_id: '',
      box_list: this.props.box_list,
      advanced_status: '',
      is_anonymous: false,
      balance: this.props.balance,
      betResult: this.props.betResult,
      betResults: [],
      isPasswordCorrect: false,
      isOpen: true,
      betting: false,
      timer: null,
      timerValue: 1000,
        clicked: true,
        intervalId: null,

    };
    this.panelRef = React.createRef();

  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.isPasswordCorrect !== props.isPasswordCorrect ||
      current_state.betResult !== props.betResult ||
      current_state.balance !== props.balance
    ) {
      return {
        ...current_state,
        balance: props.balance,
        isPasswordCorrect: props.isPasswordCorrect,
        betResult: props.betResult
      };
    }

    

    return null;
  }

  onBoxClicked = e => {
    e.preventDefault();
    
    if (e.currentTarget.getAttribute('status') === 'opened') {
      return;
    }
    
    const _id = e.currentTarget.getAttribute('_id');
    const box_price = e.currentTarget.getAttribute('box_price');
    this.setState({ selected_id: _id, bet_amount: box_price }, () => {
      this.onBtnBetClick();
    });
  };
  

  componentDidMount() {
         // Add event listener to detect end of scroll
  this.panelRef.current.addEventListener("scroll", this.handleScroll);
  
    const { socket } = this.props
    socket.on('UPDATED_BOX_LIST', data => {

      this.setState({ box_list: data.box_list })
    })

//     const firstSelectedBox = this.state.box_list.find(box => box.active);
//     if (firstSelectedBox) {
//       this.setState({ selected_id: firstSelectedBox._id });
//       this.onBtnBetClick(null, firstSelectedBox._id);
//   }
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


componentDidUpdate(prevProps, prevState) {
  if (prevState.box_list !== this.state.box_list) {
    this.setState({ box_list: this.state.box_list });
    this.props.refreshHistory();
  }
  if (
    prevState.isPasswordCorrect !== this.state.isPasswordCorrect &&
    this.state.isPasswordCorrect === true
  ) {
    this.props.join({
      bet_amount: this.state.bet_amount,
      selected_id: this.state.selected_id,
      is_anonymous: this.state.is_anonymous
    });

    this.setState({
      box_list: this.state.box_list.map(el =>
        el._id === this.state.selected_id ? { ...el, status: 'opened' } : el
      )
    });
  }
  
}
predictNext = (betAmountArray, boxList) => {
  let transitions = {};
  let probabilities = {};
  let startProbabilities = {};
  let distinctBoxes = [...new Set(boxList)];

  // Calculate start probabilities
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

  // Calculate transition probabilities
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

  return prediction;
};
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
  if (this.props.creator_id === this.props.user_id) {
    alertModal(
      this.props.isDarkMode,
      `DIS YOUR OWN STAKE CRAZY FOO-!`
    );
    return;
    
  }
  
  let stored_bet_array = JSON.parse(localStorage.getItem("bet_array")) || [];
  if (stored_bet_array.length  < 3) {
    alertModal(this.props.isDarkMode, "MORE TRAINING DATA NEEDED!");
    return;
  }
  const intervalId = setInterval(() => {
    const nextBox = this.predictNext(stored_bet_array, this.state.box_list);
    const rooms = JSON.parse(localStorage.getItem("rooms")) || {};
const passwordCorrect = rooms[this.props.roomInfo._id];
  if (this.props.is_private === true && passwordCorrect !== true) {
      this.props.openGamePasswordModal();
    } else {
    this.joinGame2(nextBox.box_price);
    }
  }, 3500);

  this.setState({ intervalId, betting: true });
};


stopBetting = () => {
  clearInterval(this.state.intervalId);
  this.setState({ intervalId: null, betting: false, timerValue: 1000  });
};

joinGame2 = async (predictedBetAmount) => {

  if (this.state.bet_amount > this.state.balance) {
    alertModal(this.props.isDarkMode, `TOO BROKE!`);
    return;
  }

  const availableBoxes = this.state.box_list.filter(
    box =>
      box.status === "init" &&
      (box.box_price <= predictedBetAmount + 8)
  );
  if (availableBoxes.length === 0) {
    alertModal(
      this.props.isDarkMode,
      `NO MORE AVAILABLE BOXES THAT FIT THE TRAINING DATA`
    );
    return;
  }
  
  const randomIndex = Math.floor(Math.random() * availableBoxes.length);
  const selectedBox = availableBoxes[randomIndex];
  const result = await this.props.join({
    bet_amount: parseFloat(this.state.bet_amount),
    selected_id: selectedBox._id,
    is_anonymous: this.state.is_anonymous,
    // slippage: this.state.slippage
  });
  
  const currentUser = this.props.user;
const currentRoom = this.props.room;
if (result.status === 'success') {
  let betResult = '';
  if (result.betResult === 1) {
    betResult = 'win';
  } else if (result.betResult === 0) {
    betResult = 'draw';
  } else {
    betResult = 'lose';
  }
  // this.props.updateBetResult(betResult);
  this.setState(prevState => ({
    betResults: [...prevState.betResults, {...result, user: currentUser, room: currentRoom}]
  }));

  this.props.refreshHistory();
}
};
onBtnBetClick = async (e) => {
  if (e) {
    e.preventDefault();
  }
  if (this.props.creator_id === this.props.user_id) {
    alertModal(
      this.props.isDarkMode,
      `DIS YOUR OWN STAKE CRAZY FOO-!`
    );
    return;
  }

  if (this.state.bet_amount > this.state.balance) {
    alertModal(this.props.isDarkMode, `TOO BROKE!`);
    return;
  }

  const rooms = JSON.parse(localStorage.getItem("rooms")) || {};
const passwordCorrect = rooms[this.props.roomInfo._id];
    if (localStorage.getItem('hideConfirmModal') === 'true') {
  if (this.props.is_private === true && passwordCorrect !== true) {
      this.props.openGamePasswordModal();
    } else {
      await this.joinGame();
    }
  } else {
    const result = await confirmModalCreate(
      this.props.isDarkMode,
      'ARE YOU SURE YOU WANT TO PLACE THIS BET?',
      'Yes',
      'Cancel',
      async () => { // This should be a function
        if (this.props.is_private === true) {
          this.props.openGamePasswordModal();
        } else {
          await this.joinGame();
        }
        this.props.refreshHistory();
      }
    );
    
  }
};

joinGame = async () => {
  
  let stored_bet_array = JSON.parse(localStorage.getItem('bet_array')) || [];
  while (stored_bet_array.length >= 30) {
    stored_bet_array.shift();
  }
  stored_bet_array.push({ bet: this.state.bet_amount });
  localStorage.setItem('bet_array', JSON.stringify(stored_bet_array));
  
  
  const result = await this.props.join({
    bet_amount: parseFloat(this.state.bet_amount),
    selected_id: this.state.selected_id,
    is_anonymous: this.state.is_anonymous,
    // slippage: this.state.slippage
  });
  
  const currentUser = this.props.user;
  const currentRoom = this.props.room;
  if (result.status === 'success') {
    let betResult = '';
    if (result.betResult === 1) {
      betResult = 'win';
    } else if (result.betResult === 0) {
      betResult = 'draw';
    } else {
      betResult = 'lose';
    }
    // this.props.updateBetResult(betResult);
    this.setState({
      box_list: this.state.box_list.map(el =>
        el._id === this.state.selected_id ? { ...el, status: 'opened' } : el
      ),
      isOpen: true
    });
  
    setTimeout(() => {
      this.setState({ isOpen: false });
    }, 1500);
    this.setState(prevState => ({
      betResults: [...prevState.betResults, {...result, user: currentUser, room: currentRoom}]
    }), () => {
      this.props.refreshHistory();
    });
  }
};



  
  onBtnGoToMainGamesClicked = e => {
    e.preventDefault();
    history.push('/');
  };

  getBetForm = () => {
    let prizes = [];
    let pr = 0;
    this.state.box_list.map(row => {
      prizes.push({
        price: row.box_prize,
        status: row.status
      });

      pr = pr < row.box_prize ? row.box_prize : pr;

      return true;
    });
    prizes.sort((a, b) => a.price - b.price);
    
    const styles = ['copy-btn'];
    let text = 'COPY CONTRACT';

   if (this.state.clicked) {
   styles.push('clicked');
   text = 'COPIED!';
   }

    return (
      <div className="game-page">
        <div className="page-title">
          <h2>PLAY - Mystery Box</h2>
        </div>
        <div className="game-contents">
        <div className="pre-summary-panel" ref={this.panelRef} onScroll={this.handleScroll}>
        <div className="pre-summary-panel__inner mystery-box">
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
                <div>
                  <div className="label your-max-return">Potential Return</div>
                </div>
                <div className="value">
                  {convertToCurrency(
                    updateDigitToPoint2(pr)
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        </div>
          <div className="game-info-panel">
            <h3 className="game-sub-title">Prizes</h3>
            <p className="box-prizes">
              {prizes.map((item, key) => (
                <span className={item.status} key={key}>
                  {convertToCurrency(item.price === 0 ? 'EMPTY' : item.price)}
                </span>
              ))}
            </p>
            <h3 className="game-sub-title">Select a Box</h3>
            <div className="boxes-panel boxes-join">
            {this.state.box_list.map((row, index) => (
  <Card
    variant="outlined"
    className={
      'box box-' +
      row.status +
      (row._id === this.state.selected_id ? ' active' : '')
    }
    status={row.status}
    _id={row._id}
    box_price={row.box_price}
    index={index}
    key={row._id}
    onClick={this.onBoxClicked}
  >
    <CardContent>
      <Typography color="textSecondary">
        {convertToCurrency(row.box_price)}
      </Typography>
    </CardContent>
  </Card>
))}

            </div>
            <Button
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
            {/* <span></span>
            <button id="btn_bet" onClick={this.onBtnBetClick}>
              Place Bet
            </button> */}
          </div>
        </div>
      </div>
    );
  };

  onBtnPlayAgainClicked = e => {
    e.preventDefault();
    if (this.props.roomStatus === 'finished') {
      alertModal(this.props.isDarkMode, 'THIS STAKE HAS ENDED');
      history.go('/');
    } else {
      this.setState({ isOpen: false });
      
    }
  };
  

  getBetResultForm = () => {
    let prizes = [];
    this.state.box_list.map(row => {
      prizes.push({
        price: row.box_prize,
        status: row.status
      });
      return true;
    });
    prizes.sort((a, b) => a.price - b.price);
    let timeLeft = 1500; // duration of modal in milliseconds
    const intervalId = setInterval(() => {
        timeLeft -= 100;
        if (timeLeft === 0) {
            clearInterval(intervalId);
        }
    }, 100); // countdown interval
    return (
      <div className="game-page">
        <div className="game-contents mystery-box-result-contents">
          <div className="game-info-panel">
            
          <div className={`mystery-box-result ${this.state.betResult === 0 ? 'failed' : 'success'}`}>
  {convertToCurrency(this.state.betResult)}
</div>
<h4 className="game-sub-title">
  {this.state.betResult === 0
    ? `PAHAH WRONG BOX DICKHEAD!`
    : `NICE 😎 ISSA MONEY BOX`}
</h4>
<p>
  {this.state.betResult === 0
    ? `THIS BOX IS EMPTY`
    : `YOU WON!`}
</p>


 
          </div>
          <div className="countdown-timer">
                                <div className="countdown-bar" style={{ width: `${(timeLeft / 1500) * 100}%` }}></div>
                            </div>
        </div>
      </div>
    );
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
    
    return (
      <div>
        {this.getBetForm()}
        { this.state.betResult !== -1 && 
  this.state.isOpen && 
  ( <ReactModal 
    
            isOpen={this.state.isOpen}
            contentLabel="Prizes"
            closeModal={this.onBtnPlayAgainClicked}
            style={customStyles}
          ><div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className='modal-header'>
              <h2>PRIZE</h2>
            <Button className="btn-close" onClick={this.onBtnPlayAgainClicked}>×</Button>
            </div>
            <div className="modal-body edit-modal-body">
            {this.getBetResultForm()}
            {/* <button onClick={this.onBtnPlayAgainClicked}>Okay</button> */}
            </div>
            </div>
          </ReactModal>
         )}
        </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  auth: state.auth.isAuthenticated,
  balance: state.auth.balance,
  betResult: state.logic.betResult,
  roomStatus: state.logic.roomStatus,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  isDarkMode: state.auth.isDarkMode,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name
});

const mapDispatchToProps = {
  openGamePasswordModal,
  // updateBetResult: (betResult) => dispatch(updateBetResult(betResult))

};

export default connect(mapStateToProps, mapDispatchToProps)(MysteryBox);