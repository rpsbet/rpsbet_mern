import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FaPoundSign } from 'react-icons/fa';

class ClassicRPS extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected_rps: 1,
            bet_amount: 0,
            advanced_status: 'hidden',
            is_private: false,
            is_anonymous: false,
            room_password: '',
            balance: this.props.balance
        };
        this.onShowButtonClicked = this.onShowButtonClicked.bind(this);
        this.onChangeBetAmount = this.onChangeBetAmount.bind(this);
        this.onChangeRoomPassword = this.onChangeRoomPassword.bind(this);
        this.onCreateGame = this.onCreateGame.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.balance !== props.balance) {
            return {
                ...current_state,
                balance: props.balance
            };
        }
        return null;
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

        if (this.state.bet_amount > this.state.balance / 100.0) {
            alert("Not enough balance!");
            return;
        }

        if (this.state.is_private === true && this.state.room_password === "") {
            alert("You have set the Privacy to 'Private'. Please create a password!");
            return;
        }

        if (window.confirm('Do you want to create new game now?')) {
            this.props.createRoom({
                game_type: 1,
                selected_rps: this.state.selected_rps,
                bet_amount: this.state.bet_amount,
                is_private: this.state.is_private,
                is_anonymous: this.state.is_anonymous,
                room_password: this.state.room_password
            });
        }
    }

    render() {
        return (
            <form onSubmit={this.onCreateGame}>
                <hr/>
                <label className="lbl_game_option">Bet Amount</label>
                <span class="pound-symbol"><FaPoundSign />
                <input type="text" pattern="[0-9]*" name="betamount" id="betamount" value={this.state.bet_amount} onChange={this.onChangeBetAmount} className="form-control col-md-6 input-sm bet-input" placeholder="Bet Amount" /></span>
                <div>The global cost to play this game</div>
                <hr/>
                <label className="lbl_game_option">Select: Rock - Paper - Scissors!</label>
                <div>
                    <label className={"drinkcard-cc rock" + (this.state.selected_rps === 1 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 1}); }}></label>
                    <label className={"drinkcard-cc paper" + (this.state.selected_rps === 2 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 2}); }}></label>
                    <label className={"drinkcard-cc scissors" + (this.state.selected_rps === 3 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 3}); }}></label>
                </div>
                <hr/>
                <label className="lbl_game_option">Max Return</label>
                <input type="text" readOnly name="potential" id="potential" className="form-control input-sm" value={this.state.bet_amount === 0 ? "" : "£" + (this.state.bet_amount * 2) + " * 0.95"} />
                <div>The global max return with the chosen settings</div>
                <button className="btn-advanced" onClick={this.onShowButtonClicked}>Show/Hide Advanced Settings</button>
                <div id="advanced_panel" className={this.state.advanced_status}>
                    <hr/>
                    <label className="lbl_game_option">Privacy:</label>
                    <div>
                        <label className={"radio-inline" + (this.state.is_private === false ? ' checked' : '')} onClick={() => { this.setState({is_private: false, room_password: ''}); }}>Public</label>
                        <label className={"radio-inline" + (this.state.is_private === true ? ' checked' : '')} onClick={() => { this.setState({is_private: true}); }}>Private</label>
                        <input type="password" id="room_password" value={this.state.room_password} onChange={this.onChangeRoomPassword} className={"form-control" + (this.state.is_private === true ? "" : " hidden")} />
                    </div>
                    <div>Set to 'Private' to require a password to Join</div>

                    <hr/>
                    <label style={{pointerEvents: "none", opacity: "0.6"}} className="lbl_game_option">(DISABLED) Anonymous Bet:</label>
                    <div style={{pointerEvents: "none", opacity: "0.6"}}>
                        <label className={"radio-inline" + (this.state.is_anonymous === true ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: true}); }}>Yes</label>
                        <label className={"radio-inline" + (this.state.is_anonymous === false ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: false}); }}>No</label>
                    </div>
                    <div  style={{pointerEvents: "none", opacity: "0.6"}}>Choose 'Yes' to place an anonymous bet. £0.10 will be deducted from your balance and added to the PR.</div>
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
    balance: state.auth.balance,
});

const mapDispatchToProps = {
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ClassicRPS);
