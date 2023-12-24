import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setUrl } from '../../../../redux/Auth/user.actions';
import ContainerHeader from '../../../../components/ContainerHeader';
import { getLoan, updateLoan, deleteLoan} from '../../../../redux/Loan/loan.action';
import CreateProductForm from './CreateProductForm';
import { warningMsgBar, infoMsgBar } from '../../../../redux/Notification/notification.actions';
import history from '../../../../redux/history';
import { Button } from '@material-ui/core';

class ProductCreatePage extends Component {
  state = {
    // startDateTime: new Date(),
    // expireDateTime: new Date(),
    // buttonDisable: true,
  };

  // static getDerivedStateFromProps(props, state) {
  //   return {
  //     _id: props._id,
  //     loan_amount: props.loan_amount,
  //     loan_period: props.loan_period,
  //     apy: props.apy,
  //     // startDateTime: props.startDateTime,
  //     // expireDateTime: props.expireDateTime,
  //   };
  // }

  componentDidMount() {
    // this.props.getLoan();
  }

  // setOnDelete = () => {
  //   this.props.deleteLoan(this.state._id);
  //   this.handelCancel();
  // };

  handelCancel = () => {
    this.setState({
      buttonDisable: true,
    });
    this.props.closeProductCreateModal();

    history.push(`/product/`);
  };


  // onSaveForm = e => {
  //   e.preventDefault();
  //   console.log(this.state);
  //   this.props.infoMsgBar(`New Loan Listed!`);
  //   this.props.updateLoan(this.state);
  //   this.handelCancel();
  // };


 
  render() {
    return (
      <>
        <CreateProductForm
          handelCancel={this.handelCancel}
          updateTextField={this.props.updateTextField}
          // onSaveForm={this.onSaveForm}
          // setOnDelete={this.setOnDelete}
          />
      </>
    );
  }
}

const mapStateToProps = state => ({
  _id: state.loanReducer._id,
  loan_amount: state.loanReducer.loan_amount,
  loan_period: state.loanReducer.loan_period,
  apy: state.loanReducer.apy,
  startDateTime: state.loanReducer.startDateTime,
  expireDateTime: state.loanReducer.expireDateTime
});

const mapDispatchToProps = {
  // setUrl,
  warningMsgBar,
  infoMsgBar,
  getLoan,
  // updateLoan,
  deleteLoan,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProductCreatePage);
