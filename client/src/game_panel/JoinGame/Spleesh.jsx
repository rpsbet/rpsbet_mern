import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openAlert } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper'

class Spleesh extends Component {
    constructor(props) {
        super(props);
        this.state = {
            bet_amount: this.props.spleesh_bet_unit,
            advanced_status: '',
            is_anonymous: false,
            balance: this.props.balance
        };
        this.onShowButtonClicked = this.onShowButtonClicked.bind(this);
        this.onBtnBetClick = this.onBtnBetClick.bind(this);
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

    onShowButtonClicked(e) {
        e.preventDefault();
        // if (this.state.advanced_status === "") {
        //     this.setState({advanced_status: "hidden"});
        // } else {
        //     this.setState({advanced_status: ""});
        // }

        // console.log(this.state.advanced_status);
    }

    onBtnBetClick(e) {
        e.preventDefault();

        if (this.props.creator_id === this.props.user_id) {
            this.props.openAlert('warning', 'Warning!', `Oops! This game is yours. You can't join this game.`);
            return;
        }

        console.log(this.state);
        if (this.state.bet_amount > this.state.balance / 100.0) {
            this.props.openAlert('warning', 'Warning!', `Not enough balance!`);
            return;
        }

        if (window.confirm('Do you want to bet on this game now?')) {
            this.props.join({bet_amount: this.state.bet_amount, is_anonymous: this.state.is_anonymous});
        }
    }

    createNumberPanel() {
        let panel = [];
        for (let i = 1; i <= 10; i++) {
            panel.push( <label 
                            className={"radio-inline" + (this.state.bet_amount / this.props.spleesh_bet_unit === i ? ' checked' : '')} 
                            onClick={() => { this.setState({
                                bet_amount: i * this.props.spleesh_bet_unit,
                                endgame_amount: this.props.spleesh_bet_unit * (55 - i)
                            }); }} key={i}
                        >
                            £{i * this.props.spleesh_bet_unit}{this.props.spleesh_bet_unit === 1 ? '.0' : ''}
                        </label>);
        }
        return panel;
    }

    render() {
        let previous_guesses = '';
        let pot = 0;
        for (let i = 0; i < this.props.game_log_list.length; i++) {
            previous_guesses += (i === 0 ? '' : ', ') + this.props.game_log_list[i].bet_amount;
            pot += this.props.game_log_list[i].bet_amount;
        };

        return (
            <form onSubmit={this.onBtnBetClick}>
                <h1 className="main_title">Guess The Host's Number:</h1>

                <hr/>
                <label className="lbl_game_option">Previous Guesses</label>
                <p className="lbl_previous_guesses">{previous_guesses}&nbsp;</p>

                <hr/>
                <label className="lbl_game_option">Your Guess</label>
                {this.createNumberPanel()}

                <div className="join_summary_panel">
                    <label>Game Type: {this.props.spleesh_bet_unit === 1 ? '£1.0 - £10.0' : '£10 - £100'}</label>
                    <label>Pot: £{pot}</label>
                    <label>Bet Amount: £{this.state.bet_amount}</label>
                    <label>Potential Return: £{updateDigitToPoint2((pot + (this.state.bet_amount * 2)) * 0.9)}</label>
                </div>
                {/* <button className="btn-advanced" onClick={this.onShowButtonClicked}>Advanced Settings</button>
                <div id="advanced_panel" className={this.state.advanced_status}>
                    <hr/>
                    <label style={{pointerEvents: "none", opacity: "0.6"}} className="lbl_game_option">(DISABLED) Anonymous Bet:</label>
                    <div style={{pointerEvents: "none", opacity: "0.6"}}>
                        <label className={"radio-inline" + (this.state.is_anonymous === true ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: true}); }}>Yes</label>
                        <label className={"radio-inline" + (this.state.is_anonymous === false ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: false}); }}>No</label>
                    </div>
                    <div style={{pointerEvents: "none", opacity: "0.6"}}>Choose 'Yes' to place an anonymous bet. £0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your £0.10 back.</div>
                </div> */}
                <div className="text-center">
                    <button className="btn" id="btn_bet">PLACE BET</button>
                </div>
            </form>
        );
    }
}

const mapStateToProps = state => ({
    auth: state.auth.isAuthenticated,
    balance: state.auth.balance
});

const mapDispatchToProps = {
    openAlert
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Spleesh);
