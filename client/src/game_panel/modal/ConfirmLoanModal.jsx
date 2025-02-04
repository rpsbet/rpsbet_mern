import React, { useState, useEffect, useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Button,
  Modal,
  ButtonGroup
} from '@mui/material';

import Lottie from 'react-lottie';
import { convertToCurrency } from '../../util/conversion';
import { getRank } from '../../util/getRank';
import LottieRankIcon from '../LottieAnimations/rankIcon.json';

import { acQueryLoan, acCalculateRemainingLoans } from '../../redux/Loan/loan.action';
import {
  closeConfirmLoanModal,
  errorMsgBar
} from '../../redux/Notification/notification.actions';
import {
  confirmLoan,
  addNewTransaction
} from '../../redux/Logic/logic.actions';
import { getUser } from '../../redux/Auth/user.actions';
import { getCustomTheme } from '../../config/theme';
import { ThemeProvider } from '@mui/material/styles';

const categories = [
  { creditScoreThreshold: 700, rankThreshold: 0, accountAgeThresholdInDays: 30, maxAllowance: 0 },
  { creditScoreThreshold: 700, rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 0.1 },
  { creditScoreThreshold: 700, rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 0.25 },
  { creditScoreThreshold: 700, rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 0.5 },
  { creditScoreThreshold: 700, rankThreshold: 4, accountAgeThresholdInDays: 30, maxAllowance: 0.75 },
  { creditScoreThreshold: 700, rankThreshold: 5, accountAgeThresholdInDays: 30, maxAllowance: 1.2 },
  { creditScoreThreshold: 700, rankThreshold: 6, accountAgeThresholdInDays: 30, maxAllowance: 2 },
  { creditScoreThreshold: 700, rankThreshold: 7, accountAgeThresholdInDays: 30, maxAllowance: 3 },
  { creditScoreThreshold: 700, rankThreshold: 8, accountAgeThresholdInDays: 30, maxAllowance: 5 },
  { creditScoreThreshold: 700, rankThreshold: 9, accountAgeThresholdInDays: 30, maxAllowance: 7 },
  { creditScoreThreshold: 700, rankThreshold: 10, accountAgeThresholdInDays: 30, maxAllowance: 8 },
  { creditScoreThreshold: 700, rankThreshold: 11, accountAgeThresholdInDays: 30, maxAllowance: 10 },
];

