import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

export const LikeDislikeView = ({ row, user, handleLike, handleDislike }) => {
  const [localLikes, setLocalLikes] = useState(row.likes || []);
  const [localDislikes, setLocalDislikes] = useState(row.dislikes || []);
  // This state is the key to the solution
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setLocalLikes(row.likes || []);
    setLocalDislikes(row.dislikes || []);
  }, [row.likes, row.dislikes]);

  const onLike = async (event) => {
    event.stopPropagation();
    if (isProcessing) return; // Prevent clicks while processing

    const userId = user._id;

    const newLikes = isLiked
      ? localLikes.filter(id => id !== userId)
      : [...localLikes, userId];
    const newDislikes = localDislikes.filter(id => id !== userId);

    setLocalLikes(newLikes);
    setLocalDislikes(newDislikes);
    setIsProcessing(true); // <-- Set processing to true

    try {
      await handleLike(row);
    } catch (error) {
      setLocalLikes(row.likes || []);
      setLocalDislikes(row.dislikes || []);
      console.error('Like action failed:', error);
    } finally {
      setIsProcessing(false); // <-- Set back to false in a `finally` block
    }
  };

  const onDislike = async (event) => {
    event.stopPropagation();
    if (isProcessing) return; // Prevent clicks while processing

    const userId = user._id;
    const isDisliked = localDislikes.includes(userId);

    const newDislikes = isDisliked
      ? localDislikes.filter(id => id !== userId)
      : [...localDislikes, userId];
    const newLikes = localLikes.filter(id => id !== userId);

    setLocalDislikes(newDislikes);
    setLocalLikes(newLikes);
    setIsProcessing(true); // <-- Set processing to true

    try {
      await handleDislike(row);
    } catch (error) {
      setLocalLikes(row.likes || []);
      setLocalDislikes(row.dislikes || []);
      console.error('Dislike action failed:', error);
    } finally {
      setIsProcessing(false); // <-- Set back to false in a `finally` block
    }
  };

  // Calculate percentages for progress bar
  const totalVotes = localLikes.length + localDislikes.length;
  const likesPercentage = totalVotes > 0 ? (localLikes.length / totalVotes) * 100 : 0;
  const dislikesPercentage = totalVotes > 0 ? (localDislikes.length / totalVotes) * 100 : 0;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* Likes Section */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={onLike}
          size="small"
          aria-label="like"
          disabled={isProcessing}
          sx={{ opacity: isProcessing ? 0.6 : 1 }}
        >
          {localLikes.includes(user._id) ? (
            <Typography
              variant="body2"
              component="span"
              role="img"
              aria-label="Thumbs up"
            >
              👍
            </Typography>
          ) : (
            <ThumbUpIcon sx={{ fontSize: '1rem' }} />
          )}
        </IconButton>
        <Typography variant="body1">{localLikes.length}</Typography>
      </Box>

      {/* Progress Bar */}
      {totalVotes > 0 && (
        <Tooltip title={`${likesPercentage.toFixed(1)}% likes, ${dislikesPercentage.toFixed(1)}% dislikes`}>
          <Box sx={{
            display: 'flex',
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            overflow: 'hidden',
            bgcolor: '#e0e0e0', // Light gray background for empty state
            alignSelf: 'center'
          }}>
            {/* Likes portion */}
            <Box
              sx={{
                width: `${likesPercentage}%`,
                bgcolor: '#4CAF50', // Green for likes
                height: '100%',
                transition: 'width 0.3s ease'
              }}
            />
            {/* Dislikes portion */}
            <Box
              sx={{
                width: `${dislikesPercentage}%`,
                bgcolor: '#F44336', // Red for dislikes
                height: '100%',
                transition: 'width 0.3s ease'
              }}
            />
          </Box>
        </Tooltip>
      )}

      {/* Dislikes Section */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={onDislike}
          size="small"
          aria-label="dislike"
        >
          {localDislikes.includes(user._id) ? (
            <Typography
              variant="body2"
              component="span"
              role="img"
              aria-label="Thumbs down"
            >
              👎
            </Typography>
          ) : (
            <ThumbDownIcon sx={{ fontSize: '1rem' }} />
          )}
        </IconButton>
        <Typography variant="body1">{localDislikes.length}</Typography>
      </Box>
    </Box>
  );
};

export default LikeDislikeView;