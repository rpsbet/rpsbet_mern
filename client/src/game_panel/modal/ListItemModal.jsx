import React, { useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import {
  closeListItemModal,
  errorMsgBar
} from '../../redux/Notification/notification.actions';
import {
  listItem
} from '../../redux/Logic/logic.actions';
import {
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  InputAdornment,
  Modal,
  Box,
  Typography
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

function ListItemModal(props) {
  const {
    isOpen,
    isDarkMode,
    onSale,
    oldPrice,
    oldRentOption,
    productName,
    itemType,
    item,
    closeListItemModal,
    listItem  // from mapDispatchToProps
  } = props;

  const [price, setPrice] = useState(0);
  const [rentOption, setRentOption] = useState(false);
  const [showOverrideConfirmation, setShowOverrideConfirmation] = useState(false);
  const dispatch = useDispatch();

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  // ------------------------------
  // MUI Modal Styles
  // ------------------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#1f1a25',  // Purple background
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 400,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const onBtnOkClicked = () => {
    // If item is already on sale and the user changes the price or rent option
    if (onSale > 0 && (price !== oldPrice || rentOption !== oldRentOption)) {
      setShowOverrideConfirmation(true);
    } else {
      // Otherwise, proceed directly
      handleListItem();
    }
  };

  const handleListItem = async () => {
    try {
      const response = await listItem({
        item_id: item,
        price: price,
        rentOption: rentOption
      });

      if (response.success) {
        dispatch(errorMsgBar(response.message));
        closeListItemModal();
        setShowOverrideConfirmation(false);
      } else {
        dispatch(errorMsgBar(response.message));
      }
    } catch (error) {
      console.error('Error listing item:', error);
      dispatch(errorMsgBar('Failed to list the item.'));
    }
  };

  const handleOverrideConfirmation = () => {
    closeListItemModal();
    handleListItem();
  };

  const onBtnCancelClicked = () => {
    closeListItemModal();
  };

  const handleRentOptionChange = (event) => {
    setRentOption(event.target.value === 'rent');
  };

  return (
    <ThemeProvider theme={theme}>

      <Modal
        open={isOpen}
        onClose={closeListItemModal}
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
        }}
      >
        <Box sx={modalBoxStyle}>
          <Typography
            variant="h6"
            sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold' }}
          >
            CONFIRM <span style={{ color: '#ffd000' }}>{productName}</span> LISTING
          </Typography>

          {/* If itemType matches, show RENT vs. SELL radio options */}
          {itemType === '653ee81117c9f5ee2124564b' && (
            <RadioGroup
              aria-label="rentOption"
              name="rentOption"
              value={rentOption ? 'rent' : 'sell'}
              onChange={handleRentOptionChange}
              row
              sx={{ justifyContent: 'center', mb: 2 }}
            >
              <FormControlLabel
                value="sell"
                control={<Radio color="error" />}
                label="SELL"
              />
              <FormControlLabel
                value="rent"
                control={<Radio color="error" />}
                label="RENT OUT"
              />
            </RadioGroup>
          )}

          {rentOption ? (
            <TextField
              variant="filled"
              color='error'
              type="text"
              label="Rent price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.0002"
              inputProps={{
                pattern: '^\\d*\\.?\\d*$',
                maxLength: 9
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    &nbsp;SOL / MONTH
                  </InputAdornment>
                )
              }}
              sx={{ width: '100%', mb: 2 }}
            />
          ) : (
            <TextField
              variant="filled"
              color='error'
              type="text"
              label="Set price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.0002"
              inputProps={{
                pattern: '^\\d*\\.?\\d*$',
                maxLength: 9
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    &nbsp;SOL
                  </InputAdornment>
                )
              }}
              sx={{ width: '100%', mb: 2 }}
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="contained" color="error" onClick={onBtnOkClicked}>
              Confirm
            </Button>
            <Button variant="contained" color='error' onClick={onBtnCancelClicked}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Override Confirmation Modal */}
      <Modal
        open={showOverrideConfirmation}
        onClose={() => setShowOverrideConfirmation(false)}
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
        }}
      >
        <Box sx={modalBoxStyle}>
          <Typography
            variant="h6"
            sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold' }}
          >
            OVERRIDE PREVIOUS LISTING?
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            You already have this item listed with different settings. Click "Confirm" to override
            the previous listing.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="contained" onClick={handleOverrideConfirmation}>
              Confirm
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => setShowOverrideConfirmation(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

// -------------- REDUX --------------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  title: state.snackbar.title,
  item: state.itemReducer._id,
  itemType: state.itemReducer.data.item_type,
  isOpen: state.snackbar.showListItemModal,
  oldPrice: state.itemReducer.data.price,
  productName: state.itemReducer.data.productName,
  onSale: state.itemReducer.data.onSale,
  oldRentOption: state.itemReducer.data.rentOption
});

const mapDispatchToProps = {
  closeListItemModal,
  listItem
};

export default connect(mapStateToProps, mapDispatchToProps)(ListItemModal);