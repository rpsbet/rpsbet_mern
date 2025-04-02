import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { warningMsgBar, infoMsgBar } from '../../../../redux/Notification/notification.actions';
import { getLoan, deleteLoan } from '../../../../redux/Loan/loan.action';
import CreateProductForm from './CreateProductForm';

function ProductCreatePage({ closeProductCreateModal, updateTextField }) {
  const dispatch = useDispatch();

  // Map state from Redux using useSelector
  const { _id, loan_amount, loan_period, apy, startDateTime, expireDateTime } = useSelector(
    (state) => ({
      _id: state.loanReducer._id,
      loan_amount: state.loanReducer.loan_amount,
      loan_period: state.loanReducer.loan_period,
      apy: state.loanReducer.apy,
      startDateTime: state.loanReducer.startDateTime,
      expireDateTime: state.loanReducer.expireDateTime,
    }),
  );

  const handleCancel = () => {
    closeProductCreateModal();
    // For now, assuming navigation is handled elsewhere or not required
  };

  return (
    <>
      <CreateProductForm
        handelCancel={handleCancel} // Typo in original prop name preserved; should be handleCancel
        updateTextField={updateTextField}
      />
    </>
  );
}

export default ProductCreatePage;