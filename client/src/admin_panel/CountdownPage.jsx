import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Button,
  Container,
  Typography,
  Zoom,
  Box,
  LinearProgress,
} from '@mui/material';
import { styled, keyframes } from '@mui/system';
import { useTheme } from '@mui/material/styles';
import GamepadIcon from '@mui/icons-material/Gamepad';
import PieChartIcon from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import { fetchLeaderboardsData, fetchEquityDistribution } from '../redux/Customer/customer.action';
import busd from '../game_panel/JoinGame/busd.svg';
import PrivacyModal from '../game_panel/modal/PrivacyModal';
import TermsModal from '../game_panel/modal/TermsModal';
import MerchModal from '../game_panel/modal/MerchModal';
import { faXTwitter, faTelegram, faYoutube, faTiktok } from '@fortawesome/free-brands-svg-icons';
import sol from '../game_panel/icons/sol.png';
import bnb from '../game_panel/icons/bnb.png';
import btc from '../game_panel/icons/btc.png';
import eth from '../game_panel/icons/eth.png';
import ltc from '../game_panel/icons/ltc.png';
import Chart from 'react-apexcharts';
import Lottie from 'react-lottie';
import animationData from '../game_panel/LottieAnimations/quantum-goal.json';
import catBack from '../game_panel/LottieAnimations/cat-back.json';
import ApexCharts from 'react-apexcharts';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';
import SiteWrapper from '../game_panel/SiteWrapper';
import happyCat from '../util/happyCat.svg';
import cat_bg from '../util/cat_bg.svg';
import remote from '../util/remote.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Keyframes
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
`;

const throwAndFall = keyframes`
  0% {
    transform: translate(-50%, -67%) rotateX(0deg);
  }
  50% {
    transform: translate(-50%, -99%) rotateX(360deg);
  }
  100% {
    transform: translate(-50%, -67%) rotateX(0deg);
  }
