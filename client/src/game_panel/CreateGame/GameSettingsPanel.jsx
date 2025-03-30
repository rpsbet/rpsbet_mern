import React, { useState, useRef, useEffect } from 'react';
import { Box, ButtonBase } from '@mui/material';
import { Info } from '@mui/icons-material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsRef from '../../components/SettingsRef';

const GameSettingsPanel = ({
  ai_mode,
  user,
  rank,
  strategies,
  prompt,
  onChangeState,
  selectedStrategy,
  setSelectedStrategy,
  gameCode,
  setGameCode,
  gameMode,
  setGameMode,
  initializeGameType,
  setGameModeLocal,
  setSelectedGameType,
  isDarkMode,
}) => {
  // State to manage the visibility of the settings panel
  const [settingsPanelOpened, setSettingsPanelOpened] = useState(false);
  // Ref to detect clicks outside the settings panel
  const settingsRef = useRef(null);

  // Toggle the settings panel visibility
  const handleSettingsIconClick = () => {
    setGameMode('Custom');
    setSelectedGameType(9);
    setGameModeLocal('Custom');
    initializeGameType('custom');
    setSettingsPanelOpened((prev) => !prev);
  };

  // Close the settings panel if clicked outside
  const handleClickOutside = (e) => {
    if (settingsRef.current && !settingsRef.current.contains(e.target)) {
      setSettingsPanelOpened(false);
    }
  };

  // Add event listener for clicks outside when the panel is open
  useEffect(() => {
    if (settingsPanelOpened) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [settingsPanelOpened]);

  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>

      <SettingsRef
        strategies={strategies}
        selectedStrategy={selectedStrategy}
        setSelectedStrategy={setSelectedStrategy}
        gameCode={gameCode}
        setGameCode={setGameCode}
        settings_panel_opened={settingsPanelOpened}
        ai_mode={ai_mode}
        creator_prompt={prompt}
        onChangeState={onChangeState}
        user_id={user._id}
        user_balance={user.balance}
        rank={rank}
        settingsRef={settingsRef}
        isDarkMode={isDarkMode}
      />
      <ButtonBase
        onClick={handleSettingsIconClick}
        style={{
          position: "relative",
          border: gameMode === "Custom" ? "3px solid #ffd000" : `none`,
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
        }}
      >
        <span
          style={{
            flexGrow: 1,
          }}
        >
          {gameMode === "Custom" ? "Custom" : "Generate"}
        </span>

        <AutoAwesomeIcon
          sx={{
            p: 0.6,
            color: isDarkMode ? "white" : "black",
            transform: settingsPanelOpened ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        />
      </ButtonBase>
    </Box>
  );
};

export default GameSettingsPanel;