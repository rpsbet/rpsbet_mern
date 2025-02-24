import React, {  useState } from 'react';
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  Tooltip,
  TableRow,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuestionMark from '@mui/icons-material/QuestionMark';
import CheckIcon from '@mui/icons-material/Check';


function HowToPlayModal({ modalIsOpen, closeModal }) {
  // ------------------ STYLES ------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#1f1a25', // Same background color as login
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
            <Typography variant="h6">HOW IT WORKS</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <span
                style={{
                  background: "linear-gradient(165deg, #ffd000, #ff0000)",
                  padding: "0em 0.4em",
                  borderRadius: 1,
                }}
              >
                RPS.Game
              </span>{" "}
              helps devs launch at lower costs by using games to amplify token seeding! No marketing wallet? No problem!
              Just create a game and let AI vary the pattern for fair and strategic launches.
            </Typography>


            <Typography variant="body2" component="div">
              <ol style={{ marginLeft: 20, paddingLeft: 0 }}>
                <li style={{ marginBottom: '0.5em' }}>Join a Game.</li>
                <li style={{ marginBottom: '0.5em' }}>Pump the Game before its Hard Cap.</li>
                <li style={{ marginBottom: '0.5em' }}>
                  Jeet at any time to secure gains or realize losses.
                </li>
                <li style={{ marginBottom: '0.5em' }}>
                  The game “graduates” from{' '}
                  <span
                    style={{
                      background: 'linear-gradient(165deg, #ffd000, #ff0000)',
                      padding: '0em 0.4em',
                      borderRadius: 1,
                    }}
                  >
                    RPS.Game
                  </span>{' '}
                  once sufficient users engage and contribute towards its Hard Cap (set by the game creator).
                </li>
                <li style={{ marginBottom: '0.5em' }}>
                  Upon graduation, 80% of the Game’s liquidity is deposited into{' '}
                  <span
                    style={{
                      background: 'linear-gradient(165deg, #ffd000, #ff0000)',
                      padding: '0em 0.4em',
                      borderRadius: 1,
                    }}
                  >
                    Raydium
                  </span>{' '}
                  and permanently burned. The remaining 20% is distributed to the Game's holders in the
                  form of newly minted tokens.
                </li>
              </ol>
              <Typography variant="body2" paragraph>
                Note: You can also create your own Games and utilize other tools on the platform such as
                AI, Tax, Loaning and more.
              </Typography>
            </Typography>

            {/* Comparison Table */}
            <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 3, borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Feature</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>RPS.Game</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>Pump.Fun</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>Memeroyale</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>Moonshot</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { feature: "Adjustable Bonding Curve Limit", rps: true, pump: false, memeroyale: false, moonshot: false },
                    { feature: "Allows Battling against Liquidity", rps: true, pump: false, memeroyale: true, moonshot: false },
                    { feature: "Portfolio Section", rps: true, pump: false, memeroyale: false, moonshot: false },
                    { feature: "Dev Staking Rewards", rps: true, pump: false, memeroyale: false, moonshot: false },
                    { feature: "Low Fees", rps: true, pump: false, memeroyale: false, moonshot: false },
                  ].map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        "&:nth-of-type(even)": { backgroundColor: "#fafafa" },
                        "&:hover": { backgroundColor: "#e0f7fa", transition: "0.3s ease-in-out" },
                      }}
                    >
                      <TableCell>{row.feature}</TableCell>
                      <TableCell align="center">{row.rps && <CheckIcon color="success" />}</TableCell>
                      <TableCell align="center">{row.pump && <CheckIcon color="success" />}</TableCell>
                      <TableCell align="center">{row.memeroyale && <CheckIcon color="success" />}</TableCell>
                      <TableCell align="center">{row.moonshot && <CheckIcon color="success" />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
        {/* New Accordion for $RPS Token */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">$RPS Token</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              <ListItem>✅ Holders earn 10% of platform fees!!!<br />  <Typography className='roll-tag' sx={{ color: 'white' }} variant="body2" paragraph>
                coming soon!
              </Typography></ListItem>
              <ListItem>🔓 Holders instantly unlock all AI models (Hold 2.5M Tokens to Qualify).</ListItem>
            </List>

          <Box sx={{ m: 2 }}>
            <Typography variant="subtitle2" className="title">
              Contract Address (click to copy)
            </Typography>
            {/* Tooltip around shortened address */}
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
                sx={{ cursor: 'pointer' }}
                onClick={handleCopyAddress}
              >
              <Link>{shortenAddress(CONTRACT_ADDRESS, 9, 9)}</Link>
              </Typography>
            </Tooltip>
          </Box>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Games</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Quick Shoot */}
            <Typography variant="subtitle1"><strong>Quick Shoot</strong></Typography>
            <Typography variant="body2"><strong>Objective:</strong> Score a goal past the keeper.</Typography>
            <Typography variant="body2"><strong>Gameplay:</strong></Typography>
            <List dense>
              <ListItem>1. Enter a predetermined Bet Amount.</ListItem>
              <ListItem>2. Choose a direction to shoot against the AI keeper.</ListItem>
              <ListItem>3. If you score, you win 1.25x to 4x your Bet Amount.</ListItem>
            </List>

            {/* RPS */}
            <Typography variant="subtitle1" sx={{ mt: 2 }}><strong>RPS</strong></Typography>
            <Typography variant="body2"><strong>Objective:</strong> Predict the correct "hand" gesture.</Typography>
            <Typography variant="body2"><strong>Gameplay:</strong></Typography>
            <List dense>
              <ListItem>1. Enter a predetermined Bet Amount.</ListItem>
              <ListItem>2. Choose "Rock", "Paper", or "Scissors" to play against the AI.</ListItem>
              <ListItem>3. Winner is determined by: Rock beats Scissors, Scissors beats Paper, and Paper beats Rock.</ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Fees</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              5% on all transactions except tipping and loans.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Get Help?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Need assistance? Reach out via:
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.open('https://x.com/RPSDG_SOL', '_blank')}
              sx={{ mr: 1 }}
            >
              X
            </Button>
            <Button
              variant="contained"
              onClick={() => window.open('https://t.me/RPSDOTGAMESOL', '_blank')}
              sx={{ mr: 1 }}
            >
              Telegram
            </Button>
            <Button
              variant="contained"
              onClick={() => window.open('mailto:inv_inquiries@rps.game')}
            >
              Email
            </Button>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Modal>
  );
}

export default HowToPlayModal;
