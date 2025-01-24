import React, { useEffect, useState, useCallback } from 'react';
import { connect } from 'react-redux';

// MUI Imports
import {
  Box,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  Grid,
  Skeleton,
  Pagination,
  IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faCubes,
  faGem,
  faFilter,
  faSort
} from '@fortawesome/free-solid-svg-icons';

import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import PlayerModal from '../../../../game_panel/modal/PlayerModal';
import Avatar from '../../../../components/Avatar';
import { alertModal } from '../../../../game_panel/modal/ConfirmAlerts';
import history from '../../../../redux/history';
import { renderLottieAnimation } from '../../../../util/LottieAnimations';
import { convertToCurrency } from '../../../../util/conversion';

// Redux Actions
import {
  acQueryItem,
  setCurrentProductId,
  setCurrentProductInfo
} from '../../../../redux/Item/item.action';
import {
  openConfirmTradeModal,
  // possibly other notification actions
} from '../../../../redux/Notification/notification.actions';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';

// Hardcoded item-type name mapping
const itemTypeMap = {
  '653ee7ac17c9f5ee21245649': 'RRPS Card',
  '653ee7df17c9f5ee2124564a': 'Game Background',
  '653ee81117c9f5ee2124564b': 'Accessories',
  '654231df29446bc96d689d0f': 'Tools',
  '6542321929446bc96d689d10': 'Games'
};

