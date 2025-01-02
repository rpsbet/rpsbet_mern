import React from 'react';
import { confirmAlert } from 'react-confirm-alert';
import { convertToCurrency } from '../../util/conversion';
import { FormControlLabel, Button, Checkbox } from '@material-ui/core/';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPhone } from '@fortawesome/free-solid-svg-icons';

const showAlert = (isDarkMode, text, icon) => {
  confirmAlert({
    customUI: ({ onClose }) => {
      return (
        <div style={{ borderRadius: "0.5em" }} className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body">
            <Button className="btn-close title" onClick={onClose}>
              ×
            </Button>
            <div className={`modal-icon alert-icon${icon}`}></div>
            <h5 dangerouslySetInnerHTML={{ __html: text }}></h5>
          </div>
        </div>
      );
    }
  });
};
export const alertModal = (isDarkMode, text, icon = '') => {
  showAlert(isDarkMode, text, icon);
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
                className="btn-submit"
                onClick={() => {
                  callback();
                  onClose();
                }}
              >
                {okayButtonTitle}
              </Button>
              {cancelButtonTitle && (
                <Button className="btn-back" onClick={onClose}>
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
            <h5 style={{margin: '30px auto'}}> {text}</h5>
            <div className='glass-container'
              style={{  padding: '5px 10px', height: '75px', borderRadius: "0.5em", display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            // className={`modal-icon alert-icon${icon}`}
            ><FontAwesomeIcon style={{ fontSize: "1em" }} icon={faRobot} />&nbsp;<span  style={{ fontSize: "0.9em" }}>RANDOM BOT</span></div>

            <div className="modal-footer">
              <Button
                className="btn-submit"
                onClick={() => {
                  callback();
                  onClose();
                }}
              >

                {okayButtonTitle}<FontAwesomeIcon icon={faPhone} style={{ marginLeft: '5px', color: '#fff' }} />
              </Button>
              {cancelButtonTitle && (
                <Button className="btn-back" onClick={onClose}>
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


const speak = (message) => {
  if (window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.0; // set the speed to 1.0 (normal speed)
    utterance.lang = 'en-US'; // set the language to US English
    window.speechSynthesis.speak(utterance);
  }
};
