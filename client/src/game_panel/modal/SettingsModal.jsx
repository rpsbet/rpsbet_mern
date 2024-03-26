import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import {
  setDarkMode,
  setNotificationsAllowed,
  toggleMute,
  toggleMusic,
  toggleLowGraphics
} from '../../redux/Auth/user.actions';
import {
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
} from '@material-ui/core';
import {
  Close,
  MusicNote,
  MusicOff,
  Brightness7,
  Brightness4,
  NotificationsActive,
  NotificationsOff,
  VolumeUp,
  VolumeOff,
  Eco,
  EcoOutlined
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
  state = {};

  componentDidMount() { }

  render() {
    const {
      isMuted,
      isLowGraphics,
      isDarkMode,
      isNotificationsAllowed,
      toggleMute,
      toggleLowGraphics,
      setDarkMode,
      toggleMusic,
      setNotificationsAllowed,
      isMusicEnabled,
      loading,
    } = this.props;

    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Settings Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title">Settings</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>

          <div className="modal-body edit-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <Table>
                  <TableBody>
                    <TableRow>
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
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        {isMuted ? (
                          <Button
                            className="playBtn"
                            onClick={(e) => {
                              toggleMute(!isMuted);
                            }}
                          >
                            <VolumeOff />&nbsp;
                            UNMUTE
                          </Button>
                        ) : (
                          <Button
                            className="playBtn"
                            onClick={(e) => {
                              toggleMute(!isMuted);
                            }}
                          >
                            <VolumeUp />&nbsp;
                            MUTE
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={isMuted}
                          onChange={() => toggleMute(!isMuted)}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        {isLowGraphics ? (
                          <Button onClick={e => {
                            toggleLowGraphics(!isLowGraphics);
                          }}>
                            <EcoOutlined />&nbsp;
                            LOW GRAPHICS
                          </Button>
                        ) : (
                          <Button onClick={e => {
                            toggleLowGraphics(!isLowGraphics);
                          }}>
                            <Eco />&nbsp;
                            HIGH GRAPHICS
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
                          <Button onClick={e => {
                            setDarkMode(!isDarkMode);
                          }}>
                            <Brightness4 />&nbsp;
                            DARK MODE
                          </Button>
                        ) : (
                          <Button onClick={e => {
                            setDarkMode(!isDarkMode);
                          }}>
                            <Brightness7 />&nbsp;
                            LIGHT MODE
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
                          <Button onClick={e => {
                            setNotificationsAllowed(!isNotificationsAllowed);
                          }}>
                            <NotificationsActive />&nbsp;
                            ALLOW NOTIFICATIONS
                          </Button>
                        ) : (
                          <Button onClick={e => {
                            setNotificationsAllowed(!isNotificationsAllowed);
                          }}>
                            <NotificationsOff />&nbsp;
                            DON'T ALLOW NOTIFICATIONS
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={isNotificationsAllowed}
                          onChange={() => setNotificationsAllowed(!isNotificationsAllowed)}
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
  isMusicEnabled: state.auth.isMusicEnabled,
  isLowGraphics: state.auth.isLowGraphics,
  loading: state.customerReducer.loading
});

const mapDispatchToProps = {
  toggleMute,
  toggleMusic,
  toggleLowGraphics,
  setDarkMode,
  setNotificationsAllowed,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(SettingsModal));
