import React, { useState, useRef, useEffect, useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faToggleOn,
  faToggleOff,
  faBrain,
  faCoins,
  faBan,
  faClock,
  faRobot,
  faInfoCircle,
  faCrown,
  faBalanceScale,
  faLink,
  faUnlink,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
import {
  Switch,
  Button,
  Tabs,
  Tab,
  Grid,
  Box,
  IconButton,
  Modal,
  TextField,
  Slider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Tooltip,
  CircularProgress,
  Collapse,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReactApexChart from 'react-apexcharts';
import {
  getRpsBetItems,
  getQsBetItems,
  updateQbot,
  getMyGames,
  getQbot,
  updateBetRangeFunction
} from '../redux/Logic/logic.actions';
import { setFocused, getUser } from '../redux/Auth/user.actions';

import BetAmountInput from '../components/BetAmountInput.jsx';
import SettingsRef from './SettingsRef';
import { convertToCurrency } from '../util/conversion';
import { getRank } from '../util/getRank.js';

const SideTabs = ({ selectedTab, handleTabChange }) => (
  <Tabs
    orientation="vertical"
    className={`side-tab-switcher`}
    value={selectedTab}
    onChange={handleTabChange}
    sx={{
      // Make the indicator (the highlight bar) red
      '& .MuiTabs-indicator': {
        backgroundColor: 'red',
        marginRight: '0px',
      },
      // Make the text of the tabs themselves red when not selected
      '& .MuiTab-root': {
        color: '#7c7c7c',
      },
      // Make the text red when the tab is selected
      '& .Mui-selected': {
        color: '#ff0000 !important',
      },
    }}
  >
    <Tab icon={<FontAwesomeIcon icon={faCoins} />} />
    <Tab icon={<FontAwesomeIcon icon={faBrain} />} />
    <Tab icon={<FontAwesomeIcon icon={faLink} />} />
  </Tabs>
);

function BetArray({
  // Redux state
  rpsbetitems,
  getRpsBetItems,
  qsbetitems,
  getQsBetItems,
  updateQbot,
  getQbot,
  getMyGames,
  myGames,
  solPrice,
  totalWagered,
  user_balance,
  user_id,
  updateBetRangeFunction,
  predictedBetAmount,
  updateUserStrategy,
  getUser,
  betting,
  handleSwitchChange,
  handleDetachAttachChange,
  isDarkMode,
  attached,
  qs_game_type,
  ai_mode,
  rank: externalRank,
  user_range,
  getAttachedRooms,
  is_betting,
  room_id,
  bet_amount,
  handle2xButtonClick,
  handleHalfXButtonClick,
  handleMaxButtonClick,
  bankroll,
  onChangeState,
  strategies,
  game_type
}) {
  // Tabs
  const [selectedTab, setSelectedTab] = useState(0);

  // Local states
  const [settings_panel_opened, setSettingsPanelOpened] = useState(false);
  const [timerValue, setTimerValue] = useState(2000);
  const [range, setRange] = useState([1, 100]);
  const [isDragging, setIsDragging] = useState(false);
  const [debounceTimeoutId, setDebounceTimeoutId] = useState(null);
  const [isSliderDisabled, setIsSliderDisabled] = useState(false);
  const [text, setText] = useState('');
  const [accumulativeProfit, setAccumulativeProfit] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(ai_mode);
  const [bettingQbot, setBettingQbot] = useState(false);
  const [attachedRooms, setAttachedRooms] = useState([]);
  const [isActiveQbot, setIsActiveQbot] = useState(false); // Q-BOT status
  const [aiOn, setAiOn] = useState(false);
  const [alignment, setAlignment] = useState('IS');

  // If the user has a rank from outside, else we compute
  const [rank, setRank] = useState(null);

  // Show/hide advanced panel
  const [showMore, setShowMore] = useState(false);

  // For references
  const settingsRef = useRef(null);
  const isMounted = useRef(true);
  // Chart data for the “Training Data” tab
  const chartData = {
    options: {
      chart: {
        animations: { enabled: false },
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      grid: { show: false },
      tooltip: { enabled: false },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          gradientToColors: ['#8F7CC3'],
          shadeIntensity: 1,
          type: 'vertical',
          opacityFrom: 0.7,
          opacityTo: 0.9,
          stops: [0, 100, 100]
        }
      },
      stroke: { curve: 'smooth' },
      xaxis: {
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false }
      },
      yaxis: {
        labels: { show: false },
        axisTicks: { show: false },
        axisBorder: { show: false }
      }
    },
    series: [
      {
        name: 'Accumulative Profit',
        data: accumulativeProfit || [],
      },
    ],
  };

  // LIFECYCLE
  // ----------------------------------------------------------------------------------
  const fetchAttachedRooms = useCallback(async () => {
    try {
      if (getAttachedRooms) {
        const rooms = await getAttachedRooms();
        if (isMounted.current) {
          setAttachedRooms(rooms);
        }
      }
    } catch (error) {
      console.error('Error fetching attached rooms:', error);
    }
  }, [getAttachedRooms]);

  // 1) On mount, fetch rank, fetch Q-BOT status
  useEffect(() => {
    isMounted.current = true;
    (async () => {
      try {
        // If user has a rank externally, use that, else compute it
        if (!externalRank) {
          const computedRank = await getRank(totalWagered);
          setRank(computedRank);
        } else {
          setRank(externalRank);
        }
        // Q-Bot status
        if (user_id) {
          const qbotStatus = await getQbot(user_id);
          if (isMounted.current) {
            setIsActiveQbot(qbotStatus);
            setBettingQbot(qbotStatus);
          }
        }
        if (attached) {
          setAiOn(true);
          setAlignment('RA');
        } else if (qbotStatus) {
          setAiOn(true);
          setAlignment('EL');
        } else {
          // default
          setAiOn(false);
          setAlignment('IS');
        }
        // fetch attached rooms
        await fetchAttachedRooms();
      } catch (err) {
        console.error('Error in BetArray mount:', err);
      }
    })();
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      isMounted.current = false;
      document.removeEventListener('mousedown', handleClickOutside);

    };
  }, [externalRank, user_id, totalWagered, getQbot, fetchAttachedRooms]);

  // 3) Build accumulativeProfit
  useEffect(() => {
    let profit = 0;
    const arr = game_type === 'Quick Shoot' ? qsbetitems : rpsbetitems;
    if (!arr || !Array.isArray(arr)) {
      // skip if not loaded yet
      return;
    }
    const reversedItems = [...arr].reverse();

    const calculatedProfit = reversedItems.map(item => {
      let profitChange = 0;
      if (game_type === 'RPS') {
        // Simple RPS logic
        if (
          (item.rps === 'R' && item.joiner_rps === 'P') ||
          (item.rps === 'P' && item.joiner_rps === 'S') ||
          (item.rps === 'S' && item.joiner_rps === 'R')
        ) {
          profitChange = item.bet_amount * 2;
        } else if (
          (item.rps === 'R' && item.joiner_rps === 'S') ||
          (item.rps === 'P' && item.joiner_rps === 'R') ||
          (item.rps === 'S' && item.joiner_rps === 'P')
        ) {
          profitChange = -item.bet_amount;
        }
      } else if (game_type === 'Quick Shoot') {

        const betAmount = Number(item.bet_amount);
        const qs = Number(item.qs);
        const joinerQs = Number(item.joiner_qs);
        const qsGameType = Number(qs_game_type);
        if (!isNaN(betAmount) && !isNaN(qs) && !isNaN(joinerQs) && !isNaN(qsGameType) && qsGameType > 1) {
          if (qs !== joinerQs) {
            // e.g. betAmount / (qsGameType - 1)
            profitChange = betAmount / (qsGameType - 1);
          } else {
            profitChange = -betAmount;
          }
        }
      }
      profit += profitChange;
      return profit;
    });

    setAccumulativeProfit(calculatedProfit);
  }, [rpsbetitems, qsbetitems, game_type, qs_game_type]);

  // 4) If min/max bet changes, store them in [range]
  useEffect(() => {
    if (user_range && user_range.length === 2) {
      const [min, max] = user_range;
      setRange([min, max]);
    }
  }, [user_range]);

  const formatProfit = (profit) => {
    if (profit > 0) {
      return (
        <span style={{
          padding: '0 5px',
          fontSize: '0.75em',
          background: '#28a74522',
          borderRadius: '30px',
          border: '2px solid #28a745',
          color: '#28a745'
        }}>
          +{convertToCurrency(profit, solPrice)}
        </span>
      );
    } else if (profit < 0) {
      return (
        <span style={{
          padding: '0 5px',
          fontSize: '0.75em',
          background: '#ff000022',
          borderRadius: '30px',
          border: '2px solid #ff0000',
          color: '#ff0000'
        }}>
          -{convertToCurrency(Math.abs(profit), solPrice)}
        </span>
      );
    } else {
      return <span>{convertToCurrency(profit)}</span>;
    }
  };


  const formatTag = (tag) => {
    return (
      <span style={{
        padding: '0 5px',
        fontSize: '0.75em',
        background: '#007bff22',
        borderRadius: '30px',
        border: '2px solid #007bff45',
        color: '#007bff'
      }}>
        {tag}
      </span>
    );
  };

  // EVENT HANDLERS
  // ----------------------------------------------------------------------------------
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // (B) DETACH/ATTACH SWITCH with a small fetch
  const handleSwitchChangeWithFetch = async (event) => {
    await handleDetachAttachChange(event);
    setTimeout(async () => {
      await fetchAttachedRooms();
    }, 1500);
  };


  // (A) Q-BOT MASTER SWITCH
  const handleQbotSwitchChange = useCallback(async (event) => {
    const newVal = event.target.checked;
    setBettingQbot(newVal);
    try {
      await updateQbot(user_id, newVal);
      setIsActiveQbot(newVal);
    } catch (err) {
      console.error('Error updating Q-bot status', err);
      setBettingQbot(isActiveQbot); // revert if fail
    }
  }, [user_id, updateQbot, isActiveQbot]);


  // AI on/off main switch
  const handleAiSwitch = useCallback((event) => {
    const newChecked = event.target.checked;
    setAiOn(newChecked);

    if (newChecked) {
      // AI is turned ON => interpret alignment
      if (alignment === 'RA') {
        handleSwitchChangeWithFetch(); // attach logic
      } else if (alignment === 'EL') {
        handleQbotSwitchChange(); // Q-bot logic
      } else {
        // "IS" => no special logic => maybe just call handleSwitchChange to start AI
        handleSwitchChange();
      }
    } else {
      // AI turned OFF => call handleSwitchChange to stop
      handleSwitchChange();

      // If we were attached => forcibly detach
      // If we were Q-bot => forcibly turn off Q-bot
      if (alignment === 'RA' && attached) {
        // e.g. do some detach logic if needed
      }
      if (alignment === 'EL' && bettingQbot) {
        // forcibly turn off Q-bot
        setBettingQbot(false);
        updateQbot(user_id, false);
      }
    }
  }, [
    alignment,
    attached,
    bettingQbot,
    handleSwitchChangeWithFetch,
    handleQbotSwitchChange,
    handleSwitchChange,
    user_id,
    updateQbot
  ]);

  // The 3-state toggle
  const handleAlignmentChange = useCallback((event, newVal) => {
    if (!newVal) return; // ignore if user tries to unselect
    setAlignment(newVal);

    // If AI is ON, we do the relevant action
    if (aiOn) {
      if (newVal === 'RA') {
        handleSwitchChangeWithFetch();
      } else if (newVal === 'EL') {
        handleQbotSwitchChange();
      } else {
        // "IS" => do nothing special or forcibly detach/Q-bot off
        // depends on your logic
      }
    }
  }, [aiOn, handleSwitchChangeWithFetch, handleQbotSwitchChange]);




  // (D) RANGE SLIDER
  function debounce(fn, delay) {
    return function (...args) {
      if (debounceTimeoutId) {
        clearTimeout(debounceTimeoutId);
      }
      const newTimeoutId = setTimeout(() => {
        fn(...args);
      }, delay);
      setDebounceTimeoutId(newTimeoutId);
    };
  }

  const handleSliderChange = (event, newValue) => {
    setRange(newValue);
    setIsDragging(true);
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId);
    }
  };

  const debouncedHandleRangeChange = debounce(async (event, newValue) => {
    setIsSliderDisabled(true);
    await handleRangeChange(event, newValue);
    setIsSliderDisabled(false);
  }, 1000);

  const handleSliderChangeCommitted = (event, newValue) => {
    setIsDragging(false);
    debouncedHandleRangeChange(event, newValue);
  };

  const handleRangeChange = async (event, newValue) => {
    await updateBetRangeFunction(user_id, newValue);
    await getUser();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId);
      setDebounceTimeoutId(null);
    }
    debouncedHandleRangeChange();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId);
      setDebounceTimeoutId(null);
    }
    debouncedHandleRangeChange();
  };

  const handleClickOutside = (e) => {
    if (settingsRef.current && !settingsRef.current.contains(e.target)) {
      setSettingsPanelOpened(false);
    }
  };

  // (E) Settings Panel
  const handleSettingsIconClick = () => {
    setSettingsPanelOpened(!settings_panel_opened);
  };

  // (F) Toggle the Show More panel
  const handleShowMoreToggle = () => {
    setShowMore((prev) => !prev);
  };

  // RENDER
  // ----------------------------------------------------------------------------------
  const filteredArray = game_type === 'Quick Shoot' ? qsbetitems : rpsbetitems;
  const [newMin, newMax] = range;
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Our vertical side tabs */}
      <SideTabs selectedTab={selectedTab} handleTabChange={handleTabChange} />

      {/* The hidden "SettingsRef" panel on the side */}
      <SettingsRef
        strategies={strategies}
        ai_mode={ai_mode}
        user_id={user_id}
        updateUserStrategy={updateUserStrategy}
        settings_panel_opened={settings_panel_opened}
        setSelectedStrategy={setSelectedStrategy}
        settingsRef={settingsRef}
        rank={rank}
        selectedStrategy={selectedStrategy}
      />

      {/* TAB 0: AI BETTING PANEL */}
      {selectedTab === 0 && (
        <Box
          className="gamified-container"
          sx={{
            display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-start', alignItems: 'center',
            width: '100%'
          }}
        >
          {/* AI Status Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: betting ? (is_betting ? '#28a745' : '#007bff') : '#ff0000',
              background: betting
                ? is_betting
                  ? '#0ef34233'
                  : '#007bff33'
                : '#ff000033',
              width: '100%',
              boxShadow: betting
                ? is_betting
                  ? 'inset #28a745 0px 0px 6px 0px'
                  : 'inset #007bff 0px 0px 6px 0px'
                : 'inset #ff0000 0px 0px 6px 0px',
              borderRadius: 1,
              justifyContent: 'center',
              padding: '5px 10px',
              overflow: 'hidden',
            }}
          >
            {betting ? (
              is_betting ? (
                <>
                  <FontAwesomeIcon icon={faBrain} style={{ marginRight: '5px' }} />
                  THINKING...
                </>
              ) : predictedBetAmount > 0 ? (
                <>
                  <FontAwesomeIcon icon={faCoins} style={{ marginRight: '5px' }} />
                  TRIED&nbsp;{convertToCurrency(predictedBetAmount, solPrice)}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faClock} style={{ marginRight: '5px' }} />
                  ANALYSING LAST BETS
                </>
              )
            ) : (
              <>
                <FontAwesomeIcon icon={faBan} style={{ marginRight: '5px' }} />
                OFF
              </>
            )}
          </Box>
          {/* 1) BetAmountInput */}
          <BetAmountInput
            bet_amount={bet_amount}
            handle2xButtonClick={handle2xButtonClick}
            handleHalfXButtonClick={handleHalfXButtonClick}
            handleMaxButtonClick={handleMaxButtonClick}
            onChangeState={onChangeState}
            isDarkMode={isDarkMode}
            bankroll={bankroll}
          />

          {/* Show more button */}
          <Button
            variant="contained"
            disableElevation
            color="error"
            size="small"
            fullWidth
            onClick={handleShowMoreToggle}
            sx={{ mt: 1 }}
            endIcon={<AutoAwesomeIcon />} // Add the magic/AI icon here
          >
            {showMore ? 'Hide AI Options' : 'Show AI Options'}
          </Button>

          {/* 2) Collapsible advanced panel */}
          <Collapse in={showMore} timeout="auto" unmountOnExit sx={{ width: '100%' }}>


            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              {/* AI Switch */}
              <Box sx={{ display: 'flex', alignItems: 'center', width: '50%', justifyContent: 'center' }}>
                <Switch
                  checked={aiOn}
                  onChange={handleAiSwitch}
                  color="error"
                />
                {aiOn && <CircularProgress size={16} color="error" />}

              </Box>


              <Box
                sx={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '50%',
                  padding: '10px 0',
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography
                    sx={{
                      width: '100%',
                      textAlign: 'center',
                      boxShadow: 'inset 0px 0px 6px 0px #b4b4b4a8',
                      borderRadius: 1,
                      padding: '5px 10px',
                      overflow: 'hidden',
                    }}
                  >
                    AI Play
                    <Tooltip title="Betting will be slow, while active. Best used AFK">
                      <InfoIcon sx={{ width: '18px', cursor: 'pointer', mt: -0.2, ml: 1 }} />
                    </Tooltip>

                  </Typography>
                </Box>
              </Box>
            </Box>


            {/* Strategy Edit & Current Strategy */}
            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '50%',
                  padding: '10px',
                }}
              >
                <Tooltip title="CHANGE AI MODEL">
                  <IconButton
                    id="btn-rps-settings"
                    sx={{ borderRadius: '0.5em' }}
                    onClick={handleSettingsIconClick}
                  >
                    <Typography sx={{ fontSize: '0.5em', marginRight: '2px' }}>CHANGE</Typography>
                    <AutoAwesomeIcon sx={{ p: 0.4 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box
                sx={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '50%',
                  padding: '10px 0',
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Typography
                    sx={{
                      width: '100%',
                      textAlign: 'center',
                      boxShadow: 'inset 0px 0px 6px 0px #b4b4b4a8',
                      borderRadius: 1,
                      padding: '5px 10px',
                      overflow: 'hidden',
                    }}
                  >
                    {selectedStrategy || ai_mode}<Tooltip title="Betting will be slow, while active. Best used AFK">
                      <InfoIcon sx={{ width: '18px', cursor: 'pointer', mt: -0.2, ml: 1 }} />
                    </Tooltip>
                  </Typography>
                </Box>
              </Box>
            </Box>
            {/* AI Betting Toggle */}
            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              {/* Switch + Label + Possibly a spinner */}
              <Box
                sx={{
                  display: 'inline-flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                {/* AI Switch */}
                {/* 3-state ToggleButtonGroup */}

                <Box
                  sx={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '50%',
                  }}
                >

                  <ToggleButtonGroup
                    value={alignment}
                    exclusive
                    onChange={handleAlignmentChange}
                    aria-label="Platform"
                  >
                    <ToggleButton value="IS" aria-label="IS">IS</ToggleButton>
                    <ToggleButton value="RA" aria-label="RA">RA</ToggleButton>
                    <ToggleButton value="EL" aria-label="EL">EL</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box
                  sx={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '50%',
                    padding: '10px 0',
                  }}
                >
                  <Typography
                    sx={{
                      width: '100%',
                      textAlign: 'center',
                      boxShadow: 'inset 0px 0px 6px 0px #b4b4b4a8',
                      borderRadius: 1,
                      padding: '5px 10px',
                      overflow: 'hidden',
                    }}
                  >
                    MODE<Tooltip title="Betting will be slow, while active. Best used AFK">
                      <InfoIcon sx={{ width: '18px', cursor: 'pointer', mt: -0.2, ml: 1 }} />
                    </Tooltip>
                  </Typography>
                </Box>
              </Box>


            </Box>
            {/* Adjust Bet Range */}
            <Box
              sx={{
                pointerEvents: selectedStrategy === 'GPT3' ? 'none' : 'auto',
                filter: selectedStrategy === 'GPT3' ? 'grayscale(100%)' : 'none',
                opacity: selectedStrategy === 'GPT3' ? '0.3' : '1',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                boxShadow: 'inset 0px 0px 6px 0px #b4b4b4a8',
                borderRadius: 1,
                justifyContent: 'center',
                padding: '5px 10px',
                overflow: 'hidden',
                mt: 2
              }}
            >
              <FontAwesomeIcon icon={faBalanceScale} style={{ marginRight: '5px' }} />
              <Typography>ADJUST BET RANGE</Typography>
            </Box>

            {/* Min/Max Bet Display */}
            <Box
              sx={{
                pointerEvents: selectedStrategy === 'GPT3' ? 'none' : 'auto',
                filter: selectedStrategy === 'GPT3' ? 'grayscale(100%)' : 'none',
                opacity: selectedStrategy === 'GPT3' ? '0.3' : '1',
                display: 'flex',
                padding: '0 10px',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                mt: 1,
              }}
            >
              <Typography>
                <Box component="span" sx={{ fontSize: 'xx-small' }}>Min:</Box> {convertToCurrency(range[0])}
              </Typography>
              <Typography>
                <Box component="span" sx={{ fontSize: 'xx-small' }}>Max:</Box> {convertToCurrency(range[1])}
              </Typography>
            </Box>

            {/* Slider */}
            <Box
              sx={{
                display: 'flex',
                padding: '0 10px',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                mt: 1,
                pointerEvents: selectedStrategy === 'GPT3' ? 'none' : 'auto',
                filter: selectedStrategy === 'GPT3' ? 'grayscale(100%)' : 'none',
              }}
            >
              <Tooltip
                title={selectedStrategy === 'GPT3' ? `NO BET RANGE FOR ${selectedStrategy}` : 'MIN & MAX BET VALUES'}
              >
                <Slider
                  value={range}
                  color="error"
                  onChange={handleSliderChange}
                  onChangeCommitted={handleSliderChangeCommitted}
                  onMouseUp={handleMouseUp}
                  onTouchEnd={handleTouchEnd}
                  valueLabelDisplay="auto"
                  step={0.0005}
                  min={0.0005}
                  max={user_balance}
                  getAriaLabel={(index) => (index === 0 ? 'Minimum value' : 'Maximum value')}
                  sx={{
                    height: 8,
                    '& .MuiSlider-thumb': { height: 24, width: 24 },
                    '& .MuiSlider-track': { height: 8 },
                    '& .MuiSlider-rail': { height: 8 },
                  }}
                  disabled={isSliderDisabled}
                />
              </Tooltip>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  boxShadow: 'inset 0px 0px 6px 0px #b4b4b4a8',
                  borderRadius: 1,
                  justifyContent: 'center',
                  padding: '5px 10px',
                  overflow: 'hidden',
                }}
              >
                <Typography sx={{ fontSize: 'x-small' }}>{text}</Typography>
              </Box>
            </Box>
          </Collapse>
        </Box>
      )}

      {/* TAB 1: Training Data (RPS / QS items + chart) */}
      {selectedTab === 1 && (
        <Box
          className="gamified-container"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Grid item sx={{ width: '100%' }}>
            <Typography variant="h6" sx={{ marginBottom: '0' }}>
              Training Data&nbsp;
              <Tooltip title="This data may not represent your recent transactions and is for AI use only.">
                <InfoIcon sx={{ width: '18px', marginTop: '-3px', cursor: 'pointer' }} />
              </Tooltip>
            </Typography>
            {/* Tag + Accumulative Profit */}
            <Box sx={{ position: 'absolute', zIndex: 2, top: '180px', right: '30px' }}>
              {formatTag('Last 50 Games')}&nbsp;
              {accumulativeProfit && accumulativeProfit.length > 0 ? (
                <Tooltip title={`${accumulativeProfit[accumulativeProfit.length - 1]} SOL`}>
                  {formatProfit(accumulativeProfit[accumulativeProfit.length - 1])}
                </Tooltip>
              ) : (
                <Tooltip title="0 SOL">
                  {formatProfit(0)}
                </Tooltip>
              )}

            </Box>

            {/* Chart #1: Accumulative Profit */}
            {accumulativeProfit && accumulativeProfit.length > 0 ? (
              <ReactApexChart
                options={chartData.options}
                series={chartData.series}
                type="line"
                height={180}
              />
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', padding: '16px', color: '#777' }}>
                No chart data available yet
              </Typography>
            )}

            {/* Table of items */}
            <Box className="gamified-content" sx={{ width: '100%', mt: 1 }}>
              {filteredArray.length > 0 ? (
                <>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: '800', color: '#333' }}>{'BET (SOL)'}</TableCell>
                        <TableCell sx={{ fontWeight: '800', color: '#333' }}>{'HOST'}</TableCell>
                        <TableCell sx={{ fontWeight: '800', color: '#333' }}>{'YOU'}</TableCell>
                      </TableRow>
                    </TableHead>
                  </Table>

                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    <Table sx={{ width: '100%', tableLayout: 'fixed' }}>
                      <TableBody>
                        {filteredArray.map((item, index) => (
                          <TableRow
                            key={index}
                            sx={{
                              '&:nth-of-type(odd)': { backgroundColor: '#e5e5e5' },
                              '&:hover': { backgroundColor: '#f9f9f9' },
                            }}
                          >
                            {/* BET */}
                            <TableCell
                              sx={{ position: 'relative', cursor: 'pointer' }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {item.bet_amount}<span style={{ marginLeft: '5px', fontSize: 'small' }}> ({convertToCurrency(item.bet_amount, solPrice)})</span>
                              </Box>
                            </TableCell>

                            {/* HOST */}
                            <TableCell
                              sx={{ position: 'relative', cursor: 'pointer' }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', textAlign: 'center' }}>
                                {game_type === 'Quick Shoot' ? item.qs : item.rps}
                              </Box>
                            </TableCell>

                            {/* YOU */}
                            <TableCell
                              sx={{ position: 'relative', cursor: 'pointer' }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', textAlign: 'center' }}>
                                {game_type === 'Quick Shoot' ? item.joiner_qs : item.joiner_rps}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </>
              ) : (
                <Typography variant="body1" sx={{ textAlign: 'center', padding: '16px', color: '#777' }}>
                  Play normally to train the AI
                </Typography>
              )}
            </Box>
          </Grid>

        </Box>
      )}

      {/* TAB 2: “Active Rooms” + Q-BOT Rooms */}
      {selectedTab === 2 && (
        <Box
          className="gamified-container"
          sx={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', width: '100%'
          }}
        >
          <Grid item sx={{ width: '100%' }}>
            <Typography variant="h6" sx={{ marginBottom: '20px' }}>
              Active Rooms&nbsp;
              <Tooltip title="This data may not represent your recent transactions and is for AI usage only.">
                <InfoIcon sx={{ width: '18px', marginTop: '-3px', cursor: 'pointer' }} />
              </Tooltip>
            </Typography>

            <Box sx={{ width: '100%', marginTop: '20px' }}>
              <Table sx={{ width: '100%', tableLayout: 'fixed' }} aria-label="rooms table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: '800', color: '#333' }} align="center">
                      Room
                    </TableCell>
                    <TableCell sx={{ fontWeight: '800', color: '#333' }} align="center">
                      Range
                    </TableCell>
                    <TableCell sx={{ fontWeight: '800', color: '#333' }} align="center">
                      Model
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {attachedRooms && attachedRooms.length > 0 ? (
                    attachedRooms.map((room) => {
                      const betAmounts = room.bet_amounts || [];
                      const minBet = Math.min(...betAmounts);
                      const maxBet = Math.max(...betAmounts);

                      return (
                        <TableRow
                          key={room._id}
                          sx={{
                            '&:nth-of-type(odd)': { backgroundColor: '#e5e5e5' },
                            '&:hover': { backgroundColor: '#f9f9f9' },
                            cursor: 'pointer',
                          }}
                        >
                          <TableCell align="center" sx={{ position: 'relative' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <a href={`/join/${room._id}`} style={{ color: '#333', textDecoration: 'none' }}>
                                {room.room_name}
                              </a>
                            </Box>
                          </TableCell>

                          <TableCell align="center" sx={{ position: 'relative' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {betAmounts.length
                                ? `${convertToCurrency(minBet, solPrice)} - ${convertToCurrency(maxBet, solPrice)}`
                                : 'N/A'}
                            </Box>
                          </TableCell>

                          <TableCell align="center" sx={{ position: 'relative' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {room.selected_strategy || 'N/A'}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow
                      sx={{
                        '&:nth-of-type(odd)': { backgroundColor: '#e5e5e5' },
                        '&:hover': { backgroundColor: '#f9f9f9' },
                      }}
                    >
                      <TableCell colSpan={3} align="center">
                        No active rooms available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            {/* "Q-BOT Rooms" or "myGames" can go here if you like */}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

const mapStateToProps = (state) => ({
  rpsbetitems: state.logic.rpsbetitems,
  qsbetitems: state.logic.qsbetitems,
  user_balance: state.auth.user.balance,
  user_id: state.auth.user._id,
  user_range: state.auth.user.range,
  myGames: state.logic.myGames,
  solPrice: state.logic.solPrice,
  totalWagered: state.auth.user.totalWagered,
});

const mapDispatchToProps = {
  getRpsBetItems,
  getQsBetItems,
  updateQbot,
  getQbot,
  getUser,
  getMyGames,
  setFocused,
  updateBetRangeFunction
};

export default connect(mapStateToProps, mapDispatchToProps)(BetArray);