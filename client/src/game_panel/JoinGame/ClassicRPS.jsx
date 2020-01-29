import React, { Component } from 'react';
import { connect } from 'react-redux';

class ClassicRPS extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected_rps: 1,
            advanced_status: 'hidden',
            is_anonymous: false,
        };
        this.onShowButtonClicked = this.onShowButtonClicked.bind(this);
        this.onBtnBetClick = this.onBtnBetClick.bind(this);
    }

    onShowButtonClicked(e) {
        e.preventDefault();
        if (this.state.advanced_status === "") {
            this.setState({advanced_status: "hidden"});
        } else {
            this.setState({advanced_status: ""});
        }
    }

    onBtnBetClick(e) {
        e.preventDefault();
        this.props.join(this.state.selected_rps, this.state.is_anonymous);
    }

    render() {
        return (
            <form onSubmit={this.onBtnBetClick}>
                <h1 className="main_title">Choose: Rock - Paper - Scissors</h1>
                <hr/>
                <label className="lbl_game_option">Select: Rock - Paper - Scissors!</label>
                <div>
                    <label className={"drinkcard-cc rock" + (this.state.selected_rps === 1 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 1}); }}></label>
                    <label className={"drinkcard-cc paper" + (this.state.selected_rps === 2 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 2}); }}></label>
                    <label className={"drinkcard-cc scissors" + (this.state.selected_rps === 3 ? " checked" : "")} onClick={() => { this.setState({selected_rps: 3}); }}></label>
                </div>
                <button className="btn-advanced" onClick={this.onShowButtonClicked}>Show/Hide Advanced Settings</button>
                <div id="advanced_panel" className={this.state.advanced_status}>
                    <hr/>
                    <label className="lbl_game_option">Anonymous Bet:</label>
                    <div>
                        <label className={"radio-inline" + (this.state.is_anonymous === true ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: true}); }}>Yes</label>
                        <label className={"radio-inline" + (this.state.is_anonymous === false ? ' checked' : '')} onClick={() => { this.setState({is_anonymous: false}); }}>No</label>
                    </div>
                    <div>By selecting 'Yes', your bet will be anonymous. £0.10 will be deducted from your balance and added to the PR</div>
                </div>
                <div className="text-center">
                    <button className="btn" id="btn_bet">PLACE BET</button>
                </div>
            </form>
        );
    }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
});

const mapDispatchToProps = {
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ClassicRPS);
