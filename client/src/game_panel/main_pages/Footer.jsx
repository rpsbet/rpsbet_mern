import React, { useState, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faYoutube, faTiktok, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { Box, Typography, Link, styled, useMediaQuery, useTheme, IconButton, Tooltip } from '@mui/material';
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
  position: 'relative',
  padding: '20px 16px',
  gap: '16px',
}));

const SocialIconsContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  '& a': {
    color: '#b9bbbe',
    fontSize: '1.2rem',
    transition: 'all 0.3s ease',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      transform: 'translateY(-2px)',
      color: '#ffffff',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&[href*="x.com"]:hover': {
      color: '#1DA1F2',
    },
    '&[href*="youtube"]:hover': {
      color: '#FF0000',
    },
    '&[href*="tiktok"]:hover': {
      color: '#000000',
    },
    '&[href*="discord"]:hover': {
      color: '#5865F2',
    },
  },
});

const LinksContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'center',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: '12px',
  },
}));

const StyledLink = styled(Link)({
  color: '#b9bbbe',
  textDecoration: 'none',
  fontSize: '0.75rem',
  fontWeight: '500',
  padding: '4px 8px',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    textDecoration: 'none',
  },
});

const Separator = styled('span')(({ theme }) => ({
  color: '#747f8d',
  margin: '0 4px',
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const CopyrightText = styled(Typography)({
  fontSize: '0.65rem',
  color: '#5a6169',
  textAlign: 'center',
  marginTop: '8px',
});

const BackgroundImage = styled('img')({
  width: '100%',
  height: 'auto',
  filter: 'grayscale(1) opacity(0.3)',
  position: 'absolute',
  bottom: 0,
  left: 0,
  zIndex: -1,
  pointerEvents: 'none',
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

  const handleOpenLeaderboardsModal = () => setShowLeaderboardsModal(true);
  const handleCloseLeaderboardsModal = () => setShowLeaderboardsModal(false);

  const handleOpenTermsModal = (e) => {
    e.preventDefault();
    setShowTermsModal(true);
  };
  const handleCloseTermsModal = () => setShowTermsModal(false);

  const handleOpenPrivacyModal = (e) => {
    e.preventDefault();
    setShowPrivacyModal(true);
  };
  const handleClosePrivacyModal = () => setShowPrivacyModal(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const bottomFooterClasses = `bottom-footer ${isDarkMode ? 'dark_mode' : ''}`;

  const socialLinks = [
    { href: 'https://x.com/catsinofun', icon: faXTwitter, label: 'Follow us on X (Twitter)' },
    { href: 'https://www.youtube.com/@catsinofun', icon: faYoutube, label: 'Subscribe to our YouTube' },
    { href: 'https://www.tiktok.com/@catsinofun', icon: faTiktok, label: 'Follow us on TikTok' },
    { href: 'https://discord.gg/2yU5hEmWVh', icon: faDiscord, label: 'Join our Discord community' },
  ];

  return (
    <div className={bottomFooterClasses} style={style}>
      <FooterContainer id="footer-container" open={open}>
        {/* Social Media Icons */}
        <SocialIconsContainer>
          {socialLinks.map((social, index) => (
            <Tooltip key={index} title={social.label} arrow>
              <a 
                href={social.href} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={social.label}
              >
                <FontAwesomeIcon icon={social.icon} />
              </a>
            </Tooltip>
          ))}
        </SocialIconsContainer>

        {/* Navigation Links */}
        <LinksContainer>
          {isMobile && (
            <>
              <StyledLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenLeaderboardsModal();
                }}
              >
                Leaderboards
              </StyledLink>
              <Separator>•</Separator>
            </>
          )}
          <StyledLink href="#terms" onClick={handleOpenTermsModal}>
            Terms of Service
          </StyledLink>
          <Separator>•</Separator>
          <StyledLink href="#privacy" onClick={handleOpenPrivacyModal}>
            Privacy Policy
          </StyledLink>
        </LinksContainer>

        {/* Copyright */}
        <CopyrightText>
          © {new Date().getFullYear()} Catsino.Fun • All rights reserved.
        </CopyrightText>

        {/* Background Image */}
        <BackgroundImage src="/img/bottom-bg.svg" alt="" />

        {/* Modals */}
        {showLeaderboardsModal && (
          <Suspense fallback={<Typography>Loading Leaderboards...</Typography>}>
            <LeaderboardsModal
              modalIsOpen={showLeaderboardsModal}
              closeModal={handleCloseLeaderboardsModal}
              isDarkMode={isDarkMode}
            />
          </Suspense>
        )}

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
      </FooterContainer>
    </div>
  );
}

export default Footer;