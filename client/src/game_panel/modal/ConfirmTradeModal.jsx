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
    background: 'transparent'
  }
};

class ConfirmTradeModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      item: '',
      owner: '',
      price: 0,
      productName: ''
    };
  }
  onBtnOkClicked = async e => {
    const { item, owner, closeConfirmTradeModal, setBalance, addNewTransaction, isDarkMode, confirmTrade, acQueryItem } = this.props;

    const response = await confirmTrade({ item_id: item, owner: owner });

    if (response.success) {
      const { balance, newTransaction, message } = response;

      closeConfirmTradeModal();
      alertModal(isDarkMode, message, '-cat');
      setBalance(balance);
      addNewTransaction(newTransaction);
      acQueryItem(30, 1, 'price', '653ee7ac17c9f5ee21245649');
    } else {
      closeConfirmTradeModal();
      alertModal(isDarkMode, response.message);
    }
  };



  onBtnCancelClicked = e => {
    this.props.closeConfirmTradeModal();
  };

  render() {
    const { isOpen, isDarkMode, productName, price, closeConfirmTradeModal, rentOption } = this.props;

    return (
      <Modal isOpen={isOpen} style={customStyles}>
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className={`modal-icon result-icon-trade`}></div>
            <h5>
              {rentOption ? 'RENT ' : 'PURCHASE '}
              <span style={{ color: "#ffd000" }}> 1 x '{productName}' </span>?
            </h5>
            <h6>
              Click {rentOption ? 'RENT' : 'TRADE'} to{' '}
              {rentOption ? (
                <span>
                  pay {convertToCurrency(price)} per month
                </span>
              ) : (
                <span>
                  exchange for [{convertToCurrency(price)}]
                </span>
              )}
            </h6>

          </div>
          <div className="modal-footer">
            <Button className="btn-submit" onClick={this.onBtnOkClicked}>
              {rentOption ? 'RENT' : 'TRADE'}
            </Button>
            <Button className="btn-back" onClick={closeConfirmTradeModal}>
              Cancel
            </Button>
          </div>
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
});

const mapDispatchToProps = {
  closeConfirmTradeModal,
  confirmTrade,
  setBalance,
  addNewTransaction,
  acQueryItem
};

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmTradeModal);
