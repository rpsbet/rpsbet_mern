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
import { formatDistanceToNow, parse } from 'date-fns';
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
          mt: 2,
          background: 'rgba(30, 30, 30, 0.3)', // Glassmorphism semi-transparent background
          backdropFilter: 'blur(15px)', // Blur effect
          WebkitBackdropFilter: 'blur(15px)', // Safari support
          border: '1px solid rgba(255, 255, 255, 0.1)', // Subtle border
          borderRadius: '0.3em', // Original border radius
          p: '20px', // Original padding
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', // Depth shadow
          '@supports not (backdrop-filter: blur(15px))': {
            background: 'rgba(30, 30, 30, 0.6)', // Fallback
          },
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
          variant="h6"
          sx={{
            fontWeight: 600,
            color: '#ffffff',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FontAwesomeIcon icon={faPenSquare} />
          Share Your Feedback
        </Typography>

        {loading ? (
          <LinearProgress color="error" />
        ) : (
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 2,
              }}
            >
              <TextField
                color="error"
                label="Share your thoughts or suggestions!"
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
                sx={{
                  mr: 2,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 1,
                  '& .MuiFilledInput-root': {
                    color: '#ffffff',
                    '&:before': {
                      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover:before': {
                      borderBottomColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              />
              <Button
                onClick={handleCommentSubmit}
                variant="contained"
                startIcon={<FontAwesomeIcon icon={faPenSquare} />}
                color="error"
                sx={{
                  textTransform: 'none',
                  borderRadius: 1,
                  '&:hover': {
                    background: '#FF0000',
                    boxShadow: '0 4px 16px rgba(211, 47, 47, 0.3)',
                  },
                }}
              >
                <Typography variant="button">Post</Typography>
              </Button>
            </Box>
            <FormHelperText sx={{ color: '#e0e0e0', mb: 2 }}>
              Hosts can use our AI tools to improve their games based your feedback!
            </FormHelperText>
            <Typography variant="body2" sx={{ color: '#b0b0b0', fontStyle: 'italic' }}>
              Example prompts:
              <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                <li>"Could we add more levels?"</li>
                <li>"The UI is great, but the text is hard to read."</li>
                <li>"Can we reduce the odds and increase multipliers?"</li>
              </ul>
            </Typography>
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
                sx={{ mb: 1, borderRadius: 1 }}
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
              color: '#999',
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
                mb: 2,
                p: 2,
                bgcolor: 'rgba(255, 255, 255, 0.05)', // Glassmorphic comment background
                borderRadius: 1,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                },
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
                      elite={comment.user.elite}
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
                    sx={{ fontWeight: 'bold', fontSize: '0.8em', color: '#ffffff' }}
                  >
                    {comment.user.username}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.6em', color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {formatDistanceToNow(parse(comment.created_at, 'dd-MM-yyyy HH:mm', new Date()), { addSuffix: true })}


                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, fontSize: '0.7em', color: '#e0e0e0' }}>
                  {comment.content}
                </Typography>
              </Box>
              {comment.user._id === currentUserId && (
                <IconButton
                  onClick={() => handleDeleteComment(comment._id)}
                  aria-label="delete"
                  sx={{
                    ml: 1,
                    color: '#ff4d4d',
                    '&:hover': {
                      background: 'rgba(255, 77, 77, 0.1)',
                    },
                  }}
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