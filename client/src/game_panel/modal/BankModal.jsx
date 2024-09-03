import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, TextField, Grid, Typography } from '@material-ui/core';
import Modal from 'react-modal';
import BankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/BankPage';
import { Help } from '@material-ui/icons';
import MyLoansModal from '../modal/MyLoansModal';
import AttachMoney from '@material-ui/icons/AttachMoney';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faAdjust } from '@fortawesome/free-solid-svg-icons';
import { convertToCurrency } from '../../util/conversion';
import { getNativePrices } from '../../redux/Setting/setting.action';
import ReactApexChart from 'react-apexcharts';
import RpsPriceChart from '../../components/RpsPriceChart';

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

class BankModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMyLoansModal: false,
      showPopup: false,
      sortCriteria: 'updated_at',
      loanType: '',
    
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

  togglePopup = () => {
    this.setState({ showPopup: !this.state.showPopup });
  };

  toggleInvertFilter = () => {
    this.setState({ invertFilter: !this.state.invertFilter });
  };


  render() {
    const { isDarkMode, getNativePrices } = this.props;
    const { invertFilter } = this.state;
   


    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="CENTRAL BANK Modal"
      >
        <div className={`${this.props.isDarkMode ? 'dark_mode' : ''} big-modal`}>
          <div className="modal-header">
            <h2 className="modal-title title">
              <FontAwesomeIcon icon={faCoins} className="mr-2" />
              CENTRAL BANK
            </h2>
            <Button className="btn-close title" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>

          <div className="modal-body edit-modal-body banking-modal-body">
            <div className="modal-content-wrapper">
             <RpsPriceChart getNativePrices={getNativePrices}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                <h1 className="modal-title title">PRIVATE LENDERS</h1>

                <div style={{ width: '50%', textAlign: 'right', padding: '20px' }}>
                  <span>HELP</span>&nbsp;
                  <span>
                    <Help style={{ width: '16', marginTop: '-3px', cursor: 'pointer' }} onClick={this.togglePopup} />
                  </span>
                </div>
              </div>

              <div className="modal-content-panel">
                <BankPage itemType="this.state.loanType" sortCriteria="this.state.sortCriteria" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-back" onClick={this.handleOpenMyLoansModal}>
              Manage Your Loans&nbsp; <AttachMoney />
            </Button>
          </div>
        </div>

        {this.state.showMyLoansModal && (
          <MyLoansModal
            modalIsOpen={this.state.showMyLoansModal}
            closeModal={this.handleCloseMyLoansModal}
            remainingLoans={this.props.remainingLoans}
          />
        )}

        {this.state.showPopup && (
          <div className={`${isDarkMode ? 'popup-overlay dark_mode' : 'popup-overlay'}`}>
            <div className="popup title">
              <h2 className="modal-title title" style={{ textAlign: 'center', marginBottom: '20px' }}>
                Loan Information
              </h2>
              <div className="popup-content">
                <div style={{ position: 'relative' }}>
                  <img
                    src="../img/loans.svg"
                    style={{
                      borderRadius: '20px',
                      border: '1px solid #aaa9',
                      overflow: 'hidden',
                      filter: invertFilter ? 'invert(1)' : 'none',
                    }}
                    alt="Loans"
                  />
                  <Button
                    onClick={this.toggleInvertFilter}
                    style={{ position: 'absolute', bottom: '10px', right: '10px', borderRadius: "100px", padding: "0" }}
                  >
                    <FontAwesomeIcon icon={faAdjust} />
                  </Button>
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '15px', textAlign: 'center', letterSpacing: '0.5px' }}>
                  Central Bank Overview
                </h3>
                <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '15px', textAlign: 'justify', padding: '0 20px' }}>
                  The central bank is funded by private lenders, A.K.A Peer-to-peer lending (P2P). P2P lending connects borrowers directly with investors.
                </p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#16e100', marginTop: '20px', marginBottom: '10px', padding: '0 20px' }}>
                  Steps to get started with P2P lending:
                </p>
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', padding: '0 20px' }}>
                  (As Loaner)
                </p>
                <ol style={{ fontSize: '16px', lineHeight: '1.6', paddingLeft: '40px', marginBottom: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>Go To 'Manage Your Loans'</li>
                  <li style={{ marginBottom: '8px' }}>Click 'Create New Loan'</li>
                  <li style={{ marginBottom: '8px' }}>
                    Set 'Loan Type' (coming soon). Secured Loans guarantee repayments even if it's assets. Unsecured Loans do not.
                  </li>
                  <li style={{ marginBottom: '8px' }}>Set an Interest Rate (APY), typically around 10%~30%</li>
                  <li style={{ marginBottom: '8px' }}>Earn returns as lenders repay their loans, including principal and interest.</li>
                </ol>
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', padding: '0 20px' }}>
                  (As Lender)
                </p>
                <ol style={{ fontSize: '16px', lineHeight: '1.6', paddingLeft: '40px', marginBottom: '30px' }}>
                  <li style={{ marginBottom: '8px' }}>Browse available loan listings by peers.</li>
                  <li style={{ marginBottom: '8px' }}>Click 'Loan' and <i>Check Eligibility</i></li>
                  <li style={{ marginBottom: '8px' }}>Check the criteria fits your circumstances (loaning period, APY)</li>
                  <li style={{ marginBottom: '8px' }}>Enter the amount you want to Loan and accept the debt.</li>
                  <li style={{ marginBottom: '8px' }}>Repay the loan by going to your wallet and clicking the red button that states your remaining debt.</li>
                  <li style={{ marginBottom: '8px' }}>Increase / Decrease credit score on repayment (failures).</li>
                </ol>

                {/* New Definitions Section */}
                <h3 style={{ fontSize: '24px', fontWeight: '600', marginTop: '30px', marginBottom: '15px', textAlign: 'center', letterSpacing: '0.5px' }}>
                  Definitions
                </h3>
                <h4 style={{ fontSize: '20px', fontWeight: '600', color: '#16e100', marginBottom: '10px', padding: '0 20px' }}>
                  Fractional Reserve Banking
                </h4>
                <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '15px', textAlign: 'justify', padding: '0 20px' }}>
                  Fractional Reserve Banking is a system in which only a fraction of bank deposits are backed by actual cash on hand and available for withdrawal. The remainder is lent out to borrowers.
                </p>

                <h4 style={{ fontSize: '20px', fontWeight: '600', color: '#16e100', marginBottom: '10px', padding: '0 20px' }}>
                  Full Reserve Banking
                </h4>
                <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '15px', textAlign: 'justify', padding: '0 20px' }}>
                  Full Reserve Banking is a banking system in which banks are required to keep the full amount of depositors' funds in reserve, meaning they do not lend any of it out.
                </p>

                <h4 style={{ fontSize: '20px', fontWeight: '600', color: '#16e100', marginBottom: '10px', padding: '0 20px' }}>
                  Usury
                </h4>
                <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '15px', textAlign: 'justify', padding: '0 20px' }}>
                  Usury is the practice of charging excessive or unreasonably high interest rates on loans, often above the legally permitted rate.
                </p>


                <Button style={{ display: 'block', margin: 'auto' }} onClick={this.togglePopup}>
                  OK, GOT IT!
                </Button>
              </div>
              <button className="popup-close" onClick={this.togglePopup}>
                &times;
              </button>
            </div>
          </div>
        )}
      </Modal>
    );
  }
}

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
});

const mapDispatchToProps = {
  warningMsgBar,
  getNativePrices,
  infoMsgBar,
};

export default connect(mapStateToProps, mapDispatchToProps)(BankModal);
