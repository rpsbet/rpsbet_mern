import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper';
import {
  alertModal,
  confirmModalCreate,
  gameResultModal
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';

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

  joinGame = async () => {
    const result = await this.props.join({
      selected_rps: this.state.selected_rps,
      is_anonymous: this.state.is_anonymous,
      rps_bet_item_id: this.props.rps_bet_item_id,
      slippage: this.state.slippage
    });
    if (result.status === 'success') {
      let text = 'Oops, You Lost!';

      if (result.betResult === 1) {
        text = 'Nice, You Won!';
      } else if (result.betResult === 0) {
        text = 'Draw, No Winner!';
      }

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
      if (result.message) {
        alertModal(this.props.isDarkMode, result.message);
      }
    }
  };

  onBtnBetClick = e => {
    e.preventDefault();

    if (this.props.creator_id === this.props.user_id) {
      alertModal(
        this.props.isDarkMode,
        `Oops! This is your Stake. What's the point?!`
      );
      return;
    }

    if (this.props.bet_amount > this.state.balance / 100.0) {
      alertModal(this.props.isDarkMode, `Not enough balance!`);
      return;
    }

    confirmModalCreate(
      this.props.isDarkMode,
      'Are you sure you want to place this bet?',
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

  render() {
    return (
      <div className="game-page">
        <div className="page-title">
          <h2>Join Stake - RPS</h2>
        </div>
        <div className="game-contents">
          <div className="pre-summary-panel">
            <div className="your-bet-amount">
              Bet Amount : {this.props.bet_amount} RPS
            </div>
            <div className="your-max-return">
              Potential Return : 
              {updateDigitToPoint2(this.props.bet_amount * 2 /* * 0.95 */)} RPS
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
                  class={this.state.slippage === 100 ? 'active' : ''}
                  onClick={() => {
                    this.setState({ slippage: 100 });
                  }}
                >
                  100%
                </button>
                <button
                  class={this.state.slippage === 200 ? 'active' : ''}
                  onClick={() => {
                    this.setState({ slippage: 200 });
                  }}
                >
                  200%
                </button>
                <button
                  class={this.state.slippage === 500 ? 'active' : ''}
                  onClick={() => {
                    this.setState({ slippage: 500 });
                  }}
                >
                  500%
                </button>
                <button
                  class={this.state.slippage === 'unlimited' ? 'active' : ''}
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
                  className={`${classname}${
                    this.state.selected_rps === selection ? ' active' : ''
                  }`}
                  onClick={() => {
                    console.log(`clicked ${classname}`);
                    this.setState({ selected_rps: selection });
                  }}
                />
              ))}
            </div>
          </div>
          <hr />
          <div className="action-panel">
            <span></span>
            <button id="btn_bet" onClick={this.onBtnBetClick}>
              Place Bet
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  isPasswordCorrect: state.snackbar.isPasswordCorrect,
  balance: state.auth.balance,
  isDarkMode: state.auth.isDarkMode
});

const mapDispatchToProps = {
  openGamePasswordModal
};

export default connect(mapStateToProps, mapDispatchToProps)(RPS);
