import React, { useState, useCallback } from 'react';
import Modal from 'react-modal';
import { connect, useDispatch } from 'react-redux';
import {
  setPasswordCorrect,
  closeGamePasswordModal,
  errorMsgBar
} from '../../redux/Notification/notification.actions';
import { checkGamePassword } from '../../redux/Logic/logic.actions';
import { Button, TextField } from '@mui/material';

Modal.setAppElement('#root');

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

function GamePasswordModal(props) {
  const {
    isDarkMode,
    isOpen,
    closeGamePasswordModal,
    checkGamePassword,
    setPasswordCorrect,
    roomId,
  } = props;

  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleOkClick = useCallback(async () => {
    const response = await checkGamePassword({ room_id: roomId, password });
    if (response === true) {
      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      rooms[roomId] = true;
      localStorage.setItem('rooms', JSON.stringify(rooms));

      closeGamePasswordModal();
      setPasswordCorrect(true);
    } else {
      dispatch(errorMsgBar(`WRONG F*CKING PUSSWORD!`));
    }
  }, [checkGamePassword, roomId, password, closeGamePasswordModal, setPasswordCorrect, isDarkMode]);

  const handleCancelClick = useCallback(() => {
    closeGamePasswordModal();
  }, [closeGamePasswordModal]);

  return (
    <Modal isOpen={isOpen} style={customStyles} contentLabel="Password">
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-body alert-body password-modal-body">
          <div className={`modal-icon result-icon-password`} />
          <h5>PASSWORD REQUIRED</h5>
           <TextField color='error' 
            id="game_password"
            variant="filled"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            style={{ marginBottom: '15px' }}
          />
          <Button variant='contained' color='error' onClick={handleOkClick}>
            Continue Bet
          </Button>
          <Button variant='contained' color='error' onClick={handleCancelClick}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  isOpen: state.snackbar.showGamePasswordModal,
  roomId: state.logic.curRoomInfo._id,
});

const mapDispatchToProps = {
  closeGamePasswordModal,
  checkGamePassword,
  setPasswordCorrect,
};

export default connect(mapStateToProps, mapDispatchToProps)(GamePasswordModal);