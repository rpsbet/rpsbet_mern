import React, { Component } from 'react';
import { connect } from 'react-redux';

import Modal from 'react-modal';
import MyProductPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyProductPage';
import { Button } from '@material-ui/core';
import AttachMoney from '@material-ui/icons/AttachMoney';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import MarketplaceModal from './MarketplaceModal';


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
  },
};

class InventoryModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMarketplaceModal: false,
    };
  }

  handleOpenMarketplaceModal = () => {
    this.setState({ showMarketplaceModal: true });
  };

  handleCloseMarketplaceModal = () => {
    this.setState({ showMarketplaceModal: false });
  };

  render() {
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Inventory Modal"
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title">Your Inventory</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body inventory-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <MyProductPage />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-back" onClick={this.handleOpenMarketplaceModal}>BUY More &nbsp; <AttachMoney /></Button>
          </div>
        </div>

        {this.state.showMarketplaceModal && (
            <MarketplaceModal
              modalIsOpen={this.state.showMarketplaceModal}
              closeModal={this.handleCloseMarketplaceModal}
              isDarkMode={this.props.isDarkMode}
            />
          )}
  </Modal>
    );
  }
}


const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,

});

const mapDispatchToProps = {
  warningMsgBar,
  infoMsgBar
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InventoryModal);
