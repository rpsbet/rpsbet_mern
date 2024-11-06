import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import { connect } from 'react-redux';
import { Button, Tooltip, IconButton, ButtonBase } from '@material-ui/core';
import { Info } from '@material-ui/icons';
// import { acQueryMyItem } from '../../redux/Item/item.action';
import styled from 'styled-components';
import { faTrash, faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import SettingsRef from '../../components/SettingsRef';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import { alertModal } from '../modal/ConfirmAlerts';
import { predictNext } from '../../util/predictNext';
const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(165px, 1fr));
  gap: 20px;
  max-width: 100%;
  margin: 20px 0;
`;

const ProductImage = styled.img`
  max-width: 100%;
  height: auto;
  background: #fff;
  border: 1px solid #f9f9;
  box-shadow: 0 1px 17px #333;
  border-radius: 10px;
`;

const ProductCard = styled.div`
  position: relative;
  background: linear-gradient(156deg, #8a0290, #cf0c0e);
  border-radius: 20px;
  padding: 10px;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-align-items: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  cursor: pointer;
  -webkit-transition: -webkit-transform 0.2s;
  -webkit-transition: transform 0.2s;
  transition: transform 0.2s;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover::before {
    opacity: 1;
  }

  &:hover {
    transform: scale(1.03);
    border: 2px solid #fff;
  }
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

  // Calculate the base win chances
  const baseWinChance = (100 / 3).toFixed(2);

  const rockWinChance = parseFloat(baseWinChance);
  const paperWinChance = parseFloat(baseWinChance);
  const scissorsWinChance = parseFloat(baseWinChance);

  // Calculate the range of frequencies
  const freq = { rock, paper, scissors };
  const freqValues = Object.values(freq);
  const range = Math.max(...freqValues) - Math.min(...freqValues);

  // Adjust probabilities based on the range of frequencies
  const sensitivityFactor = (range / 100) * total; // You can adjust this value to increase or decrease sensitivity
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
      bet_amount: 10.0,
      winChance: 33,
      card_list: {},
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
    // this.setCardListState();
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
    // Clear the roll_list and reset winChance and aveMultiplier
    this.props.onChangeState({
      rps_list: [],
      winChance: 33, // You may want to reset to default values
      aveMultiplier: 0 // You may want to reset to default values
    });
  }


  // setCardListState() {
  //   const { data } = this.props;
  //   const modifiedData = data.map(item => ({
  //     ...item,
  //     in_use: 0
  //   }));

  //   this.setState({
  //     card_list: modifiedData,
  //     rps_list: []
  //   });
  // }

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

    if (this.props.rps_game_type === 1) {
      const removedItem = this.props.rps_list[index];
      if (removedItem) {
        const updatedCardList = this.state.card_list.map(item => {
          if (item.productName === removedItem.rps) {
            const updatedInUse = item.in_use - 1;

            return { ...item, in_use: updatedInUse };
          }
          return item;
        });

        this.setState({
          card_list: updatedCardList
        });
      }
    }
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
    const defaultBetAmounts = [50000, 250000, 500000, 2500000, 10000000];
    const { selected_rps, card_list, settings_panel_opened } = this.state;
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
    return (
      <>
        {step === 1 && (
          <div className="game-info-panel">
            <DefaultBetAmountPanel
              bet_amount={bet_amount}
              onChangeState={onChangeState}
              game_type="RPS"
              defaultBetAmounts={defaultBetAmounts}
            />
          </div>
        )}
        {/* {step === 2 && (
          <div className="game-info-panel">
            <h3 className="game-sub-title">Select Mode:</h3>

            <div id="rps-game-type-radio">
              <Button
                className={rps_game_type === 0 ? 'active' : ''}
                onClick={() => {
                  onChangeState({ rps_game_type: 0, game_mode: this.state.game_mode });
                }}
              >
                <img src="/img/icons/RPS_badge.svg" alt="Classic RPS" />
                Classic RPS
              </Button>

              <Button
                className={rps_game_type === 1 ? 'active' : ''}
                onClick={() => {
                  if (rps_game_type !== 1) {
                    onChangeState({ rps_game_type: 1, game_mode: this.state.game_mode });
                  }
                }}
              >
                <img src="/img/icons/RRPS_badge.svg" alt="Restricted RPS" />
                Restricted RPS
              </Button>
            </div>
            <p className="tip">
              {rps_game_type === 0
                ? 'Classic RPS - familiar and simple, traditional rules apply'
                : 'Restricted RPS - limited cards, decide who to avoid, who to work with and who to betray'}
            </p>
          </div>
        )}

        {step === 2 && rps_game_type === 1 && (
          <div className="game-info-panel">
            <h3 className="game-sub-title">Select Cards</h3>
            <ProductGrid>
              {Array.isArray(card_list) && card_list.map(row => {
                const remainingCount = row.total_count - row.in_use;

                if (remainingCount > 0) {
                  return (
                    <ProductCard
                      key={row._id}
                      onClick={() => {
                        const { card_list } = this.state;
                        const updatedCardList = card_list.map(item => {
                          if (item._id === row._id) {
                            const updatedInUse = item.in_use + 1;

                            if (updatedInUse <= item.total_count) {
                              return { ...item, in_use: updatedInUse };
                            }
                          }
                          return item;
                        });

                        this.setState({
                          card_list: updatedCardList,
                          selected_rps: row._id
                        });

                        // onChangeState({
                        //   selected_rps: row.image
                        // });

                        this.onAddRun(row.productName);
                      }}
                      className={selected_rps === row._id ? 'selected' : ''}
                    >
                      <ProductImage src={row.image} alt={row.productName} />

                      <div>
                        {row.productName} x <span>{remainingCount}</span>
                      </div>
                    </ProductCard>
                  );
                } else {
                  return null;
                }
              })}
            </ProductGrid>

            <div className="rps-add-run-table">
              <h3 className="game-sub-title">Training Data</h3>
              <table id="runs">
                <tbody>
                  {rps_list && rps_list.length > 0 ? (
                    rps_list.map((rps, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{rps.rps}</td>
                        <td>
                          <HighlightOffIcon
                            id="delete"
                            onClick={() => this.onRemoveItem(index)}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td id="add-run" colSpan="4">
                        Determine the order of your deck (first-in, first-out).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

            </div>
            <p className="tip">RRPS CARDS AVAILABLE VIA THE MARKETPLACE</p>
          </div>
        )} */}
        {step === 2 && rps_game_type === 0 && (
          <div className="game-info-panel">
            <h3 className="game-sub-title">Strategy&nbsp;<Tooltip
              style={{ position: "absolute", right: "20px" }}
              title={'The strategy determines how your AI will play, includes patterns, reasoning and predictability.'}
              placement="top"
            >
              <Info style={{ cursor: "pointer", float: "right" }} />
            </Tooltip></h3>
            <SettingsRef
              strategies={strategies}
              ai_mode={ai_mode}
              user_id={user_id}
              rank={rank}
              settings_panel_opened={settings_panel_opened}
              setSelectedStrategy={setSelectedStrategy}
              settingsRef={this.settingsRef}
              selectedStrategy={selectedStrategy}
            />
            <ButtonBase
              onClick={this.handleSettingsIconClick}
              className="strategy-btn title"
              style={{
                boxShadow: 'unset',
                borderRadius: '30px',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ marginRight: '5px' }}>{selectedStrategy}</span>
              <SettingsOutlinedIcon />
            </ButtonBase>
            {(selectedStrategy === 'Hidden Markov') ? (
              <>
                <div className="rps-add-run-panel">
                  <div className="rps-add-run-form">
                    <h3 className="game-sub-title">Select: R - P - S! </h3>
                    <div id="rps-radio">
                      <Button
                        className={'rock' + (selected_rps === 'R' ? ' active' : '')}
                        variant="contained"
                        onClick={() => {

                          this.onAddRun('R');
                          const currentActive = document.querySelector('.active');
                          if (currentActive) {
                            currentActive.style.animation = 'none';
                            void currentActive.offsetWidth;
                            currentActive.style.animation =
                              'pulse 0.2s ease-in-out ';
                          }
                        }}
                      ><span className="roll-tag">[R]</span></Button>
                      <Button
                        className={
                          'paper' + (selected_rps === 'P' ? ' active' : '')
                        }
                        variant="contained"
                        onClick={() => {

                          this.onAddRun('P');
                          const currentActive = document.querySelector('.active');
                          if (currentActive) {
                            currentActive.style.animation = 'none';
                            void currentActive.offsetWidth;
                            currentActive.style.animation =
                              'pulse 0.2s ease-in-out ';
                          }
                        }}
                      ><span className="roll-tag">[P]</span></Button>
                      <Button
                        className={
                          'scissors' + (selected_rps === 'S' ? ' active' : '')
                        }
                        variant="contained"
                        onClick={() => {
                          this.onAddRun('S');
                          const currentActive = document.querySelector('.active');
                          if (currentActive) {
                            currentActive.style.animation = 'none';
                            void currentActive.offsetWidth;
                            currentActive.style.animation =
                              'pulse 0.2s ease-in-out ';
                          }
                        }}
                      ><span className="roll-tag">[S]</span></Button>
                    </div>

                    <Button
                      id="aiplay"
                      variant="contained"
                      onClick={this.onAutoPlay}
                    >
                       <FontAwesomeIcon icon={faRobot} style={{ color: '#060607' }} />&nbsp;Test AI Play&nbsp;<span className="roll-tag">[space]</span>
                    </Button>
                  </div>
                  <div className="rps-add-run-table">
                    <h3 className="game-sub-title">Pattern Table</h3>
                    <table id="runs">
                      <tbody>
                        {rps_list && rps_list.length > 0 ? (
                          rps_list.map((rps, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{rps.rps}</td>
                              <td>
                                <HighlightOffIcon
                                  id="delete"
                                  onClick={() => this.onRemoveItem(index)}
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td id="add-run" colSpan="4">
                              Your pattern will be displayed here
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <IconButton style={{ background: "transparent", boxShadow: "none" }} color="secondary" onClick={this.handleReset}>
                      <FontAwesomeIcon icon={faTrash} /> {/* Use the faRedo icon */}
                    </IconButton>
                  </div>
                </div>
              </>

            ) : (
              <div style={{ padding: "30px", fontSize: "0.6em" }}>
                (No Pattern Needed)
              </div>
            )}
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
  isFocused: state.auth.isFocused

});

const mapDispatchToProps = {
  // acQueryMyItem
};

export default connect(mapStateToProps, mapDispatchToProps)(RPS);
