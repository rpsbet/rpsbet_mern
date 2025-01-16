// LikeDislikeView.js
import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import VisibilityIcon from '@mui/icons-material/Visibility';

export const LikeDislikeView = ({ row, user, handleLike, handleDislike, handleView }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2, // Space between each section
      }}
    >
      {/* Views Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => handleView(row)} // Assuming handleView is triggered on click
      >
        <VisibilityIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
        <Typography variant="body1">
          {row.views?.length || 0}
        </Typography>
      </Box>

      {/* Battles Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => handleView(row)} // Assuming handleView is triggered on click
      >
        <VisibilityIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
        <Typography variant="body1">
          {row.battles?.length || 0}
        </Typography>
      </Box>

      {/* Likes Section */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={() => handleLike(row)}
          size="small"
          aria-label="like"
        >
          {row.likes?.includes(user.id) ? (
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
        <Typography variant="body1">
          {row.likes?.length || 0}
        </Typography>
      </Box>

      {/* Dislikes Section */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={() => handleDislike(row)}
          size="small"
          aria-label="dislike"
        >
          {row.dislikes?.includes(user.id) ? (
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
        <Typography variant="body1">
          {row.dislikes?.length || 0}
        </Typography>
      </Box>
    </Box>
  );
};