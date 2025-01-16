import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryLoan } from '../../../../redux/Loan/loan.action';
import BankTable from './BankTable';

const BankPage = ({ acQueryLoan }) => {
  useEffect(() => {
    acQueryLoan(30, 1, 'loan_amount', '');
  }, [acQueryLoan]);

  return (
    <>
      <BankTable />
    </>
  );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
  warningMsgBar,
  acQueryLoan,
};

export default connect(mapStateToProps, mapDispatchToProps)(BankPage);