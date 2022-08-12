import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import { getQsLottieAnimation } from '../../util/helper';
import Lottie from 'react-lottie';
import { convertToCurrency } from '../../util/conversion';

class QuickShoot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is_other: 'hidden',
      animation: <div />
    };
  }

  onLeftPositionButtonClicked = async e => {
    e.preventDefault();
    if (this.props.selected_qs_position > 0) {
      await this.props.onChangeState({
        selected_qs_position: this.props.selected_qs_position - 1
      });
      this.updateAnimation();
    }
  };

  onRightPositionButtonClicked = async e => {
    e.preventDefault();
    if (this.props.selected_qs_position < this.props.qs_game_type - 1) {
      await this.props.onChangeState({
        selected_qs_position: this.props.selected_qs_position + 1
      });
      this.updateAnimation();
    }
  };

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
            style={{ maxWidth: '100%', width: '600px' }}
          />
        </div>
      )
    });
  };

  async componentDidMount() {
    await this.updateAnimation();
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
                        this.props.bet_amount * Number(i)
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
            <h3 className="game-sub-title">Choose WHERE TO SAVE</h3>
            {this.state.animation}
            <div className="qs-action-panel">
              <button
                className="btn-left"
                onClick={this.onLeftPositionButtonClicked}
              ></button>
              <label>{position_name[this.props.selected_qs_position]}</label>
              <button
                className="btn-right"
                onClick={this.onRightPositionButtonClicked}
              ></button>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default QuickShoot;
