import React, { Component } from 'react';
import { FaArrowLeft, FaArrowRight, FaPoundSign } from 'react-icons/fa';

class QuickShoot extends Component {
    constructor(props) {
        super(props);
        this.state = {
            is_other: 'hidden'
        };

        this.onLeftButtonClicked = this.onLeftButtonClicked.bind(this);
        this.onRightButtonClicked = this.onRightButtonClicked.bind(this);
        this.onLeftPositionButtonClicked = this.onLeftPositionButtonClicked.bind(this);
        this.onRightPositionButtonClicked = this.onRightPositionButtonClicked.bind(this);
    }

    onLeftPositionButtonClicked(e) {
        e.preventDefault();
        if (this.props.selected_qs_position > 0) {
            this.props.onChangeState({selected_qs_position: this.props.selected_qs_position - 1});
        }
    }

    onRightPositionButtonClicked(e) {
        e.preventDefault();
        if (this.props.selected_qs_position < this.props.qs_game_type - 1) {
            this.props.onChangeState({selected_qs_position: this.props.selected_qs_position + 1});
        }
    }

    onLeftButtonClicked(e) {
        e.preventDefault();
        if (this.props.qs_game_type > 2) {
            this.props.onChangeState({
                qs_game_type: this.props.qs_game_type - 1,
                max_return: this.props.bet_amount * (this.props.qs_game_type - 1),
                public_bet_amount: "£" + this.props.bet_amount * (this.props.qs_game_type - 2),
                selected_qs_position: 0
            });
        }
    }

    onRightButtonClicked(e) {
        e.preventDefault();
        if (this.props.qs_game_type < 5) {
            this.props.onChangeState({
                qs_game_type: this.props.qs_game_type + 1,
                max_return: this.props.bet_amount * (this.props.qs_game_type + 1),
                public_bet_amount: "£" + this.props.bet_amount * this.props.qs_game_type,
                selected_qs_position: 0
            });
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

        console.log(position_name[this.props.selected_qs_position], position_short_name[this.props.selected_qs_position]);

        return (
            <>
                {this.props.step === 1 && 
                    <>
                        <hr/>
                        <div style={{padding: "0"}}>
                            <label className="lbl_game_option">Choose a Game Type</label>
                        </div>
                        <div className="qs_image_panel">
                            <img src={`/img/gametype/quick_shoot/qs-type-${this.props.qs_game_type}.png`} alt="" />
                        </div>
                        <div className="qs_image_panel">
                            <button onClick={this.onLeftButtonClicked}><FaArrowLeft /></button>
                            <label className="qs_game_type">{this.props.qs_game_type}</label>
                            <button onClick={this.onRightButtonClicked}><FaArrowRight /></button>
                        </div>
                    </>
                }
                {this.props.step === 2 && 
                    <>
                        <hr/>
                        <label className="lbl_game_option">Choose a Bet Amount</label>
        
                        <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 1 ? ' checked' : '')} 
                            onClick={() => { 
                                this.setState({is_other: "hidden"}); 
                                this.props.onChangeState({
                                    bet_amount: 1, 
                                    public_bet_amount: "£" + (this.props.qs_game_type - 1), 
                                    max_return: this.props.qs_game_type }); 
                                }}>£1</label>
                        <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 2.5 ? ' checked' : '')} 
                            onClick={() => { 
                                this.setState({is_other: "hidden"}); 
                                this.props.onChangeState({
                                    bet_amount: 2.5, 
                                    public_bet_amount: "£" + (this.props.qs_game_type - 1) * 2.5, 
                                    max_return: this.props.qs_game_type * 2.5 }); 
                                }}>£2.50</label>
                        <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 5 ? ' checked' : '')} 
                            onClick={() => { 
                                this.setState({is_other: "hidden"}); 
                                this.props.onChangeState({
                                    bet_amount: 5, 
                                    public_bet_amount: "£" + (this.props.qs_game_type - 1) * 5,
                                    max_return: this.props.qs_game_type * 5 }); 
                                }}>£5</label>
                        <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 10 ? ' checked' : '')} 
                            onClick={() => { 
                                this.setState({is_other: "hidden"}); 
                                this.props.onChangeState({
                                    bet_amount: 10, 
                                    public_bet_amount: "£" + (this.props.qs_game_type - 1) * 10,
                                    max_return: this.props.qs_game_type * 10 }); 
                                }}>£10</label>
                        <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 25 ? ' checked' : '')} 
                            onClick={() => { 
                                this.setState({is_other: "hidden"}); 
                                this.props.onChangeState({
                                    bet_amount: 25, 
                                    public_bet_amount: "£" + (this.props.qs_game_type - 1) * 25,
                                    max_return: this.props.qs_game_type * 25 }); 
                                }}>£25</label>
                        <label className={"radio-inline" + (this.state.is_other === "" ? ' checked' : '')} onClick={() => { this.setState({is_other: ""}); }}>Other</label>
        
                        <span className={`pound-symbol ${this.state.is_other}`}>
                            <FaPoundSign />
                            <input type="text" pattern="[0-9]*" name="betamount" id="betamount" 
                                value={this.props.bet_amount} 
                                onChange={(e) => {
                                    this.props.onChangeState({
                                        bet_amount: e.target.value, 
                                        public_bet_amount: "£" + (this.props.qs_game_type - 1) * e.target.value,
                                        max_return: this.props.qs_game_type * e.target.value }); 
                                    }}
                                className="form-control col-md-6 input-sm bet-input" placeholder="Bet Amount" />
                        </span>
                        <div className="tip">The global cost to play this game</div>
                    </>
                }
                {this.props.step === 3 && 
                    <>
                        <hr/>
                        <div style={{padding: "0"}}>
                            <label className="lbl_game_option">Choose WHERE TO SAVE</label>
                        </div>
                        <div className="qs_image_panel">
                            <img src={`/img/gametype/quick_shoot/qs-create-${position_short_name[this.props.selected_qs_position]}2.png`} alt="" />
                        </div>
                        <div className="qs_image_panel">
                            <button onClick={this.onLeftPositionButtonClicked}><FaArrowLeft /></button>
                            <label className="qs_game_type">{position_name[this.props.selected_qs_position]}</label>
                            <button onClick={this.onRightPositionButtonClicked}><FaArrowRight /></button>
                        </div>
                    </>
                }
            </>
        );
    }
}

export default QuickShoot;
