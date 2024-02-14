import React, { useState, useRef } from 'react';
import {
  Button,
  Tabs,
  Tab,
  Grid,
  createTheme,
  ThemeProvider,
  FormControlLabel,
  Switch,
  IconButton
} from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faTrash } from '@fortawesome/free-solid-svg-icons';

import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import TableChartOutlinedIcon from '@material-ui/icons/TableChartOutlined';
import TuneOutlinedIcon from '@material-ui/icons/TuneOutlined';
import Lottie from 'react-lottie';
import animationData from '../game_panel/LottieAnimations/spinningIcon.json';
import { alertModal } from '../game_panel/modal/ConfirmAlerts';

const theme = createTheme({
  overrides: {
    MuiTabs: {
      indicator: {
        backgroundColor: '#ff0000'
      }
    }
  }
});

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

const SideTabs = ({ selectedTab, handleTabChange }) => (
  <Tabs
    orientation="vertical"
    // variant="fullWidth"
    value={selectedTab}
    onChange={handleTabChange}
    className={`side-tab-switcher`}
  >
    <Tab icon={<TuneOutlinedIcon />} />
    <Tab icon={<TableChartOutlinedIcon />} />
  </Tabs>
);

const SettingsRef = ({ settingsRef, settings_panel_opened }) => (
  <div
    ref={settingsRef}
    className={`transaction-settings ${settings_panel_opened ? 'active' : ''}`}
  >
    <h5>AI Play Settings</h5>
    <p>CHOOSE AN ALGORITHM</p>
    <div className="tiers">
      <table>
        <tbody>
          <tr>
            <td>Speed</td>
            <td>
              <div className="bar" style={{ width: '100%' }}></div>
            </td>
            <td>
              <div className="bar" style={{ width: '100%' }}></div>
            </td>
            <td>
              <div className="bar" style={{ width: '80%' }}></div>
            </td>
          </tr>
          <tr>
            <td>Reasoning</td>
            <td>
              <div className="bar" style={{ width: '50%' }}></div>
            </td>
            <td>
              <div className="bar" style={{ width: '0%' }}></div>
            </td>
            <td>
              <div className="bar" style={{ width: '0%' }}></div>
            </td>
          </tr>
          <tr>
            <td>Abilities</td>
            <td>
              <div className="bar" style={{ width: '30%' }}></div>
            </td>
            <td>
              <div className="bar" style={{ width: '0%' }}></div>
            </td>
            <td>
              <div className="bar" style={{ width: '0%' }}></div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="slippage-select-panel">
        <Button
          // className={this.state.slippage === 100 ? 'active' : ''}
          onClick={() => {
            // this.setState({ slippage: 100 });
          }}
        >
          Markov
        </Button>
        <Button
          // className="disabled"
          // className={this.state.slippage === 200 ? 'active' : ''}
          onClick={() => {
            // this.setState({ slippage: 200 });
          }}
        >
          Carlo
        </Button>
        <Button
          // className="disabled"
          // className={this.state.slippage === 500 ? 'active' : ''}
          onClick={() => {
            // this.setState({ slippage: 500 });
          }}
        >
          Q Bot
        </Button>
      </div>
    </div>
  </div>
);

const PlaceholderComponent = ({
  selectedTab,
  handleTabChange,
  handleSettingsIconClick,
  settingsRef,
  settings_panel_opened
}) => (
  <ThemeProvider theme={theme}>
    <div style={{ position: 'relative' }}>
      <SettingsRef
        settings_panel_opened={settings_panel_opened}
        settingsRef={settingsRef}
        handleSettingsIconClick={handleSettingsIconClick}
      />
      <SideTabs selectedTab={selectedTab} handleTabChange={handleTabChange} />
      {/* <SettingsOutlinedIcon
        id="btn-rps-settings"
        onClick={handleSettingsIconClick}
      /> */}
      {selectedTab === 0 && (
        <div className="gamified-container">
          Join a room to use AI Model Markov!
        </div>
      )}
      {selectedTab === 1 && (
        <div className="gamified-container">
          Join a room to use AI Model Markov!
        </div>
      )}
    </div>
  </ThemeProvider>
);

