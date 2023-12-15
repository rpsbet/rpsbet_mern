import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import Pagination from '../../../../components/Pagination';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag,
  faCubes,
  faGem,
  faDollarSign,
  faSort,
  faFilter
} from '@fortawesome/free-solid-svg-icons'; // Import the desired icons
import {
  acQueryMyLoan,
  setCurrentLoanId,
  setCurrentLoanInfo
} from '../../../../redux/Loan/loan.action';
import {
  getRoomList
} from '../../../../redux/Logic/logic.actions';
import {
  openListLoanModal,
  openDeListLoanModal
} from '../../../../redux/Notification/notification.actions';
import history from '../../../../redux/history';
import {
  LinearProgress,
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
  Select
} from '@material-ui/core';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';
// import Pagination from 'material-ui-flat-pagination';
import SwapHoriz from '@material-ui/icons/SwapHoriz';
import { convertToCurrency } from '../../../../util/conversion';
import { alertModal } from '../../../../game_panel/modal/ConfirmAlerts';
import PlayerModal from '../../../../game_panel/modal/PlayerModal';
const MarketplaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-loans: center;
`;

const FilterSortContainer = styled.div`
  display: flex;
  align-loans: center;
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
  background: linear-gradient(156deg, #303438, #cf0c0e);
  border-radius: 20px;
  padding: 10px;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-align-loans: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-loans: center;
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

const EquipLoanButton = styled.div`
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
        bottom: calc(50% + 90px);;
`;

const ListLoanButton = styled.div`
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
        bottom: calc(50% + 30px);;
`;

const DeListLoanButton = styled.div`
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
        bottom: calc(50% - 30px);
  
`;

const ProductImage = styled.img`
  max-width: 100%;
  height: auto;
  background: #fff;
  border: 1px solid #f9f9;
  box-shadow: 0 1px 17px #333;
  border-radius: 10px;
`;


const CommissionPower = styled.span`
position: absolute;
top: 20px;
right: 20px;
width: 30px;
height: 30px;
background: #28a745;
border-radius: 10px;
box-shadow: inset 0px -1px 11px #005b15;
color: #fff;
font-weight: 500;
text-align: center;
`;

const ProductInfo = styled.div`
  text-align: center;
`;

const LoanAmount = styled.h6`
  padding: 4px;
  font-size: 1rem;
  margin-bottom: -5p;
  font-weight: 400;
  line-height: 1.75;
  letter-spacing: 0.00938em;
  background: linear-gradient(354deg, #ea292975, #494e54);
  width: 100%;
  border: 1px soli#9c0c0c;
  border-radius: 23%;
  text-shadow: 2px -2px 4px #98090b;
  text-transform: uppercase;
  box-shadow: inset 0px 1px 14px #28a74524, -1px 2px #9d0d0e;
  color: #fff;
  margin-top: 10px;
  border-bottom-right-radius: 21px;
  border-top-left-radius: 30px;
`;

const LinearContainer = styled.div`
  width: 80%;
  max-width: 1200px;
  margin: 20px 0;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-loans: center;
  margin-top: 20px;
`;

class MyBankTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      customerInfo: {},
      showPlayerModal: false,
      selectedCreator: '',
      anchorEl: null,
      sortAnchorEl: null,
      sortCriteria: 'updated_at',
      _id: this.props.userInfo._id,
      loanType: '653ee7ac17c9f5ee21245649'
    };
  }

  async componentDidMount() {
    await this.fetchLoans();
  }



  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.loanType !== prevState.loanType ||
      this.props.tnxComplete !== prevProps.tnxComplete
    ) {
      // The loanType or showConfirmTradeModal prop has changed to false, re-fetch data
      this.fetchLoans();
    }
  }

  handleFilterChange = event => {
    this.setState({ loanType: event.target.value, anchorEl: null });
    this.fetchLoans();
  };

  // handleSortChange = event => {
  //   this.setState({ sortCriteria: event.target.value });
  //   this.fetchLoans();
  // }

  fetchLoans() {
    const { acQueryMyLoan, page } = this.props;
    const { sortCriteria, loanType } = this.state;
    acQueryMyLoan(30, page, sortCriteria, loanType);
  }

  handleFilterClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleFilterClose = filter => {
    this.setState({ anchorEl: null, loanType: filter });
  };

  handleSortClick = event => {
    this.setState({ sortAnchorEl: event.currentTarget });
  };

  handleSortClose = sortCriteria => {
    this.setState({ sortAnchorEl: null, sortCriteria });
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
            } catch (error) {
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

  render() {
    const {
      data,
      pages,
      page,
      loading,
      acQueryMyLoan,
      setCurrentLoanId,
      setCurrentLoanInfo,
      openListLoanModal,
      openDeListLoanModal,
      isLowGraphics
    } = this.props;

    const {
      customerInfo,
      showPlayerModal,
      selectedCreator,
      sortCriteria,
      sortOrder,
      anchorEl,
      sortAnchorEl,
      loanType,
    } = this.state;
    const loanTypeMap = {
      '653ee7ac17c9f5ee21245649': 'RRPS Card',
      '653ee7df17c9f5ee2124564a': 'Game Background',
      '654231df29446bc96d689d0f': 'Tools',
      '6542321929446bc96d689d10': 'Games'
    };
    this.fetchCustomerInfo();
    return (
      <MarketplaceContainer>
        <FilterSortContainer>
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
                  this.handleFilterClose('653ee7ac17c9f5ee21245649')
                }
                selected={loanType === '653ee7ac17c9f5ee21245649'}
              >
                RRPS Card
              </MenuItem>
              <MenuItem
                onClick={() =>
                  this.handleFilterClose('653ee7df17c9f5ee2124564a')
                }
                selected={loanType === '653ee7df17c9f5ee2124564a'}
              >
                Game Background
              </MenuItem>
              <MenuItem
                onClick={() =>
                  this.handleFilterClose('654231df29446bc96d689d0f')
                }
                selected={loanType === '654231df29446bc96d689d0f'}
              >
                Tools
              </MenuItem>
              <MenuItem
                onClick={() =>
                  this.handleFilterClose('6542321929446bc96d689d10')
                }
                selected={loanType === '6542321929446bc96d689d10'}
              >
                Games
              </MenuItem>
            </Menu>
          </div>
          <div className="filters">
            {/* <Button onClick={this.handleSortClick} variant="contained">
              Sort By&nbsp;
              <FontAwesomeIcon icon={faSort} />
            </Button> */}
            <Menu
              sortAnchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={() => this.handleSortClose(null)}
            >
              <Select
                value={this.state.sortType}
                onChange={this.handleSortChange}
              >
                <MenuItem value="updated_at">Sort by Date</MenuItem>
                <MenuItem value="period">Sort by Loan Period</MenuItem>
                <MenuItem value="apy">Sort by APY</MenuItem>

              </Select>
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
                key={row._id}
                onClick={() => {
                  setCurrentLoanId(row._id);
                  history.push(`/loan/${row._id}`);
                }}
              >
               

                <ProductInfo>
                  <LoanAmount>{row.loan_amount}</LoanAmount>
                  <TableContainer>
                    <Table id="my-products" className="product-detail">
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <FontAwesomeIcon icon={faTag} /> Loan Period
                          </TableCell>
                          <TableCell className="value">
                            {convertToCurrency(row.loan_period)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <FontAwesomeIcon icon={faDollarSign} /> On Sale:
                          </TableCell>
                          <TableCell className="value">{row.onSale}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <FontAwesomeIcon icon={faCubes} /> Total:
                          </TableCell>
                          <TableCell className="value">
                            {row.total_count}
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>
                            <FontAwesomeIcon icon={faGem} /> Type:
                          </TableCell>
                          <TableCell>
                            {loanTypeMap[row.loan_type] || 'Unknown'}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </ProductInfo>


                <ListLoanButton>
                  {row.onSale === row.total_count ? null : (
                    <Tooltip title="List Loan">
                      <IconButton
                        className="btn-back"
                        onClick={() => {
                          setCurrentLoanId(row._id);
                          openListLoanModal();
                        }}
                      >
                        List <SwapHoriz />
                      </IconButton>
                    </Tooltip>
                  )}
                </ListLoanButton>

                <DeListLoanButton>
                  {row.onSale === 0 ? null : (
                    <Tooltip title="De-List Loan">
                      <IconButton
                        className="btn-back"
                        onClick={() => {
                          setCurrentLoanId(row._id);
                          openDeListLoanModal();
                        }}
                      >
                        De-List <SwapHoriz />
                      </IconButton>
                    </Tooltip>
                  )}
                </DeListLoanButton>
              </ProductCard>
            ))}
          </ProductGrid>
        ) : (
          <LinearContainer>
            <LinearProgress color="secondary" />
          </LinearContainer>
        )}
        <PaginationContainer>
          <Pagination
            limit={1}
            offset={page - 1}
            total={pages}
            onClick={(e, offset) => {
              acQueryMyLoan(30, offset + 1, this.state.sortCriteria, this.state.loanType);
            }}
          />
        </PaginationContainer>
      </MarketplaceContainer>
    );
  }
}

const mapStateToProps = state => ({
  data: state.loanReducer.myLoanArray,
  pages: state.loanReducer.pages,
  page: state.loanReducer.page,
  loading: state.loanReducer.loading,
  total: state.loanReducer.totalResults,
  tnxComplete: state.logic.transactionComplete,
  showListLoanModal: state.snackbar.showListLoanModal,
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  isLowGraphics: state.auth.isLowGraphics
});

const mapDispatchToProps = {
  acQueryMyLoan,
  setCurrentLoanId,
  setCurrentLoanInfo,
  openListLoanModal,
  openDeListLoanModal,
  acGetCustomerInfo,
  getRoomList,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyBankTable);
