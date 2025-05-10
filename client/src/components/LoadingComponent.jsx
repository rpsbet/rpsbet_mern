import React from 'react';
import { Box, Typography } from '@mui/material';
import Lottie from 'react-lottie';
import { motion } from 'framer-motion';
import cat from '../game_panel/LottieAnimations/blob.json';
import { useSelector } from 'react-redux';

function LoadingComponent() {
  const isLowGraphics = useSelector((state) => state.auth.isLowGraphics);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%', // Or a specific height depending on your layout
        width: '100%',
        p: 8 // Or a specific width
      }}
    >
      {/* Cat Lottie Animation */}
      {!isLowGraphics && (
      <Box sx={{ filter: 'invert(1) scale(-1)', width: '120px', height: '120px' }}>
        <Lottie
          options={{
            loop: isLowGraphics ? false : true,
            autoplay: isLowGraphics ? false : true,
            animationData: cat,
            rendererSettings: {
              preserveAspectRatio: 'xMidYMid slice'
            }
          }}
        />
      </Box>
      )}

      {/* Loading Text */}
      <Typography
        variant="h6"
        sx={{
          color: '#fff',
          fontWeight: 500,
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
          mb: 1,
          mt: 2, // Add some margin top for spacing
        }}
      >
        Loading...
      </Typography>

      {/* Pulsing Dots */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.2
            }}
          >
            <Box
              sx={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#FF0000',
              }}
            />
          </motion.div>
        ))}
      </Box>
    </Box>
  );
}

export default LoadingComponent;