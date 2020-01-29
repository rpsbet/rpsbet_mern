import React, { Component } from 'react';
import { connect } from 'react-redux';

class ClassicRPS extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected_rps: 1,
            bet_amount: 0,
            advanced_status: 'hidden',
            is_private: false,
            is_anonymous: false,
            room_password: ''
        };
        this.onShowButtonClicked = this.onShowButtonClicked.bind(this);
        this.onChangeBetAmount = this.onChangeBetAmount.bind(this);
        this.onChangeRoomPassword = this.onChangeRoomPassword.bind(this);
        this.onCreateGame = this.onCreateGame.bind(this);
    }

    onChangeBetAmount(e) {
        this.setState({bet_amount: e.target.value});
    }

    onChangeRoomPassword(e) {
        this.setState({room_password: e.target.value});
    }

    onShowButtonClicked(e) {
        e.preventDefault();
        if (this.state.advanced_status === "") {
            this.setState({advanced_status: "hidden"});
        } else {
            this.setState({advanced_status: ""});
        }
    }

    onCreateGame(e) {
        e.preventDefault();
        if (this.state.bet_amount === 0) {
            alert("Please input the bet amount!");
            return;
        }

        if (this.state.is_private === true && this.state.room_password === "") {
            alert("You have selected the private mode. Please input the password!");
            return;
        }

        this.props.createRoom({
            game_type: 1,
            selected_rps: this.state.selected_rps,
            bet_amount: this.state.bet_amount,
            is_private: this.state.is_private,
            is_anonymous: this.state.is_anonymous,
            room_password: this.state.room_password
        });
    }

    render() {
        return (
            <form onSubmit={this.onCreateGame}>
                <hr/>
                <label className="lbl_game_option">Bet Amount</label>
                <input type="number" name="betamount" id="betamount" value={this.state.bet_amount} onChange={this.onChangeBetAmount} className="form-control col-md-6 input-sm bet-input" placeholder="Bet Amount" />
                <div>The amount you want to bet with, your opponent must match this.</div>
                <hr/>
                <label className="lbl_game_option">Select: Rock - Paper - Scissors!</label>
                <div>
                    <label className={"drinkcard-cc rock" + (this.state.selected_rps === 1 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 1}); }}></label>
                    <label className={"drinkcard-cc paper" + (this.state.selected_rps === 2 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 2}); }}></label>
                    <label className={"drinkcard-cc scissors" + (this.state.selected_rps === 3 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 3}); }}></label>
                </div>
                <hr/>
                <label className="lbl_game_option">Max Return</label>
                <input type="text" readOnly name="potential" id="potential" className="form-control input-sm" value={this.state.bet_amount === 0 ? "" : "£" + this.state.bet_amount + " * 0.95"} />
                <div>This will be the most you and your opponent(s) can make with your chosen game settings. (Winnings)</div>
                <button className="btn-advanced" onClick={this.onShowButtonClicked}>Show/Hide Advanced Settings</button>
                <div id="advanced_panel" className={this.state.advanced_status}>
                    <hr/>
                    <label className="lbl_game_option">Status:</label>
                    <div>
                        <label className={"radio-inline" + (this.state.is_private === false ? ' checked' : '')} onClick={() => { this.setState({is_private: false, room_password: ''}); }}>Public</label>
                        <label className={"radio-inline" + (this.state.is_private === true ? ' checked' : '')} onClick={() => { this.setState({is_private: true}); }}>Private</label>
                        <input type="password" id="room_password" value={this.state.room_password} onChange={this.onChangeRoomPassword} className={"form-control" + (this.state.is_private === true ? "" : " hidden")} />
                    </div>
                    <div>Choose 'Private' to force users to require a password to Join your game.</div>

                    <hr/>
                    <label className="lbl_game_option">Anonymous Bet:</label>
                    <div>
                        <label className={"radio-inline" + (this.state.is_anonymous === true ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: true}); }}>Yes</label>
                        <label className={"radio-inline" + (this.state.is_anonymous === false ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: false}); }}>No</label>
                    </div>
                    <div>Choose 'Yes' to place an anonymous bet. £0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your £0.10 back.</div>
                </div>
                <div className="text-center">
                    <button className="btn" id="btn_bet">PLACE BET GAME</button>
                </div>
            </form>
        );
    }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
});

const mapDispatchToProps = {
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ClassicRPS);
