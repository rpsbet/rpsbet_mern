import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryLoan } from '../../../../redux/Loan/loan.action';
import BankTable from './BankTable';

const BankPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(acQueryLoan(30, 1, 'loan_amount', ''));
  }, [dispatch]);

  return <BankTable />;
};

export default BankPage;