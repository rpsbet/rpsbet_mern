import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';

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
            <strong>Last updated:</strong> June 13th, 2025
          </Typography>
          <Typography variant="h6" sx={{ mt: 1 }}>
            Welcome to Catsino.Fun!
          </Typography>
          <Typography variant="body2" paragraph>
            These terms and conditions outline the rules and regulations for the
            use of Catsino.Fun's AI-powered game generation platform, located at catsino.fun. 
            By accessing this site we assume you accept these terms and conditions. Do not 
            continue to use Catsino.Fun if you do not agree to take all of the terms and
            conditions stated on this page.
          </Typography>

          <Typography variant="h6">1.0 General</Typography>
          <Typography variant="h6">1.1 Service Description</Typography>
          <Typography variant="body2" paragraph>
            Catsino.Fun provides an AI-powered game generation service that creates
            custom interactive games for entertainment purposes. All games are generated
            using artificial intelligence and are provided for recreational use only.
          </Typography>

          <Typography variant="h6">1.2 Cookies & Data</Typography>
          <Typography variant="body2" paragraph>
            We employ the use of cookies and local storage to enhance your gaming experience.
            By accessing Catsino.Fun, you agree to the use of cookies in accordance with
            our Privacy Policy. Game data and preferences are stored locally on your device.
          </Typography>

          <Typography variant="h6">1.3 Intellectual Property</Typography>
          <Typography variant="body2" paragraph>
            Unless otherwise stated, Catsino.Fun and/or its licensors own the
            intellectual property rights for all material on Catsino.Fun. Games generated
            by our AI are provided under our license and may not be redistributed commercially
            without permission.
          </Typography>

          <Typography variant="h6">1.4 User-Generated Content</Typography>
          <Typography variant="body2" paragraph>
            When you create games using our AI service, you retain ownership of your
            creative input, but grant Catsino.Fun a license to generate and host the
            resulting games for your use on our platform.
          </Typography>

          <Typography variant="h6">1.5 Content Liability</Typography>
          <Typography variant="body2" paragraph>
            We shall not be held responsible for any content generated by our AI system
            or user interactions within generated games. Users are responsible for their
            own conduct and any content they create or share.
          </Typography>

          <Typography variant="h6">1.6 Game Generation & AI</Typography>
          <Typography variant="body2" paragraph>
            Our AI game generation service is provided "as is" and we cannot guarantee
            the functionality, performance, or suitability of generated games. Games are
            created dynamically and may contain bugs or unexpected behavior.
          </Typography>

          <Typography variant="h6">
            2.0 Your Dealings With Other Players
          </Typography>
          <Typography variant="body2" paragraph>
            You are responsible for your interactions with other players in multiplayer
            games or community features. If you have a dispute with another player, you
            release Catsino.Fun from responsibility, claims, demands, and/or damages.
          </Typography>

          <Typography variant="h6">3.0 Payment & Gaming Terms</Typography>
          <Typography variant="body2" paragraph>
            We provide entertainment services through AI-generated games. Any in-game
            currency, points, or virtual items have no real-world value and are purely
            for entertainment purposes within our platform.
          </Typography>

          <Typography variant="h6">4.0 Age & Jurisdiction</Typography>
          <Typography variant="body2" paragraph>
            You must be at least 18 years old to use our services. Our platform is
            intended for adult entertainment and complies with applicable gaming laws
            in your jurisdiction.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Contact & Support
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

          <Typography variant="h6" sx={{ mt: 2 }}>
            For Technical Issues
          </Typography>
          <Typography variant="body2" paragraph>
            For any technical problems with AI game generation, bugs, or general
            inquiries, please reach out through our Discord community or Twitter/X
            for the fastest response. We thank you for using Catsino.Fun!
          </Typography>

          <Typography variant="body2" sx={{ mt: 2, fontSize: '0.8rem', opacity: 0.7 }}>
            By using our AI game generation service, you acknowledge that games are
            created dynamically and may vary in quality and functionality. Catsino.Fun
            strives to provide the best possible gaming experience through artificial
            intelligence technology.
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
}

export default TermsModal;