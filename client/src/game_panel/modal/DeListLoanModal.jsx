import React from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeDeListLoanModal,
} from '../../redux/Notification/notification.actions';
import {
  acQueryMyLoan,
  acQueryLoan,
  acCalculateRemainingLoans,
} from '../../redux/Loan/loan.action';
import { Button } from '@mui/material';
import { alertModal } from './ConfirmAlerts';
import { getUser } from '../../redux/Auth/user.actions';
import { deListLoan } from '../../redux/Logic/logic.actions';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    background: 'transparent',
    border: 'none',
  },
};

const DeListLoanModal = () => {
  const dispatch = useDispatch();

  const {
    isDarkMode,
    isOpen,
    loan,
  } = useSelector((state) => ({
    isDarkMode: state.auth.isDarkMode,
    isOpen: state.snackbar.showDeListLoanModal,
    loan: state.loanReducer._id,
  }));

  const handleConfirm = async () => {
    const response = await dispatch(deListLoan({ loan_id: loan }));
    if (response.success) {
      const { message } = response;
      alertModal(isDarkMode, message, '-cat');

      await dispatch(acQueryMyLoan(30, 1, 'loan_amount', ''));
      await dispatch(acQueryLoan(30, 1, 'loan_amount', ''));
      // await dispatch(acCalculateRemainingLoans());
      await dispatch(getUser(true, 5));

      dispatch(closeDeListLoanModal());
    } else {
      alertModal(isDarkMode, response.message);
    }
  };

  const handleCancel = () => {
    dispatch(closeDeListLoanModal());
  };

  return (
    <Modal
      isOpen={isOpen}
      style={customStyles}
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-body alert-body password-modal-body">
          <div className="modal-icon result-icon-prize"></div>
          <h5>WITHDRAW FUNDS?</h5>
          <br />
          <h6>Delete this loan and return funds to your wallet?</h6>
          <br />
        </div>
        <div className="modal-footer">
          <Button variant='contained' color='error' onClick={handleConfirm}>
            CONFIRM
          </Button>
          <Button variant='contained' color='secondary' onClick={handleCancel}>
            CANCEL
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeListLoanModal;