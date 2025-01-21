import React, { useState } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTelegram, faYoutube, faTiktok } from '@fortawesome/free-brands-svg-icons';
import sol from '../icons/sol.png';
import bnb from '../icons/bnb.png';
import btc from '../icons/btc.png';
import eth from '../icons/eth.png';
import ltc from '../icons/ltc.png';
import PrivacyModal from '../modal/PrivacyModal';
import TermsModal from '../modal/TermsModal';
import LeaderboardsModal from '../modal/LeaderboardsModal';
import { Box, Typography, Link, styled } from '@mui/material';

const FooterContainer = styled(Box)(({ theme, open }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#747f8d',
  fontSize: '0.7rem',
  fontWeight: '500',
  padding: '40px 20px 10px',
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

const ProofContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  margin: '30px',
  lineHeight: '0',
  textAlign: 'center',
});

const Currencies = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '210px',
  margin: '15px 0 0',
});

const CurrencyIcon = styled('img')({
  width: '42px',
  opacity: '0.2',
  filter: 'grayscale(100%)',
});

const AvailableCurrency = styled('img')({
  width: '42px',
  filter: 'none',
  marginRight: '10px',
});

const Footer = (props) => {
  const { isDarkMode, open, style } = props;

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showLeaderboardsModal, setShowLeaderboardsModal] = useState(false);

  const handleOpenLeaderboardsModal = () => setShowLeaderboardsModal(true);
  const handleCloseLeaderboardsModal = () => setShowLeaderboardsModal(false);

  const handleOpenTermsModal = () => setShowTermsModal(true);
  const handleCloseTermsModal = () => setShowTermsModal(false);

  const handleOpenPrivacyModal = () => setShowPrivacyModal(true);
  const handleClosePrivacyModal = () => setShowPrivacyModal(false);

  const bottomFooterClasses = `bottom-footer ${isDarkMode ? 'dark_mode' : ''}`;

  return (
    <div className={bottomFooterClasses} style={style}>
      <FooterContainer id="footer-container" open={open}>
        {showLeaderboardsModal && (
          <LeaderboardsModal
            modalIsOpen={showLeaderboardsModal}
            closeModal={handleCloseLeaderboardsModal}
            isDarkMode={isDarkMode}
          />
        )}
        <Box className="social-icons" sx={{ display: 'flex', alignItems: 'center' }}>
          <span>CHECK SOCIALS FOR UPDATES ►</span>
          <a href="https://x.com/rpsdotgame">
            <FontAwesomeIcon icon={faXTwitter} />
          </a>
          <a href="https://t.me/rpsfinance">
            <FontAwesomeIcon icon={faTelegram} />
          </a>
          <a href="https://www.youtube.com/@rpsdotgame">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
          <a href="https://www.tiktok.com/@rpsdotgame">
            <FontAwesomeIcon icon={faTiktok} />
          </a>
        </Box>
        <Currencies>
          <AvailableCurrency src={sol} alt="SOL" />
          <AvailableCurrency src={btc} alt="BTC" />
          <AvailableCurrency src={eth} alt="ETH" />
          <AvailableCurrency src={ltc} alt="LTC" />
          <span>+ 50 MORE!</span>
        </Currencies>

        <LinksContainer>
          <StyledLink
            className="mobile-only"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleOpenLeaderboardsModal();
            }}
          >
            Leaderboards
          </StyledLink>
          <span className="mobile-only">&nbsp;✗&nbsp;</span>
          <StyledLink href="https://blog.rps.game/">Blog</StyledLink>
          &nbsp;✗&nbsp;
          <StyledLink href="#terms" onClick={handleOpenTermsModal}>
            Terms
          </StyledLink>
          &nbsp;✗&nbsp;
          <StyledLink href="#privacy" onClick={handleOpenPrivacyModal}>
            Privacy
          </StyledLink>
        </LinksContainer>
        <Address>
          <Typography>
            RPS.Game has absolutely no involvement with any third-party gambling
            provider software or 'provably-fair' algorithms.
          </Typography>
        </Address>
      </FooterContainer>
      {showTermsModal && (
        <TermsModal
          modalIsOpen={showTermsModal}
          closeModal={handleCloseTermsModal}
          isDarkMode={isDarkMode}
        />
      )}
      {showPrivacyModal && (
        <PrivacyModal
          modalIsOpen={showPrivacyModal}
          closeModal={handleClosePrivacyModal}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
  user_id: state.auth.user._id,
  isDarkMode: state.auth.isDarkMode,
});

export default connect(mapStateToProps)(Footer);