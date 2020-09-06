import React, { Component } from 'react';
import { FaPoundSign } from 'react-icons/fa';

class ClassicRPS extends Component {
    render() {
        return (
            <form>
                <hr/>
                <label className="lbl_game_option">Bet Amount</label>
                <span className="pound-symbol">
                    <FaPoundSign />
                    <input type="text" pattern="[0-9]*" name="betamount" id="betamount" 
                        value={this.props.bet_amount} 
                        onChange={(e) => {this.props.onChangeState({bet_amount: e.target.value, max_return: (e.target.value * 2) + " * 0.95"})}} 
                        className="form-control col-md-6 input-sm bet-input" placeholder="Bet Amount" />
                </span>
                <div>The global cost to play this game</div>
                <hr/>
                <label className="lbl_game_option">Select: Rock - Paper - Scissors!</label>
                <div id="rps_radio">
                    <label className={"drinkcard-cc rock" + (this.props.selected_rps === 1 ? " checked" : "")} onClick={() => { this.props.onChangeState({selected_rps: 1}); }}></label>
                    <label className={"drinkcard-cc paper" + (this.props.selected_rps === 2 ? " checked" : "")} onClick={() => { this.props.onChangeState({selected_rps: 2}); }}></label>
                    <label className={"drinkcard-cc scissors" + (this.props.selected_rps === 3 ? " checked" : "")} onClick={() => { this.props.onChangeState({selected_rps: 3}); }}></label>
                </div>
                <hr/>
                <label className="lbl_game_option">Max Return</label>
                <input type="text" readOnly name="potential" id="potential" className="form-control input-sm" value={this.props.bet_amount === 0 ? "" : "£" + (this.props.bet_amount * 2) + " * 0.95"} />
                <div>The global max return with the chosen settings</div>
            </form>
        );
    }
}

export default ClassicRPS;
