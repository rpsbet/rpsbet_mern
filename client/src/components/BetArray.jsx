import React, { useState, useRef, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { getRpsBetItems, getQsBetItems, updateRpsBetItems, updateQsBetItems, getQbot, updateQbot } from '../redux/Logic/logic.actions';
import { setFocused } from '../redux/Auth/user.actions';
import { useDispatch } from 'react-redux';
import { Info } from '@material-ui/icons';
import {
  Button,
  Tabs,
  Tab,
  Grid,
  createTheme,
  ThemeProvider,
  FormControlLabel,
  Tooltip,
  Switch,
  makeStyles,
  Typography,
  IconButton,
  Modal,
  TextField,
  Slider,
  Table, TableHead, TableBody, TableRow, TableCell
} from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOn, faBrain, faChartLine, faInfoCircle, faCrown, faBan, faClock, faRobot, faCoins, faToggleOff, faBalanceScale, faLink, faUnlink } from '@fortawesome/free-solid-svg-icons';
import { convertToCurrency } from '../util/conversion';
import { getRank } from '../util/getRank.js';
import ApexChart from "react-apexcharts";
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import TableChartOutlinedIcon from '@material-ui/icons/TableChartOutlined';
import TuneOutlinedIcon from '@material-ui/icons/TuneOutlined';
import MeetingRoomOutlinedIcon from '@material-ui/icons/MeetingRoomOutlined';
import EditIcon from '@material-ui/icons/Edit';
import Lottie from 'react-lottie';
import animationData from '../game_panel/LottieAnimations/spinningIcon.json';
import { alertModal } from '../game_panel/modal/ConfirmAlerts';
import SettingsRef from './SettingsRef';
import { FaMoneyBillWave } from 'react-icons/fa';

const theme = createTheme({
  overrides: {
    MuiTabs: {
      indicator: {
        backgroundColor: '#ff0000'
      }
    }
  }
});
const useStyles = makeStyles((theme) => ({
  table: {
    width: '100%',
    tableLayout: 'fixed',
  },
  tableHeader: {
    color: '#FFFFFF',
    fontWeight: '800',
    margin: '20px'
  },
  tableRow: {
    '&:nth-of-type(odd)': {
      background: '#e5e5e5',
    },
    '&:hover': {
      background: '#f9f9f9',
    },

  },
  noDataMsg: {
    textAlign: 'center',
    padding: theme.spacing(2),
    color: '#777',
  },
  tableContainer: {
    maxHeight: 200,
    overflowY: 'auto',
  },
  redTooltip: {
    backgroundColor: 'red',
    color: 'white',
    fontSize: '1em',
    padding: 8
  },
  slider: {
    color: 'red',
    height: 8,
    '& .MuiSlider-thumb': {
      backgroundColor: 'red',
      border: '2px solid red',
      height: 24,
      width: 24,
      '&:focus, &:hover, &:active': {
        boxShadow: '0 0 0 8px rgba(255, 0, 0, 0.16)',
      },
    },
    '& .MuiSlider-track': {
      height: 8,
    },
    '& .MuiSlider-rail': {
      height: 8,
    },
  },
}));

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

const SideTabs = ({ selectedTab, handleTabChange }) => (
  <Tabs
    orientation="vertical"
    value={selectedTab}
    onChange={handleTabChange}
    className={`side-tab-switcher`}
  >
    <Tab icon={<TuneOutlinedIcon />} />
    <Tab icon={<TableChartOutlinedIcon />} />
    <Tab icon={<MeetingRoomOutlinedIcon />} />
  </Tabs>
);


