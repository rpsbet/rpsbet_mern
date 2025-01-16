import React, { useState } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { closeListItemModal } from '../../redux/Notification/notification.actions';
import { listItem } from '../../redux/Logic/logic.actions';
import {
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  InputAdornment,
} from '@material-ui/core';
import { alertModal } from './ConfirmAlerts';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 99,
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

function ListItemModal(props) {
  const {
    isOpen,
    isDarkMode,
    onSale,
    oldPrice,
    oldRentOption,
    productName,
    itemType,
    closeListItemModal,
    listItem, // from mapDispatchToProps
  } = props;

  const [price, setPrice] = useState(0);
  const [rentOption, setRentOption] = useState(false);
  const [showOverrideConfirmation, setShowOverrideConfirmation] = useState(false);

  const onBtnOkClicked = () => {
    // Check if item is already on sale and price/rentOption changed
    if (onSale > 0 && (price !== oldPrice || rentOption !== oldRentOption)) {
      // Show custom confirmation modal
      setShowOverrideConfirmation(true);
    } else {
      // Otherwise, proceed with listing
      handleListItem();
    }
  };

  const handleOverrideConfirmation = async () => {
    closeListItemModal();
    handleListItem();
  };

  const handleListItem = async () => {
    // 'item' prop contains the item ID from mapStateToProps
    const { item } = props;

    const response = await listItem({
      item_id: item,
      price: price,
      rentOption: rentOption,
    });
    if (response.success) {
      const { message } = response;
      closeListItemModal();
      alertModal(isDarkMode, message, '-cat');
      setShowOverrideConfirmation(false);
    } else {
      alertModal(isDarkMode, response.message);
    }
  };

  const onBtnCancelClicked = () => {
    closeListItemModal();
  };

  const handleRentOptionChange = (event) => {
    setRentOption(event.target.value === 'rent');
  };

  return (
    <>
      {/* Main Modal */}
      <Modal isOpen={isOpen} style={customStyles}>
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className="modal-icon result-icon-trade"></div>
            <h5>
              CONFIRM{' '}
              <span style={{ color: '#ffd000' }}>{productName}</span> LISTING
            </h5>

            {itemType === '653ee81117c9f5ee2124564b' && (
              <RadioGroup
                aria-label="rentOption"
                name="rentOption"
                value={rentOption ? 'rent' : 'sell'}
                onChange={handleRentOptionChange}
                style={{
                  marginBottom: '10px',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <FormControlLabel value="sell" control={<Radio />} label="SELL" />
                &nbsp;&nbsp;&nbsp;
                <FormControlLabel value="rent" control={<Radio />} label="RENT OUT" />
              </RadioGroup>
            )}

            {rentOption ? (
              <TextField
                type="text"
                name="rentPrice"
                variant="filled"
                id="rentPrice"
                label="Rent price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.0002"
                inputProps={{
                  pattern: '^\\d*\\.?\\d*$',
                  maxLength: 9,
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">&nbsp;RPS / MONTH</InputAdornment>
                  ),
                }}
              />
            ) : (
              <TextField
                type="text"
                name="price"
                variant="filled"
                id="price"
                label="Set price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.0002"
                inputProps={{
                  pattern: '^\\d*\\.?\\d*$',
                  maxLength: 9,
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">&nbsp;RPS</InputAdornment>
                  ),
                }}
              />
            )}
          </div>
          <div className="modal-footer">
            <Button className="btn-submit" onClick={onBtnOkClicked}>
              Confirm
            </Button>
            <Button className="btn-back" onClick={onBtnCancelClicked}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Override Confirmation Modal */}
      <Modal isOpen={showOverrideConfirmation} style={customStyles}>
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className="modal-icon result-icon-prize"></div>
            <h5>
              You have this item already listed but with different settings; click
              confirm to override with these new settings
            </h5>
            <Button onClick={handleOverrideConfirmation}>Confirm</Button>
            <Button onClick={() => setShowOverrideConfirmation(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  title: state.snackbar.title,
  item: state.itemReducer._id,
  itemType: state.itemReducer.data.item_type,
  isOpen: state.snackbar.showListItemModal,
  oldPrice: state.itemReducer.data.price,
  isLowGraphics: state.auth.isLowGraphics,
  productName: state.itemReducer.data.productName,
  onSale: state.itemReducer.data.onSale,
  oldRentOption: state.itemReducer.data.rentOption,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType,
});

const mapDispatchToProps = {
  closeListItemModal,
  listItem,
};

export default connect(mapStateToProps, mapDispatchToProps)(ListItemModal);