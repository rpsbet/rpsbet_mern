import React, { useState } from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import { closeConfirmTradeModal, errorMsgBar } from '../../redux/Notification/notification.actions';
import { confirmTrade, addNewTransaction } from '../../redux/Logic/logic.actions';
import { acQueryItem } from '../../redux/Item/item.action';
import { Button } from '@mui/material';
import { convertToCurrency } from '../../util/conversion';
import Lottie from 'react-lottie';
import progress from '../LottieAnimations/progress.json';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 10000,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    background: 'transparent',
    border: 'none',
  },
};

const ConfirmTradeModal = () => {
  const dispatch = useDispatch();

  // Access redux state via hooks
  const isDarkMode = useSelector(state => state.auth.isDarkMode);
  const isOpen = useSelector(state => state.snackbar.showConfirmTradeModal);
  const item = useSelector(state => state.itemReducer._id);
  const owner = useSelector(state => state.itemReducer.data.owner);
  const rentOption = useSelector(state => state.itemReducer.data.rentOption);
  const price = useSelector(state => state.itemReducer.data.price);
  const productName = useSelector(state => state.itemReducer.data.productName);
  const solPrice = useSelector(state => state.logic.solPrice);

  // Local loading state
  const [loading, setLoading] = useState(false);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: progress,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  const onBtnOkClicked = async () => {
    setLoading(true); // start loading
    const response = await dispatch(confirmTrade({ item_id: item, owner }));
    if (response.success) {
      const { newTransaction, message } = response;
      dispatch(addNewTransaction(newTransaction));
      dispatch(acQueryItem(40, 1, 'price', '653ee81117c9f5ee2124564b'));
      dispatch(errorMsgBar(message));
    } else {
      dispatch(errorMsgBar(response.message));
    }
    dispatch(closeConfirmTradeModal());
    setLoading(false); // stop loading
  };

  const onBtnCancelClicked = () => {
    dispatch(closeConfirmTradeModal());
  };

  return (
    <Modal isOpen={isOpen || false} style={customStyles}>
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
            <div className="loading-animation-container">
              <Lottie options={defaultOptions} height={40} width={210} />
              <h5 style={{ color: '#ffd000' }}>PROCESSING TRADE...</h5>
            </div>
          )}
        </div>
        {!loading && (
          <div className="modal-footer">
            <Button variant="outlined" color="error" onClick={onBtnOkClicked}>
              {rentOption ? 'RENT' : 'TRADE'}
            </Button>
            <Button variant="outlined" color="error" onClick={onBtnCancelClicked}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmTradeModal;