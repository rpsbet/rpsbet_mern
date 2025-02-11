import React, { useState, useCallback, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
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
import {
  errorMsgBar,
  successMsgBar,
} from '../../redux/Notification/notification.actions';

// ------------------ CONSTANTS & HELPERS ------------------
const categories = [
  {
    creditScoreThreshold: 700,
    rankThreshold: 0,
    accountAgeThresholdInDays: 30,
    maxAllowance: 0,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 1,
    accountAgeThresholdInDays: 30,
    maxAllowance: 0.02,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 2,
    accountAgeThresholdInDays: 30,
    maxAllowance: 0.05,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 3,
    accountAgeThresholdInDays: 30,
    maxAllowance: 0.1,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 4,
    accountAgeThresholdInDays: 30,
    maxAllowance: 0.25,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 5,
    accountAgeThresholdInDays: 30,
    maxAllowance: 0.5,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 6,
    accountAgeThresholdInDays: 30,
    maxAllowance: 1,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 7,
    accountAgeThresholdInDays: 30,
    maxAllowance: 1.5,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 8,
    accountAgeThresholdInDays: 30,
    maxAllowance: 2,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 9,
    accountAgeThresholdInDays: 30,
    maxAllowance: 3,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 10,
    accountAgeThresholdInDays: 30,
    maxAllowance: 4,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 12,
    accountAgeThresholdInDays: 30,
    maxAllowance: 6,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 13,
    accountAgeThresholdInDays: 30,
    maxAllowance: 8,
  },
  {
    creditScoreThreshold: 700,
    rankThreshold: 14,
    accountAgeThresholdInDays: 30,
    maxAllowance: 10,
  },
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
    loading,
    myLoans,
    // Redux actions
    errorMsgBar,
    successMsgBar,
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
  const [productCreateModalIsOpen, setProductCreateModalIsOpen] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();

  // Track the previous modalIsOpen in a ref
  const previousModalOpenRef = useRef(false);

  // Only call acQueryMyLoan once each time modal transitions from closed -> open
  useEffect(() => {
    acQueryMyLoan(30, 1, 'loan_amount', '');
  }, []);

  // ------------------ HANDLERS ------------------
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
  });

  const onSubmitForm = useCallback(async () => {
    if (!loanAmount || !apy || !loanPeriod) {
      errorMsgBar('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createLoan({
        _id,
        loan_amount: loanAmount,
        loan_period: loanPeriod,
        apy,
      });

      // Re-fetch data if needed
      await acQueryMyLoan(30, 1, 'loan_amount', '');
      await acQueryLoan(30, 1, 'loan_amount', '');
      await acCalculateRemainingLoans();
      await getUser();

      closeProductCreateModal();
    } catch (error) {
      errorMsgBar(
        error?.message
          ? `Error creating new loan: ${error.message}`
          : 'Something went wrong while creating the loan.',
      );
    } finally {
      setIsSubmitting(false);
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
    errorMsgBar,
    closeProductCreateModal,
    successMsgBar,
  ]);

  // ------------------ CALCULATIONS ------------------
  const accountAgeInDays = getAccountAgeInDays(created_at);
  const highlightedRowIndex = getHighlightedRowIndex(
    categories,
    totalWagered,
    accountAgeInDays,
  );

  // ------------------ RENDER ------------------
  return (
    <>
      {/* ================= MAIN LOANS MODAL ================= */}
      <Modal
        open={modalIsOpen || false}
        onClose={closeModal}
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
            bgcolor: isDarkMode ? '#1f1a25' : '#fff',
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
            <Button
              variant="text"
              color="error"
              onClick={closeModal}
              sx={{ fontSize: '1.25rem' }}
            >
              ×
            </Button>
          </Box>

          {/* BODY: Show skeleton / no loans / MyBankPage */}
          <Box sx={{ mb: 3 }}>
            {loading ? (
              <Skeleton
                variant="rectangular"
                height={300}
                sx={{ borderRadius: 2, mb: 2 }}
              />
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

          {/* FOOTER: If user has remainingLoans, show "CLEAR DEBT..." */}
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

      {/* =============== PRODUCT CREATE DIALOG =============== */}
      <Dialog
        open={productCreateModalIsOpen}
        onClose={closeProductCreateModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1f1a25',
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
          <Box sx={{ mb: 3 }}>
            <TableContainer
              sx={{
                maxHeight: 150,
                overflow: 'auto',
                borderRadius: 2,
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  // Optional: make the text a bit smaller and reduce cell padding
                  'td, th': {
                    fontSize: '0.85rem',
                    padding: '4px 8px',
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      align="center"
                      sx={{
                        color: '#fff',
                        fontWeight: 600,
                        backgroundColor: '#333',
                      }}
                    >
                      RANK
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        color: '#fff',
                        fontWeight: 600,
                        backgroundColor: '#333',
                      }}
                    >
                      MAX ALLOWANCE (SOL)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((category, index) => {
                    // Skip rows below user's current category
                    if (index < highlightedRowIndex) return null;
                    return (
                      <TableRow
                        key={index}
                        sx={{
                          backgroundColor:
                            highlightedRowIndex === index ? '#28a745' : '#333',
                        }}
                      >
                        <TableCell sx={{ color: '#fff' }} align="center">
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Lottie
                              options={{
                                loop: true,
                                autoplay: true,
                                animationData: LottieRankIcon,
                              }}
                              height={22}
                              width={22}
                              style={{ display: 'inline-block' }}
                            />
                            <span>{category.rankThreshold}</span>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }} align="center">
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
              sx={{
                mt: 2,
                fontStyle: 'italic',
                textAlign: 'center',
                opacity: 0.8,
              }}
            >
              You must have a credit score above 700 and an account age of at
              least 30 days to be eligible.
            </Typography>
          </Box>

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
              disabled={isSubmitting} // Disable the button while loading
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Submit'
              )}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
  _id: state.auth.user._id,
  created_at: state.auth.user.created_at,
  remainingLoans: state.loanReducer.remainingLoans,
  totalWagered: state.auth.totalWagered,
  isDarkMode: state.auth.isDarkMode,
  loading: state.loanReducer.loading,
  solPrice: state.logic.solPrice,
  // Example: store user loans in state.loanReducer.myLoans
  myLoans: state.loanReducer.myLoanArray || [],
});

const mapDispatchToProps = {
  errorMsgBar,
  successMsgBar,
  createLoan,
  acQueryMyLoan,
  acQueryLoan,
  acCalculateRemainingLoans,
  getUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyLoansModal);
