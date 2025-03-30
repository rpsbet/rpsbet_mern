import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Modal, Box, Button, Typography } from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox } from '@fortawesome/free-solid-svg-icons';

import MyProductPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyProductPage';
import {
  warningMsgBar,
  infoMsgBar,
} from '../../redux/Notification/notification.actions';
import MarketplaceModal from './MarketplaceModal';

function InventoryModal(props) {
  const { modalIsOpen, closeModal, isDarkMode, solPrice } = props;

  // Local state to track visibility of MarketplaceModal
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);

  const handleOpenMarketplaceModal = () => {
    setShowMarketplaceModal(true);
  };

  const handleCloseMarketplaceModal = () => {
    setShowMarketplaceModal(false);
  };

  // ------------------ STYLES ------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#2D3A4B', // Purple background
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 600,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

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
        <Box sx={modalBoxStyle}>
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
              variant="contained"
              color="error"
              onClick={handleOpenMarketplaceModal}
              startIcon={<AttachMoneyIcon />}
            >
              BUY More
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Marketplace Modal (still uses MUI or React Modal based on its own code) */}
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

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  warningMsgBar,
  infoMsgBar,
};

export default connect(mapStateToProps, mapDispatchToProps)(InventoryModal);
