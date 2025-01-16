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
import { withStyles } from '@material-ui/core/styles';
import PrivacyModal from '../modal/PrivacyModal';
import TermsModal from '../modal/TermsModal';
import LeaderboardsModal from '../modal/LeaderboardsModal';

const styles = (theme) => ({
    root: {
        width: '150px',
        padding: '8px 15px',
    },
    footerContainer: {
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
        width: (props) => (props.open ? 'calc(100vw - 275px)' : 'calc(100vw - 5px)'),
        zIndex: 2,
    },
    address: {
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        fontWeight: '400',
        margin: '30px 0 20px',
        textTransform: 'capitalize',
    },
    links: {
        display: 'flex',
        alignItems: 'flex-end',
    },
    link: {
        marginTop: '10px',
        color: '#b9bbbe',
        '&:hover': {
            color: '#b9bbbe',
            textDecoration: 'none',
        },
    },
    proof: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '30px',
        lineHeight: '0',
        textAlign: 'center',
    },
    bscscan: {
        width: '25%',
    },
    currencies: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '210px',
        margin: '15px 0 0',
    },
    currency: {
        width: '42px',
        opacity: '0.2',
        filter: 'grayscale(100%)',
    },
    availableCurrency: {
        width: '42px',
        filter: 'none',
        marginRight: '10px',
    },
});

const Footer = (props) => {
    const { classes, isDarkMode, open, style } = props;

    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showLeaderboardsModal, setShowLeaderboardsModal] = useState(false);

    const handleOpenLeaderboardsModal = () => setShowLeaderboardsModal(true);
    const handleCloseLeaderboardsModal = () => setShowLeaderboardsModal(false);

    const handleOpenTermsModal = () => setShowTermsModal(true);
    const handleCloseTermsModal = () => setShowTermsModal(false);

    const handleOpenPrivacyModal = () => setShowPrivacyModal(true);
    const handleClosePrivacyModal = () => setShowPrivacyModal(false);

    const IsAuthenticatedReroute = () => {
        if (!props.auth) {
            history.push('/');
        }
    };

    const bottomFooterClasses = `bottom-footer ${isDarkMode ? 'dark_mode' : ''}`;

    return (
        <div className={bottomFooterClasses} style={style}>
            <div id="footer-container" className={classes.footerContainer}>
                {showLeaderboardsModal && (
                    <LeaderboardsModal
                        modalIsOpen={showLeaderboardsModal}
                        closeModal={handleCloseLeaderboardsModal}
                        isDarkMode={isDarkMode}
                    />
                )}
                <div className="social-icons" style={{ display: 'flex', alignItems: 'center' }}>
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
                </div>
                <div className={classes.currencies}>
                    <img className={classes.availableCurrency} src={sol} alt="SOL" />
                    <img className={classes.availableCurrency} src={btc} alt="BTC" />
                    <img className={classes.availableCurrency} src={eth} alt="ETH" />
                    <img className={classes.availableCurrency} src={ltc} alt="LTC" />
                    <span>+ 50 MORE!</span>
                </div>

                <div className={classes.links}>
                    <a
                        className={`${classes.link} mobile-only`}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handleOpenLeaderboardsModal();
                        }}
                    >
                        Leaderboards
                    </a>
                    <span className={`${classes.link} mobile-only`}>&nbsp;✗&nbsp;</span>
                    <a className={classes.link} href="https://blog.rps.game/">Blog</a>&nbsp;✗&nbsp;
                    <a className={classes.link} href="#terms" onClick={handleOpenTermsModal}>
                        Terms
                    </a>&nbsp;✗&nbsp;
                    <a className={classes.link} href="#privacy" onClick={handleOpenPrivacyModal}>
                        Privacy
                    </a>
                </div>
                <div className={classes.address}>
                    <p>
                        RPS.Game has absolutely no involvement with any third-party gambling
                        provider software or 'provably-fair' algorithms.
                    </p>
                </div>
            </div>
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

export default connect(mapStateToProps)(
    withStyles(styles, { withTheme: true })(Footer)
);