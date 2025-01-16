import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, ButtonBase } from '@material-ui/core';
import { Info } from '@mui/icons-material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SettingsRef from '../../components/SettingsRef';

const GameSettingsPanel = ({
  ai_mode,
  user,
  rank,
  strategies,
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
    <div style={{ marginTop: '20px', marginBottom: '30px' }}>
      <h3 className="game-sub-title roll-tag">
        Choose Strategy&nbsp;
        <Tooltip
          title="Select the strategy your game will use. AI offers patterns and reasoning, while RNG is randomized."
          placement="top"
        >
          <Info style={{ cursor: 'pointer', float: 'right' }} />
        </Tooltip>
      </h3>

      <div
        className="qs-game-type-panel"
        style={{
          marginTop: '20px',
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
          user_id={user._id}
          rank={rank}
          settingsRef={settingsRef}
          isDarkMode={isDarkMode}
        />
       <ButtonBase
          onClick={handleSettingsIconClick}
          style={{
            boxShadow: 'unset',
            color: isDarkMode ? 'white' : 'inherit', // Conditional color
            borderRadius: '30px',
            padding: '0 20px', // Added padding
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.3s ease', // Smooth transition for color changes
          }}
        >
          <span style={{ textTransform: 'uppercase', marginRight: '5px' }}>{selectedStrategy}</span>
          <SettingsOutlinedIcon style={{ color: isDarkMode ? 'white' : 'inherit' }} />
        </ButtonBase>
      </div>
    </div>
  );
};

export default GameSettingsPanel;