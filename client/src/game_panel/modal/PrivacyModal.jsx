import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
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
            <strong>Last updated:</strong> 3rd January 2025
          </Typography>

          <Typography variant="body2" paragraph>
            “Catsino.Fun,” ("us", "we", or "our") operates https://catsino.fun (the
            "Site"). This page informs you of our policies regarding the
            collection, use and disclosure of Personal Information we receive
            from users of the Site. We use your Personal Information only for
            providing and improving the Site. By using the Site, you agree to
            the collection and use of information in accordance with this
            policy. If you do not want Catsino.Fun to collect, store, use, or share
            your information in the ways described in this Privacy Policy, you
            may not play Catsino.Fun games or use Catsino.Fun’s other Services. For
            purposes of data protection laws, Catsino.Fun is the “data controller”
            of your personal information.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Information Collection And Use
          </Typography>
          <Typography variant="body2" paragraph>
            While using our Site, we may ask you to provide us with certain
            personally identifiable information that can be used to contact or
            identify you. This only includes your email address. Personally
            identifiable information may include, but is not limited to your
            name ("Personal Information"). We do not collect payment details as
            this is done through third-party payment merchants including PayPal
            (https://www.paypal.com/) and Stripe (https://.stripe.com/).
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Payment Information
          </Typography>
          <Typography variant="body2" paragraph>
            We’ll collect information related to any bets you make. For all bets
            on catsino.fun, our third-party payment processor will collect the
            billing and financial information it needs to process your charges.
            This may include your postal address, email address, and financial
            information. Catsino.Fun’s payment processors do not share your
            financial information, like credit card numbers, with Catsino.Fun, but
            they may share non-financial information with us related to your
            purchases, like your billing address, and the amount paid. For
            outgoing payments (‘Winnings’), we may collect your account-specific
            payment details in order to process payments to you.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Customer Support Correspondence
          </Typography>
          <Typography variant="body2" paragraph>
            We’ll keep a record of any correspondence between us. When you ask
            for help from our Customer Support team, we will collect and store
            the contact information you give them (generally just your email
            address), information about your game play or activity on our
            Services, and your Catsino.Fun username and/or social network ID
            number. We will also store the communications you have with our
            Customer Service team and any additional information in those
            communications in order to provide support and improve the Services.
          </Typography>

          <Typography variant="body2" paragraph>
            Information About You That We Get From Connected Third-Party
            Applications, Including Social Networks We’ll collect some
            information from other companies, including social networks, if you
            access our games through your accounts with those companies or you
            choose to connect your accounts with those companies to our games.
            If you play Catsino.Fun or access any of our other Services on
            connected third-party applications or connect our Services to any
            third-party applications, including social networks like Facebook,
            Catsino.Fun may receive certain information about you from the provider
            of the third-party application.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Cookies and Other Automated Information Collection
          </Typography>
          <Typography variant="body2" paragraph>
            We’ll collect information about your device and how you use our
            Services, including using cookies. As further described in our
            Cookie Notice, we use cookies to recognize you and/or your device(s)
            on, off, and across different Services and devices.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Changes To This Privacy Policy
          </Typography>
          <Typography variant="body2" paragraph>
            This Privacy Policy is effective as of 22nd August 2022 and will
            remain in effect except with respect to any changes in its
            provisions in the future, which will be in effect immediately after
            being posted on this page.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Contact Us
          </Typography>
          <Typography variant="body2" paragraph>
            If you have any questions about this Privacy Policy, please contact{' '}
            <strong>@PimpedPistols on Telegram</strong>.
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
}

export default PrivacyModal;
