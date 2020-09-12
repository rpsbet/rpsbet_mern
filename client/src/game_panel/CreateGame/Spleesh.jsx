import React, { Component } from 'react';

class Spleesh extends Component {
    constructor(props) {
        super(props);
        this.state = {
            spleesh_game_type: 1,
        };
    }

    createNumberPanel() {
        let panel = [];
        for (let i = 1; i <= 10; i++) {
            panel.push( <label 
                            className={"radio-inline" + (this.props.bet_amount / this.state.spleesh_game_type === i ? ' checked' : '')} 
                            onClick={() => { this.props.onChangeState({
                                bet_amount: i * this.state.spleesh_game_type,
                                endgame_amount: this.state.spleesh_game_type * (55 - i),
                                max_return: this.state.spleesh_game_type * (55 - i)
                            }); }} key={i}
                        >
                            £{i * this.state.spleesh_game_type}
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
                                className={"radio-inline" + (this.state.spleesh_game_type === 1 ? ' checked' : '')} 
                                onClick={() => { 
                                    this.setState({spleesh_game_type: 1}); 
                                    this.props.onChangeState({bet_amount: 1, max_return: 54}); 
                                }}
                            >
                                    £1 - £10
                            </label>
                            <label 
                                className={"radio-inline" + (this.state.spleesh_game_type === 10 ? ' checked' : '')} 
                                onClick={() => { 
                                    this.setState({spleesh_game_type: 10}); 
                                    this.props.onChangeState({bet_amount: 10, max_return: 540}); 
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
                            <div>Pick a number for players to guess (Your Bet Amount)</div>
                        </div>
                    }
                </div>
            </form>
        );
    }
}

export default Spleesh;
