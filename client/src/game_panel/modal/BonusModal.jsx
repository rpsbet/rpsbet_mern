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


class BonusModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      spinning: false,
      rotation: 0,
      landedNumber: null,
      showFlash: false,
      translateDistance: window.innerWidth <= 600 ? '100px' : '120px'

    };
    this.spinWheel = this.spinWheel.bind(this);
  }
  componentDidMount() {
    window.addEventListener('resize', this.handleResize);

  }

  componentWillUnmount() {
    // Clean up event listener
    window.removeEventListener('resize', this.handleResize);
  }
  handleResize = () => {
    // Update translate distance based on window width
    this.setState({
      translateDistance: window.innerWidth <= 600 ? '100px' : '120px'
    });
  };

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

    if (!this.props.isMuted || !this.props.gameSounds) {
      const audio = new Audio('/sounds/wheel.mp3');
      audio.play();
    }

    setTimeout(async () => {
      const landedNumber = await this.props.addBonus();
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
    const numbers = [50, 1, 10, 3, 25, 1, 5, 15, 5, 2];
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
            <h2 className="modal-title title"> <FontAwesomeIcon icon={faStar} />&nbsp;CORN WHEEL</h2>
            <img style={{ transform: "rotate(167deg) scaleY(-1) translate(10px, 7px) rotate(5deg)", width: "40px", zIndex: 0 }} src="../img/icons/corn.svg" />

            <Button className="btn-close title" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>

          <div className="modal-body edit-modal-body" style={{ background: 'radial-gradient(rgb(50 16 206), #a000ff)', overflowY: 'scroll', overflowX: 'hidden' }}>
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <div style={{ textAlign: 'center', padding: '5px', border: '3px solid #f9f9f9', borderRadius: '4px', background: 'linear-gradient(0deg, rgb(57 40 167), rgba(202, 185, 141, 0.45))', margin: '0 0 20px', }}>

                  <span style={{ color: 'rgb(222, 226, 230)' }}><FontAwesomeIcon icon={faClock} />&nbsp;Next Corn Arrives...</span>
                  <h5 style={{ color: "#ffb000" }}>{remainingTime}</h5>
                </div>
                <div className="wheel" style={{ transform: `rotate(${this.state.rotation}deg)`, overflow: 'hidden' }}>
                  {numbers.map((number, index) => {
                    const rotation = (index / numbers.length) * 360;
                    return (
                      <div
                        key={index}
                        className="number"
                        style={{
                          transform: `rotate(${rotation}deg) translate(${this.state.translateDistance}) rotate(-${rotation}deg)`
                        }}
                      >
                        {number}
                      </div>
                    );
                  })}
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
                disabled={this.state.spinning || totalWagered < 9410}
              >
                {totalWagered < 9410 ? 'UNLOCK AT RANK 12' : (
                  <>
                    SPIN!&nbsp;<FontAwesomeIcon icon={faSyncAlt} /> <img style={{ transform: "rotate(167deg) scaleY(-1) translate(10px, 7px) rotate(5deg)", width: "40px", zIndex: 0 }} src="../img/icons/corn.svg" />
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
  gameSounds: state.auth.gameSounds,
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
