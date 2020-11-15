import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { closeGamePasswordModal } from '../../redux/Notification/notification.actions';
import { checkGamePassword } from '../../redux/Logic/logic.actions';
import history from '../../redux/history';

Modal.setAppElement('#root')

const customStyles = {
    overlay: {
        zIndex: 3,
        backgroundColor: 'rgba(0, 0, 0, 0.75)'
    },
    content: {
        top         : '30%',
        left        : '50%',
        right       : 'auto',
        bottom      : 'auto',
        marginRight : '-50%',
        transform   : 'translate(-50%, -50%)',
        backgroundColor: '#f8f9fa'
    }
}

class GamePasswordModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            password: ''
        }

        this.onBtnOkClicked = this.onBtnOkClicked.bind(this);
        this.onBtnCancelClicked = this.onBtnCancelClicked.bind(this);
    }

    async onBtnOkClicked(e) {
        const response = await this.props.checkGamePassword({room_id: this.props.roomId, password: this.state.password});
        if (response === true) {
            this.props.closeGamePasswordModal();
        } else {
            alert("Invalid password! Please try again.");
        }
    }

    onBtnCancelClicked(e) {
        history.push('/');
        this.props.closeGamePasswordModal();
    }

    render() {
        return <Modal
            isOpen={this.props.isOpen}
            style={customStyles}
            contentLabel="Password"
        >
        
            <h2 style={{borderBottom: "1px solid gray"}}>
                Password
            </h2>
            <button className="btn_modal_close" onClick={this.onBtnCancelClicked}>×</button>
            <div className="alert_panel">
                <div className="alert_image_wrapper">
                    <img src={"/img/tutorial.png"} alt="" />
                </div>
                <div className="alert_message_panel">
                    <input type="password" id="game_password" value={this.state.password} onChange={(e) => {this.setState({password: e.target.value})}} />
                    <button onClick={this.onBtnOkClicked}>Okay</button>
                    <button onClick={this.onBtnCancelClicked}>Cancel</button>
                </div>
            </div> 
        </Modal>;
    }
}

const mapStateToProps = state => ({
    isOpen: state.snackbar.showGamePasswordModal,
    title: state.snackbar.title,
    roomStatus: state.snackbar.roomStatus,
    alertMessage: state.snackbar.alertMessage,
    alertType: state.snackbar.alertType,
    socket: state.auth.socket,
    roomId: state.logic.curRoomInfo._id,
});

const mapDispatchToProps = {
    closeGamePasswordModal,
    checkGamePassword
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GamePasswordModal);
