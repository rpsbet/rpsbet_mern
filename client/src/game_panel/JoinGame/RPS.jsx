import React, { Component } from 'react';
import { connect } from 'react-redux';

// import { dispatch } from 'redux';
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

const options = [
  { classname: 'rock', selection: 'R' },
  { classname: 'paper', selection: 'P' },
  { classname: 'scissors', selection: 'S' }
];



class RPS extends Component {
  constructor(props) {
    super(props);

    this.settingsRef = React.createRef();

    this.state = {
      selected_rps: 'R',
      advanced_status: '',
      is_anonymous: false,
      balance: this.props.balance,
      isPasswordCorrect: this.props.isPasswordCorrect,
      slippage: 100,
      betResults: props.betResults,
      settings_panel_opened: false
    };
  }

  handleClickOutside = e => {
    if (this.settingsRef && !this.settingsRef.current.contains(e.target)) {
      this.setState({ settings_panel_opened: false });
    }
  };

  componentDidMount = () => {
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
    if (
      prevState.isPasswordCorrect !== this.state.isPasswordCorrect &&
      this.state.isPasswordCorrect === true
    ) {
      this.joinGame();
    }
  }

  

  joinGame = async (selected_rps) => {
    this.setState({selected_rps: selected_rps});
    const result = await this.props.join({
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
    this.props.refreshHistory();
  };


  onBtnBetClick = (selected_rps) => {
    // e.preventDefault();

    if (this.props.creator_id === this.props.user_id) {
      alertModal(
        this.props.isDarkMode,
        `THIS IS YOUR OWN STAKE!! ARE YOU OKAY?!`
      );
      return;
    }

    if (this.props.bet_amount > this.state.balance) {
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

  render() {
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
              Bet Amount: {convertToCurrency(this.props.bet_amount)}
            </div>
            <div className="your-max-return">
              Potential Return:
              {convertToCurrency(
                updateDigitToPoint2(this.props.bet_amount * 2 /* * 0.95 */)
              )}
            </div>
            <SettingsOutlinedIcon
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
            </div>
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
        console.log(`clicked ${classname}`);
        this.setState({ selected_rps: selection });
        this.onBtnBetClick(selection);
      }}
    />
  ))}
</div>
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
  }
}

const mapStateToProps = state => ({
  
  auth: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  balance: state.auth.balance,
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
