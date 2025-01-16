import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { TextField, Button, LinearProgress } from '@material-ui/core';
import { Delete as DeleteIcon } from '@material-ui/icons';
import { getCommentsForRoom, createComment, deleteComment } from '../redux/Logic/logic.actions';
import Avatar from './Avatar';
import PlayerModal from '../game_panel/modal/PlayerModal';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenSquare } from '@fortawesome/free-solid-svg-icons';
import { setFocused } from '../redux/Auth/user.actions.js';
import { Skeleton } from '@material-ui/lab';

const Comments = ({
  comments: initialComments,
  loading,
  roomId,
  currentUserId,
  currentUsername,
  currentUserAvatar,
  currentUserAccessory,
  currentUserTotalWagered,
  socket,
  getCommentsForRoom,
  createComment,
  deleteComment,
  setFocused,
  isDarkMode,
}) => {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  useEffect(() => {
    fetchComments();
    setupSocketConnection();

    return () => {
      disconnectSocket();
    };
  }, [roomId]);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const fetchComments = async () => {
    await getCommentsForRoom(roomId);
  };

  const setupSocketConnection = () => {
    if (socket) {
      socket.on('NEW_COMMENT', handleNewComment);
      socket.on('DELETE_COMMENT', handleDeleteCommentFromSocket);
    } else {
      retrySocketConnection();
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.off('NEW_COMMENT', handleNewComment);
      socket.off('DELETE_COMMENT', handleDeleteCommentFromSocket);
    }
  };

  const retrySocketConnection = useCallback(() => {
    setTimeout(() => {
      if (socket) {
        socket.on('NEW_COMMENT', handleNewComment);
      } else {
        retrySocketConnection();
      }
    }, 1000);
  }, [socket]);

  const handleNewComment = (newComment) => {
    if (newComment.user._id !== currentUserId) {
      setComments((prevComments) => [newComment, ...prevComments]);
    }
  };

  const handleDeleteCommentFromSocket = ({ commentId }) => {
    setComments((prevComments) => prevComments.filter((comment) => comment._id !== commentId));
  };

  const handleCommentSubmit = async () => {
    if (newComment.trim() !== '') {
      const tempComment = {
        _id: `temp-${Date.now()}`,
        content: newComment,
        room: roomId,
        user: {
          _id: currentUserId,
          username: currentUsername,
          avatar: currentUserAvatar,
          accessory: currentUserAccessory,
          totalWagered: currentUserTotalWagered,
        },
        created_at: new Date().toISOString(),
      };

      setComments((prevComments) => [tempComment, ...prevComments]);
      setNewComment('');

      try {
        const response = await createComment({ content: newComment, room_id: roomId });

        if (response && response.success) {
          setComments((prevComments) =>
            prevComments.map((comment) => (comment._id === tempComment._id ? response.comment : comment))
          );
        } else {
          setComments((prevComments) => prevComments.filter((comment) => comment._id !== tempComment._id));
        }
      } catch {
        setComments((prevComments) => prevComments.filter((comment) => comment._id !== tempComment._id));
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    setComments((prevComments) => prevComments.filter((comment) => comment._id !== commentId));

    try {
      const response = await deleteComment(commentId);
      if (!response.success) {
        console.error('Failed to delete comment:', response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleOpenPlayerModal = (creatorId) => {
    setSelectedCreator(creatorId);
    setShowPlayerModal(true);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  return (
    <div>
      {showPlayerModal && (
        <PlayerModal
          selectedCreator={selectedCreator}
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
        />
      )}

      {loading ? (
        <LinearProgress color="secondary" />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <TextField
            label="Reply"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            fullWidth
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            variant="filled"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCommentSubmit();
              }
            }}
          />
          <Button
            className="btn_recreate"
            style={{ marginLeft: '10px' }}
            onClick={handleCommentSubmit}
            variant="contained"
            startIcon={<FontAwesomeIcon icon={faPenSquare} />}
          >
            <span className="roll-tag">[&#x23CE;]</span>
          </Button>
        </div>
      )}

      {loading ? (
        [...Array(3)].map((_, index) => (
          <Skeleton key={index} variant="rect" width="100%" height={50} style={{ marginBottom: '10px' }} />
        ))
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '16px', color: '#999' }}>NO REPLIES</div>
      ) : (
        comments.map((comment) => (
          <div className="comment-container title" key={comment._id}>
            <div className="comment-header">
              <a className="player" onClick={() => handleOpenPlayerModal(comment.user._id)}>
                <Avatar
                  src={comment.user.avatar}
                  username={comment.user.username}
                  rank={comment.user.totalWagered}
                  accessory={comment.user.accessory}
                  alt=""
                  darkMode={isDarkMode}
                />
              </a>
            </div>
            <div className="comment-content">
              <p>{comment.content}</p>
            </div>
            <div className="comment-footer">
              {comment.user._id === currentUserId && (
                <Button onClick={() => handleDeleteComment(comment._id)}>
                  <DeleteIcon />
                </Button>
              )}
              <span className="comment-time title">{Moment(comment.created_at).fromNow()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  comments: state.logic.comments,
  loading: state.logic.isActiveLoadingOverlay,
  currentUserId: state.auth.user._id,
  currentUsername: state.auth.user.username,
  currentUserAvatar: state.auth.user.avatar,
  currentUserAccessory: state.auth.user.accessory,
  currentUserTotalWagered: state.auth.user.totalWagered,
  socket: state.auth.socket,
  isDarkMode: state.auth.isDarkMode,
});

export default connect(mapStateToProps, { getCommentsForRoom, createComment, deleteComment, setFocused })(Comments);