`;

// Styled Components
const Root = styled(Box)(({ theme }) => ({
  color: '#FFF',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  position: 'relative',
  overflow: 'hidden',
}));

const Title = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.5rem',
  },
}));

const BottomBackground = styled(Box)(({ theme, width, height }) => ({
  backgroundImage: `url('/img/bottom-bg.svg')`,
  backgroundSize: width < 768 && height > 800 ? '800vw' : '175vw',
  backgroundPosition: width > 768 ? '94% 110%' : '84% 120%',
  backgroundRepeat: 'no-repeat',
  height: '100%',
  width: '100%',
  position: 'fixed',
  bottom: 0,
  left: 0,
  zIndex: 2,
}));

const Currencies = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '210px',
  margin: '30px auto',
}));

const Currency = styled('img')(({ theme, width }) => ({
  width: width < 600 ? '32px' : '52px',
  height: width < 600 ? '32px' : '52px',
  opacity: '0.2',
  filter: 'grayscale(100%)',
}));

const AvailableCurrency = styled('img')(({ theme, width }) => ({
  width: width < 600 ? '32px' : '52px',
  height: width < 600 ? '32px' : '52px',
  filter: 'none',
  marginRight: '10px',
}));

const Nav = styled(Box)(({ theme, width }) => ({
  position: 'absolute',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  width: '100%',
  padding: '20px',
  zIndex: 9,
  top: width < 600 ? '150px' : '220px',
  left: width < 600 ? '-100px' : '-50px',
}));

const Gravestone = styled(Box)(({ theme }) => ({
  backgroundImage: `url('/img/grave.svg')`,
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  padding: '44px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'transform 0.3s, box-shadow 0.3s, z-index 0.3s',
  margin: '10px',
  position: 'absolute',
  zIndex: 1,
  '&:hover': {
    filter: 'sepia(1)',
    zIndex: 10,
    animation: `${pulse} 0.5s`,
  },
}));

const SectionContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  zIndex: 1,
  position: 'relative',
  marginTop: '0vh',
  marginBottom: '50vh',
}));

const Section = styled(Box)(({ theme }) => ({
  padding: '100px 20px',
  textAlign: 'center',
  display: 'none',
}));

const ActiveSection = styled(Box)(({ theme }) => ({
  display: 'block',
  transition: 'opacity 0.5s',
}));

const CountdownPage = ({
  fetchLeaderboardsData,
  fetchEquityDistribution,
  equityChart,
  isDarkMode,
  loadingEquityChart,
}) => {
  const theme = useTheme();
  const history = useHistory();
  const [activeSection, setActiveSection] = useState('');
  const [buttonPositions, setButtonPositions] = useState([]);
  const [showImageBackground, setShowImageBackground] = useState(false);
  const [randomGif, setRandomGif] = useState('');
  const [throwing, setThrowing] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [web3, setWeb3] = useState(null);
  const [web3account, setWeb3Account] = useState('');
  const [web3balance, setWeb3Balance] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showMerchModal, setShowMerchModal] = useState(false);
  const [divStyles, setDivStyles] = useState({});

  const handleOpenTermsModal = () => setShowTermsModal(true);
  const handleCloseTermsModal = () => setShowTermsModal(false);
  const handleOpenPrivacyModal = () => setShowPrivacyModal(true);
  const handleClosePrivacyModal = () => setShowPrivacyModal(false);
  const openMerchModal = () => setShowMerchModal(true);
  const closeMerchModal = () => setShowMerchModal(false);

  const gifs = [
    'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGR4N2N1YXZwaHY4eDB1OWY3aTBybzJ2dXp2MGJiamcwcDJwbjVxayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6ABLpFTPng3euH1XE6/giphy.gif',
    'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHNvM3VjN3FicHN1ZjM1ZnIwNGtrMGUyZjNiOWQzb3hrZXhxeG9vbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6Jrp4ZD9B1z7VjrKhq/giphy.gif',
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnNza2NvZTdsZ3AwOWlweGJmYmV1cGc5anhyeW1rZ2NpM3l1cWc4YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UxVOH4FZjQ9wBk1hJa/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXZ5YjY4ZWhnY2NmMjY4N205aHRnOW1wenF6bzFjcTZuanllNzdoZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MNNLoVzRBXiW7ndcqb/giphy.gif',
  ];

  const baseColor = '#c734ff';
  const chartColors = [
    `${baseColor}FF`,
    `${baseColor}DD`,
    `${baseColor}99`,
    `${baseColor}66`,
    `${baseColor}33`,
    `${baseColor}11`,
  ];

  const chartOptions = {
    chart: {
      type: 'pie',
      background: isDarkMode ? '#121212' : '#ffffff',
    },
    labels: equityChart && equityChart.length > 0 ? equityChart.map(user => user.username.toUpperCase()) : [],
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 400,
          },
        },
      },
    ],
    colors: chartColors,
    legend: {
      show: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: false,
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value, { seriesIndex }) => `${value.toFixed(2)}%`,
      style: {
        colors: ['#ffffff'],
        fontSize: '14px',
        fontWeight: 600,
      },
    },
    tooltip: {
      custom: function ({ seriesIndex, w }) {
        const user = equityChart[seriesIndex];
        return `
          <div style="display: flex; align-items: center;">
            <img src="${user.avatar}" alt="${user.username}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" />
            <span style="color: ${baseColor};">${user.username}: ${w.globals.series[seriesIndex].toFixed(2)}%</span>
          </div>
        `;
      },
      theme: isDarkMode ? 'dark' : 'light',
      useHTML: true,
    },
  };

  const chartSeries = equityChart && equityChart.length > 0 ? equityChart.map(user => user.equityPercentage) : [];
  const chartData = {
    options: {
      chart: {
        type: 'donut',
        animations: { enabled: true },
        toolbar: { show: false },
        background: 'transparent',
      },
      labels: ['Dev (5%)', 'Platform (20%)', 'Ecosystem (75%)'],
      colors: chartColors,
      stroke: {
        width: 0,
      },
      legend: {
        position: 'bottom',
        labels: {
          colors: '#fff',
          useSeriesColors: false,
        },
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        style: {
          fontSize: '12px',
          fontFamily: 'Helvetica, Arial, sans-serif',
        },
        marker: {
          show: true,
        },
        x: {
          show: true,
        },
        y: {
          formatter: (value) => `${value}%`,
        },
        background: '#333',
        borderColor: '#666',
        borderWidth: 1,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: ['#FFD800', '#FF0000', '#00A1FF', '#28A745'],
          shadeIntensity: 1,
          opacityFrom: 0.9,
          opacityTo: 0.5,
          stops: [0, 100],
        },
      },
      theme: {
        mode: 'dark',
      },
    },
    series: [5, 20, 75],
  };

  const COUNTDOWN_BUTTONS = [
    { label: 'Play', section: 'play', icon: <GamepadIcon /> },
    { label: 'Tokenomics', section: 'tokenomics', icon: <PieChartIcon /> },
    { label: 'Chart', section: 'chart', icon: <ShowChartIcon /> },
    { label: 'Buy', section: 'buy', icon: <AttachMoneyIcon /> },
    { label: 'About', section: 'about', icon: <DescriptionIcon /> },
  ];

  const generateRandomPositions = (buttonsCount) => {
    const positions = [];
    const buttonWidth = 150;
    const buttonHeight = 80;
    const margin = 20;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    if (window.innerWidth < 600 && window.innerHeight < 700) {
      const fixedPositions = [
        { top: 240, left: 280 },
        { top: 300, left: 300 },
        { top: 120, left: 120 },
        { top: 140, left: 190 },
        { top: 140, left: 340 },
      ];
      return fixedPositions.slice(0, buttonsCount);
    } else if (window.innerWidth < 600 && window.innerHeight < 900) {
      const fixedPositions = [
        { top: 400, left: 320 },
        { top: 460, left: 340 },
        { top: 280, left: 160 },
        { top: 300, left: 230 },
        { top: 300, left: 380 },
      ];
      return fixedPositions.slice(0, buttonsCount);
    } else if (window.innerWidth < 600) {
      const fixedPositions = [
        { top: 500, left: 320 },
        { top: 560, left: 340 },
        { top: 380, left: 160 },
        { top: 400, left: 230 },
        { top: 400, left: 380 },
      ];
      return fixedPositions.slice(0, buttonsCount);
    }

    const horizontalScatterDistance = 800;
    const verticalScatterDistance = 300;
    const maxAttempts = 100;

    for (let i = 0; i < buttonsCount; i++) {
      let newPosition;
      let attempts = 0;
      do {
        newPosition = {
          left: Math.random() * horizontalScatterDistance + centerX - horizontalScatterDistance / 2,
          top: Math.random() * verticalScatterDistance + centerY - verticalScatterDistance / 2,
        };
        attempts++;
      } while (
        attempts < maxAttempts &&
        positions.some(
          (pos) =>
            newPosition.top < pos.top + buttonHeight + margin &&
            newPosition.top + buttonHeight + margin > pos.top &&
            newPosition.left < pos.left + buttonWidth + margin &&
            newPosition.left + buttonWidth + margin > pos.left
        )
      );
      if (attempts < maxAttempts) {
        positions.push(newPosition);
      } else {
        positions.push({
          top: centerY - buttonHeight / 2 + (i * (buttonHeight + margin)) % (verticalScatterDistance / 2),
          left: centerX - buttonWidth / 2 + (i * (buttonWidth + margin)) % (horizontalScatterDistance / 2),
        });
      }
    }

    return positions;
  };

  useEffect(() => {
    const updateStyles = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width >= 600) {
        setDivStyles({
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9,
          filter: 'hue-rotate(272deg)',
          margin: '20px 0',
          animationDelay: '0.8s',
        });
      } else {
        setDivStyles({});
      }
    };
    updateStyles();
    window.addEventListener('resize', updateStyles);
    return () => window.removeEventListener('resize', updateStyles);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchLeaderboardsData();
        await fetchEquityDistribution();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    fetchData();
  }, [fetchLeaderboardsData, fetchEquityDistribution]);

  useEffect(() => {
    setButtonPositions(generateRandomPositions(COUNTDOWN_BUTTONS.length));
  }, []);

  const handleButtonClick = (section) => {
    if (section === 'play') {
      window.open('/play', '_blank');
      return;
    }

    if (section === 'buy') {
      setShowDepositModal(true);
      window.open('https://raydium.io/swap/?inputMint=sol&outputMint=', '_blank');
      return;
    }

    if (section === 'chart') {
      setShowDepositModal(true);
      window.open('https://dexscreener.com/solana/BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump', '_blank');
      return;
    }

    setActiveSection(section);
    if (section === 'tokenomics') {
      setThrowing(true);
      setTimeout(() => setThrowing(false), 1000);
    }

    const randomIndex = Math.floor(Math.random() * gifs.length);
    setRandomGif(gifs[randomIndex]);

    const randomDuration = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;

    setShowImageBackground(true);
    setTimeout(() => {
      setShowImageBackground(false);
    }, randomDuration);
  };

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  const catOptions = {
    loop: true,
    autoplay: true,
    animationData: catBack,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  return (
    <SiteWrapper>
      <Root>
        <Helmet>
          <title>Gamified Countdown Page</title>
          <meta
            name="description"
            content="Explore our Web3 platform with sections on Tokenomics, Charts, and more!"
          />
        </Helmet>

        {/* Conditionally show either the Lottie animation or a static background */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'fixed',
            top: 0,
            zIndex: 0,
            filter: 'opacity(0.3)',
          }}
        >
          {showImageBackground ? (
            <Box
              sx={{
                backgroundImage: `url(${randomGif})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '100%',
                width: '100%',
              }}
            />
          ) : (
            <Lottie
              options={defaultOptions}
              height={'100%'}
              width={'100%'}
              isClickToPauseDisabled={true}
            />
          )}
        </Box>

        {/* Sections and Navigation */}
        <SectionContainer>
          <Container>
            <Zoom in={activeSection === ''}>
              <Section
                sx={{
                  display: activeSection === '' ? 'block' : 'none',
                  transition: 'opacity 0.5s',
                }}
              >
                <Typography
                  variant="h2"
                  sx={{ filter: 'drop-shadow(2px 4px 6px #f9f9)' }}
                >
                  $RPS&nbsp;
                  <img
                    src={busd}
                    width="80"
                    height="auto"
                    alt="$RPS Token Symbol"
                  />
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ filter: 'drop-shadow(2px 4px 6px #f9f9)', marginBottom: '20px' }}
                >
                  [ GET RICH 💰 OR DIE 🩸 ] <br />
                </Typography>
                <h6>TOKEN ADDRESS:</h6>
                {`[${'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump'.slice(0, 7)}...${'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump'.slice(-10)}]`}
                <br />
                <Typography
                  variant="body1"
                  sx={{ marginTop: '20px' }}
                  className="fading-text"
                >
                  Click the Gravestones below to choose a life path...
                </Typography>
              </Section>
            </Zoom>

            <Zoom in={activeSection === 'play'}>
              <Section
                id="play"
                sx={{
                  display: activeSection === 'play' ? 'block' : 'none',
                  transition: 'opacity 0.5s',
                }}
              >
                <Typography variant="h1">Welcome to Our Web3 Platform</Typography>
                <Typography variant="body1">
                  Get Rich 💰 or Die 🩸 trying in our immersive new-gen platform.
                </Typography>
              </Section>
            </Zoom>

            <Zoom in={activeSection === 'tokenomics'}>
              <Section
                id="tokenomics"
                sx={{
                  display: activeSection === 'tokenomics' ? 'block' : 'none',
                  transition: 'opacity 0.5s',
                }}
              >
                <Typography variant="h2" sx={{ fontSize: '2.5rem', [theme.breakpoints.down('sm')]: { fontSize: '1.5rem' } }}>
                  Tokenomics
                </Typography>
                <Typography variant="body1">
                  Explore the in-depth details of our token distribution and economic model.
                </Typography>

                {/* The Tokenomics Pie Chart */}
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    marginTop: '30px',
                  }}
                >
                  <ApexCharts
                    options={chartData.options}
                    series={chartData.series}
                    type="donut"
                    height={400}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: '90px',
                  }}
                >
                  <Typography variant="h4" className="title">
                    Current $RPS Holders
                  </Typography>
                  <Typography variant="h6" className="title">
                    (PLATFORM)
                  </Typography>
                  <br />
                  {loadingEquityChart ? (
                    <>
                      <Box
                        sx={{
                          height: '200px',
                          width: '30%',
                          display: 'block',
                          position: 'relative',
                        }}
                      >
                        <span>Retrieving Distribution...</span>
                        <LinearProgress sx={{ marginTop: '30px' }} color="secondary" />
                      </Box>
                    </>
                  ) : equityChart && equityChart.length > 0 ? (
                    <Chart options={chartOptions} series={chartSeries} type="pie" width="600" />
                  ) : (
                    <div>Calculating Equities...</div>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: '90px',
                    }}
                  >
                    <Typography variant="h4" className="title">
                      Contract Address
                    </Typography>
                    <Typography variant="h6" className="title">
                      BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump
                    </Typography>
                  </Box>
                </Box>
              </Section>
            </Zoom>

            <Zoom in={activeSection === 'about'}>
              <Section
                id="about"
                sx={{
                  display: activeSection === 'about' ? 'block' : 'none',
                  transition: 'opacity 0.5s',
                  marginBottom: window.innerWidth < 600 ? '200px' : '0',
                }}
              >
                <Typography variant="h2" sx={{ fontSize: '2.5rem', [theme.breakpoints.down('sm')]: { fontSize: '1.5rem' } }} gutterBottom>
                  About
                </Typography>

                <Box sx={{ position: 'relative' }}>
                  <Box
                    className="speech-bubble scroll-animation"
                    sx={{
                      animationDelay: '0.6s',
                      fontStyle: 'italic',
                      color: '#ff6347',
                    }}
                  >
                    <Typography variant="h6" component="span">
                      “Gamified Token Launches is the purr-fect solution!”
                    </Typography>
                  </Box>

                  <Box
                    component="img"
                    className="scroll-animation"
                    sx={{
                      transform: 'scale(1.5)',
                      width: '100%',
                      margin: '20px 0',
                      animationDelay: '0.8s',
                      filter: 'opacity(0.25)',
                    }}
                    src={cat_bg}
                    alt="Cat of Egypt"
                  />

                  <Box
                    sx={{
                      position: 'relative',
                      ...divStyles,
                      className: 'scroll-animation',
                    }}
                    className="scroll-animation"
                  >
                    <Typography
                      variant="body1"
                      paragraph
                      sx={{
                        fontStyle: 'italic',
                        color: '#ff6347',
                        animationDelay: '0.2s',
                      }}
                      className="scroll-animation"
                    >
                      Read our <span className="highlight">comprehensive guide</span> to understand our platform's vision
                      and technology. Trust us, it's not as paw-some as a cat nap, but it’s pretty close.
                    </Typography>

                    <Typography
                      variant="body1"
                      paragraph
                      sx={{
                        animationDelay: '0.4s',
                        fontWeight: 'bold',
                        color: '#ff6347',
                      }}
                      className="scroll-animation"
                    >
                      Important Note: We launch tokens for fun every week on Saturdays as a way to help crowdfund the platform.
                      This is NOT financial advice, and you should never invest more than you are willing to lose.
                      These are high-risk, high-reward opportunities meant for entertainment and innovation!
                    </Typography>

                    <Typography
                      variant="body2"
                      paragraph
                      sx={{
                        animationDelay: '0.6s',
                      }}
                      className="scroll-animation"
                    >
                      <span className="highlight">RPS.Game</span> is more than just a platform—it's a powerful game creation tool! Players can
                      design their own games and, when they reach <strong>80 SOL</strong> in contributions, these games can be minted as unique
                      tokens on the blockchain. This lets creators turn their gaming ideas into real, tradable assets.
                      It’s the purr-fect way to blend creativity and decentralization!
                    </Typography>

                    <Typography
                      variant="body2"
                      paragraph
                      sx={{
                        animationDelay: '1.2s',
                      }}
                      className="scroll-animation"
                    >
                      <span className="highlight">RPS.Game</span> offers financial tools that are typically gate-kept by the Elite,
                      but we’ve opened the door for <span className="highlight">EVERYONE</span>—whether you're a fat cat or a stray.
                      Using <span className="highlight">$RPS</span>, we’ve got a solution to inflation by capping the total supply
                      at <strong>1 Billion tokens</strong>. Just think of it as a ball of yarn with a limit on how much it can unravel!
                    </Typography>

                    <Typography
                      variant="body2"
                      paragraph
                      sx={{
                        animationDelay: '1.4s',
                      }}
                      className="scroll-animation"
                    >
                      The cat (token) distribution system? We’re giving 5% to the team (for their paw-some efforts), 20% to the Platform, 70% to the eco-system
                      (you cool cats), and the final 5%... well, marketing.
                    </Typography>

                    <Typography
                      variant="body2"
                      paragraph
                      sx={{
                        animationDelay: '1.6s',
                      }}
                      className="scroll-animation"
                    >
                      Mark your cat-lendars! The Pump.Fun FAIR LAUNCH of <span className="highlight">$RPS</span> opens on
                      <strong> 4TH DEC 20:00 CEST</strong>. So, sharpen your claws and get ready! Remember, it’s
                      <strong> GET RICH 💰 OR DIE 🩸</strong>—fur real.
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    display: 'flex',
                    textAlign: 'left',
                    flexDirection: 'column',
                    padding: '30px',
                    justifyContent: 'center',
                    alignContent: 'center',
                  }}
                >
                  <Currencies>
                    <AvailableCurrency src={sol} alt="SOL" />
                    {/* <AvailableCurrency src={bnb} alt="BNB" /> */}
                    <AvailableCurrency src={btc} alt="BTC" />
                    <AvailableCurrency src={eth} alt="ETH" />
                    <AvailableCurrency src={ltc} alt="LTC" />
                    <span>+ 50 MORE!</span>
                  </Currencies>

                  <Box sx={{ marginBottom: '20px' }}>
                    <Typography variant="body2">
                      RPS.Game has absolutely no involvement with any third-party gambling provider software or 'provably-fair' algorithms.
                    </Typography>
                  </Box>

                  {/* Social Icons */}
                  <Box className="countdown social-icons" sx={{ display: 'flex', alignItems: 'center' }}>
                    <span>FOLLOW US ►</span>
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

                  <Box className="countdown" sx={{ marginTop: '10px' }}>
                    <a className="link" href="https://blog.rps.game/">
                      Blog
                    </a>
                    &nbsp;✗&nbsp;
                    <a
                      className="link"
                      id="terms"
                      onClick={handleOpenTermsModal}
                      style={{ cursor: 'pointer' }}
                    >
                      Terms
                    </a>
                    &nbsp;✗&nbsp;
                    <a
                      className="link"
                      id="privacy"
                      onClick={handleOpenPrivacyModal}
                      style={{ cursor: 'pointer' }}
                    >
                      Privacy
                    </a>
                  </Box>
                </Box>

                {/* Modals */}
                {showTermsModal && (
                  <TermsModal
                    modalIsOpen={showTermsModal}
                    closeModal={handleCloseTermsModal}
                    isDarkMode={isDarkMode}
                  />
                )}
                {showMerchModal && (
                  <MerchModal
                    modalIsOpen={showMerchModal}
                    closeModal={closeMerchModal}
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
              </Section>
            </Zoom>
          </Container>
        </SectionContainer>

        <BottomBackground width={window.innerWidth} height={window.innerHeight}>
          <Nav width={window.innerWidth}>
            <Box sx={{ position: 'relative' }}>
              <Box
                className="scroll-animation"
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform:
                    window.innerWidth < 600
                      ? 'translate(1px, 346px)'
                      : 'translate(71px, 446px)',
                  width: '50px',
                  animationDelay: '0.8s',
                  filter: 'opacity(0.25)',
                }}
                component="img"
                src={remote}
                alt="Remote Control"
              />
              <Lottie
                options={catOptions}
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top:
                    window.innerWidth < 600 && window.innerHeight < 900
                      ? '-50%'
                      : '50%',
                  transform:
                    window.innerWidth < 600
                      ? 'translateY(0%)'
                      : 'translateY(60%)',
                }}
                height="auto"
                width="300px"
                isClickToPauseDisabled={true}
              />
            </Box>
            {COUNTDOWN_BUTTONS.map((button, index) => (
              <Zoom in={true} timeout={index * 200} key={button.label}>
                <Gravestone
                  sx={{
                    top: buttonPositions[index]?.top,
                    left: buttonPositions[index]?.left,
                  }}
                  onClick={() => handleButtonClick(button.section)}
                >
                  <Box
                    sx={{
                      transform: 'rotateZ(6deg)',
                      marginLeft: '-10px',
                    }}
                  >
                    {button.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '0.5rem',
                      transform: 'rotateZ(6deg)',
                      transition: 'transform 0.3s',
                      marginLeft: '-10px',
                    }}
                  >
                    {button.label}
                  </Typography>
                </Gravestone>
              </Zoom>
            ))}
          </Nav>

          {/* Footer */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              display: 'flex',
              textAlign: 'left',
              flexDirection: 'column',
              padding: '30px',
              justifyContent: 'center',
              alignContent: 'center',
            }}
          >
            <Box className="countdown social-icons" sx={{ display: 'flex', alignItems: 'center' }}>
              <span>FOLLOW US ►</span>
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
            <Box className="countdown" sx={{ marginTop: '10px' }}>
              <a className="link" href="https://blog.rps.game/">
                Blog
              </a>
              &nbsp;✗&nbsp;
              <a
                className="link"
                id="terms"
                onClick={handleOpenTermsModal}
                style={{ cursor: 'pointer' }}
              >
                Terms
              </a>
              &nbsp;✗&nbsp;
              <a
                className="link"
                id="privacy"
                onClick={handleOpenPrivacyModal}
                style={{ cursor: 'pointer' }}
              >
                Privacy
              </a>
            </Box>
          </Box>
        </BottomBackground>
      </Root>
    </SiteWrapper>
  );
};

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  loadingEquityChart: state.customerReducer.loadingEquityChart,
  equityChart: state.customerReducer.equityChart,
});

const mapDispatchToProps = {
  fetchLeaderboardsData,
  fetchEquityDistribution,
};

// Connect CountdownPage to Redux
export default connect(mapStateToProps, mapDispatchToProps)(CountdownPage);