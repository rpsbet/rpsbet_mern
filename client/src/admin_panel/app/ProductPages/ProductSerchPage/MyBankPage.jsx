import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryMyLoan } from '../../../../redux/Loan/loan.action';
import MyBankTable from './MyBankTable';

const MyBankPage = ({ acQueryMyLoan }) => {
  useEffect(() => {
    acQueryMyLoan(30, 1, 'loan_amount', '');
  }, [acQueryMyLoan]);

  return (
    <>
      <MyBankTable />
    </>
  );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
  warningMsgBar,
  acQueryMyLoan,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyBankPage);