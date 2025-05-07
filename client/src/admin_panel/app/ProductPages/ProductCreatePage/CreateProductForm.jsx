import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
  Box,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { convertToCurrency } from '../../../../util/conversion';
import { getCustomTheme } from '../../../../config/theme';

function CreateProductForm({
  updateTextField,
  user_balance: propUserBalance,
  solPrice: propSolPrice,
  isDarkMode: propIsDarkMode,
}) {
  // Map state from Redux using useSelector
  const { user_balance, solPrice, isDarkMode } = useSelector((state) => ({
    user_balance: state.auth.user.balance,
    solPrice: state.logic.solPrice,
    isDarkMode: state.auth.isDarkMode,
  }));

  // Use prop values if provided, otherwise fall back to Redux state
  const effectiveUserBalance = propUserBalance !== undefined ? propUserBalance : user_balance;
  const effectiveSolPrice = propSolPrice !== undefined ? propSolPrice : solPrice;
  const effectiveIsDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : isDarkMode;

  // Local State
  const [formValues, setFormValues] = useState({
    loan_amount: '',
    loan_period: '',
    apy: '',
  });
  const [expanded, setExpanded] = useState(false);

  // Calculations
  const calculateInterest = () => {
    const amount = parseFloat(formValues.loan_amount);
    const interestRate = parseFloat(formValues.apy);
    const interestAmount = (amount * interestRate) / 100;
    return isNaN(interestAmount) ? 0 : interestAmount;
  };

  const calculateNewBalance = () => {
    const newBalance = effectiveUserBalance - parseFloat(formValues.loan_amount);
    return isNaN(newBalance) ? effectiveUserBalance : newBalance;
  };

  const determineLoanType = () => {
    const newBalance = calculateNewBalance();
    return newBalance < 0 ? 'FRACTIONAL' : 'FULL';
  };

  // Input Handlers
  const handleInputChange = (name, value, maxLength) => {
    const trimmedValue = value.slice(0, maxLength);
    const updatedValues = { ...formValues, [name]: trimmedValue };
    setFormValues(updatedValues);
    updateTextField(updatedValues);
  };

  const toggleExpand = () => setExpanded((prev) => !prev);

  const exceedsReservesLimit = () => {
    const loanAmount = parseFloat(formValues.loan_amount);
    return loanAmount > effectiveUserBalance * 10;
  };

  // Render
  const theme = getCustomTheme(effectiveIsDarkMode);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ mt: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableBody>
              {/* Loan Amount Row */}
              <TableRow>
                <TableCell>
                  <TextField
                    autoFocus
                    color="error"
                    variant="filled"
                    label="Loan Amount"
                    name="loan_amount"
                    margin="normal"
                    value={formValues.loan_amount}
                    onChange={(e) => handleInputChange(e.target.name, e.target.value, 8)}
                    autoComplete="off"
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">SOL</InputAdornment>,
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
                        borderLeft: '2px solid #FF0000',
                        borderRadius: 1,
                        mt: 1,
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        style={{ color: '#FF0000', marginRight: '10px' }}
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
                    color="error"
                    variant="filled"
                    label="Loan Period"
                    name="loan_period"
                    margin="normal"
                    value={formValues.loan_period}
                    onChange={(e) => handleInputChange(e.target.name, e.target.value, 2)}
                    autoComplete="off"
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">DAYS</InputAdornment>,
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
                    color="error"
                    variant="filled"
                    label="Interest Rate"
                    name="apy"
                    margin="normal"
                    value={formValues.apy}
                    onChange={(e) => handleInputChange(e.target.name, e.target.value, 3)}
                    autoComplete="off"
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
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
                    {(effectiveUserBalance).toFixed(6)} SOL /{' '}
                    {convertToCurrency(effectiveUserBalance, effectiveSolPrice)}
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
                      {convertToCurrency(0, effectiveSolPrice)} AND{' '}
                      {Math.abs(calculateNewBalance()).toFixed(6)} SOL /{' '}
                      {convertToCurrency(Math.abs(calculateNewBalance()), effectiveSolPrice)} IN DEBT
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      {convertToCurrency(calculateNewBalance(), effectiveSolPrice)}
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
                      ? convertToCurrency(0, effectiveSolPrice)
                      : convertToCurrency(
                          calculateInterest() + parseFloat(formValues.loan_amount),
                          effectiveSolPrice,
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
                    (+{convertToCurrency(calculateInterest(), effectiveSolPrice)})
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
                        mt: 1,
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
              color: '#FF0000',
              textDecoration: 'underline',
              cursor: 'pointer',
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
                  <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>
                    1.
                  </TableCell>
                  <TableCell>
                    The loan amount is{' '}
                    <Box component="span" sx={{ color: 'error.main' }}>
                      [{convertToCurrency(formValues.loan_amount, effectiveSolPrice)}]
                    </Box>
                    .
                  </TableCell>
                </TableRow>

                {/* Term 2 */}
                <TableRow>
                  <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>
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

export default CreateProductForm;