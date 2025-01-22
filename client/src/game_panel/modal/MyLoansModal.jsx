import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import Lottie from 'react-lottie';
import {
  Modal,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Typography,
  Skeleton,
  IconButton
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
import AttachMoney from '@mui/icons-material/AttachMoney';

import MyBankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyBankPage';
import ProductCreatePage from '../../admin_panel/app/ProductPages/ProductCreatePage/ProductCreatePage';
import { convertToCurrency } from '../../util/conversion';
import { getRank } from '../../util/getRank';
import rankIcon from '../LottieAnimations/rankIcon.json';

// Redux Actions
import {
  createLoan,
  acQueryMyLoan,
  acQueryLoan,
  acCalculateRemainingLoans
} from '../../redux/Loan/loan.action';
import { getUser } from '../../redux/Auth/user.actions';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';

// ------------------ CONSTANTS & HELPERS ------------------
const categories = [
  { creditScoreThreshold: 700, rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 0.005 },
  { creditScoreThreshold: 700, rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 0.01 },
  { creditScoreThreshold: 700, rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 0.02 },
  // ...
  { creditScoreThreshold: 700, rankThreshold: 32, accountAgeThresholdInDays: 30, maxAllowance: 8 },
  { creditScoreThreshold: 700, rankThreshold: 33, accountAgeThresholdInDays: 30, maxAllowance: 10 },
];

const getAccountAgeInDays = (createdAtDate) => {
  const accountCreatedAt = new Date(createdAtDate);
  const currentDate = new Date();
  const accountAgeInMilliseconds = currentDate - accountCreatedAt;
  return Math.floor(accountAgeInMilliseconds / (24 * 60 * 60 * 1000));
};

const MyLoansModal = (props) => {
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
    getUser
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

  const updateTextField = useCallback(
    (data) => {
      if (data.loan_amount !== '' || data.apy !== '' || data.loan_period !== '') {
        setLoanAmount(data.loan_amount || '');
        setApy(data.apy || '');
        setLoanPeriod(data.loan_period || '');
      } else {
        warningMsgBar(`One of the fields has an empty or invalid value.`);
      }
    },
    [warningMsgBar]
  );

  const onSubmitForm = useCallback(async () => {
    if (loanAmount !== '' || apy !== '' || loanPeriod !== '') {
      infoMsgBar(`New Loan Listed!`);

      await createLoan({
        _id,
        loan_amount: loanAmount,
        loan_period: loanPeriod,
        apy
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
    closeProductCreateModal
  ]);

  // ------------------ RENDER UTILS ------------------
  const accountAgeInDays = getAccountAgeInDays(created_at);

  const getHighlightedRowIndex = (categoriesArr, rankValue, accountAgeInDays) => {
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
  };

  const highlightedRowIndex = getHighlightedRowIndex(categories, totalWagered, accountAgeInDays);

  // ------------------ COMPONENT ------------------
  return (
    <>
      {/* MAIN LOANS MODAL */}
      <Modal
        open={modalIsOpen}
        onClose={closeModal}
        closeAfterTransition
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: isDarkMode ? '#333' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            width: '80vw',
            maxWidth: 700,
            maxHeight: '80vh',
            overflowY: 'auto',
            borderRadius: 1,
            p: 3,
            boxShadow: 24
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2
            }}
          >
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FontAwesomeIcon icon={faCoins} />
              Your Loans
            </Typography>
            <Button variant="text" color="error" onClick={closeModal} sx={{ fontSize: '1.25rem' }}>
              ×
            </Button>
          </Box>

          {/* BODY */}
          <Box sx={{ mb: 2 }}>
            <MyBankPage />
          </Box>

          {/* FOOTER */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {remainingLoans > 0 ? (
              <Typography sx={{ color: 'error.main' }}>
                CLEAR DEBT FIRST TO CREATE A LOAN
              </Typography>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                onClick={openProductCreateModal}
                startIcon={<AttachMoney />}
              >
                CREATE A LOAN
              </Button>
            )}
          </Box>
        </Box>
      </Modal>

      {/* PRODUCT CREATE MODAL */}
      <Modal
        open={productCreateModalIsOpen}
        onClose={closeProductCreateModal}
        closeAfterTransition
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: isDarkMode ? '#333' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            width: '80vw',
            maxWidth: 700,
            maxHeight: '80vh',
            overflowY: 'auto',
            borderRadius: 1,
            p: 3,
            boxShadow: 24
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2
            }}
          >
            <Typography variant="h6">New Loan</Typography>
            <Button
              variant="text"
              color="error"
              onClick={closeProductCreateModal}
              sx={{ fontSize: '1.25rem' }}
            >
              ×
            </Button>
          </Box>

          {/* TABLE: RANK ALLOWANCES */}
          <Box sx={{ mb: 2 }}>
            <TableContainer sx={{ maxHeight: 150, overflow: 'auto' }}>
              <Table aria-label="nice-table">
                <TableHead
                  sx={{
                    textTransform: 'uppercase',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    background: isDarkMode
                      ? 'linear-gradient(45deg, #63077eb5, #f23c3c9c)'
                      : 'linear-gradient(45deg, rgba(253, 247, 255, 0.37), rgba(255, 174, 0, 0.56))'
                  }}
                >
                  <TableRow>
                    <TableCell align="center">Rank</TableCell>
                    <TableCell align="center">Max Allowance (SOL)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category, index) => {
                    // Skip rows below user's current category
                    if (index < highlightedRowIndex) {
                      return null;
                    }
                    return (
                      <TableRow
                        key={index}
                        sx={{
                          backgroundColor: highlightedRowIndex === index ? '#28a745' : 'inherit'
                        }}
                      >
                        <TableCell align="center">
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                            <Lottie
                              options={{
                                loop: true,
                                autoplay: true,
                                animationData: rankIcon
                              }}
                              height={22}
                              width={22}
                              style={{ display: 'inline-block' }}
                            />
                            <span>{category.rankThreshold}</span>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {category.maxAllowance} (
                          {convertToCurrency(category.maxAllowance, solPrice)})
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography
              variant="body2"
              sx={{ mt: 2, fontStyle: 'italic', textAlign: 'center' }}
            >
              You must have a credit score above 700 and an account age of at least 30 days
              to be eligible.
            </Typography>
          </Box>

          {/* PRODUCT CREATE PAGE */}
          <Box sx={{ mb: 2 }}>
            <ProductCreatePage updateTextField={updateTextField} />
          </Box>

          {/* FOOTER */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="error" onClick={onSubmitForm}>
              Submit
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

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
  solPrice: state.logic.solPrice
});

const mapDispatchToProps = {
  warningMsgBar,
  infoMsgBar,
  createLoan,
  acQueryMyLoan,
  acQueryLoan,
  acCalculateRemainingLoans,
  getUser
};

export default connect(mapStateToProps, mapDispatchToProps)(MyLoansModal);