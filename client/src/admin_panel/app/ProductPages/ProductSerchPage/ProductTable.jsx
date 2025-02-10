import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { connect, useDispatch } from 'react-redux';
import {
  Box,
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
  Pagination,
  Typography,
} from '@mui/material';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faCubes,
  faGem,
  faSort,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';

// Redux + Others
import {
  acQueryItem,
  setCurrentProductId,
  setCurrentProductInfo,
} from '../../../../redux/Item/item.action';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';
import {
  openConfirmTradeModal,
  errorMsgBar,
} from '../../../../redux/Notification/notification.actions';

import Avatar from '../../../../components/Avatar';
import PlayerModal from '../../../../game_panel/modal/PlayerModal';
import history from '../../../../redux/history';

import { convertToCurrency } from '../../../../util/conversion';
import { renderLottieAnimation } from '../../../../util/LottieAnimations';
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

// Force 3 items max per row
const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 columns max */
  gap: 16px;
  width: 100%;
  margin: 20px 0;
  @media (max-width: 720px) {
    grid-template-columns: repeat(2, 1fr); /* 1 column on small screens */
  }
  @media (max-width: 480px) {
    grid-template-columns: repeat(1, 1fr); /* 1 column on small screens */
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

// The card container (top half + bottom half)
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

// ---------- Utility: compare owners ----------
function areOwnersEqual(prevOwners, currentOwners) {
  return JSON.stringify(prevOwners) === JSON.stringify(currentOwners);
}

// ---------- Main Functional Component ----------
const ProductTable = (props) => {
  const {
    data,
    pages,
    page,
    loading,
    acQueryItem,
    setCurrentProductId,
    setCurrentProductInfo,
    openConfirmTradeModal,
    acGetCustomerInfo,
    user,
    isDarkMode,
    isLowGraphics,
  } = props;

  // Local state
  const [customerInfo, setCustomerInfo] = useState({});
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('updated_at');
  const [itemType, setItemType] = useState('653ee81117c9f5ee2124564b');

  const dispatch = useDispatch();

  // Compare owners from previous render
  const prevOwnersRef = useRef(JSON.stringify(data?.owners || []));

  // itemType map
  const itemTypeMap = {
    '653ee7ac17c9f5ee21245649': 'RRPS Card',
    '653ee7df17c9f5ee2124564a': 'Game Background',
    '653ee81117c9f5ee2124564b': 'Accessories',
    '654231df29446bc96d689d0f': 'Tools',
    '6542321929446bc96d689d10': 'Games',
  };

  // MUI theme
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  // ----- Effects -----

  // Check if owners changed => fetch items
  useEffect(() => {
    const prevOwners = prevOwnersRef.current;
    const currentOwners = JSON.stringify(data?.owners || []);
    if (prevOwners !== currentOwners) {
      fetchItems();
      prevOwnersRef.current = currentOwners;
    }
    // no deps to avoid react-hooks/exhaustive-deps
  });

  // If data changes => fetch user info
  useEffect(() => {
    fetchItems();
    // no deps
  }, []);

  useEffect(() => {
    if (data && data.length > 0) {
      fetchCustomerInfo();
    }

    // no deps
  }, [data]);

  // ----- Functions -----
  const fetchItems = (criteria = sortCriteria, type = itemType) => {
    acQueryItem(100, page, criteria, type);
  };

  const fetchCustomerInfo = async () => {
    if (!data) return;
    for (const product of data) {
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
              console.error(
                `Error fetching customer info for ${owner.user}:`,
                error,
              );
            }
          }
        }
      }
    }
  };

  // Player Modal
  const handleOpenPlayerModal = (creatorId) => {
    console.log('creatorId', creatorId);
    setSelectedCreator(creatorId);
    setShowPlayerModal(true);
  };
  const handleClosePlayerModal = () => setShowPlayerModal(false);

  // Filter
  const handleFilterClick = (e) => setAnchorEl(e.currentTarget);
  const handleFilterClose = (newItemType) => {
    setAnchorEl(null);
    if (newItemType) {
      setItemType(newItemType);
      fetchItems(sortCriteria, newItemType);
    }
  };

  // Sort
  const handleSortClick = (e) => setSortAnchorEl(e.currentTarget);
  const handleSortClose = (newSortCriteria) => {
    setSortAnchorEl(null);
    if (newSortCriteria) {
      setSortCriteria(newSortCriteria);
      fetchItems(newSortCriteria, itemType);
    }
  };

  // Rent / Trade logic
  const handleTradeOrRent = (row, owner) => {
    setCurrentProductId(row._id);
    setCurrentProductInfo({
      owner: owner.user,
      productName: row.productName,
      rentOption: owner.rentOption,
      price: owner.price,
    });

    if (owner.user !== user) {
      if (row.showConfirmationModal) {
        const userConfirmed = window.confirm(row.message);
        if (userConfirmed) {
          openConfirmTradeModal(owner.rentOption ? 'rent' : 'trade');
        } else {
          dispatch(errorMsgBar('TRADE ACTION CANCELLED,PUSSY-ED OUT'));
        }
      } else {
        openConfirmTradeModal(owner.rentOption ? 'rent' : 'trade');
      }
    } else {
      dispatch(errorMsgBar('THIS IS LITERALLY YOURS ALREADY!'));
    }
  };

  // ----- Render -----
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          background: 'rgba(170, 170, 170, 0.06)',
          borderRadius: '0.3em',
          p: '20px',
        }}
      >
        <MarketplaceContainer>
          {/* Filter/Sort */}
          <FilterSortContainer>
            <div className="filters">
              <Button
                color="error"
                variant="outlined"
                onClick={handleFilterClick}
              >
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
                  Accessories
                </MenuItem>
              </Menu>
            </div>

            <div className="filters">
              <Button
                color="error"
                variant="outlined"
                onClick={handleSortClick}
              >
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
                  Sort by CP
                </MenuItem>
                <MenuItem
                  onClick={() => handleSortClose('price')}
                  selected={sortCriteria === 'price'}
                >
                  Sort by Price
                </MenuItem>
              </Menu>
            </div>
          </FilterSortContainer>

          {/* If loading => skeletons */}
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'center',
                mt: 2,
              }}
            >
              {Array.from(new Array(6)).map((_, i) => (
                <Box key={i}>
                  <Skeleton
                    variant="rectangular"
                    width={165}
                    height={160}
                    sx={{ mb: 1 }}
                  />
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
                if (!row.owners?.length) return null;
                const firstOwner = row.owners[0];

                return (
                  <ProductCard
                    key={`${row._id}-${firstOwner.user}`}
                    onClick={() => {
                      setCurrentProductId(row._id);
                      setCurrentProductInfo({
                        owner: firstOwner.user,
                        productName: row.productName,
                        rentOption: firstOwner.rentOption,
                        price: firstOwner.price,
                      });
                      history.push(`/product/${row._id}`);
                    }}
                  >
                    {/* TOP HALF => avatar + lottie */}
                    <Box
                      sx={{
                        position: 'relative',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {/* Avatars => top-left */}
                      {row.owners.map((owner) => (
                        <Box
                          key={owner.user}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                          }}
                        >
                          {customerInfo[owner.user] ? (
                            <Box
                              component="a"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleOpenPlayerModal(
                                  customerInfo[owner.user]._id,
                                );
                              }}
                              className="player"
                            >
                              <Avatar
                                className="avatar"
                                user_id={customerInfo[owner.user]._id}
                                src={customerInfo[owner.user].avatar}
                                rank={customerInfo[owner.user].totalWagered}
                                accessory={customerInfo[owner.user].accessory}
                                alt=""
                                username={customerInfo[owner.user].username}
                                darkMode={isDarkMode}
                              />
                            </Box>
                          ) : (
                            <Skeleton
                              variant="circular"
                              width={40}
                              height={40}
                            />
                          )}
                        </Box>
                      ))}

                      {/* Lottie or Image => center */}
                      {row.image &&
                      renderLottieAnimation(row.image, isLowGraphics) ? (
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
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </Box>

                    {/* BOTTOM HALF => details + trade button */}
                    <Box
                      sx={{
                        flex: 1,
                        p: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Details */}
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
                          <Table id="all-trades" className="product-detail">
                            <TableBody>
                              <TableRow>
                                <TableCell sx={{ color: '#bbb' }}>
                                  <FontAwesomeIcon icon={faTag} />{' '}
                                  {firstOwner.rentOption
                                    ? 'Price / month'
                                    : 'Price / unit'}
                                  :
                                </TableCell>
                                <TableCell sx={{ color: '#ff8500' }}>
                                  {convertToCurrency(firstOwner.price)}
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

                      {/* Trade/Rent button => always visible bottom-right */}
                      <Box sx={{ textAlign: 'right', mt: 1 }}>
                        <Tooltip
                          title={firstOwner.rentOption ? 'Rent' : 'Trade'}
                        >
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={<SwapHoriz />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTradeOrRent(row, firstOwner);
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

          {/* Pagination => only if not loading */}
          {!loading && (
            <PaginationContainer>
              <Pagination
                page={page}
                count={pages}
                color="error"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: '4px', // "rounded square" corners
                  },
                }}
                onChange={(event, newPage) => {
                  acQueryItem(100, newPage, sortCriteria, itemType);
                }}
              />
            </PaginationContainer>
          )}

          {/* If there's a PlayerModal open */}
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
};

// ---------- Redux Connections ----------
const mapStateToProps = (state) => ({
  data: state.itemReducer.itemArray,
  pages: state.itemReducer.pages,
  page: state.itemReducer.page,
  loading: state.itemReducer.loading,
  total: state.itemReducer.totalResults,
  showConfirmTradeModal: state.snackbar.showConfirmTradeModal,
  isDarkMode: state.auth.isDarkMode,
  user: state.auth.user._id,
  isLowGraphics: state.auth.isLowGraphics,
});

const mapDispatchToProps = {
  acQueryItem,
  setCurrentProductId,
  setCurrentProductInfo,
  openConfirmTradeModal,
  acGetCustomerInfo,
};

export default connect(mapStateToProps, mapDispatchToProps)(ProductTable);