function BetArray({
  arrayName,
  label,
  betting,
  handleSwitchChange,
  isDarkMode,
  game_type
}) {
  const [settings_panel_opened, setSettingsPanelOpened] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [timerValue, setTimerValue] = useState(2000);
  const stored_bet_array = JSON.parse(localStorage.getItem(arrayName)) || [];
  const filteredArray = game_type === 'Quick Shoot' ? stored_bet_array.filter(item => item.qs !== undefined) : stored_bet_array;
  const settingsRef = useRef(null);
  const handleClearLocalStorage = () => {
    localStorage.removeItem(arrayName);
    window.location.reload();
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getPositionLetter = (position) => {
    switch (position) {
      case 0:
        return 'P';
      case 1:
        return 'q';
      case 2:
        return 'w';
      case 3:
        return 'e';
      case 4:
        return 'r';
      default:
        return '';
    }
  };


  const handleSettingsIconClick = () => {
    setSettingsPanelOpened(!settings_panel_opened);
  };

  const handleTimerValueChange = newValue => {
    setTimerValue(newValue);
  };

  if (
    typeof betting === 'undefined' ||
    typeof handleSwitchChange === 'undefined' ||
    typeof stored_bet_array === 'undefined'
  ) {
    // alertModal(isDarkMode, "22");
    return (
      <PlaceholderComponent
        handleSettingsIconClick={handleSettingsIconClick}
        handleTabChange={handleTabChange}
        selectedTab={selectedTab}
        settingsRef={settingsRef}
        settings_panel_opened={settings_panel_opened}
      />
    );
  }


  return (
    <ThemeProvider theme={theme}>
      <div style={{ position: 'relative' }}>
        <SettingsRef
          settings_panel_opened={settings_panel_opened}
          settingsRef={settingsRef}
          handleSettingsIconClick={handleSettingsIconClick}
        />
        <SideTabs selectedTab={selectedTab} handleTabChange={handleTabChange} />
        {selectedTab === 0 && (
          <div className="gamified-container">
            {( (game_type === 'Roll' || game_type === 'Blackjack' || game_type === 'Bang!') && 
                           <div style={{height: "80px", display: "flex", justifyContent: "centrer", alignItems: "center", textAlign: "center"}} className="coming-soon-text"><h4>Coming soon!</h4></div>

            )}
            <FormControlLabel
              control={
                <Switch
                  id="aiplay-switch"
                  checked={betting}
                  onChange={handleSwitchChange}
                  disabled={game_type === 'Roll' || game_type === 'Blackjack' || game_type === 'Bang!'}

                />
              }
              label={betting ? 'AI ON' : 'AI OFF'}
            />
            {betting ? (
              <div id="stop">
                <Lottie options={defaultOptions} width={32} />
              </div>
            ) : (
              <div>
                {timerValue !== 2000 ? (
                  <span>{(timerValue / 2000).toFixed(2)}s</span>
                ) : null}
              </div>
            )}
          </div>
        )}
        {selectedTab === 1 && (
          <>
            <div className="gamified-container">
              <Grid item xs={12} sm={6}>
                {game_type === 'Roll' ? (
                <div style={{height: "80px", display: "flex", justifyContent: "centrer", alignItems: "center", textAlign: "center"}} className="coming-soon-text"><h4>Coming soon!</h4></div>
              ) : (
                <>
                <h2 className="gamified-heading">AI Prompt Box</h2>
                <div className="gamified-content">
                  <div className="bet-array-grid">
                    {filteredArray.map((item, index) => (
                      <div key={index} className="array-item">
                        {game_type === 'Brain Game' ? (
                          <div>
                            {parseInt(item.score)}
                          </div>
                        ) : (
                          <div>
                            {game_type === 'Quick Shoot' && item.qs !== undefined ? (
                              <div>{getPositionLetter(item.qs)}</div>
                            ) : (
                              Object.keys(item).map((propertyName, propIndex) => (
                                <div key={propIndex}>
                                  {`${!isNaN(parseFloat(item[propertyName]))
                                    ? parseFloat(item[propertyName]).toFixed(4)
                                    : item[propertyName]
                                    }`}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                  </div>
                </div>
              
                {filteredArray.length > 0 && (
                  <div className="button-container">
                    <IconButton className="clear-storage-btn"
                      onClick={handleClearLocalStorage} style={{ padding: "0 5px", background: "transparent", boxShadow: "none", color: 'white' }}  >
                      <FontAwesomeIcon style={{ width: "14px", height: "14px" }} icon={faTrash} /> {/* Use the faRedo icon */}
                    </IconButton>
                  </div>
                )}
                {filteredArray.length === 0 && (
                  <div className="no-data-msg">Play normally to train the AI</div>
                )}
            </>
            )}
              </Grid>
            </div>
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default BetArray;
