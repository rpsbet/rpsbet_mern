import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  CircularProgress,
  Dialog,
  DialogContent,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faPlus } from '@fortawesome/free-solid-svg-icons';
import AttachMoney from '@mui/icons-material/AttachMoney';
import RankAllowancesTable from '../../components/RankAllowancesTable';
import LottieRankIcon from '../LottieAnimations/rankIcon.json';
import MyBankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyBankPage';
import ProductCreatePage from '../../admin_panel/app/ProductPages/ProductCreatePage/ProductCreatePage';
import { convertToCurrency } from '../../util/conversion';
import { getRank } from '../../util/getRank';

// Redux Actions
import {
  createLoan,
  acQueryMyLoan,
  acQueryLoan,
  acCalculateRemainingLoans,
} from '../../redux/Loan/loan.action';
import { getUser } from '../../redux/Auth/user.actions';
import { errorMsgBar, successMsgBar } from '../../redux/Notification/notification.actions';

// ------------------ CONSTANTS & HELPERS ------------------
const categories = [
  { creditScoreThreshold: 700, rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 0.25 },
  { creditScoreThreshold: 700, rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 0.5 },
  { creditScoreThreshold: 700, rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 0.75 },
  { creditScoreThreshold: 700, rankThreshold: 4, accountAgeThresholdInDays: 30, maxAllowance: 1 },
  { creditScoreThreshold: 700, rankThreshold: 5, accountAgeThresholdInDays: 30, maxAllowance: 1.3 },
  { creditScoreThreshold: 700, rankThreshold: 6, accountAgeThresholdInDays: 30, maxAllowance: 1.6 },
  { creditScoreThreshold: 700, rankThreshold: 7, accountAgeThresholdInDays: 30, maxAllowance: 2.2 },
  { creditScoreThreshold: 700, rankThreshold: 8, accountAgeThresholdInDays: 30, maxAllowance: 3.5 },
  { creditScoreThreshold: 700, rankThreshold: 9, accountAgeThresholdInDays: 30, maxAllowance: 4 },
  { creditScoreThreshold: 700, rankThreshold: 10, accountAgeThresholdInDays: 30, maxAllowance: 5 },
  { creditScoreThreshold: 700, rankThreshold: 11, accountAgeThresholdInDays: 30, maxAllowance: 6 },
  { creditScoreThreshold: 700, rankThreshold: 12, accountAgeThresholdInDays: 30, maxAllowance: 7 },
  { creditScoreThreshold: 700, rankThreshold: 14, accountAgeThresholdInDays: 30, maxAllowance: 8 },
  { creditScoreThreshold: 700, rankThreshold: 15, accountAgeThresholdInDays: 30, maxAllowance: 9 },
  { creditScoreThreshold: 700, rankThreshold: 16, accountAgeThresholdInDays: 30, maxAllowance: 10 },
  { creditScoreThreshold: 700, rankThreshold: 17, accountAgeThresholdInDays: 30, maxAllowance: 11 },
  { creditScoreThreshold: 700, rankThreshold: 18, accountAgeThresholdInDays: 30, maxAllowance: 12 },
  { creditScoreThreshold: 700, rankThreshold: 19, accountAgeThresholdInDays: 30, maxAllowance: 13 },
  { creditScoreThreshold: 700, rankThreshold: 20, accountAgeThresholdInDays: 30, maxAllowance: 14 },
  { creditScoreThreshold: 700, rankThreshold: 21, accountAgeThresholdInDays: 30, maxAllowance: 15 },
];

const getAccountAgeInDays = (createdAtDate) => {
  const accountCreatedAt = new Date(createdAtDate);
  const currentDate = new Date();
  const accountAgeInMilliseconds = currentDate - accountCreatedAt;
  return Math.floor(accountAgeInMilliseconds / (24 * 60 * 60 * 1000));
};

const getHighlightedRowIndex = (categoriesArr, rankValue, accountAgeInDays) => {
  const currentRank = getRank(rankValue);
  let bestCategoryIndex = -1;
  for (let i = 0; i < categoriesArr.length; i++) {
    const category = categoriesArr[i];
    if (
      currentRank >= category.rankThreshold &&
      accountAgeInDays >= category.accountAgeThresholdInDays
    ) {
      bestCategoryIndex = i - 1;
    }
  }
  return bestCategoryIndex;
};

