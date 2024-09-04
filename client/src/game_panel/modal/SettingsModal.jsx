import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import {
  setDarkMode,
  setNotificationsAllowed,
  toggleMute,
  toggleMusic,
  toggleLowGraphics,
  toggleGameSounds,
  toggleNotificationSounds,
  toggleClickounds
} from '../../redux/Auth/user.actions';
import {
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  IconButton,
} from '@material-ui/core';
import {
  MusicNote,
  MusicOff,
  Brightness7,
  Brightness4,
  NotificationsActive,
  NotificationsOff,
  VolumeUp,
  VolumeOff,
  Eco,
  EcoOutlined,
  VolumeMute,
  VolumeDown,
  Add,
  Remove,
} from '@material-ui/icons';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0,
    border: 'none'
  },
};

const styles = (theme) => ({
  root: {
    width: '150px',
    padding: '8px 15px',
    fontSize: '16px',
    background: '#191a1d',
  },
  dropdownStyle: {},
});

class SettingsModal extends Component {
  state = {
    showSubSettings: false, // New state for toggling sub-settings visibility
  };

  // Handle the parent mute/unmute toggle
  handleMuteToggle = () => {
    const { isMuted, toggleMute, toggleClickounds, toggleGameSounds, toggleNotificationSounds, clickSounds, gameSounds, notificationSounds } = this.props;

    // Toggle the main mute state
    toggleMute(!isMuted);

    // If muting, mute all sub-settings; if unmuting, unmute all
    if (isMuted) {
      toggleClickounds(false);
      toggleGameSounds(false);
      toggleNotificationSounds(false);
    } else {
      toggleClickounds(true);
      toggleGameSounds(true);
      toggleNotificationSounds(true);
    }
  };

  // Toggle the visibility of sub-settings
  toggleSubSettingsVisibility = () => {
    this.setState((prevState) => ({
      showSubSettings: !prevState.showSubSettings,
    }));
  };

