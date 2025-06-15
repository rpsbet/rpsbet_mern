import React, { useState, useCallback, useMemo } from 'react';
import {
  Modal,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  ListItem,
  List,
  Box,
  Button,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  IconButton,
  Grid,
  Chip,
  useMediaQuery,
  ThemeProvider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  QuestionMark as QuestionMarkIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXTwitter, 
  faTelegram,
  faQuestion,
  faGamepad,
  faDollarSign,
  faHeadset
} from '@fortawesome/free-brands-svg-icons';
import { 
  faQuestion as faQuestionSolid,
  faGamepad as faGamepadSolid,
  faDollarSign as faDollarSolid,
  faHeadset as faHeadsetSolid
} from '@fortawesome/free-solid-svg-icons';
import { getCustomTheme } from '../../config/theme';
import { useSelector } from 'react-redux';

const CONTRACT_ADDRESS = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';

// Memoized Content Components for Accordion Sections
const HowItWorksContent = React.memo(() => (
  <Box>
    <Typography 
      variant="body2" 
      sx={{ 
        color: 'rgba(255, 255, 255, 0.8)', 
        mb: 2,
        fontSize: '0.8rem',
        textAlign: 'center'
      }}
    >
      Create games instantly with AI and earn when people play them!
    </Typography>

    <List sx={{ p: 0 }}>
      {[
        { 
          number: '🎨', 
          title: 'Create Your Game', 
          desc: 'Tell our AI what game you want - it builds it instantly!',
          color: '#ff4081'
        },
        { 
          number: '🎮', 
          title: 'People Play & Pay', 
          desc: 'Players enjoy your game and pay to play - you earn money!',
          color: '#4caf50'
        },
        { 
          number: '📈', 
          title: 'Trade Game Shares', 
          desc: 'Buy and sell shares of popular games before they become tokens!',
          color: '#2196f3'
        },
        { 
          number: '🚀', 
          title: 'Game Goes Crypto', 
          desc: 'Successful games become real crypto tokens!',
          color: '#ff9800'
        },
      ].map((item, index) => (
        <ListItem
          key={index}
          sx={{
            py: 1,
            px: 0,
            mb: 1,
          }}
        >
          <ListItemAvatar sx={{ minWidth: 40 }}>
            <Avatar
              sx={{
                background: item.color,
                color: '#ffffff',
                fontSize: '1rem',
                width: 32,
                height: 32,
              }}
            >
              {item.number}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography 
                sx={{ 
                  fontWeight: 600, 
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  mb: 0.25
                }}
              >
                {item.title}
              </Typography>
            }
            secondary={
              <Typography 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem',
                  lineHeight: 1.3
                }}
              >
                {item.desc}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>

    <Box sx={{ 
      mt: 2,
      p: 1.5,
      background: 'rgba(255, 193, 7, 0.1)',
      borderRadius: '4px',
      border: '1px solid rgba(255, 193, 7, 0.3)',
      textAlign: 'center'
    }}>
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#ffc107', 
          fontWeight: 600, 
          fontSize: '0.8rem'
        }}
      >
        ✨ No coding skills needed - AI does everything!
      </Typography>
    </Box>
  </Box>
));

const GamesContent = React.memo(() => (
  <Box>
    <Typography
      variant="body2"
      sx={{
        color: 'rgba(255, 255, 255, 0.8)',
        mb: 2,
        fontSize: '0.8rem',
        textAlign: 'center'
      }}
    >
      Tell the AI what you want and watch the magic happen!
    </Typography>

    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
      {[
        { step: '1️⃣', title: 'Tell the AI', desc: '"Make me a dice game!" or "I want a racing game!"', color: '#ff4081' },
        { step: '2️⃣', title: 'AI Creates', desc: 'The AI builds a real game just for you!', color: '#4caf50' },
        { step: '3️⃣', title: 'Play & Earn', desc: 'Your custom game is ready instantly!', color: '#9c27b0' },
      ].map((item, index) => (
        <Box key={index} sx={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '4px',
          p: 1.5,
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <Typography
            variant="body2"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 600,
              color: item.color,
              mb: 0.5,
              fontSize: '0.8rem'
            }}
          >
            <span style={{ fontSize: '1rem' }}>{item.step}</span> {item.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem'
            }}
          >
            {item.desc}
          </Typography>
        </Box>
      ))}
    </Box>

    <Box sx={{
      background: 'rgba(255, 193, 7, 0.1)',
      borderRadius: '4px',
      p: 1.5,
      border: '1px solid rgba(255, 193, 7, 0.2)'
    }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: '#ffc107',
          mb: 1,
          fontSize: '0.8rem'
        }}
      >
        🌟 What Can You Make?
      </Typography>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5,
      }}>
        {[
          '🎲 Dice Games',
          '🏎️ Racing Games',
          '🎯 Target Games',
          '🧩 Puzzle Games',
          '🚀 Space Games',
          '⚽ Sports Games'
        ].map((game, index) => (
          <Chip
            key={index}
            label={game}
            size="small"
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '0.7rem',
              height: 20,
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          />
        ))}
      </Box>
    </Box>
  </Box>
));