// ------------------ COMPONENT ------------------
const MyLoansModal = ({ modalIsOpen, closeModal }) => {
  const dispatch = useDispatch();

  // Redux state
  const _id = useSelector((state) => state.auth.user._id);
  const created_at = useSelector((state) => state.auth.user.created_at);
  const remainingLoans = useSelector((state) => state.loanReducer.remainingLoans);
  const totalWagered = useSelector((state) => state.auth.totalWagered);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const loading = useSelector((state) => state.loanReducer.loading);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const myLoans = useSelector((state) => state.loanReducer.myLoanArray || []);

  // Local state
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPeriod, setLoanPeriod] = useState('');
  const [apy, setApy] = useState('');
  const [productCreateModalIsOpen, setProductCreateModalIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // On mount, fetch my loans data
  useEffect(() => {
    dispatch(acQueryMyLoan(30, 1, 'loan_amount', ''));
  }, [dispatch]);

  // Handlers
  const openProductCreateModal = useCallback(() => {
    setProductCreateModalIsOpen(true);
  }, []);

  const closeProductCreateModal = useCallback(() => {
    setProductCreateModalIsOpen(false);
  }, []);

  const updateTextField = useCallback((data) => {
    if (data.loan_amount !== '' || data.apy !== '' || data.loan_period !== '') {
      setLoanAmount(data.loan_amount || '');
      setApy(data.apy || '');
      setLoanPeriod(data.loan_period || '');
    }
  }, []);

  const onSubmitForm = useCallback(async () => {
    if (!loanAmount || !apy || !loanPeriod) {
      dispatch(errorMsgBar('Please fill in all required fields.'));
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(
        createLoan({
          _id,
          loan_amount: loanAmount,
          loan_period: loanPeriod,
          apy,
        })
      );

      await dispatch(acQueryMyLoan(30, 1, 'loan_amount', ''));
      await dispatch(acQueryLoan(30, 1, 'loan_amount', ''));
      await dispatch(acCalculateRemainingLoans());
      await dispatch(getUser());

      closeProductCreateModal();
    } catch (error) {
      dispatch(
        errorMsgBar(
          error?.message
            ? `Error creating new loan: ${error.message}`
            : 'Something went wrong while creating the loan.'
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    loanAmount,
    apy,
    loanPeriod,
    _id,
    dispatch,
    closeProductCreateModal,
  ]);

  const onBtnCancelClicked = useCallback(() => {
    closeModal();
  }, [closeModal]);

  // Derived values
  const accountAgeInDays = getAccountAgeInDays(created_at);
  const highlightedRowIndex = getHighlightedRowIndex(categories, totalWagered, accountAgeInDays);
  const tableCellStyle = { textAlign: 'center' };

  return (
    <>
      {/* MAIN LOANS MODAL */}
      <Modal
        open={modalIsOpen || false}
        onClose={onBtnCancelClicked}
        closeAfterTransition
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: isDarkMode ? '#1c1c1c' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            width: '80vw',
            maxWidth: 700,
            maxHeight: '80vh',
            overflowY: 'auto',
            borderRadius: 2,
            p: 3,
            boxShadow: 24,
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontWeight: 600,
              }}
            >
              <FontAwesomeIcon icon={faCoins} />
              YOUR LOANS
            </Typography>
            <Button variant="text" color="error" onClick={onBtnCancelClicked} sx={{ fontSize: '1.25rem' }}>
              ×
            </Button>
          </Box>

          {/* BODY */}
          <Box sx={{ mb: 3 }}>
            {loading ? (
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 2 }} />
            ) : myLoans && myLoans.length === 0 ? (
              <Typography
                align="center"
                sx={{
                  my: 4,
                  fontSize: 18,
                  fontStyle: 'italic',
                  opacity: 0.8,
                }}
              >
                No Loans Found
              </Typography>
            ) : (
              <MyBankPage />
            )}
          </Box>

          {/* FOOTER */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {remainingLoans > 0 ? (
              <Typography sx={{ color: 'error.main', fontWeight: 600 }}>
                CLEAR DEBT FIRST TO CREATE A LOAN
              </Typography>
            ) : (
              <Button
                variant="contained"
                color="error"
                onClick={openProductCreateModal}
                startIcon={<AttachMoney />}
              >
                CREATE A LOAN
              </Button>
            )}
          </Box>
        </Box>
      </Modal>

      {/* PRODUCT CREATE DIALOG */}
      <Dialog
        open={productCreateModalIsOpen}
        onClose={closeProductCreateModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1c1c1c',
            color: '#fff',
            borderRadius: 2,
            boxShadow: 24,
          },
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          {/* HEADER */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              <FontAwesomeIcon icon={faPlus} /> &nbsp;NEW LOAN
            </Typography>
            <Button
              variant="text"
              color="error"
              onClick={closeProductCreateModal}
              sx={{ fontSize: '1.25rem', minWidth: 'auto' }}
            >
              ×
            </Button>
          </Box>

          {/* TABLE: RANK ALLOWANCES */}
          <RankAllowancesTable categories={categories} />

          {/* PRODUCT CREATE PAGE FORM */}
          <Box sx={{ mb: 3 }}>
            <ProductCreatePage updateTextField={updateTextField} />
          </Box>

          {/* FOOTER: SUBMIT BUTTON */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={onSubmitForm}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyLoansModal;