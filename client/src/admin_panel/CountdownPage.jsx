import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Button,
  Container,
  Typography,
  Zoom,
  Box,
  LinearProgress,
  Tooltip,
  Link,
  useMediaQuery,
} from '@mui/material';
import { styled, keyframes } from '@mui/system';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom'; // Replace useHistory with useNavigate
import GamepadIcon from '@mui/icons-material/Gamepad';
import PieChartIcon from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import { faXTwitter, faTelegram, faYoutube, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Chart from 'react-apexcharts';
import Lottie from 'react-lottie';
import animationData from '../game_panel/LottieAnimations/quantum-goal.json';
import catBack from '../game_panel/LottieAnimations/cat-back.json';
import ApexCharts from 'react-apexcharts';
import SiteWrapper from '../game_panel/SiteWrapper';
import busd from '../game_panel/JoinGame/busd.svg';
import PrivacyModal from '../game_panel/modal/PrivacyModal';
import TermsModal from '../game_panel/modal/TermsModal';
import MerchModal from '../game_panel/modal/MerchModal';
import sol from '../game_panel/icons/sol.png';
import bnb from '../game_panel/icons/bnb.png';
import btc from '../game_panel/icons/btc.png';
import eth from '../game_panel/icons/eth.png';
import ltc from '../game_panel/icons/ltc.png';

// Redux hooks
import { useSelector, useDispatch } from 'react-redux';
import { fetchLeaderboardsData, fetchEquityDistribution } from '../redux/Customer/customer.action';

// -------------- KEYFRAMES --------------
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255,255,255,0.7);
  }
  70% {
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(255,255,255,0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255,255,255,0);
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

// -------------- STYLED COMPONENTS --------------
const Root = styled(Box)(({ theme }) => ({
  color: '#FFF',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
}));

const SectionContainer = styled(Box)(() => ({
  width: '100%',
  zIndex: 1,
  position: 'relative',
  marginBottom: '50vh',
}));

const Section = styled(Box)(({ theme }) => ({
  padding: '100px 20px',
  textAlign: 'center',
  display: 'none',
  [theme.breakpoints.down('sm')]: {
    padding: '60px 15px',
  },
}));

const ActiveSection = styled(Box)(() => ({
  display: 'block',
  transition: 'opacity 0.5s',
}));

const Title = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.6rem',
  },
  textShadow: '0 0 6px rgba(255,255,255,0.15)',
}));

const BottomBackground = styled(Box)(({ width, height }) => ({
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

const Currencies = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '210px',
  margin: '30px auto',
}));

const Currency = styled('img')(({ width }) => ({
  width: width < 600 ? '32px' : '52px',
  height: width < 600 ? '32px' : '52px',
  opacity: '0.2',
  filter: 'grayscale(100%)',
}));

const AvailableCurrency = styled('img')(({ width }) => ({
  width: width < 600 ? '32px' : '52px',
  height: width < 600 ? '32px' : '52px',
  filter: 'none',
  marginRight: '10px',
}));

