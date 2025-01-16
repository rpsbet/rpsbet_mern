import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { alertModal } from '../../../../game_panel/modal/ConfirmAlerts';
import { Skeleton } from "@material-ui/lab";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faCubes,
  faGem,
  faSort,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import {
  acQueryItem,
  setCurrentProductId,
  setCurrentProductInfo
} from '../../../../redux/Item/item.action';
import { openConfirmTradeModal } from '../../../../redux/Notification/notification.actions';
import history from '../../../../redux/history';
import {
  LinearProgress,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Menu,
  MenuItem
} from '@material-ui/core';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';
import Avatar from '../../../../components/Avatar';
import PlayerModal from '../../../../game_panel/modal/PlayerModal';
import Pagination from 'material-ui-flat-pagination';
import SwapHoriz from '@material-ui/icons/SwapHoriz';
import { convertToCurrency } from '../../../../util/conversion';
import { renderLottieAnimation } from '../../../../util/LottieAnimations';
const MarketplaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
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
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 20px;
  max-width: 100%;
  margin: 20px 0;
`;
const ProductCard = styled.div`
  position: relative;
  background: linear-gradient(156deg, #df00ff, #ff8500);
  border-radius: 20px;
  padding: 10px;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-align-items: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  cursor: pointer;
  -webkit-transition: -webkit-transform 0.2s;
  -webkit-transition: transform 0.2s;
  transition: transform 0.2s;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover::before {
    opacity: 1;
  }

  &:hover {
    transform: scale(1.03);
  }
`;

const TradeButton = styled.div`
opacity: 0;
  position: absolute;
  margin-top: auto;
  bottom: 0;
  
  margin
  right: 0; 
    cursor: pointer;
    -webkit-transition: -webkit-transform 0.2s;
    -webkit-transition: transform 0.2s;
    transition: transform 0.2s,  bottom 0.2s;

    ${ProductCard}:hover & {
      opacity: 1;
        bottom: 50%;
  
`;

const ProductImage = styled.img`
  max-width: 100%;
  min-height: 200px !important;
  height: auto;
  background: #fff;
  border: 1px solid #f9f9;
  box-shadow: 0 1px 17px #333;
  border-radius: 10px;
`;

const ProductCreator = styled.h5`
  max-width: 100%;
  height: auto;
  left: 10px;
  position: absolute;
  z-index: 1;
`;

const ProductInfo = styled.div`
  text-align: center;
`;

const ProductName = styled.h6`
  padding: 4px;
  font-size: 1rem;
  margin-bottom: -5p;
  font-weight: 400;
  line-height: 1.75;
  letter-spacing: 0.00938em;
  background: linear-gradient(354deg, #ffdd0775, #494e54);
  width: 100%;
  border: 1px soli#9c0c0c;
  border-radius: 23%;
  text-shadow: 2px -2px 4px #f3b01b;
  text-transform: uppercase;
  box-shadow: inset 0px 1px 14px #28a74524, -1px 2px #dabf1475;
  color: #fff;
  margin-top: 10px;
  border-bottom-right-radius: 21px;
  border-top-left-radius: 30px;
`;


const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

class ProductTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      customerInfo: {},
      showPlayerModal: false,
      selectedCreator: '',
      anchorEl: null,
      sortAnchorEl: null,
      sortCriteria: 'updated_at',
      itemType: '653ee81117c9f5ee2124564b',
      _isMounted: false
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this.fetchCustomerInfo();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidUpdate(prevProps, prevState) {
    const prevOwners = prevProps.data ? prevProps.data.owners : [];
    const currentOwners = this.props.data ? this.props.data.owners : [];
    if (!this.areOwnersEqual(prevOwners, currentOwners)) {
      this.fetchItems();
    }
  }

  areOwnersEqual(prevOwners, currentOwners) {
    return JSON.stringify(prevOwners) === JSON.stringify(currentOwners);
  }

  handleFilterChange() {
    this.setState({ anchorEl: null });
    this.fetchItems();
  };

  handleSortChange() {
    this.setState({ sortAnchorEl: null });
    this.fetchItems();
  }

  fetchItems() {
    const { acQueryItem, page } = this.props;
    const { sortCriteria, itemType } = this.state;
    acQueryItem(100, page, sortCriteria, itemType);
  }

  handleFilterClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleFilterClose = itemType => {
    this.setState({ anchorEl: null, itemType }, () => {
      this.handleFilterChange();
    });
  };

  handleSortClick = event => {
    this.setState({ sortAnchorEl: event.currentTarget });
  };

  handleSortClose = sortCriteria => {
    this.setState({ sortAnchorEl: null, sortCriteria }, () => {
      this.handleSortChange();
    });
  };

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  async fetchCustomerInfo() {
    const { data, acGetCustomerInfo } = this.props;
    for (const product of data) {
      if (product.owners && product.owners.length > 0) {
        for (const owner of product.owners) {
          if (!this.state.customerInfo[owner.user]) {
            try {
              const info = await acGetCustomerInfo(owner.user);
              if (this._isMounted) { // Only update state if component is still mounted
                if (info) {
                  this.setState(prevState => ({
                    customerInfo: {
                      ...prevState.customerInfo,
                      [owner.user]: info
                    }
                  }));
                } else {
                  this.setState(prevState => ({
                    customerInfo: {
                      ...prevState.customerInfo,
                      [owner.user]: {
                        username: 'Anon',
                        avatar: 'default-avatar-url'
                      }
                    }
                  }));
                }
              }
            } catch (error) {
              if (this._isMounted) {
                console.error(
                  `Error fetching customer info for ${owner.user}:`,
                  error
                );
              }
            }
          }
        }
      }
    }
  }

  render() {
    const {
      data,
      pages,
      page,
      loading,
      acQueryItem,
      setCurrentProductId,
      setCurrentProductInfo,
      openConfirmTradeModal,
      isLowGraphics,
      solPrice
    } = this.props;

    const {
      customerInfo,
      showPlayerModal,
      selectedCreator,
      sortCriteria,
      sortOrder,
      anchorEl,
      sortAnchorEl,
      itemType
    } = this.state;
    const itemTypeMap = {
      '653ee7ac17c9f5ee21245649': 'RRPS Card',
      '653ee7df17c9f5ee2124564a': 'Game Background',
      '653ee81117c9f5ee2124564b': 'Accessories',
      '654231df29446bc96d689d0f': 'Tools',
      '6542321929446bc96d689d10': 'Games'
    };
    this.fetchCustomerInfo();
    return (
      <MarketplaceContainer style={{ padding: "0 20px 20px 20px", background: "rgb(170 170 170 / 6%)", borderBottomRightRadius: "20px", borderBottomLeftRadius: "20px" }}>
        {itemType === '653ee81117c9f5ee2124564b' && (
          <img id="marketplace-banner" src={'/img/accessory-banner.svg'} />
        )}
        <FilterSortContainer className='desktop-only'>

          <div className="filters">
            <Button onClick={this.handleFilterClick}>
              Filter&nbsp;
              <FontAwesomeIcon icon={faFilter} />
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => this.handleFilterClose(null)}
            >
        
              <MenuItem
                onClick={() =>
                  this.handleFilterClose('653ee81117c9f5ee2124564b')
                }
                selected={itemType === '653ee81117c9f5ee2124564b'}
              >
                Accessories
              </MenuItem>
            
            </Menu>
          </div>
          <div className="filters">
            <Button onClick={this.handleSortClick}>
              Sort By&nbsp;
              <FontAwesomeIcon icon={faSort} />
            </Button>
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={() => this.handleSortClose(null)}
            >
              <MenuItem onClick={() =>
                this.handleSortClose('updated_at')
              }
                selected={sortCriteria === 'updated_at'}>Sort by CP</MenuItem>
              <MenuItem onClick={() =>
                this.handleSortClose('price')
              }
                selected={sortCriteria === 'price'}>
                Sort by Price</MenuItem>
            </Menu>
          </div>
        </FilterSortContainer>
        {!loading ? (
          <ProductGrid>
            {showPlayerModal && (
              <PlayerModal
                selectedCreator={selectedCreator}
                modalIsOpen={showPlayerModal}
                closeModal={this.handleClosePlayerModal}
              />
            )}
            {data.map(row => (
              <ProductCard
                key={`${row._id}-${row.owners[0].user}`}
                onClick={() => {
                  setCurrentProductId(row._id);
                  setCurrentProductInfo({
                    owner: row.owners[0].user,
                    productName: row.productName,
                    rentOption: row.owners[0].rentOption,
                    price: row.owners[0].price
                  });
                  history.push(`/product/${row._id}`);
                }}
              >

                {row.owners.map(owner => (
                  <ProductCreator key={owner.user}>
                    {customerInfo[owner.user] ? (
                      <a
                        className="player"
                        onClick={() => this.handleOpenPlayerModal(owner.user)}
                      >
                        <Avatar
                          className="avatar"
                          src={customerInfo[owner.user].avatar}
                          rank={customerInfo[owner.user].totalWagered}
                          accessory={customerInfo[owner.user].accessory}
                          alt=""
                          username={customerInfo[owner.user].username}
                          darkMode={this.props.isDarkMode}
                        />
                      </a>
                    ) : (
                      <div className="loading-spinner"></div>
                    )}
                  </ProductCreator>
                ))}
                {row.image &&
                  renderLottieAnimation(row.image, isLowGraphics) ? (
                  renderLottieAnimation(row.image, isLowGraphics)
                ) : (
                  <ProductImage src={row.image} alt={row.productName} />
                )}
                <ProductInfo>
                  <ProductName>{row.productName}</ProductName>
                  <TableContainer>
                    <Table id="all-trades" className="product-detail">
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <FontAwesomeIcon icon={faTag} />
                            {row.owners[0].rentOption ? ' Price per month' : ' Price per unit'}:
                          </TableCell>
                          <TableCell className="value">
                            {convertToCurrency(row.owners[0].price, solPrice)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <FontAwesomeIcon icon={faCubes} /> Quantity:
                          </TableCell>
                          <TableCell className="value">
                            {row.owners[0].onSale} / {row.total_count}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <FontAwesomeIcon icon={faGem} /> Type:
                          </TableCell>
                          <TableCell>
                            {itemTypeMap[row.item_type] || 'Unknown'}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </ProductInfo>
                <TradeButton>
                  <Tooltip title={row.owners[0].rentOption ? 'Rent' : 'Trade'}>
                    <Button
                      className="btn-back"
                      onClick={() => {
                        setCurrentProductId(row._id);
                        setCurrentProductInfo({
                          owner: row.owners[0].user,
                          productName: row.productName,
                          rentOption: row.owners[0].rentOption,
                          price: row.owners[0].price
                        });

                        if (row.owners[0].user !== this.props.user) {
                          if (row.showConfirmationModal) {
                            const userConfirmed = window.confirm(row.message);

                            if (userConfirmed) {
                              openConfirmTradeModal(row.owners[0].rentOption ? 'rent' : 'trade');
                            } else {
                              alertModal(
                                this.props.isDarkMode,
                                'TRADE ACTION CANCELLED,PUSSY-ED OUT'
                              );
                            }
                          } else {
                            openConfirmTradeModal(row.owners[0].rentOption ? 'rent' : 'trade');
                          }
                        } else {
                          alertModal(
                            this.props.isDarkMode,
                            'THIS IS LITTER-ALLY YOURS ALREADY!'
                          );
                        }
                      }}
                    >
                      {row.owners[0].rentOption ? 'Rent' : 'Trade'} <SwapHoriz />
                    </Button>
                  </Tooltip>
                </TradeButton>
              </ProductCard>
            ))}
          </ProductGrid>
        ) : (
          <ProductGrid>
            {[...Array(6)].map((_, index) => (
              <ProductCard key={`skeleton-product-${index}`}>
                <Skeleton variant="rect" width="100%" height={150} style={{ marginBottom: "10px" }} />
                <Skeleton variant="text" width="60%" height={20} style={{ marginBottom: "10px" }} />
                <Skeleton variant="text" width="80%" height={20} style={{ marginBottom: "10px" }} />
                <Skeleton variant="text" width="40%" height={20} style={{ marginBottom: "10px" }} />
                <Skeleton variant="circle" width={40} height={40} style={{ marginBottom: "10px" }} />
              </ProductCard>
            ))}
          </ProductGrid>
        )}
        <PaginationContainer className='desktop-only'>
          <Pagination
            limit={1}
            offset={page - 1}
            total={pages}
            onClick={(e, offset) => {
              acQueryItem(100, offset + 1, sortCriteria, itemType);
            }}
          />
        </PaginationContainer>
      </MarketplaceContainer>
    );
  }
}

const mapStateToProps = state => ({
  data: state.itemReducer.itemArray,
  pages: state.itemReducer.pages,
  page: state.itemReducer.page,
  loading: state.itemReducer.loading,
  total: state.itemReducer.totalResults,
  showConfirmTradeModal: state.snackbar.showConfirmTradeModal,
  isDarkMode: state.auth.isDarkMode,
  user: state.auth.user._id,
  solPrice: state.logic.solPrice,
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
