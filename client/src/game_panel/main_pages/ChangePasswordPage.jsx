import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';

class ChangePasswordPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            password: '',
            password_confirmation: ''
        }

        this.handlePasswordChanged = this.handlePasswordChanged.bind(this);
        this.handlePasswordConfirmationChanged = this.handlePasswordConfirmationChanged.bind(this);
    }

    componentDidMount() {
        console.log(this.props.match);
    }

    handlePasswordChanged(e) {
        e.preventDefault();
        this.setState({password: e.target.value});
    }

    handlePasswordConfirmationChanged(e) {
        e.preventDefault();
        this.setState({password_confirmation: e.target.value})
    }

    render() {
        return (
            <div className="game-page reset-password-page">
                <div className="page-title">
                    <h2>Reset Password</h2>
                </div>
				<div className="game-contents">
                    <div className="game-info-panel">
                        <h3 className="game-sub-title">Select: Rock - Paper - Scissors!</h3>
                        <p>New Password</p>
                        <input type="password" className="form-control" value={this.state.password} onChange={this.handlePasswordChanged} />
                        <p>Password Confirmation</p>
                        <input type="password" className="form-control" value={this.state.password_confirmation} onChange={this.handlePasswordConfirmationChanged} />
                    </div>
                    <hr/>
                    <div className="action-panel">
                        <span></span>
                        <button id="btn_bet" onClick={this.onBtnBetClick}>Reset Password</button>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => ({
});

const mapDispatchToProps = {
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangePasswordPage);
