import React, { Component } from 'react';
import { connect } from 'react-redux';

import Modal from 'react-modal';
import ProductPage from '../../admin_panel/app/ProductPages/ProductSerchPage/ProductPage';
// import ProductCreatePage from '../../admin_panel/app/ProductPages/ProductCreatePage/ProductCreatePage';
import { Button } from '@material-ui/core';
import AttachMoney from '@material-ui/icons/AttachMoney';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import InventoryModal from '../modal/InventoryModal';


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

class MarketplaceModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showInventoryModal: false,
      sortCriteria: 'updated_at',
      itemType: '653ee81117c9f5ee2124564b',
    };
  }

  handleOpenInventoryModal = () => {
    this.setState({ showInventoryModal: true, anchorEl: null });
  };
  handleCloseInventoryModal = () => {
    this.setState({ showInventoryModal: false });
  };

  onSubmitFrom = () => {
    // e.preventDefault();
    // console.log(this.state);
    this.props.infoMsgBar(`New Item Listed!`);
    this.props.createItem(this.state);
    this.closeProductCreateModal();
  };

  render() {
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Marketplace Modal"
      >
        <div className={`${this.props.isDarkMode ? 'dark_mode' : ''} big-modal`}>
          <div className="modal-header">
            <h2 className="modal-title">
              <FontAwesomeIcon icon={faStore} className="mr-2" />
              Marketplace</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body marketplace-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <ProductPage itemType='this.state.itemType' sortCriteria='this.state.sortCriteria' />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-back" onClick={this.handleOpenInventoryModal}>List Item For Sale &nbsp; <AttachMoney /></Button>
          </div>
        </div>

        {this.state.showInventoryModal && (
          <InventoryModal
            modalIsOpen={this.state.showInventoryModal}
            closeModal={this.handleCloseInventoryModal}
          />
        )}
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  // _id: state.itemReducer._id,
  // productName: state.itemReducer.productName,
  // price: state.itemReducer.price,
  // image: state.itemReducer.image,
});

const mapDispatchToProps = {
  // setUrl,
  warningMsgBar,
  infoMsgBar,

};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MarketplaceModal);
