import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { convertToCurrency } from '../../util/conversion';
import { updateDigitToPoint2 } from '../../util/helper';
import { alertModal, confirmModalCreate } from '../modal/ConfirmAlerts';
import ReactModal from 'react-modal';

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
    this.state = {
      bet_amount: 0,
      selected_id: '',
      box_list: this.props.box_list,
      advanced_status: '',
      is_anonymous: false,
      balance: this.props.balance,
      betResult: this.props.betResult,
      isPasswordCorrect: false,
      isModalOpen: false

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

//   componentDidMount() {

//     const firstSelectedBox = this.state.box_list.find(box => box.active);
//     if (firstSelectedBox) {
//       this.setState({ selected_id: firstSelectedBox._id });
//       this.onBtnBetClick(null, firstSelectedBox._id);
//   }
// }


  componentDidUpdate(prevProps, prevState) {
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


    if (prevState.betResult !== this.state.betResult && this.state.betResult === 0) {
      this.setState({ isModalOpen: true });
    }
      this.setState({
        box_list: this.state.box_list.map(el =>
          el._id === this.state.selected_id ? { ...el, status: 'opened' } : el
        )
      });
    }
  }

  openModal = () => {
    
    this.setState({ isModalOpen: true });
  }
  
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
            is_anonymous: this.state.is_anonymous
          });
          this.openModal();

          this.setState({
            // betResult: 0,
            box_list: this.state.box_list.map(el =>
              el._id === this.state.selected_id
                ? { ...el, status: 'opened' }
                : el
            )
          });
        }
      }
    );
  };
  closeModal = () => {
    this.setState({ betResult: -1, isModalOpen: false });
    history.go(0);
  }
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
    return (
      <div className="game-page">
        <div className="page-title">
          <h2>PLAY - Mystery Box</h2>
        </div>
        <div className="game-contents">
          <div className="pre-summary-panel">
          <div className="host-display-name">
              Host: {this.props.creator}
            </div>
            <div className="your-bet-amount">
              Bet Amount:{' '}
              {convertToCurrency(updateDigitToPoint2(this.state.bet_amount))}
            </div>
            <div className="your-max-return">
              Potential Return:{' '}
              {convertToCurrency(updateDigitToPoint2(pr /* 0.95 */))}
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
              {this.state.box_list.map((row, key) => (
                <div
                  className={
                    'box box-' +
                    row.status +
                    (row._id === this.state.selected_id ? ' active' : '')
                  }
                  status={row.status}
                  _id={row._id}
                  box_price={row.box_price}
                  index={key}
                  key={key}
                  onClick={this.onBoxClicked}
                >
                  <span>{convertToCurrency(row.box_price)}</span>
                </div>
              ))}
            </div>
            <p>Each box will open one of the Prizes above.</p>
          </div>
          {/* <hr />
          <div className="action-panel">
            <span></span>
            <button id="btn_bet" onClick={this.onBtnBetClick}>
              Place Bet
            </button>
          </div> */}
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
      this.setState({ betResult: -1, isModalOpen: false });
      
      history.go(0);
    }

  };

  hideModal = () => {
    this.setState({betResult: -1});
}

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
            <div
              className={`mystery-box-result ${
                this.state.betResult === 0 ? 'failed' : 'success'
              }`}
            >
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
                : `YOU WON A PRIZE!`}
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

  render() {
    return (
      <div>
        {this.getBetForm()}
        {this.state.betResult === 0 ? (
          <ReactModal 
            isOpen={true}
            contentLabel="Prizes"
            onRequestClose={() => {
              this.setState({ betResult: -1 });
            }}
            style={customStyles}
          ><div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-body edit-modal-body">
            <button className="btn-close" onClick={this.closeModal}>×</button>
            {this.getBetResultForm()}
            {/* <button onClick={this.onBtnPlayAgainClicked}>Okay</button> */}
            </div>
            </div>
          </ReactModal>
        ) : null}
        </div>
    );
  }
}

const mapStateToProps = state => ({
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