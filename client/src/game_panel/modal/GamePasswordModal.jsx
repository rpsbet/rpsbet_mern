import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  closeGamePasswordModal,
  errorMsgBar,
  setPasswordCorrect,
} from '../../redux/Notification/notification.actions';
import { checkGamePassword } from '../../redux/Logic/logic.actions';
import { Button, TextField, Box, Modal } from '@mui/material';
import { getCustomTheme } from '../../config/theme';
import { ThemeProvider } from '@mui/material/styles';

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    background: 'transparent',
    border: 'none',
  },
};

function GamePasswordModal() {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const isOpen = useSelector((state) => state.snackbar.showGamePasswordModal);
  const roomId = useSelector((state) => state.logic.curRoomInfo._id);

  const [password, setPassword] = useState('');
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  const handleOkClick = useCallback(async () => {
    const response = await dispatch(checkGamePassword({ room_id: roomId, password }));
    if (response === true) {
      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      rooms[roomId] = true;
      localStorage.setItem('rooms', JSON.stringify(rooms));

      dispatch(closeGamePasswordModal());
      dispatch(setPasswordCorrect(true));
    } else {
      dispatch(errorMsgBar('WRONG F*CKING PUSSWORD!'));
    }
  }, [dispatch, roomId, password]);

  const handleCancelClick = useCallback(() => {
    dispatch(closeGamePasswordModal());
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <Modal open={isOpen || false} style={customStyles} contentLabel="Password">
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className="modal-icon result-icon-password" />
            <h5>PASSWORD REQUIRED</h5>
            <TextField
              color="error"
              id="game_password"
              variant="filled"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              style={{ marginBottom: '15px' }}
            />
          </div>
          <Box className="modal-footer">
            <Button variant="contained" color="error" onClick={handleOkClick}>
              Continue Bet
            </Button>
            <Button variant="contained" color="error" onClick={handleCancelClick}>
              Cancel
            </Button>
          </Box>
        </div>
      </Modal>
    </ThemeProvider>
  );
}

export default GamePasswordModal;