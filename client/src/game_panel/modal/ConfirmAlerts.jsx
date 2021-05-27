import React from 'react';
import { confirmAlert } from 'react-confirm-alert';

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
export const confirmModalClosed = (isDarkMode, text, okayButtonTitle, cancelButtonTitle, callback) => {
    showConfirm(isDarkMode, text, '-closed', okayButtonTitle, cancelButtonTitle, callback);
}
export const confirmModalCreate = (isDarkMode, text, okayButtonTitle, cancelButtonTitle, callback) => {
    showConfirm(isDarkMode, text, '-create', okayButtonTitle, cancelButtonTitle, callback);
}

const showResultModal = (isDarkMode, text, icon, okayButtonTitle, cancelButtonTitle, callback, callback2) => {
    confirmAlert({
        closeOnEscape: false,
        closeOnClickOutside: false,
        customUI: ({ onClose }) => {
            return (
                <div className={isDarkMode ? 'dark_mode' : ''}>
                    <div className='modal-body alert-body result-body'>
                        <div className={`modal-icon result-icon${icon}`}></div>
                        <h1>{text}</h1>
                        <p>Click your balance for<br/>balance differences.</p>
                        <div className="modal-action-panel">
                            <button className="btn-submit" onClick={() => {callback(); onClose();}}>{okayButtonTitle}</button>
                            { cancelButtonTitle &&
                                <button className="btn-back" onClick={() => {callback2(); onClose();}}>{cancelButtonTitle}</button>
                            }
                        </div>
                    </div>
                </div>
            );
        }
    });
}
export const gameResultModal = (isDarkMode, text, gameResult, okayButtonTitle, cancelButtonTitle, callback, callback2) => {
    let icon = '-lost';
    if (gameResult === 0) {
        icon = '-draw';
    } else if (gameResult === 1) {
        icon = '-win';
    }
    showResultModal(isDarkMode, text, icon, okayButtonTitle, cancelButtonTitle, callback, callback2);
}