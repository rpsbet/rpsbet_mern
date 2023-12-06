import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { closeListItemModal } from '../../redux/Notification/notification.actions';
import { listItem } from '../../redux/Logic/logic.actions';
import { Button, TextField } from '@material-ui/core';
import { alertModal } from './ConfirmAlerts';
// import { setBalance } from '../../redux/Auth/user.actions';
// import { addNewTransaction } from '../../redux/Logic/logic.actions';

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

class ListItemModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      item: '',
      price: 0
    };
  }
  onBtnOkClicked = async e => {
    const { price } = this.state;
    const { item, closeListItemModal, isDarkMode, listItem } = this.props;
    const response = await listItem({ item_id: item, price: price });
    if (response.success) {
      const { message } = response;

      closeListItemModal();
      alertModal(isDarkMode, message);
    } else {
      alertModal(isDarkMode, response.message);
    }
  };

  onBtnCancelClicked = e => {
    this.props.closeListItemModal();
  };

  render() {

    const { price } = this.state;
    return (
      <Modal isOpen={this.props.isOpen} style={customStyles}>
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className={`modal-icon result-icon-trade`}></div>
            <h5>CONFIRM LISTING</h5>
            <h6>{this.props.item}</h6>
            <TextField
              type="text"
              name="price"
              variant="outlined"
              id="price"
              label="Set price"
              value={price}
              onChange={(e) => this.setState({ price: e.target.value })}
              placeholder="0.0002"
              inputProps={{
                pattern: '^\\d*\\.?\\d*$',
                maxLength: 9
              }}
              InputLabelProps={{
                shrink: true
              }}
              InputProps={{
                endAdornment: 'ETH'
              }}
            />
          </div>
          <div className="modal-footer">
            <Button className="btn-submit" onClick={this.onBtnOkClicked}>
              Confirm
            </Button>
            <Button
              className="btn-back"
              onClick={this.props.closeListItemModal}
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
  title: state.snackbar.title,
  item: state.itemReducer._id,
  isOpen: state.snackbar.showListItemModal,
  price: state.itemReducer.data.price,
  productName: state.itemReducer.data.productName,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType
});

const mapDispatchToProps = {
  closeListItemModal,
  listItem
  // setBalance,
  // addNewTransaction,
};

export default connect(mapStateToProps, mapDispatchToProps)(ListItemModal);
