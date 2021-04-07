import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import { PayPalButton } from "react-paypal-button-v2";
// import { loadStripe } from '@stripe/stripe-js';
// import { CardElement, Elements, ElementsConsumer } from '@stripe/react-stripe-js';
import axios from '../../util/Api';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
// import { alertModal } from '../modal/ConfirmAlerts';

Modal.setAppElement('#root')

const paypalClientId = "AStkb68As4hkX4mS9uwLSnLuPP3j72OQDMiyOpmStqWZtjCOXB458I5M73peFcf7VaWfPGypNPdKehUJ";
// const stripePromise = loadStripe('pk_live_vO1IbeoHkodzX6wEKrPZZaKK00pt9mOGOu');

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

// class StripeCheckoutForm extends React.Component {
//     constructor(props) {
//         super(props);

//         this.state = {
//             btnLock: false
//         }
//     }

//     handleSubmit = async (event) => {
//         this.setState({btnLock: true});

//         event.preventDefault();

//         const secretInfo = await axios.post('/stripe/secret/', {amount: this.props.amount});

//         const {success, clientSecret, message} = secretInfo.data;

//         if (!success) {
//             alertModal(this.props.isDarkMode, message.raw.message)
//             this.setState({btnLock: false});
//             return;
//         }

//         const {stripe, elements} = this.props;

//         const result = await stripe.confirmCardPayment(clientSecret, {
//             payment_method: {
//                 card: elements.getElement(CardElement),
//                 billing_details: {
//                     name: this.props.playerName,
//                 },
//             }
//         });

//         if (result.error) {
//             // Show error to your customer (e.g., insufficient funds)
//             alertModal(this.props.isDarkMode, result.error.message)
//         } else {
//             // The payment has been processed!
//             if (result.paymentIntent.status === 'succeeded') {
//                 const newBalanceInfo = await axios.post('/stripe/deposit_successed/', {amount: this.props.amount, payment_method: 'Stripe'});
//                 const {success, balance, newTransaction} = newBalanceInfo.data;

//                 if (success) {
//                     this.props.setBalance(balance);
//                     this.props.addNewTransaction(newTransaction);
//                 }
//                 this.props.closeModal();
//             }
//         }

//         this.setState({btnLock: false});
//     };
  
//     render() {
//         const {stripe} = this.props;
//         return (
//             <form onSubmit={this.handleSubmit}>
//                 <CardElement />
//                 <button type="submit" disabled={!stripe || this.state.btnLock} className="btn-stripe-pay">
//                     PAY
//                 </button>
//             </form>
//         );
//     }
// }

// const InjectedCheckoutForm = (props) => (
//     <ElementsConsumer>
//         {({stripe, elements}) => (
//             <StripeCheckoutForm stripe={stripe} elements={elements} amount={props.amount} setBalance={props.setBalance} closeModal={props.closeModal} addNewTransaction={props.addNewTransaction} />
//         )}
//     </ElementsConsumer>
// );

class DepositModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            amount: 0,
        };
    }

    handleAmountChange = (e) => {
        e.preventDefault();
        this.setState({
            amount: e.target.value
        })
    }

    render() {
        return <Modal
            isOpen={this.props.modalIsOpen}
            onRequestClose={this.props.closeModal}
            style={customStyles}
            contentLabel="Deposit Modal"
        >
            <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
				<div className="modal-body edit-modal-body deposit-modal-body">
                    <button className="btn-close" onClick={this.props.closeModal}>×</button>
                    <h2>Deposit</h2>
                    <div className="modal-content-wrapper">
						<div className="modal-content-panel">
                            <p>Deposit Amount (£):</p>
                            <input pattern="[0-9]*" type="text" value={this.state.amount} onChange={this.handleAmountChange} className="form-control" />
                            <h5 className="mt-5">Choose payment method:</h5>
                            <div className="payment-action-panel">
                                <div>
                                    <p>PayPal</p>
                                    <PayPalButton
                                        amount={this.state.amount}
                                        // shippingPreference="NO_SHIPPING" // default is "GET_FROM_FILE"
                                        onSuccess={async (details, data) => {
                                            console.log(data);
                                            const newBalanceInfo = await axios.post('/stripe/deposit_successed/', {amount: this.state.amount, payment_method: 'PayPal'});
                                            const {success, balance, newTransaction} = newBalanceInfo.data;

                                            if (success) {
                                                this.props.setBalance(balance);
                                                this.props.addNewTransaction(newTransaction);
                                            }
                                            this.props.closeModal();
                                        }}
                                        options={{
                                            clientId: paypalClientId,
                                            currency: "GBP"
                                        }}
                                    />
                                </div>
                                {/* <div>
                                    <p>Stripe</p>
                                    <Elements stripe={stripePromise}>
                                        <InjectedCheckoutForm amount={this.state.amount} setBalance={this.props.setBalance} closeModal={this.props.closeModal} addNewTransaction={this.props.addNewTransaction} />
                                    </Elements>
                                </div> */}
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
)(DepositModal);
