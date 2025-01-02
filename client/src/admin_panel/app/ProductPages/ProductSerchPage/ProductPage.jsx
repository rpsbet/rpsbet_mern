import React, { Component } from 'react';
import { connect } from 'react-redux';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryItem } from '../../../../redux/Item/item.action';
import ProductTable from './ProductTable';

export class ProductPage extends Component {

  componentDidMount() {
    this.props.acQueryItem(100, 1, 'price', '653ee81117c9f5ee2124564b');
    
  }

  render() {
    return (
      <>
        <ProductTable />
      </>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  // setUrl,
  warningMsgBar,
  acQueryItem
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProductPage);
