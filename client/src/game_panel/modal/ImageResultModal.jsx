import React, { Component } from 'react';
import Modal from 'react-modal';
import { Button } from '@material-ui/core';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },

  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0
  }
};

class ImageResultModal extends Component {
  componentDidMount() {
    const { productName } = this.props;
    setTimeout(() => {

    this.speak("You've found a motherfucking " + productName + ', have a cookie you fat fuck!');
    }, 1500);
  }

  speak = message => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0; // set the speed to 1.0 (normal speed)
      utterance.lang = 'en-US'; // set the language to US English
      window.speechSynthesis.speak(utterance);
    }
  };

  render() {
    const { productName, isDarkMode, image } = this.props;

    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Prize Won"
      >
        <div
          style={{
            borderRadius: '0.6em',
            background: isDarkMode ? '#333' : '#fff'
          }}
          className={isDarkMode ? 'dark_mode' : ''}
        >
          <div className="modal-body alert-body result-body">
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
            <h1
              style={{ fontSize: '2em', color: isDarkMode ? '#fff' : '#333' }}
            >
              Congratulations! 🍪
            </h1>
            <p style={{ color: isDarkMode ? '#ddd' : '#555' }}>
              You've found a {productName}!
            </p>
            <img
              src={`${image}`}
              alt={productName}
              style={{
                maxWidth: '150px',
                maxHeight: '200px',
                margin: 'auto',
                display: 'block'
              }}
            />
          </div>
        </div>
      </Modal>
    );
  }
}

export default ImageResultModal;
