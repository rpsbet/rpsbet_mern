import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';

import styled from 'styled-components';
import { connect } from 'react-redux';
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
  faChartLine,
  faChevronLeft,    // ← We'll use these for left/right carousel arrows
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import {
  acQueryLoan,
  previousLoans,
  setCurrentLoanId,
  setCurrentLoanInfo
} from '../../../../redux/Loan/loan.action';
import { openConfirmLoanModal } from '../../../../redux/Notification/notification.actions';
import history from '../../../../redux/history';
import { errorMsgBar } from '../../../../redux/Notification/notification.actions';
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
`;

/** NEW: A wrapper that holds the arrows and the actual carousel container */
const CarouselWrapper = styled.div`
  position: relative;    /* so arrows can be placed absolutely */
  display: flex;
  align-items: center;   /* center the arrow buttons vertically */
`;

/** NEW: The horizontally scrollable container */
const CarouselContainer = styled.div`
  display: flex;
  gap: 16px;
  overflow-x: auto;
  /* Optionally use scroll-snap to make it “snap” between cards:
     scroll-snap-type: x mandatory; */

  /* Customize scrollbar (optional): */
  scrollbar-width: thin;          /* Firefox */
  &::-webkit-scrollbar {
    height: 8px;                  /* height for horizontal scroller */
  }
  &::-webkit-scrollbar-thumb {
    background-color: #aaa;
    border-radius: 4px;
  }

  /* Make the cards a fixed width so they scroll horizontally,
     or let them shrink if you prefer. */
  .carousel-card {
    min-width: 300px;  /* force each card to be 300px wide, for example */
    /* scroll-snap-align: start; */ /* if using snap */
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
  const dispatch = useDispatch();

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
  const [previousLoansLoading, setLoadingPreviousLoans] = useState(false);

  // NEW: We'll hold a ref to the carousel so we can scroll it:
  const carouselRef = useRef(null);

  // ------------------- EFFECTS -------------------
  useEffect(() => {
    (async () => {
      setLoadingPreviousLoans(true);
      await props.previousLoans(30, 1, 'loan_amount', '');
      try {
        const result = await attachLoansWithProfit(props.prevLoans);
        setLoansWithProfit(result);
        setLoadingPreviousLoans(false);
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

  // NEW: scroll the carousel left/right by a fixed offset, e.g. 300px
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  // ------------------- RENDER -------------------
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ background: 'rgba(170, 170, 170, 0.06)', borderRadius: '0.3em', p: '20px' }}>
        {/* Filter & Sort UI */}
        <FilterSortContainer className="desktop-only">
          <div className="filters">
            <Button
              color="error"
              onClick={handleFilterClick}
              variant="outlined"
              startIcon={<FontAwesomeIcon icon={faFilter} />}
            >
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
            <Button
              color="error"
              onClick={handleSortClick}
              variant="outlined"
              startIcon={<FontAwesomeIcon icon={faSort} />}
            >
              Sort By
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
              variant="contained"
              color="error"
              fullWidth
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
          data && data.length > 0 ? (
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
                  }}
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
                  {/* APY badge in top-right corner */}
                  <LoanAPY>{(row.apy * 100).toFixed(2)}%</LoanAPY>

                  <Card variant="outlined" sx={{ mb: 0.5 }}>
                    <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Lender/Creator Avatar */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {customerInfo[row.lender] ? (
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
                              user_id={customerInfo[row.lender]._id}
                              alt=""
                              darkMode={isDarkMode}
                              style={{ width: 48, height: 48 }}
                            />
                          </a>
                        ) : (
                          <Skeleton variant="circular" width={48} height={48} />
                        )}
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Lender
                          </Typography>
                          <Typography variant="body2">
                            {customerInfo[row.lender]?.username || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Loan Amount (with label) */}
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                          {convertToCurrency(row.loan_amount, solPrice)}{' '}
                          <span style={{ fontSize: 'small' }}>/ {row.loan_amount} SOL</span>
                        </Typography>
                      </Box>

                      {/* Table of Details */}
                      <TableContainer>
                        <Table size="small" aria-label="loan-details-table">
                          <TableBody>
                            {/* Loan Period */}
                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none', width: '40%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FontAwesomeIcon icon={faClock} />
                                  <Typography variant="body2">Days</Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                {row.loan_period} Days
                              </TableCell>
                            </TableRow>

                            {/* Loaners */}
                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FontAwesomeIcon icon={faUsers} />
                                  <Typography variant="body2">Loaners</Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                {row.loaners && row.loaners.length > 0 ? (
                                  <Box className="cell-joiners" sx={{ display: 'flex', alignItems: 'center' }}>
                                    {row.loaners.slice(0, 2).map((loaner, index) =>
                                      loaner && loaner.avatar ? (
                                        <a
                                          key={`${loaner._id}-${index}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenPlayerModal(loaner._id);
                                          }}
                                          style={{ cursor: 'pointer' }}
                                          className="player"
                                        >
                                          <Avatar
                                            src={loaner.avatar}
                                            rank={loaner.totalWagered || 0}
                                            accessory={loaner.accessory || ''}
                                            user_id={loaner._id || ''}
                                            username={loaner.username || ''}
                                            darkMode={isDarkMode}
                                            alt={loaner.username || 'Unknown'}
                                            style={{ width: 32, height: 32 }}
                                          />
                                        </a>
                                      ) : null
                                    )}
                                    {row.loaners.length > 2 && (
                                      <Typography
                                        variant="body2"
                                        sx={{ ml: 1, fontSize: '0.8rem', fontWeight: 600 }}
                                      >
                                        +{row.loaners.length - 2}
                                      </Typography>
                                    )}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    No Loaners
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>

                  {/* Loan Button */}
                  <ProductCardActions>
                    <Tooltip title="Participate in loan">
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation(); // prevent triggering Card onClick
                          setCurrentLoanId(row._id);
                          setCurrentLoanInfo({
                            lender: row.lender,
                            loan_amount: row.loan_amount,
                            loan_period: row.loan_period,
                            apy: row.apy,
                          });
                          if (row.lender !== user) {
                            openConfirmLoanModal();
                          } else {
                            dispatch(errorMsgBar('This is already your loan!'));
                          }
                        }}
                        sx={{ mb: 1 }}
                      >
                        LOAN
                        <SwapHoriz sx={{ ml: 1 }} />
                      </Button>
                    </Tooltip>
                  </ProductCardActions>
                </Card>
              ))}
            </ProductGrid>
          ) : (
            // If data is empty (and we're not loading), show "No Loans Available"
            <Typography variant="body2" sx={{ textAlign: 'center', fontStyle: 'italic', color: 'text.secondary' }}>
              No Loans Available
            </Typography>
          )
        ) : (
          // Skeleton if still loading
          <ProductGrid>
            {[...Array(6)].map((_, index) => (
              <Box
                key={`skeleton-${index}`}
                sx={{
                  padding: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
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
          <Typography variant="h6" className="roll-tag title">
            PREVIOUS LOANS
          </Typography>

          <CarouselWrapper>
            {/* Left arrow */}
            <IconButton
              color="error"
              onClick={scrollLeft}
              sx={{ position: 'relative', zIndex: 2 }}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </IconButton>

            <CarouselContainer ref={carouselRef}>
              {previousLoansLoading ? (
                // 1) If still loading => skeletons
                [...Array(5)].map((_, index) => (
                  <Card
                    key={`skeleton-carousel-item-${index}`}
                    className="carousel-card"
                    sx={{
                      borderRadius: 2,
                      padding: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <CardContent>
                      <Skeleton variant="text" width="50%" height={30} sx={{ mb: 1 }} />
                      <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="100%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="rectangular" width="100%" height={50} />
                    </CardContent>
                  </Card>
                ))
              ) : loansWithProfit &&
                loansWithProfit.filter(
                  loan =>
                    !(loan.totalLoanerAmount === 0 &&
                      loan.totalPaidBack === 0 &&
                      loan.profit === 0)
                ).length > 0 ? (
                // 2) If NOT loading and there are loans after filtering => map over them
                loansWithProfit
                  .filter(
                    loan =>
                      !(loan.totalLoanerAmount === 0 &&
                        loan.totalPaidBack === 0 &&
                        loan.profit === 0)
                  )
                  .map(loan => (
                    <Card
                      key={loan._id}
                      className="carousel-card"
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        padding: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <CardContent>
                        <Table size="small" aria-label="previous loan details">
                          <TableBody>
                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <FontAwesomeIcon icon={faUser} /> Lender:
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <a
                                  onClick={() => handleOpenPlayerModal(loan.lender)}
                                  style={{ cursor: 'pointer' }}
                                  className="player"
                                >
                                  <Avatar
                                    user_id={loan.customerInfo?._id}
                                    src={loan.customerInfo?.avatar}
                                    rank={loan.customerInfo?.totalWagered}
                                    accessory={loan.customerInfo?.accessory}
                                    username={loan.customerInfo?.username}
                                    alt=""
                                    className="avatar"
                                    darkMode={isDarkMode}
                                  />
                                </a>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <FontAwesomeIcon icon={faClock} /> Status:
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
                                <FontAwesomeIcon icon={faMoneyBillAlt} /> Unpaid:
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                {convertToCurrency(loan.totalLoanerAmount, solPrice)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <FontAwesomeIcon icon={faUsers} /> Loaners:
                              </TableCell>
                              <TableCell className="cell-joiners" sx={{ borderBottom: 'none' }}>
                                {loan.loaners.map((loaner, index) => (
                                  <a
                                    key={`${loaner.user}-${index}`}
                                    onClick={() => handleOpenPlayerModal(loaner.user)}
                                    style={{ marginRight: '4px', cursor: 'pointer' }}
                                    className="player"
                                  >
                                    <Avatar
                                      className="avatar"
                                      user_id={loaner.customerInfo?._id}
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
                                <FontAwesomeIcon icon={faMoneyCheckAlt} /> Total Paid Back:
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                {convertToCurrency(loan.totalPaidBack, solPrice)}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <FontAwesomeIcon icon={faChartLine} /> Profit:
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
                // 3) If NOT loading, but empty => "No previous loans"
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: 'center',
                    fontStyle: 'italic',
                    color: 'text.secondary',
                  }}
                >
                  No previous loans
                </Typography>
              )}
            </CarouselContainer>

            {/* Right arrow */}
            <IconButton
              color="error"
              onClick={scrollRight}
              sx={{ position: 'relative', zIndex: 2 }}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </IconButton>
          </CarouselWrapper>

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
