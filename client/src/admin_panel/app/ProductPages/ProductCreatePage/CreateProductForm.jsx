import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import styled from 'styled-components';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  InputAdornment,
  Tooltip,
} from '@material-ui/core/';
import { Info } from '@material-ui/icons';
import { connect } from 'react-redux';
import { convertToCurrency } from '../../../../util/conversion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

function CreateProductForm({ updateTextField, user_balance }) {
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
    const updatedValues = { ...formValues, [name]: value, maxLength };
    setFormValues(updatedValues);
    updateTextField(updatedValues);
  };

  const exceedsReservesLimit = () => {
    const loanAmount = parseFloat(formValues.loan_amount);
    return loanAmount > (user_balance * 10);
  };


  return (
    <FormContainer>
      <TableContainer>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <TextField
                  autoFocus={true}
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
                        &nbsp;RPS
                      </InputAdornment>
                    ),
                  }}
                  className="form-control"
                />
              </TableCell>
              <TableCell style={{textAlign: "center"}} >
                <Tooltip title="Enter the amount of loan you are lending in RPS">
                  <Info  style={{cursor: "pointer"}}/>
                </Tooltip>
              </TableCell>
            </TableRow>
            {exceedsReservesLimit() && (
              <TableRow>
                <TableCell colSpan={2}>
                  <WarningContainer>
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ff0000', marginRight: '10px' }} />
                    <Typography variant="body1">
                      PLEASE ENSURE THE LOAN AMOUNT IS NO MORE THAN 10X YOUR BALANCE
                    </Typography>
                  </WarningContainer>
                </TableCell>
              </TableRow>
            )}
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
                  className="form-control"
                />
              </TableCell>
              <TableCell style={{textAlign: "center"}}>
                <Tooltip title="Enter the duration for which you want the loan in days">
                  <Info style={{cursor: "pointer"}}/>
                </Tooltip>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ borderBottom: 'none' }}>
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
                  className="form-control"
                />
              </TableCell>
              <TableCell style={{ borderBottom: 'none', textAlign: "center"}}>
                <Tooltip title="Enter the yielding interest rate for the loan">
                  <Info  style={{cursor: "pointer"}}/>
                </Tooltip>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <CalculationField>
                  <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                    YOUR BALANCE:
                  </Typography>
                </CalculationField>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  {convertToCurrency(user_balance)}
                </Typography>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>
                <CalculationField>
                  <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                    NEW BALANCE:
                  </Typography>
                </CalculationField>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  {calculateNewBalance() < 0
                    ? <>{convertToCurrency(0)} AND {convertToCurrency(Math.abs(calculateNewBalance()))} IN DEBT</>
                    : convertToCurrency(calculateNewBalance())
                  }
                </Typography>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>
                <CalculationField>
                  <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                    GROSS PROFIT:
                  </Typography>
                </CalculationField>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  {isNaN(parseFloat(formValues.loan_amount)) || isNaN(parseFloat(formValues.apy)) || parseFloat(formValues.loan_amount) <= 0 || parseFloat(formValues.apy) <= 0
                    ? convertToCurrency(0)
                    : convertToCurrency(calculateInterest() + parseFloat(formValues.loan_amount))
                  }
                </Typography>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>
                <CalculationField>
                  <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                    NET PROFIT:
                  </Typography>
                </CalculationField>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  <span id="interest">(+{convertToCurrency(calculateInterest())})</span>
                </Typography>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>
                <CalculationField>
                  <Typography variant="body1" style={{ fontWeight: 'bold' }}>
                    LOAN TYPE:
                  </Typography>
                </CalculationField>
              </TableCell>
              <TableCell>
                <Typography variant="body1">
                  {determineLoanType()}
                </Typography>
              </TableCell>
            </TableRow>

            {parseFloat(formValues.apy) > 6 && (
              <TableRow>
                <TableCell colSpan={2}>
                  <Typography variant="body1" style={{ color: '#ff0000', fontWeight: 'bold', textAlign: 'center' }}>
                    Charging an interest rate above 6% may be considered usury and could increase the risk of borrower default. We recommend setting a rate below 6% to mitigate this risk.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

          </TableBody>
        </Table>
      </TableContainer>
      <h6 style={{ marginTop: '30px', marginBottom: '10px' }}>
        By clicking 'ACCEPT', you agree to the following{' '}
        <span
          onClick={toggleExpand}
          style={{ color: '#ff0000', textDecoration: 'underline', cursor: 'pointer' }}
        >
          terms and conditions:
        </span>
      </h6>

      {expanded && (
        <>
          <table className="terms-and-conditions-table">
            <tbody style={{ textAlign: 'center' }}>
              <tr>
                <td className="list-number">1.</td>
                <td>
                  The loan amount is{' '}
                  <span style={{ color: '#ff0000' }}>
                    [{convertToCurrency(formValues.loan_amount)}]
                  </span>
                  .
                </td>
              </tr>
              <tr>
                <td className="list-number">2.</td>
                <td>
                  The loan period is{' '}
                  <span style={{ color: '#ff0000' }}>[{formValues.loan_period}]</span> days.
                </td>
              </tr>
              <tr>
                <td className="list-number">3.</td>
                <td>
                  There is no guarantee of the loaner repaying the loan within the specified period
                  let alone at all.
                </td>
              </tr>
              <tr>
                <td className="list-number">4.</td>
                <td>
                  The agreed Interest Rate:{' '}
                  <span style={{ color: '#ff0000' }}>[{formValues.apy}%]</span>.
                </td>
              </tr>
              <tr>
                <td className="list-number">5.</td>
                <td>
                  Failure to repay the loan on time may result in the loaner's score credit
                  penalties.
                </td>
              </tr>
              <tr>
                <td className="list-number">6.</td>
                <td>
                  Any outstanding balance after the loan period may be automatically deducted from
                  the loaner's available in-game balance.
                </td>
              </tr>
              {/* Add more terms as needed */}
            </tbody>
          </table>
        </>
      )}
    </FormContainer>
  );
}

const mapStateToProps = (state) => ({
  user_balance: state.auth.user.balance,
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(CreateProductForm);

const FormContainer = styled.div`
  margin-top: 20px;
`;

const CalculationField = styled.div`
  margin-top: 0px;
`;

const WarningContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-radius: 5px;
  margin-top: 10px;
`;
