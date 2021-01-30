import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import './Modals.css';
import { userSignUp } from '../../redux/Auth/user.actions';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

Modal.setAppElement('#root')
  
const customStyles = {
    overlay: {
        zIndex: 3,
        backgroundColor: 'rgba(47, 49, 54, 0.8)'
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
            avatar: ''
        }

        this.onSubmitForm = this.onSubmitForm.bind(this);
        this.onChangeUserName = this.onChangeUserName.bind(this);
        this.onChangeEmail = this.onChangeEmail.bind(this);
        this.onChangePassword = this.onChangePassword.bind(this);
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

    componentDidMount() {
    }

    async onSubmitForm(e) {
        e.preventDefault();
        const result = await this.props.userSignUp(this.state);

        if (result.status === 'success') {
            confirmAlert({
                customUI: ({ onClose }) => {
                    return (
                        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                            <div className='modal-body'>
                                <h2>Welcome to RPSbet!</h2>
                                <p>Your account has been successfully registered.</p>
                                <div className="modal-action-panel">
                                    <button onClick={() => { 
                                        onClose(); 
                                        this.props.closeModal();
                                        this.props.openLoginModal();
                                    }}>Login now</button>
                                </div>
                            </div>
                        </div>
                    );
                }
            });
        }
    }

    render() {
        return (
            <Modal
                isOpen={this.props.modalIsOpen}
                style={customStyles}
                contentLabel={this.props.title}
            >
                <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                    <div className="modal-body">
                        <button className="btn-close" onClick={this.props.closeModal}>×</button>
                        <h4>Welcome!</h4>
                        <h2>Join the Community</h2>
                        <form onSubmit={this.onSubmitForm}>
                            <p>Your username</p>
                            <input placeholder="Pick a username (case sensitive)" type="text" className="form-control" value={this.state.userName} onChange={this.onChangeUserName}  />
                            <p>Your email address</p>
                            <input placeholder="Enter an email for verification" type="text" className="form-control" value={this.state.email} onChange={this.onChangeEmail}  />
                            <p>Your password</p>
                            <input placeholder="Create a secure password" type="password" className="form-control" value={this.state.password} onChange={this.onChangePassword}  />
                            <button className="btn-submit">Sign Up</button>
                            <p className="m-0 sm-text-center">Already a member? <button onClick={(e) => { this.props.closeModal(); this.props.openLoginModal(); }}>Login here →</button></p>
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
