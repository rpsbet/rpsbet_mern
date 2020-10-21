import React, { Component } from 'react';

class Spleesh extends Component {
    createNumberPanel() {
        let panel = [];
        for (let i = 1; i <= 10; i++) {
            panel.push( <label 
                            className={"radio-inline" + (this.props.bet_amount / this.props.spleesh_bet_unit === i ? ' checked' : '')} 
                            onClick={() => { this.props.onChangeState({
                                bet_amount: i * this.props.spleesh_bet_unit,
                                endgame_amount: this.props.spleesh_bet_unit * (55 - i),
                                max_return: this.props.spleesh_bet_unit * (55 - i)
                            }); }} key={i}
                        >
                            £{i * this.props.spleesh_bet_unit}
                        </label>);
            if (i % 4 === 0) {
                panel.push(<br key={'br_' + i}/>);
            }
        }
        return panel;
    }

    render() {
        return (
            <form onSubmit={this.onCreateGame}>
                <hr/>
                <div className="row">
                    {this.props.step === 1 && 
                        <div style={{padding: "0"}} className="col-md-6 col-sm-10 col-xs-10">
                            <label className="lbl_game_option">Game Type</label>
                            <label 
                                className={"radio-inline" + (this.props.spleesh_bet_unit === 1 ? ' checked' : '')} 
                                onClick={() => { 
                                    this.props.onChangeState({spleesh_bet_unit: 1, bet_amount: 1, max_return: 54, endgame_amount: 54}); 
                                }}
                            >
                                    £1 - £10
                            </label>
                            <label 
                                className={"radio-inline" + (this.props.spleesh_bet_unit === 10 ? ' checked' : '')} 
                                onClick={() => { 
                                    this.props.onChangeState({spleesh_bet_unit: 10, bet_amount: 10, max_return: 540, endgame_amount: 540}); 
                                }}
                            >
                                £10 - £100
                            </label>
                        </div>
                    }
                    {this.props.step === 2 && 
                        <div style={{padding: "0"}} className="col-md-6 col-sm-10 col-xs-10">
                            <label className="lbl_game_option">Your Number</label>
                            {this.createNumberPanel()}
                            <div className="tip">Pick a number for players to guess (Your Bet Amount)</div>
                        </div>
                    }
                </div>
            </form>
        );
    }
}

export default Spleesh;
