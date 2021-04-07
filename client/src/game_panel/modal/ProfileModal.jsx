import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import AvatarUpload from './upload/AvatarUpload';
import { setUserInfo, changePasswordAndAvatar, getUser } from '../../redux/Auth/user.actions';
import { alertModal } from './ConfirmAlerts';

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
        background: 'transparent',
        padding: 0,
        border: 0
    }
}

class ProfileModal extends Component {
    constructor(props) {
        super(props);
    
        this.state = {
            username: this.props.userInfo.username,
            email: this.props.userInfo.email,
            password: '',
            passwordConfirmation: '',
            avatar: this.props.userInfo.avatar,
        }
    }

    static getDerivedStateFromProps(props, current_state) {
        if (current_state.avatar !== props.avatar || current_state.username !== props.username || current_state.email !== props.email ) {
            return {
                ...current_state,
                avatar: props.userInfo.avatar,
                username: props.userInfo.username,
                email: props.userInfo.email,
            };
        }
        return null;
    }

    componentDidMount() {
    }

    handleAvatarLoaded = (filename) => {
        console.log(filename)
        this.props.setUserInfo({ ...this.props.userInfo, avatar: filename });
    }

    handleChangePassword = (e) => {
        e.preventDefault();
        this.setState({ password: e.target.value });
    }

    handleChangePasswordConfirmation = (e) => {
        e.preventDefault();
        this.setState({ passwordConfirmation: e.target.value });
    }

    saveUserInfo = async (e) => {
        e.preventDefault();
        if (this.state.password !== this.state.passwordConfirmation) {
            alertModal(this.props.isDarkMode, `Password confirmation doesn't match the password.`);
            return;
        }

        const is_success = await this.props.changePasswordAndAvatar(this.state.password, this.state.avatar);
        if (is_success) {
            this.props.closeModal();
        }
    }

    handleCloseModal = () => {
        this.props.getUser(true);
        this.props.closeModal();
    }

    render() {
        return <Modal
            isOpen={this.props.modalIsOpen}
            onRequestClose={this.handleCloseModal}
            style={customStyles}
            contentLabel="Profile Modal"
        >
            <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                <div className="modal-body edit-modal-body">
                    <button className="btn-close" onClick={this.handleCloseModal}>×</button>
                    <h2 className="modal-title">Your Profile</h2>
                    <div className="edit-avatar-panel">
                        <AvatarUpload setImageFilename={this.handleAvatarLoaded} darkMode={this.props.isDarkMode} avatar={this.state.avatar} />
                    </div>
                    <div className="modal-edit-panel">
                        <div>
                            <p>User Name</p>
                            <input className="form-control" value={this.state.username} readOnly />
                        </div>
                        <div>
                            <p>Email</p>
                            <input className="form-control" value={this.state.email} readOnly />
                        </div>    
                        <div>
                            <p>New Password</p>
                            <input type="password" className="form-control" value={this.state.password} onChange={this.handleChangePassword} />
                        </div>
                        <div>
                            <p>Password Confirmation</p>
                            <input type="password" className="form-control" value={this.state.passwordConfirmation} onChange={this.handleChangePasswordConfirmation} />
                        </div>    
                    </div>
                    <div className="modal-action-panel">
                        <button className="btn-submit" onClick={this.saveUserInfo}>Save</button>
                    </div>
                </div>
            </div>
        </Modal>;
    }
}

const mapStateToProps = state => ({
    isDarkMode: state.auth.isDarkMode,
    userInfo: state.auth.user,
});

const mapDispatchToProps = {
    setUserInfo,
    changePasswordAndAvatar,
    getUser
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ProfileModal);
