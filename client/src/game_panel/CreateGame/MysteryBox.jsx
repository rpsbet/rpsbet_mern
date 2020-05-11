import React, { Component } from 'react';
import { connect } from 'react-redux';

class MysteryBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            box_list: [],
            new_box_price: '',
            new_box_prize: '',
            bet_amount: 0,
            lowest_box_price: 0,
            advanced_status: '',
            is_private: false,
            is_anonymous: false,
            endgame_type: true,
            endgame_amount: 0,
            room_password: '',

            balance: this.props.balance,

            your_max_return: 0,
            public_max_return: 0
        };
        this.onShowButtonClicked = this.onShowButtonClicked.bind(this);
        this.onChangeNewBoxPrize = this.onChangeNewBoxPrize.bind(this);
        this.onChangeNewBoxPrice = this.onChangeNewBoxPrice.bind(this);
        this.onAddBox = this.onAddBox.bind(this);
        this.onRemoveBox = this.onRemoveBox.bind(this);
        this.onEmptyBoxes = this.onEmptyBoxes.bind(this);
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

    onChangeNewBoxPrize(e) {
        this.setState({new_box_prize: e.target.value});
    }

    onChangeNewBoxPrice(e) {
        this.setState({new_box_price: e.target.value});
    }

    onChangeEndgameAmount(e) {
        this.setState({endgame_amount: e.target.value});
    }

    calcMaxReturn = (box_list) => {
        let your_max_return = 0;
        let public_max_return = 0;
        let lowest_box_price = -1;

        box_list.map((row) => {
            if (lowest_box_price === -1 || lowest_box_price > row.box_price) {
                lowest_box_price = row.box_price;
            }

            if (row.box_prize >= row.box_price) {
                your_max_return += row.box_prize;
            } else {
                your_max_return += row.box_price;
            }

            if (public_max_return < row.box_prize) {
                public_max_return = row.box_prize;
            }

            return true;
        }, this);

        return { your_max_return, public_max_return, lowest_box_price };
    }

    onAddBox(e) {
        e.preventDefault();

        let new_box_price = parseFloat(this.state.new_box_price);
        let new_box_prize = parseFloat(this.state.new_box_prize);
        new_box_price = isNaN(new_box_price) ? 0 : new_box_price;
        new_box_prize = isNaN(new_box_prize) ? 0 : new_box_prize;

        const box_list = this.state.box_list.concat({box_price: new_box_price, box_prize: new_box_prize});
        const bet_amount = box_list.reduce((totalAmount, box) => totalAmount + box.box_prize, 0);
        const max_return = this.calcMaxReturn(box_list);

        this.setState({
            box_list: box_list,
            new_box_price: '',
            new_box_prize: '',
            bet_amount: bet_amount,
            your_max_return: max_return['your_max_return'],
            public_max_return: max_return['public_max_return'],
            endgame_amount: max_return['your_max_return'],
            lowest_box_price: max_return['lowest_box_price']
        });
    }

    onRemoveBox(e) {
        e.preventDefault();
        let box_list = this.state.box_list;
        box_list.splice(e.target.getAttribute('index'), 1);
        const bet_amount = box_list.reduce((totalAmount, box) => totalAmount + box.box_prize, 0);
        const max_return = this.calcMaxReturn(box_list);

        this.setState({
            box_list: box_list,
            bet_amount: bet_amount,
            your_max_return: max_return['your_max_return'],
            public_max_return: max_return['public_max_return'],
            endgame_amount: max_return['your_max_return'],
            lowest_box_price: max_return['lowest_box_price']
        });
    }

    onEmptyBoxes(e) {
        e.preventDefault();
        this.setState({box_list: [], bet_amount: 0, your_max_return: 0, public_max_return: 0, endgame_amount: 0});
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
            alert("Your amount is 0. Please add the box!");
            return;
        }

        if (this.state.bet_amount > this.state.balance / 100.0) {
            alert("Not enough balance!");
            return;
        }

        if (this.state.is_private === true && this.state.room_password === "") {
            alert("You have selected the private mode. Please input the password!");
            return;
        }

        if (window.confirm('Do you want to create new game now?')) {
            this.props.createRoom({
                game_type: 4,
                box_list: this.state.box_list,
                bet_amount: this.state.bet_amount,
                box_price: this.state.box_price,
                max_prize: this.state.public_max_return,
                lowest_box_price: this.state.lowest_box_price,
                is_private: this.state.is_private,
                is_anonymous: this.state.is_anonymous,
                room_password: this.state.room_password,
                end_game_type: this.state.endgame_type,
                end_game_amount: this.state.endgame_amount,
            });
        }
    }

    render() {
        return (
            <form onSubmit={this.onCreateGame}>
                <hr/>
                <label className="lbl_game_option">Create a box</label>
                <div className="boxes_panel">
                    {this.state.box_list.map((row, key) => (
                        <div className={"box " + (row === 0 ? "empty_box" : "priced_box")} key={key}>
                            <img src="/img/close.png" title="Delete Box?" className="btn_box_close" onClick={this.onRemoveBox} index={key} alt="" />
                            {row === 0 ? '' : '£' + row.box_prize} / {row === 0 ? '' : '£' + row.box_price}
                        </div>
                    ), this)}
                </div>
                <div className="empty_button_panel">
                    <div className="btn_empty_boxes" onClick={this.onEmptyBoxes} title="Empty all of the boxes?">
                        <span>&nbsp;</span>
                        EMPTY
                    </div>
                </div>
                <div>
                    <input type="text" className="form-control bet-input new_box_prize" maxLength="6" id="new_box_prize" name="new_box_prize" value={this.state.new_box_prize} onChange={this.onChangeNewBoxPrize} placeholder="Box Prize" />
                    <input type="text" className="form-control bet-input new_box_prize" maxLength="6" id="new_box_price" name="new_box_price" value={this.state.new_box_price} onChange={this.onChangeNewBoxPrice} placeholder="Box Price" />
                    <button className="btn btn_add_box" onClick={this.onAddBox}>ADD BOX</button>
                </div>

                <hr/>
                <label className="lbl_game_option">Total Bet Amount</label>
                <input type="text" value={"£" + this.state.bet_amount} className="form-control input-sm bet-input" placeholder="Bet Amount" readOnly />
                <div>Your total bet amount you'll pay to start this game. (Game Cost = Sum of all Mystery Boxes)</div>

                <hr/>
                <label className="lbl_game_option">Your Max Return</label>
                <input type="text" readOnly className="form-control input-sm" value={"£" + this.state.your_max_return + " * 0.95"} />
                <div>This will be the most you can make with your chosen game settings. (Winnings)</div>

                <hr/>
                <label className="lbl_game_option">Public Max Return</label>
                <input type="text" readOnly className="form-control input-sm" value={"£" + this.state.public_max_return + " * 0.95"} />
                <div>This will be the most your opponent(s) can make with your chosen game settings. (Winnings)</div>

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
                    <label className="lbl_game_option">END Game Type:</label>
                    <div>
                        <label className={"radio-inline" + (this.state.endgame_type === false ? ' checked' : '')} onClick={() => { this.setState({endgame_type: false}); }}>Manual</label>
                        <label className={"radio-inline" + (this.state.endgame_type === true ? ' checked' : '')} onClick={() => { this.setState({endgame_type: true}); }}>Automatic</label>
                        <label className={"lbl_endgame_type" + (this.state.endgame_type === true ? "" : " hidden")}>
                            Amount: £<input type="text" id="endgame_amount" value={this.state.endgame_amount} onChange={this.onChangeEndgameAmount} className="col-md-6 form-control bet-input endgame_amount" />
                        </label>
                    </div>
                    <div>Make your game END automatically when the PR reaches a set amount. This will put a cap on your Winnings but at least keep them safe.</div>

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
    balance: state.auth.balance,
});

const mapDispatchToProps = {
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MysteryBox);
