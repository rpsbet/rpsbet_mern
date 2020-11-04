import React, { Component } from 'react';
import { FaPoundSign } from 'react-icons/fa';

class AdvancedSettings extends Component {
    render() {
        return (
            <div id="advanced_panel">
                { this.props.step === 1 && 
                <>
                    <hr/>
                    <label className="lbl_game_option">Privacy</label>
                    <div>
                        <label className={"radio-inline" + (this.props.is_private === false ? ' checked' : '')} onClick={() => { this.props.onChangeState({is_private: false, room_password: ''}); }}>Public</label>
                        <label className={"radio-inline" + (this.props.is_private === true ? ' checked' : '')} onClick={() => { this.props.onChangeState({is_private: true}); }}>Private</label>
                        <input type="text" id="room_password" value={this.props.room_password} onChange={(e) => {this.props.onChangeState({room_password: e.target.value})}} className={"form-control" + (this.props.is_private === true ? "" : " hidden")} />
                    </div>
                    <div className="tip">Set to 'Private' to require a password to Join</div>
                </>
                }

                { this.props.step === 2 && 
                <>
                    <hr/>
                    <label className="lbl_game_option">END Game Type</label>
                    <div>
                        <label className={"radio-inline" + (this.props.endgame_type === false ? ' checked' : '')} onClick={() => { this.props.onChangeState({endgame_type: false}); }}>Manual</label>
                        <label className={"radio-inline" + (this.props.endgame_type === true ? ' checked' : '')} onClick={() => { this.props.onChangeState({endgame_type: true}); }}>Automatic</label>
                        <label className={"lbl_endgame_type" + (this.props.endgame_type === true ? "" : " hidden")}>
                            <span className="pound-symbol"><FaPoundSign /><input type="text" id="endgame_amount" value={this.props.endgame_amount} onChange={(e)=>{this.props.onChangeState({endgame_amount: e.target.value})}} className="col-md-6 form-control bet-input endgame_amount" /></span>
                        </label>
                    </div>
                    <div className="tip">Make your game END automatically when your PR reaches an amount. This will put a cap on your Winnings but at least keep them safe.</div>
                </>
                }

                {/* <hr/>
                <label style={{pointerEvents: "none", opacity: "0.6"}} className="lbl_game_option">(DISABLED) Anonymous Bet</label>
                <div style={{pointerEvents: "none", opacity: "0.6"}}>
                    <label className={"radio-inline" + (this.props.is_anonymous === true ? ' checked' : '')} onClick={() => { this.props.onChangeState({is_anonymous: true}); }}>Yes</label>
                    <label className={"radio-inline" + (this.props.is_anonymous === false ? ' checked' : '')} onClick={() => { this.props.onChangeState({is_anonymous: false}); }}>No</label>
                </div>
                <div className="tip" style={{pointerEvents: "none", opacity: "0.6"}}>Choose 'Yes' to place an anonymous bet. £0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your £0.10 back.</div> */}
            </div>
        );
    }
}

export default AdvancedSettings;
