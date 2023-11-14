import React, { Component } from 'react';
import { connect } from 'react-redux';

import Modal from 'react-modal';
import MyProductPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyProductPage';
import ProductCreatePage from '../../admin_panel/app/ProductPages/ProductCreatePage/ProductCreatePage';
import { Button } from '@material-ui/core';
import AttachMoney from '@material-ui/icons/AttachMoney';
import { createItem, getItem, updateItem, deleteItem, setCurrentProductInfo} from '../../redux/Item/item.action';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';


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
      productCreateModalIsOpen: false,
    };
  }

  openProductCreateModal = () => {
    this.setState({ productCreateModalIsOpen: true });
  };

  closeProductCreateModal = () => {
    this.setState({ productCreateModalIsOpen: false });
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
        </div>

        {/* ProductCreatePage Modal */}
        <Modal
          isOpen={this.state.productCreateModalIsOpen}
          onRequestClose={this.closeProductCreateModal}
          style={customStyles}
          contentLabel="Sell Something"
        >
           <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title">New Trade</h2>
            <Button className="btn-close" onClick={this.closeProductCreateModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body inventory-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
              <ProductCreatePage />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-submit" onClick={this.onSubmitFrom}>Submit</Button>
          </div>
        </div>
        </Modal>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  // _id: state.itemReducer._id,
  // productName: state.itemReducer.productName,
  // price: state.itemReducer.price,
  // image: state.itemReducer.image,
  isDarkMode: state.auth.isDarkMode,

});

const mapDispatchToProps = {
  // setUrl,
  warningMsgBar,
  infoMsgBar,
  createItem,
  // getItem,
  
  // updateItem,
  // deleteItem,
  // setCurrentProductInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InventoryModal);
