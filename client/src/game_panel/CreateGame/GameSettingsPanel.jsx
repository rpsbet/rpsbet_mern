import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, ButtonBase } from '@mui/material';
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
  isDarkMode,
}) => {
  // State to manage the visibility of the settings panel
  const [settingsPanelOpened, setSettingsPanelOpened] = useState(false);
  // Ref to detect clicks outside the settings panel
  const settingsRef = useRef(null);

  // Toggle the settings panel visibility
  const handleSettingsIconClick = () => {
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
    <div>

      <div
        className="qs-game-type-panel"
        style={{
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        <SettingsRef
          strategies={strategies}
          selectedStrategy={selectedStrategy}
          setSelectedStrategy={setSelectedStrategy}
          settings_panel_opened={settingsPanelOpened} // Pass the internal state
          ai_mode={ai_mode}
          creator_prompt={prompt}
          onChangeState={onChangeState}
          user_id={user._id}
          rank={rank}
          settingsRef={settingsRef}
          isDarkMode={isDarkMode}
        />
        <ButtonBase
          onClick={handleSettingsIconClick}
          style={{
            position: "relative",
            backgroundColor: isDarkMode ? "#333" : "#fff", // Background color
            border: `1px solid ${isDarkMode ? "#888" : "#ccc"}`, // Border to mimic dropdown
            borderRadius: "4px", // Slight rounding for a dropdown feel
            padding: "10px 15px", // More padding for a dropdown look
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between", // Space between text and icon
            transition: "all 0.3s ease", // Smooth transition for hover
            minWidth: "160px", // Ensuring it looks like a dropdown
            cursor: "pointer", // Cursor change on hover
            color: isDarkMode ? "white" : "black", // Text color
          }}
        >
          <span
            style={{
              textTransform: "uppercase",
              fontSize: "0.85em",
              flexGrow: 1, // Allows text to take up available space
            }}
          >
            {selectedStrategy}
          </span>

          {/* ▼ Dropdown indicator */}
          <AutoAwesomeIcon
            sx={{
              p: 0.6,
              color: isDarkMode ? "white" : "black",
              transform: settingsPanelOpened ? "rotate(180deg)" : "rotate(0deg)", // Rotate when open
              transition: "transform 0.3s ease", // Smooth transition for arrow rotation
            }}
          />
        </ButtonBase>
      </div>
    </div>
  );
};

export default GameSettingsPanel;