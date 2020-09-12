import React, { Component } from 'react';
import { FaPoundSign } from 'react-icons/fa';

class ClassicRPS extends Component {
    constructor(props) {
        super(props);
        this.state = {
            is_other: (this.props.bet_amount === 1 || this.props.bet_amount === 2.5 || this.props.bet_amount === 5 || this.props.bet_amount === 10 || this.props.bet_amount === 25) ? 'hidden' : ''
        };
    }

    render() {
        return (this.props.step === 1 ? 
            <>
                <hr/>
                <label className="lbl_game_option">Bet Amount</label>

                <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 1 ? ' checked' : '')} onClick={() => { this.setState({is_other: "hidden"}); this.props.onChangeState({bet_amount: 1, max_return: '2 * 0.95'}); }}>£1</label>
                <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 2.5 ? ' checked' : '')} onClick={() => { this.setState({is_other: "hidden"}); this.props.onChangeState({bet_amount: 2.5, max_return: '5 * 0.95'}); }}>£2.5</label>
                <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 5 ? ' checked' : '')} onClick={() => { this.setState({is_other: "hidden"}); this.props.onChangeState({bet_amount: 5, max_return: '10 * 0.95'}); }}>£5</label>
                <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 10 ? ' checked' : '')} onClick={() => { this.setState({is_other: "hidden"}); this.props.onChangeState({bet_amount: 10, max_return: '20 * 0.95'}); }}>£10</label>
                <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 25 ? ' checked' : '')} onClick={() => { this.setState({is_other: "hidden"}); this.props.onChangeState({bet_amount: 25, max_return: '50 * 0.95'}); }}>£25</label>
                <label className={"radio-inline" + (this.state.is_other === "" ? ' checked' : '')} onClick={() => { this.setState({is_other: ""}); }}>Other</label>

                <span className={`pound-symbol ${this.state.is_other}`}>
                    <FaPoundSign />
                    <input type="text" pattern="[0-9]*" name="betamount" id="betamount" 
                        value={this.props.bet_amount} 
                        onChange={(e) => {this.props.onChangeState({bet_amount: e.target.value, max_return: (e.target.value * 2) + " * 0.95"})}} 
                        className="form-control col-md-6 input-sm bet-input" placeholder="Bet Amount" />
                </span>
                <div>The global cost to play this game</div>
            </>
            :
            <>
                <hr/>
                <label className="lbl_game_option">Select: Rock - Paper - Scissors!</label>
                <div id="rps_radio">
                    <label className={"drinkcard-cc rock" + (this.props.selected_rps === 1 ? " checked" : "")} onClick={() => { this.props.onChangeState({selected_rps: 1}); }}></label>
                    <label className={"drinkcard-cc paper" + (this.props.selected_rps === 2 ? " checked" : "")} onClick={() => { this.props.onChangeState({selected_rps: 2}); }}></label>
                    <label className={"drinkcard-cc scissors" + (this.props.selected_rps === 3 ? " checked" : "")} onClick={() => { this.props.onChangeState({selected_rps: 3}); }}></label>
                </div>
            </>
        );
    }
}

export default ClassicRPS;
