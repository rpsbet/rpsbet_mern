import React, { Component  } from 'react';
import { connect } from 'react-redux';
import { TwitterShareButton, TwitterIcon } from 'react-share';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import { updateBetResult } from '../../redux/Logic/logic.actions';

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

const options = [
  { classname: 'rock', selection: 'R' },
  { classname: 'paper', selection: 'P' },
  { classname: 'scissors', selection: 'S' }
];

const twitterLink = window.location.href;


class RPS extends Component {
  constructor(props) {
    super(props);

    this.settingsRef = React.createRef();
    this.socket = this.props.socket;
    this.state = {
      clicked: true,

      selected_rps: '',
      advanced_status: '',
      is_anonymous: false,
      bet_amount: 1,
      bankroll: parseFloat(this.props.bet_amount) - this.getPreviousBets(),
      // bankroll: 0,
      copied: false,
      balance: this.props.balance,
      isPasswordCorrect: this.props.isPasswordCorrect,
      slippage: 100,
      betResults: props.betResults,
      settings_panel_opened: false
    };
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

  // handleClickOutside = e => {
  //   if (this.settingsRef && !this.settingsRef.current.contains(e.target)) {
  //     this.setState({ settings_panel_opened: false });
  //   }
  // };

  componentDidMount = () => {
    const { socket } = this.props
    socket.on('UPDATED_BANKROLL', data => {
      this.setState({ bankroll: data.bankroll })
    })

    document.addEventListener('mousedown', this.handleClickOutside);
  };

  componentWillUnmount = () => {
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

  

  joinGame = async (selected_rps, bet_amount) => {
    this.setState({selected_rps: selected_rps, bet_amount: this.state.bet_amount});
    const result = await this.props.join({
      bet_amount: parseFloat(this.state.bet_amount),
      selected_rps: selected_rps,
      is_anonymous: this.state.is_anonymous,
      rps_bet_item_id: this.props.rps_bet_item_id,
      slippage: this.state.slippage
    });
    this.onBtnBetClick(result);

    // const result = await this.props.join({
    //   selected_rps: this.state.selected_rps,
    //   is_anonymous: this.state.is_anonymous,
    //   rps_bet_item_id: this.props.rps_bet_item_id,
    //   slippage: this.state.slippage
    // });

    const currentUser = this.props.user;
    const currentRoom = this.props.room;
    if (result.status === 'success') {
      this.setState(prevState => ({
        betResults: [...prevState.betResults, {...result, user: currentUser, room: currentRoom}]
    }));
    console.log(this.state.betResults);
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
    } else {
      if (result.message) {
        alertModal(this.props.isDarkMode, result.message);
      }
    }
    // this.props.refreshHistory();
  };


  onBtnBetClick = (selected_rps) => {
    // e.preventDefault();

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

    confirmModalCreate(
      this.props.isDarkMode,
      'ARE YOU SURE YOU WANT TO PLACE THIS BET?',
      'Yes',
      'Cancel',
      async () => {
        if (this.props.is_private === true) {
          this.props.openGamePasswordModal();
        } else {
          this.joinGame(selected_rps);
        }
      }
    );
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
          {/* {this.props.betResults.map((result, index) => {
          return <div key={index}>{result}</div>;
        })} */}
          <div className="host-display-name">
              Host: {this.props.creator}
            </div>
            <div className="your-bet-amount">
              Bankroll: {convertToCurrency(this.state.bankroll)}
            </div>
            <div className="your-bet-amount">
              Bet Amount: {convertToCurrency(this.state.bet_amount)}
            </div>
            <div className="your-max-return">
              Potential Return:
              {convertToCurrency(
                updateDigitToPoint2(this.state.bet_amount * 2 /* * 0.95 */)
              )}
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
    <span
      id={`rps-${classname}`}
      className={`rps-option ${classname}${
        this.state.selected_rps === selection ? ' active' : ''
      }`}
      onClick={() => {
        // console.log(`clicked ${classname}`);
        this.setState({ selected_rps: selection });
        this.onBtnBetClick(selection);
        
      }}
    />
  ))}
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
  creator: state.logic.curRoomInfo.creator_name,
  betResults: state.logic.betResults

});

const mapDispatchToProps = dispatch => ({
  openGamePasswordModal,

  updateBetResult: (betResult) => dispatch(updateBetResult(betResult))
});

export default connect(mapStateToProps, mapDispatchToProps)(RPS);