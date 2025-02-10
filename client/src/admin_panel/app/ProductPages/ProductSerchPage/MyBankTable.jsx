import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import moment from 'moment';
import { convertToCurrency } from '../../../../util/conversion';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faCalendar,
  faUsers,
  faTags,
  faPiggyBank,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import {
  setCurrentLoanId,
  setCurrentLoanInfo
} from '../../../../redux/Loan/loan.action';
import { openDeListLoanModal } from '../../../../redux/Notification/notification.actions';
import history from '../../../../redux/history';
import {
  Button,
  Menu,
  MenuItem,
  Select,
  Skeleton,
  Box,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
} from '@mui/material';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';
import Avatar from '../../../../components/Avatar';
import PlayerModal from '../../../../game_panel/modal/PlayerModal';

// ---------------- STYLED COMPONENTS ----------------

// The same FilterSortContainer from BankTable
const FilterSortContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`;

// The same ProductGrid from BankTable
const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  width: 100%;
  margin: 20px 0;
`;

// The same APY badge (LoanAPY) used in BankTable
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

// The same CardActions styling from BankTable
const ProductCardActions = styled(CardActions)`
  display: flex;
  justify-content: center;
`;

// ---------------- COMPONENT ----------------
const MyBankTable = (props) => {
  const {
    data,
    loading,
    setCurrentLoanId,
    setCurrentLoanInfo,
    openDeListLoanModal,
    solPrice,
    isDarkMode,
    userInfo,
    acGetCustomerInfo,
  } = props;

  // ---------- Local State ----------
  const [customerInfo, setCustomerInfo] = useState({});
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('updated_at');
  const [_id] = useState(userInfo._id);
  const [loanType, setLoanType] = useState('');

  // ---------- Effects ----------
  useEffect(() => {
    fetchCustomerInfo();
    // eslint-disable-next-line
  }, [data]);

  // ---------- Methods ----------
  const fetchCustomerInfo = async () => {
    for (const product of data || []) {
      if (product.owners && product.owners.length > 0) {
        for (const owner of product.owners) {
          if (!customerInfo[owner.user]) {
            try {
              const info = await acGetCustomerInfo(owner.user);
              setCustomerInfo((prev) => ({
                ...prev,
                [owner.user]: info || {
                  username: 'Anon',
                  avatar: 'default-avatar-url',
                },
              }));
            } catch (error) {
              console.error(`Error fetching customer info for ${owner.user}:`, error);
            }
          }
        }
      }
    }
  };

  // ---------- Handlers ----------
  const handleFilterClick = (event) => setAnchorEl(event.currentTarget);
  const handleFilterClose = (filter) => {
    setAnchorEl(null);
    setLoanType(filter);
  };

  const handleSortClick = (event) => setSortAnchorEl(event.currentTarget);
  const handleSortClose = (criteria) => {
    setSortAnchorEl(null);
    setSortCriteria(criteria);
  };

  const handleOpenPlayerModal = (creator_id) => {
    setShowPlayerModal(true);
    setSelectedCreator(creator_id);
  };
  const handleClosePlayerModal = () => setShowPlayerModal(false);

  // ---------- Render ----------
  return (
    <Box sx={{ background: 'rgba(170, 170, 170, 0.06)', borderRadius: '0.3em', p: '20px' }}>
      {/* Filter & Sort UI */}
      <FilterSortContainer>
        <div className="filters">
          <Button color="error" variant="outlined" onClick={handleFilterClick} startIcon={<FontAwesomeIcon icon={faFilter} />}>
            Filter
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => handleFilterClose(null)}
          >
            <MenuItem
              onClick={() => handleFilterClose('FULL')}
              selected={loanType === 'FULL'}
            >
              ALL
            </MenuItem>
          </Menu>
        </div>

        <div className="filters">
          <Button color="error" variant="outlined" onClick={handleSortClick}>
            Sort By
          </Button>
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={() => handleSortClose(null)}
          >
            <Select
              value={sortCriteria}
              onChange={(e) => setSortCriteria(e.target.value)}
              variant="standard"
              disableUnderline
              style={{ marginLeft: 8, minWidth: 150 }}
            >
              <MenuItem value="updated_at">Date Added</MenuItem>
              <MenuItem value="period">Loan Period</MenuItem>
              <MenuItem value="apy">Interest Rate</MenuItem>
            </Select>
          </Menu>
        </div>
      </FilterSortContainer>

      {/* Main Content */}
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

            {data.map((row) => {
              // If row.fractional_amount applies, define reserves
              const reserves =
                row.loan_type === 'FRACTIONAL'
                  ? row.loan_amount * (row.fractional_amount / 100)
                  : row.loan_amount;

              return (
                <Card
                  key={row._id}
                  sx={{
                    position: 'relative',
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
                      apy: row.apy,
                    });
                    history.push(`/loan/${row._id}`);
                  }}
                >
                  {/* APY badge in top-right corner */}
                  <LoanAPY>{(row.apy * 100).toFixed(2)}%</LoanAPY>

                  <Card variant="outlined" sx={{ mb: 0.5 }}>
                    <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Top Info / Possibly Lender Avatar */}
                      {/* If you store 'row.lender' in row.owners as well, adapt accordingly */}
                      {/* Example: row.owners?.[0].user is the lender? Or row.lender? */}
                      {/* We'll just show row.lender’s avatar if needed. */}
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
                          <span>No Lender Info</span>
                        )}
                        <Box>
                          <strong>Lender</strong>
                          <div>{customerInfo[row.lender]?.username || 'Unknown'}</div>
                        </Box>
                      </Box>

                      {/* Loan Amount */}
                      <Box sx={{ textAlign: 'center' }}>
                        <h3 style={{ margin: 0 }}>
                          {convertToCurrency(row.loan_amount, solPrice)}{' '}
                          <span style={{ fontSize: 'small' }}>/ {row.loan_amount} SOL</span>
                        </h3>
                      </Box>

                      {/* Table of details */}
                      <TableContainer>
                        <Table size="small" aria-label="loan-details-table">
                          <TableBody>
                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none', width: '40%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FontAwesomeIcon icon={faCalendar} />
                                  <span>Loan Period</span>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                {row.loan_period} days
                              </TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FontAwesomeIcon icon={faUsers} />
                                  <span>Loaners</span>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                {row.loaners && row.loaners.length > 0 ? (
                                  <Box
                                    className="cell-joiners"
                                    sx={{ display: 'flex', alignItems: 'center' }}
                                  >
                                    {row.loaners.slice(0, 2).map((loaner, index) =>
                                      loaner && loaner.avatar ? (
                                        <a
                                          key={loaner._id || index}
                                          className="player"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenPlayerModal(loaner._id);
                                          }}
                                          style={{ cursor: 'pointer', marginRight: '8px' }}
                                        >
                                          <Avatar
                                            className="avatar"
                                            user_id={loaner._id}
                                            src={loaner.avatar}
                                            rank={loaner.totalWagered || 0}
                                            accessory={loaner.accessory || ''}
                                            alt={loaner.username || 'Unknown'}
                                            darkMode={isDarkMode}
                                            style={{ width: 32, height: 32 }}
                                          />
                                        </a>
                                      ) : null
                                    )}
                                    {row.loaners.length > 2 && (
                                      <span style={{ marginLeft: '4px', fontWeight: 600 }}>
                                        +{row.loaners.length - 2}
                                      </span>
                                    )}
                                  </Box>
                                ) : (
                                  <span>No Loaners</span>
                                )}
                              </TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FontAwesomeIcon icon={faTags} />
                                  <span>Loan Type</span>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                {row.loan_type}
                              </TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FontAwesomeIcon icon={faPiggyBank} />
                                  <span>Reserves</span>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                {convertToCurrency(reserves, solPrice)}
                              </TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FontAwesomeIcon icon={faClock} />
                                  <span>Created</span>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                {moment(row.created_at).fromNow()}
                              </TableCell>
                            </TableRow>

                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>

                  {/* Actions / Withdraw Button */}
                  <ProductCardActions>
                    {row.onSale === 0 ? null : (
                      <Tooltip title="Withdraw Funds">
                        <Button
                          variant="contained"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentLoanId(row._id);
                            openDeListLoanModal();
                          }}
                        >
                          WITHDRAW <SwapHoriz />
                        </Button>
                      </Tooltip>
                    )}
                  </ProductCardActions>
                </Card>
              );
            })}
          </ProductGrid>
        ) : (
          // If no data available
          <Box sx={{ textAlign: 'center', fontStyle: 'italic', color: 'text.secondary' }}>
            No Loans Found
          </Box>
        )
      ) : (
        // Skeleton loaders if still loading
        <ProductGrid>
          {[...Array(5)].map((_, index) => (
            <Box
              key={`skeleton-${index}`}
              sx={{
                padding: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #ddd',
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <Skeleton variant="text" sx={{ width: '80%', height: 30 }} />
              <Skeleton variant="rectangular" sx={{ width: '100%', height: 200, my: 1 }} />
              <Skeleton variant="text" sx={{ width: '50%', height: 20 }} />
              <Skeleton variant="text" sx={{ width: '70%', height: 20, my: 1 }} />
              <Skeleton variant="text" sx={{ width: '60%', height: 20 }} />
              <Skeleton variant="text" sx={{ width: '50%', height: 20, mt: 1 }} />
            </Box>
          ))}
        </ProductGrid>
      )}
    </Box>
  );
};

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
  data: state.loanReducer.myLoanArray,
  pages: state.loanReducer.pages,
  page: state.loanReducer.page,
  loading: state.loanReducer.loading,
  total: state.loanReducer.totalResults,
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  isLowGraphics: state.auth.isLowGraphics,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  setCurrentLoanId,
  setCurrentLoanInfo,
  openDeListLoanModal,
  acGetCustomerInfo,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyBankTable);
