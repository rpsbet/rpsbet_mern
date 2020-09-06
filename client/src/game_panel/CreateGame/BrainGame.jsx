import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentQuestionInfo } from '../../redux/Question/question.action';
import { FaPoundSign } from 'react-icons/fa';

class BrainGame extends Component {
    render() {
        return (
                <form onSubmit={this.onCreateGame}>
                    <hr/>
                    <label className="lbl_game_option">Game Type</label>
                    {this.props.game_type_list.map((game_type, index) => (
                        <label className={"radio-inline" + (this.props.brain_game_type === game_type._id ? ' checked' : '')} 
                            onClick={(e) => { 
                                this.props.setCurrentQuestionInfo({brain_game_type: game_type._id}); 
                            }} key={index}>
                            {game_type.game_type_name}
                        </label>
                    ))}
                    <hr/>
                    <label className="lbl_game_option">Bet Amount</label>
                    <span className="pound-symbol"><FaPoundSign />
                    <input type="number" pattern="[0-9]*" value={this.props.bet_amount} onChange={(e)=>{this.props.onChangeState({bet_amount: e.target.value})}} className="form-control col-md-6 input-sm bet-input" placeholder="Bet Amount" /></span>
                    <div>The global cost to play this game</div>
                    <hr/>
                    <label className="lbl_game_option">Max Return</label>
                    <input type="text" readOnly name="potential" id="potential" className="form-control input-sm" value="∞ * 0.9" />
                    <div>The global max return with the chosen settings</div>
                </form>
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
