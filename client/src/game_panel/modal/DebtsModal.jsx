import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Modal from 'react-modal';
import {
  Button,
  Grid,
  TextField,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import { paybackLoan, acCalculateRemainingLoans } from '../../redux/Loan/loan.action';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
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
    border: 'none',
  },
};

const DebtsModal = ({ modalIsOpen, closeModal }) => {
  const [paybackModalIsOpen, setPaybackModalIsOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paybackAmount, setPaybackAmount] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const dispatch = useDispatch();
  const { isDarkMode, userLoans, loading, solPrice } = useSelector((state) => ({
    isDarkMode: state.auth.isDarkMode,
    userLoans: state.loanReducer.userLoans,
    loading: state.loanReducer.loadingRemainingLoans,
    solPrice: state.logic.solPrice,
  }));

  const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];
  const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];

  const openPaybackModal = (loan) => {
    setPaybackModalIsOpen(true);
    setSelectedLoan(loan);
  };

  const closePaybackModal = () => {
    setPaybackModalIsOpen(false);
    setSelectedLoan(null);
    setPaybackAmount('');
  };

  const handlePaybackLoan = async () => {
    if (!selectedLoan) {
      console.error('No selected loan to pay back.');
      return;
    }

    if (parseFloat(paybackAmount) < 0) {
      alertModal(isDarkMode, 'PAYBACK AMOUNT CANNOT BE NEGATIVE!');
      return;
    }

    if (isNaN(parseFloat(paybackAmount))) {
      alertModal(isDarkMode, 'ENTER A VALID NUMBER!');
      return;
    }

    if (parseFloat(paybackAmount) > selectedLoan.amount) {
      alertModal(isDarkMode, 'PAYBACK AMOUNT CANNOT EXCEED THE LOAN AMOUNT!');
      return;
    }

    const loanId = selectedLoan._id;
    const response = await dispatch(paybackLoan(loanId, paybackAmount));

    if (response.success) {
      const { balance, newTransaction, message } = response;
      closePaybackModal();
      alertModal(isDarkMode, message, '-cat');
      dispatch(setBalance(balance));
      dispatch(addNewTransaction(newTransaction));
      dispatch(acCalculateRemainingLoans());
    } else {
      closePaybackModal();
      alertModal(isDarkMode, response.message);
    }
  };

  const handleMaxButtonClick = () => {
    if (selectedLoan) {
      setPaybackAmount(selectedLoan.amount);
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (event) => {
    event.stopPropagation();
    setIsFocused(false);
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Debts Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">Your Debts</h2>
          <Button className="btn-close" variant='text' color='error'  onClick={closeModal}>
            ×
          </Button>
        </div>
        <div className="modal-body edit-modal-body Debts-modal-body">
          <Grid container spacing={2}>
            {!userLoans || userLoans.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="h6" style={{ textAlign: 'center', marginTop: '20px', color: 'gray' }}>
                  NO DEBTS!
                </Typography>
              </Grid>
            ) : (
              userLoans
                .filter((loan) => loan.amount !== 0)
                .map((loan) => (
                  <Grid item xs={12} key={loan._id}>
                    <TableContainer>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell>Lender:</TableCell>
                            <TableCell>{loan.lender}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Paid Back:</TableCell>
                            <TableCell>{convertToCurrency(loan.paid_back, solPrice)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Outstanding Debt:</TableCell>
                            <TableCell>
                              {convertToCurrency(loan.amount, solPrice)}&nbsp;{`(${loan.apy * 100}%)`}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Days Left:</TableCell>
                            <TableCell>{`${loan.loan_period} days`}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Button fullWidth onClick={() => openPaybackModal(loan)}>
                      CLEAR DEBT
                    </Button>
                  </Grid>
                ))
            )}
          </Grid>
        </div>
        <div className="modal-footer">
          <Button variant='contained' color='secondary' onClick={closeModal}>
            Close
          </Button>
        </div>
      </div>

      <Modal
        isOpen={paybackModalIsOpen}
        onRequestClose={closePaybackModal}
        style={customStyles}
        contentLabel="Payback Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">Pay back Loan</h2>
            <Button className="btn-close" variant='text' color='error'  onClick={closePaybackModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body Payback-modal-body">
            {loading ? (
              <div
                className="loading-overlay"
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <img src={randomGifUrl} alt="Loading" />
                <span style={{ marginTop: '10px', color: '#fff' }}>{`Repaying loan...`}</span>
              </div>
            ) : (
               <TextField color="secondary" 
                label="Pay Back"
                variant="filled"
                fullWidth
                id="payback"
                value={paybackAmount}
                onChange={(e) => setPaybackAmount(e.target.value)}
                InputProps={{
                  onFocus: handleFocus,
                  onBlur: handleBlur,
                  endAdornment: paybackAmount ? (
                    ' RPS '
                  ) : (
                    <ButtonGroup className={isFocused ? 'fade-in' : 'fade-out'}>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleMaxButtonClick}
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
            <Button variant='contained' color='secondary' onClick={handlePaybackLoan}>
              Pay Back
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default DebtsModal;