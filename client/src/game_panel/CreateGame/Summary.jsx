import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Chip,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/CircleRounded';
import {
  disconnectWalletAddress,
  authenticateWithPhantom,
} from '../../redux/Auth/user.actions';

const Summary = ({ shortVersion }) => {
  const dispatch = useDispatch();
  const connectedAccount = useSelector((state) => state.auth.connectedAccount);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) || shortVersion;

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 9)}...${address.substring(address.length - 9)}`;
  };

  // When no account is connected, attempt to connect via Phantom.
  const handleChipClick = async () => {
    if (!connectedAccount) {
      try {
        if (!window.solana || !window.solana.isPhantom) {
          console.error('Phantom wallet not found');
          return;
        }
        // Attempt to connect with Phantom
        await window.solana.connect();
        const walletAddress = window.solana.publicKey.toString();

        // Dispatch Redux action to authenticate with Phantom
        const result = await dispatch(
          authenticateWithPhantom({ walletAddress }),
        );
        if (result.status === 'success') {
          console.log('Phantom login successful');
        } else {
          console.error('Phantom login failed:', result.error);
        }
      } catch (error) {
        console.error('Error connecting Phantom wallet:', error);
      }
    }
  };

  // When an account is connected, clicking the delete icon disconnects it.
  const handleDelete = () => {
    if (connectedAccount) {
      dispatch(disconnectWalletAddress());
    }
  };

  // Use a shortened address on mobile.
  const chipLabel = connectedAccount
    ? isMobile
      ? formatAddress(connectedAccount)
      : connectedAccount
    : 'CONNECT ACCOUNT';

  // Show a green circle if connected; red if not.
  const indicatorColor = connectedAccount ? '#00ff3a' : '#ff0000';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        color: 'white', // sets text color for children
        textAlign: 'center',
        mt: isMobile ? 0 : 2,
      }}
    >
      <Tooltip title="Tokens will be distributed to this address when bonded">
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <img width="20" style={{marginRight: '5px', filter: 'grayscale(1)'}} src='https://cdn.prod.website-files.com/6410de4b1ee56e7333393b23/66d87fb4733b331acc81216e_Phantom-Icon_Transparent_Purple.png' />
          <Chip
            label={chipLabel}
            onClick={handleChipClick}
            {...(connectedAccount ? { onDelete: handleDelete } : {})}
            clickable
            sx={{
              '& .MuiChip-deleteIcon': {
                color: 'inherit',
                transition: 'color 0.3s',
              },
              textTransform: 'unset',
              color: 'white',
              borderColor: 'white',
              '&:hover .MuiChip-deleteIcon': {
                color: 'rgba(255,255,255,0.7)', // a variation on white for the icon on hover
              },
            }}
          />
          <FiberManualRecordIcon
            sx={{ ml: 0.5, color: indicatorColor, fontSize: 20 }}
          />
        </span>
      </Tooltip>
    </Box>
  );
};

export default Summary;
