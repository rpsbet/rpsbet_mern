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
  Tooltip,
} from '@material-ui/core/';
import { Info } from '@material-ui/icons';
import { connect } from 'react-redux';
import { convertToCurrency } from '../../../../util/conversion';

function CreateProductForm({ updateTextField }) {
  const [formValues, setFormValues] = useState({
    loan_amount: '',
    loan_period: '',
    apy: '',
  });
  const [expanded, setExpanded] = useState(false);

  const calculateInterest = () => {
    const amount = parseFloat(formValues.loan_amount);
    const interestRate = parseFloat(formValues.apy);
    const interestAmount = ((amount * interestRate) / 100);
    return isNaN(interestAmount) ? 0 : interestAmount;
  };

  const toggleExpand = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  const handleInputChange = (name, value, maxLength) => {
    const updatedValues = { ...formValues, [name]: value, maxLength };
    setFormValues(updatedValues);
    updateTextField(updatedValues);
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
                  type="text"
                  value={formValues.loan_amount}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value, 8)}
                  autoComplete="off"
                  InputProps={{
                    endAdornment: 'RPS',
                  }}
                  className="form-control"
                />
              </TableCell>
              <TableCell>
                <Tooltip title="Enter the amount of loan you are lending in RPS">
                  <Info />
                </Tooltip>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <TextField
                  label="Loan Period"
                  variant="filled"
                  name="loan_period"
                  margin="normal"
                  value={formValues.loan_period}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value, 2)}
                  autoComplete="off"
                  InputProps={{
                    endAdornment: 'Days',
                  }}
                  className="form-control"
                />
              </TableCell>
              <TableCell>
                <Tooltip title="Enter the duration for which you want the loan in days">
                  <Info />
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
                  value={formValues.apy}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value, 3)}
                  autoComplete="off"
                  InputProps={{
                    endAdornment: '%',
                  }}
                  className="form-control"
                />
              </TableCell>
              <TableCell style={{ borderBottom: 'none' }}>
                <Tooltip title="Enter the yielding interest rate for the loan">
                  <Info />
                </Tooltip>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <CalculationField>
                  <Typography variant="body1">
                  GROSS PROFIT:&nbsp;&nbsp;{convertToCurrency(calculateInterest() + parseFloat(formValues.loan_amount))}
                      <br /><br />
                      NET PROFIT:&nbsp;&nbsp;&nbsp;&nbsp;<span id='interest'>(+{convertToCurrency(calculateInterest())})</span>
                  </Typography>
                </CalculationField>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <h6 style={{ marginTop: '30px', marginBottom: '10px' }}>
        By clicking 'accept', you agree to the following{' '}
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
                  <tbody style={{textAlign: "center"}}>
                    <tr>
                      <td className="list-number">1.</td>
                      <td>The loan amount is <span style={{ color: "#ff0000" }}>[{convertToCurrency(formValues.loan_amount)}]</span>.</td>
                    </tr>
                    <tr>
                      <td className="list-number">2.</td>
                      <td>The loan period is <span style={{ color: "#ff0000" }}>[{formValues.loan_period}]</span> days.</td>
                    </tr>
                    <tr>
                      <td className="list-number">3.</td>
                      <td>There is no guarantee of the loaner repaying the loan within the specified period let alone at all.</td>
                    </tr>
                    <tr>
                      <td className="list-number">4.</td>
                      <td>The agreed Interest Rate: <span style={{ color: "#ff0000" }}>[{formValues.apy}%]</span>.</td>
                    </tr>
                    <tr>
                      <td className="list-number">5.</td>
                      <td>Failure to repay the loan on time may result in the loaner's score credit penalties.</td>
                    </tr>
                    <tr>
                      <td className="list-number">6.</td>
                      <td>Any outstanding balance after the loan period may be automatically deducted from the loaner's available in-game balance</td>
                    </tr>
                    <tr>
                      <td className="list-number">7.</td>
                      <td>The loaner must be of qualifying rank level, account age and credit score to be eligible for this loan.</td>
                    </tr>
                    <tr>
                      <td className="list-number">8.</td>
                      <td>Clicking 'accept' confirms your understanding and agreement to these terms.</td>
                    </tr>
                    <tr>
                      <td className="list-number">9.</td>
                      <td>No legal action in the case of non-repayment can be taken on un-settled debts, all loans are final and this is strictly peer-to-peer.</td>
                    </tr>
                    <tr>
                      <td className="list-number">10.</td>
                      <td>You are permitted to withdraw this loan at any time and receive whatever funds are left to your account balance.</td>
                    </tr>
                    <tr>
                      <td className="list-number">11.</td>
                      <td>This agreement is binding and enforceable.</td>
                    </tr>
                    <tr>
                      <td className="list-number">12.</td>
                      <td>All loans are final.</td>
                    </tr>
                    <tr>
                      <td className="list-number">13.</td>
                      <td>You are required to clean your genitals often.</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
    </FormContainer>
  );
}

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(CreateProductForm);

const FormContainer = styled.div`
  margin-top: 20px;
`;

const CalculationField = styled.div`
  margin-top: -20px;
`;
