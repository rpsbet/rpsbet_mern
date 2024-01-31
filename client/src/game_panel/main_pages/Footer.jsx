import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTelegram, faYoutube, faDiscord } from '@fortawesome/free-brands-svg-icons';
import bscscan from '../icons/etherscan-logo.svg';
import busd from '../icons/b-usd.png';
import btc from '../icons/btc.png';
import eth from '../icons/eth.png';
import ltc from '../icons/ltc.png';
import { withStyles } from '@material-ui/core/styles';
import PrivacyModal from '../modal/PrivacyModal'
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
        width: props => props.open ? 'calc(100vw - 275px)' : 'calc(100vw - 20px)',
        zIndex: 2,
    },
    address: {
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        fontWeight: '400',
        margin: '30px 0 20px',
        textTransform: 'capitalize'
    },
    links: {
        display: 'flex',
        alignItems: 'flex-end'
    },
    link: {
        marginTop: '10px',
        color: '#b9bbbe'
    },
    link: {
        marginTop: '10px',
        color: '#b9bbbe',
        '&:hover': {
            color: '#b9bbbe',
            textDecoration: 'none'
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
    },
});

class Footer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            open: this.props.open,
            showPrivacyModal: false,
            showTermsModal: false,
            showLeaderboardsModal: false,
        }
    }

    static getDerivedStateFromProps(props, current_state) {
        return null;
    }

    // componentDidMount() {
    //     console.log(this.props.isDarkMode)
    //     // this.IsAuthenticatedReroute();
    // }

    handleOpenLeaderboardsModal = () => {
        this.setState({ showLeaderboardsModal: true });
    };

    handleCloseLeaderboardsModal = () => {
        this.setState({ showLeaderboardsModal: false });
    };

    IsAuthenticatedReroute = () => {
        if (!this.props.auth) {
            history.push('/');
        }
    };


    handleOpenTermsModal = () => {
        this.setState({ showTermsModal: true });
    };
    handleCloseTermsModal = () => {
        this.setState({ showTermsModal: false });
    };

    handleOpenPrivacyModal = () => {
        this.setState({ showPrivacyModal: true, anchorEl: null });
    };
    handleClosePrivacyModal = () => {
        this.setState({ showPrivacyModal: false });
    };


    render() {
        const { classes, isDarkMode } = this.props;

        const { showLeaderboardsModal } = this.state;
        const bottomFooterClasses = `bottom-footer ${isDarkMode ? 'dark_mode' : ''}`;

        return (
            <div className={bottomFooterClasses} style={this.props.style}>
            <div id="footer-container" className={classes.footerContainer}>
                    {showLeaderboardsModal && (
                        <LeaderboardsModal
                            modalIsOpen={showLeaderboardsModal}
                            closeModal={this.handleCloseLeaderboardsModal}
                            //   player_name={userName}
                            //   balance={balance}
                            isDarkMode={isDarkMode}
                        />
                    )}
                    <div className="social-icons" style={{display: 'flex', alignItems: 'center'}}>
                        {/* <a href="https://discord.gg/anMJntW4AD">
                            <FontAwesomeIcon icon={faDiscord} />
                        </a> */}<span>CHECK SOCIALS FOR UPDATES ►</span>
                        <a href="https://x.com/officialrpsgame">
                            <FontAwesomeIcon icon={faXTwitter} />
                        </a>
                        {/* <a href="https://t.me/rpsfinance">
                            <FontAwesomeIcon icon={faTelegram} />
                        </a> */}
                        <a href="https://www.youtube.com/channel/UCikMJVhTSPUYcGSWEdAj6cQ">
                        <FontAwesomeIcon icon={faYoutube} />
                    </a> 
                   {/* <a href="https://www.instagram.com/rps.game/">
                        <FontAwesomeIcon icon={faInstagram} />
                    </a>
                    <a href="https://www.twitch.tv/rpsbet">
                        <FontAwesomeIcon icon={faTwitch} />
                    </a> */}
                    </div>
                    <div className={classes.currencies}>
                        <img className={classes.currency} src={busd} alt="BUSD" />
                        <img className={classes.currency} src={btc} alt="BTC" />
                        <img className={classes.availableCurrency} src={eth} alt="ETH" />
                        <img className={classes.currency} src={ltc} alt="LTC" />
                    </div>
                    <div className={classes.proof}>
                        {/* <p>Proof of Funds</p>
                        <a target="_blank" href="https://etherscan.com/address/0xD291Db607053cFcdcFFdADCcfE8A3a8bA8Cd8c6B">

                            <img className={classes.bscscan} src={bscscan} alt="etherscan" />
                        </a> */}

                    </div>
                    <div className={classes.links}>
                        <a className={(classes.link, 'mobile-only')} href="#"
                            onClick={e => {
                                e.preventDefault();
                                this.handleOpenLeaderboardsModal();
                            }} >Leaderboards</a><span className={(classes.link, 'mobile-only')} >
                            &nbsp;✗&nbsp;

                        </span>
                        {/* <a className={classes.link} href="#">Blog</a>&nbsp;✗&nbsp; */}
                        {/* <a className={classes.link} href="#">Faq</a>&nbsp;✗&nbsp; */}
                        <a className={classes.link}
                            href="#terms"
                            id="terms"
                            onClick={this.handleOpenTermsModal}
                        >
                            Terms
                        </a>&nbsp;✗&nbsp;
                        <a className={classes.link}
                            href="#privacy"
                            id="privacy"
                            onClick={this.handleOpenPrivacyModal}
                        >
                            Privacy
                        </a>
                        {/* <a className={classes.link} href="#">Fair</a> */}
                    </div>
                    <div className={classes.address}>
                        <p>This website falls under provable fairness because (1) P2P, skill games are transformative and (2) players have a 100% control-rate over the AI technology used to replace an intermediary.
                        </p>
                        <p>Also rps.game has absolutely no involvement with any third-party gambling provider software or 'provably-fair' algorithms.
                        </p>
                    </div>
                </div>
                {this.state.showTermsModal && (
                    <TermsModal
                        modalIsOpen={this.state.showTermsModal}
                        closeModal={this.handleCloseTermsModal}
                        isDarkMode={this.props.isDarkMode}
                    />
                )}
                {this.state.showPrivacyModal && (
                    <PrivacyModal
                        modalIsOpen={this.state.showPrivacyModal}
                        closeModal={this.handleClosePrivacyModal}
                        isDarkMode={this.props.isDarkMode}
                    />
                )}
            </div>
        );
    }
}

const mapStateToProps = state => ({
    auth: state.auth.isAuthenticated,
    user_id: state.auth.user._id,
    isDarkMode: state.auth.isDarkMode,
});

const mapDispatchToProps = {
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withStyles(styles, { withTheme: true })(Footer));
