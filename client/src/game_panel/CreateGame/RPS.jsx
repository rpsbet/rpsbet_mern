import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Tooltip, RadioGroup, IconButton, ButtonBase, Radio, FormControlLabel } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import styled from 'styled-components';
import { faTrash, faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import SettingsRef from '../../components/SettingsRef';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import { alertModal } from '../modal/ConfirmAlerts';
import { predictNext } from '../../util/predictNext';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import CoinInfo from './CoinInfo';
import GameSettingsPanel from './GameSettingsPanel';

const StyledRadioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px; /* Reduced gap for a subtle appearance */

  width: 100%;
  max-width: 800px;

  /* Adjust grid layout for smaller screens */
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    padding: 10px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr; /* Single column on mobile */
    gap: 8px;
  }
`;

const StyledProductCard = styled.a`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  border-radius: 0.3em;
  padding: 12px;
  width: 150px; /* Slightly smaller */
  text-align: center;
  text-decoration: none;
  color: ${({ isDarkMode }) => (isDarkMode ? '#ddd' : '#444')};
  box-shadow: none; /* No box-shadow for reduced prominence */
  transition: background 0.2s ease;


  span {
    margin-top: 8px;
    font-size: 0.9rem; /* Reduced font size */
    font-weight: 400; /* Regular font weight for subtlety */
    color: ${({ isDarkMode }) => (isDarkMode ? '#ddd' : '#444')};
  }

  @media (max-width: 768px) {
    width: 130px;
    padding: 10px;
  }

  @media (max-width: 480px) {
    width: 100%;
    padding: 8px;
  }
`;

const StyledProductImage = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-bottom: 6px; /* Reduced margin */
  opacity: 0.85; /* Lower opacity for a muted look */
`;

const calcWinChance = prevStates => {
  let total = prevStates.length;
  let rock = 0;
  let paper = 0;
  let scissors = 0;
  prevStates.map(el => {
    if (el.rps === 'R') {
      rock++;
    } else if (el.rps === 'P') {
      paper++;
    } else if (el.rps === 'S') {
      scissors++;
    }
  });

  const baseWinChance = (100 / 3).toFixed(2);
  const rockWinChance = parseFloat(baseWinChance);
  const paperWinChance = parseFloat(baseWinChance);
  const scissorsWinChance = parseFloat(baseWinChance);
  const freq = { rock, paper, scissors };
  const freqValues = Object.values(freq);
  const range = Math.max(...freqValues) - Math.min(...freqValues);
  const sensitivityFactor = (range / 100) * total;
  const adjustmentFactor = (range / total) * sensitivityFactor;

  const adjustedRockWinChance = (
    rockWinChance +
    rock * adjustmentFactor
  ).toFixed(2);
  const adjustedPaperWinChance = (
    paperWinChance +
    paper * adjustmentFactor
  ).toFixed(2);
  const adjustedScissorsWinChance = (
    scissorsWinChance +
    scissors * adjustmentFactor
  ).toFixed(2);

  const lowest = Math.min(
    adjustedRockWinChance,
    adjustedPaperWinChance,
    adjustedScissorsWinChance
  );
  const highest = Math.max(
    adjustedRockWinChance,
    adjustedPaperWinChance,
    adjustedScissorsWinChance
  );

  return `${lowest.toFixed(2)}% - ${highest.toFixed(2)}%`;
};

const calcEV = (calcWinChance, wager, winPayout, lossPayout, tiePayout) => {
  const winChance = calcWinChance;
  const lowest = winChance.split(' - ')[0].replace('%', '');
  const highest = winChance.split(' - ')[1].replace('%', '');
  const winProb = highest / 100;
  const loseProb = lowest / 100;
  const tieProb = 1 - winProb - loseProb;

  const EV =
    -1 *
    (winProb * winPayout + loseProb * lossPayout + tieProb * tiePayout - wager);
  return EV.toFixed(2);
};

