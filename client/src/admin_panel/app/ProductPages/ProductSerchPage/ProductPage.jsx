import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { setUrl } from '../../../../redux/Auth/user.actions';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryItem } from '../../../../redux/Item/item.action';
// import ContainerHeader from '../../../../components/ContainerHeader';
import ProductTable from './ProductTable';

export class ProductPage extends Component {

  componentDidMount() {
    // this.props.setUrl(this.props.match.path);
    this.props.acQueryItem(30, 1, 'price', '653ee81117c9f5ee2124564b');
    
  }

  render() {
    return (
      <>
        {/* <ContainerHeader
          title={'Manage Rooms'}
        /> */}
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
