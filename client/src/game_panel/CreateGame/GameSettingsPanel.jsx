import React from 'react';
import { Box, ButtonBase } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const GameSettingsPanel = ({
  isDarkMode,
}) => {
  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
      <ButtonBase
        style={{
          position: "relative",
          borderRadius: "4px",
          padding: "10px 15px",
          display: "flex",
          height: '100%',
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.3s ease",
          minWidth: "160px",
          cursor: "pointer",
          color: isDarkMode ? "white" : "black",
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            flexGrow: 1,
          }}
        >
          Generate
        </span>

        <AutoAwesomeIcon
          sx={{
            p: 0.6,
            color: isDarkMode ? "white" : "black",
          }}
        />
      </ButtonBase>
    </Box>
  );
};

export default GameSettingsPanel;