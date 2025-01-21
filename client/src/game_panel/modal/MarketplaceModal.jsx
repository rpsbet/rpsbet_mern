import React, { useState } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import ProductPage from '../../admin_panel/app/ProductPages/ProductSerchPage/ProductPage';
import Button from '@mui/material/Button';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StoreIcon from '@mui/icons-material/Store';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { infoMsgBar } from '../../redux/Notification/notification.actions';
import InventoryModal from '../modal/InventoryModal';

Modal.setAppElement('#root');

const MarketplaceModal = ({ modalIsOpen, closeModal, isDarkMode, infoMsgBar, createItem }) => {
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [sortCriteria, setSortCriteria] = useState('updated_at');
  const [itemType, setItemType] = useState('653ee81117c9f5ee2124564b');

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const customStyles = {
    overlay: {
      zIndex: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, -50%)',
      border: 'unset',
      padding: 0,
    },
  };

  const handleOpenInventoryModal = () => {
    setShowInventoryModal(true);
  };

  const handleCloseInventoryModal = () => {
    setShowInventoryModal(false);
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Marketplace Modal"
    >
      <div className={`${isDarkMode ? 'dark_mode' : ''} big-modal`}>
        <div className="modal-header">
          <h2 className="modal-title title">
            <StoreIcon className="mr-2" />
            Marketplace
          </h2>
          <Button className="btn-close" onClick={closeModal} color="error">
            ×
          </Button>
        </div>
        <div className="modal-body edit-modal-body marketplace-modal-body">
          <div className="modal-content-wrapper">
            <div className="modal-content-panel">
              <ProductPage itemType={itemType} sortCriteria={sortCriteria} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <Button variant='contained' color='secondary' onClick={handleOpenInventoryModal} startIcon={<AttachMoneyIcon />}>
            List Item For Sale
          </Button>
        </div>
      </div>

      {showInventoryModal && (
        <InventoryModal
          modalIsOpen={showInventoryModal}
          closeModal={handleCloseInventoryModal}
        />
      )}
    </Modal>
  );
};

const mapStateToProps = state => ({
  // Additional state props if needed
});

const mapDispatchToProps = {
  infoMsgBar,
};

export default connect(mapStateToProps, mapDispatchToProps)(MarketplaceModal);