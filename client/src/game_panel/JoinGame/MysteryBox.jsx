import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
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
      isPasswordCorrect: false,
      isOpen: true

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
      console.log("jimmy updated box list:", data);

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
  console.log(this.state.betResult);
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



  // openModal = () => {
    
  //   this.setState({ isModalOpen: true });
  // }
  
  onBtnBetClick = (e, selected_id) => {
    if (e) {
        e.preventDefault();
    }
    if (this.props.creator_id === this.props.user_id) {
      alertModal(
        this.props.isDarkMode,
        `THIS IS YOUR OWN STAKE?!?`
      );
      return;
      
    }

    // if (this.state.selected_id === '') {
    //   alertModal(this.props.isDarkMode, `SELECT A BOX!!!`);
    //   return;
    // }

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
        }
      }
    );
  };
  // closeModal = () => {
  //   this.setState({ betResult: -1, isOpen: false });
  // }
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
        {this.state.isOpen === true && (this.state.betResult === 0 || this.state.betResult === 1) && (
          <ReactModal 
            isOpen={true}
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
         : null)}
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
  openGamePasswordModal
};

export default connect(mapStateToProps, mapDispatchToProps)(MysteryBox);