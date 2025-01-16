import React, { useState } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import {
  setDarkMode,
  setNotificationsAllowed,
  toggleMute,
  toggleMusic,
  toggleLowGraphics,
  toggleGameSounds,
  toggleNotificationSounds,
  toggleClickounds,
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
    border: 'none',
  },
};

const SettingsModal = ({
  modalIsOpen,
  closeModal,
  isMuted,
  isLowGraphics,
  isDarkMode,
  isNotificationsAllowed,
  toggleLowGraphics,
  setDarkMode,
  toggleMute,
  toggleMusic,
  setNotificationsAllowed,
  isMusicEnabled,
  clickSounds,
  gameSounds,
  notificationSounds,
  toggleClickounds,
  toggleGameSounds,
  toggleNotificationSounds,
}) => {
  const [showSubSettings, setShowSubSettings] = useState(false);

  const handleMuteToggle = () => {
    toggleMute(!isMuted);
    toggleClickounds(!isMuted);
    toggleGameSounds(!isMuted);
    toggleNotificationSounds(!isMuted);
  };

  const toggleSubSettingsVisibility = () => {
    setShowSubSettings((prev) => !prev);
  };

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Settings Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">Settings</h2>
          <Button className="btn-close title" onClick={closeModal}>
            ×
          </Button>
        </div>

        <div className="modal-body edit-modal-body">
          <div className="modal-content-wrapper">
            <div className="modal-content-panel settings">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      {isMuted ? (
                        <Button onClick={handleMuteToggle}>
                          <VolumeOff />&nbsp; UNMUTE
                        </Button>
                      ) : (
                        <Button onClick={handleMuteToggle}>
                          <VolumeUp />&nbsp; MUTE
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={toggleSubSettingsVisibility}>
                        {showSubSettings ? <Remove /> : <Add />}
                      </IconButton>
                      <Checkbox checked={isMuted} onChange={handleMuteToggle} />
                    </TableCell>
                  </TableRow>

                  {showSubSettings && (
                    <>
                      <TableRow>
                        <TableCell>
                          <Button onClick={() => toggleClickounds(!clickSounds)}>
                            {clickSounds ? <VolumeMute /> : <VolumeDown />}
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
                          <Button onClick={() => toggleGameSounds(!gameSounds)}>
                            {gameSounds ? <VolumeMute /> : <VolumeDown />}
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
                            onClick={() =>
                              toggleNotificationSounds(!notificationSounds)
                            }
                          >
                            {notificationSounds ? (
                              <VolumeMute />
                            ) : (
                              <VolumeDown />
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

                  <TableRow>
                    <TableCell>
                      {isLowGraphics ? (
                        <Button onClick={() => toggleLowGraphics(!isLowGraphics)}>
                          <EcoOutlined />&nbsp; LOW GRAPHICS
                        </Button>
                      ) : (
                        <Button onClick={() => toggleLowGraphics(!isLowGraphics)}>
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
};

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  isNotificationsAllowed: state.auth.isNotificationsAllowed,
  isMuted: state.auth.isMuted,
  clickSounds: state.auth.clickSounds,
  gameSounds: state.auth.gameSounds,
  notificationSounds: state.auth.notificationSounds,
  isMusicEnabled: state.auth.isMusicEnabled,
  isLowGraphics: state.auth.isLowGraphics,
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

export default connect(mapStateToProps, mapDispatchToProps)(SettingsModal);