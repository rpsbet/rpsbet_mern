import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Modal,
  Box,
  Typography,
  Button
} from '@mui/material';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faClock, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

import { addBonus, getUser } from '../../redux/Auth/user.actions';
import { convertToCurrency } from '../../util/conversion';
import history from '../../redux/history';

function BonusModal(props) {
  const {
    modalIsOpen,
    closeModal,
    totalWagered,
    solPrice,
    user,
    addBonus,
    getUser,
    isMuted,
    gameSounds
  } = props;

  // ------------------ STATE ------------------
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [landedNumber, setLandedNumber] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const [translateDistance, setTranslateDistance] = useState(
    window.innerWidth <= 600 ? '100px' : '120px'
  );

  // ------------------ DATA ------------------
  // The numbers displayed on the wheel
  const numbers = [0.04, 0, 0.01, 0.03, 0.3, 0, 0.2, 0.1, 0.05, 0.02];

  // Calculate next bonus time
  const lastBonus = user?.last_bonus ? new Date(user.last_bonus) : null;
  const now = new Date();
  let remainingTime = 'READY NOW!';
  if (lastBonus) {
    const elapsedTime = Moment(now).diff(Moment(lastBonus), 'milliseconds');
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    const remainingMs = sixHoursInMs - elapsedTime;
    if (remainingMs > 0) {
      remainingTime = Moment
        .duration(remainingMs, 'milliseconds')
        .humanize(true);
    }
  }

  // ------------------ HELPERS ------------------
  const handleResize = useCallback(() => {
    setTranslateDistance(window.innerWidth <= 600 ? '100px' : '120px');
  }, []);

  const formatNumber = (number) => {
    if (number >= 1_000_000) {
      return (number / 1_000_000).toFixed(2) + 'M';
    } else if (number >= 1_000) {
      return (number / 1_000).toFixed(2) + 'K';
    }
    return number.toFixed(2);
  };

  // The main spin function
  const spinWheel = useCallback(async () => {
    if (spinning) return;

    // Random rotation between 360° and 720°
    const randomRotation = Math.floor(Math.random() * 360) + 360;
    setSpinning(true);
    setRotation((prev) => prev + randomRotation);
    setLandedNumber(null);
    setShowFlash(false);

    // Play sound if not muted
    if (!isMuted || !gameSounds) {
      const audio = new Audio('/sounds/wheel.mp3');
      audio.play().catch(() => {
        // Catch promise rejections if user hasn't interacted with the page
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

  // ------------------ EFFECTS ------------------
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // ------------------ STYLING (MUI) ------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#400068',   // same purple background color
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 400,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  const wheelStyle = {
    transform: `rotate(${rotation}deg)`,
    transition: spinning ? 'transform 2s ease-out' : 'none',
    overflow: 'hidden',
    position: 'relative',
    margin: '0 auto',
    width: '200px',
    height: '200px'
  };

  const numberStyle = (index) => {
    const rotationDeg = (index / numbers.length) * 360;
    return {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: `rotate(${rotationDeg}deg) translate(${translateDistance}) rotate(-${rotationDeg}deg)`,
      transformOrigin: 'center center'
    };
  };

  // ------------------ RENDER ------------------
  return (
    <Modal
      open={modalIsOpen}
      onClose={closeModal}
      closeAfterTransition
      sx={{ zIndex: 1300 }}
      BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
    >
      <Box sx={modalBoxStyle}>
        {/* HEADER */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faStar} />
            &nbsp;CORN WHEEL
          </Typography>
          {/* Rotated Corn Image */}
          <img
            src="../img/icons/corn.svg"
            alt="corn"
            style={{
              transform: 'rotate(167deg) scaleY(-1) translate(10px, 7px) rotate(5deg)',
              width: '40px',
              zIndex: 0
            }}
          />
          <Button variant="text" color="error" onClick={closeModal}>
            X
          </Button>
        </Box>

        {/* NEXT CORN ARRIVES INFO */}
        <Box
          sx={{
            textAlign: 'center',
            border: '3px solid #f9f9f9',
            borderRadius: 1,
            backgroundColor: 'rgba(202, 185, 141, 0.45)',
            p: 1,
            mb: 2
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgb(222, 226, 230)' }}>
            <FontAwesomeIcon icon={faClock} /> &nbsp;Next Corn Arrives...
          </Typography>
          <Typography variant="h6" sx={{ color: '#ff8500', m: 0 }}>
            {remainingTime}
          </Typography>
        </Box>

        {/* THE WHEEL */}
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

        {/* SPIN RESULT or SPIN BUTTON */}
        {landedNumber !== null ? (
          <Box
            sx={{
              textAlign: 'center',
              p: 2,
              borderRadius: 1,
              backgroundColor: showFlash ? 'success.light' : 'transparent',
              transition: 'background-color 0.3s ease'
            }}
          >
            {landedNumber} SOL (
            {convertToCurrency(landedNumber, solPrice)})
          </Box>
        ) : (
          <Button
            variant="contained"
            onClick={spinWheel}
            disabled={spinning || totalWagered < 9410}
            sx={{ display: 'block', margin: '0 auto' }}
          >
            {totalWagered < 9410 ? (
              'UNLOCK AT RANK 12'
            ) : (
              <>
                SPIN FOR 0.01 SOL! ({convertToCurrency(0.01, solPrice)}) &nbsp;
                <FontAwesomeIcon icon={faSyncAlt} />
                <img
                  src="../img/icons/corn.svg"
                  alt="corn"
                  style={{
                    transform: 'rotate(167deg) scaleY(-1) translate(10px, 7px) rotate(5deg)',
                    width: '40px',
                    zIndex: 0
                  }}
                />
              </>
            )}
          </Button>
        )}
      </Box>
    </Modal>
  );
}

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
  user_id: state.auth.user._id,
  totalWagered: state.auth.user.totalWagered,
  isDarkMode: state.auth.isDarkMode,
  isMuted: state.auth.isMuted,
  gameSounds: state.auth.gameSounds,
  solPrice: state.logic.solPrice,
  user: state.auth.user
});

const mapDispatchToProps = {
  addBonus,
  getUser
};

export default connect(mapStateToProps, mapDispatchToProps)(BonusModal);