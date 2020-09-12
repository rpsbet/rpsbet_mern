import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentQuestionInfo } from '../../redux/Question/question.action';
import { FaPoundSign } from 'react-icons/fa';

class BrainGame extends Component {
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

                    <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 1 ? ' checked' : '')} onClick={() => { this.setState({is_other: "hidden"}); this.props.onChangeState({bet_amount: 1}); }}>£1</label>
                    <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 2.5 ? ' checked' : '')} onClick={() => { this.setState({is_other: "hidden"}); this.props.onChangeState({bet_amount: 2.5}); }}>£2.5</label>
                    <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 5 ? ' checked' : '')} onClick={() => { this.setState({is_other: "hidden"}); this.props.onChangeState({bet_amount: 5}); }}>£5</label>
                    <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 10 ? ' checked' : '')} onClick={() => { this.setState({is_other: "hidden"}); this.props.onChangeState({bet_amount: 10}); }}>£10</label>
                    <label className={"radio-inline" + (this.state.is_other !== "" && this.props.bet_amount === 25 ? ' checked' : '')} onClick={() => { this.setState({is_other: "hidden"}); this.props.onChangeState({bet_amount: 25}); }}>£25</label>
                    <label className={"radio-inline" + (this.state.is_other === "" ? ' checked' : '')} onClick={() => { this.setState({is_other: ""}); }}>Other</label>

                    <div className={`${this.state.is_other}`}>
                        <span className="pound-symbol"><FaPoundSign />
                        <input type="number" pattern="[0-9]*" value={this.props.bet_amount} onChange={(e)=>{this.props.onChangeState({bet_amount: e.target.value})}} className="form-control col-md-6 input-sm bet-input" placeholder="Bet Amount" /></span>
                    </div>
                    <div>The global cost to play this game</div>
                </>
                :
                <>
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
                </>
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
