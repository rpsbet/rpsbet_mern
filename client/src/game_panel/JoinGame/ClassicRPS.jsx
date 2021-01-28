import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions'
import { updateDigitToPoint2 } from '../../util/helper'
import { alertModal, confirmModalCreate, gameResultModal } from '../modal/ConfirmAlerts';
import history from '../../redux/history';

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
            this.joinGame();
        }
    }

    async joinGame() {
        const result = await this.props.join({selected_rps: this.state.selected_rps, is_anonymous: this.state.is_anonymous});
        if (result.status === 'success') {
            let text = 'Oops, You Lost!';
            
            if (result.betResult === 1) {
                text = 'Nice, You Won!';
            } else if (result.betResult === 0) {
                text = 'Draw, No Winner!';
            }

            gameResultModal(this.props.isDarkMode, text, result.betResult, 'Okay', null, () => { history.push('/'); }, ()=>{})
        } else {
            if (result.message) {
                alertModal(this.props.isDarkMode, result.message);
            }
        }
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

        confirmModalCreate(this.props.isDarkMode, 'Do you want to bet on this game now?', 'Okay', 'Cancel', async ()=>{
            if (this.props.is_private === true) {
                this.props.openGamePasswordModal();
            } else {
                this.joinGame();
            }
        })
    }

    render() {
        return (
            <div className="game-page">
                <div className="page-title">
                    <h2>Join Game - Classic RPS</h2>
                </div>
				<div className="game-contents">
                    <div className="pre-summary-panel">
                        <div className="your-bet-amount">Bet Amount : £{this.props.bet_amount}</div>
                        <div className="your-max-return">Potential Return : £{updateDigitToPoint2(this.props.bet_amount * 2 * 0.95)}</div>
                    </div>
                    <div className="game-info-panel">
                        <h3 className="game-sub-title">Select: Rock - Paper - Scissors!</h3>
                        <div id="rps-radio">
                            <span className={"rock" + (this.state.selected_rps === 1 ? " active" : "")} onClick={() => { this.setState({selected_rps: 1}); }}></span>
                            <span className={"paper" + (this.state.selected_rps === 2 ? " active" : "")} onClick={() => { this.setState({selected_rps: 2}); }}></span>
                            <span className={"scissors" + (this.state.selected_rps === 3 ? " active" : "")} onClick={() => { this.setState({selected_rps: 3}); }}></span>
                        </div>
                    </div>
                    <hr/>
                    <div className="action-panel">
                        <span></span>
                        <button id="btn_bet" onClick={this.onBtnBetClick}>Place Bet</button>
                    </div>
                </div>
            </div>
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
