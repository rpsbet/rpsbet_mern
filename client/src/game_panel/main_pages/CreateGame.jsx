import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import RPS from '../CreateGame/RPS';
import Spleesh from '../CreateGame/Spleesh';
import MysteryBox from '../CreateGame/MysteryBox';
import BrainGame from '../CreateGame/BrainGame';
import PlayBrainGame from '../CreateGame/PlayBrainGame';
import QuickShoot from '../CreateGame/QuickShoot';
import Summary from '../CreateGame/Summary';
import { createRoom, setGameMode } from '../../redux/Logic/logic.actions';
import { getBrainGameType } from '../../redux/Question/question.action';
import { alertModal, confirmModalCreate } from '../modal/ConfirmAlerts';
import AdvancedSettings from '../CreateGame/AdvancedSettings';
import { convertToCurrency } from '../../util/conversion';

class CreateGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 2,
      child_step: 1,
      game_type: 1,
      game_mode: this.props.game_mode,
      isPlayingBrain: false,
      rps_list: [],
      qs_game_type: 2,
      qs_nation: 0,
      selected_qs_position: 0,
      bet_amount: 1,
      endgame_amount: 0,
      spleesh_bet_unit: 100000,
      max_return: 0,
      max_prize: 0,
      lowest_box_price: 0,
      public_bet_amount: convertToCurrency(0),
      is_private: false,
      is_anonymous: false,
      room_password: '',
      endgame_type: true,
      box_list: [],
      brain_game_type: this.props.brain_game_type,
      rps_game_type: 0
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.game_mode !== props.game_mode ||
      current_state.balance !== props.balance ||
      current_state.brain_game_type !== props.brain_game_type
    ) {
      return {
        ...current_state,
        game_mode: props.game_mode,
        brain_game_type: props.brain_game_type,
        balance: props.balance
      };
    }
    return null;
  }

  onChangeState = async newState => {
    await this.setState(newState);
  };

  async componentDidMount() {
    this.IsAuthenticatedReroute();
    const gameTypeName = this.props.match.params.game_type_name;
    if (gameTypeName === 'Brain Game') {
      this.props.getBrainGameType();
    }
    this.props.getBrainGameType();
    await this.props.setGameMode(gameTypeName);

    let newState = {
      child_step: 1,
      bet_amount: 100000,
      endgame_amount: 0,
      max_return: 0,
      max_prize: 0,
      lowest_box_price: 0,
      public_bet_amount: convertToCurrency(0)
    };

    if (gameTypeName === 'Spleesh!') {
      newState = {
        ...newState,
        game_type: 2,
        endgame_amount: 5400000,
        max_return: 5400000
      };
    } else if (gameTypeName === 'RPS') {
      newState = {
        ...newState,
        game_type: 1,
        bet_amount: 0,
        max_return: 0
      };
    } else if (gameTypeName === 'Brain Game') {
      newState = {
        ...newState,
        game_type: 3,
        max_return: '∞'
      };
    } else if (gameTypeName === 'Quick Shoot') {
      newState = {
        ...newState,
        game_type: 5,
        public_bet_amount: convertToCurrency(1),
        max_return: '2',
        qs_nation: Math.floor(Math.random() * 5)
      };
    } else if (gameTypeName === 'Mystery Box') {
      newState = {
        ...newState,
        game_type: 4,
        bet_amount: 0
      };
    }

    this.setState(newState);
  }

  IsAuthenticatedReroute = () => {
    if (!this.props.auth) {
      history.push('/');
    }
  };

  onSkipButtonClicked = () => {
    this.setState({
      is_private: false,
      is_anonymous: false,
      endgame_type: false,
      step: this.state.step + 1
    });
  };

  onStartBrainGame = e => {
    e.preventDefault();
    confirmModalCreate(
      this.props.isDarkMode,
      'Do you want to create new stake now?',
      'Okay',
      'Cancel',
      () => {
        this.setState({
          step: 5,
          isPlayingBrain: true
        });
      }
    );
  };

  onPrevButtonClicked = () => {
    if (this.state.game_mode !== 'Mystery Box' && this.state.step < 4) {
      if (this.state.step === 3 && this.state.child_step === 1) {
        if (this.state.game_mode === 'Quick Shoot') {
          this.setState({
            step: 2,
            child_step: 3
          });
        } else {
          this.setState({
            step: 2,
            child_step: 2
          });
        }
        return;
      } else if (this.state.child_step > 1) {
        this.setState({
          child_step: this.state.child_step - 1
        });

        return;
      }
    }

    this.setState({
      step: this.state.step > 1 ? this.state.step - 1 : this.state.step
    });
  };

  onNextButtonClicked = () => {
    if (this.state.step === 2) {
      if (
        (this.state.game_mode !== 'RPS' ||
          (this.state.game_mode === 'RPS' && this.state.child_step === 2)) &&
        (parseFloat(this.state.bet_amount) <= 0 ||
          isNaN(parseFloat(this.state.bet_amount)))
      ) {
        alertModal(this.props.isDarkMode, 'Please input the bet amount!');
        return;
      }

      if (this.state.bet_amount > this.state.balance) {
        console.log({
          bet_amount: this.state.bet_amount,
          balance: this.state.balance
        });
        alertModal(this.props.isDarkMode, 'Not enough balance!');
        return;
      }

      if (this.state.game_mode === 'Quick Shoot' && this.state.child_step < 3) {
        this.setState({
          child_step: this.state.child_step + 1
        });
        return;
      } else if (
        this.state.game_mode !== 'Mystery Box' &&
        this.state.child_step === 1
      ) {
        this.setState({
          child_step: this.state.child_step + 1
        });
        return;
      } else {
        this.setState({
          step: 3,
          child_step: 1
        });
        return;
      }
    } else if (this.state.step === 3) {
      if (this.state.is_private === true && this.state.room_password === '') {
        alertModal(
          this.props.isDarkMode,
          `You have set the Privacy to 'Private'. Please create a password!`
        );
        return;
      }

      if (this.state.endgame_amount === 0) {
        this.setState({ endgame_type: false });
      }

      if (
        this.state.game_mode !== 'RPS' &&
        this.state.game_mode !== 'Quick Shoot' &&
        this.state.child_step === 1
      ) {
        this.setState({
          child_step: this.state.child_step + 1
        });
        return;
      }
    }

    this.setState({
      step: this.state.step < 4 ? this.state.step + 1 : this.state.step
    });
  };

  onCreateRoom = async () => {
    console.log({
      bet_amount: this.state.bet_amount,
      balance: this.state.balance
    });
    confirmModalCreate(
      this.props.isDarkMode,
      'Do you want to create new stake now?',
      'Okay',
      'Cancel',
      async () => {
        await this.props.createRoom(this.state);
      }
    );
  };

  step2 = () => {
    console.log(this.state.bet_amount);
    if (this.state.game_mode === 'RPS') {
      return (
        <RPS
          onChangeState={this.onChangeState}
          rps_list={this.state.rps_list}
          bet_amount={this.state.bet_amount}
          is_private={this.state.is_private}
          is_anonymous={this.state.is_anonymous}
          room_password={this.state.room_password}
          step={this.state.child_step}
          rps_game_type={this.state.rps_game_type}
        />
      );
    } else if (this.state.game_mode === 'Spleesh!') {
      return (
        <Spleesh
          onChangeState={this.onChangeState}
          bet_amount={this.state.bet_amount}
          spleesh_bet_unit={this.state.spleesh_bet_unit}
          is_private={this.state.is_private}
          is_anonymous={this.state.is_anonymous}
          room_password={this.state.room_password}
          endgame_type={this.state.endgame_type}
          endgame_amount={this.state.endgame_amount}
          step={this.state.child_step}
        />
      );
    } else if (this.state.game_mode === 'Mystery Box') {
      return (
        <MysteryBox
          onChangeState={this.onChangeState}
          box_list={this.state.box_list}
          bet_amount={this.state.bet_amount}
          max_return={this.state.max_return}
          max_prize={this.state.max_prize}
          endgame_amount={this.state.endgame_amount}
        />
      );
    } else if (this.state.game_mode === 'Brain Game') {
      return (
        <BrainGame
          onChangeState={this.onChangeState}
          bet_amount={this.state.bet_amount}
          brain_game_type={this.state.brain_game_type}
          step={this.state.child_step}
        />
      );
    } else if (this.state.game_mode === 'Quick Shoot') {
      return (
        <QuickShoot
          onChangeState={this.onChangeState}
          bet_amount={this.state.bet_amount}
          is_private={this.state.is_private}
          is_anonymous={this.state.is_anonymous}
          room_password={this.state.room_password}
          endgame_type={this.state.endgame_type}
          endgame_amount={this.state.endgame_amount}
          qs_game_type={this.state.qs_game_type}
          selected_qs_position={this.state.selected_qs_position}
          step={this.state.child_step}
          qs_nation={this.state.qs_nation}
        />
      );
    }
    return <></>;
  };

  action_panel = () => {
    return (
      <>
        <hr />
        <div className="action-panel">
          {(this.state.step < 3 || this.state.step > 4) &&
          this.state.child_step === 1 ? (
            <span></span>
          ) : (
            <button id="btn_prev" onClick={this.onPrevButtonClicked}>
              Previous
            </button>
          )}
          {this.state.step === 3 && (
            <button id="btn_skip" onClick={this.onSkipButtonClicked}>
              Skip
            </button>
          )}
          {this.state.step === 4 && this.state.game_mode === 'Brain Game' && (
            <button id="btn_bet" onClick={this.onStartBrainGame}>
              Start
            </button>
          )}
          {this.state.step === 4 && this.state.game_mode !== 'Brain Game' && (
            <button id="btn_bet" onClick={this.onCreateRoom}>
              Place Bet
            </button>
          )}
          {this.state.step < 4 && this.state.step !== 1 && (
            <button id="btn_next" onClick={this.onNextButtonClicked}>
              Next
            </button>
          )}
        </div>
      </>
    );
  };

  render() {
    return (
      <div className="game-page">
        <div className="page-title">
          <h2>
            Host / Stake - <br />({this.state.game_mode})
          </h2>
          {this.state.step === 5 &&
          this.state.game_mode === 'Brain Game' &&
          this.state.isPlayingBrain ? (
            <Summary
              bet_amount={this.state.bet_amount}
              max_return={this.state.max_return}
              endgame_type={this.state.endgame_type}
              endgame_amount={this.state.endgame_amount}
              is_private={this.state.is_private}
              step={this.state.step}
              child_step={this.state.child_step}
              game_mode={this.state.game_mode}
              max_prize={this.state.max_prize}
              public_bet_amount={this.state.public_bet_amount}
            />
          ) : (
            <span>Click ‘HELP’ at the top for more game help.</span>
          )}
        </div>
        <div className="game-contents">
          {(this.state.step !== 5 ||
            this.state.game_mode !== 'Brain Game' ||
            !this.state.isPlayingBrain) && (
            <Summary
              bet_amount={this.state.bet_amount}
              max_return={this.state.max_return}
              endgame_type={this.state.endgame_type}
              endgame_amount={this.state.endgame_amount}
              is_private={this.state.is_private}
              step={this.state.step}
              child_step={this.state.child_step}
              game_mode={this.state.game_mode}
              max_prize={this.state.max_prize}
              public_bet_amount={this.state.public_bet_amount}
            />
          )}
          {this.state.step === 2 && this.step2()}
          {this.state.step === 3 && (
            <AdvancedSettings
              onChangeState={this.onChangeState}
              is_private={this.state.is_private}
              room_password={this.state.room_password}
              game_mode={this.state.game_mode}
              endgame_type={this.state.endgame_type}
              endgame_amount={this.state.endgame_amount}
              is_anonymous={this.state.is_anonymous}
              step={this.state.child_step}
            />
          )}
          {this.state.step === 5 &&
            this.state.game_mode === 'Brain Game' &&
            this.state.isPlayingBrain && (
              <PlayBrainGame
                brain_game_type={this.state.brain_game_type}
                bet_amount={this.state.bet_amount}
                is_private={this.state.is_private}
                is_anonymous={this.state.is_anonymous}
                room_password={this.state.room_password}
              />
            )}
          {this.state.step !== 5 && this.action_panel()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  landingItemList: state.landingReducer.landingItemList,
  game_mode: state.logic.game_mode,
  socket: state.auth.socket,
  balance: state.auth.balance,
  brain_game_type: state.questionReducer.brain_game_type,
  isDarkMode: state.auth.isDarkMode
});

const mapDispatchToProps = {
  createRoom,
  setGameMode,
  getBrainGameType
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateGame);
