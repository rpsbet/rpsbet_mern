import React, { Component } from 'react';
import { connect } from 'react-redux';

import Modal from 'react-modal';
import BankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/BankPage';
// import ProductCreatePage from '../../admin_panel/app/ProductPages/ProductCreatePage/ProductCreatePage';
import { Button } from '@material-ui/core';
import AttachMoney from '@material-ui/icons/AttachMoney';
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

class BankModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showInventoryModal: false,
      sortCriteria: 'updated_at',
      itemType: '653ee7ac17c9f5ee21245649',
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
    this.closeProductCreateModal();
    };

  render() {
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="P2P Lending Modal"
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title">P2P Lending</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body banking-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <BankPage itemType= 'this.state.loanType' sortCriteria= 'this.state.sortCriteria' />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-back" onClick={this.handleOpenInventoryModal}>List a Loan &nbsp; <AttachMoney /></Button>
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
)(BankModal);