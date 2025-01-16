import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import Lottie from 'react-lottie';
import Modal from 'react-modal';
import rankIcon from '../LottieAnimations/rankIcon.json';
import {
  Table,
  TableBody,
  Button,
  TextField,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
import AttachMoney from '@material-ui/icons/AttachMoney';

import MyBankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyBankPage';
import ProductCreatePage from '../../admin_panel/app/ProductPages/ProductCreatePage/ProductCreatePage';
import { convertToCurrency } from '../../util/conversion';
import { getRank } from '../../util/getRank';

import {
  createLoan,
  acQueryMyLoan,
  acQueryLoan,
  acCalculateRemainingLoans,
} from '../../redux/Loan/loan.action';
import { getUser } from '../../redux/Auth/user.actions';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';

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
    border: 'none',
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

function MyLoansModal(props) {
  const {
    modalIsOpen,
    closeModal,
    isDarkMode,
    _id,
    created_at,
    totalWagered,
    remainingLoans,
    solPrice,
    // Redux actions
    warningMsgBar,
    infoMsgBar,
    createLoan,
    acQueryMyLoan,
    acQueryLoan,
    acCalculateRemainingLoans,
    getUser,
  } = props;

  // ------------------ LOCAL STATE ------------------
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPeriod, setLoanPeriod] = useState('');
  const [apy, setApy] = useState('');
  const [productCreateModalIsOpen, setProductCreateModalIsOpen] = useState(false);

  // ------------------ HANDLERS ------------------
  const openProductCreateModal = useCallback(() => {
    setProductCreateModalIsOpen(true);
  }, []);

  const closeProductCreateModal = useCallback(() => {
    setProductCreateModalIsOpen(false);
  }, []);

  // Replaces the old `updateTextField` method
  const updateTextField = useCallback((data) => {
    if (data.loan_amount !== '' || data.apy !== '' || data.loan_period !== '') {
      setLoanAmount(data.loan_amount || '');
      setApy(data.apy || '');
      setLoanPeriod(data.loan_period || '');
    } else {
      warningMsgBar(`One of the fields has an empty or invalid value.`);
    }
  }, [warningMsgBar]);

  // Utility function to compute account age
  const getAccountAgeInDays = (createdAtDate) => {
    const accountCreatedAt = new Date(createdAtDate);
    const currentDate = new Date();
    const accountAgeInMilliseconds = currentDate - accountCreatedAt;
    return Math.floor(accountAgeInMilliseconds / (24 * 60 * 60 * 1000));
  };

  // Find the best row for the user based on rank & age
  const getHighlightedRowIndex = useCallback((categoriesArr, rankValue, accountAgeInDays) => {
    const currentRank = getRank(rankValue);
    let bestCategoryIndex = -1;

    for (let i = 0; i < categoriesArr.length; i++) {
      const category = categoriesArr[i];
      if (
        currentRank >= category.rankThreshold &&
        accountAgeInDays >= category.accountAgeThresholdInDays
      ) {
        bestCategoryIndex = i;
      }
    }
    return bestCategoryIndex;
  }, []);

  // The main submission
  const onSubmitFrom = useCallback(async () => {
    if (loanAmount !== '' || apy !== '' || loanPeriod !== '') {
      infoMsgBar(`New Loan Listed!`);

      await createLoan({
        _id,
        loan_amount: loanAmount,
        loan_period: loanPeriod,
        apy,
      });
      // Re-fetch data
      await acQueryMyLoan(30, 1, 'loan_amount', '');
      await acQueryLoan(30, 1, 'loan_amount', '');
      // await acCalculateRemainingLoans();
      await getUser(true, 5);

      closeProductCreateModal();
    }
  }, [
    loanAmount,
    apy,
    loanPeriod,
    _id,
    createLoan,
    acQueryMyLoan,
    acQueryLoan,
    acCalculateRemainingLoans,
    getUser,
    infoMsgBar,
    closeProductCreateModal,
  ]);

  // -------------- RENDERING ---------------------
  const accountAgeInDays = getAccountAgeInDays(created_at);
  const highlightedRowIndex = getHighlightedRowIndex(categories, totalWagered, accountAgeInDays);

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Your Loans Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">
            <FontAwesomeIcon icon={faCoins} className="mr-2" />
            Your Loans
          </h2>
          <Button className="btn-close title" onClick={closeModal}>
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
            <div style={{ color: '#ff0000' }}>CLEAR DEBT FIRST TO CREATE A LOAN</div>
          ) : (
            <Button className="btn-back" onClick={openProductCreateModal}>
              CREATE A LOAN &nbsp; <AttachMoney />
            </Button>
          )}
        </div>
      </div>

      <Modal
        isOpen={productCreateModalIsOpen}
        onRequestClose={closeProductCreateModal}
        style={customStyles}
        contentLabel="Sell Something"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">New Loan</h2>
            <Button className="btn-close title" onClick={closeProductCreateModal}>
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
                        textTransform: 'uppercase',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        background: isDarkMode
                          ? 'linear-gradient(45deg, #63077eb5, #f23c3c9c)'
                          : 'linear-gradient(45deg, rgba(253, 247, 255, 0.37), rgba(255, 174, 0, 0.56))',
                      }}
                    >
                      <TableRow>
                        <TableCell style={{ textAlign: 'center' }}>Rank</TableCell>
                        <TableCell style={{ textAlign: 'center' }}>Max Allowance (SOL)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categories.map((category, index) => {
                        if (index < highlightedRowIndex) {
                          return null; // skip rows below user's current category
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
                              &nbsp;
                              <span style={{ transform: 'translateY(4px)' }}>
                                {category.rankThreshold}
                              </span>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center', padding: '0' }}>
                              <span>
                                {category.maxAllowance} (
                                {convertToCurrency(category.maxAllowance, solPrice)})
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
                  className="roll-tag label"
                  style={{
                    marginTop: '10px',
                    fontStyle: 'italic',
                    textAlign: 'center',
                  }}
                >
                  You must have a credit score above 700 and an account age of at least 30 days
                  to be eligible.
                </div>

                <ProductCreatePage updateTextField={updateTextField} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-submit" onClick={onSubmitFrom}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
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
  warningMsgBar,
  infoMsgBar,
  createLoan,
  acQueryMyLoan,
  acQueryLoan,
  acCalculateRemainingLoans,
  getUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyLoansModal);