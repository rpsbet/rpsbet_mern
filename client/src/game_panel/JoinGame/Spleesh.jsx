import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import InlineSVG from 'react-inlinesvg';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import { FaClipboard } from 'react-icons/fa';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';


const twitterLink = window.location.href;


class Spleesh extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bet_amount: this.props.spleesh_bet_unit,
      advanced_status: '',
      copied: false,
      is_anonymous: false,
      balance: this.props.balance,
      isPasswordCorrect: false
    };
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

  componentDidMount = () => {
    const { socket } = this.props
    socket.on('UPDATED_SPLEESH_BET_UNIT', data => {
      this.setState({ bet_amount: data.spleesh_bet_unit })
    })
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

  joinGame = async () => {
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
  };

  onBtnBetClick = () => {

    if (this.props.creator_id === this.props.user_id) {
      alertModal(
        this.props.isDarkMode,
        `DIS YOUR OWN STAKE CRAZY FOO-!`
      );
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
          this.joinGame();
        }
      }
    );
  };

  createNumberPanel = () => {
    let panel = [];
    for (let i = 1; i <= 10; i++) {
      panel.push(
        <button
          className={
            this.state.bet_amount / this.props.spleesh_bet_unit === i
              ? ' active'
              : ''
          }
          onClick={() => {
            this.setState({
              bet_amount: i * this.props.spleesh_bet_unit,
              endgame_amount: this.props.spleesh_bet_unit * (55 - i)
            });
            this.onBtnBetClick();
          }}
          key={i}
        >
          {convertToCurrency(
            updateDigitToPoint2(i * this.props.spleesh_bet_unit)
          )}
        </button>
      );
    }
    return panel;
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
    <div className="data-item">
        <div className="label host-display-name">Host</div>
        <div className="value">{this.props.creator}</div>
    </div>
    <div className="data-item">
        <div className="label your-bet-amount">Bet Amount</div>
        <div className="value">
            {convertToCurrency(this.state.bet_amount)}
        </div>
    </div>
    <div className="data-item">
        <div className="label your-max-return">Potential Return</div>
        <div className="value">
            {convertToCurrency(
                updateDigitToPoint2(
                    this.props.game_log_list.reduce((a, b) => a + b, 0) +
                    this.state.bet_amount * 2 /* 0.9 */
                )
            )}
        </div>
    </div>
</div>
          <div className="game-info-panel">
            <h3 className="game-sub-title">Previous Guesses</h3>
            <p className="previous-guesses">
              
            {this.props.game_log_list.length > 0
    ? this.props.game_log_list.map(log => <span style={{background: '#d8171866', borderRadius: '6px', padding: '0.3em 0.9em', marginRight: '20px' }}> <InlineSVG id='busd' src={require('./busd.svg')} /> {log + '.00'}</span>)
    : `No guesses yet`}



            </p>
            <h3 className="game-sub-title">Your Number</h3>
            <div id="select-buttons-panel">{this.createNumberPanel()}</div>
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
