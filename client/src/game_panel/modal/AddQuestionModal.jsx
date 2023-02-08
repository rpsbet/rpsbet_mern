import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import QuestionEditForm from '../../admin_panel/app/Question/QuestionEditForm';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(47, 49, 54, 0.8)',
    backdropFilter: 'blur(4px)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0,
    border: 0
  }
};

class AddQuestionModal extends Component {
  render() {
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Add Question Modal"
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body edit-modal-body how-to-play-modal-body">
            <h2 className="modal-title">Add Your Own #BrainGame</h2>

            <button className="btn-close" onClick={this.props.closeModal}>
              ×
            </button>
            <QuestionEditForm
          handelCancel={this.handelCancel}
          // updateTextField={this.updateTextField}
          // onSubmitFrom={this.onSubmitFrom}
          // handleChange={this.handleChange}
          // onSaveForm={this.onSaveForm}
          // setOnDelete={this.setOnDelete}
          // buttonDisable={this.state.buttonDisable}
          // addBrainGameType={this.props.addBrainGameType}
          // removeBrainGameType={this.props.removeBrainGameType}
        />
           
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
});

const mapDispatchToProps = {
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddQuestionModal);



