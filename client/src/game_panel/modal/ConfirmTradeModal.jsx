import React, { useState } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import {
  closeConfirmTradeModal
} from '../../redux/Notification/notification.actions';
import { confirmTrade, addNewTransaction } from '../../redux/Logic/logic.actions';
import { Button } from '@mui/material';
import { alertModal } from '../modal/ConfirmAlerts';
import { acQueryItem } from '../../redux/Item/item.action';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import progress from '../LottieAnimations/progress.json';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 10000,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    background: 'transparent',
    border: 'none'
  }
};

function ConfirmTradeModal(props) {
  const {
    isOpen,
    isDarkMode,
    productName,
    price,
    rentOption,
    solPrice,
    item, 
    owner,
    closeConfirmTradeModal,
    confirmTrade,
    addNewTransaction,
    acQueryItem
  } = props;

  // Local state for loading
  const [loading, setLoading] = useState(false);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: progress,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  // Handler for the confirm (OK) button
  const onBtnOkClicked = async () => {
    setLoading(true); // start loading

    const response = await confirmTrade({ item_id: item, owner });

    if (response.success) {
      const { newTransaction, message } = response;
      addNewTransaction(newTransaction);
      acQueryItem(40, 1, 'price', '653ee81117c9f5ee2124564b');
      alertModal(isDarkMode, message, '-cat');
    } else {
      alertModal(isDarkMode, response.message);
    }

    closeConfirmTradeModal();
    setLoading(false); // stop loading
  };

  // Handler for the cancel button
  const onBtnCancelClicked = () => {
    closeConfirmTradeModal();
  };

  return (
    <Modal isOpen={isOpen} style={customStyles}>
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-body alert-body password-modal-body">
          {!loading ? (
            <>
              <div className="modal-icon result-icon-trade" />
              <h5>
                {rentOption ? 'RENT ' : 'PURCHASE '}
                <span style={{ color: '#ffd000' }}>1 x '{productName}'</span>?
              </h5>
              <h6>
                Click {rentOption ? 'RENT' : 'TRADE'} to{' '}
                {rentOption ? (
                  <span>
                    pay {convertToCurrency(price, solPrice)} per month
                  </span>
                ) : (
                  <span>
                    exchange for [{convertToCurrency(price, solPrice)}]
                  </span>
                )}
              </h6>
            </>
          ) : (
            // Display Lottie animation while loading
            <div className="loading-animation-container">
              <Lottie options={defaultOptions} height={40} width={210} />
              <h5 style={{ color: '#ffd000' }}>PROCESSING TRADE...</h5>
            </div>
          )}
        </div>

        {!loading && (
          <div className="modal-footer">
            <Button variant='contained' color='error' onClick={onBtnOkClicked}>
              {rentOption ? 'RENT' : 'TRADE'}
            </Button>
            <Button variant='contained' color='error' onClick={onBtnCancelClicked}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  isOpen: state.snackbar.showConfirmTradeModal,
  title: state.snackbar.title,
  item: state.itemReducer._id,
  owner: state.itemReducer.data.owner,
  rentOption: state.itemReducer.data.rentOption,
  price: state.itemReducer.data.price,
  productName: state.itemReducer.data.productName,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType,
  solPrice: state.logic.solPrice
});

const mapDispatchToProps = {
  closeConfirmTradeModal,
  confirmTrade,
  addNewTransaction,
  acQueryItem
};

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmTradeModal);