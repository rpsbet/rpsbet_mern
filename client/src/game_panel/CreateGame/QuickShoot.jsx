import React, { Component } from 'react';
import { connect } from 'react-redux';
import { IconButton, Button } from '@material-ui/core';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import { getQsLottieAnimation } from '../../util/helper';
import Lottie from 'react-lottie';
import { convertToCurrency } from '../../util/conversion';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import { alertModal } from '../modal/ConfirmAlerts';


class QuickShoot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is_other: 'hidden',
      selected_qs_position: '',
      qs_list: [],
      activeButtonId: null,
      winChance: 33,
      animation: <div />
    };
    this.handlePositionSelection = this.handlePositionSelection.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }
  async handlePositionSelection(selected_qs_position) {
    let buttonId;
    const { qs_game_type } = this.props;
    if (qs_game_type === 2) {
      buttonId = selected_qs_position === 0 ? 'l' : 'r';
    } else if (qs_game_type === 3) {
      buttonId = selected_qs_position === 0 ? 'l' : selected_qs_position === 1 ? 'cc' : 'r';
    } else if (qs_game_type === 4) {
      buttonId = selected_qs_position === 0 ? 'tl' : selected_qs_position === 1 ? 'tr' : selected_qs_position === 2 ? 'bl' : 'br';
    } else if (qs_game_type === 5) {
      buttonId = selected_qs_position === 0 ? 'c' : selected_qs_position === 1 ? 'tl' : selected_qs_position === 2 ? 'tr' : selected_qs_position === 3 ? 'bl' : 'br';
    }
    this.setState({ activeButtonId: buttonId }, async () => {

      await this.props.onChangeState({
        selected_qs_position: selected_qs_position
      });
      this.onAddRun(selected_qs_position);

      this.updateAnimation();
    });

  }


  handleKeyPress(event) {
    if (!this.props.isFocused) {

      switch (event.key) {
        case 'p':
          this.handlePositionSelection(0);
          break;
        case 'q':
          this.handlePositionSelection(1);
          break;
        case 'w':
          this.handlePositionSelection(2);
          break;
        case 'e':
          this.handlePositionSelection(3);
          break;
        case 'r':
          this.handlePositionSelection(4);
          break;
        case ' ':
          event.preventDefault();
          break;
        default:
          break;
      }
    }
  }

  handleReset() {
    this.props.onChangeState({
      qs_list: [],
      winChance: 0
    });
    this.setState({ qs_list: [] });
  }

  updateAnimation = async () => {
    let position_short_name = ['center', 'tl', 'tr', 'bl', 'br'];

    if (this.props.qs_game_type === 2) {
      position_short_name = ['bl', 'br'];

    } else if (this.props.qs_game_type === 3) {
      position_short_name = ['bl', 'center', 'br'];
    } else if (this.props.qs_game_type === 4) {
      position_short_name = ['tl', 'tr', 'bl', 'br'];
    }

    const animationData = await getQsLottieAnimation(
      this.props.qs_nation,
      position_short_name[this.props.selected_qs_position]
    );


    this.setState({
      animation: (
        <div className="qs-image-panel">
          <Lottie
            options={{
              loop: false,
              autoplay: true,
              animationData
            }}
            style={{ maxWidth: '100%', width: '600px', borderRadius: '10px' }}
          />
        </div>
      )
    });
  };

  onChangeWinChance = winChance => {
    this.setState({ winChance });
  };

  calcWinChance = (gameType, rounds) => {
    // Calculate base probabilities
    let probWin = (100 / gameType).toFixed(2);
    let probLose = (100 - probWin).toFixed(2);

    // Initialize the frequency of each unique qs value to 0
    const freq = {};
    for (let i = 0; i < gameType; i++) {
      freq[i] = 0;
    }

    // Count the frequency of each unique qs value
    rounds.forEach(round => {
      freq[round.qs]++;
    });

    // Calculate the range of frequencies
    const freqValues = Object.values(freq);
    const range = Math.max(...freqValues) - Math.min(...freqValues);

    // Adjust probabilities based on the range of frequencies
    const sensitivityFactor = (range / 100) * gameType; // You can adjust this value to increase or decrease sensitivity
    const adjustmentFactor = (range / gameType) * sensitivityFactor;
    probWin = (+probWin - adjustmentFactor).toFixed(2);
    probLose = (+probLose + adjustmentFactor).toFixed(2);

    return `${probWin}% - ${probLose}%`;
  };

  calcEV = (gameType, betAmount, winLoseProb) => {
    const winAmount = betAmount * (gameType - 1);
    const loseAmount = betAmount;

    // Extract the probWin and probLose values from the winLoseProb string
    const [probWin, probLose] = winLoseProb.split(" - ").map(prob => parseFloat(prob));

    const ev = (probWin * winAmount - probLose * loseAmount) / 100;
    return ev.toFixed(2);
  };

  predictNext = (qs_list, gameType) => {
    const options = [...Array(gameType).keys()];
    const transitionMatrix = {};
    const randomnessFactor = 0.15; // Adjust this value to control the level of randomness

    options.forEach(option1 => {
      transitionMatrix[option1] = {};
      options.forEach(option2 => {
        transitionMatrix[option1][option2] = {};
        options.forEach(option3 => {
          transitionMatrix[option1][option2][option3] = {};
          options.forEach(option4 => {
            transitionMatrix[option1][option2][option3][option4] = 0;
          });
        });
      });
    });

    // Count transitions
    for (let i = 0; i < qs_list.length - 3; i++) {
      transitionMatrix[qs_list[i].qs][qs_list[i + 1].qs][qs_list[i + 2].qs][qs_list[i + 3].qs]++;
    }

    // Normalize transition probabilities
    Object.keys(transitionMatrix).forEach(fromState1 => {
      Object.keys(transitionMatrix[fromState1]).forEach(fromState2 => {
        Object.keys(transitionMatrix[fromState1][fromState2]).forEach(fromState3 => {
          const totalTransitions = Object.values(transitionMatrix[fromState1][fromState2][fromState3]).reduce((a, b) => a + b);
          Object.keys(transitionMatrix[fromState1][fromState2][fromState3]).forEach(toState => {
            transitionMatrix[fromState1][fromState2][fromState3][toState] /= totalTransitions;
          });
        });
      });
    });

    // Calculate winChance and deviation
    const winChance = this.calcWinChance(gameType, qs_list);
    const targetProbability = 100 / gameType;
    const deviation = Math.abs(winChance - targetProbability);

    // Choose next state based on transition probabilities and deviation
    let currentState1 = qs_list[qs_list.length - 3].qs;
    let currentState2 = qs_list[qs_list.length - 2].qs;
    let currentState3 = qs_list[qs_list.length - 1].qs;

    // Weighted random choice based on transition probabilities
    const weightedOptions = [];
    Object.entries(transitionMatrix[currentState1][currentState2][currentState3]).forEach(([state, prob]) => {
      for (let i = 0; i < Math.floor(prob * 100); i++) {
        weightedOptions.push(state);
      }
    });

    let nextState;
    if (weightedOptions.length > 0) {
      nextState = weightedOptions[Math.floor(Math.random() * weightedOptions.length)];
    } else {
      nextState = options[Math.floor(Math.random() * options.length)];
    }

    // Introduce randomness based on the randomnessFactor
    if (Math.random() < randomnessFactor) {
      nextState = options[Math.floor(Math.random() * options.length)];
    }

    return nextState;
  };



  onAddRun = selected_qs_position => {

    this.props.playSound('boop');
    this.setState({ selected_qs_position: selected_qs_position });
    const newArray = JSON.parse(JSON.stringify(this.props.qs_list));
    newArray.push({
      qs: selected_qs_position
    });
    const winChance = this.calcWinChance(this.props.qs_game_type, newArray);
    const betAmount = 1;
    const winChanceEV = this.calcEV(
      this.props.qs_game_type,
      betAmount,
      winChance,
    );
    this.props.onChangeState({
      winChance: winChanceEV,
      qs_list: newArray
    });
    this.onChangeWinChance(winChance);
    this.setState({ winChance });
    let position_short_name = ['center', 'tl', 'tr', 'bl', 'br'];
    if (this.props.qs_game_type === 2) {
      position_short_name = ['bl', 'br'];
    } else if (this.props.qs_game_type === 3) {
      position_short_name = ['bl', 'center', 'br'];
    } else if (this.props.qs_game_type === 4) {
      position_short_name = ['tl', 'tr', 'bl', 'br'];
    }

    if (position_short_name[this.props.selected_qs_position] === 'center') {
      this.props.playSound('grunt2');

    } else {
      this.props.playSound('grunt')
    }

    this.setState(prevState => {
      const updatedQsList = [
        ...prevState.qs_list,
        { qs: position_short_name[selected_qs_position] }
      ];

      return { qs_list: updatedQsList };
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.qs_list.length !== this.state.qs_list.length) {
      const table = document.getElementById('runs');
      if (table) {
        table.scrollTop = table.scrollHeight;
      }
    }
  }

  onRemoveItem = index => {
    this.props.playSound('tap');

    this.setState(prevState => {
      const updatedQsList = [...prevState.qs_list];
      updatedQsList.splice(index, 1);
      const winChance = this.calcWinChance(
        this.props.qs_game_type,
        updatedQsList
      );
      const betAmount = 1;
      const winChanceEV = this.calcEV(this.props.qs_game_type, betAmount, winChance)
      this.props.onChangeState({
        winChance: winChanceEV,
        qs_list: updatedQsList
      });
      return { qs_list: updatedQsList, winChance };
    });
  };

  async componentDidMount() {
    await this.updateAnimation();
    document.addEventListener('keydown', this.handleKeyPress);
  }


  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }
  renderButtons() {
    const { qs_game_type } = this.props;
    const { activeButtonId } = this.state;

    if (qs_game_type === 2) {
      return (
        <div className="qs-buttons">
          <IconButton id="l" onClick={() => { this.handlePositionSelection(0); }} className={activeButtonId === 'l' ? 'active' : ''}>
            {/* Left */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">P</span>
          </IconButton>
          <IconButton id="r" onClick={() => { this.handlePositionSelection(1); }} className={activeButtonId === 'r' ? 'active' : ''}>
            {/* Right */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">Q</span>
          </IconButton>
        </div>
      );
    } else if (qs_game_type === 3) {
      return (
        <div className="qs-buttons">
          <IconButton id="l" onClick={() => { this.handlePositionSelection(0); }} className={activeButtonId === 'l' ? 'active' : ''}>
            {/* Left */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">P</span>
          </IconButton>
          <IconButton id="cc" onClick={() => { this.handlePositionSelection(1); }} className={activeButtonId === 'cc' ? 'active' : ''}>
            {/* Center */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">Q</span>
          </IconButton>
          <IconButton id="r" onClick={() => { this.handlePositionSelection(2); }} className={activeButtonId === 'r' ? 'active' : ''}>
            {/* Right */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">W</span>
          </IconButton>
        </div>
      );
    } else if (qs_game_type === 4) {
      return (
        <div className="qs-buttons">
          <IconButton id="tl" onClick={() => { this.handlePositionSelection(0); }} className={activeButtonId === 'tl' ? 'active' : ''}>
            {/* Top Left */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">P</span>
          </IconButton>
          <IconButton id="tr" onClick={() => { this.handlePositionSelection(1); }} className={activeButtonId === 'tr' ? 'active' : ''}>
            {/* Top Right */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">Q</span>
          </IconButton>
          <IconButton id="bl" onClick={() => { this.handlePositionSelection(2); }} className={activeButtonId === 'bl' ? 'active' : ''}>
            {/* Bottom Left */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">W</span>
          </IconButton>
          <IconButton id="br" onClick={() => { this.handlePositionSelection(3); }} className={activeButtonId === 'br' ? 'active' : ''}>
            {/* Bottom Right */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">E</span>
          </IconButton>
        </div>
      );
    } else if (qs_game_type === 5) {
      return (
        <div className="qs-buttons">
          <IconButton id="tl" onClick={() => { this.handlePositionSelection(1); }} className={activeButtonId === 'tl' ? 'active' : ''}>
            {/* TL */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">Q</span>
          </IconButton>
          <IconButton id="tr" onClick={() => { this.handlePositionSelection(2); }} className={activeButtonId === 'tr' ? 'active' : ''}>
            {/* TR */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">W</span>
          </IconButton>
          <IconButton id="bl" onClick={() => { this.handlePositionSelection(3); }} className={activeButtonId === 'bl' ? 'active' : ''}>
            {/* BL */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">E</span>
          </IconButton>
          <IconButton id="br" onClick={() => { this.handlePositionSelection(4); }} className={activeButtonId === 'br' ? 'active' : ''}>
            {/* BR */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">R</span>
          </IconButton>
          <IconButton id="c" onClick={() => { this.handlePositionSelection(0); }} className={activeButtonId === 'c' ? 'active' : ''}>
            {/* C */}<span style={{ transform: "scaleY(-1)" }} className="roll-tag">P</span>
          </IconButton>
        </div>
      );
    }
  }

  onAutoPlay = () => {
    const { qs_list, isDarkMode, qs_game_type } = this.props;
    if (qs_list.length > 2) {
      const prevStates = qs_list;
      let nextQS = this.predictNext(prevStates, qs_game_type);

      nextQS = parseInt(nextQS);

      this.handlePositionSelection(nextQS);
    } else {
      alertModal(
        isDarkMode,
        'PURR-HAPS IT WOULD BE WISE TO AT LEAST 3 RUNS FOR AI TRAINING DATA!'
      );
      return;
    }
  };



  render() {
    // let position_name = [
    //   'Center',
    //   'Top-Left',
    //   'Top-Right',
    //   'Bottom-Left',
    //   'Bottom-Right'
    // ];

    // if (this.props.qs_game_type === 2) {
    //   position_name = ['Left', 'Right'];
    // } else if (this.props.qs_game_type === 3) {
    //   position_name = ['Bottom-Left', 'Center', 'Bottom-Right'];
    // } else if (this.props.qs_game_type === 4) {
    //   position_name = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'];
    // }

    return (
      <>
        {this.props.step === 1 && (
          <div className="game-info-panel">
            <h3 className="game-sub-title">Choose a Game Type</h3>
            <div className="qs-game-type-panel">
              {[2, 3, 4, 5].map(i => (
                <button
                  className={this.props.qs_game_type === i ? ' active' : ''}
                  onClick={() => {
                    this.props.onChangeState({
                      qs_game_type: i,
                      max_return: this.props.bet_amount * Number(i),
                      public_bet_amount: convertToCurrency(
                        this.props.bet_amount * Number(i - 1)
                      ),
                      selected_qs_position: 0
                    });
                  }}
                >
                  {i}x
                </button>
              ))}
            </div>
            <p className="tip">Your multiplier</p>
          </div>
        )}
        {this.props.step === 2 && (
          <DefaultBetAmountPanel
            game_type="Quick Shoot"
            qs_game_type={this.props.qs_game_type}
            onChangeState={this.props.onChangeState}
            bet_amount={this.props.bet_amount}
          />
        )}
        {this.props.step === 3 && (
          <div className="game-info-panel">
            <div className="qs-add-run-panel">
              <div className="qs-add-run-form">
                <h3 className="game-sub-title">Choose WHERE TO SAVE</h3>
                {this.state.animation}
                {this.renderButtons()}
                <Button id="aiplay" onClick={this.onAutoPlay}>
                  Test AI Play&nbsp;<span className="roll-tag">[space]</span>
                </Button>
              </div>
              <div className="qs-add-run-table">
                <h3 className="game-sub-title">TRAINING DATA</h3>

                <table id="runs">
                  <tbody>
                    {this.state.qs_list && this.state.qs_list.length > 0 ? (
                      this.state.qs_list.map((qs, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{qs.qs}</td>
                          <td>
                            <HighlightOffIcon id="delete"
                              onClick={() => this.onRemoveItem(index)}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td id="add-run" colSpan="3">
                          Provide the AI with example outputs
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <IconButton style={{ background: "transparent", boxShadow: "none" }} color="secondary" onClick={this.handleReset}>
                  <FontAwesomeIcon icon={faTrash} /> {/* Use the faRedo icon */}
                </IconButton>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}
const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode
});

export default connect(mapStateToProps)(QuickShoot);
