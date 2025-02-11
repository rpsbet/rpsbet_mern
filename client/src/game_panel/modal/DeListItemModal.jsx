import React from 'react';
import Modal from 'react-modal';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeDeListItemModal,
  errorMsgBar,
} from '../../redux/Notification/notification.actions';
import { deListItem } from '../../redux/Logic/logic.actions';
import { Button } from '@mui/material';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
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

const DeListItemModal = () => {
  const dispatch = useDispatch();
  const { isDarkMode, isOpen, item } = useSelector((state) => ({
    isDarkMode: state.auth.isDarkMode,
    isOpen: state.snackbar.showDeListItemModal,
    item: state.itemReducer._id,
  }));

  const handleConfirm = async () => {
    const response = await dispatch(deListItem({ item_id: item }));
    if (response.success) {
      dispatch(closeDeListItemModal());
      dispatch(errorMsgBar(response.message));
    } else {
      dispatch(errorMsgBar(response.message));
    }
  };

  const handleCancel = () => {
    dispatch(closeDeListItemModal());
  };

  return (
    <Modal isOpen={isOpen || false} style={customStyles}>
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-body alert-body password-modal-body">
          <div className={`modal-icon result-icon-trade`}></div>
          <h5>CONFIRM DE-LISTING</h5>
          <br />
          <h6>Are you sure you want to remove item from sale?</h6>
          <br />
        </div>
        <div className="modal-footer">
          <Button variant="contained" color="error" onClick={handleConfirm}>
            CONFIRM
          </Button>
          <Button variant="contained" color="error" onClick={handleCancel}>
            CANCEL
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeListItemModal;
