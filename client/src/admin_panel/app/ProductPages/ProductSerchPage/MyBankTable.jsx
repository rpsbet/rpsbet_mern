import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import moment from 'moment';
import { convertToCurrency } from '../../../../util/conversion';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faClock,
  faUsers,
  faTags,
  faPiggyBank,
  faCalendar
} from '@fortawesome/free-solid-svg-icons';
import { alertModal } from '../../../../game_panel/modal/ConfirmAlerts';
import {
  acQueryMyLoan,
  setCurrentLoanId,
  setCurrentLoanInfo
} from '../../../../redux/Loan/loan.action';
import {
  getRoomList
} from '../../../../redux/Logic/logic.actions';
import {
  openDeListLoanModal
} from '../../../../redux/Notification/notification.actions';
import history from '../../../../redux/history';
import {
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
  Select,
  Skeleton,
  Box
} from '@mui/material';
import { acGetCustomerInfo } from '../../../../redux/Customer/customer.action';
import Avatar from '../../../../components/Avatar';
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
  grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
  gap: 20px;
  max-width: 100%;
  margin: 20px 0;
`;
const ProductCard = styled.div`
  position: relative;
  background: linear-gradient(156deg,  #28a745, #007bff);
  border-radius: 1em;
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
    border-radius: 1em;
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


const DeListLoanButton = styled.div`
opacity: 0;
  position: absolute;
  margin-top: auto;
  bottom: 0;
  margin-right: 0; 
    cursor: pointer;
    -webkit-transition: -webkit-transform 0.2s;
    -webkit-transition: transform 0.2s;
    transition: transform 0.2s,  bottom 0.2s;

    ${ProductCard}:hover & {
      opacity: 1;
      left: 7.5%; 
        bottom: calc(50% - 30px);
  
`;

const ProductInfo = styled.div`
  text-align: center;
`;

const CommissionPower = styled.span`
position: absolute;
top: 20px;
right: 15px;
width: 60px;
height: 40px;
padding: 0 5px;
line-height: 40px;
background: #28a745;
border-radius: 1em;
box-shadow: inset 0px -1px 11px #005b15;
color: #fff;
font-weight: 500;
font-size: x-small;
text-align: center;
`;


const LoanAmount = styled.h6`
  padding: 4px;
  font-size: 1rem;
  margin-bottom: -5p;
  font-weight: 400;
  line-height: 1.75;
  letter-spacing: 0.00938em;
  background: linear-gradient(354deg,#007bff75,#00ddff);
  width: 100%;
  border: 1px soli#9c0c0c;
  border-radius: 23%;
  text-shadow: 2px -2px 4px #00da32;
  text-transform: uppercase;
  box-shadow: inset 0px 1px 14px #28a74524, -1px 2px #005b15;
  color: #fff;
  margin-top: 10px;
  border-bottom-right-radius: 21px;
  border-top-left-radius: 30px;
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
      loanType: ''
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
      openDeListLoanModal,
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
      loanType,
    } = this.state;

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
                  this.handleFilterClose('FULL')
                }
                selected={loanType === 'FULL'}
              >
                ALL
              </MenuItem>

            </Menu>
          </div>
          <div className="filters">

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
                <MenuItem value="apy">Sort by Interest Rate</MenuItem>

              </Select>
            </Menu>
          </div>
        </FilterSortContainer>
        {data && data.length === 0 ? (
          <ProductGrid>
            {[...Array(5)].map((_, index) => (
              <Box
                key={index}
                sx={{
                  padding: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  boxShadow: 1,
                  marginBottom: 2,
                }}
              >
                <Skeleton variant="text" sx={{ width: '80%', height: 30 }} />
                <Skeleton variant="rectangular" sx={{ width: '100%', height: 200, marginY: 1 }} />
                <Skeleton variant="text" sx={{ width: '50%', height: 20 }} />
                <Skeleton variant="text" sx={{ width: '70%', height: 20, marginY: 1 }} />
                <Skeleton variant="text" sx={{ width: '60%', height: 20 }} />
                <Skeleton variant="text" sx={{ width: '50%', height: 20, marginTop: 1 }} />
              </Box>
            ))}
          </ProductGrid>
        ) : (
          <ProductGrid>

            {showPlayerModal && (
              <PlayerModal
                selectedCreator={selectedCreator}
                modalIsOpen={showPlayerModal}
                closeModal={this.handleClosePlayerModal}
              />
            )}

            {data.map(row => {
              // Calculate reserves based on loan type
              const reserves = row.loan_type === 'FRACTIONAL'
                ? (row.loan_amount * (row.fractional_amount / 100))
                : row.loan_amount;

              return (
                <ProductCard
                  key={row._id}
                  onClick={() => {
                    setCurrentLoanId(row._id);
                    history.push(`/loan/${row._id}`);
                  }}
                >
                  <CommissionPower>{(row.apy * 100).toFixed(2)}%</CommissionPower>

                  <ProductInfo>
                    <LoanAmount>{convertToCurrency(row.loan_amount, solPrice)}</LoanAmount>
                    <TableContainer>
                      <Table id="my-products" className="product-detail">
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <FontAwesomeIcon icon={faCalendar} />&nbsp;Loan Period:
                            </TableCell>
                            <TableCell className="value">{row.loan_period} days</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <FontAwesomeIcon icon={faUsers} />&nbsp;Loaners:
                            </TableCell>
                            <TableCell className="value cell-joiners">
                              {row.loaners && row.loaners.length > 0 ? (
                                <>
                                  {row.loaners.slice(0, 2).map((loaner, index) => (
                                    loaner && loaner.avatar ? (
                                      <a
                                        key={loaner._id || index}
                                        className="player"
                                        onClick={() => this.handleOpenPlayerModal(loaner._id)}
                                      >
                                        <Avatar
                                          className="avatar"
                                          src={loaner.avatar}
                                          rank={loaner.totalWagered || 0}
                                          accessory={loaner.accessory || ''}
                                          alt={loaner.username || 'Unknown User'}
                                          darkMode={this.props.isDarkMode}
                                        />
                                      </a>
                                    ) : null
                                  ))}
                                  {row.loaners.length > 2 && (
                                    <div className="avatar-square" style={{ marginLeft: "20px", zIndex: "0" }}>
                                      <div className="avatar-count">
                                        +{row.loaners.length - 2}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span>No Loaners</span>
                              )}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <FontAwesomeIcon icon={faTags} />&nbsp;Loan Type:
                            </TableCell>
                            <TableCell className="value">{row.loan_type}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <FontAwesomeIcon icon={faPiggyBank} />&nbsp;Reserves:
                            </TableCell>
                            <TableCell className="value">
                              {convertToCurrency(reserves, solPrice)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <FontAwesomeIcon icon={faClock} />&nbsp;Created:
                            </TableCell>
                            <TableCell className="value">{moment(row.created_at).fromNow()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </ProductInfo>

                  <DeListLoanButton>
                    {row.onSale === 0 ? null : (
                      <Tooltip title="Withdraw Funds">
                        <Button
                          style={{ left: '40%' }}
                          variant='contained' color='error'
                          onClick={() => {
                            setCurrentLoanId(row._id);
                            openDeListLoanModal();
                          }}
                        >
                          WITHDRAW <SwapHoriz />
                        </Button>
                      </Tooltip>
                    )}
                  </DeListLoanButton>
                </ProductCard>
              );
            })}

          </ProductGrid>
        )}

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
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  isLowGraphics: state.auth.isLowGraphics,
  solPrice: state.logic.solPrice
});

const mapDispatchToProps = {
  acQueryMyLoan,
  setCurrentLoanId,
  setCurrentLoanInfo,
  openDeListLoanModal,
  acGetCustomerInfo,
  getRoomList,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyBankTable);
