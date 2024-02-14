import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { acGetCustomerInfo } from '../../redux/Customer/customer.action';
import { Button } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faList, faEdit } from '@fortawesome/free-solid-svg-icons';
import { setUrl, getUser } from '../../redux/Auth/user.actions';
import {
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  setCurrentQuestionInfo,
  getBrainGameTypes,
  addBrainGameType,
  queryQuestion,
  removeBrainGameType
} from '../../redux/Question/question.action';
import {
  warningMsgBar,
  infoMsgBar
} from '../../redux/Notification/notification.actions';
import history from '../../redux/history';
import QuestionTable from '../../admin_panel/app/Question/QuestionTable';
import QuestionCreateForm from '../../admin_panel/app/Question/QuestionCreateForm';
import QuestionEditForm from '../../admin_panel/app/Question/QuestionEditForm';

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

class AddQuestionModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      _id: props._id,
      question: props.question,
      image: props.image,
      answers: props.answers,
      incorrect_answers: props.incorrect_answers,
      brain_game_type: props.brain_game_type,
      game_type_list: props.game_type_list,
      isQuestionTableModalOpen: false,
      isQuestionEditModalOpen: false,
      buttonDisable: true
    };
  }

  static getDerivedStateFromProps(props, state) {
    return {
      _id: props._id,
      question: props.question,
      image: props.image,
      answers: props.answers,
      incorrect_answers: props.incorrect_answers,
      brain_game_type: props.brain_game_type,
      game_type_list: props.game_type_list
    };
  }

  componentDidMount() {
    const { _id } = this.props.userInfo;
    const { brain_game_type, game_type_list } = this.state;
    if (_id) {
      this.props.getBrainGameTypes(_id);
    }


    // if (this.props.match.params._id && this.state._id !== this.props.match.params._id) {
    //   this.props.setCurrentQuestionInfo({ _id: this.props.match.params._id });
    // }

    // this.props.setUrl(this.props.match.path);

  }

  componentDidUpdate(prevState, prevProps) {
    const { game_type_list, brain_game_type } = this.props;

    if (prevProps.game_type_list !== game_type_list) {
      // this.setState({brain_game_type: brain_game_type})
      this.props.queryQuestion(10, 1, brain_game_type);
    }
    
  }

  remove = async (_id) => {
    const { brain_game_type } = this.props;
    await this.props.deleteQuestion(_id, brain_game_type);
    this.props.queryQuestion(10, 1, brain_game_type);
};



  toggleQuestionTableModal = (name, value) => {
  
    // this.props.getBrainGameTypes(this.props.userInfo._id);
    this.setState(prevState => ({
      isQuestionTableModalOpen: !prevState.isQuestionTableModalOpen
    }))
  };

  toggleQuestionEditModal = async (value) => {
    if (typeof value === 'string') {
        await this.props.getQuestion(value);
    }

    // Toggle the state for the modal regardless of the type of value
    this.setState(prevState => ({
        isQuestionEditModalOpen: !prevState.isQuestionEditModalOpen
    }));
};

  

  handleReset = () => {
    const { _id } = this.props.userInfo;

    this.setState({
      buttonDisable: true
    });
    this.props.setCurrentQuestionInfo({
      _id: '',
      question: '',
      image: '',
      answers: [],
      new_answer: '',
      brain_game_type: ''
    });
    this.props.getBrainGameTypes(_id);
  };

  handelCancel = () => {
    this.setState({
      buttonDisable: true
    });
    this.props.setCurrentQuestionInfo({
      _id: '',
      question: '',
      image: '',
      answers: [],
      new_answer: '',
      brain_game_type: ''
    });
    this.props.getBrainGameTypes();
    this.props.closeModal();
    // history.push(`/admin/question/`);
  };

  onSubmitFrom = async e => {
    e.preventDefault();
    this.props.infoMsgBar(`question created`);

    await this.props.createQuestion(this.state);
    this.handleReset();
  };

  onSaveFrom = async e => {
    e.preventDefault();
    this.props.infoMsgBar(`question updated`);

    await this.props.updateQuestion(this.state);
    this.toggleQuestionEditModal();
  };

  onSaveForm = async e => {
    e.preventDefault();
    this.props.infoMsgBar(`question saved`);
    await this.props.updateQuestion(this.state);
    this.handelCancel();
  };

  buttonChange = (question, answers) => {
    if (question !== '' && question.length >= 3 && answers.length > 0) {
      this.setState({ buttonDisable: false });
    } else {
      this.setState({ buttonDisable: true });
    }
  };

  updateTextField = (name, value, length) => {
    if (value === '' || value.length <= length) {
      if (name === 'question') {
        this.buttonChange(value, this.state.answers);
      }

      this.props.setCurrentQuestionInfo({ [name]: value });

    } else {
      this.props.warningMsgBar(`Value length is biggest than ${length}`);
    }
  };

  handleChange = (name, value) => {

    this.setState({ brain_game_type: value }, () => {
      if (name ===  'answers') {
        this.buttonChange(this.state.question, value);
      } else if (name === 'brain_game_type' || name === 'incorrect_answers') {
        this.buttonChange(this.state.question, this.state.answers);
      }
      this.props.setCurrentQuestionInfo({ [name]: value });
      this.props.queryQuestion(10, 1, value);


    });

  };

  render() {
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.closeQuestionModal}
        style={customStyles}
        contentLabel="Add Question Modal"
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">

            <h2 className="modal-title">
          <FontAwesomeIcon icon={faBrain} /> &nbsp;
              Submit Your Own Brain Game</h2>
            <Button className="btn-close" onClick={this.handelCancel}>
              ×
            </Button>
          </div>

          <div className="modal-body edit-modal-body question-modal-body">
            <QuestionCreateForm
              handelCancel={this.handelCancel}
              updateTextField={this.updateTextField}
              onSubmitFrom={this.onSubmitFrom}
              handleChange={this.handleChange}
              buttonDisable={this.state.buttonDisable}
              addBrainGameType={this.props.addBrainGameType}
              removeBrainGameType={this.props.removeBrainGameType}
              toggleQuestionTableModal={this.toggleQuestionTableModal}

            />
          </div>
          <div className="modal-footer">
            <Button
              onClick={this.handelCancel}
              variant="contained"
              cancel="true"
              className='btn-back'
              style={{ marginRight: "10px" }}
            >
              Close
            </Button>
            <Button
              disabled={this.state.buttonDisable}
              onClick={(e) => this.onSubmitFrom(e)}
              variant="contained"
              className='btn-submit'
            >
              Add New Question
            </Button>
          </div>
        </div>

        <Modal
          isOpen={this.state.isQuestionTableModalOpen}
          onRequestClose={this.toggleQuestionTableModal}
          style={customStyles}
          contentLabel="Questions Modal"

        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">
              <FontAwesomeIcon icon={faList} /> &nbsp;
                View All Questions</h2>
              <Button className="btn-close" onClick={this.toggleQuestionTableModal}>
                ×
              </Button>
            </div>

            <div className="modal-body edit-modal-body question-modal-body">
              <QuestionTable remove={this.remove} toggleQuestionEditModal={this.toggleQuestionEditModal} />
            </div>
          </div>

        </Modal>
        <Modal
          isOpen={this.state.isQuestionEditModalOpen}
          onRequestClose={this.toggleQuestionEditModal}
          style={customStyles}
          contentLabel="Questions Modal"

        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">
              <FontAwesomeIcon icon={faEdit} /> &nbsp;
                Update Question</h2>
              <Button className="btn-close" onClick={this.toggleQuestionEditModal}>
                ×
              </Button>
            </div>

            <div className="modal-body edit-modal-body question-modal-body">
              <QuestionEditForm
                onSaveForm={this.onSaveForm}
                handelCancel={this.toggleQuestionEditModal}
                updateTextField={this.updateTextField}
                onSubmitFrom={this.onSubmitFrom}
                handleChange={this.handleChange}
                question={this.props.question}
                buttonDisable={this.state.buttonDisable}
                toggleQuestionEditModal={this.toggleQuestionEditModal}
              />
            </div>
            <div className="modal-footer">
              <Button
                onClick={this.toggleQuestionEditModal}
                variant="contained"
                cancel="true"
                className='btn-back'
                style={{ marginRight: "10px" }}
              >
                cancel
              </Button>
              <Button
                disabled={this.state.buttonDisable}
                onClick={(e) => this.onSaveFrom(e)}
                variant="contained"
                className='btn-submit'
              >
                Update
              </Button>
            </div>
          </div>

        </Modal>
      </Modal>

    );
  }
}

const mapStateToProps = state => ({
  userInfo: state.auth.user,
  isDarkMode: state.auth.isDarkMode,
  _id: state.questionReducer._id,
  question: state.questionReducer.question,
  image: state.questionReducer.image,
  answers: state.questionReducer.answers,
  incorrect_answers: state.questionReducer.incorrect_answers,
  brain_game_type: state.questionReducer.brain_game_type,
  game_type_list: state.questionReducer.game_type_list
});

const mapDispatchToProps = {
  setUrl,
  getUser,
  acGetCustomerInfo,
  warningMsgBar,
  infoMsgBar,
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  setCurrentQuestionInfo,
  getBrainGameTypes,
  addBrainGameType,
  removeBrainGameType,
  queryQuestion
};

export default connect(mapStateToProps, mapDispatchToProps)(AddQuestionModal);
