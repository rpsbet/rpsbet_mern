import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import { getQsLottieAnimation } from '../../util/helper'
import Lottie from 'react-lottie'

class QuickShoot extends Component {
    constructor(props) {
        super(props);
        this.state = {
            is_other: 'hidden',
            animation: <div />
        };

        this.onLeftPositionButtonClicked = this.onLeftPositionButtonClicked.bind(this);
        this.onRightPositionButtonClicked = this.onRightPositionButtonClicked.bind(this);
    }

    async onLeftPositionButtonClicked(e) {
        e.preventDefault();
        if (this.props.selected_qs_position > 0) {
            await this.props.onChangeState({selected_qs_position: this.props.selected_qs_position - 1});
            this.updateAnimation();
        }
    }

    async onRightPositionButtonClicked(e) {
        e.preventDefault();
        if (this.props.selected_qs_position < this.props.qs_game_type - 1) {
            await this.props.onChangeState({selected_qs_position: this.props.selected_qs_position + 1});
            this.updateAnimation();
        }
    }

    async updateAnimation() {
        let position_short_name = ["center", "tl", "tr", "bl", "br"];

        if (this.props.qs_game_type === 2) {
            position_short_name = ["bl", "br"];
        } else if (this.props.qs_game_type === 3) {
            position_short_name = ["bl", "center", "br"];
        } else if (this.props.qs_game_type === 4) {
            position_short_name = ["tl", "tr", "bl", "br"];
        }

        const animationData = await getQsLottieAnimation(this.props.qs_nation, position_short_name[this.props.selected_qs_position]);

        this.setState({
            animation: <div className="qs-image-panel">
                    <Lottie options={{
                            loop: true,
                            autoplay: true, 
                            animationData
                        }}
                        style={{maxWidth: '100%', width: '600px'}}
                    />
                </div>
        })
    }

    async componentDidMount() {
        await this.updateAnimation();
    }

    render() {
        let position_name = ["Center", "Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"];

        if (this.props.qs_game_type === 2) {
            position_name = ["Left", "Right"];
        } else if (this.props.qs_game_type === 3) {
            position_name = ["Bottom-Left", "Center", "Bottom-Right"];
        } else if (this.props.qs_game_type === 4) {
            position_name = ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"];
        }

        return (
            <>
                {this.props.step === 1 && 
                    <div className="game-info-panel">
                        <h3 className="game-sub-title">Choose a Game Type</h3>
                        <div className="qs-game-type-panel">
                            <button className={(this.props.qs_game_type === 2 ? ' active' : '')} onClick={() => { this.props.onChangeState({ qs_game_type: 2, max_return: this.props.bet_amount * 2, public_bet_amount: "£" + this.props.bet_amount * 1, selected_qs_position: 0 }); }}>2</button>
                            <button className={(this.props.qs_game_type === 3 ? ' active' : '')} onClick={() => { this.props.onChangeState({ qs_game_type: 3, max_return: this.props.bet_amount * 3, public_bet_amount: "£" + this.props.bet_amount * 2, selected_qs_position: 0 }); }}>3</button>
                            <button className={(this.props.qs_game_type === 4 ? ' active' : '')} onClick={() => { this.props.onChangeState({ qs_game_type: 4, max_return: this.props.bet_amount * 4, public_bet_amount: "£" + this.props.bet_amount * 3, selected_qs_position: 0 }); }}>4</button>
                            <button className={(this.props.qs_game_type === 5 ? ' active' : '')} onClick={() => { this.props.onChangeState({ qs_game_type: 5, max_return: this.props.bet_amount * 5, public_bet_amount: "£" + this.props.bet_amount * 4, selected_qs_position: 0 }); }}>5</button>
                        </div>
                    </div>
                }
                {this.props.step === 2 && <DefaultBetAmountPanel game_type="Quick Shoot" qs_game_type={this.props.qs_game_type} onChangeState={this.props.onChangeState} bet_amount={this.props.bet_amount} />}
                {this.props.step === 3 && 
                    <div className="game-info-panel">
                        <h3 className="game-sub-title">Choose WHERE TO SAVE</h3>
                        {this.state.animation}
                        <div className="qs-action-panel">
                            <button className="btn-left" onClick={this.onLeftPositionButtonClicked}></button>
                            <label>{position_name[this.props.selected_qs_position]}</label>
                            <button className="btn-right" onClick={this.onRightPositionButtonClicked}></button>
                        </div>
                    </div>
                }
            </>
        );
    }
}

export default QuickShoot;
