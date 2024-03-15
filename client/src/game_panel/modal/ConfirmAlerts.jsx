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
        <div style={{ borderRadius: "0.6em" }} className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body">
            <Button className="btn-close" onClick={onClose}>
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
        <div style={{ borderRadius: "0.6em" }} className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body confirm-body">
            <Button className="btn-close" onClick={onClose}>
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
        <div style={{ borderRadius: "0.6em" }} className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body confirm-body">
            <h5 style={{margin: '30px auto'}}> {text}</h5>
            <div
              style={{ color: '#353b47', padding: '5px 10px', background: 'rgb(175 176 176)', filter: 'drop-shadow(2px 4px 6px black)', height: '75px', borderRadius: "0.6em", display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            // className={`modal-icon alert-icon${icon}`}
            ><FontAwesomeIcon style={{ fontSize: "1.6em" }} icon={faRobot} />&nbsp;<span  style={{ fontSize: "1.4em" }}>Unknown Strategy</span></div>

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

const showResultModal = (
  isDarkMode,
  text,
  amount,
  icon,
) => {
  let timeLeft = 1500;
  const intervalId = setInterval(() => {
    timeLeft -= 100;
    if (timeLeft === 0) {
      clearInterval(intervalId);
    }
  }, 100);

  // Speak the message
  speak(text);

  // Determine the inline style based on the sign of the amount
  const amountStyle = {
    color: amount >= 0 ? '#00FF00' : '#FF0000' // Vibrant green and red
  };

  confirmAlert({
    overlayClassName: 'overlay-result',
    closeOnEscape: false,
    closeOnClickOutside: false,
    customUI: ({ onClose }) => {
      setTimeout(() => {
        onClose();
        // window.speechSynthesis.cancel();
      }, 1500);

      return (
        <div style={{ borderRadius: "0.6em" }} className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body result-body">
            <div className={`modal-icon result-icon${icon}`}></div>
            <h4>{text}</h4>
            <h1 style={amountStyle}>{convertToCurrency(amount)}</h1>
            <div className="modal-footer">
              <div className="countdown-timer">
                <div
                  className="countdown-bar"
                  style={{ width: `${(timeLeft / 1500) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  });
};


export const gameResultModal = (
  isDarkMode,
  text,
  amount,
  gameResult,
  cancelButtonTitle,
  callback,
  callback2
) => {
  let icon = '-lost';
  if (gameResult === 0) {
    icon = '-draw';
  } else if (gameResult === 1) {
    icon = '-win';
  }
  showResultModal(
    isDarkMode,
    text,
    amount,
    icon,
    cancelButtonTitle,
    callback,
    callback2
  );
};

