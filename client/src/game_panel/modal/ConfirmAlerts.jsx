import React from 'react';
import { confirmAlert } from 'react-confirm-alert';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Button, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CloseIcon from '@mui/icons-material/Close';
import { faRobot, faPhone } from '@fortawesome/free-solid-svg-icons';

const showAlert = (onClose, isDarkMode, text, icon) => {
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
    PaperProps={{
      style: {
        backgroundColor: isDarkMode ? '#333' : '#fff',
        color: isDarkMode ? '#fff' : '#000',
        borderRadius: 1,
      },
    }}
  >
    <DialogTitle id="alert-dialog-title">
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {icon && <div className={`modal-icon alert-icon${icon}`}></div>}
        <Typography dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    </DialogContent>
  </Dialog>
};

const showConfirm = (
  isDarkMode,
  text,
  icon,
  okayButtonTitle,
  cancelButtonTitle,
  callback
) => {
  confirmAlert({
    customUI: ({ onClose }) => {
      return (
        <div style={{ borderRadius: "0.3em" }} className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body confirm-body">
            <Button className="btn-close title" onClick={onClose}>
              ×
            </Button>
            <div className={`modal-icon alert-icon${icon}`}></div>
            <h5>{text}</h5>
            <FormControlLabel
              control={
                <Checkbox
                  color='error'
                  onChange={event =>
                    localStorage.setItem(
                      'hideConfirmModal',
                      event.target.checked
                    )
                  }
                />
              }
              label="DON'T SHOW ME THIS SH*T"
            />

            <div className="modal-footer">
              <Button
                onClick={() => {
                  callback();
                  onClose();
                }}
              >
                {okayButtonTitle}
              </Button>
              {cancelButtonTitle && (
                <Button variant='contained' color='error' onClick={onClose}>
                  {cancelButtonTitle}
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }
  });
};


export const ConflictDialog = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>EXISTING ACCOUNT CONNECTED</DialogTitle>
    <DialogContent>
      <Typography>
        We detected a wallet address that's already connected with us. You should log in with this account.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="error" variant="contained">
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

export const confirmModalCreate = (
  isDarkMode,
  text,
  okayButtonTitle,
  cancelButtonTitle,
  callback
) => {
  showConfirm(
    isDarkMode,
    text,
    '-create',
    okayButtonTitle,
    cancelButtonTitle,
    callback
  );
};

export const confirmModalClosed = (
  isDarkMode,
  text,
  okayButtonTitle,
  cancelButtonTitle,
  callback
) => {
  showConfirm(
    isDarkMode,
    text,
    '-closed',
    okayButtonTitle,
    cancelButtonTitle,
    callback
  );
};
