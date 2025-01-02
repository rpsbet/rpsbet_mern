import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import {
  closeConfirmTradeModal
} from '../../redux/Notification/notification.actions';
import { confirmTrade, addNewTransaction } from '../../redux/Logic/logic.actions';
import { Button, TextField } from '@material-ui/core';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance } from '../../redux/Auth/user.actions';
import { acQueryItem } from '../../redux/Item/item.action';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import progress from '../LottieAnimations/progress.json';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 99,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    background: 'transparent',
    border: 'none'
  }
};

class ConfirmTradeModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      item: '',
      owner: '',
      price: 0,
      productName: '',
      loading: false
    };
  }
 
  onBtnOkClicked = async e => {
    const { item, owner, closeConfirmTradeModal, setBalance, addNewTransaction, isDarkMode, confirmTrade, acQueryItem } = this.props;
  
    // Set loading to true before starting the async operation
    this.setState({ loading: true });
  
    const response = await confirmTrade({ item_id: item, owner: owner });
  
    if (response.success) {
      const { balance, newTransaction, message } = response;
  
      // Handle success: Update balance, transaction and close the modal
      setBalance(balance);
      addNewTransaction(newTransaction);
      acQueryItem(40, 1, 'price', '653ee81117c9f5ee2124564b');
      alertModal(isDarkMode, message, '-cat');
    } else {
      // Handle failure: Show error message
      alertModal(isDarkMode, response.message);
    }
  
    // Close modal and reset loading state
    closeConfirmTradeModal();
    this.setState({ loading: false });
  };

  onBtnCancelClicked = e => {
    this.props.closeConfirmTradeModal();
  };

  render() {
    const { isOpen, isDarkMode, productName, price, closeConfirmTradeModal, rentOption, solPrice } = this.props;
    const { loading } = this.state;
    const defaultOptions = {
      loop: true,
      autoplay: true,
      animationData: progress,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice'
      }
    };
    return (
      <Modal isOpen={isOpen} style={customStyles}>
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            {!loading ? (
              <>
                <div className={`modal-icon result-icon-trade`}></div>
                <h5>
                  {rentOption ? 'RENT ' : 'PURCHASE '}
                  <span style={{ color: '#ffd000' }}> 1 x '{productName}' </span>?
                </h5>
                <h6>
                  Click {rentOption ? 'RENT' : 'TRADE'} to{' '}
                  {rentOption ? (
                    <span>pay {convertToCurrency(price, solPrice)} per month</span>
                  ) : (
                    <span>exchange for [{convertToCurrency(price, solPrice)}]</span>
                  )}
                </h6>
              </>
            ) : (
              // Display Lottie animation when tnxComplete is false (processing trade)
              <div className="loading-animation-container">
                <Lottie options={defaultOptions} height={40} width={210} />
                <h5 style={{ color: '#ffd000' }}>PROCESSING TRADE...</h5>
              </div>
            )}
          </div>

          {!loading && (
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.onBtnOkClicked}>
                {rentOption ? 'RENT' : 'TRADE'}
              </Button>
              <Button className="btn-back" onClick={closeConfirmTradeModal}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  isOpen: state.snackbar.showConfirmTradeModal,
  title: state.snackbar.title,
  item: state.itemReducer._id,
  owner: state.itemReducer.data.owner,
  rentOption: state.itemReducer.data.rentOption,
  price: state.itemReducer.data.price,
  productName: state.itemReducer.data.productName,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  closeConfirmTradeModal,
  confirmTrade,
  setBalance,
  addNewTransaction,
  acQueryItem
};

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmTradeModal);
