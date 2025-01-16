import React, { useState } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import MyProductPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyProductPage';
import { Button } from '@material-ui/core';
import AttachMoney from '@mui/icons-material/AttachMoney';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import MarketplaceModal from './MarketplaceModal';
import { faBox } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
    background: 'transparent',
    padding: 0,
    border: 'none',
  },
};

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

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Inventory Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">
            <FontAwesomeIcon icon={faBox} className="mr-2" />
            &nbsp;Inventory
          </h2>
          <Button className="btn-close title" onClick={closeModal}>
            ×
          </Button>
        </div>
        <div className="modal-body edit-modal-body inventory-modal-body">
          <div className="modal-content-wrapper">
            <div className="modal-content-panel">
              <MyProductPage solPrice={solPrice} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <Button className="btn-back" onClick={handleOpenMarketplaceModal}>
            BUY More &nbsp;
            <AttachMoney />
          </Button>
        </div>
      </div>

      {showMarketplaceModal && (
        <MarketplaceModal
          modalIsOpen={showMarketplaceModal}
          closeModal={handleCloseMarketplaceModal}
          isDarkMode={isDarkMode}
        />
      )}
    </Modal>
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