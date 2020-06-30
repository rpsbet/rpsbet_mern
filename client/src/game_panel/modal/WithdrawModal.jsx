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
            email: '',
            bank_account_number: '',
            bank_short_code: '',
            payment_method: 'PayPal'
        };

        this.handleAmountChange = this.handleAmountChange.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.sendWithdrawEmail = this.sendWithdrawEmail.bind(this);
        this.handlePaymentMethodChange = this.handlePaymentMethodChange.bind(this);
        this.handleBankAccountNumberChange = this.handleBankAccountNumberChange.bind(this);
        this.handleBankShortCodeChange = this.handleBankShortCodeChange.bind(this);
    }

    handleBankAccountNumberChange(e) {
        e.preventDefault();
        this.setState({
            bank_account_number: e.target.value
        })
    }

    handleBankShortCodeChange(e) {
        e.preventDefault();
        this.setState({
            bank_short_code: e.target.value
        })
    }

    handlePaymentMethodChange(e) {
        this.setState({
            payment_method: e.target.value
        });
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

        if (this.state.payment_method === 'paypal' && this.state.email === '') {
            alert('Please input your paypal email address');
            return;
        }

        if (this.state.payment_method === 'Bank' && (this.state.bank_account_number === '' || this.state.bank_short_code === '')) {
            alert('Please input your bank account information');
            return;
        }

        const result = await axios.post('/stripe/withdraw_request/', {
            amount: this.state.amount, 
            payment_method: this.state.payment_method, 
            email: this.state.email,
            bank_account_number: this.state.bank_account_number,
            bank_short_code: this.state.bank_short_code,
        });

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
                <span className="radio_panel">
                    <input type="radio" id="r_paypal" name="payment_method" value="PayPal" onChange={this.handlePaymentMethodChange} checked={this.state.payment_method === 'PayPal'} />
                    <label htmlFor="r_paypal">PayPal</label>
                </span>
                <span className="radio_panel">
                    <input type="radio" id="r_bank" name="payment_method" value="Bank" onChange={this.handlePaymentMethodChange} checked={this.state.payment_method === 'Bank'} />
                    <label htmlFor="r_bank">Bank</label>
                </span>
                <label>Withdraw Amount (£):</label>
                <input type="number" value={this.state.amount} onChange={this.handleAmountChange} />
                <label className={this.state.payment_method === 'PayPal' ? '' : 'hidden'}>PayPal email address:</label>
                <input type="email" value={this.state.email} onChange={this.handleEmailChange} className={this.state.payment_method === 'PayPal' ? '' : 'hidden'} />
                <label className={this.state.payment_method === 'Bank' ? '' : 'hidden'}>Bank Account Number:</label>
                <input type="text" value={this.state.bank_account_number} onChange={this.handleBankAccountNumberChange} maxLength="8" className={this.state.payment_method === 'Bank' ? '' : 'hidden'} />
                <label className={this.state.payment_method === 'Bank' ? '' : 'hidden'}>Short Code:</label>
                <input type="text" value={this.state.bank_short_code} onChange={this.handleBankShortCodeChange} maxLength="6" className={this.state.payment_method === 'Bank' ? '' : 'hidden'} />
            </div>
            <div className="payment_action_panel">
                <button onClick={this.sendWithdrawEmail}>OKAY</button>
                <button onClick={this.props.closeModal}>CANCEL</button>
            </div>
        </Modal>;
    }
}

export default WithdrawModal;
