import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Box, Button, Typography } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox } from '@fortawesome/free-solid-svg-icons';

import MyProductPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyProductPage';
import MarketplaceModal from './MarketplaceModal';

function InventoryModal({ modalIsOpen, closeModal }) {
  // Retrieve Redux state
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const solPrice = useSelector((state) => state.logic.solPrice);

  // Local state to track visibility of MarketplaceModal
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);

  const handleOpenMarketplaceModal = () => setShowMarketplaceModal(true);
  const handleCloseMarketplaceModal = () => setShowMarketplaceModal(false);

  return (
    <>
      <Modal
        open={modalIsOpen || false}
        onClose={closeModal}
        closeAfterTransition
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff', // Preserve text color conditional
            width: '90vw',
            height: '80vh',
            overflowY: 'auto',
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            // Glassmorphism styles (default dark mode colors)
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)', // For Safari
            border: '1px solid rgba(255, 255, 255, 0.2)',
            // Fallback for browsers without backdrop-filter
            '@supports not (backdrop-filter: blur(10px))': {
              background: 'rgba(0, 0, 0, 0.4)',
            },
          }}
        >
          {/* HEADER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
            >
              <FontAwesomeIcon icon={faBox} style={{ marginRight: 8 }} />
              INVENTORY
            </Typography>
            <Button variant="text" color="error" onClick={closeModal}>
              ×
            </Button>
          </Box>

          {/* BODY */}
          <MyProductPage solPrice={solPrice} />

          {/* FOOTER */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleOpenMarketplaceModal}
              startIcon={<AttachMoneyIcon />}
            >
              BUY More
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Marketplace Modal */}
      {showMarketplaceModal && (
        <MarketplaceModal
          modalIsOpen={showMarketplaceModal}
          closeModal={handleCloseMarketplaceModal}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  );
}

export default InventoryModal;