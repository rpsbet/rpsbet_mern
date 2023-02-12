import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { updateBetResult } from '../../redux/Logic/logic.actions';

import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { convertToCurrency } from '../../util/conversion';
import { updateDigitToPoint2 } from '../../util/helper';
import { alertModal, confirmModalCreate } from '../modal/ConfirmAlerts';
import ReactModal from 'react-modal';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import { FaClipboard } from 'react-icons/fa';

const twitterLink = window.location.href;

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
      holdTime: 0,
        clicked: true,
        intervalId: null,

    };
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
    if (e.target.getAttribute('status') === 'opened') {
      return;
    }
    const _id = e.target.getAttribute('_id');
    const box_price = e.target.getAttribute('box_price');
    this.setState({ selected_id: _id, bet_amount: box_price});


    this.onBtnBetClick(e, _id);
  };

  componentDidMount() {
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

componentDidUpdate(prevProps, prevState) {
  if (prevState.box_list !== this.state.box_list) {
    this.setState({ box_list: this.state.box_list });
  }
  // console.log(this.state.betResult);
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


startBetting = () => {
  console.log('boxLis', this.state.box_list);
  const intervalId = setInterval(() => {
    const nextBox = this.predictNext(JSON.parse(localStorage.getItem("bet_array")), this.state.box_list);
    console.log('nextBox', nextBox);
    this.joinGame2(nextBox.box_price);
  }, 3500);

  this.setState({ intervalId });
};


stopBetting = () => {
  clearInterval(this.state.intervalId);
  this.setState({ intervalId: null });
};

joinGame2 = async (predictedBetAmount) => {
  const availableBoxes = this.state.box_list.filter(
    box =>
      box.status === "init" &&
      (box.box_price <= predictedBetAmount + 5)
  );
  if (availableBoxes.length === 0) {
    alertModal(
      this.props.isDarkMode,
      `No available boxes with the predicted bet amount found`
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
  }
};



  
  onBtnBetClick = (e, selected_id) => {
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

    confirmModalCreate(
      this.props.isDarkMode,
      'ARE YOU SURE YOU WANT TO PLACE THIS BET?',
      'Yes',
      'Cancel',
      async () => {
        if (this.props.is_private === true) {
          this.props.openGamePasswordModal();
        } else {
          this.props.join({
            bet_amount: this.state.bet_amount,
            selected_id: this.state.selected_id,
            is_anonyopenModalmous: this.state.is_anonymous
          });
          // this.openModal();

          this.setState({
            // betResult: 0,
            box_list: this.state.box_list.map(el =>
              el._id === this.state.selected_id
                ? { ...el, status: 'opened' }
                : el
            ),
            isOpen: true

          });
          let stored_bet_array = JSON.parse(localStorage.getItem("bet_array")) || [];
          stored_bet_array.push({ bet: this.state.bet_amount });
          localStorage.setItem("bet_array", JSON.stringify(stored_bet_array));
          console.log(stored_bet_array);

        }
      }
    );
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
        <div className="pre-summary-panel">
    <div className="data-item">
        <div className="label host-display-name">Host</div>
        <div className="value">{this.props.creator}</div>
    </div>
    <div className="data-item">
        <div className="label your-bet-amount">Bet Amount</div>
        <div className="value">
            {convertToCurrency(updateDigitToPoint2(this.state.bet_amount))}
        </div>
    </div>
    <div className="data-item">
        <div className="label your-max-return">Potential Return</div>
        <div className="value">
            {convertToCurrency(updateDigitToPoint2(pr /* 0.95 */))}
        </div>
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
  <div
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
    <span>{convertToCurrency(row.box_price)}</span>
  </div>
))}

            </div>
            <p>Each box will open one of the Prizes above.</p>
            <button onClick={this.startBetting }>AI Play</button>
        <button onClick={this.stopBetting }>Stop</button>
          </div>
          <hr />
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

    return (
      <div className="game-page">
        <div className="game-contents mystery-box-result-contents">
          <div className="game-info-panel">
          <div className={`mystery-box-result ${this.state.betResult === 0 ? 'failed' : 'success'}`}>
  {convertToCurrency(this.state.betResult)}
</div>
<h4 className="game-sub-title">
  {this.state.betResult === 0
    ? `HAHAHA! WRONG BOX MTF!`
    : `NICE 😎 ISSA MONEY BOX`}
</h4>
<p>
  {this.state.betResult === 0
    ? `THIS BOX IS EMPTY`
    : `YOU WON ${convertToCurrency(this.state.betResult)}!`}
</p>

            <h3 className="game-sub-title">ALL BOXES</h3>
            <p className="box-prizes">
            {prizes.map((item, key) => (
                <span className={item.status} key={key}>
                  {convertToCurrency(item.price === 0 ? 'EMPTY' : item.price)}
                </span>
              ))}
            </p>
          </div>
          <hr />
          <div className="action-panel">
            {/* <button id="btn-back" onClick={this.onBtnGoToMainGamesClicked}>
              Live Stakes
            </button> */}
            <button id="btn-submit" onClick={this.onBtnPlayAgainClicked}>
              OKAY
            </button>
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
            <div className="modal-body edit-modal-body">
            <button className="btn-close" onClick={this.onBtnPlayAgainClicked}>×</button>
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

const mapDispatchToProps = dispatch => ({
  openGamePasswordModal,
  updateBetResult: (betResult) => dispatch(updateBetResult(betResult))

});

export default connect(mapStateToProps, mapDispatchToProps)(MysteryBox);