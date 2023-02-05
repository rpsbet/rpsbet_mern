import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import { getQsLottieAnimation } from '../../util/helper';
import Lottie from 'react-lottie';
import { convertToCurrency } from '../../util/conversion';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';




class QuickShoot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is_other: 'hidden',
      selected_qs_position: 0,
      qs_list: [],
      winChance: 33,
      animation: <div />
    };
    this.handlePositionSelection = this.handlePositionSelection.bind(this);

  }
  async handlePositionSelection(selected_qs_position) {
    await this.props.onChangeState({
      selected_qs_position: selected_qs_position,
    });
    this.onAddRun(selected_qs_position);
    this.updateAnimation();
  }

  // onLeftPositionButtonClicked = async e => {
  //   e.preventDefault();
  //   if (this.props.selected_qs_position > 0) {
  //     await this.props.onChangeState({
  //       selected_qs_position: this.props.selected_qs_position - 1
  //     });
  //     this.updateAnimation();
  //   }
  // };

  // onRightPositionButtonClicked = async e => {
  //   e.preventDefault();
  //   if (this.props.selected_qs_position < this.props.qs_game_type - 1) {
  //     await this.props.onChangeState({
  //       selected_qs_position: this.props.selected_qs_position + 1
  //     });
  //     this.updateAnimation();
  //   }
  // };

  

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
              loop: true,
              autoplay: true,
              animationData
            }}
            style={{ maxWidth: '100%', width: '600px', borderRadius: '20px',
            boxShadow: '0 0 20px #0e0e0e'  }}
          />
        </div>
      )
    });
  };

  onChangeWinChance = (winChance) => {
    this.setState({ winChance });
  };

  calcWinChance = (gametype, rounds) => {
    let positionCounts = new Array(gametype + 1).fill(0);
    for (let i = 0; i < rounds.length; i++) {
      positionCounts[rounds[i].qs]++;

    }
    console.log('position counts', positionCounts)
    let entropy = 0;
    for (let i = 0; i < gametype; i++) {
      if (positionCounts[i] === 0) {
        continue;
      }
      let probability = positionCounts[i] / rounds.length;
      entropy -= probability * Math.log2(probability);
    }
    console.log('entropy', entropy)
    let winChanceMin = Math.max(0, (1 - entropy / Math.log2(gametype)) / gametype);
    let winChanceMax = Math.min(1, (1 - entropy / Math.log2(gametype)));
    winChanceMin *= 100;
    winChanceMax *= 100;
    return winChanceMin.toFixed(2) + '% - ' + winChanceMax.toFixed(2) + '%';
  }

  onAddRun = (selected_qs_position) => {
    this.setState({ selected_qs_position: selected_qs_position });
    const newArray = JSON.parse(JSON.stringify(this.props.qs_list));
    newArray.push({
      qs: selected_qs_position
    });
    
    const winChance = this.calcWinChance(this.props.qs_game_type, newArray);
    this.props.onChangeState({
      winChance: winChance,
      qs_list: newArray
    });
    this.onChangeWinChance(winChance);
    this.setState({ winChance });
    let position_short_name = ['center', 'tl', 'tr', 'bl', 'br'];
  console.log('jfk aiuurporrt'  , winChance)
    if (this.props.qs_game_type === 2) {
      position_short_name = ['bl', 'br'];
    } else if (this.props.qs_game_type === 3) {
      position_short_name = ['bl', 'center', 'br'];
    } else if (this.props.qs_game_type === 4) {
      position_short_name = ['tl', 'tr', 'bl', 'br'];
    }
  
    this.setState((prevState) => {
      const updatedQsList = [...prevState.qs_list, { qs: position_short_name[selected_qs_position] }];

      return { qs_list: updatedQsList };
    });

 

  };
  
  componentDidUpdate(prevProps, prevState) {
    if (prevState.qs_list.length !== this.state.qs_list.length) {
      const lastRow = document.querySelector("#runs tbody tr:last-child");
      lastRow.scrollIntoView({ behavior: "smooth" });
    }
  }
  

  onRemoveItem = (index) => {
    this.setState((prevState) => {
      const updatedQsList = [...prevState.qs_list];
      updatedQsList.splice(index, 1);
      const winChance = this.calcWinChance(this.props.qs_game_type, updatedQsList);
      this.props.onChangeState({
        winChance: winChance,
        qs_list: updatedQsList
      });
      return { qs_list: updatedQsList, winChance };
    });
  };
  

  async componentDidMount() {
    await this.updateAnimation();
  }

  renderButtons() {
    const { qs_game_type } = this.props;

    if (qs_game_type === 2) {
      return (
        <div className='qs-buttons'>
          <button id="l" onClick={() => this.handlePositionSelection(0)}>
            {/* Left */}
          </button>
          <button id="r" onClick={() => this.handlePositionSelection(1)}>
            {/* Right */}
          </button>
        </div>
      );
    } else if (qs_game_type === 3) {
      return (
        <div className='qs-buttons'>
          <button id="l" onClick={() => this.handlePositionSelection(1)}>
            {/* Left */}
          </button>
          <button id="cc" onClick={() => this.handlePositionSelection(2)}>
            {/* Center */}
          </button>
          <button id="r" onClick={() => this.handlePositionSelection(3)}>
            {/* Right */}
          </button>
        </div>
      );
    } else if (qs_game_type === 4) {
      return (
        <div className='qs-buttons'>
          <button id="tl" onClick={() => this.handlePositionSelection(1)}>
            {/* Top Left */}
          </button>
          <button id="tr" onClick={() => this.handlePositionSelection(2)}>
            {/* Top Right */}
          </button>
          <button id="bl" onClick={() => this.handlePositionSelection(3)}>
            {/* Bottom Left */}
          </button>
          <button id="br" onClick={() => this.handlePositionSelection(4)}>
            {/* Bottom Right */}
          </button>
        </div>
      );
    } else if (qs_game_type === 5) {
      return (
        <div className='qs-buttons'>
          <button id="tl" onClick={() => this.handlePositionSelection(1)}>
            {/* TL */}
          </button>
          <button id="tr"  onClick={() => this.handlePositionSelection(2)}>
            {/* TR */}
          </button>
          <button id="bl"  onClick={() => this.handlePositionSelection(3)}>
            {/* BL */}
          </button>
          <button id="br"  onClick={() => this.handlePositionSelection(4)}>
            {/* BR */}
          </button>
          <button id="c"  onClick={() => this.handlePositionSelection(0)}>
            {/* C */}
          </button>
        </div>
      );
    }
  }

  render() {
    let position_name = [
      'Center',
      'Top-Left',
      'Top-Right',
      'Bottom-Left',
      'Bottom-Right'
    ];

    if (this.props.qs_game_type === 2) {
      position_name = ['Left', 'Right'];
    } else if (this.props.qs_game_type === 3) {
      position_name = ['Bottom-Left', 'Center', 'Bottom-Right'];
    } else if (this.props.qs_game_type === 4) {
      position_name = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'];
    }

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
            <div className='qs-add-run-panel'>
              <div className='qs-add-run-form'>
            <h3 className="game-sub-title">Choose WHERE TO SAVE</h3>
            {this.state.animation}
            {this.renderButtons()}
            {/* <div className="qs-action-panel">
              <button
                className="btn-left"
                onClick={this.onLeftPositionButtonClicked}
              ></button>
              <label>{position_name[this.props.selected_qs_position]}</label>
              <button
                className="btn-right"
                onClick={this.onRightPositionButtonClicked}
              ></button>
            </div> */}
            </div>
            <div className="qs-add-run-table">
            <h3 className="game-sub-title">Runs</h3>
            <table>
              <thead>
                <tr>
                  <th>INDEX</th>
                  <th>POS</th>
                  {/* <th>BET / PR</th> */}
                  <th></th>
                </tr>
              </thead>
              </table>
             
<table id="runs">
  <tbody>
    {this.state.qs_list && this.state.qs_list.length > 0 ? (
      this.state.qs_list.map((qs, index) => (
        <tr key={index}>
          <td>{index + 1}</td>
          <td>{qs.qs}</td>
          <td>
            <HighlightOffIcon onClick={() => this.onRemoveItem(index)} />
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td id="add-run" colSpan="3">Please add a run</td>
      </tr>
    )}
  </tbody>
</table>

          </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default QuickShoot;
