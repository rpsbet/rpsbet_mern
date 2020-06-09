import React, { Component } from 'react';
import Modal from 'react-modal';
import axios from '../../util/Api';

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

class WithdrawModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            amount: 0,
            email: ''
        };

        this.handleAmountChange = this.handleAmountChange.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.sendWithdrawEmail = this.sendWithdrawEmail.bind(this);
    }

    handleAmountChange(e) {
        e.preventDefault();
        this.setState({
            amount: e.target.value
        })
    }

    handleEmailChange(e) {
        e.preventDefault();
        this.setState({
            email: e.target.value
        })
    }

    async sendWithdrawEmail() {
        if (this.state.amount < 100) {
            alert('Sorry, you can withdraw a minimum of £100.');
            return;
        }

        if (this.state.email === '') {
            alert('Please input your paypal email address');
            return;
        }

        const result = await axios.post('/stripe/withdraw_request/', {amount: this.state.amount, payment_method: 'PayPal', email: this.state.email});

        if (result.data.success) {
            alert('email is sent');
            this.props.closeModal();
        } else {
            alert('something is wrong. please try again in a few minutes.');
        }
    }

    render() {
        return <Modal
            isOpen={this.props.modalIsOpen}
            // onAfterOpen={afterOpenModal}
            onRequestClose={this.props.closeModal}
            style={customStyles}
            contentLabel="Withdraw Modal"
        >
        
            <h2 style={{borderBottom: "1px solid gray"}}>Withdraw</h2>
            <button className="btn_modal_close" onClick={this.props.closeModal}>x</button>
            <div className="profile_info_panel">
                <label>Withdraw Amount (£):</label>
                <input type="number" value={this.state.amount} onChange={this.handleAmountChange} />
                <label>PayPal email address:</label>
                <input type="email" value={this.state.email} onChange={this.handleEmailChange} />
            </div>
            <div className="payment_action_panel">
                <button onClick={this.sendWithdrawEmail}>OKAY</button>
                <button onClick={this.props.closeModal}>CANCEL</button>
            </div>
        </Modal>;
    }
}

export default WithdrawModal;
