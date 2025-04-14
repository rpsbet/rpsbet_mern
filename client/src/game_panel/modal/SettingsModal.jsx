import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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

const modalBoxStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: '#0a0a0a', // Purple background
  color: '#fff',
  boxShadow: 24,
  borderRadius: 1,
  p: 3,
  width: 500,
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const SettingsModal = ({ modalIsOpen, closeModal }) => {
  const dispatch = useDispatch();

  // Retrieve Redux state via useSelector
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const isNotificationsAllowed = useSelector((state) => state.auth.isNotificationsAllowed);
  const isMuted = useSelector((state) => state.auth.isMuted);
  const clickSounds = useSelector((state) => state.auth.clickSounds);
  const gameSounds = useSelector((state) => state.auth.gameSounds);
  const notificationSounds = useSelector((state) => state.auth.notificationSounds);
  const isMusicEnabled = useSelector((state) => state.auth.isMusicEnabled);
  const isLowGraphics = useSelector((state) => state.auth.isLowGraphics);

  const [showSubSettings, setShowSubSettings] = useState(false);

  const handleMuteToggle = () => {
    dispatch(toggleMute(!isMuted));
    dispatch(toggleClickounds(!isMuted));
    dispatch(toggleGameSounds(!isMuted));
    dispatch(toggleNotificationSounds(!isMuted));
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
            background: '#080808',
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
                <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton color="error" onClick={toggleSubSettingsVisibility}>
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
                        onClick={() => dispatch(toggleGameSounds(!gameSounds))}
                        sx={{ textTransform: 'none' }}
                      >
                        {gameSounds ? <VolumeMute /> : <VolumeDown />} &nbsp; GAME SOUNDS
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        color="error"
                        checked={gameSounds}
                        onChange={() => dispatch(toggleGameSounds(!gameSounds))}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Button
                        color="error"
                        onClick={() => dispatch(toggleNotificationSounds(!notificationSounds))}
                        sx={{ textTransform: 'none' }}
                      >
                        {notificationSounds ? <VolumeMute /> : <VolumeDown />} &nbsp; NOTIFICATIONS
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        color="error"
                        checked={notificationSounds}
                        onChange={() => dispatch(toggleNotificationSounds(!notificationSounds))}
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
                      onClick={() => dispatch(toggleLowGraphics(!isLowGraphics))}
                      sx={{ textTransform: 'none' }}
                    >
                      <EnergySavingsLeaf /> &nbsp; LOW GRAPHICS
                    </Button>
                  ) : (
                    <Button
                      color="error"
                      onClick={() => dispatch(toggleLowGraphics(!isLowGraphics))}
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
                    onChange={() => dispatch(toggleLowGraphics(!isLowGraphics))}
                  />
                </TableCell>
              </TableRow>

              {/* Notifications */}
              <TableRow>
                <TableCell>
                  {isNotificationsAllowed ? (
                    <Button
                      color="error"
                      onClick={() => dispatch(setNotificationsAllowed(!isNotificationsAllowed))}
                      sx={{ textTransform: 'none' }}
                    >
                      <NotificationsActive /> &nbsp; NOTIFICATIONS ON
                    </Button>
                  ) : (
                    <Button
                      color="error"
                      onClick={() => dispatch(setNotificationsAllowed(!isNotificationsAllowed))}
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
                    onChange={() => dispatch(setNotificationsAllowed(!isNotificationsAllowed))}
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

export default SettingsModal;