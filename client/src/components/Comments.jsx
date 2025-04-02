import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../config/theme.js';

const Comments = ({ roomId }) => {
  // Get Redux state via hooks
  const commentsFromState = useSelector(state => state.logic.comments);
  const loading = useSelector(state => state.logic.isActiveLoadingOverlay);
  const currentUserId = useSelector(state => state.auth.user._id);
  const currentUsername = useSelector(state => state.auth.user.username);
  const currentUserAvatar = useSelector(state => state.auth.user.avatar);
  const currentUserAccessory = useSelector(state => state.auth.user.accessory);
  const currentUserTotalWagered = useSelector(state => state.auth.user.totalWagered);
  const socket = useSelector(state => state.auth.socket);
  const isDarkMode = useSelector(state => state.auth.isDarkMode);

  const dispatch = useDispatch();

  // Local state
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  // On mount, fetch comments and set up socket connection
  useEffect(() => {
    fetchComments();
    setupSocketConnection();

    return () => {
      disconnectSocket();
    };
  }, [roomId]);

  // When Redux comments update, update local state
  useEffect(() => {
    setComments(commentsFromState);
  }, [commentsFromState]);

  const fetchComments = async () => {
    await dispatch(getCommentsForRoom(roomId));
  };

  const handleNewComment = (newCommentData) => {
    if (newCommentData.user._id !== currentUserId) {
      setComments(prevComments => [newCommentData, ...prevComments]);
    }
  };

  const handleDeleteCommentFromSocket = ({ commentId }) => {
    setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
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

  const handleCommentSubmit = async () => {
    if (newComment.trim() !== '') {
      // Create a temporary comment to show immediately
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

      setComments(prevComments => [tempComment, ...prevComments]);
      setNewComment('');

      try {
        const response = await dispatch(createComment({ content: newComment, room_id: roomId }));
        if (response && response.success) {
          // Replace temp comment with the one returned from the server
          setComments(prevComments =>
            prevComments.map(comment =>
              comment._id === tempComment._id ? response.comment : comment
            )
          );
        } else {
          // Remove temp comment on failure
          setComments(prevComments => prevComments.filter(comment => comment._id !== tempComment._id));
        }
      } catch (error) {
        setComments(prevComments => prevComments.filter(comment => comment._id !== tempComment._id));
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));

    try {
      const response = await dispatch(deleteComment(commentId));
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

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ background: '#2D3A4A', borderRadius: '0.3em', p: '20px' }}>
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}

        {loading ? (
          <LinearProgress color="error" />
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2
            }}
          >
            <TextField
              color="error"
              label="Reply"
              variant="filled"
              fullWidth
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
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
              color="error"
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
                bgcolor: isDarkMode ? '#3b3140' : '#f5f5f5',
                borderRadius: 1
              }}
            >
              <Box sx={{ mr: 2 }}>
                <Tooltip title={comment.user.username}>
                  <Box
                    component="a"
                    onClick={() => handleOpenPlayerModal(comment.user._id)}
                    sx={{ cursor: 'pointer' }}
                    className="player"
                  >
                    <Avatar
                      src={comment.user.avatar}
                      user_id={comment.user._id}
                      username={comment.user.username}
                      rank={comment.user.totalWagered}
                      accessory={comment.user.accessory}
                      alt=""
                      darkMode={isDarkMode}
                      className="avatar"
                    />
                  </Box>
                </Tooltip>
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 'bold', fontSize: '0.8em' }}
                  >
                    {comment.user.username}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6em' }} color="text.secondary">
                    {Moment(comment.created_at).fromNow()}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, fontSize: '0.7em' }}>
                  {comment.content}
                </Typography>
              </Box>
              {comment.user._id === currentUserId && (
                <IconButton
                  onClick={() => handleDeleteComment(comment._id)}
                  aria-label="delete"
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon sx={{ fontSize: '18px' }} />
                </IconButton>
              )}
            </Box>
          ))
        )}
      </Box>
    </ThemeProvider>
  );
};

export default Comments;