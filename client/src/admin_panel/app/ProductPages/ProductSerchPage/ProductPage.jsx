import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';

import ProductTable from './ProductTable';

const ProductPage = ({  }) => {

  return (
    <>
      <ProductTable />
    </>
  );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
  warningMsgBar,
};

export default connect(mapStateToProps, mapDispatchToProps)(ProductPage);