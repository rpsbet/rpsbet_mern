import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import './Modals.css';
import { userSignUp } from '../../redux/Auth/user.actions';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { Button, TextField } from '@material-ui/core';

Modal.setAppElement('#root')
  
const customStyles = {
    overlay: {
        zIndex: 3,
        backgroundColor: 'rgba(47, 49, 54, 0.8)',
        backdropFilter: 'blur(4px)'
    },
    content: {
        top         : '50%',
        left        : '50%',
        right       : 'auto',
        bottom      : 'auto',
        transform   : 'translate(-50%, -50%)',
        padding: 0,
        border: 0,
        background: 'transparent'
    }
}

class SignupModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            userName: '',
            email: '',
            password: '',
            bio: '',
            avatar: '',
            referralCode: '' // add referralCode

        }
    }

    onChangeUserName = (e) => {
        this.setState({userName: e.target.value});
    }

    onChangeEmail = (e) => {
        this.setState({email: e.target.value});
    }

    onChangePassword = (e) => {
        this.setState({password: e.target.value});
    }

    onChangeReferralCode = (e) => {
        this.setState({referralCode: e.target.value}); // update referralCode field in state
    }
    
    componentDidMount() {
    }

    onSubmitForm = async (e) => {
        e.preventDefault();
        const result = await this.props.userSignUp(this.state);

        if (result.status === 'success') {
            confirmAlert({
                customUI: ({ onClose }) => {
                    return (
                        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                            <div className='modal-body'>
                                <h2>WELCOME TO RPSBET.IO MF! ⚔</h2>
                                <p>CLICK YOUR BALANCE TO MAKE A DEPOSIT</p>
                                <div className="modal-action-panel">
                                    <Button onClick={() => { 
                                        onClose(); 
                                        this.props.closeModal();
                                        this.props.openLoginModal();
                                    }}>Login now</Button>
                                </div>
                            </div>
                        </div>
                    );
                }
            });
        }
    }

    render() {
        const { modalIsOpen, closeModal, openLoginModal, isDarkMode } = this.props;
        const { userName, email, password, referralCode } = this.state;
        return (
            <Modal
                isOpen={this.props.modalIsOpen}
                style={customStyles}
                contentLabel={this.props.title}
            >
                <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                    <div className="modal-body">
                        <button className="btn-close" onClick={this.props.closeModal}>×</button>
                        <h4>WELCOME! ⚔🥋</h4>
                        <h2>JOIN THE CLUB</h2>
                        <form onSubmit={this.onSubmitForm}>
              <TextField
                placeholder="CasE SeNsItIvE"
                label="Your Username"
                required
                value={userName}
                onChange={(e) => this.setState({ userName: e.target.value })}
                fullWidth
                className="form-control"
                variant="outlined"
              />
              <TextField
                placeholder="FAKEEMAIL@DISCO.COM"
                type="email"
                label="Your Email"
                required
                value={email}
                onChange={(e) => this.setState({ email: e.target.value })}
                fullWidth
                className="form-control"
                variant="outlined"
              />
              <TextField
              required
                placeholder="●●●●●●"
                type="password"
                label="Your Password"
                value={password}
                onChange={(e) => this.setState({ password: e.target.value })}
                fullWidth
                className="form-control"
                variant="outlined"
              />
              <TextField
                placeholder="V9FTGY"
                label="Referral"
                value={referralCode}
                onChange={(e) => this.setState({ referralCode: e.target.value })}
                fullWidth
                className="form-control"
                variant="outlined"
              />
              <Button className="btn-submit" type="submit">
                Register
              </Button>
              <p className="m-0 sm-text-center">
                ALREADY REGISTERED?{' '}
                <button onClick={(e) => { closeModal(); openLoginModal(); }}>
                  LOGIN HERE →
                </button>
              </p>
            </form>
                    </div>
                </div>
            </Modal>
        );
    }
}

const mapStateToProps = state => ({
    isDarkMode: state.auth.isDarkMode,
});

const mapDispatchToProps = {
    userSignUp
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SignupModal);
