import React, { Component } from 'react';
import { updateDigitToPoint2 } from '../../util/helper';

class DefaultBetAmountPanel extends Component {
	constructor(props) {
		super(props);
		const defaultBetAmounts = this.props.defaultBetAmounts ? this.props.defaultBetAmounts : [1, 2.5, 5, 10, 25];
		console.log(defaultBetAmounts, this.props.bet_amount)
		this.state = {
			defaultBetAmounts: defaultBetAmounts,
			is_other: (defaultBetAmounts.indexOf(this.props.bet_amount) < 0 ) ? true : false
		};
	}

	render() {
		return (
			<div className="default-bet-amount-panel game-info-panel">
				<h3 className="game-sub-title">Bet Amount</h3>
				<div className="bet-amounts">
					{ this.state.defaultBetAmounts.map((amount, index) => (
						<button className={(!this.state.is_other && this.props.bet_amount === amount ? ' active' : '')} 
						onClick={() => {
							this.setState({is_other: false}); 
							if (this.props.game_type === 'Brain Game') {
								this.props.onChangeState({bet_amount: amount}); 
							} else if (this.props.game_type === 'Quick Shoot') {
								this.props.onChangeState({
									bet_amount: amount,
									public_bet_amount: "£" + (this.props.qs_game_type - 1) * amount,
									max_return: this.props.qs_game_type * amount 
								}); 
							} else {
								this.props.onChangeState({bet_amount: amount, max_return: amount * 2 * 0.95}); 
							}
						}} key={index} >£{updateDigitToPoint2(amount)}</button>
					))}
					<button className={(this.state.is_other ? 'other active' : 'other')} onClick={() => { this.setState({is_other: true}); }}>Other</button>
				</div>
				<div className={`edit-amount-panel ${this.state.is_other ? '' : 'hidden'}`}>
					<span>£</span>
					<input type="text" pattern="[0-9]*" name="betamount" id="betamount" 
						value={this.props.bet_amount} 
						onChange={(e) => {
							if (this.props.game_type === 'Brain Game') {
								this.props.onChangeState({bet_amount: e.target.value})
							} else if (this.props.game_type === 'Quick Shoot') {
								this.props.onChangeState({
									bet_amount: e.target.value, 
									public_bet_amount: "£" + updateDigitToPoint2((this.props.qs_game_type - 1) * e.target.value),
									max_return: this.props.qs_game_type * e.target.value
								});
							} else {
								this.props.onChangeState({bet_amount: e.target.value, max_return: e.target.value * 2 * 0.95})
							}
						}} 
						placeholder="Bet Amount" />
				</div>
				{
					this.props.game_type === "RPS" ?
						<p className="tip">The cost to play this RUN</p>
						:
						<p className="tip">The cost to play this game</p>
				}
				
			</div>
		);
	}
}

export default DefaultBetAmountPanel;