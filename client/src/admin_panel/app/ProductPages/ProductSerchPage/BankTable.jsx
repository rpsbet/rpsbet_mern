import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { alertModal } from '../../../../game_panel/modal/ConfirmAlerts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyLoansModal from '../../../../game_panel/modal/MyLoansModal';
import RpsPriceChart from '../../../../components/RpsPriceChart';
import {
  faClock,
  faSort,
  faFilter,
  faUser,
  faMoneyBillAlt,
  faUsers,
  faMoneyCheckAlt,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import {
  acQueryLoan,
  previousLoans,
  setCurrentLoanId,
  setCurrentLoanInfo
} from '../../../../redux/Loan/loan.action';
import { openConfirmLoanModal } from '../../../../redux/Notification/notification.actions';
import history from '../../../../redux/history';
import {
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Menu,
  MenuItem,
  Skeleton,
  Box
} from '@mui/material';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import AttachMoney from '@mui/icons-material/AttachMoney';
import { convertToCurrency } from '../../../../util/conversion';
import { updateDigitToPoint2 } from '../../../../util/helper';
import Avatar from '../../../../components/Avatar';
import PlayerModal from '../../../../game_panel/modal/PlayerModal';

const token = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';


const MarketplaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-loans: center;
`;

const FilterSortContainer = styled.div`
  display: flex;
  align-loans: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 20px;
  max-width: 100%;
  margin: 20px 0;
`;

const ProductCard = styled.div`
  position: relative;
  background: linear-gradient(156deg, #28a745, #007bff);
  border-radius: 1em;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-loans: center;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;

  &:hover {
    transform: scale(1.03);
  }

  &:hover::before {
    opacity: 1;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 1em;
    opacity: 0;
    transition: opacity 0.2s;
  }
`;

const LoanButton = styled.div`
  opacity: 0;
  position: absolute;
  bottom: 0;
  cursor: pointer;
  transition: transform 0.2s, bottom 0.2s;

  /* Show button on hover */
  ${ProductCard}:hover & {
    opacity: 1;
    bottom: 30%;
    left: 25%;
  }
`;

const ProductCreator = styled.h5`
  max-width: 100%;
  left: 10px;
  position: absolute;
  z-index: 1;
`;

const ProductInfo = styled.div`
  text-align: center;
`;

const LoanAmount = styled.h6`
  padding: 4px;
  font-size: 1rem;
  margin-bottom: -5px;
  font-weight: 400;
  line-height: 1.75;
  background: linear-gradient(354deg, #007bff75, #00ddff);
  width: 100%;
  border-radius: 23%;
  text-shadow: 2px -2px 4px #007bff;
  text-transform: uppercase;
  box-shadow: inset 0px 1px 14px #3428a724, -1px 2px #007bff75;
  color: #fff;
  margin-top: 10px;
  border-bottom-right-radius: 21px;
  border-top-left-radius: 30px;
`;

const APY = styled.span`
  position: absolute;
  top: -3px;
  right: 0;
  height: 30px;
  background: #28a745;
  border-radius: 1em;
  box-shadow: inset 0px -1px 11px #005b15;
  color: #fff;
  font-weight: 500;
  text-align: center;
  padding: 0 10px;
`;

const BankTable = (props) => {
  const {
    data,
    loading,
    acQueryLoan,
    setCurrentLoanId,
    setCurrentLoanInfo,
    openConfirmLoanModal,
    solPrice,
    prevLoans,
    previousLoans,
    isDarkMode,
    user,
    isLowGraphics
  } = props;

  // ------------------- LOCAL STATE -------------------
  const [customerInfo, setCustomerInfo] = useState({});
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [showMyLoansModal, setShowMyLoansModal] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('updated_at');
  const [loanType, setLoanType] = useState('');
  const [loansWithProfit, setLoansWithProfit] = useState([]);
  const [error, setError] = useState(null);

  // ------------------- EFFECTS -------------------

  // componentDidMount logic: fetch previous loans, then attach info
  useEffect(() => {
    (async () => {
      // by default, fetch previousLoans(30, 1, 'loan_amount', '')
      // then for each loan, attach customer info
      await props.previousLoans(30, 1, 'loan_amount', '');
      try {
        const result = await attachLoansWithProfit(props.prevLoans);
        setLoansWithProfit(result);
      } catch (err) {
        console.error('Error fetching customer info:', err);
        setError(err);
      }
    })();
  }, []);

  // componentDidUpdate logic for data length changes
  useEffect(() => {
    // if data has changed, re-check some conditions and maybe fetch again
    if (
      data &&
      data.length &&
      // check if there's difference in `loan_amount` from the previous iteration
      data.some((currentLoan, index) => {
        if (!props.data[index]) return false;
        return currentLoan.loan_amount !== props.data[index].loan_amount;
      })
    ) {
      fetchLoans();
      props.previousLoans();
    }
  }, [data]);

  // Similar to "componentWillReceiveProps" for when prevLoans changes
  useEffect(() => {
    // If prevLoans changes, re-attach the profit logic
    (async () => {
      try {
        const result = await attachLoansWithProfit(props.prevLoans);
        setLoansWithProfit(result);
      } catch (err) {
        console.error('Error fetching customer info:', err);
        setError(err);
      }
    })();
  }, [props.prevLoans]);

  // On window resize, update isMobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ------------------- HELPER METHODS -------------------
  const fetchLoans = useCallback(() => {
    const { acQueryLoan, page } = props;
    acQueryLoan(30, page, sortCriteria, loanType);
  }, [props, sortCriteria, loanType]);

  // fetchCustomerInfo on data changes
  const fetchCustomerInfo = useCallback(async () => {
    for (const product of data) {
      if (!customerInfo[product.lender]) {
        try {
          const info = await props.acGetCustomerInfo(product.lender);
          setCustomerInfo((prev) => ({
            ...prev,
            [product.lender]: info || {
              username: 'Anon',
              avatar: 'default-avatar-url',
            },
          }));
        } catch (error) {
          console.error(`Error fetching customer info for ${product.lender}:`, error);
        }
      }
    }
  }, [data, customerInfo, props]);

  // Attach "profit" logic to each loan in prevLoans
  const attachLoansWithProfit = async (loans) => {
    const { acGetCustomerInfo } = props;
    if (!loans) return [];

    const result = await Promise.all(
      loans.map(async (loan) => {
        let totalLoanerAmount = 0;
        let totalPaidBack = 0;

        await Promise.all(
          loan.loaners.map(async (loaner) => {
            totalLoanerAmount += loaner.amount;
            const paidBack = parseFloat(loaner.paidBack) || 0;
            totalPaidBack += paidBack;

            // fetch customer info for each loaner
            const lInfo = await acGetCustomerInfo(loaner.user);
            loaner.customerInfo = lInfo; // Attach to the local object
          })
        );

        const profit = totalPaidBack * loan.apy - totalLoanerAmount;
        // fetch customer info for lender
        const cInfo = await acGetCustomerInfo(loan.lender);

        return {
          ...loan,
          totalLoanerAmount,
          totalPaidBack,
          profit,
          customerInfo: cInfo,
        };
      })
    );

    return result;
  };

  // Ensure we re-run fetchCustomerInfo if needed
  useEffect(() => {
    fetchCustomerInfo();
  }, [fetchCustomerInfo, data]);

  // -------------- Handlers for UI actions --------------
  const handleOpenMyLoansModal = () => {
    if (!showMyLoansModal) {
      setShowMyLoansModal(true);
      setAnchorEl(null);
    }
  };

  const handleCloseMyLoansModal = () => {
    setShowMyLoansModal(false);
  };

  const handleFilterChange = () => {
    setAnchorEl(null);
    fetchLoans();
  };

  const handleSortChange = () => {
    setSortAnchorEl(null);
    fetchLoans();
  };

  const handleFilterClick = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleFilterClose = (value) => {
    setAnchorEl(null);
    setLoanType(value);
    handleFilterChange();
  };

  const handleSortClick = (e) => {
    setSortAnchorEl(e.currentTarget);
  };

  const handleSortClose = (criteria) => {
    setSortAnchorEl(null);
    setSortCriteria(criteria);
    handleSortChange();
  };

  const handleOpenPlayerModal = (creatorId) => {
    setShowPlayerModal(true);
    setSelectedCreator(creatorId);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  // ------------------- RENDER -------------------
  return (
    <MarketplaceContainer
      style={{
        padding: '16px',
        background: 'rgb(170 170 170 / 6%)',
        borderRadius: '0.3em',
      }}
    >
      {/* Filter & Sort UI */}
      <FilterSortContainer className=" desktop-only">
        <div className="filters">
          <Button onClick={handleFilterClick}>
            Filter&nbsp;
            <FontAwesomeIcon icon={faFilter} />
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => handleFilterClose(null)}
          >
            <MenuItem onClick={() => handleFilterClose('FULL')} selected={loanType === ''}>
              FULL
            </MenuItem>
          </Menu>
        </div>

        <div className="filters">
          <Button onClick={handleSortClick}>
            Sort By&nbsp;
            <FontAwesomeIcon icon={faSort} />
          </Button>
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={() => handleSortClose(null)}
          >
            <MenuItem
              onClick={() => handleSortClose('updated_at')}
              selected={sortCriteria === 'updated_at'}
            >
              Sort by Date Added
            </MenuItem>
            <MenuItem
              onClick={() => handleSortClose('period')}
              selected={sortCriteria === 'period'}
            >
              Sort by Loan Period
            </MenuItem>
          </Menu>
        </div>
      </FilterSortContainer>

      {isMobile && (
        <>
          <Button style={{ marginBottom: '30px' }} variant='contained' color='error' onClick={handleOpenMyLoansModal}>
            Manage Your Loans&nbsp; <AttachMoney />
          </Button>
          <RpsPriceChart isDarkMode={isDarkMode} tokenMintAddress={token} />
        </>
      )}

      {/* Main Product Grid */}
      {!loading ? (
        <ProductGrid>
          {showPlayerModal && (
            <PlayerModal
              selectedCreator={selectedCreator}
              modalIsOpen={showPlayerModal}
              closeModal={handleClosePlayerModal}
            />
          )}

          {data.map((row) => (
            <ProductCard
              key={row._id}
              onClick={() => {
                setCurrentLoanId(row._id);
                setCurrentLoanInfo({
                  lender: row.lender,
                  loan_amount: row.loan_amount,
                  loan_period: row.loan_period,
                  apy: row.apy,
                });
                history.push(`/loan/${row._id}`);
              }}
            >
              <APY>{(row.apy * 100).toFixed(2)}%</APY>
              <ProductCreator>
                {customerInfo[row.lender] ? (
                  <a className="player" onClick={() => handleOpenPlayerModal(row.lender)}>
                    <Avatar
                      className="avatar"
                      src={customerInfo[row.lender].avatar}
                      rank={customerInfo[row.lender].totalWagered}
                      accessory={customerInfo[row.lender].accessory}
                      username={customerInfo[row.lender].username}
                      alt=""
                      darkMode={isDarkMode}
                    />
                  </a>
                ) : (
                  <div className="loading-spinner" />
                )}
              </ProductCreator>
              <ProductInfo>
                <LoanAmount>{convertToCurrency(row.loan_amount, solPrice)}</LoanAmount>
              </ProductInfo>

              <TableContainer>
                <Table id="all-loans" className="product-detail">
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <FontAwesomeIcon icon={faClock} /> Loan Period:
                      </TableCell>
                      <TableCell className="value">{row.loan_period} Days</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <FontAwesomeIcon icon={faUsers} />&nbsp;Loaners:
                      </TableCell>
                      <TableCell className="value cell-joiners">
                        {row.loaners && row.loaners.length > 0 ? (
                          <>
                            {row.loaners.slice(0, 2).map((loaner, index) =>
                              loaner && loaner.avatar ? (
                                <a
                                  key={loaner._id || index}
                                  className="player"
                                  onClick={() => handleOpenPlayerModal(loaner._id)}
                                >
                                  <Avatar
                                    className="avatar"
                                    src={loaner.avatar}
                                    rank={loaner.totalWagered || 0}
                                    username={loaner.username || ''}
                                    accessory={loaner.accessory || ''}
                                    alt={loaner.username || 'Unknown User'}
                                    darkMode={isDarkMode}
                                  />
                                </a>
                              ) : null
                            )}
                            {row.loaners.length > 2 && (
                              <div
                                className="avatar-square"
                                style={{ marginLeft: '20px' }}
                              >
                                <div className="avatar-count">
                                  +{row.loaners.length - 2}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <span>No Loaners</span>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <LoanButton>
                <Tooltip title="Loan">
                  <IconButton
                    variant='contained' color='error'
                    onClick={(e) => {
                      e.stopPropagation(); // prevent triggering ProductCard onClick
                      setCurrentLoanId(row._id);
                      setCurrentLoanInfo(row.lender);
                      if (row.lender !== user) {
                        openConfirmLoanModal();
                      } else {
                        alertModal(isDarkMode, 'THIS IS LITTER-ALLY YOURS ALREADY!');
                      }
                    }}
                  >
                    Loan <SwapHoriz />
                  </IconButton>
                </Tooltip>
              </LoanButton>
            </ProductCard>
          ))}
        </ProductGrid>
      ) : (
        <ProductGrid>
          {[...Array(6)].map((_, index) => (
            <Box key={`skeleton-${index}`} sx={{ padding: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Skeleton variant="text" sx={{ width: '80%', height: 30 }} />
              <Skeleton variant="circular" sx={{ width: 40, height: 40, margin: '10px 0' }} />
              <Skeleton variant="rectangular" sx={{ width: '100%', height: 100 }} />
              <Skeleton variant="text" sx={{ width: '60%', height: 20, margin: '10px 0' }} />
            </Box>
          ))}
        </ProductGrid>
      )}

      {/* Carousel of previous loans */}
      <div className="carousel-container" style={{ marginTop: '30px' }}>
        <h6 className="title">PREVIOUS LOANS</h6>
        <div className="carousel">
          {loansWithProfit && loansWithProfit.length > 0 ? (
            loansWithProfit.map((loan) => (
              <div
                key={loan._id}
                className={`carousel-item ${loan.profit <= 0 ? 'red-gradient' : 'green-gradient'
                  }`}
              >
                <div className="loan-details">
                  <Table className="product-detail">
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <FontAwesomeIcon icon={faUser} /> LENDER:
                        </TableCell>
                        <TableCell style={{ float: 'right' }}>
                          <a
                            className="player"
                            onClick={() => handleOpenPlayerModal(loan.lender)}
                          >
                            <Avatar
                              className="avatar"
                              src={loan.customerInfo.avatar}
                              rank={loan.customerInfo.totalWagered}
                              accessory={loan.customerInfo.accessory}
                              username={loan.customerInfo.username}
                              alt=""
                              darkMode={isDarkMode}
                            />
                          </a>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <FontAwesomeIcon icon={faClock} /> DAYS LEFT:
                        </TableCell>
                        <TableCell className="value">
                          {loan.outstanding === true
                            ? loan.totalLoanerAmount === 0
                              ? 'CLEARED'
                              : 'OUTSTANDING'
                            : loan.outstanding}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <FontAwesomeIcon icon={faMoneyBillAlt} /> UNPAID FUNDS:
                        </TableCell>
                        <TableCell className="value">
                          {convertToCurrency(loan.totalLoanerAmount, solPrice)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <FontAwesomeIcon icon={faUsers} /> LOANERS:
                        </TableCell>
                        <TableCell className="cell-joiners">
                          {loan.loaners.map((loaner, index) => (
                            <a
                              key={index}
                              className="player"
                              onClick={() => handleOpenPlayerModal(loaner.user)}
                            >
                              <Avatar
                                className="avatar"
                                src={loaner.customerInfo.avatar}
                                rank={loaner.customerInfo.totalWagered}
                                accessory={loaner.customerInfo.accessory}
                                username={loaner.customerInfo.username}
                                alt=""
                                darkMode={isDarkMode}
                              />
                            </a>
                          ))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <FontAwesomeIcon icon={faMoneyCheckAlt} /> TOTAL PAID BACK:
                        </TableCell>
                        <TableCell className="value">
                          {convertToCurrency(loan.totalPaidBack, solPrice)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <FontAwesomeIcon icon={faChartLine} /> PROFIT:
                        </TableCell>
                        <TableCell
                          className={`value ${loan.profit <= 0 ? 'profit-negative' : 'profit-positive'
                            }`}
                        >
                          {convertToCurrency(loan.profit, solPrice)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))
          ) : (
            // Skeleton Loader for Carousel
            [...Array(5)].map((_, index) => (
              <div
                key={`skeleton-carousel-item-${index}`}
                className="carousel-item skeleton-item"
              >
                <div className="loan-details">
                  <Skeleton variant="text" width="50%" height={30} style={{ marginBottom: '10px' }} />
                  <Skeleton variant="circle" width={40} height={40} style={{ marginBottom: '10px' }} />
                  <Skeleton variant="text" width="100%" height={20} style={{ marginBottom: '5px' }} />
                  <Skeleton variant="text" width="80%" height={20} style={{ marginBottom: '5px' }} />
                  <Skeleton variant="text" width="60%" height={20} style={{ marginBottom: '5px' }} />
                  <Skeleton variant="rect" width="100%" height={50} style={{ marginBottom: '10px' }} />
                </div>
              </div>
            ))
          )}
          {showMyLoansModal && isMobile && (
            <MyLoansModal
              modalIsOpen={showMyLoansModal}
              closeModal={handleCloseMyLoansModal}
            />
          )}
        </div>
      </div>
    </MarketplaceContainer>
  );
};

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
  data: state.loanReducer.loanArray,
  prevLoans: state.loanReducer.previousLoans,
  pages: state.loanReducer.pages,
  page: state.loanReducer.page,
  loading: state.loanReducer.loading,
  total: state.loanReducer.totalResults,
  isDarkMode: state.auth.isDarkMode,
  user: state.auth.user._id,
  isLowGraphics: state.auth.isLowGraphics,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  acQueryLoan,
  setCurrentLoanId,
  previousLoans,
  setCurrentLoanInfo,
  openConfirmLoanModal,
  acGetCustomerInfo,
};

export default connect(mapStateToProps, mapDispatchToProps)(BankTable);