  render() {
    const {
      isMuted,
      isLowGraphics,
      isDarkMode,
      isNotificationsAllowed,
      toggleLowGraphics,
      setDarkMode,
      toggleMusic,
      setNotificationsAllowed,
      isMusicEnabled,
      clickSounds,
      gameSounds,
      notificationSounds,
      toggleClickounds,
      toggleGameSounds,
      toggleNotificationSounds,
    } = this.props;

    const { showSubSettings } = this.state;

    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Settings Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">Settings</h2>
            <Button className="btn-close title" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>

          <div className="modal-body edit-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel settings">
                <Table>
                  <TableBody>
                     {/* <TableRow>
                      <TableCell>
                        {isMusicEnabled ? (
                          <Button
                            className="playBtn"
                            onClick={(e) => {
                              toggleMusic(!isMusicEnabled);
                            }}
                          >
                            <MusicNote />&nbsp;
                            MUSIC
                          </Button>
                        ) : (
                          <Button
                            className="playBtn"
                            onClick={(e) => {
                              toggleMusic(!isMusicEnabled);
                            }}
                          >
                            <MusicOff />&nbsp;
                            NO MUSIC
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={isMusicEnabled}
                          onChange={() => toggleMusic(!isMusicEnabled)}
                        />
                      </TableCell>
                    </TableRow> */}
                    {/* Parent Mute/Unmute Control */}
                    <TableRow>
                      <TableCell>
                        {isMuted ? (
                          <Button
                            className="playBtn"
                            onClick={this.handleMuteToggle}
                          >
                            <VolumeOff />&nbsp; UNMUTE
                          </Button>
                        ) : (
                          <Button
                            className="playBtn"
                            onClick={this.handleMuteToggle}
                          >
                            <VolumeUp />&nbsp; MUTE
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={this.toggleSubSettingsVisibility}
                        >
                          {showSubSettings ? <Remove /> : <Add />}
                        </IconButton>
                        <Checkbox
                          checked={isMuted}
                          onChange={this.handleMuteToggle}
                        />
                      </TableCell>
                    </TableRow>

                    {/* Sub-settings for Mute */}
                    {showSubSettings && (
                      <>
                        <TableRow>
                          <TableCell>
                            <Button
                              className="playBtn subsetting"
                              onClick={() => toggleClickounds(!clickSounds)}
                            >
                              {!clickSounds ? (
                                <VolumeDown />
                              ) : (
                                <VolumeMute />
                              )}
                              &nbsp; Typing & Clicks
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={clickSounds}
                              onChange={() => toggleClickounds(!clickSounds)}
                            />
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>
                            <Button
                              className="playBtn subsetting"
                              onClick={() => toggleGameSounds(!gameSounds)}
                            >
                              {!gameSounds ? (
                                <VolumeDown />
                              ) : (
                                <VolumeMute />
                              )}
                              &nbsp; Game Sounds
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={gameSounds}
                              onChange={() => toggleGameSounds(!gameSounds)}
                            />
                          </TableCell>
                        </TableRow>

                        <TableRow>
                          <TableCell>
                            <Button
                              className="playBtn subsetting"
                              onClick={() =>
                                toggleNotificationSounds(!notificationSounds)
                              }
                            >
                              {!notificationSounds ? (
                                <VolumeDown />
                              ) : (
                                <VolumeMute />
                              )}
                              &nbsp; Notifications
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={notificationSounds}
                              onChange={() =>
                                toggleNotificationSounds(!notificationSounds)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      </>
                    )}

                    {/* Other Settings */}
                    <TableRow>
                      <TableCell>
                        {isLowGraphics ? (
                          <Button
                            onClick={() => toggleLowGraphics(!isLowGraphics)}
                          >
                            <EcoOutlined />&nbsp; LOW GRAPHICS
                          </Button>
                        ) : (
                          <Button
                            onClick={() => toggleLowGraphics(!isLowGraphics)}
                          >
                            <Eco />&nbsp; HIGH GRAPHICS
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={isLowGraphics}
                          onChange={() => toggleLowGraphics(!isLowGraphics)}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        {isDarkMode ? (
                          <Button onClick={() => setDarkMode(!isDarkMode)}>
                            <Brightness4 />&nbsp; DARK MODE
                          </Button>
                        ) : (
                          <Button onClick={() => setDarkMode(!isDarkMode)}>
                            <Brightness7 />&nbsp; LIGHT MODE
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={isDarkMode}
                          onChange={() => setDarkMode(!isDarkMode)}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        {isNotificationsAllowed ? (
                          <Button
                            onClick={() =>
                              setNotificationsAllowed(!isNotificationsAllowed)
                            }
                          >
                            <NotificationsActive />&nbsp; NOTIFICATIONS ON
                          </Button>
                        ) : (
                          <Button
                            onClick={() =>
                              setNotificationsAllowed(!isNotificationsAllowed)
                            }
                          >
                            <NotificationsOff />&nbsp; NOTIFICATIONS OFF
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={isNotificationsAllowed}
                          onChange={() =>
                            setNotificationsAllowed(!isNotificationsAllowed)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
  user_id: state.auth.user._id,
  isDarkMode: state.auth.isDarkMode,
  isNotificationsAllowed: state.auth.isNotificationsAllowed,
  isMuted: state.auth.isMuted,
  clickSounds: state.auth.clickSounds,
  gameSounds: state.auth.gameSounds,
  notificationSounds: state.auth.notificationSounds,
  isMusicEnabled: state.auth.isMusicEnabled,
  isLowGraphics: state.auth.isLowGraphics,
  loading: state.customerReducer.loading,
});

const mapDispatchToProps = {
  toggleMute,
  toggleClickounds,
  toggleNotificationSounds,
  toggleGameSounds,
  toggleMusic,
  toggleLowGraphics,
  setDarkMode,
  setNotificationsAllowed,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(SettingsModal));
