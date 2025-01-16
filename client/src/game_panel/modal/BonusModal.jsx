import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faClock, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { addBonus, getUser } from '../../redux/Auth/user.actions';
import { Button } from '@material-ui/core';
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
    border: 'none',
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

function BonusModal(props) {
  const {
    classes,
    modalIsOpen,
    closeModal,
    isDarkMode,
    totalWagered,
    solPrice,
    user,
    addBonus,
    getUser,
    isMuted,
    gameSounds,
  } = props;

  // -----------------------------
  // State
  // -----------------------------
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [landedNumber, setLandedNumber] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const [translateDistance, setTranslateDistance] = useState(
    window.innerWidth <= 600 ? '100px' : '120px'
  );

  // -----------------------------
  // Lifecycle (componentDidMount / componentWillUnmount)
  // -----------------------------
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleResize = useCallback(() => {
    setTranslateDistance(window.innerWidth <= 600 ? '100px' : '120px');
  }, []);

  const spinWheel = useCallback(async () => {
    if (spinning) return;

    // Random rotation between 360° and 720°
    const randomRotation = Math.floor(Math.random() * 360) + 360;
    setSpinning(true);
    setRotation(randomRotation);
    setLandedNumber(null);
    setShowFlash(false);

    // Play sound if not muted
    if (!isMuted || !gameSounds) {
      const audio = new Audio('/sounds/wheel.mp3');
      audio.play().catch(() => {
        // Catch the play() promise rejection if user hasn't interacted with the page
      });
    }

    // Dispatch bonus action
    const result = await addBonus();
    setSpinning(false);
    setLandedNumber(result.amount);
    setShowFlash(true);

    // Refresh user data
    await getUser(true, 5);

    // Remove flash effect after a short delay
    setTimeout(() => setShowFlash(false), 1500);
  }, [spinning, isMuted, gameSounds, addBonus, getUser]);

  const formatNumber = (number) => {
    if (number >= 1000000) {
      return number / 1000000 + 'M';
    } else if (number >= 1000) {
      return number / 1000 + 'K';
    }
    return number;
  };

  // -----------------------------
  // Bonus Timing / Wheel Content
  // -----------------------------
  const numbers = [0.04, 0, 0.01, 0.03, 0.3, 0, 0.2, 0.1, 0.05, 0.02];

  const lastBonus = user.last_bonus ? new Date(user.last_bonus) : null;
  const now = new Date();
  let remainingTime = null;
  if (lastBonus) {
    const elapsedTime = Moment(now).diff(Moment(lastBonus), 'milliseconds');
    const sixHoursInMilliseconds = 6 * 60 * 60 * 1000;
    const remainingMilliseconds = sixHoursInMilliseconds - elapsedTime;

    remainingTime =
      remainingMilliseconds > 0
        ? Moment.duration(remainingMilliseconds, 'milliseconds').humanize(true)
        : 'READY NOW!';
  }

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Settings Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">
            <FontAwesomeIcon icon={faStar} />
            &nbsp;CORN WHEEL
          </h2>
          <img
            style={{
              transform: 'rotate(167deg) scaleY(-1) translate(10px, 7px) rotate(5deg)',
              width: '40px',
              zIndex: 0,
            }}
            src="../img/icons/corn.svg"
            alt="corn"
          />

          <Button className="btn-close title" onClick={closeModal}>
            ×
          </Button>
        </div>

        <div
          className="modal-body edit-modal-body"
          style={{
            background: 'radial-gradient(rgb(50 16 206), #a000ff)',
            overflowY: 'scroll',
            overflowX: 'hidden',
          }}
        >
          <div className="modal-content-wrapper">
            <div className="modal-content-panel">
              <div
                style={{
                  textAlign: 'center',
                  padding: '5px',
                  border: '3px solid #f9f9f9',
                  borderRadius: '4px',
                  background:
                    'linear-gradient(0deg, rgb(57 40 167), rgba(202, 185, 141, 0.45))',
                  margin: '0 0 20px',
                }}
              >
                <span style={{ color: 'rgb(222, 226, 230)' }}>
                  <FontAwesomeIcon icon={faClock} />
                  &nbsp;Next Corn Arrives...
                </span>
                <h5 style={{ color: '#ff8500' }}>{remainingTime}</h5>
              </div>

              {/* The wheel */}
              <div
                className="wheel"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  overflow: 'hidden',
                }}
              >
                {numbers.map((number, index) => {
                  const rotationDeg = (index / numbers.length) * 360;
                  return (
                    <div
                      key={index}
                      className="number"
                      style={{
                        transform: `rotate(${rotationDeg}deg) translate(${translateDistance}) rotate(-${rotationDeg}deg)`,
                      }}
                    >
                      {formatNumber(number)}
                    </div>
                  );
                })}
                <img width="200px" src="../img/bonus.svg" alt="Bonus" />
              </div>
            </div>
          </div>

          {landedNumber !== null ? (
            <div className={`spin-result ${showFlash ? 'flash' : ''}`}>
              {landedNumber} SOL ({convertToCurrency(landedNumber, solPrice)})
            </div>
          ) : (
            <Button
              className="spin-button"
              onClick={spinWheel}
              disabled={spinning || totalWagered < 9410}
            >
              {totalWagered < 9410 ? (
                'UNLOCK AT RANK 12'
              ) : (
                <>
                  SPIN FOR 0.01 SOL! ({convertToCurrency(0.01, solPrice)})&nbsp;
                  <FontAwesomeIcon icon={faSyncAlt} />
                  <img
                    style={{
                      transform:
                        'rotate(167deg) scaleY(-1) translate(10px, 7px) rotate(5deg)',
                      width: '40px',
                      zIndex: 0,
                    }}
                    src="../img/icons/corn.svg"
                    alt="corn"
                  />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
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
  solPrice: state.logic.solPrice,
  loading: state.customerReducer.loading,
  user: state.auth.user,
});

const mapDispatchToProps = {
  addBonus,
  getUser,
};

// Keep using connect + withStyles to preserve existing logic
export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(BonusModal)
);