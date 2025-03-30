import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { connect, useDispatch } from 'react-redux';

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
  Typography
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faCubes, faGem, faFilter } from '@fortawesome/free-solid-svg-icons';
import { SwapHoriz, Cancel } from '@mui/icons-material';

// Redux + Actions
import {
  acQueryMyItem,
  setCurrentProductId,
  setCurrentProductInfo,
  returnItem
} from '../../../../redux/Item/item.action';
import {
  equipItem,
  fetchAccessory,
} from '../../../../redux/Logic/logic.actions';
import {
  openListItemModal,
  openDeListItemModal,
  errorMsgBar
} from '../../../../redux/Notification/notification.actions';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';

// Local
import PlayerModal from '../../../../game_panel/modal/PlayerModal';
import history from '../../../../redux/history';
import Avatar from '../../../../components/Avatar';
import { convertToCurrency } from '../../../../util/conversion';
import { renderLottieAnimation } from '../../../../util/LottieAnimations';
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
  /* Default to 1 column (or however many you want) */
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
  width: 100%;
  margin: 20px 0;

  /* On large screens (≥900px), force 2 columns max */
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

// Each card 320px high, split top/bottom
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
function MyProductTable(props) {
  const {
    data,
    pages,
    page,
    loading,
    acQueryMyItem,
    setCurrentProductId,
    setCurrentProductInfo,
    openListItemModal,
    openDeListItemModal,
    equipItem,
    userInfo,
    returnItem,
    isDarkMode,
    isLowGraphics
  } = props;

  // Local state
  const [customerInfo, setCustomerInfo] = useState({});
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('updated_at');
  const [itemType, setItemType] = useState('653ee81117c9f5ee2124564b');
  const dispatch = useDispatch();

  // Compare owners from previous
  const prevOwnersRef = useRef(JSON.stringify(data?.owners || []));

  // MUI theme
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');
  // -------------- Effects --------------
  // On mount
  useEffect(() => {
    fetchAccessory(userInfo._id);
    fetchItems();
    // no dependencies => no hooking
  }, []);

  // If data changes => re-check owners
  useEffect(() => {
    const prevOwners = prevOwnersRef.current;
    const currentOwners = JSON.stringify(data?.owners || []);
    if (prevOwners !== currentOwners) {
      fetchItems();
      prevOwnersRef.current = currentOwners;
    }
    // no dependencies
  });

  // Each time data changes => fetch user info for owners
  useEffect(() => {
    fetchCustomerData();
    // no dependencies
  });

  // -------------- Functions --------------
  const fetchItems = async () => {
    const { page } = props;
    await acQueryMyItem(100, page, sortCriteria, itemType);
  };

  const fetchAccessory = async (_id) => {
    try {
      await props.fetchAccessory({ _id });
    } catch (error) {
      console.error('Error fetching accessory:', error);
    }
  };

  const fetchCustomerData = async () => {
    if (!data) return;
    for (const product of data) {
      if (product.owners && product.owners.length > 0) {
        for (const owner of product.owners) {
          if (!customerInfo[owner.user]) {
            try {
              const info = await props.acGetCustomerInfo(owner.user);
              setCustomerInfo(prev => ({
                ...prev,
                [owner.user]: info || { username: 'Anon', avatar: 'default-avatar-url' }
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
    fetchAccessory(userInfo._id);
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
    const response = await equipItem({ item_id: itemId });
    if (response.success) {
      handleModalClose();
      // Dispatch the error message (or notification) for success with the optional '-cat' parameter
      dispatch(errorMsgBar(response.message, '-cat'));
    } else {
      // Dispatch the error message for failure
      dispatch(errorMsgBar('Unable to Equip item. De-List item first.'));
    }
  };

  const handleReturnItem = (rowId) => {
    setCurrentProductId(rowId);
    returnItem(rowId);
  };

  const handleListItem = (row) => {
    setCurrentProductId(row._id);
    setCurrentProductInfo({
      item_type: row.item_type,
      productName: row.productName,
      rentOption: row.rentOption,
      price: row.price,
      onSale: row.onSale
    });
    openListItemModal();
  };

  const handleDeListItem = (row) => {
    setCurrentProductId(row._id);
    openDeListItemModal();
  };

  // -------------- Render --------------
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ background: '#2D3A4A', borderRadius: '0.3em', p: '20px' }}>
        <MarketplaceContainer>
          <FilterSortContainer>
            <div className="filters">
              <Button color="error" variant="outlined" onClick={handleFilterClick}>
                Filter&nbsp;
                <FontAwesomeIcon icon={faFilter} />
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => handleFilterClose(null)}
              >
                <MenuItem
                  onClick={() => handleFilterClose('653ee81117c9f5ee2124564b')}
                  selected={itemType === '653ee81117c9f5ee2124564b'}
                >
                  Accessory
                </MenuItem>
              </Menu>
            </div>
          </FilterSortContainer>

          {props.loading ? (
            // SKELETONS
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
              {showPlayerModal && (
                <PlayerModal
                  selectedCreator={selectedCreator}
                  modalIsOpen={showPlayerModal}
                  closeModal={handleClosePlayerModal}
                />
              )}

              {data.map((row) => {

                return (
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
                      '&:hover': { transform: 'scale(1.03)' }
                    }}
                    onClick={() => {
                      setCurrentProductId(row._id);
                      setCurrentProductInfo({
                        item_type: row.item_type,
                        productName: row.productName,
                        rentOption: row.rentOption,
                        price: row.price,
                        onSale: row.onSale
                      });
                      history.push(`/product/${row._id}`);
                    }}
                  >
                    {/* Top half => avatar + lottie */}
                    <Box
                      sx={{
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >

                      {/* Lottie or image => center */}
                      {row.image && renderLottieAnimation(row.image, isLowGraphics) ? (
                        <Box sx={{ width: 80, height: 80 }}>
                          {renderLottieAnimation(row.image, isLowGraphics)}
                        </Box>
                      ) : (
                        <Box
                          component="img"
                          src={row.image}
                          alt={row.productName}
                          sx={{
                            maxWidth: 80,
                            maxHeight: 80,
                            borderRadius: 2
                          }}
                        />
                      )}
                    </Box>

                    {/* Bottom => details + action buttons */}
                    <Box
                      sx={{
                        flex: 1,
                        p: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      {/* Info */}
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{ fontSize: '1rem', color: '#fff', textAlign: 'center' }}
                        >
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
                                  <TableCell sx={{ color: '#ff8500' }}>
                                    {convertToCurrency(row.price)}
                                  </TableCell>
                                </TableRow>
                              ) : (
                                <TableRow>
                                  <TableCell sx={{ color: '#bbb' }}>
                                    <FontAwesomeIcon icon={faTag} />{' '}
                                    {row.rentOption ? 'Price Per Month:' : 'Price Per Unit:'}
                                  </TableCell>
                                  <TableCell sx={{ color: '#ff8500' }}>
                                    {convertToCurrency(row.price)}
                                  </TableCell>
                                </TableRow>
                              )}

                              {/* OnSale row */}
                              {row.rentOption && row.onSale === 0 ? null : (
                                <TableRow>
                                  <TableCell sx={{ color: '#bbb' }}>
                                    {row.rentOption ? 'Renting Out:' : 'On Sale:'}
                                  </TableCell>
                                  <TableCell sx={{ color: '#ff8500' }}>
                                    {row.onSale}
                                  </TableCell>
                                </TableRow>
                              )}

                              {/* Total count */}
                              <TableRow>
                                <TableCell sx={{ color: '#bbb' }}>
                                  <FontAwesomeIcon icon={faCubes} /> Total:
                                </TableCell>
                                <TableCell sx={{ color: '#ff8500' }}>
                                  {row.total_count}
                                </TableCell>
                              </TableRow>
                              {/* item_type */}
                              <TableRow>
                                <TableCell sx={{ color: '#bbb' }}>
                                  <FontAwesomeIcon icon={faGem} /> Type:
                                </TableCell>
                                <TableCell sx={{ color: '#ff8500' }}>
                                  Accessory
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>

                      {/* Action Buttons at bottom row */}
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                        {/* If onSale=0 + rentOption => discontinue */}
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
                          // Otherwise show "List" & "De-List" if needed
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

                        {/* If item is accessory => Equip / Unequip */}
                        {row.item_type === '653ee81117c9f5ee2124564b' && row.onSale === 0 && (
                          <Tooltip
                            title={
                              props.accessory && props.accessory === row.image
                                ? 'Unequip Item'
                                : 'Equip Item'
                            }
                          >
                            <Button
                              variant="contained"
                              color="error"
                              startIcon={<SwapHoriz />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEquip(row._id, row.image);
                              }}
                            >
                              {props.accessory && props.accessory === row.image
                                ? 'UNEQUIP'
                                : 'EQUIP'}
                            </Button>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </ProductGrid>
          )}

          {/* Pagination => if not loading */}
          {!loading && (
            <PaginationContainer>
              <Pagination
                page={page}
                count={pages}
                color="error"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '4px'
                  }
                }}
                onChange={(event, newPage) => {
                  acQueryMyItem(100, newPage, sortCriteria, itemType);
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

// ----------- Redux Connections -----------
const mapStateToProps = (state) => ({
  data: state.itemReducer.myItemArray,
  pages: state.itemReducer.pages,
  page: state.itemReducer.page,
  loading: state.itemReducer.loading,
  total: state.itemReducer.totalResults,
  accessory: state.itemReducer.accessory,
  showListItemModal: state.snackbar.showListItemModal,
  showDeListItemModal: state.snackbar.showDeListItemModal,
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  isLowGraphics: state.auth.isLowGraphics
});

const mapDispatchToProps = {
  acQueryMyItem,
  setCurrentProductId,
  setCurrentProductInfo,
  openListItemModal,
  openDeListItemModal,
  acGetCustomerInfo,
  equipItem,
  fetchAccessory,
  returnItem
};

export default connect(mapStateToProps, mapDispatchToProps)(MyProductTable);