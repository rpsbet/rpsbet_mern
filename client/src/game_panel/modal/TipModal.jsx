// TipModal.jsx
import React from 'react';
import {
  Modal,
  Box,
  Button,
  TextField,
  Typography,
  ThemeProvider,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { Warning as WarningIcon } from '@mui/icons-material';
import { convertToCurrency } from '../../util/conversion'; // Adjust path if needed

export default function TipModal({
  isTipModalOpen,
  handleCloseTipModal,
  isDarkMode,
  theme,
  closeModal,
  handleTipAmountChange,
  tipAmount,
  handleMessageChange,
  message,
  balance,
  solPrice,
  handleSendTip,
}) {
  return (
    <Modal open={isTipModalOpen || false} onClose={handleCloseTipModal}>
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff', // Preserve text color conditional
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
          {/* Header */}
          <Box>
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
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <FontAwesomeIcon
                  icon={faMoneyBill}
                  style={{ marginRight: 8 }}
                />
                ENTER TIP AMOUNT
              </Typography>
              <Button color="error" onClick={closeModal}>
                ×
              </Button>
            </Box>

            {/* Body */}
            <Box
              sx={{
                mb: 2,
              }}
            >
              <TextField
                color="error"
                label="Amount"
                value={tipAmount || 0}
                type="number"
                onChange={handleTipAmountChange}
                variant="filled"
                autoComplete="off"
                inputProps={{ pattern: '^\\d*\\.?\\d*$' }}
                sx={{ width: '100%', mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <Box component="span" sx={{ ml: 1 }}>
                      SOL
                    </Box>
                  ),
                }}
              />

              {/* Balance Table */}
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>IN-GAME BALANCE:</TableCell>
                    <TableCell>
                      {convertToCurrency(balance, solPrice)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>TIP AMOUNT:</TableCell>
                    <TableCell style={{ color: 'red' }}>
                      {convertToCurrency((+tipAmount || 0) * -1, solPrice)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>NEW BALANCE:</TableCell>
                    <TableCell>
                      {convertToCurrency(
                        balance - (parseFloat(tipAmount) || 0),
                        solPrice,
                      )}
                      &nbsp;
                      {balance - (parseFloat(tipAmount) || 0) < 0 && (
                        <WarningIcon sx={{ fontSize: 16 }} />
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Optional message */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Add Message?
                </Typography>
                <TextField
                  color="error"
                  label="Message"
                  value={message}
                  onChange={handleMessageChange}
                  variant="filled"
                  autoComplete="off"
                  inputProps={{ maxLength: 8 }}
                  sx={{ width: '100%' }}
                />
              </Box>
            </Box>

            {/* Footer Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button color="error" variant="outlined" onClick={handleSendTip}>
                Send Tip
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={handleCloseTipModal}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </Modal>
  );
}
