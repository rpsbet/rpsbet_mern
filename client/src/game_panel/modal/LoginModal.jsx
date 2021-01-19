import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import './Modals.css';

import { userSignIn, getUser } from '../../redux/Auth/user.actions';
import VerificationModal from './VerificationModal';

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
        background: 'transparent',
        border: 0
    }
}

class LoginModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            email: props.email,
            password: props.password,
            showVerificationModal: false
        }

        this.onSubmitForm = this.onSubmitForm.bind(this);
        this.onChangeEmail = this.onChangeEmail.bind(this);
        this.onChangePassword = this.onChangePassword.bind(this);
        this.handleOpenVerificationModal = this.handleOpenVerificationModal.bind(this);
        this.handleCloseVerificationModal = this.handleCloseVerificationModal.bind(this);
    }

    onChangeEmail = (e) => {
        this.setState({email: e.target.value});
    }

    onChangePassword = (e) => {
        this.setState({password: e.target.value});
    }

    componentDidMount() {
    }

    handleOpenVerificationModal () {
        this.setState({ showVerificationModal: true }); 
    }

    handleCloseVerificationModal () {
        this.setState({ showVerificationModal: false }); 
    }

    async onSubmitForm(e) {
        e.preventDefault();
        let result = await this.props.userSignIn(this.state);
        if (result.status === 'success') {
            this.props.closeModal();
            result = await this.props.getUser(true);
            if (!result.user.is_activated) {
                this.handleOpenVerificationModal();
            }
        }
    }

    render() {
        return (
            <>
                <Modal
                    isOpen={this.props.modalIsOpen}
                    style={customStyles}
                    contentLabel={this.props.title}
                >
                    <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                        <div className="modal-body">
                            <button className="btn-close" onClick={this.props.closeModal}>×</button>
                            <h4>Welcome back!</h4>
                            <h2>Sign in to RPSbet</h2>
                            <form onSubmit={this.onSubmitForm}>
                                <p>User Name or E-Mail Address</p>
                                <input type="text" className="form-control" value={this.state.email} onChange={this.onChangeEmail} />
                                <p>Password</p>
                                <input type="password" className="form-control" value={this.state.password} onChange={this.onChangePassword} />
                                <button className="btn-submit">Sign In</button>
                                <p className="m-0 sm-text-center">Not a member? <button onClick={(e) => { this.props.closeModal(); this.props.openSignupModal(); }}>Sign up now →</button></p>
                            </form>
                        </div>
                    </div>
                </Modal>
                <VerificationModal modalIsOpen={this.state.showVerificationModal} closeModal={this.handleCloseVerificationModal} />
            </>
        );
    }
}

const mapStateToProps = state => ({
    isDarkMode: state.auth.isDarkMode,
    email: state.auth.user.email,
    password: state.auth.user.password,
});

const mapDispatchToProps = {
    userSignIn,
    getUser
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(LoginModal);
