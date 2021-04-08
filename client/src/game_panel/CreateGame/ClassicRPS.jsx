import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';

class ClassicRPS extends Component {
    constructor(props) {
        super(props);
        this.state = {
            is_other: (this.props.bet_amount === 1 || this.props.bet_amount === 2.5 || this.props.bet_amount === 5 || this.props.bet_amount === 10 || this.props.bet_amount === 25) ? false : true
        };
    }

    render() {
        return (this.props.step === 1 ? 
            <DefaultBetAmountPanel bet_amount={this.props.bet_amount} onChangeState={this.props.onChangeState} game_type="RPS" />
            :
            <div className="game-info-panel">
                <h3 className="game-sub-title">Select: Rock - Paper - Scissors!</h3>
                <div id="rps-radio">
                    <span className={"rock" + (this.props.selected_rps === 1 ? " active" : "")} onClick={() => { this.props.onChangeState({selected_rps: 1}); }}></span>
                    <span className={"paper" + (this.props.selected_rps === 2 ? " active" : "")} onClick={() => { this.props.onChangeState({selected_rps: 2}); }}></span>
                    <span className={"scissors" + (this.props.selected_rps === 3 ? " active" : "")} onClick={() => { this.props.onChangeState({selected_rps: 3}); }}></span>
                </div>
            </div>
        );
    }
}

export default ClassicRPS;
