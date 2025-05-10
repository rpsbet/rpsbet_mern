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
        { id: 'hw1', number: '1️⃣', title: 'Create a Game', desc: 'Choose RPS, Quick Shoot, or Custom.' },
        { id: 'hw2', number: '2️⃣', title: 'Raise Funds', desc: 'Players bet or invest in your game.' },
        { id: 'hw3', number: '3️⃣', title: 'Cash Out Anytime', desc: 'Secure gains or stay for bigger rewards.' },
        { id: 'hw4', number: '4️⃣', title: 'Game Graduates', desc: 'Converts to a tradeable token once funded.' },
        {
          id: 'hw5',
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
      ].map((item) => (
        <ListItem
          key={item.id}
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
    <Typography variant="body2" sx={{ color: '#e0e0e0', mt: 1 }}>
      💡 <strong>Want more?</strong> Explore AI tools, staking rewards, loans, and beyond!
    </Typography>
  </>
));

const GamesContent = React.memo(() => (
  <>
    {/* Custom */}
    <Typography
      variant="subtitle1"
      sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: '#ffffff', mb: 1 }}
    >
      <CasinoIcon sx={{ color: '#ff9800' }} /> Custom
    </Typography>
    <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 0.5 }}>
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
        <ListItem key={`custom-rule-${index}`} sx={{ py: 0.5 }}>
          <ListItemIcon sx={{minWidth: '30px'}}>
            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1rem' }} />
          </ListItemIcon>
          <ListItemText
            primary={<Typography variant="body2" sx={{ color: '#b0b0b0' }}>{text}</Typography>}
          />
        </ListItem>
      ))}
    </List>

    <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

    {/* Quick Shoot */}
    <Typography
      variant="subtitle1"
      sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: '#ffffff', mb: 1 }}
    >
      <SportsSoccerIcon sx={{ color: '#2196f3' }} /> Quick Shoot
    </Typography>
    <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 0.5 }}>
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
        <ListItem key={`qs-rule-${index}`} sx={{ py: 0.5 }}>
          <ListItemIcon sx={{minWidth: '30px'}}>
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
      sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: '#ffffff', mb: 1 }}
    >
      <CardGiftcard sx={{ color: '#f06292' }} /> RPS (Rock Paper Scissors)
    </Typography>
    <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 0.5 }}>
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
        <ListItem key={`rps-rule-${index}`} sx={{ py: 0.5 }}>
          <ListItemIcon sx={{minWidth: '30px'}}>
            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: '1rem' }} />
          </ListItemIcon>
          <ListItemText
            primary={<Typography variant="body2" sx={{ color: '#b0b0b0' }}>{text}</Typography>}
          />
        </ListItem>
      ))}
    </List>
  </>
));

const FeesContent = React.memo(() => (
  <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600 }}>
    💸 <strong>5% fee (2.5% for Black Elite members)</strong> on all transactions except tipping & loans.
  </Typography>
));

const GetHelpContent = React.memo(() => (
  <>
    <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 600, mb:1 }}>
      Need assistance? Contact us via:
    </Typography>
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}> {/* Increased gap slightly */}
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
        onClick={() => window.open('https://x.com/catsinofun', '_blank', 'noopener,noreferrer')}
        aria-label="Visit Catsino on Twitter"
      >
        Twitter / X
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
        onClick={() => window.open('https://t.me/catsinofun', '_blank', 'noopener,noreferrer')}
        aria-label="Join Catsino on Telegram"
      >
        Telegram
      </Button>
    </Box>
  </>
));

// --- Static data for Accordion sections ---
const accordionSections = [
  {
    id: 'how-it-works',
    title: '🚀 How It Works',
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
    title: '📞 Get Help',
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
                p: {xs: 1.5, sm: 2, md: 3}, // Responsive padding
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