import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  Modal,
  Box,
  Button,
  Typography,
  IconButton
} from '@mui/material';
import { Help, AttachMoney } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faAdjust } from '@fortawesome/free-solid-svg-icons';

import BankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/BankPage';
import MyLoansModal from '../modal/MyLoansModal';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';

function BankModal({ modalIsOpen, closeModal, isDarkMode, remainingLoans }) {
  const [showMyLoansModal, setShowMyLoansModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [invertFilter, setInvertFilter] = useState(false);

  const handleToggleHelp = () => setShowHelp((prev) => !prev);
  const handleToggleInvert = () => setInvertFilter((prev) => !prev);

  return (
    <>
      {/* MAIN BANK MODAL */}
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
            bgcolor: isDarkMode ? '#1f1a25' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            width: '80vw',
            maxWidth: 600,
            maxHeight: '80vh',
            overflowY: 'auto',
            borderRadius: 1,
            p: 3,
            boxShadow: 24
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}
          >
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FontAwesomeIcon icon={faCoins} />
              CENTRAL BANK
            </Typography>
            <Button variant="text" color="error" onClick={closeModal} sx={{ fontSize: '1.25rem' }}>
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
                mb: 2
              }}
            >
              <Typography variant="h5">PRIVATE LENDERS</Typography>
              <IconButton onClick={handleToggleHelp}>
                <Help />
              </IconButton>
            </Box>

            <BankPage itemType="loanType" sortCriteria="sortCriteria" />
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color='error'
              onClick={() => setShowMyLoansModal(true)}
              startIcon={<AttachMoney />}
            >
              Manage Your Loans
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* MY LOANS MODAL (still using your existing MyLoansModal) */}
      {showMyLoansModal && (
        <MyLoansModal
          modalIsOpen={showMyLoansModal}
          closeModal={() => setShowMyLoansModal(false)}
          remainingLoans={remainingLoans}
        />
      )}

      {/* HELP POPUP AS A SECOND MUI MODAL */}
      <Modal
        open={showHelp}
        onClose={handleToggleHelp}
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
            maxWidth: 600,
            maxHeight: '80vh',
            overflowY: 'auto',
            borderRadius: 1,
            p: 3,
            boxShadow: 24
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ textAlign: 'center', width: '100%' }}>
              Loan Information
            </Typography>
            <Button variant="text" color="error" onClick={handleToggleHelp} sx={{ fontSize: '1.25rem' }}>
              ×
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <img
                src="../img/loans.svg"
                alt="Loans"
                style={{
                  borderRadius: 1,
                  filter: invertFilter ? 'invert(1)' : 'none'
                }}
              />
              <IconButton
                sx={{ position: 'absolute', bottom: 8, right: 8 }}
                onClick={handleToggleInvert}
              >
                <FontAwesomeIcon icon={faAdjust} />
              </IconButton>
            </Box>
          </Box>

          <Typography variant="h5" align="center" sx={{ mb: 2 }}>
            Central Bank Overview
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The central bank is funded by private lenders, A.K.A Peer-to-peer (P2P) lending.
            P2P lending connects borrowers directly with investors.
          </Typography>

          <Typography variant="h5" align="center" sx={{ mt: 2, mb: 1 }}>
            Definitions
          </Typography>
          <Typography variant="h6" sx={{ color: '#16e100', mb: 1 }}>
            Fractional Reserve Banking
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Fractional Reserve Banking is a system in which only a fraction of bank deposits are
            backed by actual cash on hand and available for withdrawal. The remainder is lent out
            to borrowers.
          </Typography>

          <Box sx={{ textAlign: 'center' }}>
            <Button variant="contained" color='error' onClick={handleToggleHelp}>
              OK, GOT IT!
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
});

const mapDispatchToProps = {
  warningMsgBar,
  infoMsgBar,
};

export default connect(mapStateToProps, mapDispatchToProps)(BankModal);