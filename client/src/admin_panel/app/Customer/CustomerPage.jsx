import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setUrl } from '../../../redux/Auth/user.actions';
import ContainerHeader from '../../../components/ContainerHeader';
import CustomerTable from './CustomerTable';
import { queryCustomer } from '../../../redux/Customer/customer.action';

class CustomerPage extends Component {
  componentDidMount() {
    this.props.setUrl(this.props.match.path);
    this.props.queryCustomer(10, 1);
  }

  render() {
    return (
      <>
        <ContainerHeader
          title={'Customers'}
        />
        <CustomerTable />
      </>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  setUrl,
  queryCustomer
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomerPage);
