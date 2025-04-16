import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

export const LikeDislikeView = ({ row, user, handleLike, handleDislike }) => {
  // Local state for optimistic updates
  const [localLikes, setLocalLikes] = useState(row.likes || []);
  const [localDislikes, setLocalDislikes] = useState(row.dislikes || []);

  // Sync local state with row props when they change (e.g., Redux update)
  useEffect(() => {
    setLocalLikes(row.likes || []);
    setLocalDislikes(row.dislikes || []);
  }, [row.likes, row.dislikes]);

  // Handle like with optimistic update
  const onLike = (event) => {
    event.stopPropagation();
    const userId = user._id;
    const isLiked = localLikes.includes(userId);

    // Optimistic update
    setLocalLikes(
      isLiked
        ? localLikes.filter(id => id !== userId) // Unlike
        : [...localLikes, userId] // Like
    );
    setLocalDislikes(localDislikes.filter(id => id !== userId)); // Remove from dislikes

    // Dispatch backend request and revert on failure
    handleLike(row).catch(() => {
      setLocalLikes(row.likes || []);
      setLocalDislikes(row.dislikes || []);
    });
  };

  // Handle dislike with optimistic update
  const onDislike = (event) => {
    event.stopPropagation();
    const userId = user._id;
    const isDisliked = localDislikes.includes(userId);

    // Optimistic update
    setLocalDislikes(
      isDisliked
        ? localDislikes.filter(id => id !== userId) // Undislike
        : [...localDislikes, userId] // Dislike
    );
    setLocalLikes(localLikes.filter(id => id !== userId)); // Remove from likes

    // Dispatch backend request and revert on failure
    handleDislike(row).catch(() => {
      setLocalLikes(row.likes || []);
      setLocalDislikes(row.dislikes || []);
    });
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