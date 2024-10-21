import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Button, Container, Typography, Zoom, Box } from '@material-ui/core';
import { fetchLeaderboardsData, fetchEquityDistribution, getMarketingStat } from '../redux/Customer/customer.action';
import PrivacyModal from '../game_panel/modal/PrivacyModal'
import TermsModal from '../game_panel/modal/TermsModal'
import { faXTwitter, faTelegram, faYoutube, faDiscord } from '@fortawesome/free-brands-svg-icons';
import bnb from '../game_panel/icons/bnb.png';
import btc from '../game_panel/icons/btc.png';
import eth from '../game_panel/icons/eth.png'
import ltc from '../game_panel/icons/ltc.png';
import { makeStyles } from '@material-ui/core/styles';
import PlayIcon from '@material-ui/icons/Gamepad';
import LinearProgress from '@material-ui/core/LinearProgress';
import CopyAll from '@material-ui/icons/FileCopy';
import Chart from 'react-apexcharts';
import MonetizationOnIcon from '@material-ui/icons/PieChart';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import DescriptionIcon from '@material-ui/icons/Description';
import Lottie from 'react-lottie';
import animationData from '../game_panel/LottieAnimations/quantum-goal.json'; // Import your Lottie animation
import catBack from '../game_panel/LottieAnimations/cat-back.json'; // Import your Lottie animation
import ApexCharts from 'react-apexcharts';
import centerImage from './logo.webp';
import DepositModal from '../game_panel/modal/DepositModal'
import Web3 from 'web3';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';
import SiteWrapper from '../game_panel/SiteWrapper';
import happyCat from '../util/happyCat.svg'
import cat_bg from '../util/cat_bg.svg'
import remote from '../util/remote.svg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const width = window.innerWidth;
const height = window.innerHeight;

const useStyles = makeStyles((theme) => ({
  root: {
    color: '#FFF',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
  },
  title: {
    fontSize: '2.5rem', // Default size for larger screens
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.5rem', // Size for mobile screens
    },
  },
  bottomBackground: {
    backgroundImage: 'url(https://svgshare.com/i/1BgF.svg)', // Bottom background image
    backgroundSize: 'cover',
    backgroundPosition: '90% 50%',
    height: '100%', // Half of the screen height
    width: '100%',
    position: 'fixed',
    bottom: 0,
    left: 0,
    zIndex: 2, // Place behind the content
  },
  currencies: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '210px',
    margin: '30px auto',
  },
  currency: {
    width: width < 600 ? '32px' : '52px',
    height: width < 600 ? '32px' : '52px',
    opacity: '0.2',
    filter: 'grayscale(100%)',
  },
  availableCurrency: {
    width: width < 600 ? '32px' : '52px',
    height: width < 600 ? '32px' : '52px',
    filter: 'none',
    marginRight: '10px',

  },
  nav: {
    position: 'absolute',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    padding: '20px',
    zIndex: 9,
    top: width < 600 ? '150px' : '220px',
    left: width < 600 ? '-100px' : '-50px',
  },
  gravestone: {
    backgroundImage: 'url(https://svgshare.com/i/1BdF.svg)',
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
      animation: '$pulse 0.5s',
    },
  },
  sectionContainer: {
    width: '100%',
    zIndex: 1,
    position: 'relative',
    marginTop: '0vh',
    marginBottom: '50vh',
  },
  section: {
    padding: '100px 20px',
    textAlign: 'center',
    display: 'none', // Initially hide all sections
  },
  activeSection: {
    display: 'block',
    transition: 'opacity 0.5s',
  },
  '@keyframes throwAndFall': {
    '0%': {
      transform: 'translate(-50%, -67%) rotateX(0deg)',
    },
    '50%': {
      transform: 'translate(-50%, -99%) rotateX(360deg)', // Adjust the height as needed
    },
    '100%': {
      transform: 'translate(-50%, -67%) rotateX(0deg)', // Return to original position
    },
  },
  throwFall: {
    animation: '$throwAndFall 1s ease-in-out', // Adjust the duration as needed
  },
}));



