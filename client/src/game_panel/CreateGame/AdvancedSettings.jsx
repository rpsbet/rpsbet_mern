import React, { Component } from 'react';
import { Button, TextField } from '@material-ui/core';

class AdvancedSettings extends Component {
  calcWinChance = (boxes, revenueLimit) => {
    let emptyBoxesWithCost4 = 0;
    let prizeBoxCount = 0;
    let costOfPrizes = 0;
  
    // Count the number of empty boxes and prize boxes, and total the cost of prizes
    boxes.forEach(box => {
      if (box.box_prize) {
        prizeBoxCount++;
        costOfPrizes += box.box_price;
      } else {
        emptyBoxesWithCost4++;
      }
    });
  
    // Calculate the maximum number of guesses the guesser can make
    let maxGuesses = Math.floor((revenueLimit - costOfPrizes) / boxes[0].box_price);
  
    // Calculate the probability of the creator winning when the guesser chooses a box with cost 4
    let probabilityOfCreatorWinningWithCost4 = 0;
    for (let i = 0; i < prizeBoxCount && i < maxGuesses; i++) {
      let probability = 1;
      for (let j = 0; j < i; j++) {
        probability *= emptyBoxesWithCost4 / (boxes.length - j);
      }
      probability *= prizeBoxCount / (boxes.length - i);
      probabilityOfCreatorWinningWithCost4 += probability;
    }
  
 // Calculate the overall probability of the creator winning
 let probabilityOfCreatorWinning = ((probabilityOfCreatorWinningWithCost4 * (emptyBoxesWithCost4 / boxes.length)) * 100).toFixed(2);
  
 return probabilityOfCreatorWinning +  '%';
};
 
  render() {
    return (
      <div id="advanced_panel">
        {this.props.step === 1 && (
          <div className="game-privacy-panel game-info-panel">
            <h3 className="game-sub-title">Privacy</h3>
            <div className="radio-button-group">
              <button
                className={
                  'radio-button' + (!this.props.is_private ? ' selected' : '')
                }
                onClick={() => {
                  this.props.onChangeState({
                    is_private: false,
                    room_password: ''
                  });
                }}
              >
                Public
              </button>
              <button
                className={
                  'radio-button' + (this.props.is_private ? ' selected' : '')
                }
                onClick={() => {
                  this.props.onChangeState({ is_private: true });
                }}
              >
                Private
              </button>
              <input
                type="text"
                id="betamount"
                value={this.props.room_password}
                onChange={e => {
                  this.props.onChangeState({ room_password: e.target.value });
                }}
                className={this.props.is_private === true ? '' : ' hidden'}
              />
            </div>
            <p>Set to 'Private' to require a password to Join</p>
          </div>
        )}

        {this.props.step === 2 && (
          <div className="game-info-panel payout-info-panel">
            <h3 className="game-sub-title">Payout</h3>
            <div className="select-buttons-panel">
              <button
                className={!this.props.endgame_type ? ' active' : ''}
                onClick={() => {
                  this.props.onChangeState({ endgame_type: false });
                }}
              >
                Manual
              </button>
              <button
                className={this.props.endgame_type ? ' active' : ''}
                onClick={() => {
                  this.props.onChangeState({ endgame_type: true });
                }}
              >
                Automatic
              </button>
              <div
                className={`edit-amount-panel ${
                  this.props.endgame_type ? '' : 'hidden'
                }`}
              >
               
                <TextField
                  type="text"
                  name="endgame_amount"
                  id="endgame_amount"
                  value={this.props.endgame_amount}
                  inputProps={{
                    pattern: "[0-9]*",
                    maxLength: 9,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: "BUSD",
                  }}
                  onChange={e => {
                    console.log('23', )

                    if (this.props.game_mode === 'Mystery Box') {
                      this.props.onChangeState({
                        endgame_amount: e.target.value,
                        winChance: this.calcWinChance(this.props.box_list, this.props.endgame_amount) 

                      });
                      

                    } else {
                    this.props.onChangeState({
                      endgame_amount: e.target.value
                    })
                    }
                    ;
                    // this.calcWinChance(this.state.boxList, e.target.value);

                  }}
                  placeholder="PAYOUT"
                />
              </div>
            </div>
            <p className="tip">AUTOMATIC PAYOUTS WHEN BANKROLL HITS VALUE</p>
          </div>
        )}
        {/* {this.props.step === 3 && (
          <div className="game-privacy-panel game-info-panel">
            <h3 className="game-sub-title">Anonymous</h3>
            <div className="radio-button-group">
              <button
                className={
                  'radio-button' + (this.props.is_anonymous === true ? ' checked' : '')
                }
                onClick={() => { this.props.onChangeState({is_anonymous: true}); }}
              >
                Yes
              </button>
              <button
                className={
                  'radio-button' + (this.props.is_anonymous === false ? ' checked' : '')
                }
                onClick={() => { this.props.onChangeState({is_anonymous: false}); }}
              >
                No
              </button>
            </div>
            <p>Choose 'Yes' to place an anonymous bet. RPS 0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your RPS 0.10 back.</p>
          </div>
        )} */}

{/* 
        <hr/>
				<label className="lbl_game_option">Anonymous Bet</label>
				<div >
					<label className={"radio-inline" + (this.props.is_anonymous === true ? ' checked' : '')} onClick={() => { this.props.onChangeState({is_anonymous: true}); }}>Yes</label>
					<label className={"radio-inline" + (this.props.is_anonymous === false ? ' checked' : '')} onClick={() => { this.props.onChangeState({is_anonymous: false}); }}>No</label>
				</div>
				<div className="tip" style={{pointerEvents: "none", opacity: "0.6"}}>Choose 'Yes' to place an anonymous bet. RPS 0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your RPS 0.10 back.</div>
      */}</div> 
    );
  }
}

export default AdvancedSettings;
