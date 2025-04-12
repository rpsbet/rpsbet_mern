import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

// MUI v5
import {
  ThemeProvider,
  Box,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Skeleton,
  Pagination,
  Typography,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faCubes, faGem, faFilter } from '@fortawesome/free-solid-svg-icons';
import { SwapHoriz, Cancel } from '@mui/icons-material';

// Redux + Actions
import {
  acQueryMyItem,
  setCurrentProductId,
  setCurrentProductInfo,
  returnItem,
} from '../../../../redux/Item/item.action';
import { equipItem, fetchAccessory } from '../../../../redux/Logic/logic.actions';
import {
  openListItemModal,
  openDeListItemModal,
  errorMsgBar,
} from '../../../../redux/Notification/notification.actions';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';

// Local
import PlayerModal from '../../../../game_panel/modal/PlayerModal';

import { convertToCurrency } from '../../../../util/conversion';
import { getCustomTheme } from '../../../../config/theme';

// -------------- Styled Containers ----------------
const MarketplaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const FilterSortContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
  width: 100%;
  margin: 20px 0;

  @media (min-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

const ProductCard = styled.div`
  background-color: #2e2e2e;
  border-radius: 8px;
  height: 320px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.03);
  }
`;

// -------------- Utility to compare owners --------------
function areOwnersEqual(prevOwners, currentOwners) {
  return JSON.stringify(prevOwners) === JSON.stringify(currentOwners);
}

// -------------- Functional Component --------------
function MyProductTable() {
  const dispatch = useDispatch();
  const {
    data,
    pages,
    page,
    loading,
    accessory,
    isDarkMode,
    userInfo,
    isLowGraphics,
  } = useSelector((state) => ({
    data: state.itemReducer.myItemArray,
    pages: state.itemReducer.pages,
    page: state.itemReducer.page,
    loading: state.itemReducer.loading,
    accessory: state.itemReducer.accessory,
    isDarkMode: state.auth.isDarkMode,
    userInfo: state.auth.user,
    isLowGraphics: state.auth.isLowGraphics,
  }));

  // Local state
  const [customerInfo, setCustomerInfo] = useState({});
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('updated_at');
  const [itemType, setItemType] = useState('653ee81117c9f5ee2124564b');

  // Compare owners from previous
  const prevOwnersRef = useRef();

  // MUI theme
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  // -------------- Effects --------------
  useEffect(() => {
    if (userInfo?._id) {
      dispatch(fetchAccessory(userInfo._id));
      dispatch(acQueryMyItem(100, page, sortCriteria, itemType));
    }
  }, [dispatch, userInfo?._id, page, sortCriteria, itemType]);

  useEffect(() => {
    const prevOwners = prevOwnersRef.current;
    const currentOwners = JSON.stringify(data?.owners || []);
    if (prevOwners && prevOwners !== currentOwners) {
      dispatch(acQueryMyItem(100, page, sortCriteria, itemType));
    }
    prevOwnersRef.current = currentOwners;
  }, [data, dispatch, page, sortCriteria, itemType]);

  useEffect(() => {
    fetchCustomerData();
  }, [data]);

  // -------------- Functions --------------
  const fetchItems = async () => {
    await dispatch(acQueryMyItem(100, page, sortCriteria, itemType));
  };

  const fetchCustomerData = async () => {
    if (!data) return;
    for (const product of data) {
      if (product.owners && product.owners.length > 0) {
        for (const owner of product.owners) {
          if (!customerInfo[owner.user]) {
            try {
              const info = await dispatch(acGetCustomerInfo(owner.user));
              setCustomerInfo((prev) => ({
                ...prev,
                [owner.user]: info.payload || { username: 'Anon', avatar: 'default-avatar-url' },
              }));
            } catch (error) {
              console.error(`Error fetching customer info for ${owner.user}:`, error);
            }
          }
        }
      }
    }
  };

  const handleModalClose = () => {
    dispatch(fetchAccessory(userInfo._id));
    fetchItems();
  };

  // -------------- Filter logic --------------
  const handleFilterClick = (e) => setAnchorEl(e.currentTarget);
  const handleFilterClose = (filter) => {
    setAnchorEl(null);
    if (filter) {
      setItemType(filter);
      fetchItems();
    }
  };

  // -------------- Action Handlers --------------
  const handleOpenPlayerModal = (creator_id) => {
    setSelectedCreator(creator_id);
    setShowPlayerModal(true);
  };
  const handleClosePlayerModal = () => setShowPlayerModal(false);

  const handleEquip = async (itemId, itemImage) => {
    const response = await dispatch(equipItem({ item_id: itemId }));
    if (response.payload?.success) {
      handleModalClose();
      dispatch(errorMsgBar(response.payload.message, '-cat'));
    } else {
      dispatch(errorMsgBar('Unable to Equip item. De-List item first.'));
    }
  };

  const handleReturnItem = (rowId) => {
    dispatch(setCurrentProductId(rowId));
    dispatch(returnItem(rowId));
  };

  const handleListItem = (row) => {
    dispatch(setCurrentProductId(row._id));
    dispatch(
      setCurrentProductInfo({
        item_type: row.item_type,
        productName: row.productName,
        rentOption: row.rentOption,
        price: row.price,
        onSale: row.onSale,
      })
    );
    dispatch(openListItemModal());
  };

  const handleDeListItem = (row) => {
    dispatch(setCurrentProductId(row._id));
    dispatch(openDeListItemModal());
  };

  // -------------- Render --------------
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ background: '#080808', borderRadius: '0.3em', p: '20px' }}>
        <MarketplaceContainer>
          <FilterSortContainer>
            <div className="filters">
              <Button color="error" variant="outlined" onClick={handleFilterClick}>
                Filter <FontAwesomeIcon icon={faFilter} />
              </Button>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => handleFilterClose(null)}>
                <MenuItem
                  onClick={() => handleFilterClose('653ee81117c9f5ee2124564b')}
                  selected={itemType === '653ee81117c9f5ee2124564b'}
                >
                  Accessory
                </MenuItem>
              </Menu>
            </div>
          </FilterSortContainer>

          {loading ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mt: 2 }}>
              {Array.from(new Array(6)).map((_, i) => (
                <Box key={i}>
                  <Skeleton variant="rectangular" width={165} height={160} sx={{ mb: 1 }} />
                  <Skeleton variant="text" width={120} />
                  <Skeleton variant="text" width={100} />
                </Box>
              ))}
            </Box>
          ) : (
            <ProductGrid>
              {data?.map((row) => (
                <Box
                  key={row._id}
                  sx={{
                    backgroundColor: '#2e2e2e',
                    borderRadius: 2,
                    height: 320,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.03)' },
                  }}
                  onClick={() => {
                    dispatch(setCurrentProductId(row._id));
                    dispatch(
                      setCurrentProductInfo({
                        item_type: row.item_type,
                        productName: row.productName,
                        rentOption: row.rentOption,
                        price: row.price,
                        onSale: row.onSale,
                      })
                    );
                    // history.push(`/product/${row._id}`);
                  }}
                >
                  {/* Top half => avatar + lottie */}
                  <Box
                    sx={{
                      flex: 1,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* {row.image && renderLottieAnimation(row.image, isLowGraphics) ? (
                      <Box sx={{ width: 80, height: 80 }}>{renderLottieAnimation(row.image, isLowGraphics)}</Box>
                    ) : (
                      <Box
                        component="img"
                        src={row.image}
                        alt={row.productName}
                        sx={{ maxWidth: 80, maxHeight: 80, borderRadius: 2 }}
                      />
                    )} */}
                  </Box>

                  {/* Bottom => details + action buttons */}
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
                      <Typography variant="h6" sx={{ fontSize: '1rem', color: '#fff', textAlign: 'center' }}>
                        {row.productName}
                      </Typography>
                      <TableContainer>
                        <Table className="product-detail">
                          <TableBody>
                            {row.rentOption && row.onSale === 0 ? (
                              <TableRow>
                                <TableCell sx={{ color: '#bbb' }}>
                                  <FontAwesomeIcon icon={faTag} /> Cost Per Month:
                                </TableCell>
                                <TableCell sx={{ color: '#ff8500' }}>{convertToCurrency(row.price)}</TableCell>
                              </TableRow>
                            ) : (
                              <TableRow>
                                <TableCell sx={{ color: '#bbb' }}>
                                  <FontAwesomeIcon icon={faTag} />{' '}
                                  {row.rentOption ? 'Price Per Month:' : 'Price Per Unit:'}
                                </TableCell>
                                <TableCell sx={{ color: '#ff8500' }}>{convertToCurrency(row.price)}</TableCell>
                              </TableRow>
                            )}
                            {row.rentOption && row.onSale === 0 ? null : (
                              <TableRow>
                                <TableCell sx={{ color: '#bbb' }}>
                                  {row.rentOption ? 'Renting Out:' : 'On Sale:'}
                                </TableCell>
                                <TableCell sx={{ color: '#ff8500' }}>{row.onSale}</TableCell>
                              </TableRow>
                            )}
                            <TableRow>
                              <TableCell sx={{ color: '#bbb' }}>
                                <FontAwesomeIcon icon={faCubes} /> Total:
                              </TableCell>
                              <TableCell sx={{ color: '#ff8500' }}>{row.total_count}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ color: '#bbb' }}>
                                <FontAwesomeIcon icon={faGem} /> Type:
                              </TableCell>
                              <TableCell sx={{ color: '#ff8500' }}>Accessory</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                      {row.onSale === 0 && row.rentOption ? (
                        <Tooltip title="Discontinue Renting">
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReturnItem(row._id);
                            }}
                          >
                            RETURN
                          </Button>
                        </Tooltip>
                      ) : (
                        <>
                          {row.onSale !== row.total_count && (
                            <Tooltip title="List Item">
                              <Button
                                variant="contained"
                                color="error"
                                startIcon={<SwapHoriz />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleListItem(row);
                                }}
                              >
                                LIST
                              </Button>
                            </Tooltip>
                          )}
                          {row.onSale > 0 && (
                            <Tooltip title="De-List Item">
                              <Button
                                variant="contained"
                                color="error"
                                startIcon={<SwapHoriz />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeListItem(row);
                                }}
                              >
                                DE-LIST
                              </Button>
                            </Tooltip>
                          )}
                        </>
                      )}
                      {row.item_type === '653ee81117c9f5ee2124564b' && row.onSale === 0 && (
                        <Tooltip title={accessory && accessory === row.image ? 'Unequip Item' : 'Equip Item'}>
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={<SwapHoriz />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquip(row._id, row.image);
                            }}
                          >
                            {accessory && accessory === row.image ? 'UNEQUIP' : 'EQUIP'}
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </ProductGrid>
          )}

          {!loading && (
            <PaginationContainer>
              <Pagination
                page={page}
                count={pages}
                color="error"
                sx={{ '& .MuiPaginationItem-root': { borderRadius: '4px' } }}
                onChange={(event, newPage) => {
                  dispatch(acQueryMyItem(100, newPage, sortCriteria, itemType));
                }}
              />
            </PaginationContainer>
          )}

          {showPlayerModal && (
            <PlayerModal
              selectedCreator={selectedCreator}
              modalIsOpen={showPlayerModal}
              closeModal={handleClosePlayerModal}
            />
          )}
        </MarketplaceContainer>
      </Box>
    </ThemeProvider>
  );
}

export default MyProductTable;