const COUNTDOWN_BUTTONS = [
  { label: 'Tokenomics', section: 'tokenomics' },
  { label: 'Chart', section: 'chart' },
  { label: 'Buy', section: 'buy' },
  { label: 'About', section: 'about' },
];
const generateRandomPositions = (buttonsCount) => {
  const positions = [];
  const buttonWidth = 150;
  const buttonHeight = 80;
  const margin = 20;
  const centerX = width / 2;
  const centerY = height / 2;

  // If width is less than 600px, use fixed positions
  if (width < 600 && height < 700) {

    const fixedPositions = [
      { top: 280, left: 280 },
      { top: 340, left: 300 },
      { top: 160, left: 120 },
      { top: 180, left: 190 },
      { top: 180, left: 340 },
      // Add more fixed positions as needed for your buttons
    ];
    return fixedPositions.slice(0, buttonsCount); // Return only the needed positions
  } else if (width < 600 && height < 900) {
    const fixedPositions = [
      { top: 400, left: 320 },
      { top: 460, left: 340 },
      { top: 280, left: 160 },
      { top: 300, left: 230 },
      { top: 300, left: 380 },
      // Add more fixed positions as needed for your buttons
    ];
    return fixedPositions.slice(0, buttonsCount); // Return only the needed positions
  } else if (width < 600) {

    const fixedPositions = [
      { top: 500, left: 320 },
      { top: 560, left: 340 },
      { top: 380, left: 160 },
      { top: 400, left: 230 },
      { top: 400, left: 380 },
      // Add more fixed positions as needed for your buttons
    ];
    return fixedPositions.slice(0, buttonsCount); // Return only the needed positions
  }

  // For larger screens, use scatter logic
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
      // Fallback position in case of collision
      positions.push({
        top: centerY - buttonHeight / 2 + (i * (buttonHeight + margin)) % (verticalScatterDistance / 2),
        left: centerX - buttonWidth / 2 + (i * (buttonWidth + margin)) % (horizontalScatterDistance / 2),
      });
    }
  }

  return positions;
};

