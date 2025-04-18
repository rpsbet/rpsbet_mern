import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Lottie from 'react-lottie';
import {
  Modal,
  Box,
  Button,
  Typography,
  Skeleton,
  CircularProgress,
  Dialog,
  DialogContent,
  Tooltip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faPlus } from '@fortawesome/free-solid-svg-icons';
import AttachMoney from '@mui/icons-material/AttachMoney';
import verified from '../LottieAnimations/verified.json';
import MyBankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/MyBankPage';
import ProductCreatePage from '../../admin_panel/app/ProductPages/ProductCreatePage/ProductCreatePage';
import { getRank } from '../../util/getRank';

const EliteSubscriptionModal = lazy(() => import('../modal/EliteSubscriptionModal'));

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
const getMaxAllowance = (elite) => {
  if (elite === 'black') return 10;
  if (elite === 'red') return 1;
  return 0;
};

// ------------------ COMPONENT ------------------
const MyLoansModal = ({ modalIsOpen, closeModal }) => {
  const dispatch = useDispatch();

  // Redux state
  const _id = useSelector((state) => state.auth.user._id);
  const remainingLoans = useSelector((state) => state.loanReducer.remainingLoans);
  const totalWagered = useSelector((state) => state.auth.totalWagered);
  const elite = useSelector((state) => state.auth.user.elite);
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const loading = useSelector((state) => state.loanReducer.loading);
  const isLowGraphics = useSelector((state) => state.auth.isLowGraphics);
  const myLoans = useSelector((state) => state.loanReducer.myLoanArray || []);

  // Local state
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPeriod, setLoanPeriod] = useState('');
  const [apy, setApy] = useState('');
  const [productCreateModalIsOpen, setProductCreateModalIsOpen] = useState(false);
  const [eliteSubscriptionModalIsOpen, setEliteSubscriptionModalIsOpen] = useState(false);
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

  const openEliteSubscriptionModal = useCallback(() => {
    setEliteSubscriptionModalIsOpen(true);
  }, []);

  const closeEliteSubscriptionModal = useCallback(() => {
    setEliteSubscriptionModalIsOpen(false);
  }, []);

  const handleCreateLoanClick = useCallback(() => {
    if (elite === '') {
      openEliteSubscriptionModal();
    } else {
      openProductCreateModal();
    }
  }, [elite, openEliteSubscriptionModal, openProductCreateModal]);

  const onSubmitForm = useCallback(async () => {
    if (!loanAmount || !apy || !loanPeriod) {
      dispatch(errorMsgBar('Please fill in all required fields.'));
      return;
    }

    const maxAllowance = getMaxAllowance(elite);
    if (parseFloat(loanAmount) > maxAllowance) {
      dispatch(errorMsgBar(`Loan amount exceeds your maximum allowance of ${maxAllowance}.`));
      return;
    }

    if (remainingLoans > 0) {
      dispatch(errorMsgBar('Please clear existing debt before creating a new loan.'));
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
    elite,
    remainingLoans,
    dispatch,
    closeProductCreateModal,
  ]);

  const onBtnCancelClicked = useCallback(() => {
    closeModal();
  }, [closeModal]);

  // Derived values
  const maxAllowance = getMaxAllowance(elite);
  const currentRank = getRank(totalWagered);

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
            color: '#fff',
            width: '90%',
            overflowY: 'auto',
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            // Glassmorphism styles (default dark mode colors)
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)', // For Safari
            border: '1px solid rgba(255, 255, 255, 0.2)',
            // Fallback for browsers without backdrop-filter
            '@supports not (backdrop-filter: blur(10px))': {
              background: 'rgba(0, 0, 0, 0.4)',
            },
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <Box
                sx={{
                  width: '22px',
                  height: 'auto',
                  position: 'relative',
                  transform: 'scale(0.6)',
                  filter: user?.elite === 'black' ? 'grayscale(1)' : 'hue-rotate(132deg)',
                }}
              >
                <Lottie
                  options={{
                    loop: !isLowGraphics,
                    autoplay: !isLowGraphics,
                    animationData: verified,
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
              <span style={{ color: user?.elite === 'red' ? '#ff0000' : user?.elite === 'black' ? '#e5e5e5' : '#ff0000' }}>
                {user?.elite === 'red' || user?.elite === 'black' ? `${user.elite.toUpperCase()} ELITE USER` : 'ELITE USERS ONLY'}
              </span>
            </Box>
            {remainingLoans > 0 ? (
              <Typography sx={{ color: 'error.main', fontWeight: 600 }}>
                CLEAR DEBT FIRST TO CREATE A LOAN
              </Typography>
            ) : (
              <Tooltip title="Loan creation requires an Elite subscription">
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCreateLoanClick}
                    startIcon={<AttachMoney />}
                    sx={{ position: 'relative' }}
                    aria-label="Create a loan (Elite members only)"
                  >
                    CREATE A LOAN
                  </Button>
                </Box>
              </Tooltip>
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
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '@supports not (backdrop-filter: blur(10px))': {
              background: 'rgba(0, 0, 0, 0.4)',
            },
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
              <FontAwesomeIcon icon={faPlus} /> NEW LOAN
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

          {/* ALLOWANCE DISPLAY */}
          <Box sx={{ mb: 3, }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Your Loan Allowance
            </Typography>
            <Typography
              sx={{
                color: elite === 'black' ? '#000' : '#ff0000',
                fontWeight: 600,
                p: 1,
                bgcolor: '#333',
                borderRadius: 1,
                border: `2px solid ${elite === 'black' ? '#000' : '#ff0000'}`,
              }}
            >
              {elite.toUpperCase()} ELITE: Maximum Loan Allowance - {maxAllowance} SOL
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
              variant="outlined"
              color="error"
              onClick={onSubmitForm}
              disabled={isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Suspense fallback={<Typography></Typography>}>

        <EliteSubscriptionModal
          modalIsOpen={eliteSubscriptionModalIsOpen}
          closeModal={closeEliteSubscriptionModal}
          user={user}
          isLowGraphics={isLowGraphics}
        />
      </Suspense>
    </>
  );
};

export default MyLoansModal;