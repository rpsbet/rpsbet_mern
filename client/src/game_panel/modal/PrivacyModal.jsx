import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons';

function PrivacyModal({ modalIsOpen, closeModal }) {

  return (
    <Modal
      open={modalIsOpen || false}
      onClose={closeModal}
      sx={{ zIndex: 1300 }}
      BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
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
            sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
          >
            Privacy&nbsp;
            <Typography
              component="span"
              sx={{ color: '#d81719', fontWeight: 'inherit' }}
            >
              Catsino
            </Typography>
            <Typography
              component="span"
              sx={{ color: '#ebddca', ml: 0.5, fontWeight: 'inherit' }}
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
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Privacy Policy
          </Typography>
          <Typography variant="body2">
            <strong>Last updated:</strong> June 13th, 2025
          </Typography>

          <Typography variant="body2" paragraph>
            "Catsino.Fun," ("us", "we", or "our") operates https://catsino.fun (the
            "Site"), an AI-powered game generation platform. This page informs you of our 
            policies regarding the collection, use and disclosure of Personal Information we 
            receive from users of the Site. We use your Personal Information only for
            providing and improving our AI game generation services. By using the Site, you 
            agree to the collection and use of information in accordance with this
            policy. If you do not want Catsino.Fun to collect, store, use, or share
            your information in the ways described in this Privacy Policy, you
            may not use Catsino.Fun's AI game generation services. For
            purposes of data protection laws, Catsino.Fun is the "data controller"
            of your personal information.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Information Collection And Use
          </Typography>
          <Typography variant="body2" paragraph>
            While using our AI game generation platform, we may ask you to provide us with certain
            personally identifiable information that can be used to contact or
            identify you. This includes your email address for account creation and 
            authentication purposes. Personally identifiable information may include, but is not 
            limited to your name and email address ("Personal Information"). We do not collect 
            payment details directly as this is handled through secure third-party payment 
            processors including PayPal (https://www.paypal.com/) and Stripe (https://stripe.com/).
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            AI Game Generation Data
          </Typography>
          <Typography variant="body2" paragraph>
            When you use our AI game generation service, we collect and process information about 
            your game creation requests, including prompts, preferences, and generated game content. 
            This data helps us improve our AI algorithms and provide better game generation services. 
            Game creation history and preferences may be stored locally on your device and on our 
            secure servers to enhance your experience across sessions.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Payment & Gaming Information
          </Typography>
          <Typography variant="body2" paragraph>
            We collect information related to any gaming activities and transactions you make on our 
            platform. For all payments on catsino.fun, our third-party payment processors will collect 
            the billing and financial information needed to process your transactions. This may include 
            your postal address, email address, and financial information. Catsino.Fun's payment 
            processors do not share your financial information, like credit card numbers, with us, but 
            they may share non-financial information related to your transactions, like your billing 
            address and transaction amounts. For outgoing payments (winnings), we may collect your 
            account-specific payment details to process payments to you.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Game Data & Analytics
          </Typography>
          <Typography variant="body2" paragraph>
            We collect data about your interactions with AI-generated games, including gameplay 
            statistics, performance metrics, and user preferences. This information helps us understand 
            how our games are used and allows us to improve the AI generation algorithms. Game session 
            data is anonymized and used for analytical purposes to enhance the overall platform experience.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Customer Support Correspondence
          </Typography>
          <Typography variant="body2" paragraph>
            We keep records of any correspondence between us through our Discord community or 
            Twitter/X support channels. When you ask for help from our support team, we will collect 
            and store the contact information you provide (generally your Discord username, Twitter handle, 
            or email address), information about your game generation activity, and your Catsino.Fun 
            username. We will also store communications you have with our support team and any additional 
            information in those communications to provide support and improve our AI services.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Third-Party Integration Information
          </Typography>
          <Typography variant="body2" paragraph>
            We may collect some information from other companies, including social networks, if you 
            access our AI game generation platform through your accounts with those companies or choose 
            to connect your accounts. If you play games on Catsino.Fun or access any of our services 
            through connected third-party applications, including social networks like Discord or Twitter, 
            Catsino.Fun may receive certain information about you from the provider of the third-party 
            application in accordance with their privacy policies.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Cookies and Automated Information Collection
          </Typography>
          <Typography variant="body2" paragraph>
            We collect information about your device and how you use our AI game generation services, 
            including using cookies and local storage. We use cookies to recognize you and/or your 
            device(s) across different sessions and to remember your game generation preferences. Local 
            storage is used to save your game history, settings, and AI-generated content for offline 
            access and improved user experience.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Data Security & AI Processing
          </Typography>
          <Typography variant="body2" paragraph>
            Your data security is important to us. We implement appropriate security measures to protect 
            your personal information against unauthorized access, alteration, disclosure, or destruction. 
            AI game generation requests are processed securely, and we do not store sensitive personal 
            information beyond what is necessary for service operation. Generated game content may be 
            cached temporarily to improve performance.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Changes To This Privacy Policy
          </Typography>
          <Typography variant="body2" paragraph>
            This Privacy Policy is effective as of June 13th, 2025 and will
            remain in effect except with respect to any changes in its
            provisions in the future, which will be in effect immediately after
            being posted on this page. We will notify users of significant changes 
            through our Discord community and website announcements.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 3, mb: 2 }}>
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
                  Privacy questions & instant support!
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
                  Privacy updates & data rights info!
                </Typography>
              </Box>
            </Button>
          </Box>

          <Typography variant="body2" paragraph sx={{ mt: 2 }}>
            If you have any questions about this Privacy Policy, data collection, or how we handle 
            your information in our AI game generation platform, please reach out through our 
            Discord community or Twitter/X for prompt assistance.
          </Typography>

          <Typography variant="body2" sx={{ mt: 2, fontSize: '0.8rem', opacity: 0.7 }}>
            Your privacy is important to us. We are committed to protecting your personal information 
            and being transparent about how we use data to improve our AI game generation services. 
            We comply with applicable data protection regulations and regularly review our privacy 
            practices to ensure your information remains secure.
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
}

export default PrivacyModal;