import React, { Component } from 'react';
import { connect } from 'react-redux';
import { convertToCurrency } from '../../util/conversion';
import Modal from 'react-modal';
import { Button, Grid, TextField, ButtonGroup, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@material-ui/core';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import { paybackLoan, acCalculateRemainingLoans } from '../../redux/Loan/loan.action';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';

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

class DebtsModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFocused: false,
      paybackModalIsOpen: false,
      selectedLoan: null,
      paybackAmount: '',
    };
  }

  openPaybackModal = loan => {
    this.setState({
      paybackModalIsOpen: true,
      selectedLoan: loan,
    });
  };

  closePaybackModal = () => {
    this.setState({
      paybackModalIsOpen: false,
      selectedLoan: null,
      paybackAmount: '',
    });
  };

  paybackLoan = async () => {
    const { paybackAmount, selectedLoan } = this.state;
    const { paybackLoan, acCalculateRemainingLoans, setBalance, addNewTransaction, isDarkMode } = this.props;
  
    // Check if there's a selectedLoan
    if (!selectedLoan) {
      console.error('No selected loan to pay back.');
      return;
    }

    if (parseFloat(paybackAmount) < 0) {
      alertModal(isDarkMode, 'PAYBACK AMEOWNT CANNOT BE NEGATIVE, DUMFUQ');
      return;
    }    
  
    // Check if paybackAmount is a real number
    if (isNaN(parseFloat(paybackAmount))) {
      alertModal(isDarkMode, 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!');
      return;
    }
  
    // Check if paybackAmount is more than the selectedLoan.amount
    if (parseFloat(paybackAmount) > selectedLoan.amount) {
      alertModal(isDarkMode, 'PAYBACK AMOUNT CANNOT EXCEED THE LOAN AMEOWNT!');
      return;
    }
  
    const loanId = selectedLoan._id;
    const response = await paybackLoan(loanId, paybackAmount);
  
    if (response.success) {
      const { balance, newTransaction, message } = response;
      this.closePaybackModal();
      alertModal(isDarkMode, message, '-cat');
      setBalance(balance);
      addNewTransaction(newTransaction);
      await acCalculateRemainingLoans();
    } else {
      this.closePaybackModal();
      alertModal(isDarkMode, response.message);
    }
  };
  


  handleMaxButtonClick = () => {
    // Check if there's a selectedLoan
    if (this.state.selectedLoan) {
      const maxPaybackAmount = this.state.selectedLoan.amount;
      this.setState(
        {
          paybackAmount: maxPaybackAmount,
        },
        () => {
          document.getElementById('payback').focus();
        }
      );
    }
  };

  handleFocus = () => {
    this.setState({ isFocused: true });
  };

  handleBlur = (event) => {
    event.stopPropagation();
    this.setState({ isFocused: false });
  };


  render() {
    const { isFocused } = this.state;
    const { loading } = this.props;
    const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];
    const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Debts Modal"
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title">Your Debts</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body Debts-modal-body">
            <Grid container spacing={2}>
              {!this.props.userLoans && this.props.userLoans.length === 0 ? (
                                  <Grid item xs={12} sm={12} md={8} lg={12} key={loan._id}>

                <Typography variant="h6" style={{ textAlign: 'center', marginTop: '20px', color: 'gray' }}>
      NO DEBTS!
    </Typography>
      </Grid>
                  ) : (
                this.props.userLoans.map((loan) => (
                  <Grid item xs={12} sm={12} md={8} lg={12} key={loan._id}>
                    <TableContainer >
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <Typography variant="p">Lender:</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="p">{loan.lender}</Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Typography variant="p">Paid Back:</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="p">{convertToCurrency(loan.paid_back)}</Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Typography variant="p">Outstanding Debt:</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="p">{convertToCurrency(loan.amount)}&nbsp;{`(${loan.apy * 100}%)`}</Typography>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Typography variant="p">Days Left:</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="p">{`${loan.loan_period} days`}</Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Button
                      fullWidth
                      variant="filled"
                      onClick={() => this.openPaybackModal(loan)}
                    >
                      CLEAR DEBT
                    </Button>
                  </Grid>
                )))}
            </Grid>
          </div>
          <div className="modal-footer">
            <Button className="btn-back" onClick={this.props.closeModal}>
              Close
            </Button>
          </div>
        </div>

        {/* Payback Modal */}
        <Modal
          isOpen={this.state.paybackModalIsOpen}
          onRequestClose={this.closePaybackModal}
          style={customStyles}
          contentLabel="Payback Modal"
        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">Pay back Loan</h2>
              <Button className="btn-close" onClick={this.closePaybackModal}>
                ×
              </Button>
            </div>
            <div className="modal-body edit-modal-body Payback-modal-body">
              {loading ? (
                <div
                  className="loading-overlay"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <img src={randomGifUrl} alt="Loading" />
                  <span
                    style={{
                      marginTop: '10px',
                      color: '#fff',
                    }}
                  >
                    {`repaying loan...`}
                  </span>
                </div>
              ) : (
                <TextField
                  label="Pay Back"
                  variant="filled"
                  fullWidth
                  id="payback"
                  value={this.state.paybackAmount}
                  onChange={(e) => this.setState({ paybackAmount: e.target.value })}
                  InputProps={{
                    onFocus: this.handleFocus,
                    onBlur: this.handleBlur,
                    endAdornment: this.state.paybackAmount ? ' RPS ' : (
                      <ButtonGroup
                        className={isFocused ? 'fade-in' : 'fade-out'}
                      >
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={() => this.handleMaxButtonClick()}
                          style={{ marginRight: '-10px' }}
                        >
                          Max
                        </Button>
                      </ButtonGroup>
                    ),
                  }}
                />
              )}
            </div>
            <div className="modal-footer">
              <Button className="btn-back" onClick={this.paybackLoan}>
                Pay Back
              </Button>
            </div>
          </div>
        </Modal>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  userLoans: state.loanReducer.userLoans,
  loading: state.loanReducer.loadingRemainingLoans,
});

const mapDispatchToProps = {
  warningMsgBar,
  infoMsgBar,
  paybackLoan,
  acCalculateRemainingLoans,
  setBalance,
  addNewTransaction
};

export default connect(mapStateToProps, mapDispatchToProps)(DebtsModal);
