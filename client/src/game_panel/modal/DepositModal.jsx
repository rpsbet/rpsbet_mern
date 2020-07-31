import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import { PayPalButton } from "react-paypal-button-v2";
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, ElementsConsumer } from '@stripe/react-stripe-js';
import axios from '../../util/Api';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { openAlert } from '../../redux/Notification/notification.actions';

Modal.setAppElement('#root')

const paypalClientId = "ASlqdxUMpil1inLxe4OkRKBgdu-UZ5DSyZPUrSeeHwJRTgc4T9Uy_0i35EJll7dt5RHv5IR6dWf3-Lt_";
const stripePromise = loadStripe('pk_test_DA6F4LKIFm6bEmm9YT9RvoHU00zAPJJJNA');

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

class StripeCheckoutForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            btnLock: false
        }
    }

    handleSubmit = async (event) => {
        this.setState({btnLock: true});

        event.preventDefault();

        const secretInfo = await axios.post('/stripe/secret/', {amount: this.props.amount});

        const {success, clientSecret, message} = secretInfo.data;

        if (!success) {
            this.props.openAlert('warning', 'Warning!', message.raw.message);
            this.setState({btnLock: false});
            return;
        }

        const {stripe, elements} = this.props;

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
                billing_details: {
                    name: this.props.playerName,
                },
            }
        });

        if (result.error) {
            // Show error to your customer (e.g., insufficient funds)
            console.log(result.error.message);
        } else {
            // The payment has been processed!
            if (result.paymentIntent.status === 'succeeded') {
                const newBalanceInfo = await axios.post('/stripe/deposit_successed/', {amount: this.props.amount, payment_method: 'Stripe'});
                const {success, balance, newTransaction} = newBalanceInfo.data;

                if (success) {
                    this.props.setBalance(balance);
                    this.props.addNewTransaction(newTransaction);
                }
                this.props.closeModal();
            }
        }

        this.setState({btnLock: false});
    };
  
    render() {
        const {stripe} = this.props;
        return (
            <form onSubmit={this.handleSubmit}>
                <CardElement />
                <button type="submit" style={{width: '100%'}} disabled={!stripe || this.state.btnLock}>
                    PAY
                </button>
            </form>
        );
    }
}

const InjectedCheckoutForm = (props) => (
    <ElementsConsumer>
        {({stripe, elements}) => (
            <StripeCheckoutForm stripe={stripe} elements={elements} amount={props.amount} setBalance={props.setBalance} closeModal={props.closeModal} />
        )}
    </ElementsConsumer>
);

class DepositModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            amount: 0,
        };

        this.handleAmountChange = this.handleAmountChange.bind(this);
    }

    handleAmountChange(e) {
        e.preventDefault();
        this.setState({
            amount: e.target.value
        })
    }

    render() {
        return <Modal
            isOpen={this.props.modalIsOpen}
            // onAfterOpen={afterOpenModal}
            onRequestClose={this.props.closeModal}
            style={customStyles}
            contentLabel="Deposit Modal"
        >
        
            <h2 style={{borderBottom: "1px solid gray"}}>Deposit</h2>
            <button className="btn_modal_close" onClick={this.props.closeModal}>x</button>
            <div className="profile_info_panel">
                <label>Deposit Amount (£):</label>
                <input type="number" value={this.state.amount} onChange={this.handleAmountChange} />
            </div>
            <h5 style={{textAlign: "center", margin: "10px auto -20px"}}><i>Choose payment method:</i></h5>
            <div className="payment_action_panel">
                <h5>PayPal</h5>
                <h5>Stripe</h5>
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

                <Elements stripe={stripePromise}>
                    <InjectedCheckoutForm amount={this.state.amount} setBalance={this.props.setBalance} closeModal={this.props.closeModal} />
                </Elements>
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
)(DepositModal);
