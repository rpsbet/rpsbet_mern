import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  ThemeProvider,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  InputAdornment,
  Tooltip,
  Box
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { convertToCurrency } from '../../../../util/conversion';
import { getCustomTheme } from '../../../../config/theme';

function CreateProductForm({ 
  updateTextField, 
  user_balance, 
  solPrice, 
  isDarkMode 
}) {
  const [formValues, setFormValues] = useState({
    loan_amount: '',
    loan_period: '',
    apy: ''
  });
  const [expanded, setExpanded] = useState(false);

  // ----------------- CALCULATIONS -----------------
  const calculateInterest = () => {
    const amount = parseFloat(formValues.loan_amount);
    const interestRate = parseFloat(formValues.apy);
    const interestAmount = (amount * interestRate) / 100;
    return isNaN(interestAmount) ? 0 : interestAmount;
  };

  const calculateNewBalance = () => {
    const newBalance = user_balance - parseFloat(formValues.loan_amount);
    return isNaN(newBalance) ? user_balance : newBalance;
  };

  const determineLoanType = () => {
    const newBalance = calculateNewBalance();
    return newBalance < 0 ? 'FRACTIONAL' : 'FULL';
  };

  // ----------------- INPUT HANDLERS -----------------
  const handleInputChange = (name, value, maxLength) => {
    // Enforce maxLength if needed
    const trimmedValue = value.slice(0, maxLength);
    const updatedValues = { ...formValues, [name]: trimmedValue };
    setFormValues(updatedValues);
    updateTextField(updatedValues);
  };

  const toggleExpand = () => setExpanded((prev) => !prev);

  const exceedsReservesLimit = () => {
    const loanAmount = parseFloat(formValues.loan_amount);
    return loanAmount > user_balance * 10;
  };

  // ----------------- RENDER -----------------
  const theme = getCustomTheme(isDarkMode);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ mt: 2 }}>
        <TableContainer>
          {/* Use a dense (small) table for a more compact, professional look */}
          <Table size="small">
            <TableBody>
              {/* Loan Amount Row */}
              <TableRow>
                <TableCell>
                  <TextField
                    autoFocus
                    color='error'
                    variant="filled"
                    label="Loan Amount"
                    name="loan_amount"
                    margin="normal"
                    value={formValues.loan_amount}
                    onChange={(e) => handleInputChange(e.target.name, e.target.value, 8)}
                    autoComplete="off"
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">SOL</InputAdornment>
                    }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ width: 50 }}>
                  <Tooltip title="Enter the amount of loan you are lending in RPS">
                    <InfoIcon sx={{ cursor: 'pointer' }} />
                  </Tooltip>
                </TableCell>
              </TableRow>

              {/* Warning Row */}
              {exceedsReservesLimit() && (
                <TableRow>
                  <TableCell colSpan={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: 'rgba(255, 0, 0, 0.1)',
                        p: 1,
                        borderLeft: '2px solid #ff0000',
                        borderRadius: 1,
                        mt: 1
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        style={{ color: '#ff0000', marginRight: '10px' }}
                      />
                      <Typography variant="body2">
                        PLEASE ENSURE THE LOAN AMOUNT IS NO MORE THAN 10X YOUR BALANCE
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {/* Loan Period Row */}
              <TableRow>
                <TableCell>
                  <TextField
                    color='error'
                    variant="filled"
                    label="Loan Period"
                    name="loan_period"
                    margin="normal"
                    value={formValues.loan_period}
                    onChange={(e) => handleInputChange(e.target.name, e.target.value, 2)}
                    autoComplete="off"
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">DAYS</InputAdornment>
                    }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ width: 50 }}>
                  <Tooltip title="Enter the duration for which you want the loan in days">
                    <InfoIcon sx={{ cursor: 'pointer' }} />
                  </Tooltip>
                </TableCell>
              </TableRow>

              {/* Interest Rate Row */}
              <TableRow>
                <TableCell sx={{ borderBottom: 'none' }}>
                  <TextField
                    color='error'
                    variant="filled"
                    label="Interest Rate"
                    name="apy"
                    margin="normal"
                    value={formValues.apy}
                    onChange={(e) => handleInputChange(e.target.name, e.target.value, 3)}
                    autoComplete="off"
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ borderBottom: 'none', width: 50 }}>
                  <Tooltip title="Enter the yielding interest rate for the loan">
                    <InfoIcon sx={{ cursor: 'pointer' }} />
                  </Tooltip>
                </TableCell>
              </TableRow>

              {/* Your Balance Row */}
              <TableRow>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    YOUR BALANCE:
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                  {(user_balance).toFixed(6)} SOL / {convertToCurrency(user_balance, solPrice)}
                  </Typography>
                </TableCell>
              </TableRow>

              {/* New Balance Row */}
              <TableRow>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    NEW BALANCE:
                  </Typography>
                </TableCell>
                <TableCell>
                  {calculateNewBalance() < 0 ? (
                    <Typography variant="body2">
                      {convertToCurrency(0, solPrice)} AND{' '}
                      {Math.abs(calculateNewBalance()).toFixed(6)} SOL / {convertToCurrency(Math.abs(calculateNewBalance()), solPrice)} IN DEBT
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      {convertToCurrency(calculateNewBalance(), solPrice)}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>

              {/* Gross Profit Row */}
              <TableRow>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    GROSS PROFIT:
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {isNaN(parseFloat(formValues.loan_amount)) ||
                    isNaN(parseFloat(formValues.apy)) ||
                    parseFloat(formValues.loan_amount) <= 0 ||
                    parseFloat(formValues.apy) <= 0
                      ? convertToCurrency(0, solPrice)
                      : convertToCurrency(
                          calculateInterest() + parseFloat(formValues.loan_amount),
                          solPrice
                        )}
                  </Typography>
                </TableCell>
              </TableRow>

              {/* Net Profit Row */}
              <TableRow>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    NET PROFIT:
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    (+{convertToCurrency(calculateInterest(), solPrice)})
                  </Typography>
                </TableCell>
              </TableRow>

              {/* Loan Type Row */}
              <TableRow>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    LOAN TYPE:
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{determineLoanType()}</Typography>
                </TableCell>
              </TableRow>

              {/* Usury Warning Row */}
              {parseFloat(formValues.apy) > 6 && (
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'error.main',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        mt: 1
                      }}
                    >
                      Charging an interest rate above 6% may be considered usury and could increase
                      the risk of borrower default.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Terms and Conditions */}
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          By clicking 'SUBMIT', you agree to the following{' '}
          <Box
            component="span"
            onClick={toggleExpand}
            sx={{
              color: '#ff0000',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            terms and conditions:
          </Box>
        </Typography>

        {/* Expanded Terms */}
        {expanded && (
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableBody>
                {/* Term 1 */}
                <TableRow>
                  <TableCell
                    sx={{
                      width: '30px',
                      fontWeight: 'bold',
                      verticalAlign: 'top'
                    }}
                  >
                    1.
                  </TableCell>
                  <TableCell>
                    The loan amount is{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      [{convertToCurrency(formValues.loan_amount, solPrice)}]
                    </Box>
                    .
                  </TableCell>
                </TableRow>

                {/* Term 2 */}
                <TableRow>
                  <TableCell
                    sx={{
                      width: '30px',
                      fontWeight: 'bold',
                      verticalAlign: 'top'
                    }}
                  >
                    2.
                  </TableCell>
                  <TableCell>
                    The loan period is{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      [{formValues.loan_period}]
                    </Box>{' '}
                    days.
                  </TableCell>
                </TableRow>

                {/* Term 3 */}
                <TableRow>
                  <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>
                    3.
                  </TableCell>
                  <TableCell>
                    There is no guarantee of the loaner repaying the loan within the specified
                    period, let alone at all.
                  </TableCell>
                </TableRow>

                {/* Term 4 */}
                <TableRow>
                  <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>
                    4.
                  </TableCell>
                  <TableCell>
                    The agreed Interest Rate:{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      [{formValues.apy}%]
                    </Box>
                    .
                  </TableCell>
                </TableRow>

                {/* Term 5 */}
                <TableRow>
                  <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>
                    5.
                  </TableCell>
                  <TableCell>
                    Failure to repay the loan on time may result in the loaner's score credit
                    penalties.
                  </TableCell>
                </TableRow>

                {/* Term 6 */}
                <TableRow>
                  <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>
                    6.
                  </TableCell>
                  <TableCell>
                    Any outstanding balance after the loan period may be automatically deducted
                    from the loaner's available in-game balance.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </ThemeProvider>
  );
}

// -------------- REDUX CONNECT --------------
const mapStateToProps = (state) => ({
  user_balance: state.auth.user.balance,
  solPrice: state.logic.solPrice,
  isDarkMode: state.auth.isDarkMode
});

const mapDispatchToProps = {
  // Add your dispatch actions if any
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateProductForm);