import React, { useState, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTelegram, faYoutube, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { Box, Typography, Link, styled, useMediaQuery, useTheme } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

// Lazy-load modals
const PrivacyModal = lazy(() => import('../modal/PrivacyModal'));
const TermsModal = lazy(() => import('../modal/TermsModal'));
const LeaderboardsModal = lazy(() => import('../modal/LeaderboardsModal'));

const FooterContainer = styled(Box)(({ theme, open }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#747f8d',
  fontSize: '0.7rem',
  fontWeight: '500',
  bottom: 0,
  left: 0,
  width: open ? 'calc(100vw - 275px)' : 'calc(100vw - 5px)',
}));

const Address = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
  fontWeight: '400',
  margin: '30px 0 20px',
  textTransform: 'capitalize',
});

const LinksContainer = styled(Box)({
  display: 'flex',
  alignItems: 'flex-end',
});

const StyledLink = styled(Link)({
  marginTop: '10px',
  color: '#b9bbbe',
  '&:hover': {
    color: '#b9bbbe',
    textDecoration: 'none',
  },
});


function Footer({ open, style }) {
  const { isDarkMode } = useSelector((state) => ({
    auth: state.auth.isAuthenticated,
    user_id: state.auth.user._id,
    isDarkMode: state.auth.isDarkMode,
  }));

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showLeaderboardsModal, setShowLeaderboardsModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpenLeaderboardsModal = () => setShowLeaderboardsModal(true);
  const handleCloseLeaderboardsModal = () => setShowLeaderboardsModal(false);

  const handleOpenTermsModal = () => setShowTermsModal(true);
  const handleCloseTermsModal = () => setShowTermsModal(false);

  const handleOpenPrivacyModal = () => setShowPrivacyModal(true);
  const handleClosePrivacyModal = () => setShowPrivacyModal(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // 'sm' is 600px by default

  const fullAddress = '74YCHZz5VWSCcXvopnS33nS3Z5kLSCJzy3nm1sfSpump';
  const truncatedAddress = isMobile
    ? `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}`
    : fullAddress;

  const bottomFooterClasses = `bottom-footer ${isDarkMode ? 'dark_mode' : ''}`;

  return (
    <div className={bottomFooterClasses} style={style}>
      <FooterContainer id="footer-container" open={open}>
        {showLeaderboardsModal && (
          <Suspense fallback={<Typography>Loading Leaderboards...</Typography>}>
            <LeaderboardsModal
              modalIsOpen={showLeaderboardsModal}
              closeModal={handleCloseLeaderboardsModal}
              isDarkMode={isDarkMode}
            />
          </Suspense>
        )}
        <Box className="social-icons" sx={{ display: 'flex', alignItems: 'center' }}>
          <span>CHECK SOCIALS FOR UPDATES ►</span>
          <a href="https://x.com/RPSDG_SOL">
            <FontAwesomeIcon icon={faXTwitter} />
          </a>
          <a href="https://t.me/RPSDOTGAMESOL">
            <FontAwesomeIcon icon={faTelegram} />
          </a>
          <a href="https://www.youtube.com/@rpsdotgame">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
          <a href="https://www.tiktok.com/@rpsdotgame">
            <FontAwesomeIcon icon={faTiktok} />
          </a>
        </Box>

        <LinksContainer>
          <StyledLink
            className="mobile-only"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleOpenLeaderboardsModal();
            }}
          >
            Leaderboards&nbsp;
          </StyledLink>
          <span className="mobile-only"> ✗ </span>&nbsp;
          <StyledLink href="https://blog.rps.game/">Blog&nbsp;</StyledLink>
          ✗
          <StyledLink href="#terms" onClick={handleOpenTermsModal}>
            &nbsp;Terms
          </StyledLink>
          &nbsp;✗
          <StyledLink href="#privacy" onClick={handleOpenPrivacyModal}>
          &nbsp;Privacy
          </StyledLink>
        </LinksContainer>
        <Address
          onClick={() => {
            navigator.clipboard.writeText('74YCHZz5VWSCcXvopnS33nS3Z5kLSCJzy3nm1sfSpump');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          sx={{ cursor: 'pointer' }}
        >
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {truncatedAddress}
            {copied ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
          </Typography>
          <Typography variant="caption" sx={{ mt: 1 }}>
            Click to copy!
          </Typography>
        </Address>
      </FooterContainer>
      {showTermsModal && (
        <Suspense fallback={<Typography>Loading Terms...</Typography>}>
          <TermsModal
            modalIsOpen={showTermsModal}
            closeModal={handleCloseTermsModal}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}
      {showPrivacyModal && (
        <Suspense fallback={<Typography>Loading Privacy...</Typography>}>
          <PrivacyModal
            modalIsOpen={showPrivacyModal}
            closeModal={handleClosePrivacyModal}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}
    </div>
  );
}

export default Footer;