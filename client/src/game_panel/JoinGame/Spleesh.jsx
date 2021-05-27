import React, { Component } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { updateDigitToPoint2 } from '../../util/helper'
import { alertModal, confirmModalCreate, gameResultModal } from '../modal/ConfirmAlerts';
import history from '../../redux/history';

class Spleesh extends Component {
    constructor(props) {
        super(props);
        this.state = {
            bet_amount: this.props.spleesh_bet_unit,
            advanced_status: '',
            is_anonymous: false,
            balance: this.props.balance,
            isPasswordCorrect: false
        };
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.isPasswordCorrect !== props.isPasswordCorrect || current_state.balance !== props.balance) {
            return {
                ...current_state,
                balance: props.balance,
                isPasswordCorrect: props.isPasswordCorrect
            }
        }

        return null;
    }

    onShowButtonClicked = (e) => {
        e.preventDefault();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.isPasswordCorrect !== this.state.isPasswordCorrect && this.state.isPasswordCorrect === true) {
            this.props.join({bet_amount: this.state.bet_amount, is_anonymous: this.state.is_anonymous});
        }
    }

    joinGame = async () => {
        const result = await this.props.join({bet_amount: this.state.bet_amount, is_anonymous: this.state.is_anonymous});
        if (result.status === 'success') {
            let text = 'Oops, You Lost!';
            
            if (result.betResult === 1) {
                text = 'Nice, You Won!';
            } else if (result.betResult === 0) {
                text = 'Draw, No Winner!';
            }

            if (result.roomStatus === 'finished') {
                gameResultModal(this.props.isDarkMode, text, result.betResult, 'Okay', null, () => { history.push('/'); }, ()=>{})
            } else {
                gameResultModal(this.props.isDarkMode, text, result.betResult, 'Try again', 'Close', () => { history.go(0); }, ()=>{ history.push('/'); })
            }
        } else {
            if (result.message) {
                alertModal(this.props.isDarkMode, result.message);
            }
        }
    }

    onBtnBetClick = (e) => {
        e.preventDefault();

        if (this.props.creator_id === this.props.user_id) {
            alertModal(this.props.isDarkMode, `Oops! This game is yours. What's the point?!`)
            return;
        }

        if (this.state.bet_amount > this.state.balance / 100.0) {
            alertModal(this.props.isDarkMode, `Not enough balance!`)
            return;
        }

        confirmModalCreate(this.props.isDarkMode, 'Are you sure you want to place this bet?', 'Yes', 'Cancel', async ()=>{
            if (this.props.is_private === true) {
                this.props.openGamePasswordModal();
            } else {
                this.joinGame();
            }
        })
    }

    createNumberPanel = () => {
		let panel = [];
		for (let i = 1; i <= 10; i++) {
			panel.push( <button
					className={(this.state.bet_amount / this.props.spleesh_bet_unit === i ? ' active' : '')}
					onClick={() => { this.setState({
						bet_amount: i * this.props.spleesh_bet_unit,
						endgame_amount: this.props.spleesh_bet_unit * (55 - i),
					}); }} key={i}
				>
					£{updateDigitToPoint2(i * this.props.spleesh_bet_unit)}
				</button>);
		}
		return panel;
	}

    render() {
        let previous_guesses = '';
        let pot = 0;
        for (let i = 0; i < this.props.game_log_list.length; i++) {
            previous_guesses += (i === 0 ? '' : ', ') + '£' + this.props.game_log_list[i].bet_amount;
            pot += this.props.game_log_list[i].bet_amount;
        };

        return (
            <div className="game-page">
                <div className="page-title">
                    <h2>Join Game - <i>Spleesh!</i></h2>
                </div>
				<div className="game-contents">
                    <div className="pre-summary-panel">
                        <div className="your-bet-amount">Bet Amount : £{this.state.bet_amount}</div>
                        <div className="your-max-return">Potential Return : £{updateDigitToPoint2((pot + (this.state.bet_amount * 2)) * 0.9)}</div>
                    </div>
                    <div className="game-info-panel">
                        <h3 className="game-sub-title">Previous Guesses</h3>
                        <p className="previous-guesses">{previous_guesses === '' ? `There are no guesses in this game yet. Be the first to guess the Host's number?` : previous_guesses}</p>
                        <h3 className="game-sub-title">Your Number</h3>
                        <div id="select-buttons-panel">
                            {this.createNumberPanel()}
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
    isDarkMode: state.auth.isDarkMode,
    balance: state.auth.balance
});

const mapDispatchToProps = {
    openGamePasswordModal
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Spleesh);
