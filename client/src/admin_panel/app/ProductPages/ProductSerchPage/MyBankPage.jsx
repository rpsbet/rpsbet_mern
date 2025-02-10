import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import MyBankTable from './MyBankTable';

const MyBankPage = () => {


  return (
    <>
      <MyBankTable />
    </>
  );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
  warningMsgBar,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyBankPage);