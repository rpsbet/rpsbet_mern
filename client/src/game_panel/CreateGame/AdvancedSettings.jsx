import React, { Component } from 'react';

class AdvancedSettings extends Component {
	render() {
		return (
			<div id="advanced_panel">
				{ this.props.step === 1 && 
				<div className="game-privacy-panel game-info-panel">
					<h3 className="game-sub-title">Privacy</h3>
					<div className="radio-button-group">
						<button className={"radio-button" + (!this.props.is_private ? ' selected' : '')} onClick={() => { this.props.onChangeState({is_private: false, room_password: ''}); }}>
							Public
						</button>
						<button className={"radio-button" + (this.props.is_private ? ' selected' : '')} onClick={() => { this.props.onChangeState({is_private: true}); }}>
							Private
						</button>
						<input type="text" value={this.props.room_password} onChange={(e) => {this.props.onChangeState({room_password: e.target.value})}} className={(this.props.is_private === true ? "" : " hidden")} />
					</div>
					<p>Set to 'Private' to require a password to Join</p>
				</div>
				}

				{ this.props.step === 2 && 
				<div className="game-info-panel payout-info-panel">
					<h3 className="game-sub-title">Payout</h3>
					<div className="select-buttons-panel">
						<button className={(!this.props.endgame_type ? ' active' : '')} onClick={() => { this.props.onChangeState({endgame_type: false}); }}>Manual</button>
						<button className={(this.props.endgame_type ? ' active' : '')} onClick={() => { this.props.onChangeState({endgame_type: true}); }}>Automatic</button>
						<div className={`edit-amount-panel ${this.props.endgame_type ? '' : 'hidden'}`}>
							<span>RPS </span>
							<input type="text" pattern="[0-9]*" name="endgame_amount" id="endgame_amount" 
								value={this.props.endgame_amount} 
								onChange={(e) => {this.props.onChangeState({endgame_amount: e.target.value})}} 
								placeholder="End Game Amount" />
						</div>
					</div>
					<p className="tip">Choose Automatic to cashout at a set amount.</p>
				</div>
				}

				{/* <hr/>
				<label style={{pointerEvents: "none", opacity: "0.6"}} className="lbl_game_option">(DISABLED) Anonymous Bet</label>
				<div style={{pointerEvents: "none", opacity: "0.6"}}>
					<label className={"radio-inline" + (this.props.is_anonymous === true ? ' checked' : '')} onClick={() => { this.props.onChangeState({is_anonymous: true}); }}>Yes</label>
					<label className={"radio-inline" + (this.props.is_anonymous === false ? ' checked' : '')} onClick={() => { this.props.onChangeState({is_anonymous: false}); }}>No</label>
				</div>
				<div className="tip" style={{pointerEvents: "none", opacity: "0.6"}}>Choose 'Yes' to place an anonymous bet. RPS 0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your RPS 0.10 back.</div> */}
			</div>
		);
	}
}

export default AdvancedSettings;