const Nav = styled(Box)(({ width }) => ({
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

const Gravestone = styled(Box)(() => ({
  backgroundImage: `url('/img/grave.svg')`,
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  padding: '33px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'transform 0.3s, box-shadow 0.3s, z-index 0.3s',
  margin: '10px',
  position: 'absolute',
  zIndex: 1,
  '&:hover': {
    filter: 'sepia(1)',
    zIndex: 3,
    animation: `${pulse} 0.5s`,
  },
}));

// -------------- SHORTENING & CONTRACT INFO --------------
const CONTRACT_ADDRESS = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';
const shortenAddress = (address, startLength = 9, endLength = 9) => {
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

// -------------- MAIN COMPONENT --------------
const CountdownPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Replace history with navigate
  const theme = useTheme();
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const loadingEquityChart = useSelector((state) => state.customerReducer.loadingEquityChart);
  const equityChart = useSelector((state) => state.customerReducer.equityChart);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Local state
  const [activeSection, setActiveSection] = useState('');
  const [buttonPositions, setButtonPositions] = useState([]);
  const [showImageBackground, setShowImageBackground] = useState(false);
  const [randomGif, setRandomGif] = useState('');
  const [throwing, setThrowing] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [divStyles, setDivStyles] = useState({});
  const [copiedTooltipOpen, setCopiedTooltipOpen] = useState(false);

  // List of GIFs for random background overlays
  const gifs = [
    'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGR4N2N1YXZwaHY4eDB1OWY3aTBybzJ2dXp2MGJiamcwcDJwbjVxayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6ABLpFTPng3euH1XE6/giphy.gif',
    'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHNvM3VjN3FicHN1ZjM1ZnIwNGtrMGUyZjNiOWQzb3hrZXhxeG9vbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6Jrp4ZD9B1z7VjrKhq/giphy.gif',
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnNza2NvZTdsZ3AwOWlweGJmYmV1cGc5anhyeW1rZ2NpM3l1cWc4YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UxVOH4FZjQ9wBk1hJa/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXZ5YjY4ZWhnY2NmMjY4N205aHRnOW1wenF6bzFjcTZuanllNzdoZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MNNLoVzRBXiW7ndcqb/giphy.gif',
  ];

  // Chart color logic
  const baseColor = '#c734ff';
  const chartColors = [
    `${baseColor}FF`,
    `${baseColor}DD`,
    `${baseColor}99`,
    `${baseColor}66`,
    `${baseColor}33`,
    `${baseColor}11`,
  ];

  // Chart configuration for the equity chart
  const chartOptions = {
    chart: { type: 'pie', background: isDarkMode ? '#121212' : '#ffffff' },
    labels: equityChart && equityChart.length > 0
      ? equityChart.map((user) => user.username.toUpperCase())
      : [],
    responsive: [{ breakpoint: 480, options: { chart: { width: 400 } } }],
    colors: chartColors,
    legend: { show: false },
    plotOptions: {
      pie: { donut: { size: '70%', labels: { show: false } } },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value.toFixed(2)}%`,
      style: { colors: ['#ffffff'], fontSize: '14px', fontWeight: 600 },
    },
    tooltip: {
      custom: ({ seriesIndex, w }) => {
        const user = equityChart[seriesIndex];
        return `
          <div style="display: flex; align-items: center;">
            <img src="${user.avatar}" alt="${user.username}" style="width:24px; height:24px; border-radius:50%; margin-right:8px;" />
            <span style="color:${baseColor};">${user.username}: ${w.globals.series[seriesIndex].toFixed(2)}%</span>
          </div>
        `;
      },
      theme: isDarkMode ? 'dark' : 'light',
      useHTML: true,
    },
  };

  const chartSeries = equityChart && equityChart.length > 0
    ? equityChart.map((user) => user.equityPercentage)
    : [];
  const chartData = {
    options: {
      chart: { type: 'donut', animations: { enabled: true }, toolbar: { show: false }, background: 'transparent' },
      labels: ['Czar Owner (2%)', 'Team Locked (3%)', 'Ecosystem (95%)'],
      colors: chartColors,
      stroke: { width: 0 },
      legend: { position: 'bottom', labels: { colors: '#fff', useSeriesColors: false } },
      tooltip: {
        enabled: true,
        theme: 'dark',
        style: { fontSize: '12px', fontFamily: 'Helvetica, Arial, sans-serif' },
        marker: { show: true },
        x: { show: true },
        y: { formatter: (value) => `${value}%` },
        background: '#333',
        borderColor: '#666',
        borderWidth: 1,
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: ['#FFD800', '#D32F2F', '#00A1FF', '#28A745'],
          shadeIntensity: 1,
          opacityFrom: 0.9,
          opacityTo: 0.5,
          stops: [0, 100],
        },
      },
      theme: { mode: 'dark' },
    },
    series: [2, 3, 95],
  };

  // Helper to shorten contract address
  const shortenAddressHelper = (address, startLength = 9, endLength = 9) => {
    if (address.length <= startLength + endLength) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  // Local state for copied tooltip
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS);
      setCopiedTooltipOpen(true);
      setTimeout(() => setCopiedTooltipOpen(false), 1500);
    } catch (err) {
      console.error('Failed to copy address', err);
    }
  };

  // Random button definitions
  const COUNTDOWN_BUTTONS = [
    { label: 'Home', section: 'home', icon: <GamepadIcon /> },
    { label: 'Chart', section: 'chart', icon: <ShowChartIcon /> },
    { label: 'Buy', section: 'buy', icon: <AttachMoneyIcon /> },
    { label: 'About', section: 'about', icon: <DescriptionIcon /> },
  ];

  // State for button positions

  // Update style for larger screens
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

  // Fetch data once on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchLeaderboardsData());
        await dispatch(fetchEquityDistribution());
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  // Generate random positions for gravestone buttons
  useEffect(() => {
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
            left:
              Math.random() * horizontalScatterDistance +
              centerX -
              horizontalScatterDistance / 2,
            top:
              Math.random() * verticalScatterDistance +
              centerY -
              verticalScatterDistance / 2,
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
            top:
              centerY - buttonHeight / 2 +
              (i * (buttonHeight + margin)) % (verticalScatterDistance / 2),
            left:
              centerX - buttonWidth / 2 +
              (i * (buttonWidth + margin)) % (horizontalScatterDistance / 2),
          });
        }
      }
      return positions;
    };

    setButtonPositions(generateRandomPositions(COUNTDOWN_BUTTONS.length));
  }, []);

  // Handle nav button logic
  const handleButtonClick = (section) => {
    if (section === 'home') {
      window.open('https://rps.game/', '_blank');
      return;
    }
    if (section === 'buy') {
      setShowDepositModal(true);
      window.open(
        'https://raydium.io/swap/?inputMint=sol&outputMint=' + CONTRACT_ADDRESS,
        '_blank'
      );
      return;
    }
    if (section === 'chart') {
      setShowDepositModal(true);
      window.open('https://dexscreener.com/solana/' + CONTRACT_ADDRESS, '_blank');
      return;
    }
    setActiveSection(section);
    if (section === 'catenomics') {
      setThrowing(true);
      setTimeout(() => setThrowing(false), 1000);
    }
    const randomIndex = Math.floor(Math.random() * gifs.length);
    setRandomGif(gifs[randomIndex]);
    const randomDuration = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;
    setShowImageBackground(true);
    setTimeout(() => setShowImageBackground(false), randomDuration);
  };

  // Lottie animation options
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
  };
  const catOptions = {
    loop: true,
    autoplay: true,
    animationData: catBack,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
  };

  return (
    <Root>
      <Helmet>
        <title>Gamified Countdown Page</title>
        <meta name="description" content="Explore our Web3 platform with sections on catenomics, Charts, and more!" />
      </Helmet>

      {/* Background / Lottie */}
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
          <Lottie options={defaultOptions} height="100%" width="100%" isClickToPauseDisabled={true} />
        )}
      </Box>

      {/* Main Content */}
      <SectionContainer>
        <Container>
          {/* HOME / Default Section */}
          <Zoom in={activeSection === ''}>
            <Section
              sx={{
                display: activeSection === '' ? 'block' : 'none',
                transition: 'opacity 0.5s',
              }}
            >
              <Typography variant="h1" sx={{ fontWeight: '800', fontSize: { xs: '1.8rem', sm: '2.5rem' }, marginBottom: '20px' }}>
                $RPS <img src={busd} style={{ marginLeft: '5px' }} width="50" alt="$RPS Token Symbol" />
              </Typography>
              <Typography variant="h6" sx={{ marginBottom: '20px' }}>
                [ GET RICH 💰 OR DIE 🩸 ]
              </Typography>
              <Typography variant="body1" sx={{ marginTop: '20px' }} className="fading-text">
                Click the Gravestones below to choose a life path...
              </Typography>
            </Section>
          </Zoom>

          {/* Home SECTION */}
          <Zoom in={activeSection === 'home'}>
            <Section
              id="home"
              sx={{ display: activeSection === 'home' ? 'block' : 'none', transition: 'opacity 0.5s' }}
            >
              <Typography variant="h3" gutterBottom>
                Welcome to Our Web3 Platform
              </Typography>
              <Typography variant="body1">
                Get Rich 💰 or Die 🩸 trying in our immersive new-gen platform.
              </Typography>
            </Section>
          </Zoom>

          {/* catenomics SECTION */}
          <Zoom in={activeSection === 'catenomics'}>
            <Section
              id="catenomics"
              sx={{ display: activeSection === 'catenomics' ? 'block' : 'none', transition: 'opacity 0.5s' }}
            >
              <Typography variant="h3" gutterBottom>
                Catenomics
              </Typography>
              <Typography variant="body1">
                Explore our customer-centric & focused simple distribution. This is literally it—no need to complicate it. You see? Beautiful.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                <ApexCharts options={chartData.options} series={chartData.series} type="donut" height={320} />
              </Box>
            </Section>
          </Zoom>

          {/* ABOUT SECTION */}
          <Zoom in={activeSection === 'about'}>
            <Section
              id="about"
              sx={{ display: activeSection === 'about' ? 'block' : 'none', transition: 'opacity 0.5s', marginBottom: { xs: '200px', md: '0' } }}
            >
              <Typography variant="h3" gutterBottom>
                ABOUT
              </Typography>
              <Box sx={{ position: 'relative', marginTop: '20px' }}>
                <Typography variant="h6" sx={{ fontStyle: 'italic', color: '#ff6347' }}>
                  “Legend Has It: Caesar the Cat Once Dreamed of Financial Freedom”
                </Typography>
                <span>▿</span>
                <Box
                  component="img"
                  sx={{ transform: 'scale(1.5)', width: '100%', margin: '20px 0', filter: 'opacity(0.25)' }}
                  src={cat_bg}
                  alt="Cat of Egypt"
                />
                <Box sx={{ position: 'relative', ...divStyles }}>
                  <Typography variant="body1" paragraph sx={{ fontStyle: 'italic', color: '#ff6347' }}>
                    Meet Caesar, a curious cat who wanted to understand how money truly worked.
                    The deeper he dug, the clearer it became: a select few “fat cats” sat at the top,
                    controlling the debt-based money system. Banks printed money out of thin air
                    while charging interest (usury), keeping the smaller cats in their grasp.
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ fontWeight: 'bold', color: '#ff6347' }}>
                    Caesar believed life shouldn't be spent bowing to these big cats. In his quest,
                    he discovered something profound: money is non-physical—nothing more than a vibration.
                    The more he realized this, the more he understood the entire world is similarly non-physical.
                    He decided to free the smaller cats from financial subjugation by teaching them the truth.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Caesar told them they have up to nine lives, and thus no reason to fear exploring new ways of making money.
                    To drive his point home, he created <span className="highlight"> rps.game</span>, an evolving micro-economy
                    simulating real-life macro-economies in any sector. Within this game, smaller cats, no matter their background,
                    could learn how to generate an income. If they couldn't top the charts in this micro-economy, they'd stand little chance in the macro world.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    By democratizing banking tools in the app, Caesar handed out once elite privileges to everyone.
                    Players could trade, loan, and strategize from the comfort of their homes.
                    But the real game changer was the <span className="highlight">AI</span>.
                    Caesar knew life was pre-determined, that nothing was truly random.
                    Historical events influence every coin flip, every throw of the dice.
                    He believed if small cats had predictive AI, they'd see the patterns and profit from them—just as the big cats had always done.
                  </Typography>
                  <Typography variant="body2" paragraph>
                    In the end, Caesar built an app that enabled anyone—regardless of their history or heritage—to create a steady income stream from home.
                    He exposed the illusions of randomness and the ways big cats used financial systems.
                    And he did it all by tapping into the truth: everything has history, nothing is truly random, and knowledge belongs to all cats—small and large alike.
                  </Typography>
                </Box>
              </Box>
              {/* Optionally, render modals for Terms, Merch, Privacy if needed */}
            </Section>
          </Zoom>
        </Container>
      </SectionContainer>

      {/* BOTTOM BACKGROUND + NAV */}
      <BottomBackground width={window.innerWidth} height={window.innerHeight}>
        <Nav width={window.innerWidth}>
          <Box sx={{ position: 'relative' }}>
            <Box
              className="scroll-animation"
              sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: window.innerWidth < 600 && window.innerHeight < 900
                  ? 'translate(1px, 346px)'
                  : 'translate(71px, 446px)',
                width: '50px',
                filter: 'opacity(0.25)',
              }}
              component="img"
              src={remote}
              alt="Remote Control"
            />
            <Lottie
              options={catOptions}
              style={{
                position: 'absolute',
                left: '50%',
                top: window.innerWidth < 600 && window.innerHeight < 900 ? '-50%' : '50%',
                transform: window.innerWidth < 600 ? 'translateY(0%)' : 'translateY(60%)',
              }}
              height="auto"
              width="300px"
              isClickToPauseDisabled
            />
          </Box>

          {/* Gravestone Buttons */}
          {COUNTDOWN_BUTTONS.map((button, index) => (
            <Zoom in={true} timeout={index * 200} key={button.label}>
              <Gravestone
                sx={{
                  top: buttonPositions[index]?.top,
                  left: buttonPositions[index]?.left,
                }}
                onClick={() => handleButtonClick(button.section)}
              >
                <Box sx={{ transform: 'rotateZ(6deg)', marginLeft: '-10px' }}>
                  {button.icon}
                </Box>
                <Typography variant="h6" sx={{ fontSize: '0.5rem', transform: 'rotateZ(6deg)', transition: 'transform 0.3s', marginLeft: '-10px' }}>
                  {button.label}
                </Typography>
              </Gravestone>
            </Zoom>
          ))}
        </Nav>

        {/* Footer (Pinned Lower Left) */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
            padding: '30px',
            alignContent: 'center',
          }}
        >
          <Box sx={{ marginBottom: '15px' }}>
            <Typography variant="subtitle2" className="title">
              Contract Address
            </Typography>
            <Tooltip
              title="Copied!"
              open={copiedTooltipOpen}
              disableFocusListener
              disableHoverListener
              disableTouchListener
              placement="top"
              arrow
            >
              <Typography variant="body1" sx={{ cursor: 'pointer' }} onClick={handleCopyAddress}>
                <Link>{shortenAddress(CONTRACT_ADDRESS, 9, 9)}</Link>
              </Typography>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <span>FOLLOW US ►</span>
            <a href="https://x.com/RPSDG_SOL">
              <FontAwesomeIcon icon={faXTwitter} />
            </a>
            <a href="https://t.me/RPSDOTGAMESOL">
              <FontAwesomeIcon icon={faTelegram} />
            </a>
            <a href="https://www.youtube.com/@rpsdotgame">
              <FontAwesomeIcon icon={faYoutube} />
            </a>
            <a href="https://www.tiktok.com/@rpsdotgames">
              <FontAwesomeIcon icon={faTiktok} />
            </a>
          </Box>
          <Box
            sx={{
              marginTop: '10px',
              '& .link': { textDecoration: 'none', color: 'inherit', '&:hover': { textDecoration: 'underline' } },
              '& a': { cursor: 'pointer' },
            }}
          >
            <a className="link" href="https://blog.rps.game/">
              Blog
            </a>
             ✗ 
            <a className="link" id="terms" onClick={handleOpenTermsModal}>
              Terms
            </a>
             ✗ 
            <a className="link" id="privacy" onClick={handleOpenPrivacyModal}>
              Privacy
            </a>
          </Box>
        </Box>
      </BottomBackground>
    </Root>
  );
};

export default CountdownPage;