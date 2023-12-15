import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { closeListLoanModal } from '../../redux/Notification/notification.actions';
import { listLoan } from '../../redux/Logic/logic.actions';
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

class ListLoanModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loan: '',
      price: 0
    };
  }
  onBtnOkClicked = async e => {
    const { price } = this.state;
    const { loan, closeListLoanModal, isDarkMode, listLoan } = this.props;
    const response = await listLoan({ loan_id: loan, price: price });
    if (response.success) {
      const { message } = response;

      closeListLoanModal();
      alertModal(isDarkMode, message);
    } else {
      alertModal(isDarkMode, response.message);
    }
  };

  onBtnCancelClicked = e => {
    this.props.closeListLoanModal();
  };

  render() {

    const { price } = this.state;
    return (
      <Modal isOpen={this.props.isOpen} style={customStyles}>
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className={`modal-icon result-icon-trade`}></div>
            <h5>CONFIRM LISTING</h5>
            <h6>{this.props.loan}</h6>
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
              onClick={this.props.closeListLoanModal}
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
  loan: state.loanReducer._id,
  isOpen: state.snackbar.showListLoanModal,
  price: state.loanReducer.data.price,
  loan_amount: state.loanReducer.data.loan_amount,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType
});

const mapDispatchToProps = {
  closeListLoanModal,
  listLoan
  // setBalance,
  // addNewTransaction,
};

export default connect(mapStateToProps, mapDispatchToProps)(ListLoanModal);
