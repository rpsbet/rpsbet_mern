import React, { Component } from 'react';
import { alertModal } from '../modal/ConfirmAlerts';

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

        if (new_box_price < 0) {
            alertModal(this.props.isDarkMode, `You can't make a box with negative price!`)
            return;
        }

        if (new_box_prize < 0) {
            alertModal(this.props.isDarkMode, `You can't make a box with negative prize!`)
            return;
        }

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
            <div className="game-info-panel">
                <h3 className="game-sub-title">Create a box</h3>
                <div className="boxes-panel">
                    {this.props.box_list.map((row, key) => (
                        <div className="box" key={key}>
                            <i title="Delete Box?" onClick={this.onRemoveBox} index={key} >-</i>
                            <span>{'£' + row.box_prize} / {'£' + row.box_price}</span>
                        </div>
                    ), this)}
                </div>
                <div className="create-box-panel">
                    <div className="amounts-panel">
                        <div className="edit-amount-panel">
                            <span>£</span>
                            <input type="text" pattern="[0-9]*" name="new_box_prize" id="new_box_prize"  maxLength="5"
                                value={this.state.new_box_prize} 
                                onChange={this.onChangeNewBoxPrize}
                                placeholder="Box Prize" />
                        </div>
                        <div className="edit-amount-panel">
                            <span>£</span>
                            <input type="text" pattern="[0-9]*" name="new_box_price" id="new_box_price"  maxLength="5"
                                value={this.state.new_box_price} 
                                onChange={this.onChangeNewBoxPrice}
                                placeholder="Box Price" />
                        </div>
                    </div>
                    <button className="other" onClick={this.onAddBox}>Add another box</button>
                    <a href="/#" className="btn-empty-boxes" onClick={this.onEmptyBoxes} title="Empty all of the boxes?">Reset</a>
                </div>
                <p className="tip">Boxes will be displayed to the public in the order you have added them</p>
            </div>
        );
    }
}

export default MysteryBox;
