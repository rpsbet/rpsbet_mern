import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import { changePassword, deleteAccount } from '../../redux/Auth/user.actions';
import { openAlert } from '../../redux/Notification/notification.actions';

Modal.setAppElement('#root')

const customStyles = {
    overlay: {
        zIndex: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.75)'
    },
    content: {
        minWidth    : '600px',
        top         : '50%',
        left        : '50%',
        right       : 'auto',
        bottom      : 'auto',
        marginRight : '-50%',
        transform   : 'translate(-50%, -50%)',
        backgroundColor: '#f8f9fa'
    }
}

class EditAccountModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            new_password: '',
            password_confirm: ''
        };

        this.handleInputValueChange = this.handleInputValueChange.bind(this);
        this.handleBtnSaveClick = this.handleBtnSaveClick.bind(this);
        this.handleBtnDeleteClick = this.handleBtnDeleteClick.bind(this);
    }

    handleBtnDeleteClick(e) {
        e.preventDefault();

        if (window.confirm('Ooops! Do you want to delete your account?')) {
            this.props.deleteAccount();
        }
    }

    handleBtnSaveClick(e) {
        e.preventDefault();

        if (this.state.new_password === '') {
            this.props.openAlert('warning', 'Warning!', `Please input new password.`);
            return;
        }

        if (this.state.new_password !== this.state.password_confirm) {
            this.props.openAlert('warning', 'Warning!', `Wrong password confirmation.`);
            return;
        }

        this.props.changePassword(this.state.new_password);
    }

    handleInputValueChange(e) {
        e.preventDefault();
        this.setState({
            [e.target.name]: e.target.value
        })
    }

    render() {
        return <Modal
            isOpen={this.props.modalIsOpen}
            // onAfterOpen={afterOpenModal}
            onRequestClose={this.props.closeModal}
            style={customStyles}
            contentLabel="Edit Account Modal"
        >
        
            <h2 style={{borderBottom: "1px solid gray"}}>Edit Account</h2>
            <button className="btn_modal_close" onClick={this.props.closeModal}>x</button>
            <div className="profile_info_panel" autoComplete="off">
                <label>Username:</label>
                <label>{this.props.playerName}</label>
                <label>Email:</label>
                <label>{this.props.email}</label>
                <label>New Password:</label>
                <input type="password" value={this.state.new_password} id="__np__" name="new_password" autoComplete="new-password" onChange={this.handleInputValueChange} />
                <label>Password Confirmation:</label>
                <input type="password" value={this.state.password_confirm} id="__pc__" name="password_confirm" autoComplete="new-password" onChange={this.handleInputValueChange} />
            </div>
            <div className="modal_action_panel">
                <button onClick={this.handleBtnSaveClick}>SAVE</button>
                <button onClick={this.handleBtnDeleteClick}>DELETE</button>
            </div>
        </Modal>;
    }
}

const mapStateToProps = state => ({
});

const mapDispatchToProps = {
    changePassword,
    deleteAccount,
    openAlert
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditAccountModal);
