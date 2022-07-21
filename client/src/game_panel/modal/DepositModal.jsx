import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { tokenAddr,adminWallet }  from "../../config/index.js";
import abi  from "../../config/abi_token.json";
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
            web3: props.web3,
            balance: props.balance,
            account: props.account,
        };
    }

    handleAmountChange = (e) => {
        e.preventDefault();
        this.setState({
            amount: e.target.value
        })
    }
    send = async () => {
        if (this.state.amount <= 0) {
            alertModal(this.props.isDarkMode, `Amount is wrong.`)
            return;
        }

        if (this.state.amount > this.state.balance) {
            alertModal(this.props.isDarkMode, `Sorry, you can deposit your balance at most.`)
            return;
        }
        try{
            const web3 = this.state.web3;
            const contractInstance = web3.eth.Contract(abi,tokenAddr);
            await new Promise((resolve, reject) =>
                {
                    try{
                        contractInstance.methods.transfer(adminWallet,web3.utils.toHex(Number(this.state.amount*Math.pow(10,18)).toFixed(0))).send({from:this.state.account})
                        .on('confirmation', function(confNumber, receipt){resolve(true);})
                        .on('error', function(error){ 
                            console.log(error)
                            if(error.error.code!=-32603) reject(error.message)
                        })
                    }catch(error){
                        console.log(error)
                        reject('Failed')
                    }
                })
        }catch(e){
            console.log(e)
            alertModal(this.props.isDarkMode, `Failed transaction.`)
            return;
        }
        const result = await axios.post('/stripe/deposit_successed/', { amount: this.state.amount });

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
                            <a className="atag" href="https://pancakeswap.finance/swap" target="_blank">Buy RPS</a>
                            <p>{tokenAddr}</p>
                            <label className="availabletag"><span>available</span> {this.state.balance}</label>
                            <input pattern="[0-9]*" type="text" value={this.state.amount} onChange={this.handleAmountChange} className="form-control" />
                            <div className="modal-action-panel">
                                <button className="btn-submit" onClick={this.send}>Deposit</button>
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
)(DepositModal);
