import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import {
  closeDeListItemModal
} from '../../redux/Notification/notification.actions';
import { deListItem } from '../../redux/Logic/logic.actions';
import { Button, TextField } from '@material-ui/core';
import { alertModal } from './ConfirmAlerts';

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

class DeListItemModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      item: '',
    };
  }
  onBtnOkClicked = async e => {
    const { item, closeDeListItemModal, isDarkMode, deListItem } = this.props;
    const response = await deListItem({ item_id: item });
    if (response.success) {
      const { message } = response;
  
      closeDeListItemModal();
      alertModal(isDarkMode, message, '-cat');
      
    } else {
      alertModal(isDarkMode, response.message);
    }
  };
  

  onBtnCancelClicked = e => {
    this.props.closeDeListItemModal();
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
            <h5>CONFIRM DE-LISTING</h5>
            <br />
            <h6>Are you sure you want to remove item from sale?</h6> <br />
                      </div>
          <div className="modal-footer">
            <Button className="btn-submit" onClick={this.onBtnOkClicked}>
              CONFIRM
            </Button>
            <Button
              className="btn-back"
              onClick={this.props.closeDeListItemModal}
            >
              CANCEL
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  isOpen: state.snackbar.showDeListItemModal,
  title: state.snackbar.title,
  item: state.itemReducer._id,
  price: state.itemReducer.data.price,
  productName: state.itemReducer.data.productName,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType
});

const mapDispatchToProps = {
  closeDeListItemModal,
  deListItem,
};

export default connect(mapStateToProps, mapDispatchToProps)(DeListItemModal);
