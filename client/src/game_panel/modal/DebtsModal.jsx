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
  Box,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave,
  faMoneyBillWaveAlt,
} from '@fortawesome/free-solid-svg-icons';

import { errorMsgBar } from '../../redux/Notification/notification.actions';
import {
  paybackLoan,
  acCalculateRemainingLoans,
} from '../../redux/Loan/loan.action';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { convertToCurrency } from '../../util/conversion';
import { getCustomTheme } from '../../config/theme';
import { ThemeProvider } from '@mui/material/styles';

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
    background: '#0a0a0a',
    padding: '16px',
    border: 'none',
  },
};

const DebtsModal = ({ modalIsOpen, closeModal }) => {
  const [paybackModalIsOpen, setPaybackModalIsOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paybackAmount, setPaybackAmount] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const { isDarkMode, userLoans, solPrice } = useSelector((state) => ({
    isDarkMode: state.auth.isDarkMode,
    userLoans: state.loanReducer.userLoans,
    loading: state.loanReducer.loadingRemainingLoans,
    solPrice: state.logic.solPrice,
  }));

  const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];
  const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];

  // -------------------------
  // Open/Close Payback Modal
  // -------------------------
  const openPaybackModal = (loan) => {
    setPaybackModalIsOpen(true);
    setSelectedLoan(loan);
  };

  const closePaybackModal = () => {
    setPaybackModalIsOpen(false);
    setSelectedLoan(null);
    setPaybackAmount('');
  };

  // -------------------------
  // Payback Logic
  // -------------------------
  const handlePaybackLoan = async () => {
    if (!selectedLoan) {
      console.error('No selected loan to pay back.');
      return;
    }

    if (parseFloat(paybackAmount) < 0) {
      dispatch(errorMsgBar('PAYBACK AMOUNT CANNOT BE NEGATIVE!'));
      return;
    }

    if (isNaN(parseFloat(paybackAmount))) {
      dispatch(errorMsgBar('ENTER A VALID NUMBER!'));
      return;
    }

    if (parseFloat(paybackAmount) > selectedLoan.amount) {
      dispatch(errorMsgBar('PAYBACK AMOUNT CANNOT EXCEED THE LOAN AMOUNT!'));
      return;
    }

    setLoading(true); // Set loading to true before API call
    const loanId = selectedLoan._id;
    const response = await dispatch(paybackLoan(loanId, paybackAmount));

    if (response.success) {
      const { newTransaction } = response;
      closePaybackModal();
      dispatch(addNewTransaction(newTransaction));
      dispatch(acCalculateRemainingLoans());
    } else {
      dispatch(errorMsgBar(response.message));
    }

    setLoading(false); // Set loading to false after API call
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

  // -------------------------
  // Theming
  // -------------------------
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      {/* Main Debts Modal */}
      <Modal
        isOpen={modalIsOpen || false}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Debts Modal"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: isDarkMode ? '#fff' : '#000', // Preserve text color conditional
            width: '90vw',
            height: '80vh',
            overflowY: 'auto',
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            // Glassmorphism styles (default dark mode colors)
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)', // For Safari
            border: '1px solid rgba(255, 255, 255, 0.2)',
            // Fallback for browsers without backdrop-filter
            '@supports not (backdrop-filter: blur(10px))': {
              background: 'rgba(0, 0, 0, 0.4)',
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FontAwesomeIcon icon={faMoneyBillWaveAlt} sx={{ mr: 2 }} />
              YOUR DEBTS
            </Typography>
            <Button
              onClick={closeModal}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                minWidth: 'auto',
                p: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                borderRadius: '50%',
              }}
            >
              <CloseIcon />
            </Button>
          </Box>

          {/* Outer Container for loans, with background & radius */}
          <Box
          >
            <Grid container spacing={2}>
              {/* If no debts */}
              {!userLoans || userLoans.length === 0 ? (
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    style={{
                      textAlign: 'center',
                      marginTop: '20px',
                      color: 'gray',
                    }}
                  >
                    NO DEBTS!
                  </Typography>
                </Grid>
              ) : (
                // Map user loans
                userLoans
                  .filter((loan) => loan.amount !== 0)
                  .map((loan) => (
                    <Grid item xs={12} key={loan._id}>
                      <Card variant="outlined" sx={{ mb: 0.5 }}>
                        <CardContent
                          sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                        >
                          {/* Optionally highlight the outstanding amount on top */}
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {convertToCurrency(loan.amount, solPrice)}
                              <span
                                style={{ fontSize: 'small', marginLeft: 4 }}
                              >
                                / {loan.amount} SOL
                              </span>
                            </Typography>
                          </Box>

                          {/* Original Table with unchanged fields */}
                          <TableContainer>
                            <Table>
                              <TableBody>
                                <TableRow>
                                  <TableCell>Lender:</TableCell>
                                  <TableCell>{loan.lender}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Paid Back:</TableCell>
                                  <TableCell>
                                    {convertToCurrency(
                                      loan.paid_back,
                                      solPrice,
                                    )}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Outstanding Debt:</TableCell>
                                  <TableCell>
                                    {convertToCurrency(loan.amount, solPrice)}
                                    &nbsp;
                                    {`(${loan.apy * 100}%)`}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Days Left:</TableCell>
                                  <TableCell>{`${loan.loan_period} days`}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>

                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            sx={{ mt: 1 }}
                            onClick={() => openPaybackModal(loan)}
                          >
                            CLEAR DEBT
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
              )}
            </Grid>
          </Box>

          {/* Close the main Debts modal */}
          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            color="error"
            onClick={closeModal}
          >
            Close
          </Button>
        </Box>

        {/* Pay Back Loan Modal */}
        <Modal
          isOpen={paybackModalIsOpen}
          onRequestClose={closePaybackModal}
          style={customStyles}
          contentLabel="Payback Modal"
        >
          <Box className={isDarkMode ? 'dark_mode' : ''}>
            {/* Payback Modal Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6" className="modal-title title">
                <FontAwesomeIcon icon={faMoneyBillWave} sx={{ mr: 2 }} />
                &nbsp; Pay back Loan
              </Typography>
              <Button variant="text" color="error" onClick={closePaybackModal}>
                ×
              </Button>
            </Box>

            {/* Payback Modal Body */}
            <Box className="modal-body edit-modal-body Payback-modal-body">

              <TextField
                color="error"
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
                    ' SOL '
                  ) : (
                    <ButtonGroup
                      className={isFocused ? 'fade-in' : 'fade-out'}
                    >
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleMaxButtonClick}
                      >
                        Max
                      </Button>
                    </ButtonGroup>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Box>

            {/* Payback Modal Footer */}
            <Box className="modal-footer" sx={{ textAlign: 'right' }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handlePaybackLoan}
                disabled={loading} // Disable button when loading
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Pay Back'}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Modal>
    </ThemeProvider>
  );
};

export default DebtsModal;
