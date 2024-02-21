import React, { Component } from 'react';
import { connect } from 'react-redux';
// import { setUrl } from '../../../../redux/Auth/user.actions';
import { warningMsgBar } from '../../../../redux/Notification/notification.actions';
import { acQueryLoan } from '../../../../redux/Loan/loan.action';
// import ContainerHeader from '../../../../components/ContainerHeader';
import BankTable from './BankTable';
import { Table, TableHead, TableBody, TableCell, TableRow, TableContainer } from '@material-ui/core';
import Lottie from 'react-lottie';
import { convertToCurrency } from '../../../../util/conversion';
import rankIcon from '../../../../game_panel/LottieAnimations/rankIcon.json';


const categories = [
  { creditScoreThreshold: 1000, rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 0.001 },
  { creditScoreThreshold: 1000, rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 0.005 },
  { creditScoreThreshold: 1000, rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 0.015 },
  { creditScoreThreshold: 1000, rankThreshold: 4, accountAgeThresholdInDays: 60, maxAllowance: 0.025 },
  { creditScoreThreshold: 1000, rankThreshold: 5, accountAgeThresholdInDays: 60, maxAllowance: 0.05 },
  { creditScoreThreshold: 1000, rankThreshold: 6, accountAgeThresholdInDays: 90, maxAllowance: 0.1 },
  { creditScoreThreshold: 950, rankThreshold: 7, accountAgeThresholdInDays: 90, maxAllowance: 0.25 },
  { creditScoreThreshold: 950, rankThreshold: 8, accountAgeThresholdInDays: 120, maxAllowance: 0.5 },
  { creditScoreThreshold: 950, rankThreshold: 9, accountAgeThresholdInDays: 120, maxAllowance: 1 },
  { creditScoreThreshold: 950, rankThreshold: 10, accountAgeThresholdInDays: 120, maxAllowance: 2 }
];

export class BankPage extends Component {

  componentDidMount() {
    // this.props.setUrl(this.props.match.path);
    this.props.acQueryLoan(30, 1, 'loan_amount', 'standard');
    
  }

  render() {
    return (
      <>
        {/* <ContainerHeader
          title={'Manage Rooms'}
        /> */}

<div className='thresholds' style={{ padding: '20px', overflow: 'auto' }}>
            <h6 style={{ color: 'green'}} >ELIGIBILITY THRESHOLDS</h6>
            <TableContainer style={{ maxHeight: 150, overflow: 'auto' }}>
              <Table aria-label="nice-table">
                <TableHead style={{ textTransform: "uppercase", position: 'sticky', top: 0, zIndex: 1, backgroundColor: this.props.isDarkMode ? 'black' : 'white' }}>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Account Age (Days)</TableCell>
                    <TableCell>Max Allowance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category, index) => (
                    <TableRow key={index}>
                      <TableCell style={{ padding: '0', textAlign:'center', }}> <Lottie
                        options={{
                          loop: true,
                          autoplay: true,
                          animationData: rankIcon
                        }}
                        style={{
                          height: '22px',
                          width: '22px',
                          display: 'inline-block',
                          // transform: 'translateY(-4px)',

                        }}
                      />&nbsp;<span style={{
                        transform: 'translateY(4px)'
                      }}>{category.rankThreshold}</span></TableCell>
                      <TableCell style={{ textAlign:'center', padding: '0' }} ><span>{category.accountAgeThresholdInDays}</span></TableCell>
                      <TableCell style={{ textAlign:'center', padding: '0' }}><span>{convertToCurrency(category.maxAllowance)}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>


          </div>
        <BankTable />
      </>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode
});

const mapDispatchToProps = {
  // setUrl,
  warningMsgBar,
  acQueryLoan
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BankPage);
