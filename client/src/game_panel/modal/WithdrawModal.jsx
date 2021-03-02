import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import Modal from 'react-modal';
import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';

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
        padding: 0,
        background: 'transparent',
        border: 0
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

    handlePaymentMethodChange(method) {
        this.setState({
            payment_method: method
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
            alertModal(this.props.isDarkMode, `Sorry, you can withdraw a minimum of £5.`)
            return;
        }

        if (this.state.amount > this.props.balance) {
            alertModal(this.props.isDarkMode, `Sorry, you can withdraw your balance at most.`)
            return;
        }

        if (this.state.payment_method === 'PayPal' && this.state.email === '') {
            alertModal(this.props.isDarkMode, `Please input your paypal email address.`)
            return;
        }

        if (this.state.payment_method === 'Bank' && (this.state.payee_name === '' || this.state.bank_account_number === '' || this.state.bank_short_code === '')) {
            alertModal(this.props.isDarkMode, `Please input your bank account information.`)
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
            alertModal(this.props.isDarkMode, result.data.message)
            this.props.setBalance(result.data.balance);
            this.props.addNewTransaction(result.data.newTransaction);
            this.props.closeModal();
        } else {
            alertModal(this.props.isDarkMode, `Something went wrong. Please try again in a few minutes.`)
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
            <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
				<div className="modal-body edit-modal-body deposit-modal-body">
                    <button className="btn-close" onClick={this.props.closeModal}>×</button>
                    <h2>Withdraw</h2>
                    <div className="withdraw-modal-tabs">
                        <button className={this.state.payment_method === 'PayPal' ? 'active btn-paypal' : 'btn-paypal'} onClick={(e)=>{this.handlePaymentMethodChange('PayPal')}}>
                            PayPal
                        </button>
                        <button className={this.state.payment_method === 'Bank' ? 'active btn-bank' : 'btn-bank'} onClick={(e)=>{this.handlePaymentMethodChange('Bank')}}>
                            Bank
                        </button>
                    </div>
                    <div className="modal-content-wrapper">
						<div className="modal-content-panel">
                            <div className="payment-action-panel">
                                <div>
                                    <p>Withdraw Amount (£):</p>
                                    <input className="form-control" pattern="[0-9]*" type="text" value={this.state.amount} onChange={this.handleAmountChange} />
                                </div>
                                <div>
                                    {this.state.payment_method === 'PayPal' &&
                                        <>
                                            <p>PayPal email address:</p>
                                            <input type="email" value={this.state.email} onChange={this.handleEmailChange} className='form-control' />
                                        </>
                                    }
                                    {this.state.payment_method === 'Bank' &&
                                        <>
                                            <p>Payee Name:</p>
                                            <input type="text" value={this.state.payee_name} onChange={this.handlePayeeNameChange} className='form-control' />
                                        </>
                                    }
                                </div>
                                <div>
                                    {this.state.payment_method === 'Bank' &&
                                        <>
                                            <p>Bank Account Number:</p>
                                            <input pattern="[0-9]*" type="text" value={this.state.bank_account_number} onChange={this.handleBankAccountNumberChange} maxLength="8" className="form-control" />
                                        </>
                                    }
                                </div>
                                <div>
                                    {this.state.payment_method === 'Bank' &&
                                        <>
                                            <p>Sort Code:</p>
                                            <input pattern="[0-9]*" type="text" value={this.state.bank_short_code} onChange={this.handleBankShortCodeChange} maxLength="6" className="form-control" />
                                        </>
                                    }
                                </div>
                            </div>
                            <p>The amount will be deducted from your current balance and paid into your account within 3 hours. Please note in rare cases it may take up to 24 hours to process.</p>
                            <div className="modal-action-panel">
                                <button className="btn-submit" onClick={this.sendWithdrawEmail}>WITHDRAW</button>
                                <button className="btn-back" onClick={this.props.closeModal}>CANCEL</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>;
    }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
});
  
const mapDispatchToProps = {
    setBalance,
    addNewTransaction,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WithdrawModal);
