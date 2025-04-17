import React, { useState } from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import {
  errorMsgBar,
  closeDeListLoanModal,
  successMsgBar,
} from '../../redux/Notification/notification.actions';
import {
  acQueryMyLoan,
  acQueryLoan,
  acCalculateRemainingLoans,
} from '../../redux/Loan/loan.action';
import { Button, CircularProgress } from '@mui/material';
import { getUser } from '../../redux/Auth/user.actions';
import { deListLoan } from '../../redux/Logic/logic.actions';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 999999,
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

  const { isDarkMode, isOpen, loan } = useSelector((state) => ({
    isDarkMode: state.auth.isDarkMode,
    isOpen: state.snackbar.showDeListLoanModal,
    loan: state.loanReducer._id,
  }));

  // Local loading state to show spinner and disable the CONFIRM button
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true); // Start loading
    const response = await dispatch(deListLoan({ loan_id: loan }));
    setLoading(false); // Stop loading

    if (response.success) {
      dispatch(successMsgBar(response.message));
      await dispatch(acQueryMyLoan(30, 1, 'loan_amount', ''));
      await dispatch(acQueryLoan(30, 1, 'loan_amount', ''));
      await dispatch(acCalculateRemainingLoans());
      await dispatch(getUser());
      dispatch(closeDeListLoanModal());
    } else {
      dispatch(errorMsgBar(response.message));
    }
  };

  const handleCancel = () => {
    dispatch(closeDeListLoanModal());
  };

  return (
    <Modal isOpen={isOpen || false} style={customStyles}>
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-body alert-body password-modal-body">
          <div className="modal-icon result-icon-prize"></div>
          <h5>WITHDRAW FUNDS?</h5>
          <br />
          <h6>Delete this loan and return funds to your wallet?</h6>
          <br />
        </div>
        <div className="modal-footer">
          <Button
            variant="outlined"
            color="error"
            onClick={handleConfirm}
            disabled={loading} // Disable while loading
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'CONFIRM'
            )}
          </Button>
          <Button variant="outlined" color="error" onClick={handleCancel}>
            CANCEL
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeListLoanModal;
