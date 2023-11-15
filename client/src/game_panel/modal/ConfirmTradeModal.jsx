import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import {
  closeConfirmTradeModal
} from '../../redux/Notification/notification.actions';
import { confirmTrade } from '../../redux/Logic/logic.actions';
import { Button, TextField } from '@material-ui/core';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
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
    const { item, owner, closeConfirmTradeModal, setBalance, addNewTransaction, isDarkMode, confirmTrade} = this.props;
    const response = await confirmTrade({ item_id: item, owner: owner });
    // console.log(item, owner, response);
    if (response.success) {
      const { balance, newTransaction, message } = response;
  
      closeConfirmTradeModal();
      alertModal(isDarkMode, message);
      setBalance(balance);
      addNewTransaction(newTransaction);
    } else {
      alertModal(isDarkMode, response.message);
    }
  };
  

  onBtnCancelClicked = e => {
    this.props.closeConfirmTradeModal();
  };

  render() {
    return (
      <Modal
        isOpen={this.props.isOpen}
        style={customStyles}
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className={`modal-icon result-icon-trade`}></div>
            <h5>CONFIRM TRADE</h5>
            <h6>Confirm purchase of 1 x [ {this.props.productName} ] in exchange for [{convertToCurrency(this.props.price)} ]?</h6>
          </div>
          <div className="modal-footer">
            <Button className="btn-submit" onClick={this.onBtnOkClicked}>
              TRADE
            </Button>
            <Button
              className="btn-back"
              onClick={this.props.closeConfirmTradeModal}
            >
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
  price: state.itemReducer.data.price,
  productName: state.itemReducer.data.productName,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType
});

const mapDispatchToProps = {
  closeConfirmTradeModal,
  confirmTrade,
  setBalance,
  addNewTransaction,
};

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmTradeModal);
