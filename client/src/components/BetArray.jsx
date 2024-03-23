import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { getRpsBetItems } from '../redux/Logic/logic.actions';
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
  Slider,
  Table, TableHead, TableBody, TableRow, TableCell
} from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { convertToCurrency } from '../util/conversion';
import { faTrash, faToggleOn, faBrain, faBan, faClock, faRobot, faCoins, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import ApexChart from "react-apexcharts";
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import TableChartOutlinedIcon from '@material-ui/icons/TableChartOutlined';
import TuneOutlinedIcon from '@material-ui/icons/TuneOutlined';
import Lottie from 'react-lottie';
import animationData from '../game_panel/LottieAnimations/spinningIcon.json';
import { alertModal } from '../game_panel/modal/ConfirmAlerts';
import SettingsRef from './SettingsRef';

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
    // variant="fullWidth"
    value={selectedTab}
    onChange={handleTabChange}
    className={`side-tab-switcher`}
  >
    <Tab icon={<TuneOutlinedIcon />} />
    <Tab icon={<TableChartOutlinedIcon />} />
  </Tabs>
);



const PlaceholderComponent = ({
  selectedTab,
  handleTabChange,
  handleSettingsIconClick,
  settingsRef,
  settings_panel_opened
}) => (
  <ThemeProvider theme={theme}>
    <div style={{ position: 'relative' }}>

      <SideTabs selectedTab={selectedTab} handleTabChange={handleTabChange} />
      {selectedTab === 0 && (
        <div className="gamified-container">
          Join a room to use Autoplay!
        </div>
      )}
      {selectedTab === 1 && (
        <div className="gamified-container">
          Join a room to use Autoplay!
        </div>
      )}
    </div>
  </ThemeProvider>
);