const PlaceholderComponent = ({ selectedTab, handleTabChange, getQbot, ownRoom, user_id, totalWagered, game_type }) => {
  const [betting, setBetting] = useState(false);
  const [rank, setRank] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [timerValue, setTimerValue] = useState(2000);
  

  // useEffect(() => {
  //   const fetchRank = async () => {
  //     const userRank = await getRank(totalWagered);
  //     setRank(userRank);
  //   };
  //   fetchRank();
  // }, [totalWagered]);

  // useEffect(() => {
  //   const fetchQbotStatus = async () => {
  //     try {
  //       const qbotStatus = await getQbot(user_id);

  //       setIsActive(qbotStatus.isActive);
  //       setBetting(qbotStatus.isActive);
  //     } catch (err) {
  //       console.error('Error fetching Q-bot status', err);
  //     }
  //   };
  //   fetchQbotStatus();
  // }, [user_id]);

  const handleSwitchChange = async (event) => {
    const newBettingStatus = event.target.checked;
    setBetting(newBettingStatus);
    try {
      await updateQbot(user_id, newBettingStatus);
      setIsActive(newBettingStatus);
    } catch (err) {
      console.error('Error updating Q-bot status', err);
      setBetting(isActive); // Revert betting state in case of failure
    }
  };

  const getTextForTab = () => {
    if (ownRoom) {
      return "No AI available for your own room.";
    }

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', borderRadius: '0.4em', boxShadow: 'inset 0 0 6px #c0c0c0', padding: '10px 20px' }}>
          <h6 style={{ margin: '0px 8px 0px 0px', color: '#060607' }}>
            <FontAwesomeIcon icon={faRobot} style={{ color: '#060607' }} />&nbsp;
            Q-BOT <span style={{ background: "linear-gradient(45deg, #fc00ff, #ff0000)", padding: "0px 10px", color: "#fff", borderRadius: "0.3em" }}>BETA</span>
          </h6>
          <Tooltip title="Utilize leveraging with Q-Bot which plays autonomously for you (manages games for you, including game creation, changing strategies and joining) based on your wins and behaviour." arrow>
            <IconButton size="small">
              <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#060607' }} />
            </IconButton>
          </Tooltip>
        </div>

        {rank >= 20 ? (
          <div style={{ display: "inline-flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "50%", padding: "10px" }}>
            <Tooltip title="TOGGLE AI PLAY BETTING">
              <Switch
                id="aiplay-switch"
                checked={betting}
                onChange={handleSwitchChange}
              />
            </Tooltip>

            {betting ? (
              <div id="stop">
                <Lottie options={{ /* Lottie animation options */ }} width={32} />
              </div>
            ) : (
              <div>{timerValue !== 2000 ? <span>{(timerValue / 2000).toFixed(2)}s</span> : null}</div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', width: "50%", boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8", borderRadius: "9px", justifyContent: "center", padding: "5px 10px", overflow: "hidden" }}>
              <FontAwesomeIcon icon={betting ? faToggleOn : faToggleOff} style={{ marginRight: '5px' }} />
              {betting ? 'AIP ON' : 'AIP OFF'}
            </div>
          </div>
        ) : (
          <Button
            variant="contained"
            color="primary"
            startIcon={<FontAwesomeIcon icon={faCrown} />}
            style={{ background: 'linear-gradient(340deg, #ffb000, #ff5100c7)', color: '#fff', textTransform: 'none', fontSize: '16px' }}
          >
            UNLOCK AT LEVEL 20
          </Button>
        )}
      </div>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <div style={{ position: 'relative' }}>
        <SideTabs selectedTab={selectedTab} handleTabChange={handleTabChange} />
        <div
          className="gamified-container"
          style={{ minHeight: '150px', padding: '20px', display: "flex", justifyContent: "center", alignItems: "center" }} // Adding minHeight and optional padding
        >
          {getTextForTab()}
        </div>
      </div>
    </ThemeProvider>
  );
};


function BetArray({
  rpsbetitems,
  getRpsBetItems,
  updateRpsBetItems,
  qsbetitems,
  getQsBetItems,
  updateQsBetItems,
  predictedBetAmount,
  updateUserStrategy,
  betting,
  handleSwitchChange,
  handleDetachAttachChange,
  isDarkMode,
  attached,
  qs_game_type,
  ai_mode,
  user_balance,
  rank,
  creator_id,
  getAttachedRooms,
  is_betting,
  user_id,
  room_id,
  user,
  strategies,
  game_type,
  getQbot,
  totalWagered,
}) {
  const dispatch = useDispatch();

  const [settings_panel_opened, setSettingsPanelOpened] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [timerValue, setTimerValue] = useState(2000);
  const [selectedCell, setSelectedCell] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [editedValue, setEditedValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(ai_mode);
  const [modalTitle, setModalTitle] = useState('');
  const [range, setRange] = useState([1, 100]);
  const [isDragging, setIsDragging] = useState(false);
  const [debounceTimeoutId, setDebounceTimeoutId] = useState(null);
  const [isSliderDisabled, setIsSliderDisabled] = useState(false);
  const [text, setText] = useState('');
  const [attachedRooms, setAttachedRooms] = useState([]);

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
    setText(<>New range detected: {convertToCurrency(newValue)}</>);
    setRange(newValue);
    setIsDragging(true);

    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId);
    }
  };

  const handleSliderChangeCommitted = (event, newValue) => {
    setText(<>Attempting to update range...</>);
    setIsDragging(false);
    debouncedHandleRangeChange(event, newValue);
  };

  const debouncedHandleRangeChange = debounce(async (event, newValue) => {
    if (!isDragging) {
      setIsSliderDisabled(true);
      await handleRangeChange(event, newValue);
      setIsSliderDisabled(false);
    }
  }, 3000);


  const handleRangeChange = async (event, newValue) => {
    let [newMin, newMax] = newValue;
    newMin = Math.max(1, newMin);
    newMax = Math.min(user_balance, newMax);

    const itemsToUpdate = game_type === 'Quick Shoot' ? qsbetitems : rpsbetitems;
    const updateFunction = game_type === 'Quick Shoot' ? updateQsBetItems : updateRpsBetItems;
    const uniqueBetAmounts = [...new Set(itemsToUpdate.map(item => item.bet_amount))];

    if (uniqueBetAmounts.length === 1) {
      const uniqueValue = uniqueBetAmounts[0];
      if (uniqueValue !== newMin) {
        const itemToUpdate = itemsToUpdate.find(item => item.bet_amount === uniqueValue);
        setText(<>Updating item(s) with new min: {convertToCurrency(newMin)}, please wait...</>);
        await updateFunction(itemToUpdate._id, 'bet_amount', newMin);
      }
      if (uniqueValue !== newMax) {
        const itemToUpdate = itemsToUpdate.find(item => item.bet_amount === uniqueValue);
        setText(<>Updating item(s) with new max: {convertToCurrency(newMax)}, please wait...</>);
        await updateFunction(itemToUpdate._id, 'bet_amount', newMax);
      }
    } else {
      // Update items for new min value
      const currentMin = Math.min(...uniqueBetAmounts);
      if (newMin < currentMin) {
        const itemToUpdate = itemsToUpdate.find(item => item.bet_amount === currentMin);
        setText(<>Updating item(s) with new min: {convertToCurrency(newMin)}, please wait...</>);
        await updateFunction(itemToUpdate._id, 'bet_amount', newMin);
      } else {
        for (const item of itemsToUpdate) {
          if (item.bet_amount < newMin) {
            setText(<>Updating item(s) with new min: {convertToCurrency(newMin)}, please wait...</>);
            await updateFunction(item._id, 'bet_amount', newMin);
          }
        }
      }

      const currentMax = Math.max(...uniqueBetAmounts);
      if (newMax > currentMax) {
        const itemToUpdate = itemsToUpdate.find(item => item.bet_amount === currentMax);
        setText(<>Updating item(s) with new max: {convertToCurrency(newMax)}, please wait...</>);
        await updateFunction(itemToUpdate._id, 'bet_amount', newMax);
      } else {
        for (const item of itemsToUpdate) {
          if (item.bet_amount > newMax) {
            setText(<>Updating item(s) with new max: {convertToCurrency(newMax)}, please wait...</>);
            await updateFunction(item._id, 'bet_amount', newMax);
          }
        }
      }
    }

    if (game_type === 'Quick Shoot') {
      await getQsBetItems(room_id);
    } else {
      await getRpsBetItems(room_id);
    }
    setText('');
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

  const classes = useStyles();
  const prevIsBettingRef = useRef(is_betting);
  useEffect(() => {
    if (prevIsBettingRef.current && !is_betting) {
      getQsBetItems(room_id);
      getRpsBetItems(room_id);
    }
    prevIsBettingRef.current = is_betting;
  }, [is_betting, getRpsBetItems, getQsBetItems, room_id]);

  const [accumulativeProfit, setAccumulativeProfit] = useState([]);
  const getMinMaxValues = (items) => {
    if (items.length === 0) return [1, 100];
    const amounts = items.map(item => item.bet_amount);
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    return [min, max];
  };

  const fetchAttachedRooms = useCallback(async () => {
    try {
      if (getAttachedRooms) {
        const rooms = await getAttachedRooms();
        setAttachedRooms(rooms);
      }
    } catch (error) {
      console.error('Error fetching attached rooms:', error);
    }
  }, [getAttachedRooms]);

  useEffect(() => {
    fetchAttachedRooms();
  }, [fetchAttachedRooms]);

  const handleSwitchChangeWithFetch = async (event) => {
    await handleDetachAttachChange(event);
    setTimeout(async () => {
      await fetchAttachedRooms();
    }, 1500);
  };


  useEffect(() => {

    if (game_type === 'Quick Shoot') {
      const [min, max] = getMinMaxValues(qsbetitems);
      setRange([min, max]);
    } else if (game_type === 'RPS') {
      const [min, max] = getMinMaxValues(rpsbetitems);
      setRange([min, max]);
    }
  }, [room_id, game_type, qsbetitems, rpsbetitems]);

  useEffect(() => {
    let profit = 0;
    const reversedItems = [...(game_type === 'Quick Shoot' ? qsbetitems : rpsbetitems)].reverse();

    const calculatedProfit = reversedItems.map(item => {
      let profitChange = 0;

      if (game_type === 'RPS') {
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


  const chartData = {
    options: {
      chart: {
        animations: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        events: {},
        zoom: {
          enabled: false
        }
      },
      grid: {
        show: false
      },
      tooltip: {
        enabled: false
      },
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
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        labels: {
          show: false
        },
        axisTicks: {
          show: false
        },
        axisBorder: {
          show: false
        }
      },
      yaxis: {
        labels: {
          show: false
        },
        axisTicks: {
          show: false
        },
        axisBorder: {
          show: false
        }
      }
    },
    series: [{
      name: 'Accumulative Profit',
      data: accumulativeProfit,
    }],
  };

  const filteredArray = game_type === 'Quick Shoot' ? qsbetitems : rpsbetitems;
  const settingsRef = useRef(null);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleCellClick = (item, index, cell) => {
    setSelectedCell(cell);
    setEditedValue(item[cell]);
    setSelectedIndex(index);
    setSelectedRow(item);
    setOpenModal(true);
    dispatch(setFocused(true));
    switch (cell) {
      case 'bet_amount':
        setModalTitle('EDIT BET AMOUNT');
        break;
      case 'qs':
        setModalTitle('EDIT HOST\'S CHOICE');
        break;
      case 'rps':
        setModalTitle('EDIT HOST\'S CHOICE');
        break;
      default:
        setModalTitle('EDIT YOUR CHOICE');
        break;
    }
  };


  const handleCloseModal = () => {
    setOpenModal(false);
    dispatch(setFocused(false));
  };

  const handleUpdateCellData = async (isDarkMode) => {

    try {
      if (game_type === 'RPS') {
        await updateRpsBetItems(selectedRow._id, selectedCell, editedValue);
      } else if (game_type === 'Quick Shoot') {
        await updateQsBetItems(selectedRow._id, selectedCell, editedValue);

      }
    } catch (err) {
      console.error('Failed to update RpsBetItems:', err.message);
    }

    setOpenModal(false);
  };

  const formatProfit = (profit) => {
    if (profit > 0) {
      return <span style={{ padding: "0 5px", fontSize: "0.75em", background: "#28a74522", borderRadius: "30px", border: "2px solid #28a745", color: '#28a745' }}>+{convertToCurrency(profit)}</span>;
    } else if (profit < 0) {
      return <span style={{ padding: "0 5px", fontSize: "0.75em", background: "#ff000022", borderRadius: "30px", border: "2px solid #ff0000", color: '#ff0000' }}>-{convertToCurrency(Math.abs(profit))}</span>;
    } else {
      return <span>{convertToCurrency(profit)}</span>;
    }
  };
  const formatTag = (tag) => {
    return <span style={{ padding: "0 5px", fontSize: "0.75em", background: "#007bff22", borderRadius: "30px", border: "2px solid #007bff45", color: '#007bff' }}>{tag}</span>;
  }

  const handleSettingsIconClick = () => {
    setSettingsPanelOpened(!settings_panel_opened);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsPanelOpened(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsRef]);

  if (
    typeof betting === 'undefined' ||
    typeof handleSwitchChange === 'undefined' ||
    typeof room_id === 'undefined'
  ) {
    return (
      <PlaceholderComponent
        handleSettingsIconClick={handleSettingsIconClick}
        handleTabChange={handleTabChange}
        selectedTab={selectedTab}
        ownRoom={false}
        user_id={user_id}
        totalWagered={totalWagered}
        settingsRef={settingsRef}
        getQbot={getQbot}
        settings_panel_opened={settings_panel_opened}
      />
    );
  } else if (creator_id === user_id && typeof room_id !== 'undefined') {
    return (
      <PlaceholderComponent
        handleSettingsIconClick={handleSettingsIconClick}
        handleTabChange={handleTabChange}
        selectedTab={selectedTab}
        ownRoom={true}
        settingsRef={settingsRef}
        totalWagered={totalWagered}
        getQbot={getQbot}
        user_id={user_id}
        settings_panel_opened={settings_panel_opened}
      />
    );
  }
  return (
    <ThemeProvider theme={theme}>
      <div style={{ position: 'relative' }}>
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

        <SideTabs selectedTab={selectedTab} handleTabChange={handleTabChange} />
        {selectedTab === 0 && (
          <>

            <div className="gamified-container">
              {((game_type === 'Roll' || game_type === 'Blackjack' || game_type === 'Bang!') &&
                <div style={{ height: "80px", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center" }} className="coming-soon-text"><h4>Coming soon!</h4></div>

              )}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "100%" }} >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: betting ? (is_betting ? "#28a745" : "#007bff") : "#ff0000",
                  marginBottom: "20px",
                  background: betting ? (is_betting ? "#0ef34233" : "#007bff33") : "#ff000033",
                  width: "100%",
                  boxShadow: betting ? (is_betting ? "#28a745 0px 0px 6px 0px inset" : "#007bff 0px 0px 6px 0px inset") : "#ff0000 0px 0px 6px 0px inset",
                  borderRadius: "9px",
                  justifyContent: "center",
                  padding: "5px 10px",
                  overflow: "hidden"
                }}>
                  {betting ? (is_betting ? (
                    <>
                      <FontAwesomeIcon icon={faBrain} style={{ marginRight: '5px' }} />
                      THINKING...
                    </>
                  ) : (
                    <>
                      {predictedBetAmount > 0 ? (
                        <>
                          <FontAwesomeIcon icon={faCoins} style={{ marginRight: '5px' }} />
                          TRIED&nbsp;{convertToCurrency(predictedBetAmount)}
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faClock} style={{ marginRight: '5px' }} />
                          ANALYSING LAST BETS
                        </>
                      )}
                    </>
                  )) : (<>
                    <FontAwesomeIcon icon={faBan} style={{ marginRight: '5px' }} />
                    OFF
                  </>
                  )}
                </div>


                <div style={{ display: "flex", width: "100%", justifyContent: "center" }}>
                  <div style={{ display: "inline-flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "50%", padding: "10px" }}>
                    <Tooltip title="TOGGLE AI PLAY BETTING">
                      <Switch
                        id="aiplay-switch"
                        checked={betting}
                        onChange={handleSwitchChange}
                        disabled={game_type === 'Roll' || game_type === 'Blackjack' || game_type === 'Bang!'}
                      />
                    </Tooltip>
                    {betting ? (
                      <div id="stop">
                        <Lottie options={defaultOptions} width={32} />
                      </div>
                    ) : (
                      <div>
                        {timerValue !== 2000 ? (
                          <span>{(timerValue / 2000).toFixed(2)}s</span>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', width: "50%", boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8", borderRadius: "9px", justifyContent: "center", padding: "5px 10px", overflow: "hidden" }}>
                    <FontAwesomeIcon icon={betting ? faToggleOn : faToggleOff} style={{ marginRight: '5px' }} />
                    {betting ? 'AIP ON' : 'AIP OFF'}
                  </div>
                </div>

                <div style={{ display: "flex", width: "100%", justifyContent: "center", marginTop: "10px" }}>
                  <div style={{ display: "inline-flex", flexDirection: "row", alignItems: "center", justifyContent: "center", width: "50%", padding: "10px" }}>
                    <Tooltip title="TOGGLE DETACH/ATTACH">
                      <Switch
                        id="detach-attach-switch"
                        checked={attached ? true : false}
                        onChange={handleSwitchChangeWithFetch}
                        disabled={!betting} // Disabled if the top switch is off
                      />
                    </Tooltip>
                    <Tooltip title="Betting will be slow, whilst active. Best used whilst AFK">
                      <Info style={{ width: "18px", marginTop: "-3px", cursor: "pointer" }} />
                    </Tooltip>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', width: "50%", boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8", borderRadius: "9px", justifyContent: "center", padding: "5px 10px", overflow: "hidden" }}>

                    <FontAwesomeIcon icon={attached ? faLink : faUnlink} style={{ marginLeft: '10px', marginRight: '5px' }} />
                    {attached ? 'DETACH' : 'ATTACH'}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "10px" }}>
                  <div style={{ display: "inline-flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "50%", padding: "10px" }}>
                    <div>

                      <Tooltip title="CHANGE AI PLAY STRATEGY">
                        <IconButton
                          id="btn-rps-settings"
                          style={{ borderRadius: "200px" }}
                          onClick={handleSettingsIconClick}
                        >
                          <span style={{ fontSize: "0.5em" }}>EDIT</span><SettingsOutlinedIcon
                          />
                        </IconButton>
                      </Tooltip>
                    </div>

                  </div>

                  <div style={{ display: "inline-flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "50%", padding: "10px 0" }}>
                    <div style={{ width: "100%", }}>
                      <p style={{ width: "100%", textAlign: "center", boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8", borderRadius: "9px", padding: "5px 10px", overflow: "hidden" }}>
                        <span><FontAwesomeIcon icon={faRobot} />&nbsp;{selectedStrategy ? selectedStrategy : ai_mode}</span>
                      </p>
                    </div>

                  </div>
                </div>

                <div style={{
                  pointerEvents: selectedStrategy === "Martingale" || selectedStrategy === "Sniper" ? "none" : "auto",
                  filter: selectedStrategy === "Martingale" ? "grayscale(100%)" : "none",
                  opacity: selectedStrategy === "Martingale" ? "0.3" : "1", display: 'flex', alignItems: 'center', width: "100%", boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8", borderRadius: "9px", justifyContent: "center", padding: "5px 10px", overflow: "hidden"
                }}>
                  <FontAwesomeIcon icon={faBalanceScale} style={{ marginRight: '5px' }} />
                  <Typography>ADJUST BET RANGE</Typography>
                </div>
                <div style={{
                  pointerEvents: selectedStrategy === "Martingale" ? "none" : "auto",
                  filter: selectedStrategy === "Martingale" ? "grayscale(100%)" : "none",
                  opacity: selectedStrategy === "Martingale" ? "0.3" : "1", display: "flex", padding: '0 10px', flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: "10px"
                }}>
                  <Typography><span style={{ fontSize: "xx-small" }}>Min:</span> {convertToCurrency(range[0])}</Typography>
                  <Typography><span style={{ fontSize: "xx-small" }}>Max:</span> {convertToCurrency(range[1])}</Typography>
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: '0 10px',
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    marginTop: "10px",
                    pointerEvents: selectedStrategy === "Martingale" ? "none" : "auto",
                    filter: selectedStrategy === "Martingale" ? "grayscale(100%)" : "none",
                    opacity: selectedStrategy === "Martingale" ? "0.3" : "1"
                  }}
                >
                  <Tooltip
                    style={{ width: "100%" }}
                    title={selectedStrategy === "Martingale" ? `NO BET RANGE FOR ${selectedStrategy}` : <>MIN & MAX BET VALUES</>}
                    classes={{ tooltip: classes.redTooltip }}
                  >
                    <Slider
                      value={range}
                      onChange={handleSliderChange}
                      onChangeCommitted={handleSliderChangeCommitted}
                      onMouseUp={handleMouseUp}
                      onTouchEnd={handleTouchEnd}
                      valueLabelDisplay="auto"
                      step={0.1}
                      min={1}
                      max={user_balance}
                      aria-labelledby="range-slider"
                      className={classes.slider}
                      disabled={isSliderDisabled}
                      style={{
                        pointerEvents: ai_mode === "IMartingale" ? "none" : "auto",
                        filter: ai_mode === "IMartingale" ? "grayscale(100%)" : "none"
                      }}
                    />
                  </Tooltip>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: "100%",
                      boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8",
                      borderRadius: "9px",
                      justifyContent: "center",
                      padding: "5px 10px",
                      overflow: "hidden",
                      pointerEvents: ai_mode === "IMartingale" ? "none" : "auto",
                      filter: ai_mode === "IMartingale" ? "grayscale(100%)" : "none"
                    }}
                  >
                    <span style={{ fontSize: "x-small", color: "#ff0000" }}>
                      {text}
                    </span>
                  </div>
                </div>
                {/* <div style={{
                  pointerEvents: selectedStrategy === "Martingale" || selectedStrategy === "Sniper" ? "none" : "auto",
                  display: 'flex', alignItems: 'center', width: "100%", boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8",
                  borderRadius: "9px", justifyContent: "center", padding: "5px 10px", overflow: "hidden"
                }}>
                  <FontAwesomeIcon icon={faChartLine} style={{ marginRight: '5px' }} />
                  <Typography>ADJUST STOP / LOSS</Typography>
                </div>
                <div style={{
                  display: "flex", padding: '0 10px', flexDirection: "row", alignItems: "center",
                  justifyContent: "space-between", width: "100%", marginTop: "10px"
                }}>
                  <Typography><span style={{ fontSize: "xx-small" }}>Min:</span> {convertToCurrency(range[0])}</Typography>
                  <Typography><span style={{ fontSize: "xx-small" }}>Max:</span> {convertToCurrency(range[1])}</Typography>
                </div>
                <div
                  style={{
                    display: "flex",
                    padding: '0 10px',
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    marginTop: "10px",

                  }}
                >
                  <Tooltip
                    style={{ width: "100%" }}
                    title={<>MIN & MAX BET VALUES</>}
                    classes={{ tooltip: classes.redTooltip }}
                  >
                    <Slider
                      value={range}
                      onChange={handleSliderChange}
                      onChangeCommitted={handleSliderChangeCommitted}
                      onMouseUp={handleMouseUp}
                      onTouchEnd={handleTouchEnd}
                      valueLabelDisplay="auto"
                      step={0.1}
                      min={1}
                      max={user_balance}
                      aria-labelledby="range-slider"
                      className={classes.slider}

                    />
                  </Tooltip>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: "100%",
                      boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8",
                      borderRadius: "9px",
                      justifyContent: "center",
                      padding: "5px 10px",
                      overflow: "hidden",
                    }}
                  >
                    <span style={{ fontSize: "x-small", color: "#ff0000" }}>
                      {text}
                    </span>
                  </div>
                </div> */}
              </div>
            </div>
          </>

        )}
        {selectedTab === 1 && (
          <>
            <div className="gamified-container">
              <Grid item>
                <h2 className="gamified-heading">Training Data&nbsp;
                  <Tooltip title="This data may not represent your recent transactions and is for the AI purposes only.">
                    <Info style={{ width: "18px", marginTop: "-3px", cursor: "pointer" }} />
                  </Tooltip>
                </h2>
                <div style={{ position: "absolute", zIndex: '2', top: '180px', right: '30px' }}>
                  {formatTag('Last 50 Games')} &nbsp;
                  <Tooltip title={`${accumulativeProfit[accumulativeProfit.length - 1]} RPS`}>
                    {formatProfit(accumulativeProfit[accumulativeProfit.length - 1])}
                  </Tooltip>
                </div>

                <ApexChart
                  options={chartData.options}
                  series={chartData.series}
                  type="line"
                  height={180}
                />

                <div className="gamified-content">
                  {filteredArray.length > 0 ? (
                    <>
                      <Table>
                        <TableHead>
                          <TableRow className={classes.tableHeader}>
                            <TableCell>BET</TableCell>
                            <TableCell>{'HOST'}</TableCell>
                            <TableCell>{'YOU'}</TableCell>
                          </TableRow>
                        </TableHead>
                      </Table>
                      <div className={classes.tableContainer}>
                        <Table className={classes.table}>
                          <TableBody>
                            {filteredArray.map((item, index) => (
                              <TableRow
                                key={index}
                                className={classes.tableRow}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                              >
                                <TableCell
                                  onClick={() => handleCellClick(item, index, 'bet_amount')}
                                  className={classes.cell}>
                                  <div className={classes.cellContent}>
                                    {convertToCurrency(item.bet_amount)}
                                    {hoveredIndex === index && (
                                      <IconButton className={classes.editIcon} size="small">
                                        <EditIcon />
                                      </IconButton>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell
                                  onClick={() => handleCellClick(item, index, game_type === 'Quick Shoot' ? 'qs' : 'rps')}
                                  className={classes.cell}>
                                  <div className={classes.cellContent}>
                                    {game_type === 'Quick Shoot' ? item.qs : item.rps}
                                    {hoveredIndex === index && (
                                      <IconButton className={classes.editIcon} size="small">
                                        <EditIcon />
                                      </IconButton>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell
                                  onClick={() => handleCellClick(item, index, game_type === 'Quick Shoot' ? 'joiner_qs' : 'joiner_rps')}
                                  className={classes.cell}>
                                  <div className={classes.cellContent}>
                                    {game_type === 'Quick Shoot' ? item.joiner_qs : item.joiner_rps}
                                    {hoveredIndex === index && (
                                      <IconButton className={classes.editIcon} size="small">
                                        <EditIcon />
                                      </IconButton>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <Typography variant="body1" className={classes.noDataMsg}>
                      Play normally to train the AP
                    </Typography>
                  )}

                  <Modal open={openModal} onClose={handleCloseModal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className={classes.modalContainer}>
                      <div className={classes.modal} style={{ background: '#f0f0f0', padding: '20px', borderRadius: '5px' }}>
                        <Typography variant="h6" gutterBottom>{modalTitle}</Typography>
                        <TextField
                          label="EDIT VALUE"
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)}
                        />
                        <Button variant="contained" color="primary" onClick={() => { handleUpdateCellData(isDarkMode) }}>Update</Button>
                      </div>
                    </div>
                  </Modal>
                </div>
              </Grid>
            </div>
          </>
        )}
        {selectedTab === 2 && (
          <>
            <div className="gamified-container">
              <Grid item>
                <h2 className="gamified-heading">Attached Rooms&nbsp;
                  <Tooltip title="This data may not represent your recent transactions and is for the AI purposes only.">
                    <Info style={{ width: "18px", marginTop: "-3px", cursor: "pointer" }} />
                  </Tooltip>
                </h2>
                <div style={{ position: "absolute", zIndex: '2', top: '180px', right: '30px' }}>

                </div>



                <div className="gamified-content">
                  <Table aria-label="rooms table">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">Room</TableCell>
                        <TableCell align="center">Range</TableCell>
                        <TableCell align="center">Strategy</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attachedRooms.length > 0 ? (
                        attachedRooms.map((room) => {
                          const betAmounts = room.bet_amounts;
                          const minBet = Math.min(...betAmounts);
                          const maxBet = Math.max(...betAmounts);

                          return (
                            <TableRow key={room._id}>
                              <TableCell align="center">
                                <Typography><a style={{ color: '#333' }} href={`/join/${room._id}`}>{room.room_name}</a></Typography>
                              </TableCell>
                              <TableCell align="center">{<>{convertToCurrency(minBet)} - {convertToCurrency(maxBet)}</>}</TableCell>
                              <TableCell align="center">{room.selected_strategy}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No attached rooms available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  <Modal open={openModal} onClose={handleCloseModal} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className={classes.modalContainer}>
                      <div className={classes.modal} style={{ background: '#f0f0f0', padding: '20px', borderRadius: '5px' }}>
                        <Typography variant="h6" gutterBottom>{modalTitle}</Typography>
                        <TextField
                          label="EDIT VALUE"
                          value={editedValue}
                          onChange={(e) => setEditedValue(e.target.value)}
                        />
                        <Button variant="contained" color="primary" onClick={() => { handleUpdateCellData(isDarkMode) }}>Update</Button>
                      </div>
                    </div>
                  </Modal>
                </div>
              </Grid>
            </div>
          </>
        )}

      </div>
    </ThemeProvider>
  );
}


const mapStateToProps = (state) => ({
  rpsbetitems: state.logic.rpsbetitems,
  qsbetitems: state.logic.qsbetitems,
  user_balance: state.auth.user.balance,
  user_id: state.auth.user._id,
  totalWagered: state.auth.user.totalWagered,
});

const mapDispatchToProps = {
  getRpsBetItems,
  updateRpsBetItems,
  getQsBetItems,
  updateQsBetItems,
  getQbot,
  setFocused,
};

export default connect(mapStateToProps, mapDispatchToProps)(BetArray);
