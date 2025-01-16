import React from 'react';
import { connect } from 'react-redux';
import { warningMsgBar, infoMsgBar } from '../../../../redux/Notification/notification.actions';
import { getLoan, deleteLoan } from '../../../../redux/Loan/loan.action';
import history from '../../../../redux/history';
import CreateProductForm from './CreateProductForm';

const ProductCreatePage = ({ closeProductCreateModal, updateTextField }) => {
  const handleCancel = () => {
    closeProductCreateModal();
    history.push('/product/');
  };

  return (
    <>
      <CreateProductForm
        handelCancel={handleCancel}
        updateTextField={updateTextField}
      />
    </>
  );
};

const mapStateToProps = (state) => ({
  _id: state.loanReducer._id,
  loan_amount: state.loanReducer.loan_amount,
  loan_period: state.loanReducer.loan_period,
  apy: state.loanReducer.apy,
  startDateTime: state.loanReducer.startDateTime,
  expireDateTime: state.loanReducer.expireDateTime,
});

const mapDispatchToProps = {
  warningMsgBar,
  infoMsgBar,
  getLoan,
  deleteLoan,
};

export default connect(mapStateToProps, mapDispatchToProps)(ProductCreatePage);