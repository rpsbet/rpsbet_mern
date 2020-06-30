import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FaPoundSign } from 'react-icons/fa';

class Spleesh extends Component {
    constructor(props) {
        super(props);
        this.state = {
            bet_amount: 1,
            advanced_status: '',
            is_private: false,
            is_anonymous: false,
            endgame_type: true,
            endgame_amount: 54,
            room_password: '',
            balance: this.props.balance,

            game_type: 1,
        };
        this.onShowButtonClicked = this.onShowButtonClicked.bind(this);
        this.onChangeBetAmount = this.onChangeBetAmount.bind(this);
        this.onChangeRoomPassword = this.onChangeRoomPassword.bind(this);
        this.onChangeEndgameAmount = this.onChangeEndgameAmount.bind(this);
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

    onChangeEndgameAmount(e) {
        this.setState({endgame_amount: e.target.value});
    }

    onShowButtonClicked(e) {
        e.preventDefault();
        if (this.state.advanced_status === "") {
            this.setState({advanced_status: "hidden"});
        } else {
            this.setState({advanced_status: ""});
        }

        console.log(this.state.advanced_status);
    }

    onCreateGame(e) {
        e.preventDefault();
        if (this.state.bet_amount > this.state.balance / 100.0) {
            alert("Not enough balance!");
            return;
        }

        if (this.state.is_private === true && this.state.room_password === "") {
            alert("You have set the Privacy to 'Private'. Please create a password!");
            return;
        }

        if (this.state.endgame_type === true && this.state.endgame_amount === 0) {
            alert("You have set the End Game Type to 'Automatic'. Please enter an amount when the game should automatically end!");
            return;
        }

        if (window.confirm('Do you want to create new game now?')) {
            this.props.createRoom({
                game_type: 2,
                bet_amount: this.state.bet_amount,
                is_private: this.state.is_private,
                is_anonymous: this.state.is_anonymous,
                room_password: this.state.room_password,
                end_game_type: this.state.endgame_type,
                end_game_amount: this.state.endgame_amount,
                spleesh_bet_unit: this.state.game_type
            });
        }
    }

    createNumberPanel() {
        let panel = [];
        for (let i = 1; i <= 10; i++) {
            panel.push( <label 
                            className={"radio-inline" + (this.state.bet_amount / this.state.game_type === i ? ' checked' : '')} 
                            onClick={() => { this.setState({
                                bet_amount: i * this.state.game_type,
                                endgame_amount: this.state.game_type * (55 - i)
                            }); }} key={i}
                        >
                            £{i * this.state.game_type}{this.state.game_type === 1 ? '.0' : ''}
                        </label>);
            if (i % 4 === 0) {
                panel.push(<br key={'br_' + i}/>);
            }
        }
        return panel;
    }

    render() {
        return (
            <form onSubmit={this.onCreateGame}>
                <hr/>
                <div className="row">
                    <div style={{padding: "0"}} className="col-md-10 col-sm-10 col-xs-10">
                        <label className="lbl_game_option">Game Type</label>
                        <label className={"radio-inline" + (this.state.game_type === 1 ? ' checked' : '')} onClick={() => { this.setState({game_type: 1, bet_amount: 1}); }}>£1 - £10</label>
                        <label className={"radio-inline" + (this.state.game_type === 10 ? ' checked' : '')} onClick={() => { this.setState({game_type: 10, bet_amount: 10}); }}>£10 - £100</label>
                    </div>
                    <div style={{padding: "0"}} className="col-md-10 col-sm-10 col-xs-10">
                        <label className="lbl_game_option">Your Number</label>
                        {this.createNumberPanel()}
                        <div>Pick a number for players to guess (Your Bet Amount)</div>
                    </div>
                </div>

                <hr/>
                <label className="lbl_game_option">Your Max Return</label>
                <input type="text" readOnly name="potential" className="form-control input-sm" value={"£" + (this.state.game_type * 55 - this.state.bet_amount)} />
                <div>Your max return with the chosen settings</div>

                <hr/>
                <label className="lbl_game_option">Public Max Return</label>
                <input type="text" readOnly name="potential" className="form-control input-sm" value={"£" + (this.state.game_type * 55 + this.state.bet_amount) + " * 0.9"} />
                <div>The public max return with the chosen settings</div>

                <button className="btn-advanced" onClick={this.onShowButtonClicked}>Show/Hide Advanced Settings</button>
                <div id="advanced_panel" className={this.state.advanced_status}>
                    <hr/>
                    <label className="lbl_game_option">Privacy</label>
                    <div>
                        <label className={"radio-inline" + (this.state.is_private === false ? ' checked' : '')} onClick={() => { this.setState({is_private: false, room_password: ''}); }}>Public</label>
                        <label className={"radio-inline" + (this.state.is_private === true ? ' checked' : '')} onClick={() => { this.setState({is_private: true}); }}>Private</label>
                        <input type="password" id="room_password" value={this.state.room_password} onChange={this.onChangeRoomPassword} className={"form-control" + (this.state.is_private === true ? "" : " hidden")} />
                    </div>
                    <div>Set to 'Private' to require a password to Join</div>

                    <hr/>
                    <label className="lbl_game_option">END Game Type</label>
                    <div>
                        <label className={"radio-inline" + (this.state.endgame_type === false ? ' checked' : '')} onClick={() => { this.setState({endgame_type: false}); }}>Manual</label>
                        <label className={"radio-inline" + (this.state.endgame_type === true ? ' checked' : '')} onClick={() => { this.setState({endgame_type: true}); }}>Automatic</label>
                        <label className={"lbl_endgame_type" + (this.state.endgame_type === true ? "" : " hidden")}>
                        <span class="pound-symbol"><FaPoundSign />
                            <input pattern="[0-9]*" type="number" maxLength="4" id="endgame_amount" value={this.state.endgame_amount} onChange={this.onChangeEndgameAmount} className="col-md-6 form-control bet-input endgame_amount" /></span>
                        </label>
                    </div>
                    <div>Make your game END automatically when your PR reaches an amount. This will put a cap on your Winnings but at least keep them safe.</div>

                    <hr/>
                    <label style={{pointerEvents: "none", opacity: "0.6"}} className="lbl_game_option">(DISABLED) Anonymous Bet</label>
                    <div style={{pointerEvents: "none", opacity: "0.6"}}>
                        <label className={"radio-inline" + (this.state.is_anonymous === true ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: true}); }}>Yes</label>
                        <label className={"radio-inline" + (this.state.is_anonymous === false ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: false}); }}>No</label>
                    </div>
                    <div style={{pointerEvents: "none", opacity: "0.6"}}>Choose 'Yes' to place an anonymous bet. £0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your £0.10 back.</div>
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
)(Spleesh);
