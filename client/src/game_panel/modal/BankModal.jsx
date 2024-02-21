import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button } from '@material-ui/core';
import Modal from 'react-modal';
import BankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/BankPage';
import MyLoansModal from '../modal/MyLoansModal';
import AttachMoney from '@material-ui/icons/AttachMoney';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { convertToCurrency } from '../../util/conversion';


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
      showMyLoansModal: false,
      sortCriteria: 'updated_at',
      loanType: 'standard',
    };
  }

  handleOpenMyLoansModal = () => {
    if (!this.state.showMyLoansModal) {
      this.setState({ showMyLoansModal: true, anchorEl: null });
    }
  };

  handleCloseMyLoansModal = () => {
    this.setState({ showMyLoansModal: false });
  };


  onSubmitFrom = () => {
    // e.preventDefault();
    // console.log(this.state);
    this.closeProductCreateModal();
  };

  render() {
    const { isDarkMode } = this.props;
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="P2P Lending Modal"
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title">
              <FontAwesomeIcon icon={faCoins} className="mr-2" />
              P2P Lending</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
        
          <div className="modal-body edit-modal-body banking-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <BankPage itemType='this.state.loanType' sortCriteria='this.state.sortCriteria' />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-back" onClick={this.handleOpenMyLoansModal}>Manage Your Loans&nbsp; <AttachMoney /></Button>
          </div>
        </div>

        {this.state.showMyLoansModal && (
          <MyLoansModal
            modalIsOpen={this.state.showMyLoansModal}
            closeModal={this.handleCloseMyLoansModal}
          />
        )}
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
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