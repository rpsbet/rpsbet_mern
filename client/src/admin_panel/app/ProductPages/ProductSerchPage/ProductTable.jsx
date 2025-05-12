import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faCubes,
  faGem,
  faSort,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import {
  Box,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  Skeleton,
  Pagination,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { useSelector, useDispatch } from 'react-redux';
import { acQueryItem, setCurrentProductId, setCurrentProductInfo } from '../../../../redux/Item/item.action';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';
import { openConfirmTradeModal, errorMsgBar } from '../../../../redux/Notification/notification.actions';
import Avatar from '../../../../components/Avatar';
import PlayerModal from '../../../../game_panel/modal/PlayerModal';
import { convertToCurrency } from '../../../../util/conversion';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../../../config/theme';

// ---------- Styled Containers ----------
const MarketplaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  width: 100%;
`;

const FilterSortContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`;

// Force 3 items max per row (responsive)
const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  margin: 20px 0;
  @media (max-width: 720px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

// The card container
const ProductCard = styled.div`
  background-color: #2e2e2e;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  height: 320px;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
  &:hover {
    transform: scale(1.03);
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

const ProductCardActions = styled.div`
  display: flex;
  justify-content: center;
`;

const ProductTable = () => {
  const dispatch = useDispatch();
  const theme = getCustomTheme(useSelector((state) => state.auth.isDarkMode) ? 'dark' : 'light');

  // Redux state via hooks
  const data = useSelector((state) => state.itemReducer.itemArray);
  const pages = useSelector((state) => state.itemReducer.pages);
  const page = useSelector((state) => state.itemReducer.page);
  const loading = useSelector((state) => state.itemReducer.loading);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const user = useSelector((state) => state.auth.user);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const isLowGraphics = useSelector((state) => state.auth.isLowGraphics);

  // Local state
  const [customerInfo, setCustomerInfo] = useState({});
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('updated_at');
  const [itemType, setItemType] = useState('653ee81117c9f5ee2124564b');

  // Reference to previous owners to avoid unnecessary fetches
  const prevOwnersRef = useRef(JSON.stringify(data?.owners || []));

  // ----- Effects -----
  // Fetch items if owners change
  useEffect(() => {
    const prevOwners = prevOwnersRef.current;
    const currentOwners = JSON.stringify(data?.owners || []);
    if (prevOwners !== currentOwners) {
      fetchItems();
      prevOwnersRef.current = currentOwners;
    }
  });

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, []);

  // Fetch customer info when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      fetchCustomerInfo();
    }
  }, [data, dispatch]);

  // ----- Functions -----
  const fetchItems = (criteria = sortCriteria, type = itemType) => {
    dispatch(acQueryItem(100, page, criteria, type));
  };

  const fetchCustomerInfo = async () => {
    if (!data) return;
    for (const product of data) {
      if (product.owners && product.owners.length > 0) {
        for (const owner of product.owners) {
          if (!customerInfo[owner.user]) {
            try {
              const info = await dispatch(acGetCustomerInfo(owner.user));
              setCustomerInfo((prev) => ({
                ...prev,
                [owner.user]: info || { username: 'Anon', avatar: 'default-avatar-url' },
              }));
            } catch (error) {
              console.error(`Error fetching customer info for ${owner.user}:`, error);
            }
          }
        }
      }
    }
  };

  // ----- Handlers -----
  const handleFilterClick = (e) => setAnchorEl(e.currentTarget);
  const handleFilterClose = (newItemType) => {
    setAnchorEl(null);
    if (newItemType) {
      setItemType(newItemType);
      fetchItems(sortCriteria, newItemType);
    }
  };

  const handleSortClick = (e) => setSortAnchorEl(e.currentTarget);
  const handleSortClose = (newSortCriteria) => {
    setSortAnchorEl(null);
    if (newSortCriteria) {
      setSortCriteria(newSortCriteria);
      fetchItems(newSortCriteria, itemType);
    }
  };

  // Rent/Trade logic
  const handleTradeOrRent = (row, owner) => {
    dispatch(setCurrentProductId(row._id));
    dispatch(
      setCurrentProductInfo({
        owner: owner.user,
        productName: row.productName,
        rentOption: owner.rentOption,
        price: owner.price,
      })
    );
    if (owner.user !== user) {
      if (row.showConfirmationModal) {
        const userConfirmed = window.confirm(row.message);
        if (userConfirmed) {
          dispatch(openConfirmTradeModal(owner.rentOption ? 'rent' : 'trade'));
        } else {
          dispatch(errorMsgBar('TRADE ACTION CANCELLED,PUSSY-ED OUT'));
        }
      } else {
        dispatch(openConfirmTradeModal(owner.rentOption ? 'rent' : 'trade'));
      }
    } else {
      dispatch(errorMsgBar('THIS IS LITERALLY YOURS ALREADY!'));
    }
  };

  // Sorted leaderboards
  const sortedLeaderboards = data
    ? [...data].sort((a, b) => {
        const aValue = a[sortCriteria];
        const bValue = b[sortCriteria];
        return sortCriteria === 'asc' ? aValue - bValue : bValue - aValue;
      })
    : [];

  // ----- Render -----
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ background: '#080808', borderRadius: '0.3em', p: '20px' }}>
        <MarketplaceContainer>
          {/* Filter/Sort */}
          <FilterSortContainer>
            <div className="filters">
              <Button color="error" variant="outlined" onClick={handleFilterClick}>
                Filter&nbsp;
                <FontAwesomeIcon icon={faFilter} />
              </Button>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => handleFilterClose(null)}>
                <MenuItem
                  onClick={() => handleFilterClose('653ee81117c9f5ee2124564b')}
                  selected={itemType === '653ee81117c9f5ee2124564b'}
                >
                  Accessories
                </MenuItem>
              </Menu>
            </div>
            <div className="filters">
              <Button color="error" variant="outlined" onClick={handleSortClick}>
                Sort By&nbsp;
                <FontAwesomeIcon icon={faSort} />
              </Button>
              <Menu anchorEl={sortAnchorEl} open={Boolean(sortAnchorEl)} onClose={() => handleSortClose(null)}>
                <MenuItem onClick={() => handleSortClose('updated_at')} selected={sortCriteria === 'updated_at'}>
                  Sort by CP
                </MenuItem>
                <MenuItem onClick={() => handleSortClose('price')} selected={sortCriteria === 'price'}>
                  Sort by Price
                </MenuItem>
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
              {/* Conditionally render the PlayerModal */}
              {showPlayerModal && (
                <PlayerModal
                  selectedCreator={selectedCreator}
                  modalIsOpen={showPlayerModal}
                  closeModal={() => setShowPlayerModal(false)}
                />
              )}
              {sortedLeaderboards.map((row) => {
                if (!row.owners?.length) return null;
                const firstOwner = row.owners[0];
                const reserves = row.loan_type === 'FRACTIONAL' ? row.fractional_amount : row.loan_amount;
                return (
                  <ProductCard
                    key={`${row._id}-${firstOwner.user}`}
                    onClick={() => {
                      dispatch(setCurrentProductId(row._id));
                      dispatch(
                        setCurrentProductInfo({
                          owner: firstOwner.user,
                          productName: row.productName,
                          rentOption: firstOwner.rentOption,
                          price: firstOwner.price,
                        })
                      );
                      // history.push(`/product/${row._id}`);
                    }}
                  >
                    {/* Top half: avatar(s) and lottie/image */}
                    <Box
                      sx={{
                        position: 'relative',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {row.owners.map((owner) => (
                        <Box key={owner.user} sx={{ position: 'absolute', top: 8, left: 8 }}>
                          {customerInfo[owner.user] ? (
                            <Box
                              component="a"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setSelectedCreator(customerInfo[owner.user]._id);
                                setShowPlayerModal(true);
                              }}
                              className="player"
                            >
                              <Avatar
                                user_id={customerInfo[owner.user]._id}
                                src={customerInfo[owner.user].avatar}
                                rank={customerInfo[owner.user].totalWagered}
                                accessory={customerInfo[owner.user].accessory}
                                elite={customerInfo[owner.user].elite}
                                alt=""
                                username={customerInfo[owner.user].username}
                                darkMode={isDarkMode}
                              />
                            </Box>
                          ) : (
                            <Skeleton variant="circular" width={40} height={40} />
                          )}
                        </Box>
                      ))}
                      {/* {row.image && renderLottieAnimation(row.image, isLowGraphics) ? (
                        <Box sx={{ width: 80, height: 80 }}>
                          {renderLottieAnimation(row.image, isLowGraphics)}
                        </Box>
                      ) : (
                        <Box
                          component="img"
                          src={row.image}
                          alt={row.productName}
                          sx={{ maxWidth: 80, maxHeight: 80, borderRadius: 2 }}
                        />
                      )} */}
                    </Box>
                    {/* Bottom half: product details and trade button */}
                    <Box
                      sx={{
                        flex: 1,
                        p: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontSize: '1rem',
                            color: '#fff',
                            textAlign: 'center',
                          }}
                        >
                          {row.productName}
                        </Typography>
                        <TableContainer>
                          <Table size="small" aria-label="loan-details-table">
                            <TableBody>
                              <TableRow>
                                <TableCell sx={{ color: '#bbb' }}>
                                  <FontAwesomeIcon icon={faTag} />{' '}
                                  {firstOwner.rentOption ? 'Price / month' : 'Price / unit'}:
                                </TableCell>
                                <TableCell sx={{ color: '#ff8500' }}>
                                  {convertToCurrency(firstOwner.price, solPrice)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ color: '#bbb' }}>
                                  <FontAwesomeIcon icon={faCubes} /> Quantity:
                                </TableCell>
                                <TableCell sx={{ color: '#ff8500' }}>
                                  {firstOwner.onSale} / {row.total_count}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                      <Box sx={{ textAlign: 'right', mt: 1 }}>
                        <Tooltip title={firstOwner.rentOption ? 'Rent' : 'Trade'}>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<SwapHoriz />}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Dispatch trade/rent logic
                              dispatch(setCurrentProductId(row._id));
                              dispatch(
                                setCurrentProductInfo({
                                  owner: firstOwner.user,
                                  productName: row.productName,
                                  rentOption: firstOwner.rentOption,
                                  price: firstOwner.price,
                                })
                              );
                              if (firstOwner.user !== user) {
                                if (row.showConfirmationModal) {
                                  const userConfirmed = window.confirm(row.message);
                                  if (userConfirmed) {
                                    dispatch(openConfirmTradeModal(firstOwner.rentOption ? 'rent' : 'trade'));
                                  } else {
                                    dispatch(errorMsgBar('TRADE ACTION CANCELLED,PUSSY-ED OUT'));
                                  }
                                } else {
                                  dispatch(openConfirmTradeModal(firstOwner.rentOption ? 'rent' : 'trade'));
                                }
                              } else {
                                dispatch(errorMsgBar('THIS IS LITERALLY YOURS ALREADY!'));
                              }
                              // history.push(`/product/${row._id}`);
                            }}
                          >
                            {firstOwner.rentOption ? 'Rent' : 'Trade'}
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                  </ProductCard>
                );
              })}
            </ProductGrid>
          )}
          {!loading && (
            <PaginationContainer>
              <Pagination
                page={page}
                count={pages}
                color="error"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '4px',
                  },
                }}
                onChange={(event, newPage) => {
                  dispatch(acQueryItem(100, newPage, sortCriteria, itemType));
                }}
              />
            </PaginationContainer>
          )}
        </MarketplaceContainer>
      </Box>
      {showPlayerModal && (
        <PlayerModal
          selectedCreator={selectedCreator}
          modalIsOpen={showPlayerModal}
          closeModal={() => setShowPlayerModal(false)}
        />
      )}
    </ThemeProvider>
  );
};

export default ProductTable;