import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useLogin, usePrivy } from '@privy-io/react-auth';
import { Button, CircularProgress, Box, Typography, keyframes } from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';

import {
  authenticateWithPrivy,
  getPrivyWalletBalance,
} from '../../redux/Auth/user.actions';
import {
  getMyChat,
  getNotifications,
} from '../../redux/Logic/logic.actions';

// Pulse animation for the connecting state
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
`;

// Shimmer effect for the button
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

function PrivyLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const authenticationInProgress = useRef(false);

  const { login } = useLogin();
  const { user, ready, authenticated } = usePrivy();

  const onSuccessfulLogin = useCallback(async (privyUser) => {
    // Prevent duplicate calls
    if (authenticationInProgress.current || isLoading) {
      return;
    }

    authenticationInProgress.current = true;
    setIsLoading(true);
    
    try {
      // Authenticate with backend first
      const authResult = await dispatch(authenticateWithPrivy(privyUser));
      
      if (authResult.status === 'success') {
        // Load user-related data in parallel
        const dataPromises = [
          dispatch(getNotifications()),
          dispatch(getMyChat())
        ];
        
        // Get live wallet balance from Privy if wallet exists
        if (privyUser.wallet?.address) {
          dataPromises.push(dispatch(getPrivyWalletBalance(privyUser)));
        }
        
        await Promise.all(dataPromises);
      } else {
        console.error('Authentication failed:', authResult);
      }
    } catch (error) {
      console.error('Error during login process:', error);
    } finally {
      setIsLoading(false);
      authenticationInProgress.current = false;
    }
  }, [dispatch, navigate, isLoading]);

  // Trigger authentication when conditions are met
  useEffect(() => {
    if (
      authenticated && 
      user && 
      user.id && 
      !isLoading && 
      !authenticationInProgress.current
    ) {
      onSuccessfulLogin(user);
    }
  }, [authenticated, user?.id, onSuccessfulLogin, isLoading]);

  // Reset state when user logs out
  useEffect(() => {
    if (!authenticated) {
      authenticationInProgress.current = false;
      setIsLoading(false);
    }
  }, [authenticated]);

  const handleLogin = useCallback(() => {
    if (!ready || isLoading || authenticationInProgress.current) {
      return;
    }
    
    login();
  }, [login, ready, isLoading]);

  const isDisabled = !ready || isLoading || authenticationInProgress.current;

  return (
    <Button
      variant="contained"
      fullWidth
      onClick={handleLogin}
      disabled={isDisabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        py: 0.75,
        px: 2,
        minHeight: '36px',
        borderRadius: '12px',
        background: isLoading 
          ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.8) 0%, rgba(255, 0, 21, 0.8) 100%)'
          : 'linear-gradient(135deg, #ff6b6b 0%, #ff0015 100%)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isLoading 
          ? '0 4px 20px rgba(255, 107, 107, 0.3)'
          : '0 4px 20px rgba(255, 0, 21, 0.25)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          transform: isDisabled ? 'none' : 'translateY(-1px)',
          boxShadow: isDisabled 
            ? '0 4px 20px rgba(255, 107, 107, 0.3)'
            : '0 6px 25px rgba(255, 0, 21, 0.4)',
          background: isDisabled 
            ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.8) 0%, rgba(255, 0, 21, 0.8) 100%)'
            : 'linear-gradient(135deg, #ff7b7b 0%, #ff1525 100%)',
        },
        '&:active': {
          transform: isDisabled ? 'none' : 'translateY(0px)',
        },
        '&:disabled': {
          background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.6) 0%, rgba(255, 0, 21, 0.6) 100%)',
          cursor: 'not-allowed',
        },
        // Shimmer effect on hover
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isHovered && !isDisabled
            ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)'
            : 'none',
          animation: isHovered && !isDisabled ? `${shimmer} 1.5s infinite` : 'none',
          zIndex: 1,
        },
        // Pulse animation when loading
        animation: isLoading ? `${pulse} 1.8s infinite` : 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {isLoading ? (
          <>
            <CircularProgress 
              size={16} 
              sx={{ color: 'white' }} 
            />
            <Typography
              variant="button"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                color: 'white',
                letterSpacing: '0.3px',
              }}
            >
              CONNECTING...
            </Typography>
          </>
        ) : (
          <>
            <AccountBalanceWallet
              sx={{
                width: '16px',
                height: '16px',
                color: 'white',
                transition: 'transform 0.2s ease',
                transform: isHovered ? 'rotate(8deg)' : 'rotate(0deg)',
              }}
            />
            <Typography
              variant="button"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                color: 'white',
                letterSpacing: '0.3px',
              }}
            >
              CONNECT
            </Typography>
          </>
        )}
      </Box>
    </Button>
  );
}

export default PrivyLogin;