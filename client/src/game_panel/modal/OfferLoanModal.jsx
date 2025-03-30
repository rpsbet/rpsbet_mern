import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TextField,
  Tooltip,
  InputAdornment,
  ThemeProvider,
  Box,
  CircularProgress,
} from '@mui/material';
import { getCustomTheme } from '../../config/theme';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faDollarSign,
  faCalendarAlt,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import InfoIcon from '@mui/icons-material/Info';

import Lottie from 'react-lottie';
import spinningIcon from '../LottieAnimations/spinningIcon';
import Avatar from '../../components/Avatar';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import {
  offerLoan,
  acCalculateRemainingLoans,
  addNewTransaction,
  acQueryLoan,
  emitLoanOffer,
  cancelledOffer,
  reconsiderOffer,
  createAndLend,
} from '../../redux/Loan/loan.action';
import {
  closeOfferLoanModal,
  errorMsgBar,
} from '../../redux/Notification/notification.actions';
import { getUser } from '../../redux/Auth/user.actions';

// Utility
import { convertToCurrency } from '../../util/conversion';

function OfferLoanModal() {
  const dispatch = useDispatch();

  // ----------- Redux State -----------
  const isOpen = useSelector((state) => state.snackbar.showOfferLoanModal);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const isLowGraphics = useSelector((state) => state.auth.isLowGraphics);
  const solPrice = useSelector((state) => state.auth.solPrice);
  const userInfo = useSelector((state) => state.auth.user);
  const onlineUserList = useSelector((state) => state.logic.onlineUserList);

  // The loan-related info passed via Redux
  const offerInfo = useSelector((state) => state.loanReducer.offerInfo);
  const isMuted = useSelector((state) => state.auth.isMuted);

  // ----------- Local State -----------
  const [expanded, setExpanded] = useState(false);
  const [responseText, setResponseText] = useState('0');
  const [loanPeriodText, setLoanPeriodText] = useState('0');
  const [interestRateText, setInterestRateText] = useState('0');
  const [cancelled, setCancelled] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [og, setOg] = useState(null);

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');
  const rejectedAudioRef = useRef(null);

  // --------------- EFFECTS ---------------
  // Initialize audio on mount
  useEffect(() => {
    const audio = new Audio('/sounds/rejected.mp3');
    audio.load();
    rejectedAudioRef.current = audio;
  }, []);

  // Re-run socket setup if the modal re-opens or offerInfo changes
  useEffect(() => {
    if (isOpen) {
      setCancelled(false);
      setWaiting(true);
      setupSocketListener(1);

      // If user is lender, “nudge” the other party
      if (offerInfo?.isLender) {
        nudge();
      } else {
        // If not lender, reconsider the offer
        dispatch(
          reconsiderOffer({
            _id: userInfo._id,
            username: '',
          }),
        );
      }
    }
  }, [isOpen, offerInfo]);

  // If the “isComplete” state changes to true, close the modal and refresh user
  useEffect(() => {
    if (isComplete) {
      dispatch(getUser());
      dispatch(closeOfferLoanModal());
    }
  }, [isComplete, dispatch]);

  // -------------- Socket Logic --------------
  const setupSocketListener = (attempt) => {
    // If either no socket or no offer info, retry a few times
    if (!offerInfo?.socket || !offerInfo?._id) {
      if (attempt < 5) {
        setTimeout(() => setupSocketListener(attempt + 1), 1000);
      }
      return;
    }

    const socket = offerInfo.socket;
    const offerId = offerInfo._id;

    // Clean up any existing listeners
    socket.off(`CANCEL_OFFER_${offerId}`);
    socket.off(`OFFER_LOAN_${offerId}`);
    socket.off(`OFFER_LOAN_${userInfo?._id}`);

    // Cancel Offer handler
    socket.on(`CANCEL_OFFER_${offerId}`, (data) => {
      setCancelled(data.cancelled);
      setWaiting(true);

      // If lender and modal is open and not complete => play rejection sound
      if (
        isOpen &&
        data.cancelled &&
        !isMuted &&
        offerInfo.isLender &&
        !isComplete
      ) {
        rejectedAudioRef.current?.play();
      }
      // If borrower, close the modal immediately on cancel
      if (data.cancelled && !offerInfo.isLender) {
        dispatch(closeOfferLoanModal());
      }
    });

    // Offer Loan update (by ID of the offer or the user)
    const onOfferLoanUpdate = (data) => {
      setResponseText(`${data.loanAmount}`);
      setLoanPeriodText(`${data.loanPeriod}`);
      setInterestRateText(`${data.interestRate}`);
      setWaiting(false);
      setCancelled(false);
      setOg(data.og);
      setIsComplete(!!data.isComplete);
    };

    socket.on(`OFFER_LOAN_${offerId}`, onOfferLoanUpdate);
    socket.on(`OFFER_LOAN_${userInfo?._id}`, onOfferLoanUpdate);
  };

  // “Nudge” the other party
  const nudge = () => {
    if (!offerInfo?._id || !userInfo?._id) return;
    dispatch(
      emitLoanOffer({
        _id: offerInfo._id,
        lender: userInfo._id,
        avatar: userInfo.avatar,
        totalWagered: userInfo.totalWagered,
        accessory: userInfo.accessory,
        username: userInfo.username,
      }),
    );
  };

  // -------------- Utility Functions --------------
  const calculateNewBalance = (userBalance, loanAmount) => {
    const val = parseFloat(loanAmount);
    const newBalance = userBalance - (isNaN(val) ? 0 : val);
    return isNaN(newBalance) ? userBalance : newBalance;
  };

  const calculateInterest = (loanAmount, interestRate) => {
    const amt = parseFloat(loanAmount);
    const rate = parseFloat(interestRate);
    if (isNaN(amt) || isNaN(rate)) return 0;
    return (amt * rate) / 100;
  };

  const determineLoanType = (userBalance, loanAmount) => {
    const nb = calculateNewBalance(userBalance, loanAmount);
    return nb < 0 ? 'FRACTIONAL' : 'FULL';
  };

  const exceedsReservesLimit = (userBalance, loanAmount) => {
    const amt = parseFloat(loanAmount);
    return amt > userBalance * 10;
  };

  // -------------- Event Handlers --------------
  const handleResponseTextChange = (e) => {
    const val = e.target.value;
    const parsed = val.match(/^\d*\.?\d*$/);
    setResponseText(parsed ? parsed[0] : '');
  };
  const handleLoanPeriodTextChange = (e) => {
    const val = e.target.value;
    const parsed = val.match(/^\d*\.?\d*$/);
    setLoanPeriodText(parsed ? parsed[0] : '');
  };
  const handleInterestRateTextChange = (e) => {
    const val = e.target.value;
    const parsed = val.match(/^\d*\.?\d*$/);
    setInterestRateText(parsed ? parsed[0] : '');
  };

  // The Lender’s “OFFER” button
  const onBtnOkClicked = () => {
    if (parseFloat(responseText) > 10 * userInfo.balance) {
      dispatch(
        errorMsgBar(
          'PLEASE ENSURE THE LOAN AMOUNT IS NO MORE THAN 10X YOUR BALANCE',
        ),
      );
      return;
    }
    if (parseFloat(responseText) < 0.001) {
      dispatch(errorMsgBar('MEOWNIMUM IS 0.001 SOL'));
      return;
    }

    setWaiting(false);

    // Send the loan offer
    dispatch(
      offerLoan({
        loanAmount: parseFloat(responseText),
        loanPeriod: parseInt(loanPeriodText),
        interestRate: parseFloat(interestRateText),
        lender: offerInfo._id,
        og: userInfo._id,
      }),
    );
  };

  // The Borrower’s “ACCEPT” button
  const createAndLendHandler = async () => {
    setWaiting(true);

    const result = await dispatch(
      createAndLend({
        loan_amount: responseText,
        loan_period: loanPeriodText,
        apy: interestRateText,
        lender: og,
      }),
    );

    // If success, refresh user data, close modal
    onBtnCancelClicked();
    if (result?.success) {
      dispatch(getUser());
      dispatch(errorMsgBar(result.message));
      dispatch(
        offerLoan({
          loanAmount: '',
          loanPeriod: '',
          interestRate: '',
          lender: userInfo._id,
          complete: true,
        }),
      );
    }
  };

  // Cancel or Reject
  const onBtnCancelClicked = () => {
    // Play sound if not lender and not complete
    if (!isMuted && !offerInfo.isLender && !isComplete) {
      rejectedAudioRef.current?.play();
    }
    // If it’s not complete => notify the server it’s cancelled
    if (!isComplete) {
      dispatch(
        cancelledOffer({
          avatar: '',
          _id: offerInfo._id,
          username: '',
          accessory: '',
          totalWagered: '',
          isLender: '',
        }),
      );
    }
    // Close the modal
    dispatch(closeOfferLoanModal());
  };

  const toggleExpand = () => setExpanded((prev) => !prev);

  // -------------- Render JSX --------------
  return (
    <ThemeProvider theme={theme}>
      <Dialog
        open={isOpen || false}
        onClose={onBtnCancelClicked}
        PaperProps={{
          sx: {
            bgcolor: isDarkMode ? '#1c1c1e' : '#f5f5f5',
            color: isDarkMode ? '#f9f9f9' : '#333',
            borderRadius: 2,
            minWidth: { xs: '90%', sm: 600 },
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          {offerInfo?.isLender
            ? `OFFER LOAN TO ${offerInfo?.username || ''}`
            : `LOAN OFFER FROM ${offerInfo?.username || ''}`}
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 1 }}>
          {/* STATUS TABLE */}
          <Box sx={{ mb: 2 }}>
            <TableContainer sx={{ borderRadius: 2, maxHeight: 150 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {/* Current User Cell */}
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Avatar
                          className="avatar"
                          src={userInfo?.avatar}
                          rank={userInfo?.totalWagered}
                          user_id={userInfo?._id}
                          username={userInfo?.username}
                          accessory={userInfo?.accessory}
                          alt=""
                          darkMode={isDarkMode}
                        />
                      </Box>
                      {!cancelled && !waiting ? (
                        <Typography variant="body2" color="green">
                          READY!
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="#ccc">
                          WAITING!
                        </Typography>
                      )}
                    </TableCell>

                    {/* Other Party Cell */}
                    <TableCell align="center">
                      {!cancelled || !offerInfo?.isLender ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Avatar
                            className="avatar"
                            src={offerInfo?.avatar}
                            rank={offerInfo?.totalWagered}
                            user_id={offerInfo?._id}
                            accessory={offerInfo?.accessory}
                            username={offerInfo?.username}
                            alt=""
                            darkMode={isDarkMode}
                          />
                        </Box>
                      ) : (
                        // If cancelled by Lender
                        <Box sx={{ display: 'flex' }}>
                          <Avatar
                            className="avatar"
                            src={offerInfo?.avatar}
                            rank={offerInfo?.totalWagered}
                            accessory={offerInfo?.accessory}
                            user_id={offerInfo?._id}
                            username={offerInfo?.username}
                            alt=""
                            darkMode={isDarkMode}
                          />
                          <Box sx={{ ml: 2, textAlign: 'right' }}>
                            <Typography variant="body2" color="error">
                              REJECTED
                            </Typography>
                            <Button size="small" onClick={nudge}>
                              NUDGE
                            </Button>
                          </Box>
                        </Box>
                      )}
                      {!cancelled || !offerInfo?.isLender ? (
                        <Typography variant="body2" color="#ccc">
                          WAITING!
                        </Typography>
                      ) : null}
                    </TableCell>
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>
          </Box>

          {/* If current user is Lender -> show input fields */}
          {offerInfo?.isLender && (
            <Box sx={{ mb: 2 }}>
              <TableContainer>
                <Table sx={{ borderCollapse: 'collapse' }}>
                  <TableBody>
                    {/* Loan Amount */}
                    <TableRow>
                      <TableCell sx={{ px: 2, py: 2, width: '70%' }}>
                        <TextField
                          color="error"
                          variant="filled"
                          label="Loan Amount"
                          fullWidth
                          value={responseText}
                          onChange={handleResponseTextChange}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                SOL
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" width="30%">
                        <Tooltip title="Enter the loan amount in RPS">
                          <InfoIcon sx={{ cursor: 'pointer' }} />
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Warnings */}
                    {exceedsReservesLimit(userInfo.balance, responseText) && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              bgcolor: isDarkMode ? '#2c2c2c' : '#ffe9e9',
                              p: 1,
                              borderRadius: 1,
                              mt: 1,
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faExclamationTriangle}
                              color="#D32F2F"
                            />
                            <Typography variant="body2" color="error">
                              PLEASE ENSURE THE LOAN AMOUNT IS NO MORE THAN 10X
                              YOUR BALANCE
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Loan Period */}
                    <TableRow>
                      <TableCell sx={{ px: 2, py: 2 }}>
                        <TextField
                          color="error"
                          variant="filled"
                          label="Loan Period"
                          fullWidth
                          value={loanPeriodText}
                          onChange={handleLoanPeriodTextChange}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                DAYS
                              </InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Enter the duration in days">
                          <InfoIcon sx={{ cursor: 'pointer' }} />
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Interest Rate */}
                    <TableRow>
                      <TableCell sx={{ px: 2, py: 2 }}>
                        <TextField
                          color="error"
                          variant="filled"
                          label="Interest Rate"
                          fullWidth
                          value={interestRateText}
                          onChange={handleInterestRateTextChange}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">%</InputAdornment>
                            ),
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Enter the yielding interest rate for the loan">
                          <InfoIcon sx={{ cursor: 'pointer' }} />
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Your Balance */}
                    <TableRow>
                      <TableCell>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          YOUR BALANCE:
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography>
                          {convertToCurrency(userInfo.balance, solPrice)}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    {/* New Balance */}
                    <TableRow>
                      <TableCell>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          NEW BALANCE:
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {calculateNewBalance(userInfo.balance, responseText) <
                        0 ? (
                          <>
                            {convertToCurrency(0, solPrice)} AND{' '}
                            {convertToCurrency(
                              Math.abs(
                                calculateNewBalance(
                                  userInfo.balance,
                                  responseText,
                                ),
                              ),
                              solPrice,
                            )}{' '}
                            IN DEBT
                          </>
                        ) : (
                          convertToCurrency(
                            calculateNewBalance(userInfo.balance, responseText),
                            solPrice,
                          )
                        )}
                      </TableCell>
                    </TableRow>

                    {/* GROSS PROFIT */}
                    <TableRow>
                      <TableCell>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          GROSS PROFIT:
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {isNaN(parseFloat(responseText)) ||
                        isNaN(parseFloat(interestRateText)) ||
                        parseFloat(responseText) <= 0 ||
                        parseFloat(interestRateText) <= 0
                          ? convertToCurrency(0, solPrice)
                          : convertToCurrency(
                              calculateInterest(
                                responseText,
                                interestRateText,
                              ) + parseFloat(responseText),
                              solPrice,
                            )}
                      </TableCell>
                    </TableRow>

                    {/* NET PROFIT */}
                    <TableRow>
                      <TableCell>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          NET PROFIT:
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <span id="interest">
                          (+{' '}
                          {convertToCurrency(
                            calculateInterest(responseText, interestRateText),
                            solPrice,
                          )}
                          )
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* LOAN TYPE */}
                    <TableRow>
                      <TableCell>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          LOAN TYPE:
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {determineLoanType(userInfo.balance, responseText)}
                      </TableCell>
                    </TableRow>

                    {/* High Interest Warning */}
                    {parseFloat(interestRateText) > 6 && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography
                            variant="body1"
                            sx={{
                              color: 'red',
                              fontWeight: 'bold',
                              textAlign: 'center',
                            }}
                          >
                            Charging an interest rate above 6% may be considered
                            usury and could increase the risk of borrower
                            default. We recommend setting a rate below 6% to
                            mitigate this risk.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* DISPLAY “Loan Amount, Days Left, Payback” */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">
                    Loan Amount <FontAwesomeIcon icon={faDollarSign} />
                  </TableCell>
                  <TableCell align="center">
                    Days Left <FontAwesomeIcon icon={faCalendarAlt} />
                  </TableCell>
                  <TableCell align="center">
                    Payback Amount <FontAwesomeIcon icon={faMoneyBillWave} />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell align="center">
                    {cancelled || waiting
                      ? 'waiting'
                      : convertToCurrency(parseFloat(responseText), solPrice)}
                  </TableCell>
                  <TableCell align="center">
                    {cancelled || waiting
                      ? 'waiting'
                      : `${loanPeriodText} days`}
                  </TableCell>
                  <TableCell align="center">
                    {cancelled || waiting ? (
                      'waiting'
                    ) : (
                      <>
                        {convertToCurrency(
                          parseFloat(responseText) *
                            (1 + parseFloat(interestRateText) / 100) || 0,
                          solPrice,
                        )}{' '}
                        <span>
                          (
                          {isNaN(parseFloat(interestRateText))
                            ? '0.00'
                            : parseFloat(interestRateText).toFixed(2)}
                          %)
                        </span>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Terms & Conditions */}
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            By clicking 'ACCEPT OR OFFER', you agree to the following{' '}
            <Box
              component="span"
              sx={{
                color: '#D32F2F',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onClick={toggleExpand}
            >
              terms and conditions
            </Box>
            :
          </Typography>

          {expanded && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: isDarkMode ? '#607D8B' : '#ccc',
                p: 2,
                borderRadius: 1,
                mb: 1,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              <ol style={{ paddingLeft: '20px' }}>
                <li>
                  The loan amount is{' '}
                  <Box component="span" sx={{ color: '#D32F2F' }}>
                    [{convertToCurrency(parseFloat(responseText), solPrice)}]
                  </Box>
                  .
                </li>
                <li>
                  The loan period is{' '}
                  <Box component="span" sx={{ color: '#D32F2F' }}>
                    [{loanPeriodText}]
                  </Box>{' '}
                  days.
                </li>
                <li>
                  You are responsible for repaying the loan within the specified
                  period.
                </li>
                <li>
                  Interest may be applicable as per the agreed Interest Rate:{' '}
                  <Box component="span" sx={{ color: '#D32F2F' }}>
                    [{parseFloat(interestRateText).toFixed(2)}%]
                  </Box>
                  .
                </li>
                <li>
                  Failure to repay on time may result in user credit penalties.
                </li>
                <li>
                  Any outstanding balance after the loan period may be
                  automatically deducted from your in-game balance.
                </li>
                <li>
                  Review and understand the loan terms provided by the lender.
                </li>
                <li>
                  Clicking 'ACCEPT' indicates your agreement to these terms.
                </li>
                <li>
                  No legal action in the case of non-repayment can be taken on
                  unsettled debts; all loans are final and strictly
                  peer-to-peer.
                </li>
                <li>
                  Ensure that you have sufficient resources to pay back the loan
                  amount.
                </li>
                <li>This agreement is binding and enforceable.</li>
                <li>
                  Withdrawals & Tipping to be suspended for the loaner while in
                  debt.
                </li>
                <li>All loans are final.</li>
                <li>
                  You are required to maintain personal hygiene frequently.
                </li>
              </ol>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
          {offerInfo?.isLender ? (
            <>
              {/* “OFFER” button */}
              <Button
                variant="contained"
                color="success"
                disabled={!waiting && !cancelled}
                onClick={waiting && cancelled ? nudge : onBtnOkClicked}
              >
                {waiting ? (cancelled ? 'NUDGE' : 'OFFER') : 'WAITING'}
                &nbsp;
                {!waiting && !cancelled && (
                  <CircularProgress color="error" size={15} sx={{ ml: 1 }} />
                )}
              </Button>
              {/* “Cancel” button */}
              <Button
                variant="contained"
                color="error"
                onClick={onBtnCancelClicked}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              {/* “ACCEPT” button for borrower */}
              <Button
                variant="contained"
                color="success"
                disabled={waiting}
                onClick={createAndLendHandler}
              >
                {!waiting ? 'ACCEPT' : 'WAITING'}
                {waiting && (
                  <CircularProgress color="error" size={15} sx={{ ml: 1 }} />
                )}
              </Button>
              {/* “Reject” button */}
              <Button
                variant="contained"
                color="error"
                onClick={onBtnCancelClicked}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default OfferLoanModal;
