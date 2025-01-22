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

export const alertModal = (onClose, isDarkMode, text, icon = '') => {
  showAlert(onClose, isDarkMode, text, icon);
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
                  color="primary"
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
                <Button variant='contained' color='secondary' onClick={onClose}>
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


const showConfirmCall = (
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
            <h5 style={{ margin: '30px auto' }}> {text}</h5>
            <div className=''
              style={{ padding: '5px 10px', height: '75px', borderRadius: "0.5em", display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            // className={`modal-icon alert-icon${icon}`}
            ><FontAwesomeIcon style={{ fontSize: "1em" }} icon={faRobot} />&nbsp;<span style={{ fontSize: "0.9em" }}>RANDOM BOT</span></div>

            <div className="modal-footer">
              <Button
                onClick={() => {
                  callback();
                  onClose();
                }}
              >

                {okayButtonTitle}<FontAwesomeIcon icon={faPhone} style={{ marginLeft: '5px', color: '#fff' }} />
              </Button>
              {cancelButtonTitle && (
                <Button variant='contained' color='secondary' onClick={onClose}>
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

export const callBotModal = (
  isDarkMode,
  text,
  okayButtonTitle,
  cancelButtonTitle,
  callback
) => {
  showConfirmCall(
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
