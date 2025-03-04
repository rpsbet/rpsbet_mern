import React, { useState, useRef } from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Tooltip,
  FormControlLabel,
  RadioGroup,
  Radio,
  Box,
} from '@mui/material';
import { Info } from '@mui/icons-material';
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
margin-bottom: 20px;
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
    prompt,
    setPrompt,
    endgame_amount,
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
    rank,
    ticker,
  } = props;

  const gameTypeStyleClass = {
    RPS: 'rps',
    QS: 'quick-shoot',
  };

  return (
    <>
      {step === 1 && (
        <Box className="game-info-panel">
          <Box className="glass-container">
            <Box>
              <RadioGroup
                value={selectedGameType}
                onChange={props.handleChange}
              >
                <h3 className="game-sub-title roll-tag">
                  Add Game&nbsp;
                  <Tooltip
                    style={{ position: 'absolute', right: '20px' }}
                    title="Select a game-mode to use as collateral against your capital."
                    placement="top"
                  >
                    <Info style={{ cursor: 'pointer', float: 'right' }} />
                  </Tooltip>
                </h3>
                <GameSettingsPanel
              selectedStrategy={selectedStrategy}
              setSelectedStrategy={setSelectedStrategy}
              prompt={prompt}
              onChangeState={onChangeState}
              user={user}
              rank={rank}
              ai_mode={ai_mode}
              isDarkMode={isDarkMode}
              strategies={strategies}
            />
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
                            selectedGameType === gameType.short_name
                              ? 'active'
                              : ''
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
        
            </Box>
            <Box sx={{ mt: '20px' }}>

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
              <Box
                className="qs-game-type-panel"
                style={{ textAlign: 'center', marginBottom: '30px' }}
              >
                {[2, 3, 4, 5].map((i) => (
                  <Button
                    variant="outlined"
                    color="error"
                    key={i}
                    sx={{ mr: 1 }}
                    className={qs_game_type === i ? 'active' : ''}
                    onClick={() => {
                      onChangeState({
                        qs_game_type: i,
                        max_return: bet_amount * Number(i),
                        public_bet_amount: convertToCurrency(
                          bet_amount * Number(i - 1),
                          solPrice,
                        ),
                        selected_qs_position: 0,
                      });
                    }}
                  >
                    {i}x
                  </Button>
                ))}
              </Box>
            </Box>

    

            <CoinInfo
              onChangeState={onChangeState}
              name={name}
              image={image}
              ticker={ticker}
              isDarkMode={isDarkMode}
            />

            <DefaultBetAmountPanel
              tax={tax}
              endgame_amount={endgame_amount}
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
  strategies: state.logic.strategies,
  gameTypeList: state.logic.gameTypeList,
  solPrice: state.logic.solPrice,
});

export default connect(mapStateToProps)(QuickShoot);
