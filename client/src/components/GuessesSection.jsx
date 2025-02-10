import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import Avatar from './Avatar';


function GuessesSection({ prevRps, players, isDarkMode, handleOpenPlayerModal }) {
  // The lesser of the two array lengths
  const minLength = Math.min(prevRps.length, players.length);

  return (
    <Stack 
      direction="row" 
      spacing={2}
      // Optional: center or left-align, depending on your design
      justifyContent="center" 
      alignItems="flex-start"
      sx={{ border: 'none', position: 'absolute', left: 15, top: 0,  }}
    >
      {Array.from({ length: minLength }).map((_, i) => {
        const guessItem = prevRps[i];
        const player = players[i];
        
        return (
          <Stack
            key={i}
            direction="column"
            spacing={1}
            alignItems="center"
            sx={{
              // You can tweak these styles as you like
              border: 'none',
            }}
          >
            {/* Guess on top */}
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
              {guessItem.rps || guessItem.qs }
            </Typography>

            {/* Player underneath */}
            {player && (
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
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

export default GuessesSection;
