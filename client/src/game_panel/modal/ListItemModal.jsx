import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { closeListItemModal } from '../../redux/Notification/notification.actions';
import { listItem } from '../../redux/Logic/logic.actions';
import { Button, TextField, Radio, RadioGroup, FormControlLabel } from '@material-ui/core';
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
  },
};

class ListItemModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      item: '',
      itemType: '',
      price: 0,
      rentOption: false,
      showOverrideConfirmation: false,
    };
  }

  onBtnOkClicked = async (e) => {
    const { price, rentOption } = this.state;
    const {
      onSale,
      oldPrice,
      oldRentOption,
      listItem,
    } = this.props;

    // Check if onsale > 0 and price or rentOption is different
    if (onSale > 0 && (price !== oldPrice || rentOption !== oldRentOption)) {
      // Show custom confirmation modal
      this.setState({ showOverrideConfirmation: true });
    } else {
      // Continue with the listItem API call
      this.handleListItem();
    }
  };

  handleOverrideConfirmation = async () => {
    // Close the current modal
    this.props.closeListItemModal();

    // Continue with the listItem API call
    this.handleListItem();
  };

  handleListItem = async () => {
    const { price, rentOption } = this.state;
    const { item, closeListItemModal, isDarkMode, listItem } = this.props;

    const response = await listItem({ item_id: item, price: price, rentOption: rentOption });
    if (response.success) {
      const { message } = response;

      closeListItemModal();
      alertModal(isDarkMode, message);
      this.setState({showOverrideConfirmation: false})
    } else {
      alertModal(isDarkMode, response.message);
    }
  };

  onBtnCancelClicked = (e) => {
    this.props.closeListItemModal();
  };

  handleRentOptionChange = (event) => {
    this.setState({ rentOption: event.target.value === 'rent' });
  };

  render() {
    const { price, rentOption, showOverrideConfirmation } = this.state;
    const { itemType, productName, isLowGraphics } = this.props;

    return (
      <>
        <Modal isOpen={this.props.isOpen} style={customStyles}>
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-body alert-body password-modal-body">
              <div className={`modal-icon result-icon-trade`}></div>
              <h5>
                CONFIRM <span style={{ color: '#ffd000' }}>{productName}</span> LISTING
              </h5>
              {itemType === '653ee81117c9f5ee2124564b' && (
                <RadioGroup
                  aria-label="rentOption"
                  name="rentOption"
                  value={rentOption ? 'rent' : 'sell'}
                  onChange={this.handleRentOptionChange}
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
                  variant="outlined"
                  id="rentPrice"
                  label="Rent price"
                  value={price}
                  onChange={(e) => this.setState({ price: e.target.value })}
                  placeholder="0.0002"
                  inputProps={{
                    pattern: '^\\d*\\.?\\d*$',
                    maxLength: 9,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: 'ETH / month',
                  }}
                />
              ) : (
                <TextField
                  type="text"
                  name="price"
                  variant="outlined"
                  id="price"
                  label="Set price"
                  value={price}
                  onChange={(e) => this.setState({ price: e.target.value })}
                  placeholder="0.0002"
                  inputProps={{
                    pattern: '^\\d*\\.?\\d*$',
                    maxLength: 9,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: 'ETH',
                  }}
                />
              )}
            </div>
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.onBtnOkClicked}>
                Confirm
              </Button>
              <Button className="btn-back" onClick={this.props.closeListItemModal}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showOverrideConfirmation} style={customStyles}>
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-body alert-body password-modal-body">
              <div className={`modal-icon result-icon-prize`}></div>
            <h5>You have this item already listed but with different settings, click confirm to override with these new settings</h5>
            <Button onClick={this.handleOverrideConfirmation}>Confirm</Button>
            <Button onClick={() => this.setState({ showOverrideConfirmation: false })}>Cancel</Button>
          </div>
          </div>
        </Modal>
      </>
    );
  }
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
