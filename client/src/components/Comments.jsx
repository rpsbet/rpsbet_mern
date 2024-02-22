import React, { Component } from 'react';
import { connect } from 'react-redux';
import { TextField, Button, IconButton, LinearProgress } from '@material-ui/core';
import { Delete as DeleteIcon } from '@material-ui/icons';
import { getCommentsForRoom, createComment, deleteComment } from '../redux/Logic/logic.actions'
import Avatar from './Avatar';
import PlayerModal from '../game_panel/modal/PlayerModal';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenSquare } from '@fortawesome/free-solid-svg-icons'
import { setFocused } from '../redux/Auth/user.actions.js' 

class Comments extends Component {
    constructor(props) {
        super(props);
        this.state = {
            newComment: '',
            showPlayerModal: false,
            selectedCreator: '',
            comments: []
        };
    }

    componentDidMount() {
        this.fetchComments();
    }

    async fetchComments() {
        await this.props.getCommentsForRoom(this.props.roomId);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.comments !== this.props.comments) {
            this.setState({ comments: this.props.comments });
        }
    }


  onFocusHandler = () => {
    this.props.setFocused(true);
  }
  onBlurHandler = () => {
    this.props.setFocused(false);
  }


    handleOpenPlayerModal = creator_id => {
        this.setState({ showPlayerModal: true, selectedCreator: creator_id });
    };

    handleClosePlayerModal = () => {
        this.setState({ showPlayerModal: false });
    };


    handleCommentChange = (event) => {
        this.setState({ newComment: event.target.value });
    };

    handleCommentSubmit = () => {
        const { newComment } = this.state;
        if (newComment.trim() !== '') {
            this.props.createComment({ content: newComment, room_id: this.props.roomId })
                .then(() => {
                    // Fetch comments after the comment is successfully created
                    this.fetchComments();
                })
                .catch(error => {
                    // Handle error if comment creation fails
                    console.error('Error creating comment:', error);
                });
            this.setState({ newComment: '' });
        }
    };


    handleDeleteComment = (commentId) => {
        this.props.deleteComment(commentId);
    };

    render() {
        const { loading } = this.props;
        const { comments } = this.state;

        return (
            <div>
                {this.state.showPlayerModal && (
                    <PlayerModal
                        selectedCreator={this.state.selectedCreator}
                        modalIsOpen={this.state.showPlayerModal}
                        closeModal={this.handleClosePlayerModal}
                    />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <TextField
                        label="Add a comment"
                        value={this.state.newComment}
                        onChange={this.handleCommentChange}
                        fullWidth
                        multiline
                        onFocus={this.onFocusHandler}
                        onBlur={this.onBlurHandler}
                        rows={2}
                        variant="filled"
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault(); // Prevent default Enter behavior (line break)
                              this.handleCommentSubmit();
                            }
                        }
                    }
                    />
                    <Button
                        className="btn_recreate"
                        style={{ marginLeft: '10px' }} // Adjust margin as needed
                        onClick={this.handleCommentSubmit}
                        variant="contained"

                        startIcon={<FontAwesomeIcon icon={faPenSquare} />} // Use the Font Awesome icon here
                    >
                                            <span className='roll-tag'>[&#x23CE;]</span>

                    </Button>
                </div>



                {loading ? (
                    <LinearProgress />
                ) : (
                    <div>
                        {comments.map((comment) => (
                            <div className="comment-container" key={comment._id}>
                                <div className="comment-header">
                                    <a
                                        className="player"
                                        onClick={() => this.handleOpenPlayerModal(comment.user._id)}
                                    >
                                        <Avatar
                                            className="avatar"
                                            src={comment.avatar}
                                            rank={comment.totalWagered}
                                            accessory={comment.accessory}
                                            alt=""
                                            darkMode={this.props.isDarkMode}
                                        />
                                    </a>
                                </div>
                                <div className="comment-content">
                                    <p>{comment.content}</p>
                                </div>
                                <div className="comment-footer">
                                    <span>{comment.user._id === this.props.currentUserId && (
                                        <IconButton
                                            className="delete-icon"
                                            onClick={() => this.handleDeleteComment(comment._id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    )}</span>
                                </div>
                                <span className="comment-time">{Moment(comment.created_at).fromNow()}</span>

                            </div>
                        ))}

                    </div>
                )}
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    comments: state.logic.comments,
    loading: state.logic.loading,
    currentUserId: state.auth.user._id, // Assuming you have user authentication implemented
});

export default connect(mapStateToProps, { getCommentsForRoom, createComment, deleteComment, setFocused })(Comments);
