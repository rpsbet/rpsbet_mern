import React, { Component } from 'react';
import Modal from 'react-modal';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';

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
        backgroundColor: '#f8f9fa'
    }
}

class ProfileModal extends Component {
    constructor(props) {
        super(props);
    
        this.state = {
            showDepositModal: false,
            showWithdrawModal: false,
        }
    
        this.handleOpenDepositModal = this.handleOpenDepositModal.bind(this);
        this.handleCloseDepositModal = this.handleCloseDepositModal.bind(this);
        this.handleOpenWithdrawModal = this.handleOpenWithdrawModal.bind(this);
        this.handleCloseWithdrawModal = this.handleCloseWithdrawModal.bind(this);
    }

    handleOpenDepositModal () {
        this.setState({ showDepositModal: true });
    }
      
    handleCloseDepositModal () {
        this.setState({ showDepositModal: false });
    }

    handleOpenWithdrawModal () {
        this.setState({ showWithdrawModal: true });
    }
      
    handleCloseWithdrawModal () {
        this.setState({ showWithdrawModal: false });
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
            <button className="btn_modal_close" onClick={this.props.closeModal}>×</button>
          <div className="profile_info_panel">
                <span>Date Joined:</span>
                <span>01/01/2020</span>
              {/*  <span>Current Balance:</span>
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
                <span>2 hours ago</span> */}
            </div> 
            <div className="modal_action_panel">
                <button>EDIT ACCOUNT</button>
                <button>EDIT PROFILE</button>
                <button onClick={this.handleOpenWithdrawModal}>WITHDRAW</button>
                <button onClick={this.handleOpenDepositModal}>DEPOSIT</button>
            </div>
            <DepositModal modalIsOpen={this.state.showDepositModal} closeModal={this.handleCloseDepositModal} playerName={this.props.player_name} />
            <WithdrawModal modalIsOpen={this.state.showWithdrawModal} closeModal={this.handleCloseWithdrawModal} playerName={this.props.player_name} />
        </Modal>;
    }
}

export default ProfileModal;
