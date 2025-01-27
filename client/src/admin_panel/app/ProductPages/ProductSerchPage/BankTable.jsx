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
  Box,
  Card,
  CardContent,
  CardActions,
  Typography
} from '@mui/material';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import AttachMoney from '@mui/icons-material/AttachMoney';
import { convertToCurrency } from '../../../../util/conversion';
import { updateDigitToPoint2 } from '../../../../util/helper';
import Avatar from '../../../../components/Avatar';
import PlayerModal from '../../../../game_panel/modal/PlayerModal';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../../../config/theme';


const token = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';

// ---------------- STYLED COMPONENTS (layout wrappers) ----------------


const FilterSortContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;

  .filters {
    display: flex;
    gap: 10px;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  width: 100%;
  margin: 20px 0;
`;

const PreviousLoansContainer = styled.div`
  width: 100%;
  margin-top: 30px;

  .title {
    margin-bottom: 10px;
    text-align: left;
  }

  .carousel {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
`;

const LoanAPY = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #28a745;
  color: #fff;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const ProductCardActions = styled(CardActions)`
  display: flex;
  justify-content: center;
`;

// Helper for profit text color
const ProfitSpan = styled.span`
  color: ${(props) => (props.negative ? '#f44336' : '#4caf50')};
  font-weight: 600;
`;

// ---------------- COMPONENT ----------------
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
  useEffect(() => {
    (async () => {
      // By default, fetch previousLoans(30, 1, 'loan_amount', '')
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

  useEffect(() => {
    // If data changes significantly, re-fetch
    if (
      data &&
      data.length &&
      data.some((currentLoan, index) => {
        if (!props.data[index]) return false;
        return currentLoan.loan_amount !== props.data[index].loan_amount;
      })
    ) {
      fetchLoans();
      props.previousLoans();
    }
  }, [data]);

  useEffect(() => {
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const fetchCustomerInfo = useCallback(async () => {
    for (const product of data) {
      if (product.lender && !customerInfo[product.lender]) {
        try {
          const info = await props.acGetCustomerInfo(product.lender);
          setCustomerInfo((prev) => ({
            ...prev,
            [product.lender]: info || {
              username: 'Anon',
              avatar: 'default-avatar-url'
            },
          }));
        } catch (error) {
          console.error(`Error fetching customer info for ${product.lender}:`, error);
        }
      }
    }
  }, [data, customerInfo, props]);


  useEffect(() => {
    fetchCustomerInfo();
  }, [fetchCustomerInfo, data]);

  // ------------------- HELPER METHODS -------------------
  const fetchLoans = useCallback(() => {
    const { acQueryLoan, page } = props;
    acQueryLoan(30, page, sortCriteria, loanType);
  }, [props, sortCriteria, loanType]);

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
            loaner.customerInfo = lInfo;
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

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');


  // ------------------- RENDER -------------------
  return (
    <ThemeProvider theme={theme}>

      <Box sx={{ background: 'rgba(170, 170, 170, 0.06)', borderRadius: '0.3em', p: '20px' }}>

        {/* Filter & Sort UI */}
        <FilterSortContainer className="desktop-only">
          <div className="filters">
            <Button color='error' onClick={handleFilterClick} variant="outlined" startIcon={<FontAwesomeIcon icon={faFilter} />}>
              Filter
            </Button>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => handleFilterClose(null)}>
              <MenuItem onClick={() => handleFilterClose('FULL')} selected={loanType === ''}>
                FULL
              </MenuItem>
              {/* Add other filter items as needed */}
            </Menu>
          </div>

          <div className="filters">
            <Button color='error' onClick={handleSortClick} variant="outlined" startIcon={<FontAwesomeIcon icon={faSort} />}>
              Sort By
            </Button>
            <Menu anchorEl={sortAnchorEl} open={Boolean(sortAnchorEl)} onClose={() => handleSortClose(null)}>
              <MenuItem
                onClick={() => handleSortClose('updated_at')}
                selected={sortCriteria === 'updated_at'}
              >
                Date Added
              </MenuItem>
              <MenuItem
                onClick={() => handleSortClose('period')}
                selected={sortCriteria === 'period'}
              >
                Loan Period
              </MenuItem>
            </Menu>
          </div>
        </FilterSortContainer>

        {isMobile && (
          <>
            <Button
              style={{ marginBottom: '30px' }}
              variant='contained'
              color='error'
              onClick={handleOpenMyLoansModal}
              startIcon={<AttachMoney />}
            >
              Manage Your Loans
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
              <Card
                key={row._id}
                sx={{
                  position: 'relative',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
                onClick={() => {
                  setCurrentLoanId(row._id);
                  setCurrentLoanInfo({
                    lender: row.lender,
                    loan_amount: row.loan_amount,
                    loan_period: row.loan_period,
                    apy: row.apy
                  });
                  history.push(`/loan/${row._id}`);
                }}
              >
                {/* APY badge in top-right corner */}
                <LoanAPY>{(row.apy * 100).toFixed(2)}%</LoanAPY>

                <CardContent>
                  {/* Lender/Creator Avatar */}
                  {customerInfo[row.lender] ? (
                    <div style={{ marginBottom: '8px' }}>
                      <a
                        className="player"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPlayerModal(row.lender);
                        }}
                        style={{ textDecoration: 'none', cursor: 'pointer' }}
                      >
                        <Avatar
                          src={customerInfo[row.lender].avatar}
                          rank={customerInfo[row.lender].totalWagered}
                          accessory={customerInfo[row.lender].accessory}
                          username={customerInfo[row.lender].username}
                          alt=""
                          darkMode={isDarkMode}
                        />
                      </a>
                    </div>
                  ) : (
                    <Skeleton variant="circular" width={40} height={40} />
                  )}

                  {/* Loan Amount */}
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, marginBottom: 1 }}
                  >
                    {convertToCurrency(row.loan_amount, solPrice)}
                  </Typography>

                  {/* Table of details */}
                  <TableContainer>
                    <Table size="small" aria-label="loan details">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <FontAwesomeIcon icon={faClock} />&nbsp;Days:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            {row.loan_period} Days
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <FontAwesomeIcon icon={faUsers} />&nbsp;Loaners:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            {row.loaners && row.loaners.length > 0 ? (
                              <>
                                {row.loaners.slice(0, 2).map((loaner, index) =>
                                  loaner && loaner.avatar ? (
                                    <a
                                      key={`${loaner._id}-${index}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenPlayerModal(loaner._id);
                                      }}
                                      style={{ cursor: 'pointer' }}
                                      className='player'
                                    >
                                      <Avatar
                                        src={loaner.avatar}
                                        rank={loaner.totalWagered || 0}
                                        accessory={loaner.accessory || ''}
                                        username={loaner.username || ''}
                                        darkMode={isDarkMode}
                                        alt={loaner.username || 'Unknown'}
                                      />
                                    </a>
                                  ) : null
                                )}
                                {row.loaners.length > 2 && (
                                  <span
                                    style={{
                                      marginLeft: '6px',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    +{row.loaners.length - 2}
                                  </span>
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
                </CardContent>

                {/* Loan Button */}
                <ProductCardActions>
                  <Tooltip title="Participate in loan">
                    <IconButton
                      variant='contained'
                      color='error'
                      onClick={(e) => {
                        e.stopPropagation(); // prevent triggering Card onClick
                        setCurrentLoanId(row._id);
                        setCurrentLoanInfo(row.lender);
                        if (row.lender !== user) {
                          openConfirmLoanModal();
                        } else {
                          alertModal(isDarkMode, 'This is already your loan!');
                        }
                      }}
                    >
                      <SwapHoriz />
                    </IconButton>
                  </Tooltip>
                </ProductCardActions>
              </Card>
            ))}
          </ProductGrid>
        ) : (
          // Skeleton for loading
          <ProductGrid>
            {[...Array(6)].map((_, index) => (
              <Box
                key={`skeleton-${index}`}
                sx={{
                  padding: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Skeleton variant="text" sx={{ width: '80%', height: 30 }} />
                <Skeleton variant="circular" sx={{ width: 40, height: 40, margin: '10px 0' }} />
                <Skeleton variant="rectangular" sx={{ width: '100%', height: 100 }} />
                <Skeleton variant="text" sx={{ width: '60%', height: 20, margin: '10px 0' }} />
              </Box>
            ))}
          </ProductGrid>
        )}

        {/* Carousel of previous loans */}
        <PreviousLoansContainer>
          <Typography variant="h6" className="title">
            PREVIOUS LOANS
          </Typography>

          <div className="carousel">
            {loansWithProfit && loansWithProfit.length > 0 ? (
              loansWithProfit.map((loan) => (
                <Card
                  key={loan._id}
                  sx={{
                    position: 'relative',
                    borderRadius: 2,
                    padding: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <CardContent>
                    <Table size="small" aria-label="previous loan details">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <FontAwesomeIcon icon={faUser} />&nbsp;Lender:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <a
                              onClick={() => handleOpenPlayerModal(loan.lender)}
                              style={{ cursor: 'pointer' }}
                            >
                              <Avatar
                                src={loan.customerInfo?.avatar}
                                rank={loan.customerInfo?.totalWagered}
                                accessory={loan.customerInfo?.accessory}
                                username={loan.customerInfo?.username}
                                alt=""
                                darkMode={isDarkMode}
                              />
                            </a>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <FontAwesomeIcon icon={faClock} />&nbsp;Status:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            {loan.outstanding === true
                              ? loan.totalLoanerAmount === 0
                                ? 'CLEARED'
                                : 'OUTSTANDING'
                              : `${loan.outstanding}`.toUpperCase()}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <FontAwesomeIcon icon={faMoneyBillAlt} />&nbsp;Unpaid:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            {convertToCurrency(loan.totalLoanerAmount, solPrice)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <FontAwesomeIcon icon={faUsers} />&nbsp;Loaners:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            {loan.loaners.map((loaner, index) => (
                              <a
                                key={`${loaner.user}-${index}`}
                                onClick={() => handleOpenPlayerModal(loaner.user)}
                                style={{ marginRight: '4px', cursor: 'pointer' }}
                              >
                                <Avatar
                                  src={loaner.customerInfo?.avatar}
                                  rank={loaner.customerInfo?.totalWagered}
                                  accessory={loaner.customerInfo?.accessory}
                                  username={loaner.customerInfo?.username}
                                  alt=""
                                  darkMode={isDarkMode}
                                />
                              </a>
                            ))}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <FontAwesomeIcon icon={faMoneyCheckAlt} />&nbsp;Total Paid Back:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            {convertToCurrency(loan.totalPaidBack, solPrice)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <FontAwesomeIcon icon={faChartLine} />&nbsp;Profit:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <ProfitSpan negative={loan.profit <= 0}>
                              {convertToCurrency(loan.profit, solPrice)}
                            </ProfitSpan>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Skeleton Loader for Carousel
              [...Array(5)].map((_, index) => (
                <Card
                  key={`skeleton-carousel-item-${index}`}
                  sx={{
                    borderRadius: 2,
                    padding: '8px'
                  }}
                >
                  <CardContent>
                    <Skeleton variant="text" width="50%" height={30} style={{ marginBottom: '10px' }} />
                    <Skeleton variant="circular" width={40} height={40} style={{ marginBottom: '10px' }} />
                    <Skeleton variant="text" width="100%" height={20} style={{ marginBottom: '5px' }} />
                    <Skeleton variant="text" width="80%" height={20} style={{ marginBottom: '5px' }} />
                    <Skeleton variant="text" width="60%" height={20} style={{ marginBottom: '5px' }} />
                    <Skeleton variant="rectangular" width="100%" height={50} />
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {showMyLoansModal && isMobile && (
            <MyLoansModal
              modalIsOpen={showMyLoansModal}
              closeModal={handleCloseMyLoansModal}
            />
          )}
        </PreviousLoansContainer>
      </Box>
    </ThemeProvider>

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
