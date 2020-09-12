import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { openAlert } from '../../redux/Notification/notification.actions'

class MysteryBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            bet_amount: 0,
            selected_id: '',
            box_list: this.props.box_list,
            advanced_status: '',
            is_anonymous: false,
            balance: this.props.balance,
            betResult: this.props.betResult,
        };
        this.onShowButtonClicked = this.onShowButtonClicked.bind(this);
        this.onBoxClicked = this.onBoxClicked.bind(this);
        this.onBtnBetClick = this.onBtnBetClick.bind(this);
        this.onBtnGoToMainGamesClicked = this.onBtnGoToMainGamesClicked.bind(this);
        this.onBtnPlayAgainClicked = this.onBtnPlayAgainClicked.bind(this);
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.box_list.length !== props.box_list.length) {
            return {
                ...current_state,
                box_list: props.box_list
            };
        }

        if (current_state.betResult !== props.betResult) {
            return {
                ...current_state,
                betResult: props.betResult
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
    }

    onBoxClicked(e) {
        e.preventDefault();

        if (e.target.getAttribute('status') === 'opened') {
            return;
        }

        const _id = e.target.getAttribute('_id');
        const box_price = e.target.getAttribute('box_price');
        this.setState({selected_id: _id, bet_amount: box_price});
    }

    onBtnBetClick(e) {
        e.preventDefault();

        if (this.props.creator_id === this.props.user_id) {
            this.props.openAlert('warning', 'Warning!', `Oops! This game is yours. You can't join this game.`);
            return;
        }

        if (this.state.selected_id === '') {
            this.props.openAlert('warning', 'Warning!', `Please select a box!`);
            return;
        }

        if (this.state.bet_amount > this.state.balance / 100.0) {
            this.props.openAlert('warning', 'Warning!', `Not enough balance!`);
            return;
        }

        if (window.confirm('Do you want to bet on this game now?')) {
            this.props.join({bet_amount: this.state.bet_amount, selected_id: this.state.selected_id, is_anonymous: this.state.is_anonymous});

            this.setState({
                box_list: this.state.box_list.map(el => (el._id === this.state.selected_id ? {...el, status: 'opened'} : el))
            });
        }
    }

    onBtnGoToMainGamesClicked(e) {
        e.preventDefault();
        history.push('/join');
    }

    getBetForm = () => {
        let prizes = [];
        this.state.box_list.map((row) => {
            prizes.push({
                price: row.box_prize,
                status: row.status
            });
            return true;
        });
        prizes.sort((a, b) => a.price - b.price);

        return (
            <form onSubmit={this.onBtnBetClick}>
                <h1 className="main_title">Buy a Mystery Box?</h1>

                <hr/>
                <label className="lbl_game_option">Prizes:</label>
                <table className="mystery_table">
                    <tbody><tr>
                        {prizes.map((item, key) => (
                            <td className={item.status} key={key}>
                                {item.status === 'opened' ? <img src="/img/cross-24-512.png" alt="" /> : ""}
                                £{item.price}
                            </td>
                        ))}
                    </tr></tbody>
                </table>
                <hr/>
                <label className="lbl_game_option">Select a Box</label>
                <div className="select_box_panel">
                    {this.state.box_list.map((row, key) => (
                        <div 
                            className={"box box_" + row.status + (row._id === this.state.selected_id ? " selected": "")} 
                            status={row.status} 
                            _id={row._id} 
                            box_price={row.box_price} 
                            index={key} 
                            key={key} 
                            onClick={this.onBoxClicked}
                        >
                            £{row.box_price}
                        </div>
                    ))}
                </div>
                <div>Each box will open one of the Prizes above.</div>

                <button className="btn-advanced" onClick={this.onShowButtonClicked}>Advanced Settings</button>
                <div id="advanced_panel" className={this.state.advanced_status}>
                    <hr/>
                    <label style={{pointerEvents: "none", opacity: "0.6"}} className="lbl_game_option">(DISABLED) Anonymous Bet:</label>
                    <div style={{pointerEvents: "none", opacity: "0.6"}}>
                        <label className={"radio-inline" + (this.state.is_anonymous === true ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: true}); }}>Yes</label>
                        <label className={"radio-inline" + (this.state.is_anonymous === false ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: false}); }}>No</label>
                    </div>
                    <div style={{pointerEvents: "none", opacity: "0.6"}}>Choose 'Yes' to place an anonymous bet. £0.10 will be deducted from your balance and added to the PR. Please note, if you end your game, you will not receive your £0.10 back.</div>
                </div>
                <div className="text-center">
                    <button className="btn" id="btn_bet">PLACE BET</button>
                </div>
            </form>
        )
    }

    onBtnPlayAgainClicked(e) {
        // history.push('/join/' + this.props.room_id);
        window.location.reload();
    }

    getBetResultForm = () => {
        let prizes = [];
        this.state.box_list.map((row) => {
            prizes.push({
                price: row.box_prize,
                status: row.status
            });
            return true;
        });
        prizes.sort((a, b) => a.price - b.price);

        return (
            <>
                <div className="mystery_result_title">Prize</div>
                <div className="mystery_result_message" dangerouslySetInnerHTML={{__html: this.state.betResult === 0 ? "Sorry :/<br />This box is EMPTY! :(" : "Nice!!<br />You won a PRIZE!:"}}></div>
                <div className="mystery_result_amount">£{this.state.betResult}</div>
                <div className="mystery_result_prizes_title">Prizes:</div>
                <table className="mystery_table">
                    <tbody><tr>
                        {prizes.map((item, key) => (
                            <td className={item.status} key={key}>
                                {item.status === 'opened' ? <img src="/img/cross-24-512.png" alt="" /> : ""}
                                £{item.price}
                            </td>
                        ))}
                    </tr></tbody>
                </table>
                <div className="text-center">
                    <button className="btn" id="btn_bet" onClick={this.onBtnGoToMainGamesClicked}>GO TO MAIN GAMES</button>
                </div>
                <div className="text-center mt-4">
                    {this.props.roomStatus !== 'finished' && <button className="btn" id="btn_play_again" onClick={this.onBtnPlayAgainClicked}>PLAY AGAIN</button>}
                </div>
            </>
        );
    }

    render() {
        const betResult = this.state.betResult;
        return (
            betResult === -1 ? this.getBetForm() : this.getBetResultForm()
        );
    }
}

const mapStateToProps = state => ({
    auth: state.auth.isAuthenticated,
    balance: state.auth.balance,
    betResult: state.logic.betResult,
    roomStatus: state.logic.roomStatus,
    // room_id: state.logic.curRoomInfo._id,
});

const mapDispatchToProps = {
    openAlert
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MysteryBox);
