import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import Avatar from './Avatar';

function GuessesSection({ prevRps, players, isDarkMode, handleOpenPlayerModal }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      alignItems="flex-start"
      sx={{
        border: 'none',
        position: 'absolute',
        left: 15,
        top: 0,
      }}
    >
      {prevRps.map((guessItem, i) => {
        // Attempt to match the i-th player
        const player = players[i];

        return (
          <Stack
            key={i}
            direction="column"
            spacing={1}
            alignItems="center"
            sx={{ border: 'none' }}
          >
            {/* Display the guess on top */}
            <Typography
              variant="body2"
              sx={{
                backgroundColor: '#ff000044',
                border: '2px solid var(--secondary-color)',
                padding: '2px 10px',
                borderRadius: '0.3em',
                color: 'var(--secondary-color)',
                opacity: 0.6,
              }}
            >
              {guessItem.rps || guessItem.qs}
            </Typography>

            {/* Conditionally display the player avatar below if we have a matching player */}
            {/* {player && (
              <Box
                sx={{
                  opacity: 0.4,
                  width: 29,
                  cursor: 'pointer',
                }}
                onClick={() => handleOpenPlayerModal(player._id)}
              >
                <Avatar
                  className="avatar"
                  user_id={player._id}
                  src={player.avatar}
                  rank={player.totalWagered}
                  username={player.username}
                  accessory={player.accessory}
                  alt=""
                  darkMode={isDarkMode}
                />
              </Box>
            )} */}
          </Stack>
        );
      })}
    </Stack>
  );
}

export default GuessesSection;