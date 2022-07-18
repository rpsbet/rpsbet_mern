import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentQuestionInfo } from '../../redux/Question/question.action';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';

class BrainGame extends Component {
    constructor(props) {
        super(props);
        this.state = {
            is_other: (this.props.bet_amount === 1 || this.props.bet_amount === 2.5 || this.props.bet_amount === 5 || this.props.bet_amount === 10 || this.props.bet_amount === 25) ? 'hidden' : ''
        };
    }

    render() {
        return (this.props.step === 1 ? 
            <DefaultBetAmountPanel bet_amount={this.props.bet_amount} onChangeState={this.props.onChangeState} game_type="Brain Game" />
            :
            <div className="game-info-panel">
                <h3 className="game-sub-title">Game Type</h3>
                <div className="select-buttons-panel">
                    {this.props.game_type_list.map((game_type, index) => (
                        <button className={(this.props.brain_game_type === game_type._id ? ' active' : '')} 
                            onClick={(e) => { 
                                this.props.setCurrentQuestionInfo({brain_game_type: game_type._id}); 
                            }} key={index}>
                            {game_type.game_type_name}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    game_type_list: state.questionReducer.game_type_list
});

const mapDispatchToProps = {
    setCurrentQuestionInfo,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BrainGame);
