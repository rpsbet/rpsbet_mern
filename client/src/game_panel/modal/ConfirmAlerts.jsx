import React from 'react';
import { confirmAlert } from 'react-confirm-alert';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
const showAlert = (isDarkMode, text, icon) => {
    confirmAlert({
        customUI: ({ onClose }) => {
            return (
                <div className={isDarkMode ? 'dark_mode' : ''}>
                    <div className='modal-body alert-body'>
                        <button className="btn-close" onClick={onClose}>×</button>
                        <div className={`modal-icon alert-icon${icon}`}></div>
                        <h5>{text}</h5>
                    </div>
                </div>
            );
        }
    });
}
export const alertModal = (isDarkMode, text) => {
    showAlert(isDarkMode, text, '');
}

const showConfirm = (isDarkMode, text, icon, okayButtonTitle, cancelButtonTitle, callback) => {
    confirmAlert({
        customUI: ({ onClose }) => {
            return (
                <div className={isDarkMode ? 'dark_mode' : ''}>
                    <div className='modal-body alert-body confirm-body'>
                        <button className="btn-close" onClick={onClose}>×</button>
                        <div className={`modal-icon alert-icon${icon}`}></div>
                        <h5>{text}</h5>
                        <FormControlLabel
                    control={
                        <Checkbox
                            color="primary"
                            onChange={event => localStorage.setItem('hideConfirmModalx', event.target.checked)}
                        />
                    }
                    label="Don't show this again"
                />
               
                        <div className="modal-action-panel">
                            <button className="btn-submit" onClick={() => {callback(); onClose();}}>{okayButtonTitle}</button>
                            { cancelButtonTitle &&
                                <button className="btn-back" onClick={onClose}>{cancelButtonTitle}</button>
                            }
                        </div>
                    </div>
                </div>
            );
        }
    }); 
}
export const confirmModalCreate = (isDarkMode, text, okayButtonTitle, cancelButtonTitle, callback) => {
    showConfirm(isDarkMode, text, '-create', okayButtonTitle, cancelButtonTitle, callback);
}
export const confirmModalClosed = (isDarkMode, text, okayButtonTitle, cancelButtonTitle, callback) => {
    showConfirm(isDarkMode, text, '-closed', okayButtonTitle, cancelButtonTitle, callback);
}
const showResultModal = (isDarkMode, text, icon, cancelButtonTitle, callback, callback2) => {
    let timeLeft = 2300; // duration of modal in milliseconds
    const intervalId = setInterval(() => {
        timeLeft -= 100;
        if (timeLeft === 0) {
            clearInterval(intervalId);
        }
    }, 100); // countdown interval
    confirmAlert({
        closeOnEscape: false,
        closeOnClickOutside: false,
        customUI: ({ onClose }) => {
            setTimeout(() => onClose(), 2300); // dismiss modal after 2 seconds
            return (
                <div className={isDarkMode ? 'dark_mode' : ''}>
                    <div className='modal-body alert-body result-body'>
                        <div className={`modal-icon result-icon${icon}`}></div>
                        <h1>{text}</h1>
                        <div className="modal-action-panel">
                            {/* { cancelButtonTitle &&
                                <button className="btn-back" onClick={() => {callback2(); onClose();}}>{cancelButtonTitle}</button>
                            } */}
                            <div className="countdown-timer">
                                <div className="countdown-bar" style={{ width: `${(timeLeft / 2300) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    });
}
export const gameResultModal = (isDarkMode, text, gameResult, cancelButtonTitle, callback, callback2) => {
    let icon = '-lost';
    if (gameResult === 0) {
        icon = '-draw';
    } else if (gameResult === 1) {
        icon = '-win';
    }
    showResultModal(isDarkMode, text, icon, cancelButtonTitle, callback, callback2);
}
