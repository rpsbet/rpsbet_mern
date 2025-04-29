import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

function TermsModal({ modalIsOpen, closeModal }) {

  return (
    <Modal
      open={modalIsOpen || false}
      onClose={closeModal}
      sx={{ zIndex: 1300 }}
      BackdropProps={{
        style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
          >
            Terms&nbsp;
            <Typography
              component="span"
              sx={{ color: '#d81719', fontWeight: 'inherit' }}
            >
              Catsino
            </Typography>
            &nbsp;
            <Typography
              component="span"
              sx={{ color: '#ebddca', fontWeight: 'inherit' }}
            >
              Fun
            </Typography>
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

        {/* BODY */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Terms of Service
          </Typography>
          <Typography variant="body2">
            <strong>Last updated:</strong> 3rd January 2025
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            Welcome to Catsino.Fun!
          </Typography>
          <Typography variant="body2" paragraph>
            These terms and conditions outline the rules and regulations for the
            use of Catsino.Fun's site, located at catsino.fun. By accessing this site
            we assume you accept these terms and conditions. Do not continue to
            use Catsino.Fun if you do not agree to take all of the terms and
            conditions stated on this page.
          </Typography>

          <Typography variant="h6">1.0 General</Typography>
          <Typography variant="h6">1.1 Cookies</Typography>
          <Typography variant="body2" paragraph>
            We employ the use of cookies. By accessing Catsino.Fun, you agreed to
            use cookies in agreement with the Catsino.Fun's Privacy Policy.
          </Typography>

          <Typography variant="h6">1.2 License</Typography>
          <Typography variant="body2" paragraph>
            Unless otherwise stated, Catsino.Fun and/or its licensors own the
            intellectual property rights for all material on Catsino.Fun.
          </Typography>

          <Typography variant="h6">1.3 Hyperlinking to our Content</Typography>
          <Typography variant="body2" paragraph>
            The following organizations may link to our site without prior
            written approval: government agencies, search engines, news
            organizations, and online directory distributors.
          </Typography>

          <Typography variant="h6">1.4 iFrames</Typography>
          <Typography variant="body2" paragraph>
            Without prior approval and written permission, you may not create
            frames around our web pages that alter in any way the visual
            presentation or appearance of our site.
          </Typography>

          <Typography variant="h6">1.5 Content Liability</Typography>
          <Typography variant="body2" paragraph>
            We shall not be held responsible for any content that appears on
            your site.
          </Typography>

          <Typography variant="h6">
            2.0 Your Dealings With Other Players
          </Typography>
          <Typography variant="body2" paragraph>
            You are responsible for your interactions with other players. If you
            have a dispute with another player, you release Catsino.Fun from
            responsibility, claims, demands, and/or damages.
          </Typography>

          <Typography variant="h6">3.0 Payment Terms</Typography>
          <Typography variant="body2" paragraph>
            We provide a service in the form of holding payments between peers
            within a custom game generated by AI.
          </Typography>

          <Typography variant="h6">Contact Us</Typography>
          <Typography variant="body2" paragraph>
            If you have any questions about this Terms Policy, please contact
            <strong> @PimpedPistols on Telegram</strong>.
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>
            For All Enquiries
          </Typography>
          <Typography variant="body2" paragraph>
            For any technical/general problems, please contact&nbsp;
            <Typography
              component="span"
              sx={{ color: '#f5b22d', textDecoration: 'underline' }}
            >
              @PimpedPistols on Telegram
            </Typography>
            . We thank you for playing!
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
}

export default TermsModal;
