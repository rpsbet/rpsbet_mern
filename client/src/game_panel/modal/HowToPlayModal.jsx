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
  TableCell,
  ListItemIcon,
  Tooltip,
  Divider,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import CasinoIcon from "@mui/icons-material/Casino";
import CardGiftcard from "@mui/icons-material/CardGiftcard";
import QuestionMark from "@mui/icons-material/QuestionMark";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXTwitter, faTelegram, faYoutube, faTiktok } from "@fortawesome/free-brands-svg-icons";
import EmailIcon from "@mui/icons-material/Email";

function HowToPlayModal({ modalIsOpen, closeModal }) {
  // ------------------ STYLES ------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#0a0a0a', // Same background color as login
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 500,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto',
  };
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
      return `${address.slice(0, 5)}...${address.slice(-4)}`; // Most compact on mobile
    } else if (isTablet) {
      return `${address.slice(0, 10)}...${address.slice(-6)}`; // Moderately shortened
    } else if (isDesktop) {
      return `${address.slice(0, 18)}...${address.slice(-22)}`; // Slightly shortened for desktop
    }
    return address; // Fallback (unlikely needed)
  };

  return (
    <Modal
      open={modalIsOpen || false}
      onClose={closeModal}
      closeAfterTransition
      sx={{ zIndex: 1300 }}
      BackdropProps={{
        style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
      }}
    >
      <Box sx={modalBoxStyle}>
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            <QuestionMark sx={{ mr: 1 }} />
            HOW IT WORKS
          </Typography>
          <Button variant="text" color="error" onClick={closeModal}>
            ×
          </Button>
        </Box>

        {/* ACCORDIONS */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">🚀 HOW IT WORKS</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <span
                style={{
                  background: "linear-gradient(165deg, #ffd000, #D32F2F)",
                  padding: "0em 0.4em",
                  borderRadius: 1,
                }}
              >
                Catsino.fun
              </span>{" "}
              lets **creators** raise funds with games! 🎮
            </Typography>

            <List sx={{ pl: 2 }}>
              {[
                { number: "1️⃣", title: "Create a Game", desc: "Choose RPS, Quick Shoot or Custom." },
                { number: "2️⃣", title: "Raise Funds", desc: "Players bet or invest in your game." },
                { number: "3️⃣", title: "Cash Out Anytime", desc: "Secure gains or stay in for bigger rewards." },
                { number: "4️⃣", title: "Game Graduates", desc: "Once enough funds are raised, it converts to a tradeable token." },
                {
                  number: "5️⃣", title: "Liquidity Locked", desc:
                    <>
                      80% goes to{" "}
                      <span
                        style={{
                          background: "linear-gradient(165deg, #ffd000, #D32F2F)",
                          padding: "0em 0.4em",
                          borderRadius: 1,
                        }}
                      >
                        Raydium
                      </span>{" "}
                      forever, while 20% is shared with holders.
                    </>
                },
              ].map((item, index) => (
                <ListItem key={index} sx={{ alignItems: "flex-start" }}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        backgroundColor: "transparent",
                        fontSize: "1.5rem",
                      }}
                    >
                      {item.number}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography fontWeight="bold">{item.title}</Typography>}
                    secondary={item.desc}
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="body2" paragraph>
              💡 **Want more?** <br />
              **Explore tools like AI, staking rewards, loans, and more!**
            </Typography>
          </AccordionDetails>
        </Accordion>
        {/* New Accordion for $RPS Token */}
        <Accordion sx={{ boxShadow: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">💰 $RPS Token</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                <Typography variant="body2" fontWeight="bold">
                  Holders earn **10% of platform fees**! 💸
                </Typography>
              </ListItem>
              <ListItem>
                <ListItemIcon><LockOpenIcon color="primary" /></ListItemIcon>
                <Typography variant="body2" fontWeight="bold">
                  Holders unlock **all AI models** instantly (Hold **2.5M** $RPS to qualify). 🔓
                </Typography>
              </ListItem>
            </List>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="subtitle2" fontWeight="bold">
                🔗 Contract Address (Click to Copy)
              </Typography>
              <Tooltip
                title="Copied!"
                open={copiedTooltipOpen}
                disableFocusListener
                disableHoverListener
                disableTouchListener
                placement="top"
                arrow
              >
                <Typography
                  variant="body1"
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mt: 1,
                    gap: 0.5,
                    color: "primary.main",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={handleCopyAddress}
                >
                  <ContentCopyIcon fontSize="small" />
                  <Link underline="none">{shortenAddress(CONTRACT_ADDRESS, 9, 9)}</Link>
                </Typography>
              </Tooltip>
            </Box>
          </AccordionDetails>
        </Accordion>
        <Accordion sx={{ boxShadow: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">🎮 Games</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Custom */}
            <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
              <CasinoIcon color="warning" /> Custom
            </Typography>
            <Typography variant="body2">
              <strong>🎯 Objective:</strong> Win the creator-designed game to earn from the multiplier (varies by game).
            </Typography>
            <Typography variant="body2" fontWeight="bold">🕹️ Gameplay:</Typography>
            <List dense>
              {[
                "Enter a predetermined Bet Amount.",
                "Follow the unique rules set by the game creator.",
                "Win to earn a multiplier on your bet (determined by the specific game design).",
              ].map((text, index) => (
                <ListItem key={index}>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary={<Typography variant="body2">{text}</Typography>} />
                </ListItem>
              ))}
            </List>
            {/* Quick Shoot */}
            <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
              <SportsSoccerIcon color="primary" /> Quick Shoot
            </Typography>
            <Typography variant="body2"><strong>🎯 Objective:</strong> Score a goal past the AI keeper.</Typography>
            <Typography variant="body2" fontWeight="bold">🕹️ Gameplay:</Typography>
            <List dense>
              {[
                "Enter a predetermined Bet Amount.",
                "Choose a direction to shoot against the AI keeper.",
                "If you score, you win 1.25x to 4x your Bet Amount.",
              ].map((text, index) => (
                <ListItem key={index}>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary={<Typography variant="body2">{text}</Typography>} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* RPS */}
            <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: "bold" }}>
              <CardGiftcard color="secondary" /> RPS (Rock Paper Scissors)
            </Typography>
            <Typography variant="body2"><strong>🎯 Objective:</strong> Predict the correct hand gesture.</Typography>
            <Typography variant="body2" fontWeight="bold">🕹️ Gameplay:</Typography>
            <List dense>
              {[
                "Enter a predetermined Bet Amount.",
                'Choose "Rock", "Paper", or "Scissors" to play against the AI.',
                "Winner is determined by: Rock beats Scissors, Scissors beats Paper, and Paper beats Rock.",
              ].map((text, index) => (
                <ListItem key={index}>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary={<Typography variant="body2">{text}</Typography>} />
                </ListItem>
              ))}
            </List>

          </AccordionDetails>
        </Accordion>
        <Accordion sx={{ boxShadow: 3, }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AttachMoneyIcon color="success" /> Fees
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" fontWeight="bold">
              💸 **1% fee** on all transactions **except** tipping & loans.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Get Help Section */}
        <Accordion sx={{ boxShadow: 3, mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <HelpOutlineIcon color="primary" /> Get Help
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" fontWeight="bold">
              Need assistance? Contact us via:
            </Typography>

            <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FontAwesomeIcon icon={faXTwitter} />}
                onClick={() => window.open("https://x.com/rpsdotgame", "_blank")}
              >
                Twitter
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<FontAwesomeIcon icon={faTelegram} />}
                onClick={() => window.open("https://t.me/rpsgamesol", "_blank")}
              >
                Telegram
              </Button>
              {/* <Button
                variant="contained"
                color="secondary"
                startIcon={<EmailIcon />}
                onClick={() => window.open("mailto:inv_inquiries@catsino.fun")}
              >
                Email
              </Button> */}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Modal>
  );
}

export default HowToPlayModal;
