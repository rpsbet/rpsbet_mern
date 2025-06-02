import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useLogin, usePrivy } from '@privy-io/react-auth';
import { 
    Button, 
  } from '@mui/material';

import {
    setFocused,
    userSignIn,
    getUser,
    authenticateWithGoogle,
    authenticateWithPhantom,
    authenticateWithPrivy,
  } from '../../redux/Auth/user.actions';
import {
    getMyHistory,
    getMyChat,
    getNotifications,
  } from '../../redux/Logic/logic.actions';
function PrivyLogin() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { login } = useLogin();
    const { user, ready, authenticated, logout } = usePrivy();
    useEffect(() => {
        if (authenticated && user) {
          onSuccessfulLogin(user);
        }
      }, [authenticated, user]);

      const onSuccessfulLogin = (user) => {
        dispatch(authenticateWithPrivy(user));

        // Load user-related data
        Promise.all([
          dispatch(getNotifications()),
          dispatch(getMyHistory()),
          dispatch(getMyChat())
        ]).then(() => {
          setTimeout(() => {
            navigate('/'); 
          }, 1000);
        });
      };
    return (
        <Button
            variant="contained"
            fullWidth
            onClick={() => login()}
            disabled={!ready }
            color="error"
            sx={{ py: 1.2, borderRadius: 1.5 }}
            >
            CONNECT
        </Button>
    )
}

export default PrivyLogin;
