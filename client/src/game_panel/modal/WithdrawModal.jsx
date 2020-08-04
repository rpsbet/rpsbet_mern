import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import Modal from 'react-modal';
import axios from '../../util/Api';
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

class WithdrawModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            amount: 0,
            email: '',
            payee_name: '',
            bank_account_number: '',
            bank_short_code: '',
            payment_method: 'PayPal'
        };

        this.handleAmountChange = this.handleAmountChange.bind(this);
        this.handlePayeeNameChange = this.handlePayeeNameChange.bind(this);
        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.sendWithdrawEmail = this.sendWithdrawEmail.bind(this);
        this.handlePaymentMethodChange = this.handlePaymentMethodChange.bind(this);
        this.handleBankAccountNumberChange = this.handleBankAccountNumberChange.bind(this);
        this.handleBankShortCodeChange = this.handleBankShortCodeChange.bind(this);
    }

    handlePayeeNameChange(e) {
        e.preventDefault();
        this.setState({
            payee_name: e.target.value
        })
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
        if (this.state.amount < 5) {
            this.props.openAlert('warning', 'Warning!', `Sorry, you can withdraw a minimum of £5.`);
            return;
        }

        if (this.state.payment_method === 'paypal' && this.state.email === '') {
            this.props.openAlert('warning', 'Warning!', `Please input your paypal email address`);
            return;
        }

        if (this.state.payment_method === 'Bank' && (this.state.payee_name === '' || this.state.bank_account_number === '' || this.state.bank_short_code === '')) {
            this.props.openAlert('warning', 'Warning!', `Please input your bank account information`);
            return;
        }

        const result = await axios.post('/stripe/withdraw_request/', {
            amount: this.state.amount, 
            payment_method: this.state.payment_method, 
            email: this.state.email,
            payee_name: this.state.payee_name,
            bank_account_number: this.state.bank_account_number,
            bank_short_code: this.state.bank_short_code,
        });

        if (result.data.success) {
            this.props.openAlert('warning', 'Information', result.data.message);
            this.props.setBalance(result.data.balance);
            this.props.addNewTransaction(result.data.newTransaction);
            this.props.closeModal();
        } else {
            this.props.openAlert('warning', 'Warning!', `Something went wrong. Please try again in a few minutes.`);
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
            <h4 style={{textAlign: "center"}}><i>No withdrawal fees!</i></h4>
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
                <input pattern="[0-9]*" type="text" value={this.state.amount} onChange={this.handleAmountChange} />
                <label className={this.state.payment_method === 'PayPal' ? '' : 'hidden'}>PayPal email address:</label>
                <input type="email" value={this.state.email} onChange={this.handleEmailChange} className={this.state.payment_method === 'PayPal' ? '' : 'hidden'} />
                <label className={this.state.payment_method === 'Bank' ? '' : 'hidden'}>Payee Name:</label>
                <input type="text" value={this.state.payee_name} onChange={this.handlePayeeNameChange} className={this.state.payment_method === 'Bank' ? '' : 'hidden'} />
                <label className={this.state.payment_method === 'Bank' ? '' : 'hidden'}>Bank Account Number:</label>
                <input pattern="[0-9]*" type="text" value={this.state.bank_account_number} onChange={this.handleBankAccountNumberChange} maxLength="8" className={this.state.payment_method === 'Bank' ? '' : 'hidden'} />
                <label className={this.state.payment_method === 'Bank' ? '' : 'hidden'}>Sort Code:</label>
                <input pattern="[0-9]*" type="text" value={this.state.bank_short_code} onChange={this.handleBankShortCodeChange} maxLength="6" className={this.state.payment_method === 'Bank' ? '' : 'hidden'} />
            </div>
            <h6 style={{margin: "20px auto -5px", textAlign: "center"}}>The amount will be deducted from your current balance and paid into your account within 1-3 hours.</h6>
            <div className="payment_action_panel">
                <button onClick={this.sendWithdrawEmail}>WITHDRAW</button>
                <button onClick={this.props.closeModal}>CANCEL</button>
            </div>
        </Modal>;
    }
}

const mapStateToProps = state => ({
});
  
const mapDispatchToProps = {
    setBalance,
    addNewTransaction,
    openAlert
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WithdrawModal);
