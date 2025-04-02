import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
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
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentLoanId, setCurrentLoanInfo } from '../../../../redux/Loan/loan.action';
import { openDeListLoanModal } from '../../../../redux/Notification/notification.actions';

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

// Styled components
const FilterSortContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  width: 100%;
  margin: 20px 0;
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

const MyBankTable = () => {
  const dispatch = useDispatch();

  // Redux state
  const data = useSelector((state) => state.loanReducer.myLoanArray);
  const loading = useSelector((state) => state.loanReducer.loading);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const userInfo = useSelector((state) => state.auth.user);
  const solPrice = useSelector((state) => state.logic.solPrice);

  // Local state
  const [customerInfo, setCustomerInfo] = useState({});
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('updated_at');
  const [_id] = useState(userInfo._id);
  const [loanType, setLoanType] = useState('');

  // Fetch customer info for owners in the data when it changes
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      for (const product of data || []) {
        if (product.owners && product.owners.length > 0) {
          for (const owner of product.owners) {
            if (!customerInfo[owner.user]) {
              try {
                const info = await dispatch(acGetCustomerInfo(owner.user));
                setCustomerInfo((prev) => ({
                  ...prev,
                  [owner.user]:
                    info || { username: 'Anon', avatar: 'default-avatar-url' },
                }));
              } catch (error) {
                console.error(`Error fetching customer info for ${owner.user}:`, error);
              }
            }
          }
        }
      }
    };
    fetchCustomerInfo();
    // eslint-disable-next-line
  }, [data]);

  // Handlers for filter and sort menus
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

  // Player modal handlers
  const handleOpenPlayerModal = useCallback((creator_id) => {
    setShowPlayerModal(true);
    setSelectedCreator(creator_id);
  }, []);
  const handleClosePlayerModal = useCallback(() => setShowPlayerModal(false), []);

  // Sorting logic
  const sortedLeaderboards = data
    ? [...data].sort((a, b) => {
        const aValue = a[sortCriteria];
        const bValue = b[sortCriteria];
        return sortCriteria === 'asc' ? aValue - bValue : bValue - aValue;
      })
    : [];

  return (
    <Box sx={{ background: '#2D3A4A', borderRadius: '0.3em', p: '20px' }}>
      {/* Filter & Sort UI */}
      <FilterSortContainer>
        <div className="filters">
          <Button
            color="error"
            variant="outlined"
            onClick={handleFilterClick}
            startIcon={<FontAwesomeIcon icon={faFilter} />}
          >
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
      {loading ? (
        <Box sx={{ textAlign: 'center', fontStyle: 'italic', color: 'text.secondary' }}>
          No Loans Found
        </Box>
      ) : (
        <ProductGrid>
          {showPlayerModal && (
            <PlayerModal
              selectedCreator={selectedCreator}
              modalIsOpen={showPlayerModal}
              closeModal={handleClosePlayerModal}
            />
          )}
          {sortedLeaderboards.map((row) => {
            const reserves =
              row.loan_type === 'FRACTIONAL' ? row.fractional_amount : row.loan_amount;
            return (
              <Card
                key={row._id}
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)' },
                }}
                onClick={() => {
                  dispatch(setCurrentLoanId(row._id));
                  dispatch(
                    setCurrentLoanInfo({
                      lender: row.lender,
                      loan_amount: row.loan_amount,
                      loan_period: row.loan_period,
                      apy: row.apy,
                    })
                  );
                  // history.push(`/loan/${row._id}`);
                }}
              >
                <LoanAPY>{(row.apy * 100).toFixed(2)}%</LoanAPY>
                <Card variant="outlined" sx={{ mb: 0.5 }}>
                  <CardContent
                    sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <h3 style={{ margin: 0 }}>
                        {convertToCurrency(row.loan_amount, solPrice)}{' '}
                        <span style={{ fontSize: 'small' }}>
                          / {row.loan_amount} SOL
                        </span>
                      </h3>
                    </Box>
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
                                          src={loaner.avatar}
                                          rank={loaner.totalWagered || 0}
                                          user_id={loaner._id}
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
                <ProductCardActions>
                  {row.onSale === 0 ? null : (
                    <Tooltip title="Withdraw Funds">
                      <Button
                        variant="contained"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(setCurrentLoanId(row._id));
                          dispatch(openDeListLoanModal());
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
      )}
    </Box>
  );
};

export default MyBankTable;