function ProductTable({
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
  solPrice,
  isDarkMode,
  isLowGraphics
}) {
  // ------------------ STATE ------------------
  const [customerInfo, setCustomerInfo] = useState({});
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  // Filter / Sort
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [itemType, setItemType] = useState('653ee81117c9f5ee2124564b');
  const [sortCriteria, setSortCriteria] = useState('updated_at');

  // ------------------ MUI RESPONSIVE HELPERS ------------------
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ------------------ DATA FETCHING ------------------
  /**
   * Fetch items whenever page, sortCriteria, or itemType changes.
   * Show only 10 items per page here.
   */
  const fetchItems = useCallback(() => {
    acQueryItem(10, page, sortCriteria, itemType);
  }, [acQueryItem, page, sortCriteria, itemType]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /**
   * Fetches customer info for each product's owners
   * whenever `data` changes.
   */
  useEffect(() => {
    const fetchCustomerInfoForOwners = async () => {
      const updatedInfo = { ...customerInfo };
      for (const product of data || []) {
        if (product.owners && product.owners.length > 0) {
          for (const owner of product.owners) {
            // If not already fetched
            if (!updatedInfo[owner.user]) {
              try {
                const info = await acGetCustomerInfo(owner.user);
                updatedInfo[owner.user] = info || {
                  username: 'Anon',
                  avatar: 'default-avatar-url'
                };
              } catch (error) {
                console.error(`Error fetching customer info for ${owner.user}:`, error);
              }
            }
          }
        }
      }
      setCustomerInfo(updatedInfo);
    };

    if (!loading && data?.length) {
      fetchCustomerInfoForOwners();
    }
  }, [data, loading]);

  // ------------------ FILTER & SORT HANDLERS ------------------
  const handleFilterClick = (event) => setAnchorEl(event.currentTarget);
  const handleFilterClose = (newItemType) => {
    setAnchorEl(null);
    if (newItemType) {
      setItemType(newItemType);
    }
  };

  const handleSortClick = (event) => setSortAnchorEl(event.currentTarget);
  const handleSortClose = (newSortCriteria) => {
    setSortAnchorEl(null);
    if (newSortCriteria) {
      setSortCriteria(newSortCriteria);
    }
  };

  // ------------------ TRADE / RENT / PRODUCT HANDLERS ------------------
  const handleTradeOrRent = (row) => {
    const { user: ownerUser, price, rentOption } = row.owners[0];

    setCurrentProductId(row._id);
    setCurrentProductInfo({
      owner: ownerUser,
      productName: row.productName,
      rentOption,
      price
    });

    if (ownerUser !== user) {
      // If there's a "confirmation" property
      if (row.showConfirmationModal) {
        const userConfirmed = window.confirm(row.message);
        if (userConfirmed) {
          openConfirmTradeModal(rentOption ? 'rent' : 'trade');
        } else {
          alertModal(isDarkMode, 'TRADE ACTION CANCELLED, PUSSY-ED OUT');
        }
      } else {
        openConfirmTradeModal(rentOption ? 'rent' : 'trade');
      }
    } else {
      alertModal(isDarkMode, 'THIS IS LITTER-ALLY YOURS ALREADY!');
    }
  };

  // ------------------ PLAYER MODAL ------------------
  const handleOpenPlayerModal = (creatorId) => {
    setShowPlayerModal(true);
    setSelectedCreator(creatorId);
  };
  const handleClosePlayerModal = () => setShowPlayerModal(false);

  // ------------------ RENDER ------------------
  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: isDarkMode ? 'rgba(170, 170, 170, 0.06)' : '#f7f7f7',
        borderRadius: 1,
      }}
    >
      {/* Optional Banner if itemType is '653ee81117c9f5ee2124564b' */}
      {itemType === '653ee81117c9f5ee2124564b' && (
        <Box sx={{ mb: 2 }}>
          <img
            id="marketplace-banner"
            src="/img/accessory-banner.svg"
            alt="Accessory Banner"
            style={{ width: '100%', display: 'block', borderRadius: 4 }}
          />
        </Box>
      )}

      {/* FILTER & SORT */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        {/* Filter */}
        <Button onClick={handleFilterClick} variant="outlined" startIcon={<FontAwesomeIcon icon={faFilter} />}>
          Filter
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
          {/* Add more filters as needed */}
        </Menu>

        {/* Sort */}
        <Button onClick={handleSortClick} variant="outlined" startIcon={<FontAwesomeIcon icon={faSort} />}>
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
            Sort by CP
          </MenuItem>
          <MenuItem
            onClick={() => handleSortClose('price')}
            selected={sortCriteria === 'price'}
          >
            Sort by Price
          </MenuItem>
          {/* Add more sorts as needed */}
        </Menu>
      </Box>

      {/* PLAYER MODAL */}
      {showPlayerModal && (
        <PlayerModal
          selectedCreator={selectedCreator}
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
        />
      )}

      {/* CONTENT */}
      {loading ? (
        // ------------------ LOADING SKELETONS ------------------
        <Grid container spacing={2}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
              <Box
                sx={{
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  p: 2
                }}
              >
                <Skeleton variant="rectangular" width="100%" height={150} sx={{ mb: 1 }} />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="circular" width={40} height={40} sx={{ mt: 2 }} />
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        // ------------------ DATA LISTING ------------------
        <Grid
          container
          spacing={2}
          sx={{
            maxHeight: '50vh',
            overflowY: 'auto'
          }}
          alignItems="stretch"   // 1) Ensure all Grid items stretch to equal height
        >
          {data.map((row) => {
            const owner = row.owners?.[0];
            const creatorInfo = owner ? customerInfo[owner.user] : null;

            return (
              <Grid
                item
                xs={12}  // 1 item/row on xs
                sm={6}   // 2 items/row on sm
                md={4}   // 3 items/row on md
                lg={4}
                key={row._id}
                sx={{ display: 'flex' }} // 2) Let the Card fill this item
              >
                <Card
                  sx={{
                    width: '100%',
                    display: 'flex',       // 3) Vertical layout within the Card
                    flexDirection: 'column',
                    background: isDarkMode
                      ? 'linear-gradient(156deg, #333, #444)'
                      : '#fff'
                  }}
                >
                  {/* IMAGE or LOTTIE */}
                  {row.image && renderLottieAnimation(row.image, isLowGraphics) ? (
                    <Box sx={{ maxHeight: 200, overflow: 'hidden' }}>
                      {renderLottieAnimation(row.image, isLowGraphics)}
                    </Box>
                  ) : (
                    <CardMedia
                      component="img"
                      height="200"
                      image={row.image || '/img/no-image.png'}
                      alt={row.productName}
                    />
                  )}

                  {/* CONTENT (stretch in the middle) */}
                  <CardContent
                    sx={{
                      textAlign: 'center',
                      color: isDarkMode ? '#fff' : 'inherit'
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold', mb: 1, textTransform: 'uppercase' }}
                    >
                      {row.productName}
                    </Typography>

                    <Box sx={{ textAlign: 'left', mb: 1 }}>
                      <Typography variant="body2" sx={{ display: 'flex', gap: 1 }}>
                        <FontAwesomeIcon icon={faTag} />&nbsp;
                        {owner?.rentOption ? 'Price per month' : 'Price per unit'}:
                        <Box sx={{ ml: 'auto' }}>
                          {convertToCurrency(owner?.price, solPrice)}
                        </Box>
                      </Typography>

                      <Typography variant="body2" sx={{ display: 'flex', gap: 1 }}>
                        <FontAwesomeIcon icon={faCubes} />
                        Quantity:
                        <Box sx={{ ml: 'auto' }}>
                          {owner?.onSale} / {row.total_count}
                        </Box>
                      </Typography>

                      <Typography variant="body2" sx={{ display: 'flex', gap: 1 }}>
                        <FontAwesomeIcon icon={faGem} />
                        Type:
                        <Box sx={{ ml: 'auto' }}>
                          {itemTypeMap[row.item_type] || 'Unknown'}
                        </Box>
                      </Typography>
                    </Box>
                  </CardContent>

                  {/* ACTIONS (pinned to the bottom) */}
                  <CardActions>
                    <Tooltip title={owner?.rentOption ? 'Rent' : 'Trade'}>
                      <Button
                        variant="contained"
                        color="secondary"
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTradeOrRent(row);
                        }}
                        startIcon={<SwapHorizIcon />}
                      >
                        {owner?.rentOption ? 'Rent' : 'Trade'}
                      </Button>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* PAGINATION */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={pages}     // total pages from props
          page={page}       // current page from props
          onChange={(event, value) => {
            // Re-fetch items for selected page with 10 items each
            acQueryItem(10, value, sortCriteria, itemType);
          }}
          siblingCount={1}
          boundaryCount={1}
          color="error"
          shape="rounded"
        />
      </Box>
    </Box>
  );
}

const mapStateToProps = (state) => ({
  data: state.itemReducer.itemArray,
  pages: state.itemReducer.pages,
  page: state.itemReducer.page,
  loading: state.itemReducer.loading,
  solPrice: state.logic.solPrice,
  isDarkMode: state.auth.isDarkMode,
  user: state.auth.user?._id,
  isLowGraphics: state.auth.isLowGraphics
});

const mapDispatchToProps = {
  acQueryItem,
  setCurrentProductId,
  setCurrentProductInfo,
  openConfirmTradeModal,
  acGetCustomerInfo
};

export default connect(mapStateToProps, mapDispatchToProps)(ProductTable);