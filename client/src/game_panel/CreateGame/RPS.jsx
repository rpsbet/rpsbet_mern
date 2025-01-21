import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Button, Tooltip, RadioGroup, IconButton, Box, Radio, FormControlLabel } from '@mui/material';
import { Info } from '@mui/icons-material';
import styled from 'styled-components';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import CoinInfo from './CoinInfo';
import GameSettingsPanel from './GameSettingsPanel';

const StyledRadioGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;

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

const RPS = (props) => {

  const {
    rps_game_type,
    step,
    tax,
    gameTypeList,
    selectedGameType,
    handleChange,
    isDarkMode,
    bet_amount,
    selectedStrategy,
    setSelectedStrategy,
    onChangeState,
    name,
    image,
    game_type,
    defaultBetAmounts,
    strategies,
    ai_mode,
    user,
    rank
  } = props;

  const gameTypeStyleClass = {
    RPS: 'rps',
    QS: 'quick-shoot',
  };

  if (!gameTypeList) return null;

  return (
    <>
      {step === 1 && rps_game_type === 0 && (
        <Box className="game-info-panel">
          <Box className="glass-container" style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column' }}>
            <RadioGroup value={selectedGameType} onChange={handleChange}>
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
                    control={<Radio icon={<div style={{ display: 'none' }} />} checkedIcon={<div style={{ display: 'none' }} />} />}
                    label={
                      <StyledProductCard
                        id="rps-game-type-radio"
                        isDarkMode={isDarkMode}
                        className={`btn-game-type title btn-icon ${gameTypeStyleClass[gameType.short_name]} ${selectedGameType === gameType.short_name ? 'active' : ''
                          }`}
                      >
                        <StyledProductImage
                          src={`/img/gametype/icons/${gameType.short_name}.svg`}
                          alt={gameType.game_type_name}
                        />
                        <span style={{ color: '#f9f9f9', marginTop: '0' }}>{gameType.game_type_name}</span>
                      </StyledProductCard>
                    }
                  />
                ))}
              </StyledRadioGrid>
            </RadioGroup>

            <GameSettingsPanel
              selectedStrategy={selectedStrategy}
              setSelectedStrategy={setSelectedStrategy}
              isDarkMode={isDarkMode}
              strategies={strategies}
              user={user}
              rank={rank}
              ai_mode={ai_mode}
            />
            <CoinInfo onChangeState={onChangeState} name={name} image={image} isDarkMode={isDarkMode} />
            <DefaultBetAmountPanel
              tax={tax}
              bet_amount={bet_amount}
              onChangeState={onChangeState}
              game_type={game_type}
              defaultBetAmounts={defaultBetAmounts}
            />
          </Box>
        </Box>
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode,
  data: state.itemReducer.myItemArray,
  strategies: state.logic.strategies,
  isFocused: state.auth.isFocused,
  gameTypeList: state.logic.gameTypeList,
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(RPS);