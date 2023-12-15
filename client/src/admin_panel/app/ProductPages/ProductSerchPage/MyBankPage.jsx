import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { setUrl } from '../../../../redux/Auth/user.actions';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryMyLoan } from '../../../../redux/Loan/loan.action';
// import ContainerHeader from '../../../../components/ContainerHeader';
import MyBankTable from './MyBankTable';

export class MyBankPage extends Component {
  componentDidMount() {
    // this.props.setUrl(this.props.match.path);
    this.props.acQueryMyLoan(30, 1, 'price', '653ee7ac17c9f5ee21245649');
    // console.log(this.props)
  }

  render() {
    return (
      <>
        {/* <ContainerHeader
          title={'Manage Rooms'}
        /> */}
        <MyBankTable />
      </>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  // setUrl,
  warningMsgBar,
  acQueryMyLoan
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyBankPage);
