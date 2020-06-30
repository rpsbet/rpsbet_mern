import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import AvatarUpload from '../auth/Registration/upload/AvatarUpload';
import { changeAvatar } from '../../redux/Auth/user.actions';

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

class EditProfileModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            avatar: ''
        };

        this.handleBtnSaveClick = this.handleBtnSaveClick.bind(this);
    }

    async handleBtnSaveClick(e) {
        e.preventDefault();
        if (this.state.avatar === '')
            return;

        await this.props.changeAvatar(this.state.avatar);
        this.props.closeModal();
    }

    render() {
        return <Modal
            isOpen={this.props.modalIsOpen}
            // onAfterOpen={afterOpenModal}
            onRequestClose={this.props.closeModal}
            style={customStyles}
            contentLabel="Edit Account Modal"
        >
        
            <h2 style={{borderBottom: "1px solid gray"}}>Edit Profile</h2>
            <button className="btn_modal_close" onClick={this.props.closeModal}>x</button>
            <div>
                <AvatarUpload setImageFilename={(filename) => {
                    console.log(filename)
                    this.setState({avatar: filename});
                }} />
            </div>
            <div className="modal_action_panel">
                <button onClick={this.handleBtnSaveClick}>SAVE</button>
                <button onClick={this.props.closeModal}>CANCEL</button>
            </div>
        </Modal>;
    }
}

const mapStateToProps = state => ({
});

const mapDispatchToProps = {
    changeAvatar
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EditProfileModal);
