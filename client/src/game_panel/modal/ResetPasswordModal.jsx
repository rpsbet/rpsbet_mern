import React, { useState } from 'react';
import Modal from 'react-modal';
import { useSelector, useDispatch } from 'react-redux';
import { sendResetPasswordEmail } from '../../redux/Auth/user.actions';

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

const ResetPasswordModal = (props) => {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  // Destructure props from parent
  const { modalIsOpen, title, closeModal, openLoginModal, email: initialEmail } = props;

  // Local state
  const [email, setEmail] = useState(initialEmail || '');
  const [showVerificationModal] = useState(false); // not used further in this example

  const onChangeEmail = (e) => {
    setEmail(e.target.value);
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    const isSent = await dispatch(sendResetPasswordEmail(email));
    if (isSent) {
      // Optionally, handle post-email-sent logic here
    }
  };

  return (
    <Modal
      isOpen={modalIsOpen || false}
      style={customStyles}
      contentLabel={title}
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-body">
          <button
            className="btn-close"
            onClick={closeModal}
          >
            ×
          </button>
          <h2>RECOVER PASSWORD</h2>
          <form onSubmit={onSubmitForm}>
            <p>YOUR EMAIL ADDRESS</p>
            <input
              type="text"
              className="form-control"
              value={email}
              onChange={onChangeEmail}
            />
            <button type="submit">
              Send Email
            </button>
            <p className="m-0 sm-text-center">
              <button
                onClick={(e) => {
                  closeModal();
                  openLoginModal();
                }}
              >
                Back to Login →
              </button>
            </p>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default ResetPasswordModal;