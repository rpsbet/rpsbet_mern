import React, { Component } from 'react';
import { updateDigitToPoint2 } from '../../util/helper';

class Summary extends Component {
    pre_summery() {
        let public_max_return = "£" + updateDigitToPoint2(this.props.max_prize * 0.95);
        let public_bet_amount = this.props.public_bet_amount;

        console.log(public_bet_amount, this.props.game_mode)

        if (this.props.game_mode === 'Spleesh!') {
            if (this.props.max_return < 100) {
                public_bet_amount = "£1 - £10";
                public_max_return = "£" + updateDigitToPoint2(56 * 0.9);
            } else {
                public_bet_amount = "£10 - £100";
                public_max_return = "£" + updateDigitToPoint2(560 * 0.9);
            }
        } else if (this.props.game_mode === 'Quick Shoot') {
            public_max_return = "£" + updateDigitToPoint2(this.props.max_return);
        }

        return (
            <div className="pre_summary_panel">
                <div>
                    <hr/>
                    <label style={{background: "#f6b22a"}} className="lbl_game_option">Your Bet Amount</label>
                    <input type="text" readOnly className="form-control input-sm" value={"£" + updateDigitToPoint2(this.props.bet_amount)} />
                </div>
                {
                    (this.props.game_mode === 'Mystery Box' || this.props.game_mode === 'Spleesh!' || this.props.game_mode === 'Quick Shoot') && 
                    <div>
                        <hr/>
                        <label className="lbl_game_option">Public Bet Amount</label>
                        <input type="text" readOnly className="form-control input-sm" value={public_bet_amount} />
                    </div>
                }
                <div>
                    <hr/>
                    <label style={{background: "#f6b22a"}} className="lbl_game_option">Your Max Return</label>
                    <input type="text" readOnly className="form-control input-sm" value={"£" + updateDigitToPoint2(this.props.max_return)} />
                </div>
                {
                    (this.props.game_mode === 'Mystery Box' || this.props.game_mode === 'Spleesh!' || this.props.game_mode === 'Quick Shoot') && 
                    <div>
                        <hr/>
                        <label className="lbl_game_option">Public Max Return</label>
                        <input type="text" readOnly className="form-control input-sm" value={public_max_return} />
                    </div>
                }
            </div>
        );
    }
    
    total_summery() {
        let public_bet_amount = this.props.public_bet_amount;
        let public_max_return = "£" + updateDigitToPoint2(this.props.max_prize * 0.95);
        
        if (this.props.game_mode === 'Spleesh!') {
            if (this.props.max_return < 100) {
                public_bet_amount = "£1 - £10";
            } else {
                public_bet_amount = "£10 - £100";
            }
        } else if (this.props.game_mode === 'Quick Shoot') {
            public_max_return = "£" + updateDigitToPoint2(this.props.max_return);
        }

        return (
            <div className="summary_panel">
                <hr/>
                <label className="lbl_game_option">Game Summary</label>
                <div className="summary_item row">
                    <div className="col-md-3 col-sm-6">Bet Amount</div>
                    <div className="col-md-3 col-sm-6">£{updateDigitToPoint2(this.props.bet_amount)}</div>
                </div>
                {
                    (this.props.game_mode === 'Spleesh!' || this.props.game_mode === 'Quick Shoot') && 
                    <div className="summary_item row">
                        <div className="col-md-3 col-sm-6">Public Bet Amount</div>
                        <div className="col-md-3 col-sm-6">{public_bet_amount}</div>
                    </div>
                }
                {
                    (this.props.game_mode === 'Quick Shoot') && 
                    <div className="summary_item row">
                        <div className="col-md-3 col-sm-6">Public Max Return</div>
                        <div className="col-md-3 col-sm-6">{public_max_return}</div>
                    </div>
                }
                <div className="summary_item row">
                    <div className="col-md-3 col-sm-6">Max Return Amount</div>
                    <div className="col-md-3 col-sm-6">£{updateDigitToPoint2(this.props.max_return)}</div>
                </div>
                {this.props.endgame_type && <div className="summary_item row">
                    <div className="col-md-3 col-sm-6">End Game Amount</div>
                    <div className="col-md-3 col-sm-6">£{updateDigitToPoint2(this.props.endgame_amount)}</div>
                </div>}
                <div className="summary_item row">
                    <div className="col-md-3 col-sm-6">Status</div>
                    <div className="col-md-3 col-sm-6">{this.props.is_private ? "Private" : "Public"}</div>
                </div>
            </div>
        );
    }

    render() {
        if (this.props.step === 1) {
            return <></>;
        } else if (this.props.step === 4) {
            return this.total_summery();
        }
        return this.pre_summery();
    }
}

export default Summary;