function ConfirmLoanModal(props) {
  const {
    // Redux props
    isOpen,
    closeConfirmLoanModal,
    acCalculateRemainingLoans,
    acQueryLoan,
    confirmLoan,
    addNewTransaction,
    item,
    lender,
    loan_amount,
    loan_period,
    apy,
    rank,
    created_at,
    solPrice,
    isDarkMode,
  } = props;

  // ---------- LOCAL STATE ----------
  const [expanded, setExpanded] = useState(false);
  const [responseText, setResponseText] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const dispatch = useDispatch();

  // ---------- THEME ----------
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  // ---------- HANDLERS ----------
  const handleFocus = () => setIsFocused(true);
  const handleBlur = (event) => {
    event.stopPropagation();
    setIsFocused(false);
  };
  const handleMaxClick = () => {
    // Set the responseText to the full "loan_amount" value
    setResponseText(String(loan_amount));
  };

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleResponseTextChange = useCallback((e) => {
    const inputValue = e.target.value;
    // Only allow digits and optional decimal
    const parsedValue = inputValue.match(/^\d*\.?\d*$/);
    setResponseText(parsedValue ? parsedValue[0] : '');
  }, []);

  const getAccountAgeInDays = useCallback((dateString) => {
    const accountCreatedAt = new Date(dateString);
    const currentDate = new Date();
    const diffMs = currentDate - accountCreatedAt;
    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  }, []);

  const getHighlightedRowIndex = useCallback((categories, rankValue, accountAgeInDays) => {
    const currentRank = getRank(rankValue);
    let bestCategoryIndex = -1;
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (
        currentRank >= category.rankThreshold &&
        accountAgeInDays >= category.accountAgeThresholdInDays
      ) {
        bestCategoryIndex = i;
      }
    }
    return bestCategoryIndex;
  }, []);

  const onBtnOkClicked = useCallback(async () => {
    if (parseFloat(responseText) > loan_amount) {
      dispatch(errorMsgBar('Entered loan amount exceeds the allowed amount.'));
      return;
    }
    if (parseFloat(responseText) < 0.05) {
      dispatch(errorMsgBar('MEOWNIMUM IS 0.05 RPS'));
      return;
    }

    const response = await confirmLoan({
      loan_id: item,
      loanAmount: loan_amount,
      lender,
      responseText,
    });

    if (response.success) {
      const { newTransaction, message } = response;
      closeConfirmLoanModal();
      dispatch(errorMsgBar(message));
      addNewTransaction(newTransaction);
      acQueryLoan();
      acCalculateRemainingLoans();
    } else {
      closeConfirmLoanModal();
      dispatch(errorMsgBar(response.message));
    }
  }, [
    responseText,
    loan_amount,
    isDarkMode,
    item,
    lender,
    confirmLoan,
    closeConfirmLoanModal,
    addNewTransaction,
    acQueryLoan,
  ]);

  const onBtnCancelClicked = useCallback(() => {
    closeConfirmLoanModal();
  }, [closeConfirmLoanModal]);

  // ---------- DERIVED VALUES ----------
  const accountAgeInDays = getAccountAgeInDays(created_at);
  const highlightedRowIndex = getHighlightedRowIndex(categories, rank, accountAgeInDays);
  const maxAllowance =
    highlightedRowIndex >= 0 ? categories[highlightedRowIndex].maxAllowance : 0;

  let errorMessage = '';
  if (parseFloat(responseText) > loan_amount) {
    errorMessage = `The entered amount exceeds the loan limit of ${loan_amount} SOL.`;
  } else if (parseFloat(responseText) > maxAllowance) {
    errorMessage = `The entered amount exceeds the maximum allowance of ${maxAllowance} SOL for your rank.`;
  }

  const tableCellStyle = { textAlign: 'center' };

  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={isOpen}
        onClose={onBtnCancelClicked}

      >
        {/* 
          Outer <Box> for the "paper" area. 
          We position absolute to center it: 
        */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            borderRadius: 1,
            minWidth: 360,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <Box className={isDarkMode ? 'dark_mode' : ''}>
            <Box className="modal-body alert-body password-modal-body">
              <Box className="modal-icon result-icon-trade"></Box>
              <Typography variant="h5" sx={{ mb: 2 }}>
                ACCEPT DEBT
              </Typography>

              <Box sx={{ background: 'rgba(170, 170, 170, 0.06)', p: 2, borderRadius: 1 }}>
                {/* TABLE: RANK ALLOWANCES */}
                <Box sx={{ mb: 3 }}>
                  <TableContainer
                    sx={{
                      maxHeight: 150,
                      overflow: 'auto',
                      borderRadius: 2,
                    }}
                  >
                    <Table
                      stickyHeader
                      size="small"
                      sx={{
                        'td, th': {
                          fontSize: '0.85rem',
                          padding: '4px 8px',
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell
                            align="center"
                            sx={{
                              color: '#fff',
                              fontWeight: 600,
                              backgroundColor: '#333',
                            }}
                          >
                            RANK
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              color: '#fff',
                              fontWeight: 600,
                              backgroundColor: '#333',
                            }}
                          >
                            MAX ALLOWANCE (SOL)
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categories.map((category, index) => {
                          if (index < highlightedRowIndex) return null;
                          return (
                            <TableRow
                              key={index}
                              sx={{
                                backgroundColor:
                                  highlightedRowIndex === index ? '#28a745' : '#333',
                              }}
                            >
                              <TableCell sx={{ color: '#fff' }} align="center">
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                  <Lottie
                                    options={{
                                      loop: true,
                                      autoplay: true,
                                      animationData: LottieRankIcon,
                                    }}
                                    height={22}
                                    width={22}
                                    style={{ display: 'inline-block' }}
                                  />
                                  <span>{category.rankThreshold}</span>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ color: '#fff' }} align="center">
                                {category.maxAllowance} (
                                {convertToCurrency(category.maxAllowance, solPrice)})
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography
                    variant="body2"
                    sx={{ mt: 2, fontStyle: 'italic', textAlign: 'center', opacity: 0.8 }}
                  >
                    You must have a credit score above 700 and an account age of at least 30 days
                    to be eligible.
                  </Typography>
                </Box>

                <TableContainer>
                  <Table>
                    <TableBody>
                      {/* Available Funds Row */}
                      <TableRow className="roll-tag">
                        <TableCell style={{ borderBottom: 'none' }}>
                          <span style={{ whiteSpace: 'nowrap' }}>AVAILABLE FUNDS:</span>
                        </TableCell>
                        <TableCell
                          className={`label ${parseFloat(responseText) > loan_amount ? 'red-text' : 'green-text'
                            }`}
                          style={{ borderBottom: 'none' }}
                        >
                          {loan_amount} SOL ({convertToCurrency(loan_amount, solPrice)})
                        </TableCell>
                      </TableRow>

                      {/* TextField */}
                      <TableRow>
                        <TableCell colSpan={2} style={{ textAlign: 'center', borderBottom: 'none' }}>
                          <TextField
                            color="error"
                            label="Loan"
                            variant="filled"
                            className="label"
                            value={responseText}
                            onChange={handleResponseTextChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            sx={{ mt: 1, mb: 1, width: '80%' }}
                            InputProps={{
                              endAdornment: responseText ? (
                                // If the user typed something, just show "SOL"
                                ' SOL '
                              ) : (
                                // If the user hasn't typed anything, show a Max button
                                <ButtonGroup className={isFocused ? 'fade-in' : 'fade-out'}>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleMaxClick}
                                    style={{ marginRight: '-10px' }}
                                  >
                                    Max
                                  </Button>
                                </ButtonGroup>
                              ),
                            }}
                            error={!!errorMessage}
                          />

                          {errorMessage && (
                            <Box sx={{ color: 'red', fontSize: '0.875rem', mt: 1 }}>
                              {errorMessage}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <TableContainer>
                  <Table>
                    <TableHead
                      style={{
                        textTransform: 'uppercase',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        background: '#333',
                      }}
                    >
                      <TableRow>
                        <TableCell style={tableCellStyle}>Loan Amount</TableCell>
                        <TableCell style={tableCellStyle}>Days Left</TableCell>
                        <TableCell style={tableCellStyle}>Payback Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {convertToCurrency(parseFloat(responseText), solPrice)}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {loan_period} days
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {(() => {
                            const principal = parseFloat(responseText);
                            const payback = apy * principal + principal;
                            return (
                              <>
                                {payback.toFixed(3)} ({convertToCurrency(payback, solPrice)}){' '}
                                <span>({(apy * 100).toFixed(2)}%)</span>
                              </>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                  By clicking 'ACCEPT', you agree to the following{' '}
                  <Box
                    component="span"
                    onClick={toggleExpand}
                    sx={{ color: '#ff0000', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    terms and conditions:
                  </Box>
                </Typography>

                {expanded && (
                  <table className="terms-and-conditions-table">
                    <tbody>
                      <tr>
                        <td className="list-number">1.</td>
                        <td>
                          The loan amount is{' '}
                          <Box component="span" sx={{ color: '#ff0000' }}>
                            [{convertToCurrency(parseFloat(responseText), solPrice)}]
                          </Box>
                          .
                        </td>
                      </tr>
                      <tr>
                        <td className="list-number">2.</td>
                        <td>
                          The loan period is{' '}
                          <Box component="span" sx={{ color: '#ff0000' }}>
                            [{loan_period}]
                          </Box>{' '}
                          days.
                        </td>
                      </tr>
                      <tr>
                        <td className="list-number">3.</td>
                        <td>You are responsible for repaying the loan within the specified period.</td>
                      </tr>
                      <tr>
                        <td className="list-number">4.</td>
                        <td>
                          Interest may be applicable on the loan amount as per the agreed Interest
                          Rate:{' '}
                          <Box component="span" sx={{ color: '#ff0000' }}>
                            [{(apy * 100).toFixed(1)}%]
                          </Box>
                          .
                        </td>
                      </tr>
                      <tr>
                        <td className="list-number">5.</td>
                        <td>
                          Failure to repay the loan on time may result in user's score credit
                          penalties.
                        </td>
                      </tr>
                      <tr>
                        <td className="list-number">6.</td>
                        <td>
                          Any outstanding balance after the loan period may be automatically
                          deducted from the user's available in-game balance
                        </td>
                      </tr>
                      <tr>
                        <td className="list-number">7.</td>
                        <td>
                          Make sure to review and understand the loan terms and conditions provided
                          by the lender.
                        </td>
                      </tr>
                      <tr>
                        <td className="list-number">8.</td>
                        <td>
                          Clicking 'ACCEPT' confirms your understanding and agreement to these
                          terms.
                        </td>
                      </tr>
                      <tr>
                        <td className="list-number">9.</td>
                        <td>
                          No legal action in the case of non-repayment can be taken on un-settled
                          debts, all loans are final and this is strictly peer-to-peer.
                        </td>
                      </tr>
                      <tr>
                        <td className="list-number">10.</td>
                        <td>
                          Ensure that you have sufficient resources to pay back the loan amount.
                          Check your debts by clicking your wallet
                        </td>
                      </tr>
                      <tr>
                        <td className="list-number">11.</td>
                        <td>This agreement is binding and enforceable.</td>
                      </tr>
                      <tr>
                        <td className="list-number">12.</td>
                        <td>Withdrawals & Tipping to be suspended for the loaner whilst in debt.</td>
                      </tr>
                      <tr>
                        <td className="list-number">13.</td>
                        <td>All loans are final.</td>
                      </tr>
                      <tr>
                        <td className="list-number">14.</td>
                        <td>You are required to clean your genitals often.</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </Box>
            </Box>

            <Box className="modal-footer" sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="success" onClick={onBtnOkClicked}>
                ACCEPT
              </Button>
              <Button variant="contained" color="error" onClick={onBtnCancelClicked}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

// -------------- REDUX --------------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  rank: state.auth.totalWagered,
  created_at: state.auth.user.created_at,
  isOpen: state.snackbar.showConfirmLoanModal,
  title: state.snackbar.title,
  item: state.loanReducer._id,
  lender: state.loanReducer.data.lender,
  loan_amount: state.loanReducer.data.loan_amount,
  loan_period: state.loanReducer.data.loan_period,
  remainingLoans: state.loanReducer.remainingLoans,
  apy: state.loanReducer.data.apy,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  closeConfirmLoanModal,
  confirmLoan,
  getUser,
  addNewTransaction,
  acCalculateRemainingLoans,
  acQueryLoan,
};

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmLoanModal);