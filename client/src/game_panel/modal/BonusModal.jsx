import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faClock,
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons';

import {
  addBonus,
  getUser
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
import { convertToCurrency } from '../../util/conversion';

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


class BonusModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      spinning: false,
      rotation: 0,
      landedNumber: null,
      showFlash: false,
    };
    this.spinWheel = this.spinWheel.bind(this);
  }
  componentDidMount() {
  }

  checkBonusTime() {
    const lastBonus = this.props.user.last_bonus ? new Date(this.props.user.last_bonus) : null;
    const now = new Date();

    // Check if last_bonus is within the last 24 hours or if last_bonus is null
    if (!lastBonus || now - lastBonus < 6 * 60 * 60 * 1000) {
      this.setState({ showBonusModal: true });
    }

  }

  async spinWheel() {
    if (this.state.spinning) return; // Prevent multiple spins at the same time

    const randomRotation = Math.floor(Math.random() * 360) + 360; // At least 10 full rotations
    this.setState({ spinning: true, rotation: randomRotation, landedNumber: null, showFlash: false });

    if (!this.props.isMuted) {
      const audio = new Audio('/sounds/wheel.mp3');
      audio.play();
    }

    setTimeout(async() => {
      const landedNumber = await this.props.addBonus();
      console.log("landedNumber", landedNumber)
      this.setState({ spinning: false, landedNumber: landedNumber.amount, showFlash: true }, async () => {
        await this.props.getUser(true, 5);
      });

      // Remove the flash effect after it's done
      setTimeout(() => this.setState({ showFlash: false }), 1500); // 3 flashes, 0.5s each
    }, 4000);

  }


  render() {
    const {
      isMuted,
      isLowGraphics,
      isDarkMode,
      totalWagered,
      toggleMute,
      toggleLowGraphics,
      setDarkMode,
      toggleMusic,
      setNotificationsAllowed,
      isMusicEnabled,
      loading,
    } = this.props;
    const numbers = [1.25, 0.20, 0.10, 0.4, 2.50, 1, 0.50, 1.5, 5, 2];
    // const markerStyle = {
    //   transform: `rotate(180deg)`,
    // };
    const lastBonus = this.props.user.last_bonus ? new Date(this.props.user.last_bonus) : null;
    const now = new Date();
    let remainingTime = null;

    if (lastBonus) {
      const elapsedTime = Moment(now).diff(Moment(lastBonus), 'milliseconds');
      const sixHoursInMilliseconds = 6 * 60 * 60 * 1000;
      const remainingMilliseconds = sixHoursInMilliseconds - elapsedTime;

      if (remainingMilliseconds > 0) {
        remainingTime = Moment.duration(remainingMilliseconds, 'milliseconds').humanize(true);
      } else {
        remainingTime = "READY NOW!";
      }
    }
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Settings Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title"> <FontAwesomeIcon icon={faStar} />&nbsp;RPS BONUS WHEEL</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>

          <div className="modal-body edit-modal-body" style={{ background: 'radial-gradient(#001339, #5dabf0)', overflowY: 'scroll', overflowX: 'hidden' }}>
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <div style={{ textAlign: 'center', padding: '5px', border: '3px solid #28a745', borderRadius: '4px', background: 'linear-gradient(0deg, #28a745, #cab98d73)', margin: '0 0 20px', }}>

                  <span style={{ color: '#dee2e6' }}><FontAwesomeIcon icon={faClock} />&nbsp;Next Bonus Arrives...</span>
                  <h2 style={{ color: "#212529" }}>{remainingTime}</h2>
                </div>
                <div className="wheel" style={{ transform: `rotate(${this.state.rotation}deg)`, overflow: 'hidden' }}>
                  {numbers.map((number, index) => (
                    <div
                      key={index}
                      className="number"
                      style={{
                        transform: `rotate(${(index / numbers.length) * 360}deg) translate(130px) rotate(-${(index / numbers.length) * 360}deg)`,
                      }}
                    >
                      {number}
                    </div>
                  ))}
                  <img width="200px" src={'../img/bonus.svg'} alt="Bonus" />

                </div>
                {/* <div className="marker" style={markerStyle}></div> */}

              </div>

            </div>
            {this.state.landedNumber !== null ? (
              <div className={`spin-result ${this.state.showFlash ? 'flash' : ''}`}>
                {convertToCurrency(this.state.landedNumber)}
              </div>
            ) : (
              <Button
                className="spin-button"
                onClick={this.spinWheel}
                disabled={this.state.spinning || totalWagered < 250}
              >
                {totalWagered < 250 ? 'RANK TOO LOW' : (
                  <>
                    SPIN!&nbsp;<FontAwesomeIcon icon={faSyncAlt} />
                  </>
                )}
              </Button>

            )}
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
  user_id: state.auth.user._id,
  totalWagered: state.auth.user.totalWagered,
  isDarkMode: state.auth.isDarkMode,
  isNotificationsAllowed: state.auth.isNotificationsAllowed,
  isMuted: state.auth.isMuted,
  isMusicEnabled: state.auth.isMusicEnabled,
  isLowGraphics: state.auth.isLowGraphics,
  loading: state.customerReducer.loading
});

const mapDispatchToProps = {
  addBonus,
  getUser
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(BonusModal));
