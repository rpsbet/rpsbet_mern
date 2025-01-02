import React, { Component } from 'react';
import { connect } from 'react-redux';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryMyItem } from '../../../../redux/Item/item.action';
import MyProductTable from './MyProductTable';

export class MyProductPage extends Component {


  render() {
    return (
      <>

        <MyProductTable />
      </>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  // setUrl,
  warningMsgBar,
  acQueryMyItem
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyProductPage);
