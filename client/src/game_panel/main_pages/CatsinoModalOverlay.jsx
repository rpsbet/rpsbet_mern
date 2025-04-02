import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  IconButton,
  useMediaQuery
} from '@mui/material';
import { useTheme, keyframes } from '@mui/material/styles';
// import Countdown from 'react-countdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXTwitter,
  faTelegram,
  faYoutube,
  faTiktok
} from '@fortawesome/free-brands-svg-icons';

// Utility to format the CA for mobile
function formatAddress(address, isMobile) {
  if (!isMobile) return address;
  // Show first 14 chars, then last 5
  return address.slice(0, 14) + '...' + address.slice(-5);
}

// A simple fade-out keyframe
const fadeOut = keyframes`
  0% {
    opacity: 1;
    transform: scale(1) translateX(-50%);
  }
  70% {
    opacity: 1;
    transform: scale(1) translateX(-50%);
  }
  100% {
    opacity: 0;
    transform: scale(0.8) translateX(-50%);
  }
`;

function CatsinoModalOverlay({
  currentGif,
  blurValue = 5,
  halloween,
  handleCountdownButtonClick,
  handleYoutubeButtonClick
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // The full CA
  const fullCA = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';
  const displayedCA = formatAddress(fullCA, isMobile);

  // State to show "Copied!" animation
  const [copied, setCopied] = useState(false);

  // Copy to clipboard
  const copyCA = () => {
    navigator.clipboard.writeText(fullCA);
    setCopied(true);
  };

  // Hide "Copied!" after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <Box
      // Full-screen overlay
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        // A vertical gradient that fades to transparent from top (solid) to bottom (transparent).
        background: `linear-gradient(to bottom, #9833ff85 0%, #9500ff00 85%), url(${currentGif}) center/cover no-repeat`,
        backdropFilter: `blur(${blurValue}px)`
      }}
    >
      {/* HEADER (Logo & Title) */}
      <Box
        sx={{
          textAlign: 'center',
          pt: { xs: 3, md: 5 },
          mb: 3
        }}
      >
        <Box
          component="img"
          src="../img/dark-game-logo.svg"
          alt="dark-game-logo"
          sx={{
            display: 'inline-block',
            maxWidth: '180px',
            mb: 1,
            filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))'
          }}
        />
        <Typography
          variant="h4"
          sx={{
            color: '#fff',
            fontWeight: 'bold',
            textShadow: '0 0 12px rgba(130, 0, 255, 0.7)',
            mb: 0.5
          }}
        >
          AI (CAT)SINO
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: '#f9f9f9',
            fontStyle: 'italic',
            fontSize: '1rem'
          }}
        >
          GET RICH&nbsp;💰&nbsp;OR&nbsp;DIE&nbsp;🩸&nbsp;😼
        </Typography>
      </Box>

      {/* MAIN GRID: 2 COLUMNS, both same height */}
      <Grid
        container
        spacing={3}
        sx={{
          position: 'relative',
          // Larger screens
          minHeight: { xs: 'calc(100vh - 210px)', md: 'calc(100vh - 480px)' },
          alignItems: 'stretch',
          justifyContent: 'center',
          px: { xs: 2, md: 8 },
          pb: 3,

          // For mobile under 600px: fix height & scroll
          '@media (max-width: 600px)': {
            height: '500px',
            overflowY: 'auto',
            minHeight: 'auto'
          }
        }}
      >
        {/* LEFT COLUMN: VIDEO & Countdown */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',

          }}
        >
          <Box
            sx={{
              flex: 1,
              borderRadius: 2,
              p: { xs: 2, md: 4 },
              background: 'linear-gradient(184deg, #9833ffd1, #9500ff00)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between'

            }}
          >
            {/* Floating Ribbon */}
            <Box
              sx={{
                position: 'absolute',
                top: 30, // shift it a bit down so it’s not cut off
                left: '25%',
                transform: 'translateX(-50%) rotate(-5deg)',
                backgroundColor: 'orange',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                px: 2,            // horizontal padding
                py: 0.5,          // vertical padding
                borderRadius: 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                zIndex: 999,      // ensure on top
              }}
            >
              💘 Valentine’s Day 💘
            </Box>

            <Box
              component="iframe"
              width="400"
              height="215"
              src="https://www.youtube.com/embed/CnpVcIx3wz4"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sx={{
                borderRadius: '10px',
                border: '3px solid rgb(98, 3, 172)',
                maxWidth: '100%',
                mb: 4,
                boxShadow: '0 0 8px rgba(98, 3, 172, 0.5)'
              }}
            />

            {/* "Creative" Countdown */}
            <Box
              sx={{
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                mb: 4
              }}
            >
              {/* <Countdown
                date={halloween}
                renderer={({ days, hours, minutes, seconds, completed }) => {
                  if (completed) {
                    return (
                      <Typography variant="h5" color="error">
                        Countdown completed!
                      </Typography>
                    );
                  }
                  // Map each time unit to "bubble" with digit
                  const items = [
                    { label: 'Days', value: days },
                    { label: 'Hours', value: hours },
                    { label: 'Min', value: minutes },
                    { label: 'Sec', value: seconds }
                  ];

                  return (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: 2
                      }}
                    >
                      {items.map(({ label, value }) => (
                        <Box
                          key={label}
                          sx={{
                            width: 70,
                            height: 70,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            boxShadow: '0 0 8px rgba(0,0,0,0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            transition: '0.2s',
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.25)'
                            }
                          }}
                        >
                          <Typography variant="h5" sx={{ lineHeight: 1 }}>
                            {value}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ lineHeight: 1, mt: 0.3 }}
                          >
                            {label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  );
                }}
              /> */}
            </Box>

            <Button
              variant="contained"
              sx={{
                backgroundColor: 'rgb(98, 3, 172)',
                color: '#fff',
                borderRadius: 2,
                px: 4,
                py: 1.2,
                boxShadow: '0 0 8px rgba(98, 3, 172, 0.4)',
                transition: '0.2s',
                '&:hover': {
                  backgroundColor: 'rgb(110, 15, 182)',
                  boxShadow: '0 0 12px rgba(98, 3, 172, 0.6)'
                }
              }}
              onClick={handleCountdownButtonClick}
            >
              Investor Portal
            </Button>
          </Box>
        </Grid>

        {/* RIGHT COLUMN: IMAGE */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              flex: 1,
              borderRadius: 2,
              p: { xs: 2, md: 4 },
              background: 'linear-gradient(184deg, #9833ffd1, #9500ff00)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between'

            }}
          >
            <Box
              component="img"
              src="../img/giant-login-2.svg"
              alt="giant-login"
              sx={{
                width: '400px',
                maxWidth: '100%',
                border: '3px solid rgb(98, 3, 172)',
                borderRadius: '12px',
                mb: 4,
                boxShadow: '0 0 8px rgba(98, 3, 172, 0.5)'
              }}
            />

            <Button
              variant="contained"
              sx={{
                backgroundColor: 'rgb(98, 3, 172)',
                color: '#fff',
                borderRadius: 2,
                px: 4,
                py: 1.2,
                boxShadow: '0 0 8px rgba(98, 3, 172, 0.4)',
                transition: '0.2s',
                '&:hover': {
                  backgroundColor: 'rgb(110, 15, 182)',
                  boxShadow: '0 0 12px rgba(98, 3, 172, 0.6)'
                }
              }}
              disabled
              onClick={handleYoutubeButtonClick}
            >
              Game Portal
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* CLICKABLE CA & SOCIAL ICONS ROW (Centered) */}
      <Box sx={{ mt: 3, textAlign: 'center', position: 'relative' }}>
        {/* CA Link: Truncate middle on mobile */}
        <Typography
          variant="body1"
          sx={{
            color: '#fff',
            mb: 2,
            cursor: 'pointer',
            textDecoration: 'underline',
            position: 'relative',
            display: 'inline-block',
            transition: 'color 0.2s',
            '&:hover': {
              color: 'rgb(98, 3, 172)'
            }
          }}
          onClick={copyCA}
        >
          CA: {displayedCA}

          {/* Show ephemeral "Copied!" with animation when copied is true */}
          {copied && (
            <Box
              sx={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(98, 3, 172, 0.9)',
                color: '#fff',
                px: 1,
                py: '2px',
                fontSize: '0.75rem',
                borderRadius: '4px',
                boxShadow: '0 0 5px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
                animation: `${fadeOut} 1.5s forwards`
              }}
            >
              Copied!
            </Box>
          )}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 3
          }}
        >
          <IconButton
            sx={{
              color: '#fff',
              transition: '0.2s',
              '&:hover': { color: '#1DA1F2' }
            }}
            onClick={() => window.open('https://x.com/RPSDG_SOL', '_blank')}
          >
            <FontAwesomeIcon icon={faXTwitter} size="lg" />
          </IconButton>

          <IconButton
            sx={{
              color: '#fff',
              transition: '0.2s',
              '&:hover': { color: '#0088cc' }
            }}
            onClick={() => window.open('https://t.me/RPSDOTGAMESOL', '_blank')}
          >
            <FontAwesomeIcon icon={faTelegram} size="lg" />
          </IconButton>

          <IconButton
            sx={{
              color: '#fff',
              transition: '0.2s',
              '&:hover': { color: '#D32F2F' }
            }}
            onClick={() => window.open('https://www.youtube.com/@rpsdotgame', '_blank')}
          >
            <FontAwesomeIcon icon={faYoutube} size="lg" />
          </IconButton>

          <IconButton
            sx={{
              color: '#fff',
              transition: '0.2s',
              '&:hover': { color: '#ff0050' }
            }}
            onClick={() =>
              window.open('https://www.tiktok.com/@rpsdotgames', '_blank')
            }
          >
            <FontAwesomeIcon icon={faTiktok} size="lg" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}

export default CatsinoModalOverlay;
