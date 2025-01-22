import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { 
  TextField, 
  Button, 
  LinearProgress, 
  Skeleton, 
  Box, 
  Typography, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCommentsForRoom, createComment, deleteComment } from '../redux/Logic/logic.actions';
import Avatar from './Avatar';
import PlayerModal from '../game_panel/modal/PlayerModal';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenSquare } from '@fortawesome/free-solid-svg-icons';
import { setFocused } from '../redux/Auth/user.actions.js';

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
    <Box>
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
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 2 
          }}
        >
           <TextField color="secondary" 
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
            sx={{ mr: 2 }}
          />
          <Button
            onClick={handleCommentSubmit}
            variant="contained"
            startIcon={<FontAwesomeIcon icon={faPenSquare} />}
            sx={{
              minWidth: 'auto',
              padding: '8px',
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#115293',
              },
            }}
          >
            <Typography variant="button">[&#x23CE;]</Typography>
          </Button>
        </Box>
      )}

      {loading ? (
        <Box>
          {[...Array(3)].map((_, index) => (
            <Skeleton 
              key={index} 
              variant="rectangular" 
              width="100%" 
              height={50} 
              sx={{ mb: 1 }} 
            />
          ))}
        </Box>
      ) : comments.length === 0 ? (
        <Typography 
          variant="body1" 
          sx={{ 
            textAlign: 'center', 
            mt: 2, 
            fontSize: '16px', 
            color: '#999' 
          }}
        >
          NO REPLIES
        </Typography>
      ) : (
        comments.map((comment) => (
          <Box 
            key={comment._id} 
            sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              mb: 2, 
              p: 2, 
              bgcolor: isDarkMode ? '#1e1e1e' : '#f5f5f5', 
              borderRadius: 1 
            }}
          >
            <Box sx={{ mr: 2 }}>
              <Tooltip title={comment.user.username}>
                <Box 
                  component="a" 
                  onClick={() => handleOpenPlayerModal(comment.user._id)} 
                  sx={{ cursor: 'pointer' }}
                >
                  <Avatar
                    src={comment.user.avatar}
                    username={comment.user.username}
                    rank={comment.user.totalWagered}
                    accessory={comment.user.accessory}
                    alt=""
                    darkMode={isDarkMode}
                  />
                </Box>
              </Tooltip>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {comment.user.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Moment(comment.created_at).fromNow()}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {comment.content}
              </Typography>
            </Box>
            {comment.user._id === currentUserId && (
              <IconButton 
                onClick={() => handleDeleteComment(comment._id)} 
                aria-label="delete" 
                sx={{ ml: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        ))
      )}
    </Box>
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