import React, { useState } from 'react';
import { 
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
import { connect } from 'react-redux';
import { convertToCurrency } from '../../../../util/conversion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

function CreateProductForm({ updateTextField, user_balance, solPrice }) {
  const [formValues, setFormValues] = useState({
    loan_amount: '',
    loan_period: '',
    apy: '',
  });
  const [expanded, setExpanded] = useState(false);

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

  const toggleExpand = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  const handleInputChange = (name, value, maxLength) => {
    // Enforce maxLength if needed
    const trimmedValue = value.slice(0, maxLength);
    const updatedValues = { ...formValues, [name]: trimmedValue };
    setFormValues(updatedValues);
    updateTextField(updatedValues);
  };

  const exceedsReservesLimit = () => {
    const loanAmount = parseFloat(formValues.loan_amount);
    return loanAmount > (user_balance * 10);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <TableContainer>
        <Table>
          <TableBody>
            {/* Loan Amount Row */}
            <TableRow>
              <TableCell>
                <TextField
                  autoFocus
                  variant="filled"
                  label="Loan Amount"
                  name="loan_amount"
                  margin="normal"
                  type="number"
                  value={formValues.loan_amount}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value, 8)}
                  autoComplete="off"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        &nbsp;SOL
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </TableCell>
              <TableCell align="center">
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
                      justifyContent: 'flex-start', 
                      borderRadius: '5px', 
                      mt: 1, 
                      bgcolor: 'rgba(255, 0, 0, 0.1)', 
                      p: 1 
                    }}
                  >
                    <FontAwesomeIcon 
                      icon={faExclamationTriangle} 
                      style={{ color: '#ff0000', marginRight: '10px' }} 
                    />
                    <Typography variant="body1">
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
                  label="Loan Period"
                  variant="filled"
                  name="loan_period"
                  margin="normal"
                  type="number"
                  value={formValues.loan_period}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value, 2)}
                  autoComplete="off"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        &nbsp;DAYS
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </TableCell>
              <TableCell align="center">
                <Tooltip title="Enter the duration for which you want the loan in days">
                  <InfoIcon sx={{ cursor: 'pointer' }} />
                </Tooltip>
              </TableCell>
            </TableRow>

            {/* Interest Rate Row */}
            <TableRow>
              <TableCell sx={{ borderBottom: 'none' }}>
                <TextField
                  label="Interest Rate"
                  name="apy"
                  variant="filled"
                  margin="normal"
                  type="number"
                  value={formValues.apy}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value, 3)}
                  autoComplete="off"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        &nbsp;%
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />
              </TableCell>
              <TableCell sx={{ borderBottom: 'none', textAlign: "center" }}>
                <Tooltip title="Enter the yielding interest rate for the loan">
                  <InfoIcon sx={{ cursor: 'pointer' }} />
                </Tooltip>
              </TableCell>
            </TableRow>

            {/* Your Balance Row */}
            <TableRow>
              <TableCell>
                <Box sx={{ mt: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    YOUR BALANCE:
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  {convertToCurrency(user_balance, solPrice)}
                </Typography>
              </TableCell>
            </TableRow>

            {/* New Balance Row */}
            <TableRow>
              <TableCell>
                <Box sx={{ mt: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    NEW BALANCE:
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  {calculateNewBalance() < 0
                    ? <>
                        {convertToCurrency(0, solPrice)} AND {convertToCurrency(Math.abs(calculateNewBalance()), solPrice)} IN DEBT
                      </>
                    : convertToCurrency(calculateNewBalance(), solPrice)
                  }
                </Typography>
              </TableCell>
            </TableRow>

            {/* Gross Profit Row */}
            <TableRow>
              <TableCell>
                <Box sx={{ mt: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    GROSS PROFIT:
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  {isNaN(parseFloat(formValues.loan_amount)) || isNaN(parseFloat(formValues.apy)) || parseFloat(formValues.loan_amount) <= 0 || parseFloat(formValues.apy) <= 0
                    ? convertToCurrency(0, solPrice)
                    : convertToCurrency(calculateInterest() + parseFloat(formValues.loan_amount), solPrice)
                  }
                </Typography>
              </TableCell>
            </TableRow>

            {/* Net Profit Row */}
            <TableRow>
              <TableCell>
                <Box sx={{ mt: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    NET PROFIT:
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  <span id="interest">(+{convertToCurrency(calculateInterest(), solPrice)})</span>
                </Typography>
              </TableCell>
            </TableRow>

            {/* Loan Type Row */}
            <TableRow>
              <TableCell>
                <Box sx={{ mt: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    LOAN TYPE:
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  {determineLoanType()}
                </Typography>
              </TableCell>
            </TableRow>

            {/* Usury Warning Row */}
            {parseFloat(formValues.apy) > 6 && (
              <TableRow>
                <TableCell colSpan={2}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#ff0000', 
                      fontWeight: 'bold', 
                      textAlign: 'center' 
                    }}
                  >
                    Charging an interest rate above 6% may be considered usury and could increase the risk of borrower default. We recommend setting a rate below 6% to mitigate this risk.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

          </TableBody>
        </Table>
      </TableContainer>

      {/* Terms and Conditions */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        By clicking 'ACCEPT', you agree to the following{' '}
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
        <TableContainer component={Box} sx={{ width: '100%', mt: 2 }}>
          <Table>
            <TableBody>
              {/* Term 1 */}
              <TableRow>
                <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>1.</TableCell>
                <TableCell>
                  The loan amount is{' '}
                  <Box component="span" sx={{ color: '#ff0000' }}>
                    [{convertToCurrency(formValues.loan_amount, solPrice)}]
                  </Box>
                  .
                </TableCell>
              </TableRow>

              {/* Term 2 */}
              <TableRow>
                <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>2.</TableCell>
                <TableCell>
                  The loan period is{' '}
                  <Box component="span" sx={{ color: '#ff0000' }}>
                    [{formValues.loan_period}]
                  </Box> days.
                </TableCell>
              </TableRow>

              {/* Term 3 */}
              <TableRow>
                <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>3.</TableCell>
                <TableCell>
                  There is no guarantee of the loaner repaying the loan within the specified period
                  let alone at all.
                </TableCell>
              </TableRow>

              {/* Term 4 */}
              <TableRow>
                <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>4.</TableCell>
                <TableCell>
                  The agreed Interest Rate:{' '}
                  <Box component="span" sx={{ color: '#ff0000' }}>
                    [{formValues.apy}%]
                  </Box>.
                </TableCell>
              </TableRow>

              {/* Term 5 */}
              <TableRow>
                <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>5.</TableCell>
                <TableCell>
                  Failure to repay the loan on time may result in the loaner's score credit
                  penalties.
                </TableCell>
              </TableRow>

              {/* Term 6 */}
              <TableRow>
                <TableCell sx={{ width: '30px', fontWeight: 'bold', verticalAlign: 'top' }}>6.</TableCell>
                <TableCell>
                  Any outstanding balance after the loan period may be automatically deducted from
                  the loaner's available in-game balance.
                </TableCell>
              </TableRow>

              {/* Add more terms as needed */}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

const mapStateToProps = (state) => ({
  user_balance: state.auth.user.balance,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  // Add your dispatch actions if any
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateProductForm);