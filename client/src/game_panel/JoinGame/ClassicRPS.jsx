import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions'
import { updateDigitToPoint2 } from '../../util/helper'
import { alertModal } from '../modal/ConfirmAlerts';

class ClassicRPS extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected_rps: 1,
            advanced_status: '',
            is_anonymous: false,
            balance: this.props.balance,
            isPasswordCorrect: this.props.isPasswordCorrect
        };
        this.onShowButtonClicked = this.onShowButtonClicked.bind(this);
        this.onBtnBetClick = this.onBtnBetClick.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.balance !== props.balance || current_state.isPasswordCorrect !== props.isPasswordCorrect) {
            return {
                ...current_state,
                isPasswordCorrect: props.isPasswordCorrect,
                balance: props.balance,
            };
        }
        return null;
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.isPasswordCorrect !== this.state.isPasswordCorrect && this.state.isPasswordCorrect === true) {
            this.props.join({selected_rps: this.state.selected_rps, is_anonymous: this.state.is_anonymous});
        }
    }

    onShowButtonClicked(e) {
        e.preventDefault();
        // if (this.state.advanced_status === "") {
        //     this.setState({advanced_status: "hidden"});
        // } else {
        //     this.setState({advanced_status: ""});
        // }
    }

    onBtnBetClick(e) {
        e.preventDefault();
        
        if (this.props.creator_id === this.props.user_id) {
            alertModal(this.props.isDarkMode, `Oops! This game is yours. You can't join this game.`)
            return;
        }

        if (this.props.bet_amount > this.state.balance / 100.0) {
            alertModal(this.props.isDarkMode, `Not enough balance!`)
            return;
        }

        if (window.confirm('Do you want to bet on this game now?')) {
            if (this.props.is_private === true) {
                this.props.openGamePasswordModal();
            } else {
                this.props.join({selected_rps: this.state.selected_rps, is_anonymous: this.state.is_anonymous});
            }
        }
    }

    render() {
        return (
            <form className="marginBottom" onSubmit={this.onBtnBetClick}>
                <h1 className="main_title">Choose: Rock - Paper - Scissors</h1>
                <hr/>
                <label className="lbl_game_option">Select: Rock - Paper - Scissors!</label>
                <div id="rps_radio">
                    <label className={"drinkcard-cc rock" + (this.state.selected_rps === 1 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 1}); }}></label>
                    <label className={"drinkcard-cc paper" + (this.state.selected_rps === 2 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 2}); }}></label>
                    <label className={"drinkcard-cc scissors" + (this.state.selected_rps === 3 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 3}); }}></label>
                </div>
                <div className="join_summary_panel">
                    <label>Bet Amount: £{this.props.bet_amount}</label>
                    <label>Potential Return: £{updateDigitToPoint2(this.props.bet_amount * 2 * 0.95)}</label>
                </div>
                {/* <button className="btn-advanced" onClick={this.onShowButtonClicked}>Advanced Settings</button>
                <div id="advanced_panel" className={this.state.advanced_status}>
                    <hr/>
                    <label style={{pointerEvents: "none", opacity: "0.6"}} className="lbl_game_option">(DISABLED) Anonymous Bet:</label>
                    <div style={{pointerEvents: "none", opacity: "0.6"}}>
                        <label className={"radio-inline" + (this.state.is_anonymous === true ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: true}); }}>Yes</label>
                        <label className={"radio-inline" + (this.state.is_anonymous === false ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: false}); }}>No</label>
                    </div>
                    <div style={{pointerEvents: "none", opacity: "0.6"}}>By selecting 'Yes', your bet will be anonymous. £0.10 will be deducted from your balance and added to the PR</div>
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
    isPasswordCorrect: state.snackbar.isPasswordCorrect,
    balance: state.auth.balance,
    isDarkMode: state.auth.isDarkMode,
});

const mapDispatchToProps = {
    openGamePasswordModal
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ClassicRPS);
