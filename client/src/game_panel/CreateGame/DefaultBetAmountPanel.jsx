import React, { Component } from 'react';
import { initParams } from 'request';
import { convertToCurrency } from '../../util/conversion';
import { updateDigitToPoint2 } from '../../util/helper';
import { connect } from 'react-redux';
import { Button, TextField } from '@material-ui/core';

class DefaultBetAmountPanel extends Component {
  constructor(props) {
    super(props);
    const defaultBetAmounts = this.props.defaultBetAmounts
      ? this.props.defaultBetAmounts
      : [10, 25, 50, 100, 250];
    this.state = {
      defaultBetAmounts: defaultBetAmounts,
      // balance: this.state.balance,
      is_other:
        defaultBetAmounts.indexOf(this.props.bet_amount) < 0 ? true : false
    };
  }
  handleMaxButtonClick() {
    const maxBetAmount = (this.props.balance).toFixed(2);
    if (this.props.game_type === 'Brain Game') {
    this.props.onChangeState({
    bet_amount: maxBetAmount
    });
    } else if (this.props.game_type === 'Quick Shoot') {
    this.props.onChangeState({
    bet_amount: maxBetAmount,
    public_bet_amount: convertToCurrency(
    (this.props.qs_game_type - 1) * maxBetAmount
    ),
    max_return: this.props.qs_game_type * maxBetAmount
    });
    } else {
    this.props.onChangeState({
    bet_amount: maxBetAmount,
    max_return: maxBetAmount * 2
    });
    }
    }

    componentDidUpdate(prevProps) {
      if (this.props.bet_amount !== prevProps.bet_amount) {
        document.getElementById("betamount").focus();
      }
    }
    

  render() {
    return (
      <div className="default-bet-amount-panel game-info-panel">
        <h3 className="game-sub-title">BANKROLL</h3>
        <div className="bet-amounts">
          {this.state.defaultBetAmounts.map((amount, index) => (
            <Button
              className={
                !this.state.is_other && this.props.bet_amount === amount
                  ? ' active'
                  : ''
              }
              onClick={() => {
                this.setState({ is_other: false });
                if (this.props.game_type === 'Brain Game') {
                  this.props.onChangeState({ bet_amount: amount });
                } else if (this.props.game_type === 'Quick Shoot') {
                  this.props.onChangeState({
                    bet_amount: amount,
                    public_bet_amount: convertToCurrency(
                      (this.props.qs_game_type - 1) * amount
                    ),
                    max_return: this.props.qs_game_type * amount
                  });
                } else {
                  this.props.onChangeState({
                    bet_amount: amount,
                    max_return: amount * 2 /* * 0.95 */
                  });
                }
              }}
              key={index}
            >
              {convertToCurrency(updateDigitToPoint2(amount))}
            </Button>
          ))}
          <Button
            className={this.state.is_other ? 'other active' : 'other'}
            onClick={() => {
              this.setState({ is_other: true });
            }}
          >
            Other
          </Button>
        </div>
        <div
          className={`edit-amount-panel ${this.state.is_other ? '' : 'hidden'}`}
        >
                 
   
          <TextField
            type="text"
            name="betamount"
            id="betamount"
            value={this.props.bet_amount}
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
              if (this.props.game_type === 'Brain Game') {
                this.props.onChangeState({ bet_amount: e.target.value });
              } else if (this.props.game_type === 'Quick Shoot') {
                this.props.onChangeState({
                  bet_amount: parseInt(e.target.value) || '',
                  public_bet_amount: convertToCurrency(
                    updateDigitToPoint2(
                      (this.props.qs_game_type - 1) *
                        (parseInt(e.target.value) || '')
                    )
                  ),
                  max_return: this.props.qs_game_type * e.target.value
                });
              } else {
                this.props.onChangeState({
                  bet_amount: parseInt(e.target.value) || '',
                  max_return: (parseInt(e.target.value) || 0) * 2 /* * 0.95 */
                });
              }
            }}
            placeholder="BET AMOUNT"
          />
          <div className='max'>
            {/* <Button variant="contained" color="primary" onClick={() => this.handlehalfxButtonClick()}>0.5x</Button>
            <Button variant="contained" color="primary" onClick={() => this.handle2xButtonClick()}>2x</Button> */}
            <Button variant="contained" color="primary" onClick={() => this.handleMaxButtonClick()}>Max</Button>
          </div>
        </div>
        {this.props.game_type === 'RPS' ? (
          <p className="tip">SET THE INITIAL 'POT' FOR THIS GAME</p>
        ) : (
          <p className="tip">The cost to play this game</p>
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  socket: state.auth.socket,
  balance: state.auth.balance,
});

const mapDispatchToProps = {
};
export default connect(mapStateToProps, mapDispatchToProps)(DefaultBetAmountPanel);
