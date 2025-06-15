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
  Tooltip,
  FormHelperText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCommentsForRoom, createComment, deleteComment } from '../redux/Logic/logic.actions';
import Avatar from './Avatar';
import PlayerModal from '../game_panel/modal/PlayerModal';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenSquare } from '@fortawesome/free-solid-svg-icons';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../config/theme.js';

const Comments = ({ roomId }) => {
  // Redux state
  const commentsFromState = useSelector((state) => state.logic.comments);
  const loading = useSelector((state) => state.logic.isActiveLoadingOverlay);
  const currentUserId = useSelector((state) => state.auth.user._id);
  const currentUsername = useSelector((state) => state.auth.user.username);
  const currentUserAvatar = useSelector((state) => state.auth.user.avatar);
  const currentUserAccessory = useSelector((state) => state.auth.user.accessory);
  const currentUserElite = useSelector((state) => state.auth.user.elite);
  const currentUserTotalWagered = useSelector((state) => state.auth.user.totalWagered);
  const socket = useSelector((state) => state.auth.socket);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);

  const dispatch = useDispatch();

  // Local state
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  // Fetch comments and set up socket on mount
  useEffect(() => {
    fetchComments();
    setupSocketConnection();

    return () => {
      disconnectSocket();
    };
  }, [roomId]);

  // Update local comments when Redux state changes
  useEffect(() => {
    setComments(commentsFromState);
  }, [commentsFromState]);

  const fetchComments = async () => {
    await dispatch(getCommentsForRoom(roomId));
  };

  const handleNewComment = (newCommentData) => {
    if (newCommentData.user._id !== currentUserId) {
      setComments((prevComments) => [newCommentData, ...prevComments]);
    }
  };

  const handleDeleteCommentFromSocket = ({ commentId }) => {
    setComments((prevComments) => prevComments.filter((comment) => comment._id !== commentId));
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
      const tempComment = {
        _id: `temp-${Date.now()}`,
        content: newComment,
        room: roomId,
        user: {
          _id: currentUserId,
          username: currentUsername,
          avatar: currentUserAvatar,
          accessory: currentUserAccessory,
          elite: currentUserElite,
          totalWagered: currentUserTotalWagered,
        },
        created_at: new Date().toISOString(),
      };

      setComments((prevComments) => [tempComment, ...prevComments]);
      setNewComment('');

      try {
        const response = await dispatch(createComment({ content: newComment, room_id: roomId }));
        if (response && response.success) {
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment._id === tempComment._id ? response.comment : comment
            )
          );
        } else {
          setComments((prevComments) =>
            prevComments.filter((comment) => comment._id !== tempComment._id)
          );
        }
      } catch (error) {
        setComments((prevComments) =>
          prevComments.filter((comment) => comment._id !== tempComment._id)
        );
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    setComments((prevComments) => prevComments.filter((comment) => comment._id !== commentId));

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
      <Box
        sx={{
          padding: '16px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}

        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: '#ffffff',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '0.9rem',
          }}
        >
          <FontAwesomeIcon icon={faPenSquare} style={{ fontSize: '14px' }} />
          Share Your Feedback
        </Typography>

        {loading ? (
          <LinearProgress color="error" sx={{ height: 2, borderRadius: 1 }} />
        ) : (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'flex-start',
                mb: 1,
              }}
            >
              <TextField
                label="Share your thoughts..."
                variant="outlined"
                fullWidth
                size="small"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCommentSubmit();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff0000',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#fff',
                    fontSize: '0.85rem',
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.85rem',
                  },
                }}
              />
              <Button
                onClick={handleCommentSubmit}
                variant="contained"
                color="error"
                size="small"
                sx={{
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 2,
                  py: 1,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: '#d32f2f',
                  },
                }}
              >
                Post
              </Button>
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.7rem',
                display: 'block',
                mb: 1,
              }}
            >
              Hosts can use our AI tools to improve their games based on your feedback!
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.65rem',
                fontStyle: 'italic',
              }}
            >
              Example: "Could we add more levels?" or "Can we reduce the odds?"
            </Typography>
          </Box>
        )}

        {loading ? (
          <Box>
            {[...Array(3)].map((_, index) => (
              <Box
                key={index}
                sx={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  mb: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width="60%" height={16} />
                </Box>
                <Skeleton variant="text" width="80%" height={14} sx={{ mt: 0.5 }} />
              </Box>
            ))}
          </Box>
        ) : comments.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              mt: 2,
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic',
            }}
          >
            Be the first to share your feedback!
          </Typography>
        ) : (
          comments.map((comment) => (
            <Box
              key={comment._id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                mb: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.03)',
                },
              }}
            >
              <Box sx={{ mr: 1.5 }}>
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
                      elite={comment.user.elite}
                      alt=""
                      darkMode={isDarkMode}
                      className="avatar"
                      sx={{
                        width: 24,
                        height: 24,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    />
                  </Box>
                </Tooltip>
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      color: '#ffffff',
                    }}
                  >
                    {comment.user.username}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    {comment.created_at
                      ? formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true })
                      : 'N/A'}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                  }}
                >
                  {comment.content}
                </Typography>
              </Box>
              {comment.user._id === currentUserId && (
                <IconButton
                  onClick={() => handleDeleteComment(comment._id)}
                  aria-label="delete"
                  size="small"
                  sx={{
                    ml: 1,
                    color: '#ff0000',
                    width: 24,
                    height: 24,
                    '&:hover': {
                      background: 'rgba(255, 0, 0, 0.1)',
                    },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: '14px' }} />
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