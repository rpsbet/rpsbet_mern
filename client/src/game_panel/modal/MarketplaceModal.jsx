import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  Modal,
  Box,
  Typography,
  Button,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StoreIcon from '@mui/icons-material/Store';

import ProductPage from '../../admin_panel/app/ProductPages/ProductSerchPage/ProductPage';
import InventoryModal from '../modal/InventoryModal';
import { infoMsgBar } from '../../redux/Notification/notification.actions';
import { getCustomTheme } from '../../config/theme';

function MarketplaceModal({
  modalIsOpen,
  closeModal,
  isDarkMode,
  infoMsgBar,
  createItem
}) {
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [sortCriteria] = useState('updated_at'); // or pass as props if needed
  const [itemType] = useState('653ee81117c9f5ee2124564b'); // or pass as props if needed

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const handleOpenInventoryModal = () => setShowInventoryModal(true);
  const handleCloseInventoryModal = () => setShowInventoryModal(false);

  // Modal container styling
  const boxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: isDarkMode ? '#1f1a25' : '#fff',
    color: isDarkMode ? '#fff' : '#000',
    boxShadow: 24,
    p: 3,
    width: fullScreen ? '90%' : 600,
    maxWidth: '90%',
    borderRadius: 1
  };

  return (
    <>
      <Modal
        open={modalIsOpen}
        onClose={closeModal}
        closeAfterTransition
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
        }}
        sx={{ zIndex: 1300 }}
      >
        <Box sx={boxStyle}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}
          >
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <StoreIcon />
              Marketplace
            </Typography>
            <Button
              variant="text"
              color="error"
              onClick={closeModal}
              sx={{ fontSize: '1.25rem' }}
            >
              &times;
            </Button>
          </Box>

          {/* Body */}
          <Box sx={{ mb: 2 }}>
            <ProductPage itemType={itemType} sortCriteria={sortCriteria} />
          </Box>

          {/* Footer / Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color='error'
              onClick={handleOpenInventoryModal}
              startIcon={<AttachMoneyIcon />}
            >
              List Item For Sale
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Inventory Modal (also can be migrated to MUI's Modal if needed) */}
      {showInventoryModal && (
        <InventoryModal
          modalIsOpen={showInventoryModal}
          closeModal={handleCloseInventoryModal}
        />
      )}
    </>
  );
}

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
  infoMsgBar
};

export default connect(mapStateToProps, mapDispatchToProps)(MarketplaceModal);