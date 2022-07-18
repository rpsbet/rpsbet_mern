import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import axios from '../../util/Api';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { tokenAddr }  from "../../config/index.js";
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
                            <p>Deposit Amount (RPS):</p>
                            <p>Buy below token in <a className="atag" href="https://pancakeswap.finance/swap" target="_blank">pancake</a>: {tokenAddr}</p>
                            {/* <input pattern="[0-9]*" type="text" value={this.state.amount} onChange={this.handleAmountChange} className="form-control" /> */}
                            {/* <div className="payment-action-panel">
                                <div>
                                    <p>PayPal</p>
                                </div>
                            </div> */}
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
