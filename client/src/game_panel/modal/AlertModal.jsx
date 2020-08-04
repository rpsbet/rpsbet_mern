import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { closeAlert } from '../../redux/Notification/notification.actions';

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

class AlertModal extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
    }

    render() {
        let img_filename = '';
        console.log(this.props.alertType);
        if (this.props.alertType === 'warning') {
            img_filename = 'error.png';
        } else if (this.props.alertType === 'tutorial') {
            img_filename = 'tutorial.png';
        } else if (this.props.alertType === 'win') {
            img_filename = 'win.png';
        } else if (this.props.alertType === 'lost') {
            img_filename = 'lost.png';
        } else if (this.props.alertType === 'draw') {
            img_filename = 'draw.png';
        }

        return <Modal
            isOpen={this.props.isOpen}
            style={customStyles}
            contentLabel={this.props.title}
        >
        
            <h2 style={{borderBottom: "1px solid gray"}}>
                {this.props.title}
            </h2>
            <button className="btn_modal_close" onClick={this.props.closeAlert}>×</button>
            <div className="alert_panel">
                <div className="alert_image_wrapper">
                    <img src={"/img/" + img_filename} alt="" />
                </div>
                <div className="alert_message_panel">
                    {this.props.alertMessage}
                    <button onClick={this.props.closeAlert}>Okay</button>
                </div>
            </div> 
        </Modal>;
    }
}

const mapStateToProps = state => ({
    isOpen: state.snackbar.showAlert,
    title: state.snackbar.title,
    alertMessage: state.snackbar.alertMessage,
    alertType: state.snackbar.alertType,
    socket: state.auth.socket,
});

const mapDispatchToProps = {
    closeAlert
};

export default connect(
mapStateToProps,
mapDispatchToProps
)(AlertModal);
