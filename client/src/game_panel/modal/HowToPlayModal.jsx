import React from 'react';
import {
  Modal,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QuestionMark from '@mui/icons-material/QuestionMark';

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
                  background: 'linear-gradient(165deg, #ffd000, #ff0000)',
                  padding: '0em 0.4em',
                  borderRadius: 1,
                }}
              >
                RPS.Game
              </span>{' '}
              casino-styled launchpad that enables you to fast-track token seeding
              using the casino's profitable business model. All games on {' '}
              <span
                style={{
                  background: 'linear-gradient(165deg, #ffd000, #ff0000)',
                  padding: '0em 0.4em',
                  borderRadius: 1,
                }}
              >
                RPS.Game
              </span>{' '} are skill-based using AI for added control. All tokens launched on{' '}
              <span
                style={{
                  background: 'linear-gradient(165deg, #ffd000, #ff0000)',
                  padding: '0em 0.4em',
                  borderRadius: 1,
                }}
              >
                RPS.Game
              </span>{' '}
              are standardized and have no private keys, minimizing risks and reducing
              the need for extensive DYOR. Each token is fairly launched with no presale
              or team allocation, ensuring an equitable environment for all participants.
            </Typography>

            <Typography variant="body2" component="div">
              <ol style={{ marginLeft: 20, paddingLeft: 0 }}>
                <li style={{ marginBottom: '0.5em' }}>

                  Join a Game.
                </li>

                <li style={{ marginBottom: '0.5em' }}>

                  Pump the Game before its Hard Cap.
                </li>

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
                  once sufficient users engage and contribute toeards its Hard Cap (set by the game creator).
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
                  and permanently burned. The remaining 20% is distributed to the Game's holders in the form of newly minted tokens.
                </li>
              </ol>
              <Typography variant="body2" paragraph>
                Note: You can also create your own Games and utilize other tools on the platform such as AI, Tax, Loaning and more.
              </Typography>
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
              <li>If you score, you win 1.25x to 4x your Bet Amount.</li>
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
              <li>
                Choose "Rock", "Paper", or "Scissors" to play against the AI.
              </li>
              <li>
                Winner is determined by: Rock beats Scissors, Scissors beats
                Paper, and Paper beats Rock.
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
              1% on all transactions except tipping and loans.
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
