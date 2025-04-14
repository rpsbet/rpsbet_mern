import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Box, Typography, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';
import AttachMoney from '@mui/icons-material/AttachMoney';

import ProductPage from '../../admin_panel/app/ProductPages/ProductSerchPage/ProductPage';
import InventoryModal from '../modal/InventoryModal';
import { getCustomTheme } from '../../config/theme';

function MarketplaceModal({ modalIsOpen, closeModal }) {
  // Get isDarkMode from Redux store
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [sortCriteria] = useState('updated_at');
  const [itemType] = useState('653ee81117c9f5ee2124564b');

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  const handleOpenInventoryModal = () => setShowInventoryModal(true);
  const handleCloseInventoryModal = () => setShowInventoryModal(false);

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#0a0a0a', // Force dark background
    color: '#fff',
    boxShadow: 24,
    p: 3,
    borderRadius: 1,
    width: '90%',
    maxWidth: 800,
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={modalIsOpen || false}
        onClose={closeModal}
        closeAfterTransition
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
        sx={{ zIndex: 1300 }}
      >
        <Box sx={modalStyle}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FontAwesomeIcon icon={faList} />
              MARKETPLACE
            </Typography>
            <Button
              variant="text"
              color="error"
              onClick={closeModal}
              sx={{ fontSize: '1.25rem' }}
            >
              ×
            </Button>
          </Box>
          <Box sx={{ mb: 2 }}>
            <ProductPage itemType={itemType} sortCriteria={sortCriteria} />
          </Box>

          {/* Footer actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="error"
              onClick={handleOpenInventoryModal}
              startIcon={<AttachMoney />}
            >
              List Item For Sale
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Inventory Modal */}
      {showInventoryModal && (
        <InventoryModal
          modalIsOpen={showInventoryModal}
          closeModal={handleCloseInventoryModal}
        />
      )}
    </ThemeProvider>
  );
}

export default MarketplaceModal;