import React, { Component } from 'react';
import { connect } from 'react-redux';
import Lottie from 'react-lottie';
import rankIcon from '../LottieAnimations/rankIcon.json';
import { Table, TableBody, Button, TextField, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@material-ui/core';
import { convertToCurrency } from '../../util/conversion';
import Modal from 'react-modal';
import MyBankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyBankPage';
import ProductCreatePage from '../../admin_panel/app/ProductPages/ProductCreatePage/ProductCreatePage';
import AttachMoney from '@material-ui/icons/AttachMoney';
import { createLoan, acQueryMyLoan, acQueryLoan, acCalculateRemainingLoans } from '../../redux/Loan/loan.action';
import { getUser } from '../../redux/Auth/user.actions';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { getRank } from '../../util/getRank';


Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },

  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0,
    border: 'none'
  },
};

const categories = [
  { creditScoreThreshold: 700, rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 0.005 },
  { creditScoreThreshold: 700, rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 0.01 },
  { creditScoreThreshold: 700, rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 0.02 },
  { creditScoreThreshold: 700, rankThreshold: 6, accountAgeThresholdInDays: 30, maxAllowance: 0.03 },
  { creditScoreThreshold: 700, rankThreshold: 9, accountAgeThresholdInDays: 30, maxAllowance: 0.04 },
  { creditScoreThreshold: 700, rankThreshold: 10, accountAgeThresholdInDays: 30, maxAllowance: 0.05 },
  { creditScoreThreshold: 700, rankThreshold: 11, accountAgeThresholdInDays: 30, maxAllowance: 0.075 },
  { creditScoreThreshold: 700, rankThreshold: 12, accountAgeThresholdInDays: 30, maxAllowance: 0.1 },
  { creditScoreThreshold: 700, rankThreshold: 13, accountAgeThresholdInDays: 30, maxAllowance: 0.2 },
  { creditScoreThreshold: 700, rankThreshold: 14, accountAgeThresholdInDays: 30, maxAllowance: 0.4 },
  { creditScoreThreshold: 700, rankThreshold: 15, accountAgeThresholdInDays: 30, maxAllowance: 0.8 },
  { creditScoreThreshold: 700, rankThreshold: 16, accountAgeThresholdInDays: 30, maxAllowance: 1.5 },
  { creditScoreThreshold: 700, rankThreshold: 17, accountAgeThresholdInDays: 30, maxAllowance: 1.75 },
  { creditScoreThreshold: 700, rankThreshold: 18, accountAgeThresholdInDays: 30, maxAllowance: 2 },
  { creditScoreThreshold: 700, rankThreshold: 19, accountAgeThresholdInDays: 30, maxAllowance: 2.25 },
  { creditScoreThreshold: 700, rankThreshold: 20, accountAgeThresholdInDays: 30, maxAllowance: 2.5 },
  { creditScoreThreshold: 700, rankThreshold: 21, accountAgeThresholdInDays: 30, maxAllowance: 3 },
  { creditScoreThreshold: 700, rankThreshold: 22, accountAgeThresholdInDays: 30, maxAllowance: 3.3 },
  { creditScoreThreshold: 700, rankThreshold: 23, accountAgeThresholdInDays: 30, maxAllowance: 3.6 },
  { creditScoreThreshold: 700, rankThreshold: 24, accountAgeThresholdInDays: 30, maxAllowance: 3.9 },
  { creditScoreThreshold: 700, rankThreshold: 25, accountAgeThresholdInDays: 30, maxAllowance: 4.2 },
  { creditScoreThreshold: 700, rankThreshold: 26, accountAgeThresholdInDays: 30, maxAllowance: 4.4 },
  { creditScoreThreshold: 700, rankThreshold: 27, accountAgeThresholdInDays: 30, maxAllowance: 4.6 },
  { creditScoreThreshold: 700, rankThreshold: 28, accountAgeThresholdInDays: 30, maxAllowance: 4.8 },
  { creditScoreThreshold: 700, rankThreshold: 29, accountAgeThresholdInDays: 30, maxAllowance: 5 },
  { creditScoreThreshold: 700, rankThreshold: 30, accountAgeThresholdInDays: 30, maxAllowance: 6 },
  { creditScoreThreshold: 700, rankThreshold: 31, accountAgeThresholdInDays: 30, maxAllowance: 7 },
  { creditScoreThreshold: 700, rankThreshold: 32, accountAgeThresholdInDays: 30, maxAllowance: 8 },
  { creditScoreThreshold: 700, rankThreshold: 33, accountAgeThresholdInDays: 30, maxAllowance: 10 },
];

class MyLoansModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      _id: this.props._id,
      loan_amount: '',
      loan_period: '',
      apy: '',
      productCreateModalIsOpen: false,
    };
  }

  openProductCreateModal = () => {
    this.setState({ productCreateModalIsOpen: true });
  };

  closeProductCreateModal = () => {
    this.setState({ productCreateModalIsOpen: false });
  };

  updateTextField = (data) => {

    if ((data.loan_amount !== '' ||
      data.apy !== '' ||
      data.loan_period !== '')) {
      this.setState({ loan_amount: data.loan_amount, apy: data.apy, loan_period: data.loan_period })
    } else {
      this.props.warningMsgBar(`Value length is greater than ${length}`);
    }
  };

  getAccountAgeInDays = (createdAt) => {
    const accountCreatedAt = new Date(createdAt);
    const currentDate = new Date();
    const accountAgeInMilliseconds = currentDate - accountCreatedAt;
    return Math.floor(accountAgeInMilliseconds / (24 * 60 * 60 * 1000));
  };

  getHighlightedRowIndex = (categories, rank, accountAgeInDays) => {
    const currentRank = getRank(rank);
    let bestCategoryIndex = -1;

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (currentRank >= category.rankThreshold && accountAgeInDays >= category.accountAgeThresholdInDays) {

        bestCategoryIndex = i;
      }
    }
    return bestCategoryIndex;
  };

  onSubmitFrom = async () => {
    const { loan_amount, loan_period, apy } = this.state;
    if ((loan_amount !== '' ||
      apy !== '' ||
      loan_period !== '')) {
      this.props.infoMsgBar(`New Loan Listed!`);
      await this.props.createLoan(this.state);
      await this.props.acQueryMyLoan(30, 1, 'loan_amount', '');
      await this.props.acQueryLoan(30, 1, 'loan_amount', '');
      await this.props.acCalculateRemainingLoans();
      await this.props.getUser(true, 5);
      this.closeProductCreateModal();
    }
  };

  render() {
    const { totalWagered, remainingLoans, isDarkMode, created_at, solPrice } = this.props;

    let rank = (totalWagered);
    const accountAgeInDays = this.getAccountAgeInDays(created_at);

    const highlightedRowIndex = this.getHighlightedRowIndex(
      categories,
      rank,
      accountAgeInDays,
    );

    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Your Loans Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">
              <FontAwesomeIcon icon={faCoins} className="mr-2" />
              Your Loans
            </h2>
            <Button className="btn-close title" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body my-loans-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <MyBankPage />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            {remainingLoans > 0 ? (
              <div style={{ color: "#ff0000" }}>
                CLEAR DEBT FIRST TO CREATE A LOAN
              </div>
            ) : (
              <Button
                className="btn-back"
                onClick={this.openProductCreateModal}
              >
                CREATE A LOAN &nbsp; <AttachMoney />
              </Button>
            )}
          </div>
        </div>

        <Modal
          isOpen={this.state.productCreateModalIsOpen}
          onRequestClose={this.closeProductCreateModal}
          style={customStyles}
          contentLabel="Sell Something"
        >
          <div className={isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title title">New Loan</h2>
              <Button className="btn-close title" onClick={this.closeProductCreateModal}>
                ×
              </Button>
            </div>

            <div className="modal-body edit-modal-body my-loans-modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <TableContainer style={{ maxHeight: 150, overflow: 'auto' }}>
                    <Table aria-label="nice-table">
                      <TableHead
                        style={{
                          textTransform: "uppercase",
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          background: isDarkMode
                            ? "linear-gradient(45deg, #63077eb5, #f23c3c9c)"
                            : "linear-gradient(45deg, rgba(253, 247, 255, 0.37), rgba(255, 174, 0, 0.56))",
                        }}
                      >
                        <TableRow>
                          <TableCell style={{ textAlign: "center" }}>Rank</TableCell>
                          <TableCell style={{ textAlign: "center" }}>Max Allowance (SOL)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categories.map((category, index) => {
                          if (index < highlightedRowIndex) {
                            return null; // Skip rendering rows before the highlighted one
                          }

                          return (
                            <TableRow
                              key={index}
                              style={{
                                background: highlightedRowIndex === index ? '#28a745' : '',
                              }}
                            >
                              <TableCell style={{ padding: '0', textAlign: 'center' }}>
                                <Lottie
                                  options={{
                                    loop: true,
                                    autoplay: true,
                                    animationData: rankIcon,
                                  }}
                                  style={{
                                    height: '22px',
                                    width: '22px',
                                    display: 'inline-block',
                                  }}
                                />
                                &nbsp;<span style={{ transform: 'translateY(4px)' }}>{category.rankThreshold}</span>
                              </TableCell>
                              <TableCell style={{ textAlign: 'center', padding: '0' }}>
                                <span>
                                  {category.maxAllowance} ({convertToCurrency(category.maxAllowance, solPrice)})
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                    {/* Disclaimer Text */}
                    <div
                    className='roll-tag label'
                      style={{
                        marginTop: '10px',
                        fontStyle: 'italic',
                        textAlign: 'center',
                      }}
                    >
                      You must have a credit score above 700 and an account age of at least 30 days to be eligible.
                    </div>
                  <ProductCreatePage updateTextField={this.updateTextField} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.onSubmitFrom}>
                Submit
              </Button>
            </div>
          </div>
        </Modal>
      </Modal >
    );
  }
}

const mapStateToProps = state => ({
  _id: state.auth.user._id,
  created_at: state.auth.user.created_at,
  loan_amount: state.loanReducer.data.loan_amount,
  loan_period: state.loanReducer.data.loan_period,
  remainingLoans: state.loanReducer.remainingLoans,
  totalWagered: state.auth.totalWagered,
  isDarkMode: state.auth.isDarkMode,
  loading: state.loanReducer.loading,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  // setUrl,
  warningMsgBar,
  infoMsgBar,
  createLoan,
  acQueryMyLoan,
  acQueryLoan,
  acCalculateRemainingLoans,
  getUser
  // updateLoan,
  // deleteLoan,
  // setCurrentProductInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyLoansModal);
