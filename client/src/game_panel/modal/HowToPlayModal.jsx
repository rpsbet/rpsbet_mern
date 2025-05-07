import React, { useState } from 'react';
import {
  Modal,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  ListItem,
  List,
  Box,
  Link,
  Button,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemIcon,
  Tooltip,
  Divider,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Close as CloseIcon } from '@mui/icons-material'
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import CasinoIcon from "@mui/icons-material/Casino";
import CardGiftcard from "@mui/icons-material/CardGiftcard";
import QuestionMark from "@mui/icons-material/QuestionMark";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";

function HowToPlayModal({ modalIsOpen, closeModal }) {
  const CONTRACT_ADDRESS = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';
  const [copiedTooltipOpen, setCopiedTooltipOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isDesktop = useMediaQuery("(min-width: 1025px)");

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopiedTooltipOpen(true);
      setTimeout(() => {
        setCopiedTooltipOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy address', err);
    }
  };

  const shortenAddress = (address) => {
    if (isMobile) {
      return `${address.slice(0, 5)}...${address.slice(-4)}`;
    } else if (isTablet) {
      return `${address.slice(0, 10)}...${address.slice(-6)}`;
    } else if (isDesktop) {
      return `${address.slice(0, 18)}...${address.slice(-22)}`;
    }
    return address;
  };

  return (
    <Modal
      open={modalIsOpen || false}
      onClose={closeModal}
      closeAfterTransition
      sx={{ zIndex: 1300 }}
      BackdropProps={{
        style: { backgroundColor: 'rgba(0, 0, 0, 0.85)' },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: '80vw', md: '60vw', lg: '50vw' },
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 3,
          p: { xs: 2, sm: 3, md: 4 },
          // Glassmorphism
          background: 'rgba(30, 30, 30, 0.3)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          // Fallback
          '@supports not (backdrop-filter: blur(15px))': {
            background: 'rgba(30, 30, 30, 0.6)',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.2) transparent',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '4px',
          },
        }}
      >
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <QuestionMark sx={{ fontSize: '1.5rem', color: '#ffd700' }} />
            How It Works
          </Typography>
         
            <Button
              onClick={closeModal}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                minWidth: 'auto',
                p: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                borderRadius: '50%',
              }}
            >
              <CloseIcon />
            </Button>
        </Box>

        {/* ACCORDIONS */}
        {[
          {
            title: '🚀 How It Works',
            content: (
              <>
                <Typography variant="body2" paragraph sx={{ color: '#e0e0e0' }}>
                  <span
                    style={{
                      background: 'linear-gradient(165deg, #ffd000, #FF0000)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontWeight: 600,
                    }}
                  >
                    Catsino.fun
                  </span>{' '}
                  empowers <strong>creators</strong> to raise funds through engaging games! 🎮
                </Typography>

                <List sx={{ pl: 1 }}>
                  {[
                    { number: '1️⃣', title: 'Create a Game', desc: 'Choose RPS, Quick Shoot, or Custom.' },
                    { number: '2️⃣', title: 'Raise Funds', desc: 'Players bet or invest in your game.' },
                    { number: '3️⃣', title: 'Cash Out Anytime', desc: 'Secure gains or stay for bigger rewards.' },
                    { number: '4️⃣', title: 'Game Graduates', desc: 'Converts to a tradeable token once funded.' },
                    {
                      number: '5️⃣',
                      title: 'Liquidity Locked',
                      desc: (
                        <>
                          80% to{' '}
                          <span
                            style={{
                              background: 'linear-gradient(165deg, #ffd000, #FF0000)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              fontWeight: 600,
                            }}
                          >
                            Raydium
                          </span>{' '}
                          forever, 20% shared with holders.
                        </>
                      ),
                    },
                  ].map((item, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        alignItems: 'flex-start',
                        py: 1,
                        '&:hover': { background: 'rgba(255, 255, 255, 0.05)' },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#ffd700',
                            fontSize: '1.2rem',
                            width: 36,
                            height: 36,
                          }}
                        >
                          {item.number}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 600, color: '#ffffff' }}>{item.title}</Typography>}
                        secondary={<Typography sx={{ color: '#b0b0b0' }}>{item.desc}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>

                <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                  💡 <strong>Want more?</strong> Explore AI tools, staking rewards, loans, and beyond!
                </Typography>
              </>
            ),
          },
          // {
          //   title: '💰 $RPS Token',
          //   content: (
          //     <>
          //       <List dense>
          //         <ListItem sx={{ py: 1 }}>
          //           <ListItemIcon>
          //             <CheckCircleIcon sx={{ color: '#4caf50' }} />
          //           </ListItemIcon>
          //           <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
          //             Holders earn <strong>10% of platform fees</strong>! 💸
          //           </Typography>
          //         </ListItem>
          //         <ListItem sx={{ py: 1 }}>
          //           <ListItemIcon>
          //             <LockOpenIcon sx={{ color: '#2196f3' }} />
          //           </ListItemIcon>
          //           <Typography sx={{ color: '#ffffff', fontWeight: 600 }}>
          //             Unlock <strong>all AI models</strong> with <strong>2.5M $RPS</strong>. 🔓
          //           </Typography>
          //         </ListItem>
          //       </List>

          //       <Box sx={{ mt: 2, textAlign: 'center' }}>
          //         <Typography sx={{ fontWeight: 600, color: '#ffffff', mb: 1 }}>
          //           🔗 Contract Address
          //         </Typography>
          //         <Tooltip
          //           title="Copied!"
          //           open={copiedTooltipOpen}
          //           disableFocusListener
          //           disableHoverListener
          //           disableTouchListener
          //           placement="top"
          //           arrow
          //         >
          //           <Typography
          //             variant="body2"
          //             sx={{
          //               cursor: 'pointer',
          //               display: 'flex',
          //               alignItems: 'center',
          //               justifyContent: 'center',
          //               gap: 1,
          //               color: '#2196f3',
          //               p: 1,
          //               borderRadius: 1,
          //               background: 'rgba(255, 255, 255, 0.05)',
          //               '&:hover': {
          //                 background: 'rgba(255, 255, 255, 0.1)',
          //                 color: '#42a5f5',
          //               },
          //             }}
          //             onClick={handleCopyAddress}
          //           >
          //             <ContentCopyIcon fontSize="small" />
          //             <Link underline="none" sx={{ color: 'inherit' }}>
          //               {shortenAddress(CONTRACT_ADDRESS)}
          //             </Link>
          //           </Typography>
          //         </Tooltip>
          //       </Box>
          //     </>
          //   ),
          // },
          {
            title: '🎮 Games',
            content: (
              <>
                {/* Custom */}
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: '#ffffff', mb: 1 }}
                >
                  <CasinoIcon sx={{ color: '#ff9800' }} /> Custom
                </Typography>
                <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                  <strong>🎯 Objective:</strong> Win creator-designed games to earn multipliers (varies by game).
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', mt: 1 }}>
                  🕹️ Gameplay:
                </Typography>
                <List dense>
                  {[
                    'Enter a predetermined Bet Amount.',
                    'Follow unique rules set by the game creator.',
                    'Win to earn a multiplier on your bet.',
                  ].map((text, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ color: '#b0b0b0' }}>{text}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Quick Shoot */}
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: '#ffffff', mt: 2 }}
                >
                  <SportsSoccerIcon sx={{ color: '#2196f3' }} /> Quick Shoot
                </Typography>
                <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                  <strong>🎯 Objective:</strong> Score past the AI keeper.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', mt: 1 }}>
                  🕹️ Gameplay:
                </Typography>
                <List dense>
                  {[
                    'Enter a predetermined Bet Amount.',
                    'Choose a direction to shoot against the AI keeper.',
                    'Score to win 1.25x to 4x your Bet Amount.',
                  ].map((text, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ color: '#b0b0b0' }}>{text}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                {/* RPS */}
                <Typography
                  variant="subtitle1"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: '#ffffff' }}
                >
                  <CardGiftcard sx={{ color: '#f06292' }} /> RPS (Rock Paper Scissors)
                </Typography>
                <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                  <strong>🎯 Objective:</strong> Predict the correct hand gesture.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff', mt: 1 }}>
                  🕹️ Gameplay:
                </Typography>
                <List dense>
                  {[
                    'Enter a predetermined Bet Amount.',
                    'Choose "Rock", "Paper", or "Scissors" against the AI.',
                    'Win based on: Rock > Scissors, Scissors > Paper, Paper > Rock.',
                  ].map((text, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1rem' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ color: '#b0b0b0' }}>{text}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            ),
          },
          {
            title: '💸 Fees',
            content: (
              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                💸 <strong>5% fee (2.5% for Black Elite members)</strong> on all transactions except tipping & loans.
              </Typography>
            ),
          },
          {
            title: '📞 Get Help',
            content: (
              <>
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Need assistance? Contact us via:
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#ffffff',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#ffffff',
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                    startIcon={<FontAwesomeIcon icon={faXTwitter} />}
                    onClick={() => window.open('https://x.com/catsinofun', '_blank')}
                  >
                    Twitter
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{
                      color: '#ffffff',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#ffffff',
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                    startIcon={<FontAwesomeIcon icon={faTelegram} />}
                    onClick={() => window.open('https://t.me/catsinofun', '_blank')}
                  >
                    Telegram
                  </Button>
                </Box>
              </>
            ),
          },
        ].map((section, index) => (
          <Accordion
            key={index}
            sx={{
              background: 'rgba(40, 40, 40, 0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              mb: 1.5,
              '&:before': { display: 'none' }, // Remove default MUI divider
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(50, 50, 50, 0.5)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              },
              '@supports not (backdrop-filter: blur(10px))': {
                background: 'rgba(40, 40, 40, 0.7)',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#ffffff' }} />}
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'inherit',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                },
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center',
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {section.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                background: 'rgba(30, 30, 30, 0.2)',
                borderRadius: '0 0 8px 8px',
                p: 3,
                color: '#e0e0e0',
              }}
            >
              {section.content}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Modal>
  );
}

export default HowToPlayModal;