import React, { useState, useRef, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
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
  qsbetitems,
  updateQbot,
  playSound,
  getQbot,
  creator_id,
  solPrice,
  totalWagered,
  user_balance,
  user_id,
  prompt,
  updateBetRangeFunction,
  predictedBetAmount,
  updateUserStrategy,
  updateUserPrompt,
  getUser,
  betting,
  handleSwitchChange,
  updateAttachment,
  detachPlayerFromRoom,
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
  const [aiOn, setAiOn] = useState(false);
  const [alignment, setAlignment] = useState('IS');

  // If the user has a rank from outside, else we compute
  const [rank, setRank] = useState(null);

  // Show/hide advanced panel
  const [showMore, setShowMore] = useState(false);

  const isDisabled = isSliderDisabled || betting || aiOn;
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
  // Make sure fetchAttachedRooms returns the rooms
  const fetchAttachedRooms = useCallback(async () => {
    try {
      if (getAttachedRooms) {
        const rooms = await getAttachedRooms();
        if (isMounted.current) {
          setAttachedRooms(rooms);
        }
        return rooms; // Return rooms for further checking
      }
    } catch (error) {
      console.error('Error fetching attached rooms:', error);
    }
  }, [getAttachedRooms]);

  // 1) On mount, fetch rank, Q-BOT status, and attached rooms
  useEffect(() => {
    isMounted.current = true;
    (async () => {
      try {
        // Compute or set the external rank
        if (!externalRank) {
          const computedRank = await getRank(totalWagered);
          setRank(computedRank);
        } else {
          setRank(externalRank);
        }

        // Proceed if we have a valid user_id
        if (user_id) {
          // Get Q-BOT status
          const qbotStatus = await getQbot();

          const rooms = await fetchAttachedRooms();

          // Check if any of the attached rooms match the current room_id
          let isAttached = false;
          if (rooms && rooms.length > 0) {
            isAttached = rooms.some(roomItem => roomItem.room === room_id);
          }

          // Set AI mode and alignment based on whether the user is attached in this room
          if (isAttached) {
            setAiOn(true);
            setAlignment('RA');
          } else if (qbotStatus) {
            setAiOn(true);
            setAlignment('EL');
          } else {
            // Default case if neither condition applies
            setAiOn(false);
            setAlignment('IS');
          }
        }
      } catch (err) {
        console.error('Error in BetArray mount:', err);
      }
    })();
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      isMounted.current = false;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [externalRank, user_id, totalWagered, getQbot, fetchAttachedRooms, room_id]);


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
    if (aiOn) {
      await detachPlayerFromRoom(room_id);
      setAiOn(false);
    } else if (!aiOn) {
      await updateAttachment(room_id);
      setAiOn(true);
    }
    await fetchAttachedRooms();
  };

  // AI on/off main switch
  const handleAiSwitch = useCallback((event) => {
    const newChecked = event.target.checked;
    if (newChecked) {
      playSound('start');
  } else {
      playSound('stop');
  }
    setAiOn(newChecked);
      if (alignment === 'RA') {
        handleSwitchChangeWithFetch();
      } else if (alignment === 'EL') {
        updateQbot(user_id, newChecked);
      } else {
        handleSwitchChange();
      }
  }, [
    alignment,
    attached,
    handleSwitchChangeWithFetch,
    handleSwitchChange,
    user_id,
    updateQbot
  ]);

  // The 3-state toggle
  const handleAlignmentChange = useCallback((event, newVal) => {
    if (!newVal) return; // ignore if user tries to unselect
    setAlignment(newVal);

  }, [aiOn]);

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
    <Box sx={{ position: 'relative', width: '100%', mt: 4, }}>
          <BetAmountInput
                bet_amount={bet_amount}
                handle2xButtonClick={handle2xButtonClick}
                handleHalfXButtonClick={handleHalfXButtonClick}
                handleMaxButtonClick={handleMaxButtonClick}
                onChangeState={onChangeState}
                isDarkMode={isDarkMode}
                bankroll={bankroll}
              />

    </Box>
  );
}

const mapStateToProps = (state) => ({
  rpsbetitems: state.logic.rpsbetitems,
  qsbetitems: state.logic.qsbetitems,
  user_balance: state.auth.user.balance,
  user_id: state.auth.user._id,
  prompt: state.auth.user.prompt,
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