import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { setUrl } from '../../../../redux/Auth/user.actions';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryMyItem } from '../../../../redux/Item/item.action';
// import ContainerHeader from '../../../../components/ContainerHeader';
import MyProductTable from './MyProductTable';

export class MyProductPage extends Component {
  componentDidMount() {
    // this.props.setUrl(this.props.match.path);
    this.props.acQueryMyItem(30, 1, 'price', '653ee81117c9f5ee2124564b');
    // console.log(this.props)
  }

  render() {
    return (
      <>
        {/* <ContainerHeader
          title={'Manage Rooms'}
        /> */}
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
