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
  Link, // Link component is imported but not used in the provided JSX. Will keep if intended for future use.
  Button,
  ListItemText,
  ListItemAvatar,
  Avatar,
  ListItemIcon,
  Tooltip,
  Divider,
  useMediaQuery
} from '@mui/material';
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Close as CloseIcon } from '@mui/icons-material';
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import CasinoIcon from "@mui/icons-material/Casino";
import CardGiftcard from "@mui/icons-material/CardGiftcard";
import QuestionMark from "@mui/icons-material/QuestionMark";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// LockOpenIcon is imported but not used. Will keep if intended.
// import LockOpenIcon from "@mui/icons-material/LockOpen";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXTwitter, faTelegram } from "@fortawesome/free-brands-svg-icons";

const CONTRACT_ADDRESS = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';

// --- Memoized Content Components for Accordion Sections ---

const HowItWorksContent = React.memo(() => (
  <Box sx={{ p: 2 }}>
    {/* Main Intro */}
    <Typography 
      variant="h6" 
      sx={{ 
        color: '#ffffff', 
        fontWeight: 700, 
        mb: 2,
        textAlign: 'center',
        fontSize: { xs: '1.1rem', md: '1.3rem' }
      }}
    >
      🎮 Create Games → Earn Money! 💰
    </Typography>
    
    <Typography variant="body1" paragraph sx={{ color: '#e0e0e0', textAlign: 'center', mb: 3 }}>
      Make games instantly with AI and earn when people play them!
    </Typography>

    {/* Simple Steps */}
    <List sx={{ pl: 0 }}>
      {[
        { 
          id: 'step1', 
          number: '🎨', 
          title: 'Create Your Game', 
          desc: 'Tell our AI what game you want - it builds it for you instantly!',
          color: '#ff4081'
        },
        { 
          id: 'step2', 
          number: '🎮', 
          title: 'People Play & Pay', 
          desc: 'Players enjoy your game and pay to play - you earn money!',
          color: '#4caf50'
        },
        { 
          id: 'step3', 
          number: '📈', 
          title: 'Trade Game Shares', 
          desc: 'Buy and sell shares of popular games before they become crypto tokens!',
          color: '#2196f3'
        },
        { 
          id: 'step4', 
          number: '🚀', 
          title: 'Game Goes Crypto', 
          desc: 'Successful games become real crypto tokens you can trade anywhere!',
          color: '#ff9800'
        },
        {
          id: 'step5',
          number: '💎',
          title: 'Secure & Fair',
          desc: 'Blockchain keeps everything safe and transparent for everyone!',
          color: '#9c27b0'
        },
      ].map((item, index) => (
        <ListItem
          key={item.id}
          sx={{
            alignItems: 'flex-start',
            py: 1.5,
            mb: 1,
            borderRadius: 2,
            background: `rgba(${item.color === '#ff4081' ? '255, 64, 129' : 
                              item.color === '#4caf50' ? '76, 175, 80' :
                              item.color === '#2196f3' ? '33, 150, 243' :
                              item.color === '#ff9800' ? '255, 152, 0' :
                              '156, 39, 176'}, 0.1)`,
            border: `1px solid rgba(${item.color === '#ff4081' ? '255, 64, 129' : 
                                    item.color === '#4caf50' ? '76, 175, 80' :
                                    item.color === '#2196f3' ? '33, 150, 243' :
                                    item.color === '#ff9800' ? '255, 152, 0' :
                                    '156, 39, 176'}, 0.2)`,
            '&:hover': { 
              background: `rgba(${item.color === '#ff4081' ? '255, 64, 129' : 
                                 item.color === '#4caf50' ? '76, 175, 80' :
                                 item.color === '#2196f3' ? '33, 150, 243' :
                                 item.color === '#ff9800' ? '255, 152, 0' :
                                 '156, 39, 176'}, 0.15)`,
              transform: 'translateY(-2px)',
              transition: 'all 0.2s ease'
            },
          }}
        >
          <ListItemAvatar>
            <Avatar
              sx={{
                background: item.color,
                color: '#ffffff',
                fontSize: '1.5rem',
                width: 45,
                height: 45,
                mr: 1
              }}
            >
              {item.number}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography 
                sx={{ 
                  fontWeight: 700, 
                  color: '#ffffff',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  mb: 0.5
                }}
              >
                {item.title}
              </Typography>
            }
            secondary={
              <Typography 
                sx={{ 
                  color: '#e0e0e0',
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  lineHeight: 1.4
                }}
              >
                {item.desc}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>

    {/* Benefits Box */}
    <Box sx={{ 
      mt: 3,
      p: 2.5,
      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
      borderRadius: 2,
      border: '1px solid rgba(255, 193, 7, 0.3)',
      textAlign: 'center'
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#ffc107', 
          fontWeight: 700, 
          mb: 1.5,
          fontSize: { xs: '1rem', md: '1.2rem' }
        }}
      >
        ✨ Why This is Amazing!
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
        mt: 2
      }}>
        {[
          { emoji: '⚡', text: 'Games made in seconds!' },
          { emoji: '💰', text: 'Earn from your creativity!' },
          { emoji: '🔒', text: 'Blockchain keeps it safe!' },
          { emoji: '🌟', text: 'No coding skills needed!' }
        ].map((benefit, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              p: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 1,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{benefit.emoji}</span>
            <Typography 
              sx={{ 
                color: '#ffffff', 
                fontWeight: 600,
                fontSize: { xs: '0.9rem', md: '1rem' }
              }}
            >
              {benefit.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>

    {/* Call to Action */}
    <Typography 
      variant="body1" 
      sx={{ 
        color: '#ffffff', 
        fontWeight: 600, 
        mt: 3,
        textAlign: 'center',
        fontSize: { xs: '1rem', md: '1.1rem' }
      }}
    >
      🚀 Ready to start making money from games? Let's go!
    </Typography>
  </Box>
));

const GamesContent = React.memo(() => (
  <Box
    sx={{
      background: 'linear-gradient(135deg, rgba(255, 64, 129, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
      borderRadius: 3,
      p: 3,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center'
    }}
  >
    {/* Main Title */}
    <Typography
      variant="h5"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        fontWeight: 700,
        color: '#ffffff',
        mb: 2,
        fontSize: { xs: '1.2rem', md: '1.5rem' }
      }}
    >
      <AutoAwesome sx={{ color: '#ff4081', fontSize: '2rem' }} />
      AI Game Magic
    </Typography>

    {/* Simple Steps */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>

      {/* Step 1 */}
      <Box sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        p: 2,
        border: '1px solid rgba(255, 64, 129, 0.2)'
      }}>
        <Typography
          variant="h6"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            fontWeight: 600,
            color: '#ff4081',
            mb: 1,
            fontSize: { xs: '1rem', md: '1.1rem' }
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>1️⃣</span> Tell the AI What You Want
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#e0e0e0',
            fontSize: { xs: '0.9rem', md: '1rem' }
          }}
        >
          "Make me a dice game!" or "I want a racing game!"
        </Typography>
      </Box>

      {/* Step 2 */}
      <Box sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        p: 2,
        border: '1px solid rgba(76, 175, 80, 0.2)'
      }}>
        <Typography
          variant="h6"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            fontWeight: 600,
            color: '#4caf50',
            mb: 1,
            fontSize: { xs: '1rem', md: '1.1rem' }
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>2️⃣</span> AI Creates Your Game
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#e0e0e0',
            fontSize: { xs: '0.9rem', md: '1rem' }
          }}
        >
          The robot builds a real game just for you! ✨
        </Typography>
      </Box>

      {/* Step 3 */}
      <Box sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 2,
        p: 2,
        border: '1px solid rgba(156, 39, 176, 0.2)'
      }}>
        <Typography
          variant="h6"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            fontWeight: 600,
            color: '#9c27b0',
            mb: 1,
            fontSize: { xs: '1rem', md: '1.1rem' }
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>3️⃣</span> Play & Have Fun!
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#e0e0e0',
            fontSize: { xs: '0.9rem', md: '1rem' }
          }}
        >
          Your custom game is ready to play instantly! 🎮
        </Typography>
      </Box>

    </Box>

    {/* Fun Examples */}
    <Box sx={{
      background: 'rgba(255, 193, 7, 0.1)',
      borderRadius: 2,
      p: 2,
      border: '1px solid rgba(255, 193, 7, 0.2)'
    }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: '#ffc107',
          mb: 1,
          fontSize: { xs: '1rem', md: '1.1rem' }
        }}
      >
        🌟 What Can You Make?
      </Typography>
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        justifyContent: 'center',
        mt: 1
      }}>
        {[
          '🎲 Dice Games',
          '🏎️ Racing Games',
          '🎯 Target Games',
          '🧩 Puzzle Games',
          '🚀 Space Games',
          '⚽ Sports Games'
        ].map((game, index) => (
          <Box
            key={index}
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 1,
              px: 1.5,
              py: 0.5,
              fontSize: { xs: '0.8rem', md: '0.9rem' },
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {game}
          </Box>
        ))}
      </Box>
    </Box>

    {/* Call to Action */}
    <Typography
      variant="body1"
      sx={{
        color: '#ffffff',
        fontWeight: 600,
        mt: 2,
        fontSize: { xs: '1rem', md: '1.1rem' }
      }}
    >
      Ready to create your dream game? 🎉
    </Typography>

  </Box>
));

const FeesContent = React.memo(() => (
  <Box sx={{ p: 2 }}>
    {/* Main Fee Info */}
    <Box sx={{ 
      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)',
      borderRadius: 2,
      p: 2.5,
      border: '1px solid rgba(76, 175, 80, 0.3)',
      textAlign: 'center',
      mb: 2
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#4caf50', 
          fontWeight: 700, 
          mb: 1,
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}
      >
        💰 Super Simple Fees
      </Typography>
      
      <Typography 
        variant="h4" 
        sx={{ 
          color: '#ffffff', 
          fontWeight: 800, 
          mb: 1,
          fontSize: { xs: '2rem', md: '2.5rem' }
        }}
      >
        Only 3%
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          color: '#e0e0e0',
          fontSize: { xs: '1rem', md: '1.1rem' }
        }}
      >
        That's it! We keep things simple 🎯
      </Typography>
    </Box>

    {/* Elite Member Discount */}
    <Box sx={{ 
      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%)',
      borderRadius: 2,
      p: 2,
      border: '1px solid rgba(255, 193, 7, 0.4)',
      textAlign: 'center',
      mb: 2
    }}>
      <Typography 
        variant="body1" 
        sx={{ 
          color: '#ffc107', 
          fontWeight: 700,
          fontSize: { xs: '0.9rem', md: '1rem' }
        }}
      >
        🌟 VIP Members get 50% OFF!
      </Typography>
      <Typography 
        variant="h5" 
        sx={{ 
          color: '#ffffff', 
          fontWeight: 700,
          fontSize: { xs: '1.3rem', md: '1.5rem' }
        }}
      >
        Only 1.5% for Elite Members
      </Typography>
    </Box>

    {/* What's Included */}
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 1.5
    }}>
      <Typography 
        variant="body1" 
        sx={{ 
          color: '#ffffff', 
          fontWeight: 600,
          textAlign: 'center',
          mb: 1,
          fontSize: { xs: '1rem', md: '1.1rem' }
        }}
      >
        🎮 What Does the Fee Cover?
      </Typography>
      
      {[
        { emoji: '✅', text: 'Playing games', color: '#4caf50' },
        { emoji: '✅', text: 'Creating games', color: '#4caf50' },
        { emoji: '✅', text: 'Trading game shares', color: '#4caf50' },
        { emoji: '✅', text: 'Converting to crypto', color: '#4caf50' },
        { emoji: '🆓', text: 'Tips to creators are FREE!', color: '#ff4081' },
      ].map((item, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            background: item.color === '#ff4081' ? 
              'rgba(255, 64, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            borderRadius: 1.5,
            border: `1px solid ${item.color === '#ff4081' ? 
              'rgba(255, 64, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
          }}
        >
          <Box
            sx={{
              fontSize: '1.2rem',
              width: 30,
              textAlign: 'center'
            }}
          >
            {item.emoji}
          </Box>
          <Typography 
            sx={{ 
              color: item.color === '#ff4081' ? '#ff4081' : '#e0e0e0',
              fontWeight: item.color === '#ff4081' ? 700 : 500,
              fontSize: { xs: '0.9rem', md: '1rem' }
            }}
          >
            {item.text}
          </Typography>
        </Box>
      ))}
    </Box>

    {/* Bottom Message */}
    <Box sx={{ 
      mt: 2,
      p: 2,
      background: 'rgba(33, 150, 243, 0.1)',
      borderRadius: 2,
      border: '1px solid rgba(33, 150, 243, 0.3)',
      textAlign: 'center'
    }}>
      <Typography 
        variant="body1" 
        sx={{ 
          color: '#2196f3', 
          fontWeight: 600,
          fontSize: { xs: '0.9rem', md: '1rem' }
        }}
      >
        💡 Fair fees, amazing features, endless fun!
      </Typography>
    </Box>
  </Box>
));

const GetHelpContent = React.memo(() => (
  <Box sx={{ p: 2 }}>
    {/* Header */}
    <Box sx={{ 
      textAlign: 'center',
      mb: 3
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#ffffff', 
          fontWeight: 700, 
          mb: 1,
          fontSize: { xs: '1.1rem', md: '1.3rem' }
        }}
      >
        🤝 Need Help? We're Here!
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          color: '#e0e0e0',
          fontSize: { xs: '0.9rem', md: '1rem' }
        }}
      >
        Get fast support from our friendly team ⚡
      </Typography>
    </Box>

    {/* Contact Options */}
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 2,
      mb: 2
    }}>
      
      {/* Discord Button */}
      <Button
        variant="contained"
        sx={{
          background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
          color: '#ffffff',
          textTransform: 'none',
          borderRadius: 2,
          py: 1.5,
          fontSize: { xs: '1rem', md: '1.1rem' },
          fontWeight: 600,
          boxShadow: '0 4px 15px rgba(88, 101, 242, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4752C4 0%, #5865F2 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(88, 101, 242, 0.4)',
          },
          transition: 'all 0.3s ease'
        }}
        startIcon={
          <Box sx={{ fontSize: '1.3rem' }}>💬</Box>
        }
        onClick={() => window.open('https://discord.gg/2yU5hEmWVh', '_blank', 'noopener,noreferrer')}
        aria-label="Join Catsino Discord Server"
        fullWidth
      >
        <Box sx={{ textAlign: 'left', width: '100%' }}>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.1rem' } }}>
            Discord Community
          </Typography>
          <Typography sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' }, opacity: 0.9 }}>
            Chat with us & other players instantly!
          </Typography>
        </Box>
      </Button>

      {/* Twitter/X Button */}
      <Button
        variant="contained"
        sx={{
          background: 'linear-gradient(135deg, #000000 0%, #1DA1F2 100%)',
          color: '#ffffff',
          textTransform: 'none',
          borderRadius: 2,
          py: 1.5,
          fontSize: { xs: '1rem', md: '1.1rem' },
          fontWeight: 600,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1DA1F2 0%, #000000 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(29, 161, 242, 0.4)',
          },
          transition: 'all 0.3s ease'
        }}
        startIcon={
          <FontAwesomeIcon icon={faXTwitter} style={{ fontSize: '1.2rem' }} />
        }
        onClick={() => window.open('https://x.com/catsinofun', '_blank', 'noopener,noreferrer')}
        aria-label="Follow Catsino on Twitter/X"
        fullWidth
      >
        <Box sx={{ textAlign: 'left', width: '100%' }}>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.1rem' } }}>
            Twitter / X
          </Typography>
          <Typography sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' }, opacity: 0.9 }}>
            Follow for updates & quick support!
          </Typography>
        </Box>
      </Button>

    </Box>

    {/* Response Time Info */}
    <Box sx={{ 
      background: 'rgba(76, 175, 80, 0.1)',
      borderRadius: 2,
      p: 2,
      border: '1px solid rgba(76, 175, 80, 0.3)',
      textAlign: 'center'
    }}>
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#4caf50', 
          fontWeight: 600,
          fontSize: { xs: '0.9rem', md: '1rem' }
        }}
      >
        ⚡ We usually respond within 24 hours!
      </Typography>
    </Box>

    {/* FAQ Suggestion */}
    <Box sx={{ 
      mt: 2,
      p: 2,
      background: 'rgba(255, 152, 0, 0.1)',
      borderRadius: 2,
      border: '1px solid rgba(255, 152, 0, 0.3)',
      textAlign: 'center'
    }}>
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#ff9800', 
          fontWeight: 600,
          fontSize: { xs: '0.8rem', md: '0.9rem' }
        }}
      >
        💡 Check our FAQ first - your answer might be there already!
      </Typography>
    </Box>
  </Box>
));

// --- Static data for Accordion sections ---
const accordionSections = [
  {
    id: 'how-it-works',
    title: '🚀 How-To',
    ContentComponent: HowItWorksContent,
  },
  {
    id: 'games',
    title: '🎮 Games',
    ContentComponent: GamesContent,
  },
  {
    id: 'fees',
    title: '💸 Fees',
    ContentComponent: FeesContent,
  },
  {
    id: 'get-help',
    title: '📞 Support',
    ContentComponent: GetHelpContent,
  },
];


function HowToPlayModalComponent({ modalIsOpen, closeModal }) {
  const [copiedTooltipOpen, setCopiedTooltipOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isDesktop = useMediaQuery("(min-width: 1025px)"); // This is equivalent to !isMobile && !isTablet if breakpoints are contiguous

  const handleCopyAddress = useCallback(async () => {
    if (!navigator.clipboard) {
      // Fallback for environments where clipboard API is not available (e.g. insecure contexts)
      console.warn('Clipboard API not available.');
      // You could implement a textarea-based copy fallback here if needed
      return;
    }
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopiedTooltipOpen(true);
      const timerId = setTimeout(() => {
        setCopiedTooltipOpen(false);
      }, 1500);
      // It's good practice to clear timeout if component unmounts,
      // but for a short-lived tooltip, it's often omitted.
      // For robustness: return () => clearTimeout(timerId); (would need useEffect for this)
    } catch (err) {
      console.error('Failed to copy address', err);
      // Optionally show an error tooltip/message to the user
    }
  }, []); // No dependencies as CONTRACT_ADDRESS is constant and setCopiedTooltipOpen is stable

  const shortenedAddress = useMemo(() => {
    if (isMobile) {
      return `${CONTRACT_ADDRESS.slice(0, 5)}...${CONTRACT_ADDRESS.slice(-4)}`;
    } else if (isTablet) {
      return `${CONTRACT_ADDRESS.slice(0, 10)}...${CONTRACT_ADDRESS.slice(-6)}`;
    }
    // else if (isDesktop) // This can be the default case
    return `${CONTRACT_ADDRESS.slice(0, 18)}...${CONTRACT_ADDRESS.slice(-22)}`;
    // return CONTRACT_ADDRESS; // Fallback if none match, though one always should
  }, [isMobile, isTablet]); // isDesktop is derived, so not needed if logic is mutually exclusive


  return (
    <Modal
      open={modalIsOpen || false} // Ensure open is always boolean
      onClose={closeModal}
      closeAfterTransition
      sx={{ zIndex: 1300 }} // Existing styling
      BackdropProps={{
        style: { backgroundColor: 'rgba(0, 0, 0, 0.85)' }, // Existing styling
      }}
    >
      <Box
        sx={{ // Existing styling preserved
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: '80vw', md: '60vw', lg: '50vw' },
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 3,
          p: { xs: 2, sm: 3, md: 4 },
          background: 'rgba(30, 30, 30, 0.3)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
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
            component="h2" // Good for semantics
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
            aria-label="Close how to play modal" // Accessibility
            sx={{ // Existing styling
              position: 'absolute',
              top: { xs: 12, sm: 16, md: 20 }, // Responsive positioning
              right: { xs: 12, sm: 16, md: 20 },
              minWidth: 'auto',
              p: 0.8, // Adjusted padding
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              borderRadius: '50%',
              zIndex: 1 // Ensure it's above other header content if any overlap
            }}
          >
            <CloseIcon />
          </Button>
        </Box>

        {/* ACCORDIONS */}
        {accordionSections.map(({ id, title, ContentComponent }) => (
          <Accordion
            key={id} // Use stable ID from data
            defaultExpanded={id === 'how-it-works'} // Optionally expand the first item by default
            sx={{ // Existing styling
              background: 'rgba(40, 40, 40, 0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              mb: 1.5,
              '&:before': { display: 'none' },
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
              aria-controls={`${id}-content`} // Accessibility
              id={`${id}-header`} // Accessibility
              sx={{ // Existing styling
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'inherit', // Use parent's border radius for top corners when closed
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
                variant="h6" // Keep as h6, or adjust if main title is h2
                component="h3" // Good for semantics within an h2 modal title
                sx={{
                  fontWeight: 600,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{ // Existing styling
                background: 'rgba(30, 30, 30, 0.2)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)', // Add subtle top border for details
                borderRadius: '0 0 8px 8px', // Ensure bottom corners are rounded
                p: { xs: 1.5, sm: 2, md: 3 }, // Responsive padding
                color: '#e0e0e0',
              }}
            >
              <ContentComponent />
            </AccordionDetails>
          </Accordion>
        ))}
        {/* <Box sx={{ mt: 3, p: 2, background: 'rgba(0,0,0,0.2)', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                Contract Address:
            </Typography>
            <Tooltip title={copiedTooltipOpen ? "Copied!" : "Copy Address"} placement="top" open={copiedTooltipOpen} arrow>
                <Button
                    onClick={handleCopyAddress}
                    variant="text"
                    sx={{ 
                        color: '#ffffff', 
                        textTransform: 'none', 
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        p: '4px 8px',
                        '&:hover': { background: 'rgba(255,255,255,0.1)'}
                    }}
                    startIcon={<ContentCopyIcon sx={{fontSize: '1rem'}}/>}
                >
                    {shortenedAddress}
                </Button>
            </Tooltip>
        </Box> */}
      </Box>
    </Modal>
  );
}

// Memoize the component
const HowToPlayModal = React.memo(HowToPlayModalComponent);
export default HowToPlayModal;