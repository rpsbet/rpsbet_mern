import React from 'react';
import {
  Modal,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function HowToPlayModal({ modalIsOpen, closeModal }) {
  // ------------------ STYLES ------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#400068', // Same background color as login
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 500,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  return (
    <Modal
      open={modalIsOpen}
      onClose={closeModal}
      closeAfterTransition
      sx={{ zIndex: 1300 }}
      BackdropProps={{
        style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
      }}
    >
      <Box sx={modalBoxStyle}>
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Info
          </Typography>
          <Button variant="text" color="error" onClick={closeModal}>
            X
          </Button>
        </Box>

        {/* ACCORDIONS */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">About Us</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <span
                style={{
                  background: 'linear-gradient(165deg, #ffd000, #ff0000)',
                  padding: '0em 0.4em',
                  borderRadius: 1
                }}
              >
                RPS.Game
              </span>{' '}
              is more than just a platform—it’s a powerful game creation tool! Players can design their
              own games, and when they reach{' '}
              <strong
                style={{
                  background: 'linear-gradient(165deg, #ffd000, #ff0000)',
                  padding: '0em 0.4em',
                  borderRadius: 1
                }}
              >
                80 SOL
              </strong>{' '}
              in contributions, these games can be minted as unique tokens on the blockchain.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Quick Shoot</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <strong>Objective:</strong> To score a goal past the keeper.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Gameplay:</strong>
            </Typography>
            <ol>
              <li>Enter a predetermined Bet Amount.</li>
              <li>Choose a direction to shoot against the AI keeper.</li>
              <li>If you score, you win 1.25x to 2x your Bet Amount.</li>
            </ol>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">RPS</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              <strong>Objective:</strong> Predict the correct "hand" gesture.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Gameplay:</strong>
            </Typography>
            <ol>
              <li>Enter a predetermined Bet Amount.</li>
              <li>Choose "Rock", "Paper", or "Scissors" to play against the AI.</li>
              <li>
                Winner is determined by: Rock beats Scissors, Scissors beats Paper, and Paper beats Rock.
              </li>
            </ol>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Fees</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Hosts receive ZERO tax on their winnings AND EARN 0% - 20% from their players' winnings.
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
              onClick={() => window.open('https://x.com/rpsdotgame', '_blank')}
              sx={{ mr: 1 }}
            >
              Twitter
            </Button>
            <Button
              variant="contained"
              onClick={() => window.open('https://t.me/rpsfinance', '_blank')}
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