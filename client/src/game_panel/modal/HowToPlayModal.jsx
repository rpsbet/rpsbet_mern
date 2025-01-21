import React from 'react';
import Modal from 'react-modal';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0,
    border: 'none',
  },
};

const HowToPlayModal = ({ modalIsOpen, closeModal, isDarkMode }) => {
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="How To Play Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <Typography variant="h6" className="modal-title title">
            Info
          </Typography>
          <Button className="btn-close" variant='text' color='error'  onClick={closeModal}>
            ×
          </Button>
        </div>
        <div className="modal-body edit-modal-body how-to-play-modal-body">
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
                    borderRadius: '5px',
                  }}
                >
                  RPS.Game
                </span>{' '}
                is more than just a platform—it’s a powerful game creation tool! Players can design their own games, and
                when they reach{' '}
                <strong
                  style={{
                    background: 'linear-gradient(165deg, #ffd000, #ff0000)',
                    padding: '0em 0.4em',
                    borderRadius: '5px',
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
                  Winner is determined by these rules: Rock beats Scissors, Scissors beats Paper, and Paper beats Rock.
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
              <Button onClick={() => window.open('https://x.com/rpsdotgame', '_blank')}>Twitter</Button>
              <Button onClick={() => window.open('https://t.me/rpsfinance', '_blank')}>Telegram</Button>
              <Button onClick={() => window.open('mailto:inv_inquiries@rps.game')}>Email</Button>
            </AccordionDetails>
          </Accordion>
        </div>
      </div>
    </Modal>
  );
};

export default HowToPlayModal;