const CountdownPage = ({
  fetchLeaderboardsData,
  fetchEquityDistribution,
  getMarketingStat,
  equityChart,
  isDarkMode,
  loadingEquityChart
}) => {
  const classes = useStyles();
  const history = useHistory();
  const [activeSection, setActiveSection] = useState('');
  const [buttonPositions, setButtonPositions] = useState([]);
  const [showImageBackground, setShowImageBackground] = useState(false); // State to toggle background image
  const [randomGif, setRandomGif] = useState(''); // State to store the randomly selected GIF
  const [throwing, setThrowing] = useState(false); // State for the throwing animation
  const [showDepositModal, setShowDepositModal] = useState(false); // State for deposit modal
  const [web3, setWeb3] = useState(null); // State for web3 instance
  const [web3account, setWeb3Account] = useState(''); // State for account
  const [web3balance, setWeb3Balance] = useState(''); // State for balance
  const [divStyles, setDivStyles] = useState({});
  const [message, setMessage] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Handlers to open and close modals
  const handleOpenTermsModal = () => setShowTermsModal(true);
  const handleCloseTermsModal = () => setShowTermsModal(false);

  const handleOpenPrivacyModal = () => setShowPrivacyModal(true);
  const handleClosePrivacyModal = () => setShowPrivacyModal(false);

  const gifs = [
    'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGR4N2N1YXZwaHY4eDB1OWY3aTBybzJ2dXp2MGJiamcwcDJwbjVxayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6ABLpFTPng3euH1XE6/giphy.gif',
    'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHNvM3VjN3FicHN1ZjM1ZnIwNGtrMGUyZjNiOWQzb3hrZXhxeG9vbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6Jrp4ZD9B1z7VjrKhq/giphy.gif',
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnNza2NvZTdsZ3AwOWlweGJmYmV1cGc5anhyeW1rZ2NpM3l1cWc4YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UxVOH4FZjQ9wBk1hJa/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXZ5YjY4ZWhnY2NmMjY4N205aHRnOW1wenF6bzFjcTZuanllNzdoZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MNNLoVzRBXiW7ndcqb/giphy.gif'
  ];

  const baseColor = '#c734ff'; // Base color (e.g., a shade of purple)
  const chartColors = [
    `${baseColor}FF`, // 100% opacity (fully opaque)
    `${baseColor}DD`, // 80% opacity
    `${baseColor}99`, // 60% opacity
    `${baseColor}66`, // 40% opacity
    `${baseColor}33`, // 20% opacity
    `${baseColor}11`, // 10% opacity
  ];

  const chartOptions = {
    chart: {
      type: 'pie',
      background: isDarkMode ? '#121212' : '#ffffff', // Adjust background based on dark mode
    },
    labels: equityChart && equityChart.length > 0 ? equityChart.map(user => user.username.toUpperCase()) : [], // Use username as label
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        }
      }
    }],
    colors: chartColors,
    legend: {
      show: false // Hide the legend inside the chart
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%', // Adjust the size of the donut chart
          labels: {
            show: false, // Hide the center label
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (value, { seriesIndex }) => {
        const user = equityChart[seriesIndex];
        return `${value.toFixed(2)}%`; // Show username and percentage
      },
      style: {
        colors: ['#ffffff'], // Color for data labels
        fontSize: '14px', // Adjust font size
        fontWeight: 600, // Adjust font weight
      }
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
      useHTML: true, // Allow HTML rendering in the tooltip
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
      labels: ['Team (20%)', 'Marketing (10%)', 'Private Sale (10%)', 'Ecosystem (60%)'],
      colors: chartColors, // Custom colors for each category
      stroke: {
        width: 0,
      },
      legend: {
        position: 'bottom',
        labels: {
          colors: '#fff', // Legend text color
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
          formatter: (value) => `${value}%`, // Show percentages
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
        mode: 'dark', // Dark mode theme
      },
    },
    series: [20, 10, 10, 60], // Tokenomics distribution percentages
  };

  const COUNTDOWN_BUTTONS = [
    { label: 'Play', section: 'play', icon: <PlayIcon /> },
    { label: 'Tokenomics', section: 'tokenomics', icon: <MonetizationOnIcon /> },
    { label: 'Chart', section: 'chart', icon: <ShowChartIcon /> },
    { label: 'Buy', section: 'buy', icon: <AttachMoneyIcon /> },
    { label: 'About', section: 'about', icon: <DescriptionIcon /> },
  ];

  useEffect(() => {
    const updateStyles = () => {
      const width = window.innerWidth;
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
    // Initial check
    updateStyles();

    // Update on resize
    window.addEventListener('resize', updateStyles);
    return () => window.removeEventListener('resize', updateStyles);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchLeaderboardsData();
        await fetchEquityDistribution();
        const marketingStat = await getMarketingStat();
        setMessage(marketingStat.message);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    fetchData();
  }, [fetchLeaderboardsData, fetchEquityDistribution, getMarketingStat]);


  useEffect(() => {
    setButtonPositions(generateRandomPositions(COUNTDOWN_BUTTONS.length));
  }, []);
  useEffect(() => {
    setButtonPositions(generateRandomPositions(COUNTDOWN_BUTTONS.length));

    // Show DepositModal if current path matches '/deposit/' or '/deposit'
    const currentPath = location.pathname;
    if (currentPath === '/investors/deposit/' || currentPath === '/investors/deposit') {
      setShowDepositModal(true);
    } else {
      setShowDepositModal(false);
    }
  }, [location.pathname]);

  const handleCloseDepositModal = () => {
    setShowDepositModal(false);
    history.push('/investors'); // Redirect to /investors
  };

  const loadWeb3 = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        if (accounts.length > 0) {
          const ethBalance = await web3Instance.eth.getBalance(accounts[0]);
          const tokenAmount = web3Instance.utils.fromWei(ethBalance, 'ether');
          setWeb3(web3Instance);
          setWeb3Account(accounts[0]);
          setWeb3Balance(tokenAmount);
        } else {
          alertModal(isDarkMode, 'NO ACCOUNTS AVAILABLE. PLEASE MAKE SURE YOU\'RE LOGGED INTO METAMASK.');
        }
      } else {
        alertModal(isDarkMode, 'NO WEB3 WALLET FOUND IN YOUR BROWSER.');
      }
    } catch (e) {
      alertModal(isDarkMode, 'NO CONNECTED WALLET');
    }
  };

  const handleButtonClick = (section) => {
    if (section === 'play') {
      window.open('/play', '_blank');
      return; // Stop further execution if "play" is clicked
    }

    // Check if the section is 'buy'
    if (section === 'buy') {
      setShowDepositModal(true);
      window.location.href = '/investors/deposit'; // Navigate to /investors/deposit
      return; // Stop further execution
    }

    setActiveSection(section);
    if (section === 'tokenomics') {
      setThrowing(true); // Start throwing animation
      setTimeout(() => setThrowing(false), 1000); // Reset after animation duration
    }

    // Select a random GIF from the list
    const randomIndex = Math.floor(Math.random() * gifs.length);
    setRandomGif(gifs[randomIndex]);

    // Generate a random number between 1500 and 5000 milliseconds
    const randomDuration = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;

    // Show static GIF background for the random duration, then revert back to Lottie
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

      <div className={classes.root}>
        <Helmet>
          <title>Gamified Countdown Page</title>
          <meta name="description" content="Explore our Web3 platform with sections on Tokenomics, Charts, and more!" />
        </Helmet>
        {showDepositModal && (
          <DepositModal
            modalIsOpen={showDepositModal}
            closeModal={handleCloseDepositModal}
            web3={web3}
            loadWeb3={loadWeb3}
            balance={web3balance}
            account={web3account}
          />
        )}

        {/* Conditionally show either the Lottie animation or a static background */}
        <div style={{ width: '100%', height: '100%', position: 'fixed', top: 0, zIndex: 0, filter: 'opacity(0.3)' }}>

          {showImageBackground ? (
            <div
              style={{
                backgroundImage: `url(${randomGif})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '100%',
                width: '100%',
              }}
            ></div>
          ) : (
            <Lottie options={defaultOptions} height={'100%'} width={'100%'} isClickToPauseDisabled={true} />
          )}
        </div>

        {/* Sections and Navigation */}
        <div className={classes.sectionContainer}>
          <Container>

            <Zoom in={activeSection === ''}>
              <section
                id=""
                className={`${classes.section} ${activeSection === '' ? classes.activeSection : ''}`}
              >

                <Typography variant="h2">$RPS TOKEN</Typography>
                <Typography variant="h6">
                  [ GET RICH 💰 OR DIE 🩸 ]
                </Typography>
                <br />
                <Typography variant="body1" className="fading-text">
                  Click the Gravestones below to choose a life path...
                </Typography>
              </section>
            </Zoom>
            <Zoom in={activeSection === 'play'}>

              <section id="play" className={`${classes.section} ${activeSection === 'play' ? classes.activeSection : ''}`}>
                <Typography variant="h1">Welcome to Our Web3 Platform</Typography>
                <Typography variant="body1">Get Rich 💰 or Die 🩸 trying in our immersive new-gen platform.</Typography>
              </section>
            </Zoom>
            <Zoom in={activeSection === 'tokenomics'}>
              <section
                id="tokenomics"
                className={`${classes.section} ${activeSection === 'tokenomics' ? classes.activeSection : ''}`}
              >
                <Typography variant="h2" className={classes.title}>
                  Tokenomics</Typography>
                <Typography variant="body1">
                  Explore the in-depth details of our token distribution and economic model.
                </Typography>

                {/* The Tokenomics Pie Chart */}
                <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginTop: "30px" }}>
                  <ApexCharts options={chartData.options} series={chartData.series} type="donut" height={400} />
                  <img
                    src={centerImage}
                    alt="Center Image"
                    className={throwing ? classes.throwFall : ''} // Apply throw/fall animation class conditionally

                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -68%)',
                      width: '175px', // Adjust the size as needed
                      height: 'auto', // Adjust the size as needed
                      filter: 'grayscale(1)',
                      zIndex: 10, // Ensure the image is above the chart
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", marginTop: "90px" }}>

                  <h4 className="title">
                    Current $RPS Holders
                  </h4>
                  <h6 className="title">
                    (ECO-SYSTEM)
                  </h6>
                  <br />
                  {loadingEquityChart ? (
                    <>
                      <div style={{ height: "200px", width: "30%", display: "block", position: "relative" }}>
                        <span >
                          Retrieving Distribution...
                        </span>
                        <LinearProgress style={{ marginTop: "30px" }} color='secondary' />
                      </div>
                    </>

                  ) : (
                    // Display the pie chart only if equityChart data is available
                    equityChart && equityChart.length > 0 ? (
                      <Chart options={chartOptions} series={chartSeries} type="pie" width="400" />
                    ) : (
                      <div>Calculating Equities...</div>
                    )
                  )}
                  <div className="marketing-message">
                    <p dangerouslySetInnerHTML={{ __html: message.replace(/(\d+(\.\d+)?%?)/g, '<strong>$1</strong>') }} />
                    {!loadingEquityChart && (
                      <img className=" desktop-only" style={{ position: "absolute", bottom: "-50px", right: "50px", filter: "hue-rotate(272deg)" }} src={happyCat} width={"80px"} alt="Caesar the car" />
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", marginTop: "90px" }}>
                    <h4 className="title">
                      Contract Address
                    </h4>
                    <h6 className="title">
                      (COMING 31ST October)
                    </h6>
                    <Box mt={4} textAlign="center" position="relative" style={{ width: '100%', }}>

                      <Box
                        sx={{

                          display: 'inline-block',
                          position: 'relative',
                          border: '1px solid #ccc',
                          borderRadius: '8px',
                          padding: '10px 20px',
                          backgroundColor: '#333', // Adjust according to your theme
                          filter: 'blur(2px)',
                          pointerEvents: 'none', // Disable interaction
                          opacity: 0.6, // Optional: makes it more blurred
                        }}
                      >
                        0x123456...12345678
                      </Box>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(255, 255, 255, 0.7)', // Optional: Overlay color
                          borderRadius: '8px',
                        }}
                      >
                        <Typography variant="h6" style={{ color: '#350554' }}>
                          Coming Soon
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        style={{
                          marginTop: '2px',
                          marginBottom: '4px',
                          pointerEvents: 'none', // Disable button interaction
                        }}
                      >
                        <CopyAll />
                      </Button>
                    </Box>
                  </div>
                </div>
              </section>
            </Zoom>


            <Zoom in={activeSection === 'chart'}>

              <section id="chart" className={`${classes.section} ${activeSection === 'chart' ? classes.activeSection : ''}`}>
                <Typography variant="h2" className={classes.title}>
                  Live Token Chart</Typography>
                <Typography variant="body1">Chart coming soon...</Typography>
              </section>
            </Zoom>
            <Zoom in={activeSection === 'buy'}>

              <section id="buy" className={`${classes.section} ${activeSection === 'buy' ? classes.activeSection : ''}`}>
                <Typography variant="h2" className={classes.title}>
                  Buy Tokens</Typography>
                <Button variant="contained" onClick={{ setShowDepositModal }} color="primary">
                  Buy Now
                </Button>
              </section>
            </Zoom>
            <Zoom in={activeSection === 'about'}>
              <section
                id="about"
                className={`${classes.section} ${activeSection === 'about' ? classes.activeSection : ''}`}
                style={{ marginBottom: width < 600 ? "200px" : "0" }}
              >
                <Typography variant="h2" className={classes.title} gutterBottom>
                  About
                </Typography>

                <div style={{ position: 'relative' }}>
                  <div className="speech-bubble scroll-animation" style={{ animationDelay: '0.6s' }}>
                    <Typography variant="h6" component="span" style={{ fontStyle: 'italic', color: '#ff6347' }}>
                      “Skill-gaming is the purr-fect solution!”
                    </Typography>
                  </div>

                  <img
                    className="scroll-animation"
                    style={{ transform: 'scale(1.5)', width: "100%", margin: "20px 0", animationDelay: '0.8s', filter: 'opacity(0.25)' }}
                    src={cat_bg}
                    alt="Cat of Egypt"
                  />

                  <div style={divStyles} className="scroll-animation">

                    <Typography
                      variant="body1"
                      paragraph
                      className="scroll-animation"
                      style={{ animationDelay: '0.2s' }}
                    >
                      Read our <span className="highlight">comprehensive guide</span> to understand our platform's vision
                      and technology. Trust us, it's not as paw-some as a cat nap, but it’s pretty close.
                    </Typography>

                    <Typography
                      variant="body2"
                      paragraph
                      className="scroll-animation"
                      style={{ animationDelay: '0.4s' }}
                    >
                      Caesar was fed up with the <span className="highlight">claw-ful</span> trickery in the financial system.
                      This cat wasn’t kitten around when he decided to swipe at the issues of usury and private lending.
                      He scratched out a game to simulate a real-life economy that even the fussiest felines would love!
                    </Typography>


                    <Typography
                      variant="body2"
                      paragraph
                      className="scroll-animation"
                      style={{ animationDelay: '1s' }}
                    >
                      Sadly, Caesar’s attempt at starting a decentralized micro-economy, <span className="highlight">RPS.Game</span>,
                      got him killed. But fear not, fellow fur-iends, RPS.Game lives on! It’s a decentralized platform powered by its native
                      token, <span className="highlight">$RPS</span>, and just like a cat, it has <strong>NINE LIVES</strong>.
                      This game isn’t going anywhere. In fact, it’s here to stay furrever.
                    </Typography>

                    <Typography
                      variant="body2"
                      paragraph
                      className="scroll-animation"
                      style={{ animationDelay: '1.2s' }}
                    >
                      <span className="highlight">RPS.Game</span> offers financial tools that are typically gate-kept by the Elite,
                      but we’ve opened the door for <span className="highlight">EVERYONE</span>—whether you're a fat cat or a stray.
                      Using <span className="highlight">$RPS</span>, we’ve got a solution to inflation by capping the total supply
                      at <strong>100 million tokens</strong>. Just think of it as a ball of yarn with a limit on how much it can unravel!
                    </Typography>

                    <Typography
                      variant="body2"
                      paragraph
                      className="scroll-animation"
                      style={{ animationDelay: '1.4s' }}
                    >
                      The token distribution? We’re giving 30% to the team (for their paw-some efforts), 60% to the community
                      (you cool cats), and the rest... well, that’s still in the litter box for now.
                    </Typography>

                    <Typography
                      variant="body2"
                      paragraph
                      className="scroll-animation"
                      style={{ animationDelay: '1.6s' }}
                    >
                      Mark your cat-lendars! The private sale of <span className="highlight">$RPS</span> opens on
                      <strong> 31st October</strong>. So, sharpen your claws and get ready! Remember, it’s
                      <strong> GET RICH 💰 OR DIE 🩸</strong>—fur real.
                    </Typography>
                  </div>
                </div>
                <div id="" className={classes.footerContainer}>


                  <div className={classes.currencies}>
                    <img className={classes.availableCurrency} src={bnb} alt="BNB" />
                    <img className={classes.availableCurrency} src={btc} alt="BTC" />
                    <img className={classes.availableCurrency} src={eth} alt="ETH" />
                    <img className={classes.availableCurrency} src={ltc} alt="LTC" />
                    <span>+ 50 MORE!</span>
                  </div>


                  <div className={classes.address}>
                    <p>This website falls under provable fairness because (1) P2P, skill games are transformative and (2) players have a 100% control-rate over the AI technology used to replace an intermediary.
                    </p>
                    <p>Also rps.game has absolutely no involvement with any third-party gambling provider software or 'provably-fair' algorithms.
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

              </section>
            </Zoom>
          </Container>
        </div>

        <div className={classes.bottomBackground}>

          <div className={classes.nav}>
            <div style={{ position: 'relative' }}>
              <img
                className="scroll-animation"
                style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(71px, 346px)', width: "50px", animationDelay: '0.8s', filter: 'opacity(0.25)' }}
                src={remote}
                alt="Remote Control"
              />
              <Lottie options={catOptions} style={{ position: 'absolute', left: '50%', top: '50%', transform: width < 600 ? 'translateY(30%)' : 'translateY(40%)' }} height={'auto'} width={'300px'} isClickToPauseDisabled={true} />
            </div>
            {COUNTDOWN_BUTTONS.map((button, index) => (
              <Zoom in={true} timeout={index * 200} key={button.label}>
                <div
                  className={classes.gravestone}
                  style={{ top: buttonPositions[index]?.top, left: buttonPositions[index]?.left }}
                  onClick={() => handleButtonClick(button.section)}
                >
                  <div style={{ transform: 'rotateZ(6deg)', marginLeft: '-10px' }}>
                    {button.icon}
                  </div>
                  <Typography variant="h6" style={{
                    fontSize: '0.5rem',
                    transform: 'rotateZ(6deg)', // Apply z-angle rotation to the text
                    transition: 'transform 0.3s',
                    marginLeft: '-10px'
                  }}>
                    {button.label}
                  </Typography>
                </div>
              </Zoom>
            ))}
          </div>

          {/* Footer */}
          <div style={{position: "absolute", bottom: "0", display:"flex", textAlign:"left", flexDirection: "column", padding: "30px", justifyContent: "center", alignContent: "center"}} >
            <div className="countdown social-icons" style={{ display: 'flex', alignItems: 'center' }}>
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
            <div className="countdown">

              <a className={classes.link} href="https://blog.rps.game/">Blog</a>&nbsp;✗&nbsp;
              {/* <a className={classes.link} href="#">Faq</a>&nbsp;✗&nbsp; */}
              <a className={classes.link}
                // href="/#"
                id="terms"
                onClick={handleOpenTermsModal}
              >
                Terms
              </a>&nbsp;✗&nbsp;
              <a className={classes.link}
                // href="#"
                id="privacy"
                onClick={handleOpenPrivacyModal}
              >
                Privacy
              </a>
            </div>

            {/* <a className={classes.link} href="#">Fair</a> */}

          </div>
        </div>
      </div>
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
  getMarketingStat,
};

// Connect CountdownPage to Redux
export default connect(mapStateToProps, mapDispatchToProps)(CountdownPage);