import React, { useState, useRef } from 'react';
import { connect } from 'react-redux';
import { Button, Tooltip, FormControlLabel, RadioGroup, Radio } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import styled from 'styled-components';
import GameSettingsPanel from './GameSettingsPanel';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import CoinInfo from './CoinInfo';
import { convertToCurrency } from '../../util/conversion';

const StyledRadioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  width: 100%;
  max-width: 800px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    padding: 10px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
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
  width: 150px;
  text-align: center;
  text-decoration: none;
  color: ${({ isDarkMode }) => (isDarkMode ? '#ddd' : '#444')};
  box-shadow: none;
  transition: background 0.2s ease;

  span {
    margin-top: 8px;
    font-size: 0.9rem;
    font-weight: 400;
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
  margin-bottom: 6px;
  opacity: 0.85;
`;

const QuickShoot = (props) => {
  const {
    step,
    qs_game_type,
    bet_amount,
    qs_list,
    onChangeState,
    selectedGameType,
    gameTypeList,
    tax,
    solPrice,
    isDarkMode,
    selectedStrategy,
    setSelectedStrategy,
    name,
    image,
    strategies,
    game_type,
    defaultBetAmounts,
    ai_mode,
    user,
    rank
  } = props;

  const [winChance, setWinChance] = useState(33);
  const [qsList, setQsList] = useState([]);
  const [settingsPanelOpened, setSettingsPanelOpened] = useState(false);
  const settingsRef = useRef(null);

  const handleReset = () => {
    onChangeState({
      qs_list: [],
      winChance: 0,
    });
    setQsList([]);
  };

  const calcWinChance = (gameType, rounds) => {
    let probWin = (100 / gameType).toFixed(2);
    let probLose = (100 - probWin).toFixed(2);

    const freq = {};
    for (let i = 0; i < gameType; i++) {
      freq[i] = 0;
    }

    rounds.forEach((round) => {
      freq[round.qs]++;
    });

    const freqValues = Object.values(freq);
    const range = Math.max(...freqValues) - Math.min(...freqValues);

    const sensitivityFactor = (range / 100) * gameType;
    const adjustmentFactor = (range / gameType) * sensitivityFactor;
    probWin = (+probWin - adjustmentFactor).toFixed(2);
    probLose = (+probLose + adjustmentFactor).toFixed(2);

    return `${probWin}% - ${probLose}%`;
  };

  const calcEV = (gameType, betAmount, winLoseProb) => {
    const winAmount = betAmount * (gameType - 1);
    const loseAmount = betAmount;

    const [probWin, probLose] = winLoseProb.split(' - ').map((prob) => parseFloat(prob));

    const ev = (probWin * winAmount - probLose * loseAmount) / 100;
    return ev.toFixed(2);
  };

  const gameTypeStyleClass = {
    RPS: 'rps',
    QS: 'quick-shoot',
  };

  return (
    <>
      {step === 1 && (
        <div className="game-info-panel">
          <div className="glass-container">
            <div style={{ marginBottom: '30px' }}>
              <RadioGroup value={selectedGameType} onChange={props.handleChange}>
                <h3 className="game-sub-title roll-tag">
                  Choose Game Mode&nbsp;
                  <Tooltip
                    style={{ position: 'absolute', right: '20px' }}
                    title="Select a game-mode to use as collateral against your capital."
                    placement="top"
                  >
                    <Info style={{ cursor: 'pointer', float: 'right' }} />
                  </Tooltip>
                </h3>
                <StyledRadioGrid>
                  {gameTypeList.map((gameType, index) => (
                    <FormControlLabel
                      key={index}
                      value={gameType.short_name}
                      control={
                        <Radio
                          icon={<div style={{ display: 'none' }} />}
                          checkedIcon={<div style={{ display: 'none' }} />}
                        />
                      }
                      label={
                        <StyledProductCard
                          id="rps-game-type-radio"
                          isDarkMode={isDarkMode}
                          className={`btn-game-type title btn-icon ${gameTypeStyleClass[gameType.short_name]} ${
                            selectedGameType === gameType.short_name ? 'active' : ''
                          }`}
                        >
                          <StyledProductImage
                            src={`/img/gametype/icons/${gameType.short_name}.svg`}
                            alt={gameType.game_type_name}
                          />
                          <span className="label" style={{ marginTop: '0' }}>
                            {gameType.game_type_name}
                          </span>
                        </StyledProductCard>
                      }
                    />
                  ))}
                </StyledRadioGrid>
              </RadioGroup>
            </div>

            <h3 className="game-sub-title roll-tag">
              Choose a Game Type&nbsp;
              <Tooltip
                style={{ position: 'absolute', right: '20px' }}
                title="Select the multiplier of the player, 5x is typically the safest option for the Host."
                placement="top"
              >
                <Info style={{ cursor: 'pointer', float: 'right' }} />
              </Tooltip>
            </h3>
            <div className="qs-game-type-panel" style={{ textAlign: 'center', marginBottom: '30px' }}>
              {[2, 3, 4, 5].map((i) => (
                <Button
                  key={i}
                  className={qs_game_type === i ? 'label active' : 'label'}
                  onClick={() => {
                    onChangeState({
                      qs_game_type: i,
                      max_return: bet_amount * Number(i),
                      public_bet_amount: convertToCurrency(bet_amount * Number(i - 1), solPrice),
                      selected_qs_position: 0,
                    });
                  }}
                >
                  {i}x
                </Button>
              ))}
            </div>

            <GameSettingsPanel
              selectedStrategy={selectedStrategy}
              user={user}
              rank={rank}
              ai_mode={ai_mode}
              setSelectedStrategy={setSelectedStrategy}
              isDarkMode={isDarkMode}
              strategies={strategies}
            />

            <CoinInfo onChangeState={onChangeState} name={name} image={image} isDarkMode={isDarkMode} />

            <DefaultBetAmountPanel
              tax={tax}
              bet_amount={bet_amount}
              onChangeState={onChangeState}
              game_type={game_type}
              defaultBetAmounts={defaultBetAmounts}
            />
          </div>
        </div>
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode,
  isFocused: state.auth.isFocused,
  strategies: state.logic.strategies,
  gameTypeList: state.logic.gameTypeList,
  solPrice: state.logic.solPrice,
});

export default connect(mapStateToProps)(QuickShoot);