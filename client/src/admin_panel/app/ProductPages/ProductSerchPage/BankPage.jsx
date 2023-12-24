import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { setUrl } from '../../../../redux/Auth/user.actions';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryLoan } from '../../../../redux/Loan/loan.action';
// import ContainerHeader from '../../../../components/ContainerHeader';
import BankTable from './BankTable';

export class BankPage extends Component {

  componentDidMount() {
    // this.props.setUrl(this.props.match.path);
    this.props.acQueryLoan(30, 1, 'loan_amount', 'standard');
    
  }

  render() {
    return (
      <>
        {/* <ContainerHeader
          title={'Manage Rooms'}
        /> */}
        <BankTable />
      </>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  // setUrl,
  warningMsgBar,
  acQueryLoan
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BankPage);
