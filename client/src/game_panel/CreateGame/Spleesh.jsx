import React, { Component } from 'react';

class Spleesh extends Component {
	createNumberPanel() {
		let panel = [];
		for (let i = 1; i <= 10; i++) {
			panel.push( <button
					className={(this.props.bet_amount / this.props.spleesh_bet_unit === i ? ' active' : '')}
					onClick={() => { this.props.onChangeState({
						bet_amount: i * this.props.spleesh_bet_unit,
						endgame_amount: this.props.spleesh_bet_unit * (55 - i),
						max_return: this.props.spleesh_bet_unit * (55 - i)
					}); }} key={i}
				>
					£{i * this.props.spleesh_bet_unit}
				</button>);
		}
		return panel;
	}

	render() {
		return ( this.props.step === 1 ?
				<div className="game-info-panel">
					<h3 className="game-sub-title">Game Type</h3>
					<div className="select-buttons-panel">
						<button
							className={(this.props.spleesh_bet_unit === 1 ? ' active' : '')}
							onClick={() => {
								this.props.onChangeState({spleesh_bet_unit: 1, bet_amount: 1, max_return: 54, endgame_amount: 54});
							}}
						>
								£1 - £10
						</button>
						<button
							className={(this.props.spleesh_bet_unit === 10 ? ' active' : '')}
							onClick={() => {
								this.props.onChangeState({spleesh_bet_unit: 10, bet_amount: 10, max_return: 540, endgame_amount: 540});
							}}
						>
							£10 - £100
						</button>
					</div>
				</div>
				:
				<div className="game-info-panel">
					<h3 className="game-sub-title">Your Number</h3>
					<div className="select-buttons-panel">
						{this.createNumberPanel()}
					</div>
					<p className="tip">Pick a number for players to guess (Your Bet Amount)</p>
				</div>
		);
	}
}

export default Spleesh;
