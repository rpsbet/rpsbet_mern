import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePrivy } from '@privy-io/react-auth';
import { ButtonBase, Typography, Box, Tooltip, CircularProgress, Skeleton } from '@mui/material';
import { AccountBalanceWallet, Refresh, Error } from '@mui/icons-material';
import { getPrivyWalletBalance } from '../redux/Auth/user.actions';

// Updated selector to use live wallet balance
const selectUserData = (state) => {
  if (!state?.auth) {
    return {
      liveWalletBalance: 0,
      walletAddress: null,
      backendBalance: 0,
      isWalletBalanceLoading: false,
      walletBalanceError: null,
      user: null,
      isAuthenticated: false,
    };
  }
  
  return {
    liveWalletBalance: state.auth.liveWalletBalance ?? 0,
    walletAddress: state.auth.walletAddress,
    backendBalance: state.auth.user?.balance ?? 0,
    isWalletBalanceLoading: state.auth.isWalletBalanceLoading ?? false,
    walletBalanceError: state.auth.walletBalanceError,
    user: state.auth.user,
    isAuthenticated: state.auth.isAuthenticated ?? false,
  };
};

const selectSolPrice = (state) => state?.logic?.solPrice ?? 0;

const WalletBalanceDisplay = ({ onBalanceClick, isHovered, setIsHovered }) => {
  const dispatch = useDispatch();
  const { user: privyUser, authenticated, ready } = usePrivy();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const userData = useSelector(selectUserData);
  const solPrice = useSelector(selectSolPrice);
  
  const { 
    liveWalletBalance, 
    walletAddress, 
    backendBalance, 
    isWalletBalanceLoading,
    walletBalanceError,
    user,
    isAuthenticated
  } = userData;

  // Always prefer live wallet balance if available, otherwise fall back to backend balance
  const displayBalance = (walletAddress && privyUser?.wallet?.address) ? liveWalletBalance : backendBalance;
  const isWalletBalance = Boolean(walletAddress && privyUser?.wallet?.address);

  const refreshBalance = useCallback(async (e) => {
    e.stopPropagation();
    if (!privyUser?.wallet?.address || isRefreshing || isWalletBalanceLoading) return;
    
    setIsRefreshing(true);
    try {
      const result = await dispatch(getPrivyWalletBalance(privyUser));
      if (!result.success) {
        console.error('Failed to refresh balance:', result.error);
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, privyUser, isRefreshing, isWalletBalanceLoading]);

  // Auto-refresh balance every 30 seconds if wallet is connected
  // useEffect(() => {
  //   if (!privyUser?.wallet?.address || !authenticated) return;
    
  //   const interval = setInterval(() => {
  //     if (!isRefreshing && !isWalletBalanceLoading) {
  //       dispatch(getPrivyWalletBalance(privyUser));
  //     }
  //   }, 30000);
    
  //   return () => clearInterval(interval);
  // }, [dispatch, privyUser?.wallet?.address, isRefreshing, isWalletBalanceLoading, authenticated]);

  // Initial balance fetch when component mounts and user has wallet
  useEffect(() => {
    if (privyUser?.wallet?.address && authenticated && !isWalletBalanceLoading && liveWalletBalance === 0) {
      dispatch(getPrivyWalletBalance(privyUser));
    }
  }, [dispatch, privyUser?.wallet?.address, authenticated, isWalletBalanceLoading, liveWalletBalance]);

  const balanceDisplay = useMemo(() => {
    if (!displayBalance) return 0;
    const balanceString = displayBalance.toString();
    const decimalIndex = balanceString.indexOf('.');
    return decimalIndex !== -1 ? Math.min(4, balanceString.length - decimalIndex - 1) : 0;
  }, [displayBalance]);

  const hasError = walletBalanceError && isWalletBalance;

  // Show loading skeleton if Privy isn't ready or user data is loading
  if (!ready || (authenticated && !user)) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton 
          variant="rectangular" 
          width={100} 
          height={32} 
          sx={{ 
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)' 
          }} 
        />
      </Box>
    );
  }

  // Don't render if not authenticated
  if (!authenticated || !user) {
    return null;
  }

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2">
            {`${((displayBalance * solPrice) || 0).toFixed(2)} USD`}
          </Typography>
          {isWalletBalance && (
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {hasError ? 'Balance fetch failed' : 'Live wallet balance'}
            </Typography>
          )}
          {!isWalletBalance && (
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Backend balance (no wallet connected)
            </Typography>
          )}
          {hasError && (
            <Typography variant="caption" sx={{ opacity: 0.6, color: '#ff6b6b' }}>
              {walletBalanceError}
            </Typography>
          )}
        </Box>
      }
      arrow
      placement="top"
    >
      <ButtonBase
        onClick={onBalanceClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          position: 'relative',
          padding: '6px 12px',
          borderRadius: '12px',
          background: 'transparent',
          backdropFilter: 'blur(15px)',
          border: `1px solid ${
            hasError 
              ? 'rgba(255, 107, 107, 0.3)' 
              : isWalletBalance 
                ? 'rgba(0, 255, 0, 0.3)' 
                : 'rgba(255, 0, 21, 0.2)'
          }`,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            transform: 'scale(1.05)',
            borderColor: hasError 
              ? 'rgba(255, 107, 107, 0.5)'
              : isWalletBalance 
                ? 'rgba(0, 255, 0, 0.5)' 
                : 'rgba(255, 0, 21, 0.4)',
            boxShadow: `0 4px 20px ${
              hasError 
                ? 'rgba(255, 107, 107, 0.3)'
                : isWalletBalance 
                  ? 'rgba(0, 255, 0, 0.3)' 
                  : 'rgba(255, 0, 21, 0.3)'
            }`,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <AccountBalanceWallet
            sx={{
              width: '14px',
              height: '14px',
              color: hasError ? '#ff6b6b' : isWalletBalance ? '#00ff00' : '#ff0000',
              transition: 'transform 0.2s ease',
              transform: isHovered ? 'rotate(10deg)' : 'rotate(0deg)',
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#e1e5e9',
              fontSize: '0.8rem',
              transition: 'color 0.2s ease',
            }}
          >
            {isHovered
              ? `${((displayBalance * solPrice) || 0).toFixed(2)}`
              : displayBalance.toFixed(balanceDisplay)
            }
          </Typography>
          
          {isWalletBalance && (
            <Box
              component="div"
              onClick={refreshBalance}
              sx={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: (isRefreshing || isWalletBalanceLoading) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                ml: 0.5,
                p: 0,
                opacity: (isRefreshing || isWalletBalanceLoading) ? 0.5 : 1,
                '&:hover': { opacity: 0.7 }
              }}
            >
              {(isRefreshing || isWalletBalanceLoading) ? (
                <CircularProgress
                  size={12}
                  sx={{ color: '#00ff00' }}
                />
              ) : hasError ? (
                <Error
                  sx={{
                    width: '12px',
                    height: '12px',
                    color: '#ff6b6b',
                  }}
                />
              ) : (
                <Refresh
                  sx={{
                    width: '12px',
                    height: '12px',
                    color: '#00ff00',
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      </ButtonBase>
    </Tooltip>
  );
};

export default WalletBalanceDisplay;