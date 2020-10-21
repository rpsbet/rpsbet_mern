import React, { Component } from 'react';
import { FaPoundSign } from 'react-icons/fa';

class MysteryBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            new_box_price: '',
            new_box_prize: '',
        };
        this.onChangeNewBoxPrize = this.onChangeNewBoxPrize.bind(this);
        this.onChangeNewBoxPrice = this.onChangeNewBoxPrice.bind(this);
        this.onAddBox = this.onAddBox.bind(this);
        this.onRemoveBox = this.onRemoveBox.bind(this);
        this.onEmptyBoxes = this.onEmptyBoxes.bind(this);
    }

    onChangeNewBoxPrize(e) {
        this.setState({new_box_prize: e.target.value});
    }

    onChangeNewBoxPrice(e) {
        this.setState({new_box_price: e.target.value});
    }

    calcMaxReturn = (box_list) => {
        let max_return = 0;
        let max_prize = 0;
        let lowest_box_price = -1;
        let highest_box_price = 0;

        box_list.map((row) => {
            if (lowest_box_price === -1 || lowest_box_price > row.box_price) {
                lowest_box_price = row.box_price;
            }

            if (highest_box_price < row.box_price) {
                highest_box_price = row.box_price;
            }

            if (row.box_prize >= row.box_price) {
                max_return += row.box_prize;
            } else {
                max_return += row.box_price;
            }

            if (max_prize < row.box_prize) {
                max_prize = row.box_prize;
            }

            return true;
        }, this);

        return { max_return, max_prize, lowest_box_price, highest_box_price };
    }

    onAddBox(e) {
        e.preventDefault();

        let new_box_price = parseFloat(this.state.new_box_price);
        let new_box_prize = parseFloat(this.state.new_box_prize);
        new_box_price = isNaN(new_box_price) ? 0 : new_box_price;
        new_box_prize = isNaN(new_box_prize) ? 0 : new_box_prize;

        const box_list = this.props.box_list.concat({box_price: new_box_price, box_prize: new_box_prize});
        const bet_amount = box_list.reduce((totalAmount, box) => totalAmount + box.box_prize, 0);
        const max_return = this.calcMaxReturn(box_list);

        this.setState({
            new_box_price: '',
            new_box_prize: ''
        });

        this.props.onChangeState({
            box_list: box_list,
            bet_amount: bet_amount,
            max_return: max_return['max_return'] + " * 0.95",
            max_prize: max_return['max_prize'],
            endgame_amount: max_return['max_return'],
            lowest_box_price: max_return['lowest_box_price'],
            public_bet_amount: (max_return['lowest_box_price'] === max_return['highest_box_price'] ? `£${max_return['lowest_box_price']}` : `£${max_return['lowest_box_price']} - £${max_return['highest_box_price']}`)
        });
    }

    onRemoveBox(e) {
        e.preventDefault();
        let box_list = this.props.box_list;
        box_list.splice(e.target.getAttribute('index'), 1);
        const bet_amount = box_list.reduce((totalAmount, box) => totalAmount + box.box_prize, 0);
        const max_return = this.calcMaxReturn(box_list);

        this.props.onChangeState({
            box_list: box_list,
            bet_amount: bet_amount,
            max_return: max_return['max_return'] + " * 0.95",
            max_prize: max_return['max_prize'],
            endgame_amount: max_return['max_return'],
            lowest_box_price: max_return['lowest_box_price'],
            public_bet_amount: (max_return['lowest_box_price'] === max_return['highest_box_price'] ? `£${max_return['lowest_box_price']}` : `£${max_return['lowest_box_price']} - £${max_return['highest_box_price']}`)
        });
    }

    onEmptyBoxes(e) {
        e.preventDefault();
        this.props.onChangeState({box_list: [], bet_amount: 0, max_return: 0, max_prize: 0, endgame_amount: 0});
    }

    render() {
        return (
            <form>
                <hr/>
                <label className="lbl_game_option">Create a box</label>
                <div className="boxes_panel">
                    {this.props.box_list.map((row, key) => (
                        <div className={"box " + (row === 0 ? "empty_box" : "priced_box")} key={key}>
                            <img src="/img/close.png" title="Delete Box?" className="btn_box_close" onClick={this.onRemoveBox} index={key} alt="" />
                            {row === 0 ? '' : '£' + row.box_prize} / {row === 0 ? '' : '£' + row.box_price}
                        </div>
                    ), this)}
                </div>
                <div className="empty_button_panel">
                    <div style={{textDecoration: "underline"}} className="btn_empty_boxes" onClick={this.onEmptyBoxes} title="Empty all of the boxes?">
                        RESET
                    </div>
                </div>
                <div className="creat-a-box">
                <span className="pound-symbol"><FaPoundSign />
                    <input pattern="[0-9]*" type="text" className="form-control bet-input new_box_prize" maxLength="5" id="new_box_prize" name="new_box_prize" value={this.state.new_box_prize} onChange={this.onChangeNewBoxPrize} placeholder="Box Prize" /></span>
                    <span className="pound-symbol"><FaPoundSign />
                    <input pattern="[0-9]*" type="text" className="form-control bet-input new_box_prize" maxLength="5" id="new_box_price" name="new_box_price" value={this.state.new_box_price} onChange={this.onChangeNewBoxPrice} placeholder="Box Price" /></span>
                    <button className="btn btn_add_box" onClick={this.onAddBox}>ADD BOX</button>
                    <div className="tip">Boxes will be displayed to the public in the order you have added them</div>
                </div>
{/* 
                <hr/>
                <label className="lbl_game_option">Total Bet Amount</label>
                <input type="text" value={"£" + this.props.bet_amount} className="form-control input-sm bet-input" placeholder="Bet Amount" readOnly />
                <div className="tip">Your total cost to create this game (Game Cost = Sum of all Prizes)</div>

                <hr/>
                <label className="lbl_game_option">Your Max Return</label>
                <input type="text" readOnly className="form-control input-sm" value={"£" + this.props.max_return} />
                <div>Your max return with the chosen settings</div>

                <hr/>
                <label className="lbl_game_option">Public Max Return</label>
                <input type="text" readOnly className="form-control input-sm" value={"£" + this.props.max_prize + " * 0.95"} />
                <div className="tip">The public max return with the chosen settings</div> */}
            </form>
        );
    }
}

export default MysteryBox;
