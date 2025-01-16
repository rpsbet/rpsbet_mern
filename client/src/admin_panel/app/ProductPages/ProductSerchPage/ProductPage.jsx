import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryItem } from '../../../../redux/Item/item.action';
import ProductTable from './ProductTable';

const ProductPage = ({ acQueryItem }) => {
  useEffect(() => {
    acQueryItem(100, 1, 'price', '653ee81117c9f5ee2124564b');
  }, [acQueryItem]);

  return (
    <>
      <ProductTable />
    </>
  );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
  warningMsgBar,
  acQueryItem
};

export default connect(mapStateToProps, mapDispatchToProps)(ProductPage);