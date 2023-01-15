import React, { Component } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import Modal from 'react-modal';
import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';
import { FaClipboard } from 'react-icons/fa';
import { convertToCurrency } from '../../util/conversion';
Modal.setAppElement('#root')

const customStyles = {
    overlay: {
        zIndex: 3,
        backgroundColor: 'rgba(47, 49, 54, 0.8)',
        backdropFilter: 'blur(4px)'
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
            web3: props.web3,
            balance: props.balance,
            account: props.account,
            isLoading: false
        };
    }

    handleAmountChange = (e) => {
        e.preventDefault();
        this.setState({
            amount: e.target.value
        })
    }
    send = async () => {
        try {
            if (this.state.amount <= 20) {
                alertModal(this.props.isDarkMode, `MINIMUM WITHDRAWAL IS 20 BUSD`)
                return;
            }
            
            if (this.state.amount > this.state.balance) {
                alertModal(this.props.isDarkMode, `TRY LATER BROKIE`)
                return;
            }
            this.setState({ isLoading: true })
            const result = await axios.post('/stripe/withdraw_request/', { amount: this.state.amount, addressTo: this.state.account});
            
            if (result.data.success) {
                alertModal(this.props.isDarkMode, result.data.message)
                this.props.setBalance(result.data.balance);
                this.props.addNewTransaction(result.data.newTransaction);
                this.setState({ isLoading: false })
                this.props.closeModal();
            } else {
                this.setState({ isLoading: false })
                alertModal(this.props.isDarkMode, `SOMETHING IS WRONG - CONTACT @RPSBET ON TG`)
            }
        } catch(e) {
            this.setState({ isLoading: false })
            if (this.state.amount <= 0) {
                alertModal(this.props.isDarkMode, `Something went wrong`);
                return;
            }
        }

    }

    
    toggleBtnHandler = () => {
        return this.setState({
          clicked:!this.state.clicked
        })
        
      }
      copy() {
        navigator.clipboard.writeText('0xe9e7cea3dedca5984780bafc599bd69add087d56')
      }


      render() {
        const styles = ['copy-btn'];
         let text = 'COPY CONTRACT';
    
        if (this.state.clicked) {
        styles.push('clicked');
        text = 'COPIED!';
        }
        console.log({ loading: this.state.isLoading })
        return (
            <>
                <LoadingOverlay
                    active={true}
                    spinner
                    text="Please wait..."
                    styles={{
                        wrapper: {
                            position: 'fixed',
                            width: '100%',
                            height: '100vh',
                            zIndex: this.state.isLoading ? 999 : 0
                        }
                    }}
                />
                <Modal
                    isOpen={this.props.modalIsOpen}
                    onRequestClose={this.props.closeModal}
                    style={customStyles}
                    contentLabel="Deposit Modal"
                >
                        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
                            <div className="modal-body edit-modal-body deposit-modal-body">
                                <button className="btn-close" onClick={this.props.closeModal}>×</button>
                                <h2>WITHDRAW</h2>
                                <div className="modal-content-wrapper">
                                    <div className="modal-content-panel">
                                        <div><span>MINIMUM WITHDRAWAL:&nbsp;&nbsp;&nbsp;20 BUSD</span></div>
                                        <div className='balance'>
                                        <label className="availabletag">
                                            <span>IN-GAME BALANCE</span>:&nbsp;{convertToCurrency(this.state.balance)}
                                            </label>
                                            </div>
                                <div className="input-amount">
                                    <input pattern="[0-9]*" type="text" value={this.state.amount} onChange={this.handleAmountChange} className="form-control" />
                                    <span>
                                        BUSD
                                    </span>
                                    </div>
                                    
                                <button className={styles.join('')} onClick={() => {
                                    this.toggleBtnHandler();
                                    this.copy();
                                }}><FaClipboard />&nbsp;{text}</button>
                                
                                    <div className="modal-action-panel">
                                        <button className="btn-submit" onClick={this.send}>Withdraw</button>
                                        <button className="btn-back" onClick={this.props.closeModal}>CANCEL</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            </>
        )
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
