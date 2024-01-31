import React, { Component } from 'react';
import { connect } from 'react-redux';

import Modal from 'react-modal';
import MyBankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyBankPage';
import ProductCreatePage from '../../admin_panel/app/ProductPages/ProductCreatePage/ProductCreatePage';
import { Button } from '@material-ui/core';
import AttachMoney from '@material-ui/icons/AttachMoney';
import { createLoan, getLoan, updateLoan, deleteLoan, setCurrentProductInfo, acQueryMyLoan, acQueryLoan} from '../../redux/Loan/loan.action';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';



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

class MyLoansModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      _id: this.props._id,
      loan_amount: '',
      loan_period: '',
      apy: '',
      productCreateModalIsOpen: false,
    };
  }

  openProductCreateModal = () => {
    this.setState({ productCreateModalIsOpen: true });
  };

  closeProductCreateModal = () => {
    this.setState({ productCreateModalIsOpen: false });
  };

  updateTextField = (data) => {

    if ((data.loan_amount !== '' ||
      data.apy !== '' ||
      data.loan_period !== '')) {
      this.setState({ loan_amount: data.loan_amount, apy: data.apy, loan_period: data.loan_period })
    } else {
      this.props.warningMsgBar(`Value length is greater than ${length}`);
    }
  };



  onSubmitFrom = async () => {
    const { loan_amount, loan_period, apy } = this.state;
    // e.preventDefault();
    if ((loan_amount !== '' ||
      apy !== '' ||
      loan_period !== '')) {
        this.props.infoMsgBar(`New Loan Listed!`);
        this.props.createLoan(this.state);
        await this.props.acQueryMyLoan(30, 1, 'loan_amount', 'standard');
        await this.props.acQueryLoan(30, 1, 'loan_amount', 'standard');
        this.closeProductCreateModal();
    }
  };

  render() {
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Your Loans Modal"
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title"><FontAwesomeIcon icon={faCoins} className="mr-2" />Your Loans</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body my-loans-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <MyBankPage />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-back" onClick={this.openProductCreateModal}>Create New Loan &nbsp; <AttachMoney /></Button>
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
              <h2 className="modal-title">New Loan</h2>
              <Button className="btn-close" onClick={this.closeProductCreateModal}>
                ×
              </Button>
            </div>
            <div className="modal-body edit-modal-body my-loans-modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <ProductCreatePage updateTextField={this.updateTextField} />
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
  _id: state.auth.user._id,
  // productName: state.loanReducer.productName,
  // price: state.loanReducer.price,
  // image: state.loanReducer.image,
  isDarkMode: state.auth.isDarkMode,

});

const mapDispatchToProps = {
  // setUrl,
  warningMsgBar,
  infoMsgBar,
  createLoan,
  acQueryMyLoan,
  acQueryLoan

  // updateLoan,
  // deleteLoan,
  // setCurrentProductInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyLoansModal);
