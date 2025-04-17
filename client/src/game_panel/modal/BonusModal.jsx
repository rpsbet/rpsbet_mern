import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, Box, Typography, Button, Fade } from '@mui/material';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faClock, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

import { addBonus, getUser } from '../../redux/Auth/user.actions';
import { convertToCurrency } from '../../util/conversion';

function BonusModal({ modalIsOpen, closeModal }) {
  const dispatch = useDispatch();

  // Redux state
  const totalWagered = useSelector((state) => state.auth.user.totalWagered);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const user = useSelector((state) => state.auth.user);
  const isMuted = useSelector((state) => state.auth.isMuted);
  const gameSounds = useSelector((state) => state.auth.gameSounds);

  // Local state
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [landedNumber, setLandedNumber] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const [translateDistance, setTranslateDistance] = useState(
    window.innerWidth <= 600 ? '90px' : '110px'
  );

  // Wheel numbers
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
      remainingTime = Moment.duration(remainingMs, 'milliseconds').humanize(true);
    }
  }

  // Helpers
  const handleResize = useCallback(() => {
    setTranslateDistance(window.innerWidth <= 600 ? '90px' : '110px');
  }, []);

  const formatNumber = (number) => {
    if (number >= 1_000_000) return (number / 1_000_000).toFixed(2) + 'M';
    if (number >= 1_000) return (number / 1_000).toFixed(2) + 'K';
    return number.toFixed(2);
  };

  const spinWheel = useCallback(async () => {
    if (spinning) return;

    const randomRotation = Math.floor(Math.random() * 360) + 360;
    setSpinning(true);
    setRotation((prev) => prev + randomRotation);
    setLandedNumber(null);
    setShowFlash(false);

   if (!isMuted || !gameSounds) {
      const audio = new Audio('/sounds/wheel.mp3');
      audio.play().catch(() => {
        // Catch promise rejections if user hasn't interacted with the page
      });
    }

    const result = await dispatch(addBonus());
    setSpinning(false);
    setLandedNumber(result.amount);
    setShowFlash(true);

    await dispatch(getUser());
    setTimeout(() => setShowFlash(false), 1500);
  }, [spinning, isMuted, gameSounds, dispatch]);

  // Effects
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Styles
  const glassmorphicStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    '@supports not (backdrop-filter: blur(12px))': {
      background: 'rgba(255, 255, 255, 0.15)',
    },
  };

  const buttonStyle = {
    background: 'linear-gradient(45deg,rgb(18, 96, 0),rgb(221, 255, 0))',
    color: '#fff',
    fontWeight: 'bold',
    padding: '10px 20px',
    borderRadius: '8px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'scale(1.01)',
      boxShadow: '0 4px 15px rgba(134, 255, 107, 0.4)',
    },
    '&:disabled': {
      background: 'rgba(255, 255, 255, 0.2)',
      color: 'rgba(255, 255, 255, 0.5)',
    },
  };

  return (
    <Modal
      open={modalIsOpen || false}
      onClose={closeModal}
      closeAfterTransition
      sx={{ zIndex: 1300 }}
      BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.85)' } }}
    >
      <Fade in={modalIsOpen}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            width: '90vw',
            height: '80vh',
            overflowY: 'auto',
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            // Glassmorphism styles (default dark mode colors)
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)', // For Safari
            border: '1px solid rgba(255, 255, 255, 0.2)',
            // Fallback for browsers without backdrop-filter
            '@supports not (backdrop-filter: blur(10px))': {
              background: 'rgba(0, 0, 0, 0.4)',
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <FontAwesomeIcon icon={faCoins} style={{ color: '#ffd700' }} />
              CORN WHEEL
            </Typography>
            <Button
              onClick={closeModal}
              sx={{
                color: '#ff6b6b',
                fontSize: '1.5rem',
                minWidth: 'unset',
                '&:hover': { color: '#ff8e53' },
              }}
            >
              ×
            </Button>
          </Box>

          {/* Content */}
          <Box sx={{ ...glassmorphicStyle, borderRadius: '12px', p: 3 }}>
            {/* Timer */}
            <Box
              sx={{
                textAlign: 'center',
                p: 2,
                borderRadius: '8px',
                ...glassmorphicStyle,
                mb: 3,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}
              >
                <FontAwesomeIcon icon={faClock} /> NEXT CORN
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: '#ffd700', fontWeight: 'bold' }}
              >
                {remainingTime}
              </Typography>
            </Box>

            {/* Wheel */}
            <Box
              className="wheel"
              sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'transform 3s ease-out',
                transform: `rotate(${rotation}deg)`,
                mb: 3,
              }}
            >
              {numbers.map((number, index) => {
                const rotationDeg = (index / numbers.length) * 360;
                return (
                  <Box
                    key={index}
                    className="number"
                    sx={{
                      position: 'absolute',
                      color: '#fff',
                      fontWeight: 'bold',
                      transform: `rotate(${rotationDeg}deg) translate(${translateDistance}) rotate(-${rotationDeg}deg)`,
                      ...glassmorphicStyle,
                      padding: '4px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {formatNumber(number)}
                  </Box>
                );
              })}
              <img
                width="180px"
                src="../img/bonus.svg"
                alt="Bonus Wheel"
                style={{ transition: 'transform 3s ease-out' }}
              />
            </Box>

            {/* Spin Result or Button */}
            {landedNumber !== null ? (
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: '8px',
                  ...glassmorphicStyle,
                  background: showFlash
                    ? 'rgba(0, 255, 0, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)',
                  transition: 'background-color 0.3s ease',
                }}
              >
                <Typography variant="h6" sx={{ color: '#ffd700' }}>
                  {landedNumber} SOL (
                  {convertToCurrency(landedNumber, solPrice)})
                </Typography>
              </Box>
            ) : (
              <Button
                onClick={spinWheel}
                disabled={spinning || totalWagered < 1.2973967}
                sx={{
                  ...buttonStyle,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                {totalWagered < 1.2973967 ? (
                  'UNLOCK AT RANK 1'
                ) : (
                  <>
                    SPIN FOR 0.01 SOL! ({convertToCurrency(0.01, solPrice)})
                    <FontAwesomeIcon icon={faSyncAlt} />
                    <img
                      src="../img/icons/corn.svg"
                      alt="corn"
                      style={{
                        width: '24px',
                        transform:
                          'rotate(167deg) scaleY(-1) translate(2px, 2px) rotate(5deg)',
                      }}
                    />
                  </>
                )}
              </Button>
            )}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

export default BonusModal;