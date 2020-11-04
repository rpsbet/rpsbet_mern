import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openAlert } from '../../redux/Notification/notification.actions'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { updateDigitToPoint2 } from '../../util/helper'

class QuickShoot extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected_qs_position: 0,
            advanced_status: '',
            is_anonymous: false,
            balance: this.props.balance
        };
        this.onShowButtonClicked = this.onShowButtonClicked.bind(this);
        this.onBtnBetClick = this.onBtnBetClick.bind(this);
        this.onLeftPositionButtonClicked = this.onLeftPositionButtonClicked.bind(this);
        this.onRightPositionButtonClicked = this.onRightPositionButtonClicked.bind(this);
    }

    onLeftPositionButtonClicked(e) {
        e.preventDefault();
        if (this.state.selected_qs_position > 0) {
            this.setState({selected_qs_position: this.state.selected_qs_position - 1});
        }
    }

    onRightPositionButtonClicked(e) {
        e.preventDefault();
        if (this.state.selected_qs_position < this.props.qs_game_type - 1) {
            this.setState({selected_qs_position: this.state.selected_qs_position + 1});
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
            this.props.openAlert('warning', 'Warning!', `Oops! This game is yours. You can't join this game.`);
            return;
        }

        if (this.state.bet_amount > this.state.balance / 100.0) {
            this.props.openAlert('warning', 'Warning!', `Not enough balance!`);
            return;
        }

        if (window.confirm('Do you want to bet on this game now?')) {
            this.props.join({selected_qs_position: this.state.selected_qs_position, is_anonymous: this.state.is_anonymous});
        }
    }

    render() {
        let position_name = ["Center", "Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"];
        let position_short_name = ["center", "tl", "tr", "bl", "br"];

        if (this.props.qs_game_type === 2) {
            position_name = ["Left", "Right"];
            position_short_name = ["bl", "br"];
        } else if (this.props.qs_game_type === 3) {
            position_name = ["Bottom-Left", "Center", "Bottom-Right"];
            position_short_name = ["bl", "center", "br"];
        } else if (this.props.qs_game_type === 4) {
            position_name = ["Top-Left", "Top-Right", "Bottom-Left", "Bottom-Right"];
            position_short_name = ["tl", "tr", "bl", "br"];
        }

        const host_bet = this.props.bet_amount / (this.props.qs_game_type - 1);

        return (
            <form onSubmit={this.onBtnBetClick}>
                <h1 className="main_title">Quick Shoot</h1>
                <hr/>
                <div style={{padding: "0"}}>
                    <label className="lbl_game_option">Choose WHERE TO SHOOT</label>
                </div>
                <div className="qs_image_panel">
                    <img src={`/img/gametype/quick_shoot/qs-join-${position_short_name[this.state.selected_qs_position]}.png`} alt="" />
                </div>
                <div className="qs_image_panel">
                    <button onClick={this.onLeftPositionButtonClicked}><FaArrowLeft /></button>
                    <label className="qs_game_type">{position_name[this.state.selected_qs_position]}</label>
                    <button onClick={this.onRightPositionButtonClicked}><FaArrowRight /></button>
                </div>
                <div className="join_summary_panel">
                    <label>Game Type: {this.props.qs_game_type}</label>
                    <label></label>
                    <label>Bet Amount: £{updateDigitToPoint2(this.props.bet_amount)}</label>
                    <label>Potential Return: £{updateDigitToPoint2(host_bet * this.props.qs_game_type * 0.95)}</label>
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
  balance: state.auth.balance
});

const mapDispatchToProps = {
    openAlert
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(QuickShoot);