const FeesContent = React.memo(() => (
  <Box>
    <Box sx={{ 
      background: 'rgba(76, 175, 80, 0.1)',
      borderRadius: '4px',
      p: 2,
      border: '1px solid rgba(76, 175, 80, 0.3)',
      textAlign: 'center',
      mb: 2
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#4caf50', 
          fontWeight: 700, 
          mb: 0.5,
          fontSize: '1rem'
        }}
      >
        💰 Simple Fees
      </Typography>
      
      <Typography 
        variant="h4" 
        sx={{ 
          color: '#ffffff', 
          fontWeight: 800, 
          mb: 0.5,
          fontSize: '1.8rem'
        }}
      >
        Only 3%
      </Typography>
      
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.75rem'
        }}
      >
        That's it! We keep things simple 🎯
      </Typography>
    </Box>

    <Box sx={{ 
      background: 'rgba(255, 193, 7, 0.1)',
      borderRadius: '4px',
      p: 1.5,
      border: '1px solid rgba(255, 193, 7, 0.3)',
      textAlign: 'center',
      mb: 2
    }}>
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#ffc107', 
          fontWeight: 600,
          fontSize: '0.8rem',
          mb: 0.5
        }}
      >
        🌟 Elite Members get 50% OFF!
      </Typography>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#ffffff', 
          fontWeight: 700,
          fontSize: '1rem'
        }}
      >
        Only 1.5% for Elite
      </Typography>
    </Box>

    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 1
    }}>
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#ffffff', 
          fontWeight: 600,
          mb: 0.5,
          fontSize: '0.8rem'
        }}
      >
        🎮 What's Covered?
      </Typography>
      
      {[
        { emoji: '✅', text: 'Playing games' },
        { emoji: '✅', text: 'Creating games' },
        { emoji: '✅', text: 'Trading shares' },
        { emoji: '🆓', text: 'Tips are FREE!', highlight: true },
      ].map((item, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            background: item.highlight ? 'rgba(255, 64, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
            borderRadius: '4px',
            border: `1px solid ${item.highlight ? 'rgba(255, 64, 129, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
          }}
        >
          <span style={{ fontSize: '0.9rem' }}>{item.emoji}</span>
          <Typography 
            sx={{ 
              color: item.highlight ? '#ff4081' : 'rgba(255, 255, 255, 0.8)',
              fontWeight: item.highlight ? 600 : 400,
              fontSize: '0.75rem'
            }}
          >
            {item.text}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>
));

const GetHelpContent = React.memo(() => (
  <Box>
    <Typography 
      variant="body2" 
      sx={{ 
        color: 'rgba(255, 255, 255, 0.8)', 
        mb: 2,
        fontSize: '0.8rem',
        textAlign: 'center'
      }}
    >
      Get fast support from our friendly team ⚡
    </Typography>

    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 1.5,
      mb: 2
    }}>
      
      <Button
        variant="contained"
        sx={{
          background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
          color: '#ffffff',
          textTransform: 'none',
          borderRadius: '4px',
          py: 1.5,
          fontSize: '0.8rem',
          fontWeight: 600,
          '&:hover': {
            background: 'linear-gradient(135deg, #4752C4 0%, #5865F2 100%)',
          },
        }}
        startIcon={<Box sx={{ fontSize: '1rem' }}>💬</Box>}
        onClick={() => window.open('https://discord.gg/2yU5hEmWVh', '_blank', 'noopener,noreferrer')}
        fullWidth
      >
        <Box sx={{ textAlign: 'left', width: '100%' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
            Discord Community
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
            Chat with us & other players instantly!
          </Typography>
        </Box>
      </Button>

      <Button
        variant="contained"
        sx={{
          background: 'linear-gradient(135deg, #000000 0%, #1DA1F2 100%)',
          color: '#ffffff',
          textTransform: 'none',
          borderRadius: '4px',
          py: 1.5,
          fontSize: '0.8rem',
          fontWeight: 600,
          '&:hover': {
            background: 'linear-gradient(135deg, #1DA1F2 0%, #000000 100%)',
          },
        }}
        startIcon={<FontAwesomeIcon icon={faXTwitter} style={{ fontSize: '1rem' }} />}
        onClick={() => window.open('https://x.com/catsinofun', '_blank', 'noopener,noreferrer')}
        fullWidth
      >
        <Box sx={{ textAlign: 'left', width: '100%' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
            Twitter / X
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
            Follow for updates & quick support!
          </Typography>
        </Box>
      </Button>
    </Box>

    <Box sx={{ 
      background: 'rgba(76, 175, 80, 0.1)',
      borderRadius: '4px',
      p: 1.5,
      border: '1px solid rgba(76, 175, 80, 0.3)',
      textAlign: 'center'
    }}>
      <Typography 
        variant="caption" 
        sx={{ 
          color: '#4caf50', 
          fontWeight: 600,
          fontSize: '0.75rem'
        }}
      >
        ⚡ We usually respond within 24 hours!
      </Typography>
    </Box>
  </Box>
));

const accordionSections = [
  {
    id: 'how-it-works',
    title: 'How It Works',
    icon: faQuestionSolid,
    ContentComponent: HowItWorksContent,
  },
  {
    id: 'games',
    title: 'Games',
    icon: faGamepadSolid,
    ContentComponent: GamesContent,
  },
  {
    id: 'fees',
    title: 'Fees',
    icon: faDollarSolid,
    ContentComponent: FeesContent,
  },
  {
    id: 'get-help',
    title: 'Support',
    icon: faHeadsetSolid,
    ContentComponent: GetHelpContent,
  },
];

function HowToPlayModalComponent({ modalIsOpen, closeModal }) {
  const [copiedTooltipOpen, setCopiedTooltipOpen] = useState(false);
  const isDarkMode = useSelector(state => state.auth?.isDarkMode);
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleCopyAddress = useCallback(async () => {
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available.');
      return;
    }
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopiedTooltipOpen(true);
      setTimeout(() => {
        setCopiedTooltipOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy address', err);
    }
  }, []);

  const shortenedAddress = useMemo(() => {
    if (isMobile) {
      return `${CONTRACT_ADDRESS.slice(0, 5)}...${CONTRACT_ADDRESS.slice(-4)}`;
    }
    return `${CONTRACT_ADDRESS.slice(0, 10)}...${CONTRACT_ADDRESS.slice(-6)}`;
  }, [isMobile]);

  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={modalIsOpen || false}
        onClose={closeModal}
        sx={{ zIndex: 1300 }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: '80%', md: '70%', lg: '60%' },
            maxWidth: '800px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '8px',
            background: '#262626',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            color: '#fff',
          }}
        >
          {/* Clean Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FontAwesomeIcon
                icon={faQuestionSolid}
                style={{
                  color: '#ff0000',
                  fontSize: '14px'
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                Help & Guide
              </Typography>
            </Box>
            <IconButton
              onClick={closeModal}
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: '#fff'
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ padding: '16px' }}>
            {accordionSections.map(({ id, title, icon, ContentComponent }) => (
              <Accordion
                key={id}
                sx={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  mb: 1,
                  '&:before': { display: 'none' },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.03)',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.2rem' }} />}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    minHeight: 40,
                    '& .MuiAccordionSummary-content': {
                      margin: '8px 0',
                      alignItems: 'center',
                    },
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon
                      icon={icon}
                      style={{
                        color: '#ff0000',
                        fontSize: '12px'
                      }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        color: '#ffffff',
                        fontSize: '0.85rem',
                      }}
                    >
                      {title}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    padding: '12px 16px',
                  }}
                >
                  <ContentComponent />
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

const HowToPlayModal = React.memo(HowToPlayModalComponent);
export default HowToPlayModal;