import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { alertModal } from '../../../../game_panel/modal/ConfirmAlerts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faSort,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import {
  acQueryLoan,
  setCurrentLoanId,
  setCurrentLoanInfo
} from '../../../../redux/Loan/loan.action';
import { openConfirmLoanModal } from '../../../../redux/Notification/notification.actions';
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
import Pagination from 'material-ui-flat-pagination';
import SwapHoriz from '@material-ui/icons/SwapHoriz';
import { convertToCurrency } from '../../../../util/conversion';
import { updateDigitToPoint2 } from '../../../../util/helper';
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
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 20px;
  max-width: 100%;
  margin: 20px 0;
`;
const ProductCard = styled.div`
  position: relative;
  background: linear-gradient(156deg, #303438, #007bff);
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

const LoanButton = styled.div`
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
        bottom: 25%%;
        left: 25%;
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

const LoanAmount = styled.h6`
  padding: 4px;
  font-size: 1rem;
  margin-bottom: -5p;
  font-weight: 400;
  line-height: 1.75;
  letter-spacing: 0.00938em;
  background: linear-gradient(354deg, #007bff75, #494e54);
  width: 100%;
  border: 1px soli#9c0c0c;
  border-radius: 23%;
  text-shadow: 2px -2px 4px #007bff;
  text-transform: uppercase;
  box-shadow: inset 0px 1px 14px #3428a724, -1px 2px #007bff75;
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

const APY = styled.span`
  position: absolute;
  top: 20px;
  padding: 0 10px;
  right: 10px;
  height: 30px;
  background: #28a745;
  border-radius: 10px;
  box-shadow: inset 0px -1px 11px #005b15;
  color: #fff;
  font-weight: 500;
  text-align: center;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-loans: center;
  margin-top: 20px;
`;

class BankTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      customerInfo: {},
      showPlayerModal: false,
      selectedCreator: '',
      anchorEl: null,
      sortAnchorEl: null,
      sortCriteria: 'updated_at',
      loanType: ''
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const prevOwners = prevProps.data ? prevProps.data.owners : [];
    const currentOwners = this.props.data ? this.props.data.owners : [];

    // Check if there's any change in the owners sub-array
    if (!this.areOwnersEqual(prevOwners, currentOwners)) {
      // Fetch loans when there's a change in the owners sub-array
      this.fetchLoans();
    }
  }

  areOwnersEqual(prevOwners, currentOwners) {
    // Compare the owners array by stringifying them and checking for equality
    return JSON.stringify(prevOwners) === JSON.stringify(currentOwners);
  }

  handleFilterChange() {
    this.setState({ anchorEl: null });
    this.fetchLoans();
  };

  handleSortChange() {
    this.setState({ sortAnchorEl: null });
    this.fetchLoans();
  }

  fetchLoans() {
    const { acQueryLoan, page } = this.props;
    const { sortCriteria, loanType } = this.state;
    acQueryLoan(30, page, sortCriteria);
  }

  handleFilterClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleFilterClose = loanType => {
    this.setState({ anchorEl: null, loanType }, () => {
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
      acQueryLoan,
      setCurrentLoanId,
      setCurrentLoanInfo,
      openConfirmLoanModal,
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
      loanType
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
                  this.handleFilterClose('')
                }
                selected={loanType === ''}
              >
                Standard
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
                selected={sortCriteria === 'updated_at'}>Sort by Date Added</MenuItem>
              <MenuItem onClick={() =>
                this.handleSortClose('period')
              }
                selected={sortCriteria === 'period'}>
                Sort by Loan Period</MenuItem>
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
                  setCurrentLoanInfo({
                    owner: row.owners[0].user,
                    loan_amount: row.loan_amount,
                    apy: row.apy
                  });
                  history.push(`/loan/${row._id}`);
                }}
              >
                <APY>{updateDigitToPoint2(row.apy) * 100}%</APY>

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
                          darkMode={this.props.isDarkMode}
                        />
                      </a>
                    ) : (
                      <div className="loading-spinner"></div>
                    )}
                  </ProductCreator>
                ))}

                <ProductInfo>
                  <LoanAmount>{convertToCurrency(row.loan_amount)}</LoanAmount>
                  <TableContainer>
                    <Table id="all-loans" className="product-detail">
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <FontAwesomeIcon icon={faClock} /> Loan Period:
                          </TableCell>
                          <TableCell className="value">
                            {row.loan_period}
                          </TableCell>
                        </TableRow>

                      </TableBody>
                    </Table>
                  </TableContainer>
                </ProductInfo>
                <LoanButton>
                  <Tooltip title="Loan">
                    <IconButton
                      className="btn-back"
                      onClick={() => {
                        setCurrentLoanId(row._id);
                        setCurrentLoanInfo(row.owners[0].user);
                        if (row.owners[0].user !== this.props.user) {
                          openConfirmLoanModal();
                        } else {
                          alertModal(
                            this.props.isDarkMode,
                            'This is already yours dumbass!'
                          );
                        }
                      }}
                    >
                      Loan <SwapHoriz />
                    </IconButton>
                  </Tooltip>
                </LoanButton>
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
              acQueryLoan(30, offset + 1, sortCriteria, loanType);
            }}
          />
        </PaginationContainer>
      </MarketplaceContainer>
    );
  }
}

const mapStateToProps = state => ({
  data: state.loanReducer.loanArray,
  pages: state.loanReducer.pages,
  page: state.loanReducer.page,
  loading: state.loanReducer.loading,
  total: state.loanReducer.totalResults,
  showConfirmLoanModal: state.snackbar.showConfirmLoanModal,
  isDarkMode: state.auth.isDarkMode,
  user: state.auth.user._id,
  isLowGraphics: state.auth.isLowGraphics
});

const mapDispatchToProps = {
  acQueryLoan,
  setCurrentLoanId,
  setCurrentLoanInfo,
  openConfirmLoanModal,
  acGetCustomerInfo
};

export default connect(mapStateToProps, mapDispatchToProps)(BankTable);
