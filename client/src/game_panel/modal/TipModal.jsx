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
            bgcolor: isDarkMode ? '#1c1c1c' : '#fff',
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
                background: '#080808',
                borderRadius: '0.3em',
                p: '20px',
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
              <Button color="error" variant="contained" onClick={handleSendTip}>
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
