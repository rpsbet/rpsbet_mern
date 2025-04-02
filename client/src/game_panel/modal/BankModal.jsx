import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Modal,
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
} from '@mui/material';
import { Help, AttachMoney } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faAdjust, faInfo } from '@fortawesome/free-solid-svg-icons';

import BankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/BankPage';
import MyLoansModal from '../modal/MyLoansModal';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

const BankModal = ({ modalIsOpen, closeModal, remainingLoans }) => {
  // Access Redux state via hooks
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);

  // Local state
  const [showMyLoansModal, setShowMyLoansModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [invertFilter, setInvertFilter] = useState(false);

  const handleToggleHelp = () => setShowHelp((prev) => !prev);
  const handleToggleInvert = () => setInvertFilter((prev) => !prev);
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      {/* MAIN BANK MODAL */}
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
            bgcolor: isDarkMode ? '#2D3A4B' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            width: '80vw',
            maxWidth: 600,
            maxHeight: '80vh',
            overflowY: 'auto',
            borderRadius: 1,
            p: 3,
            boxShadow: 24,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FontAwesomeIcon icon={faCoins} />
              CENTRAL BANK
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

          {/* Body */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h5">PRIVATE LENDERS</Typography>
              <IconButton onClick={handleToggleHelp}>
                <Help sx={{ color: '#fff' }} />
              </IconButton>
            </Box>

            <BankPage itemType="loanType" sortCriteria="sortCriteria" />
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="error"
              onClick={() => setShowMyLoansModal(true)}
              fullWidth
              startIcon={<AttachMoney />}
            >
              Manage Your Loans
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* MY LOANS MODAL */}
      {showMyLoansModal && (
        <MyLoansModal
          modalIsOpen={showMyLoansModal}
          closeModal={() => setShowMyLoansModal(false)}
          remainingLoans={remainingLoans}
        />
      )}

      {/* HELP POPUP AS A SECOND MUI MODAL */}
      <Dialog
        open={showHelp}
        onClose={handleToggleHelp}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2D3A4B',
            color: '#fff',
            borderRadius: 2,
            boxShadow: 24,
          },
        }}
      >
        <DialogContent sx={{ p: 4 }}>
          {/* Header Row */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, flex: 1, mr: -4 }}
            >
              <FontAwesomeIcon icon={faInfo} />
              &nbsp; LOAN INFORMATION
            </Typography>
            <Button
              variant="text"
              color="error"
              onClick={handleToggleHelp}
              sx={{ fontSize: '1.5rem', minWidth: 'auto' }}
            >
              &times;
            </Button>
          </Box>

          {/* Loan Info Content */}
          <Box>
            {/* Image with invert toggle */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src="../img/loans.svg"
                  alt="Loans"
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #aaa9',
                    filter: invertFilter ? 'invert(1)' : 'none',
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
                <IconButton
                  onClick={handleToggleInvert}
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'rgba(0, 0, 0, 0.4)',
                    color: '#fff',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.6)' },
                  }}
                >
                  <FontAwesomeIcon icon={faAdjust} />
                </IconButton>
              </Box>
            </Box>

            {/* Central Bank Overview */}
            <Typography
              className="title"
              variant="h5"
              align="center"
              sx={{ fontWeight: 600, mb: 2 }}
            >
              Central Bank Overview
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6 }}>
              The central bank is funded by private lenders, also known as Peer-to-Peer (P2P) lending.
              P2P lending connects borrowers directly with investors.
            </Typography>

            {/* Steps to get started (Loaner) */}
            <Typography
              variant="subtitle1"
              sx={{ fontSize: 18, fontWeight: 600, color: '#16e100', mb: 1 }}
            >
              Steps to get started with P2P lending:
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ fontSize: 16, fontWeight: 600, mb: 1 }}
            >
              (As Loaner)
            </Typography>
            <Box component="ol" sx={{ pl: 3, mb: 3 }}>
              <li>Go to "Manage Your Loans"</li>
              <li>Click "Create New Loan"</li>
              <li>
                Set "Loan Type" (coming soon). Secured Loans guarantee repayments (e.g., via collateral).
                Unsecured Loans do not.
              </li>
              <li>Set an Interest Rate (APY), typically around 10%~30%</li>
              <li>
                Earn returns as borrowers repay their loans, including principal and interest.
              </li>
            </Box>

            {/* Steps to get started (Lender) */}
            <Typography
              variant="subtitle2"
              sx={{ fontSize: 16, fontWeight: 600, mb: 1 }}
            >
              (As Lender)
            </Typography>
            <Box component="ol" sx={{ pl: 3, mb: 4 }}>
              <li>Browse available loan listings by peers.</li>
              <li>
                Click "Loan" and <em>Check Eligibility</em>
              </li>
              <li>
                Make sure the criteria fits your circumstances (loan period, APY, etc.).
              </li>
              <li>Enter the amount you want to loan and accept the debt.</li>
              <li>
                Repay the loan by going to your wallet and clicking the red button that shows your remaining debt.
              </li>
              <li>
                Credit score may increase / decrease upon repayment or failure.
              </li>
            </Box>

            {/* Definitions */}
            <Typography
              className="title"
              variant="h5"
              align="center"
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Definitions
            </Typography>

            {/* Fractional Reserve Banking */}
            <Typography
              variant="h6"
              sx={{ color: '#16e100', fontWeight: 600, mb: 1 }}
            >
              Fractional Reserve Banking
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
              A system in which only a fraction of bank deposits are backed by actual cash on hand
              and available for withdrawal. The remainder is lent out to borrowers.
            </Typography>

            {/* Full Reserve Banking */}
            <Typography
              variant="h6"
              sx={{ color: '#16e100', fontWeight: 600, mb: 1 }}
            >
              Full Reserve Banking
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
              A banking system in which banks are required to keep the full amount of depositors&apos; funds in reserve,
              meaning they do not lend any of it out.
            </Typography>

            {/* Usury */}
            <Typography
              variant="h6"
              sx={{ color: '#16e100', fontWeight: 600, mb: 1 }}
            >
              Usury
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.6 }}>
              The practice of charging excessive or unreasonably high interest rates on loans,
              often above the legally permitted rate.
            </Typography>
          </Box>

          {/* Footer Button */}
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              color="error"
              onClick={handleToggleHelp}
              sx={{ px: 4, py: 1.2 }}
            >
              OK, GOT IT!
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
};

export default BankModal;