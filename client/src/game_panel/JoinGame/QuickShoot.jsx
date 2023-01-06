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
import { convertToCurrency } from '../../util/conversion';

class QuickShoot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_qs_position: 0,
      advanced_status: '',
      is_anonymous: false,
      balance: this.props.balance,
      isPasswordCorrect: this.props.isPasswordCorrect
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

  onLeftPositionButtonClicked = e => {
    e.preventDefault();
    if (this.state.selected_qs_position > 0) {
      this.setState({
        selected_qs_position: this.state.selected_qs_position - 1
      });
    }
  };

  onRightPositionButtonClicked = e => {
    e.preventDefault();
    if (this.state.selected_qs_position < this.props.qs_game_type - 1) {
      this.setState({
        selected_qs_position: this.state.selected_qs_position + 1
      });
    }
  };

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
      selected_qs_position: this.state.selected_qs_position,
      is_anonymous: this.state.is_anonymous
    });

    if (result.status === 'success') {
      let text = 'HAHAA, YOU SUCK!!!';

      if (result.betResult === 1) {
        text = 'NICE SHOT, WINNER!!';
      } else if (result.betResult === 0) {
        text = 'Draw, No Winner!';
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
          'Try again',
          'Close',
          () => {
            history.go(0);
          },
          () => {
            history.push('/');
          }
        );
      }
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
        `THIS IS YOUR OWN STAKE, WTF IS WRONG WITH YOU?!`
      );
      return;
    }

    if (this.state.bet_amount > this.state.balance) {
      alertModal(this.props.isDarkMode, `MAKE A DEPOSIT, BROKIE!`);
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
    let position_name = [
      'Center',
      'Top-Left',
      'Top-Right',
      'Bottom-Left',
      'Bottom-Right'
    ];
    let position_short_name = ['c', 'tl', 'tr', 'bl', 'br'];

    if (this.props.qs_game_type === 2) {
      position_name = ['Left', 'Right'];
      position_short_name = ['bl', 'br'];
    } else if (this.props.qs_game_type === 3) {
      position_name = ['Bottom-Left', 'Center', 'Bottom-Right'];
      position_short_name = ['bl', 'c', 'br'];
    } else if (this.props.qs_game_type === 4) {
      position_name = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'];
      position_short_name = ['tl', 'tr', 'bl', 'br'];
    }

    const host_bet = this.props.bet_amount / (this.props.qs_game_type - 1);

    return (
      <div className="game-page">
        <div className="page-title">
          <h2>PLAY - Quick Shoot</h2>
        </div>
        <div className="game-contents">
          <div className="pre-summary-panel">
          <div className="host-display-name">
              Host: {this.props.creator}
            </div>
            <div className="your-bet-amount">
              Bet Amount:{' '}
              {convertToCurrency(updateDigitToPoint2(this.props.bet_amount))}
            </div>
            <div className="your-max-return">
              Potential Return:{' '}
              {convertToCurrency(
                updateDigitToPoint2(
                  host_bet * this.props.qs_game_type /* 0.95 */
                )
              )}
            </div>
          </div>
          <div className="game-info-panel">
            <h3 className="game-sub-title">Choose WHERE TO SHOOT</h3>
            <div className="qs-image-panel">
              <img
                src={`/img/gametype/quick_shoot/gametype${
                  this.props.qs_game_type
                }/type${this.props.qs_game_type}-${
                  position_short_name[this.state.selected_qs_position]
                }.png`}
                alt=""
                style={{ width: '600px', maxWidth: '100%', borderRadius: '20px',
                boxShadow: '0 0 20px #0e0e0e' }}
              />
            </div>
            <div className="qs-action-panel">
              <button
                className="btn-left"
                onClick={this.onLeftPositionButtonClicked}
              ></button>
              <label>{position_name[this.state.selected_qs_position]}</label>
              <button
                className="btn-right"
                onClick={this.onRightPositionButtonClicked}
              ></button>
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
  isDarkMode: state.auth.isDarkMode,
  balance: state.auth.balance,
  creator: state.logic.curRoomInfo.creator_name
});

const mapDispatchToProps = {
  openGamePasswordModal
};

export default connect(mapStateToProps, mapDispatchToProps)(QuickShoot);
