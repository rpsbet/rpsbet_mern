import React, { useState } from 'react';
import { connect } from 'react-redux';

import {
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  IconButton,
  Modal,
  Box,
  Typography,
} from '@mui/material';

import {
  MusicNote,
  MusicOff,
  Brightness7,
  Brightness4,
  NotificationsActive,
  NotificationsOff,
  VolumeUp,
  VolumeOff,
  EnergySavingsLeaf,
  EnergySavingsLeafOutlined,
  VolumeMute,
  VolumeDown,
  Add,
  Remove,
  Settings,
} from '@mui/icons-material';

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

// ------------------ MUI Modal Styles ------------------
const modalBoxStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: '#1f1a25', // Purple background
  color: '#fff',
  boxShadow: 24,
  borderRadius: 1,
  p: 3,
  width: 500,
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto',
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
      open={modalIsOpen || false}
      onClose={closeModal}
      sx={{ zIndex: 1300 }}
      BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
    >
      <Box sx={modalBoxStyle}>
        {/* HEADER */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ m: 0, fontWeight: 'bold' }}>
            <Settings sx={{ mr: 1 }} />
            SETTINGS
          </Typography>
          <Button variant="text" color="error" onClick={closeModal}>
            ×
          </Button>
        </Box>

        {/* BODY */}
        <Box
          sx={{
            background: 'rgba(170, 170, 170, 0.06)',
            borderRadius: '0.3em',
            p: '20px',
          }}
        >
          <Table>
            <TableBody>
              {/* Mute / Unmute */}
              <TableRow>
                <TableCell>
                  {isMuted ? (
                    <Button
                      color="error"
                      onClick={handleMuteToggle}
                      sx={{ textTransform: 'none' }}
                    >
                      <VolumeOff /> &nbsp; UNMUTE
                    </Button>
                  ) : (
                    <Button
                      color="error"
                      onClick={handleMuteToggle}
                      sx={{ textTransform: 'none' }}
                    >
                      <VolumeUp /> &nbsp; MUTE
                    </Button>
                  )}
                </TableCell>
                <TableCell
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <IconButton
                    color="error"
                    onClick={toggleSubSettingsVisibility}
                  >
                    {showSubSettings ? <Remove /> : <Add />}
                  </IconButton>
                  <Checkbox
                    color="error"
                    checked={isMuted}
                    onChange={handleMuteToggle}
                  />
                </TableCell>
              </TableRow>

              {/* Sub-settings for sounds */}
              {showSubSettings && (
                <>
                  <TableRow>
                    <TableCell>
                      <Button
                        color="error"
                        onClick={() => toggleGameSounds(!gameSounds)}
                        sx={{ textTransform: 'none' }}
                      >
                        {gameSounds ? <VolumeMute /> : <VolumeDown />} &nbsp;
                        GAME SOUNDS
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        color="error"
                        checked={gameSounds}
                        onChange={() => toggleGameSounds(!gameSounds)}
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>
                      <Button
                        color="error"
                        onClick={() =>
                          toggleNotificationSounds(!notificationSounds)
                        }
                        sx={{ textTransform: 'none' }}
                      >
                        {notificationSounds ? <VolumeMute /> : <VolumeDown />}
                        &nbsp; NOTIFICATIONS
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        color="error"
                        checked={notificationSounds}
                        onChange={() =>
                          toggleNotificationSounds(!notificationSounds)
                        }
                      />
                    </TableCell>
                  </TableRow>
                </>
              )}

              {/* Graphics */}
              <TableRow>
                <TableCell>
                  {isLowGraphics ? (
                    <Button
                      color="error"
                      onClick={() => toggleLowGraphics(!isLowGraphics)}
                      sx={{ textTransform: 'none' }}
                    >
                      <EnergySavingsLeaf /> &nbsp; LOW GRAPHICS
                    </Button>
                  ) : (
                    <Button
                      color="error"
                      onClick={() => toggleLowGraphics(!isLowGraphics)}
                      sx={{ textTransform: 'none' }}
                    >
                      <EnergySavingsLeafOutlined /> &nbsp; HIGH GRAPHICS
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Checkbox
                    color="error"
                    checked={isLowGraphics}
                    onChange={() => toggleLowGraphics(!isLowGraphics)}
                  />
                </TableCell>
              </TableRow>

              {/* <TableRow>
              <TableCell>
                {isDarkMode ? (
                  <Button color='error' onClick={() => setDarkMode(!isDarkMode)} sx={{ textTransform: 'none' }}>
                    <Brightness4 /> &nbsp; DARK MODE
                  </Button>
                ) : (
                  <Button color='error' onClick={() => setDarkMode(!isDarkMode)} sx={{ textTransform: 'none' }}>
                    <Brightness7 /> &nbsp; LIGHT MODE
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <Checkbox color='error' checked={isDarkMode} onChange={() => setDarkMode(!isDarkMode)} />
              </TableCell>
            </TableRow> */}

              {/* Notifications */}
              <TableRow>
                <TableCell>
                  {isNotificationsAllowed ? (
                    <Button
                      color="error"
                      onClick={() =>
                        setNotificationsAllowed(!isNotificationsAllowed)
                      }
                      sx={{ textTransform: 'none' }}
                    >
                      <NotificationsActive /> &nbsp; NOTIFICATIONS ON
                    </Button>
                  ) : (
                    <Button
                      color="error"
                      onClick={() =>
                        setNotificationsAllowed(!isNotificationsAllowed)
                      }
                      sx={{ textTransform: 'none' }}
                    >
                      <NotificationsOff /> &nbsp; NOTIFICATIONS OFF
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Checkbox
                    color="error"
                    checked={isNotificationsAllowed}
                    onChange={() =>
                      setNotificationsAllowed(!isNotificationsAllowed)
                    }
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Modal>
  );
};

// ------------------ REDUX CONNECT ------------------
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
