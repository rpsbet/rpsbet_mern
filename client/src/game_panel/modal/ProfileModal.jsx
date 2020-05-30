import React, { Component } from 'react';
import Modal from 'react-modal';
import DepositModal from './DepositModal';

Modal.setAppElement('#root')

const customStyles = {
    overlay: {
        zIndex: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.75)'
    },
    content: {
        minWidth    : '500px',
        top         : '50%',
        left        : '50%',
        right       : 'auto',
        bottom      : 'auto',
        marginRight : '-50%',
        transform   : 'translate(-50%, -50%)',
        backgroundColor: '#f2e8dc'
    }
}

class ProfileModal extends Component {
    constructor(props) {
        super(props);
    
        this.state = {
            showDepositModal: false
        }
    
        this.handleOpenDepositModal = this.handleOpenDepositModal.bind(this);
        this.handleCloseDepositModal = this.handleCloseDepositModal.bind(this);
    }

    handleOpenDepositModal () {
        this.setState({ showDepositModal: true });
    }
      
    handleCloseDepositModal () {
        this.setState({ showDepositModal: false });
    }

    componentDidMount() {
    }

    render() {
        return <Modal
            isOpen={this.props.modalIsOpen}
            // onAfterOpen={afterOpenModal}
            onRequestClose={this.props.closeModal}
            style={customStyles}
            // style={customStyles}
            contentLabel="Profile Modal"
        >
        
            <h2 style={{borderBottom: "1px solid gray"}}>{this.props.player_name}'s Card</h2>
            <button className="btn_modal_close" onClick={this.props.closeModal}>x</button>
            <div className="profile_info_panel">
                <span>Date joined:</span>
                <span>01/01/2020</span>
                <span>Current Balance:</span>
                <span>£{this.props.balance}</span>
                <span>RPS Balance:</span>
                <span>£0</span>
                <span>Spleesh Balance:</span>
                <span>£0</span>
                <span>BrainGame Balance:</span>
                <span>£0</span>
                <span>MysteryBox Balance:</span>
                <span>£0</span>
                <span>Game Hosted:</span>
                <span>£0</span>
                <span>Game Joined:</span>
                <span>£0</span>
                <span>Total Rivals:</span>
                <span>£0</span>
                <span>Last logged in:</span>
                <span>2 hours ago</span>
            </div>
            <div className="modal_action_panel">
                <button>EDIT ACCOUNT</button>
                <button>EDIT PROFILE</button>
                <button>WITHDRAW</button>
                <button onClick={this.handleOpenDepositModal}>Deposit</button>
            </div>
            <DepositModal modalIsOpen={this.state.showDepositModal} closeModal={this.handleCloseDepositModal} playerName={this.props.player_name} />
        </Modal>;
    }
}

export default ProfileModal;