class RPS extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_rps: '',
      bet_amount: this.props.bet_amount,
      winChance: 33,
      rps_list: [],
      selectedStrategy: this.props.selectedStrategy,
      settings_panel_opened: false,
      transitionMatrix: {
        R: { R: 0, P: 0, S: 0 },
        P: { R: 0, P: 0, S: 0 },
        S: { R: 0, P: 0, S: 0 }
      }
    };
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleReset = this.handleReset.bind(this);
    this.settingsRef = React.createRef();
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleSettingsIconClick = this.handleSettingsIconClick.bind(this);
  }

  async componentDidMount() {
    // const { acQueryMyItem } = this.props;
    // await acQueryMyItem(100, 1, 'price', '653ee81117c9f5ee2124564b');
    document.addEventListener('keydown', this.handleKeyPress);
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside = e => {
    if (
      this.settingsRef &&
      this.settingsRef.current &&
      !this.settingsRef.current.contains(e.target)
    ) {
      this.setState({ settings_panel_opened: false });
    }
  };

  handleKeyPress(event) {
    const { selected_roll } = this.state;
    const { isFocused } = this.props;
    if (!isFocused) {
      switch (event.key) {
        case 'r':
          this.onAddRun('R');
          break;
        case 'p':
          this.onAddRun('P');
          break;
        case 's':
          this.onAddRun('S');
          break;

        case ' ':
          event.preventDefault();
          this.onAutoPlay();
          break;
        default:
          break;
      }
    }
  }

  handleReset() {
    this.props.onChangeState({
      rps_list: [],
      winChance: 33,
    });
  }

  onAutoPlay = () => {
    if (this.props.rps_list.length > 2) {
      const prevStates = this.props.rps_list;
      const nextRPS = predictNext(prevStates, false);

      this.onAddRun(nextRPS);
    } else {
      alertModal(
        this.props.isDarkMode,
        'PURR-HAPS YOU SHOULD CREATE AT LEAST 3 TURNS TO TRAIN THE AI PLAY'
      );
      return;
    }
  };

  onChangeWinChance = winChance => {
    this.setState({ winChance });
  };

  onRemoveItem = index => {
    this.props.playSound('tap');

    const wager = 1;
    const winPayout = 2;
    const lossPayout = 0;
    const tiePayout = 1;
    const newArray = this.props.rps_list.filter((elem, i) => i != index);
    const winChance = calcWinChance(newArray);
    const winChanceEV = calcEV(
      winChance,
      wager,
      winPayout,
      lossPayout,
      tiePayout
    );

    this.props.onChangeState({
      rps_list: newArray,
      winChance: winChanceEV
    });

  };

  onAddRun = selected_rps => {
    this.props.playSound('boop');
    const wager = 1;
    const winPayout = 2;
    const lossPayout = 0;
    const tiePayout = 1;
    this.setState({ selected_rps: selected_rps });
    const newArray = JSON.parse(JSON.stringify(this.props.rps_list));
    newArray.push({
      rps: selected_rps
    });
    const winChance = calcWinChance(newArray);
    const winChanceEV = calcEV(
      winChance,
      wager,
      winPayout,
      lossPayout,
      tiePayout
    );
    this.props.onChangeState({
      rps_list: newArray,
      winChance: winChanceEV
    });
    this.onChangeWinChance(winChance);
    this.setState({ winChance: winChanceEV });
  };

  componentDidUpdate(prevProps, prevState) {
    if (prevState.rps_list.length !== this.props.rps_list.length) {
      const table = document.getElementById('runs');
      if (table) {
        table.scrollTop = table.scrollHeight;
      }
    }
  }

  // handleAI PlayChange = () => {
  //   this.setState(prevState => ({
  //     autoplay: !prevState.autoplay
  //   }));
  // };

  handleSettingsIconClick = () => {
    this.setState({ settings_panel_opened: !this.state.settings_panel_opened });
  }

  render() {
    const { selected_rps, settings_panel_opened } = this.state;
    const {
      rps_game_type,
      step,
      bet_amount,
      rps_list,
      onChangeState,
      strategies,
      ai_mode,
      rank,
      user_id,
      selectedStrategy,
      setSelectedStrategy
    } = this.props;


    const gameTypeStyleClass = {
      RPS: 'rps',
      QS: 'quick-shoot',
    };

    const { gameTypeList } = this.props;
    const { selectedGameType } = this.props;

    if (!gameTypeList) return null;
    return (
      <>
        {step === 1 && rps_game_type === 0 && (
          <div className="game-info-panel">
            <div className='glass-container' style={{ display: "flex", flexDirection: "column" }}>
              <div>
                <div style={{ marginBottom: "30px" }}>
                  <RadioGroup value={selectedGameType} onChange={this.props.handleChange}>
                    <h3 className="game-sub-title roll-tag">Choose Game Mode&nbsp;<Tooltip
                      style={{ position: "absolute", right: "20px" }}
                      title={'Select a game-mode to use as collateral against your capital.'}
                      placement="top"
                    >
                      <Info style={{ cursor: "pointer", float: "right" }} />
                    </Tooltip></h3>
                    <StyledRadioGrid>
                      {gameTypeList.map((gameType, index) => (
                        <FormControlLabel
                          key={index}
                          value={gameType.short_name}
                          control={<Radio
                            icon={<div style={{ display: 'none' }} />}
                            checkedIcon={<div style={{ display: 'none' }} />}
                          />}
                          label={
                            <StyledProductCard
                              id="rps-game-type-radio"
                              isDarkMode={this.props.isDarkMode}

                              className={`btn-game-type title btn-icon ${gameTypeStyleClass[gameType.short_name]} ${selectedGameType === gameType.short_name ? 'active' : ''
                                }`}
                            >
                              <StyledProductImage
                                src={`/img/gametype/icons/${gameType.short_name}.svg`}
                                alt={gameType.game_type_name}
                              />
                              <span style={{ color: "#f9f9f9", marginTop: '0' }}>{gameType.game_type_name}</span>
                            </StyledProductCard>
                          }
                        />
                      ))}
                    </StyledRadioGrid>
                  </RadioGroup>
                </div>
              </div>

              <GameSettingsPanel
                selectedStrategy={this.props.selectedStrategy}
                setSelectedStrategy={this.props.setSelectedStrategy}
                isDarkMode={this.props.isDarkMode}
              />
              <CoinInfo
                onChangeState={this.props.onChangeState}
                name={this.props.name}
                ticker={this.props.ticker}
                x_link={this.props.x_link}
                image={this.props.image}
                isDarkMode={this.props.isDarkMode}
                telegram_link={this.props.telegram_link}
                website_link={this.props.website_link}
              />

              <DefaultBetAmountPanel
                bet_amount={this.props.bet_amount}
                onChangeState={this.props.onChangeState}
                game_type={this.props.game_type}
                defaultBetAmounts={this.props.defaultBetAmounts}
              />
            </div>
          </div>

        )}
      </>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode,
  data: state.itemReducer.myItemArray,
  isFocused: state.auth.isFocused,
  gameTypeList: state.logic.gameTypeList,

});

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(RPS);