function BetArray({
  arrayName,
  label,
  rpsbetitems,
  getRpsBetItems,
  predictedBetAmount,
  updateUserStrategy,
  betting,
  handleSwitchChange,
  isDarkMode,
  ai_mode,
  user_balance,
  rank,
  is_betting,
  user_id,
  room_id,
  strategies,
  game_type
}) {
  const [settings_panel_opened, setSettingsPanelOpened] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [timerValue, setTimerValue] = useState(2000);
  const [budget, setBudget] = useState(0.001);
  const [selectedStrategy, setSelectedStrategy] = useState(ai_mode);
  const classes = useStyles();
  const prevIsBettingRef = useRef(is_betting);

  useEffect(() => {
    // Check if is_betting has changed from true to false
    if (prevIsBettingRef.current && !is_betting) {
      // Trigger action when is_betting changes from true to false
      getRpsBetItems(room_id); // Assuming room_id is available here
    }
  
    // Update previous value of is_betting
    prevIsBettingRef.current = is_betting;
  }, [is_betting, getRpsBetItems, room_id]);

  const [accumulativeProfit, setAccumulativeProfit] = useState([]);

  // Calculate accumulative profit based on rules
  useEffect(() => {
    let profit = 0;
    const reversedItems = [...rpsbetitems].reverse(); // Reverse the items

    // Calculate profit for each bet
    const calculatedProfit = reversedItems.map(item => {
      let profitChange = 0;
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
      profit += profitChange;
      return profit;
    });

    setAccumulativeProfit(calculatedProfit);
  }, [rpsbetitems]);

  // Data for ApexChart
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


  const handleBudgetChange = (event, newValue) => {
    setBudget(newValue);
  };

  // const stored_bet_array = JSON.parse(localStorage.getItem(arrayName)) || [];


  const filteredArray = game_type === 'Quick Shoot' ? rpsbetitems.filter(item => item.qs !== undefined) : rpsbetitems;
  const settingsRef = useRef(null);
  const handleClearLocalStorage = () => {
    localStorage.removeItem(arrayName);
    window.location.reload();
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getPositionLetter = (position) => {
    switch (position) {
      case 0:
        return 'P';
      case 1:
        return 'q';
      case 2:
        return 'w';
      case 3:
        return 'e';
      case 4:
        return 'r';
      default:
        return '';
    }
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

  const handleTimerValueChange = newValue => {
    setTimerValue(newValue);
  };

  if (
    typeof betting === 'undefined' ||
    typeof handleSwitchChange === 'undefined' ||
    typeof room_id === 'undefined'
  ) {
    // alertModal(isDarkMode, "22");
    return (
      <PlaceholderComponent
        handleSettingsIconClick={handleSettingsIconClick}
        handleTabChange={handleTabChange}
        selectedTab={selectedTab}

        settingsRef={settingsRef}
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
                    <Tooltip title="TOGGLE AUTOPLAY BETTING">

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

                  <div style={{ display: 'flex', alignItems: 'center', width: "50%", boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8", borderRadius: "9px", justifyContent: "center", width: "50%", padding: "5px 10px", overflow: "hidden" }}>
                    <FontAwesomeIcon icon={betting ? faToggleOn : faToggleOff} style={{ marginRight: '5px' }} />
                    {betting ? 'AP ON' : 'AP OFF'}
                  </div>




                </div>

                <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "10px" }}>
                  <div style={{ display: "inline-flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "50%", padding: "10px" }}>

                    {/* <Slider
                      style={{ width: "60%" }}
                      value={budget}
                      onChange={handleBudgetChange}
                      disabled={!betting} // Disable the slider when betting is turned off
                      aria-labelledby="budget-slider"
                      min={0}
                      max={user_balance} // Set the maximum budget value dynamically
                      step={0.0001} // Adjust the step value as needed
                    /> */}

                    <div>
                      {/* <p>{convertToCurrency(budget)}</p> */}
                      {/* <Tooltip title="CHART">

                        <p style={{ border: "2px solid #ff0000", boxShadow: "0 2px 1px #f9f9f9", borderRadius: "6px", padding: "5px 10px", textShadow: "0 1px #f9f9f9", color: "#ff0000", textAlign: "center", fontSize: "small" , whiteSpace: "nowrap"}}>{convertToCurrency(predictedBetAmount)}</p>
                      </Tooltip> */}
                      {/* <Tooltip title="CHOSEN AUTOPLAY STRATEGY">

                        <p style={{ border: "2px solid #ff0000", boxShadow: "0 2px 1px #f9f9f9", borderRadius: "6px", padding: "5px 10px", textShadow: "0 1px #f9f9f9", color: "#ff0000", textAlign: "center", fontSize: "small" }}></p>
                      </Tooltip> */}
                      <Tooltip title="CHANGE AUTOPLAY STRATEGY">
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
                      {/* <p style={{ width: "100%", textAlign: "center", boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8", borderRadius: "9px", padding: "5px 10px", overflow: "hidden" }}>
                        <span><FontAwesomeIcon icon={faChartLine} />&nbsp;Chart</span>
                      </p> */}

                      <p style={{ width: "100%", textAlign: "center", boxShadow: "inset 0px 0px 6px 0px #b4b4b4a8", borderRadius: "9px", padding: "5px 10px", overflow: "hidden" }}>
                        <span><FontAwesomeIcon icon={faRobot} />&nbsp;{selectedStrategy ? selectedStrategy : ai_mode}</span>
                      </p>
                    </div>

                  </div>
                </div>




              </div>
            </div>

          </>

        )}
        {selectedTab === 1 && (
          <>
            <div className="gamified-container">
              <Grid item>
                <h2 className="gamified-heading">Training Data</h2>
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
                            <TableCell>HOST</TableCell>
                            <TableCell>YOU</TableCell>
                          </TableRow>
                        </TableHead>
                      </Table>
                      <div className={classes.tableContainer}>
                        <Table className={classes.table}>
                          <TableBody>
                            {filteredArray.map((item, index) => (
                              <TableRow key={index} className={classes.tableRow}>
                                <TableCell>{convertToCurrency(item.bet_amount)}</TableCell>
                                <TableCell>{item.rps}</TableCell>
                                <TableCell>{item.joiner_rps}</TableCell>
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
});

const mapDispatchToProps = {
  getRpsBetItems,
};

export default connect(mapStateToProps, mapDispatchToProps)(BetArray);
