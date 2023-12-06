import React, { useState, useRef } from 'react';
import {
  Button,
  Tabs,
  Tab,
  Grid,
  createTheme,
  ThemeProvider,
  FormControlLabel,
  Switch
} from '@material-ui/core';
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
    <Tab icon={<TableChartOutlinedIcon />} />
    <Tab icon={<TuneOutlinedIcon />} />
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
      <SettingsOutlinedIcon
        id="btn-rps-settings"
        onClick={handleSettingsIconClick}
      />
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
  isDarkMode
}) {
  const [settings_panel_opened, setSettingsPanelOpened] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [timerValue, setTimerValue] = useState(2000);
  const stored_bet_array = JSON.parse(localStorage.getItem(arrayName)) || [];
  const settingsRef = useRef(null);
  const handleClearLocalStorage = () => {
    localStorage.removeItem(arrayName);
    window.location.reload();
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
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
        <SettingsOutlinedIcon
          id="btn-rps-settings"
          onClick={handleSettingsIconClick}
        />
        {selectedTab === 0 && (
          <div className="gamified-container">
            <Grid item xs={12} sm={6}>
              <h2 className="gamified-heading">AI Prompt Box</h2>
              <div className="gamified-content">
                <div className="bet-array-grid">
                  {stored_bet_array.map((item, index) => (
                    <div key={index} className="array-item">
                      {Object.keys(item).map((propertyName, propIndex) => (
                        <div key={propIndex}>
                          {`${
                            !isNaN(parseFloat(item[propertyName]))
                              ? parseFloat(item[propertyName]).toFixed(4)
                              : item[propertyName]
                          }`}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {stored_bet_array.length > 0 && (
                <div className="button-container">
                  <Button
                    className="clear-storage-btn"
                    onClick={handleClearLocalStorage}
                  >
                    Reset
                  </Button>
                </div>
              )}
              {stored_bet_array.length === 0 && (
                <div className="no-data-msg">Play normally to train the AI</div>
              )}
            </Grid>
          </div>
        )}
        {selectedTab === 1 && (
          <>
            <div className="gamified-container">
              <FormControlLabel
                control={
                  <Switch
                    id="aiplay-switch"
                    checked={betting}
                    onChange={handleSwitchChange}
                  />
                }
                label={betting ? 'AI ON' : 'AI OFF'}
              />
              {betting ? (
                <div id="stop">
                  <Lottie options={defaultOptions} width={22} />
                </div>
              ) : (
                <div>
                  {timerValue !== 2000 ? (
                    <span>{(timerValue / 2000).toFixed(2)}s</span>
                  ) : null}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default BetArray;
