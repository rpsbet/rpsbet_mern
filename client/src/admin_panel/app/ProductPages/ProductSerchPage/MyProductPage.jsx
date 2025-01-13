import React from 'react';
import { connect } from 'react-redux';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryMyItem } from '../../../../redux/Item/item.action';
import MyProductTable from './MyProductTable';

const MyProductPage = (solPrice) => {
  return (
    <>
      <MyProductTable solPrice={solPrice} />
    </>
  );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
  warningMsgBar,
  acQueryMyItem,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyProductPage);