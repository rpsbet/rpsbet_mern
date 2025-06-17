import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useLogin, usePrivy } from '@privy-io/react-auth';
import { Button, CircularProgress } from '@mui/material';

import {
  authenticateWithPrivy,
  getPrivyWalletBalance, // Updated import
} from '../../redux/Auth/user.actions';
import {
  getMyChat,
  getNotifications,
} from '../../redux/Logic/logic.actions';

function PrivyLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <Button
      variant="contained"
      fullWidth
      onClick={handleLogin}
      disabled={!ready || isLoading || authenticationInProgress.current}
      color="error"
      sx={{ 
        py: 1.2, 
        borderRadius: 1.5,
        position: 'relative'
      }}
    >
      {isLoading ? (
        <>
          <CircularProgress 
            size={20} 
            sx={{ 
              color: 'white',
              position: 'absolute',
              left: '50%',
              marginLeft: '-10px'
            }} 
          />
          <span style={{ opacity: 0.7 }}>CONNECTING...</span>
        </>
      ) : (
        'CONNECT'
      )}
    </Button>
  );
}

export default PrivyLogin;