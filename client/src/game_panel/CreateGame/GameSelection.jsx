import React from 'react';
import { Radio, RadioGroup, Box, Tooltip, Typography, TextField, Divider, InputAdornment } from '@mui/material';
import { Info } from '@mui/icons-material';
import styled from 'styled-components';
import GameSettingsPanel from '../CreateGame/GameSettingsPanel';
import { alpha } from '@mui/material';

// Glassmorphism styled components
const GlassContainer = styled(Box)`
  background: ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(30, 30, 30, 0.3)' : 'rgba(255, 255, 255, 0.65)'};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.5)'};
  box-shadow: ${({ isDarkMode }) =>
    isDarkMode
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(31, 38, 135, 0.1)'};
  padding: 24px;
  transition: all 0.3s ease;
`;

const GlassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 24px;
  width: 100%;
  max-width: 800px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const GlassGameCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  background: ${({ isActive, isDarkMode }) =>
    isActive
      ? isDarkMode
        ? 'rgba(211, 47, 47, 0.2)'
        : 'rgba(211, 47, 47, 0.1)'
      : isDarkMode
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.3)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid ${({ isActive, isDarkMode }) =>
    isActive
      ? 'rgba(211, 47, 47, 0.8)'
      : isDarkMode
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(255, 255, 255, 0.5)'};
  box-shadow: ${({ isActive }) =>
    isActive
      ? '0 8px 24px rgba(211, 47, 47, 0.2)'
      : '0 4px 16px rgba(0, 0, 0, 0.08)'};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.15);
    background: ${({ isDarkMode }) =>
      isDarkMode ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)'};
  }

  img {
    width: 48px;
    height: 48px;
    object-fit: contain;
    margin-bottom: 12px;
    transition: transform 0.2s ease;
  }

  .label {
    font-weight: 500;
    color: ${({ isActive, isDarkMode }) =>
      isActive
        ? 'rgba(211, 47, 47, 0.9)'
        : isDarkMode
        ? 'rgba(255, 255, 255, 0.9)'
        : 'rgba(0, 0, 0, 0.8)'};
    font-size: 1rem;
    margin-top: 8px;
  }

  &:hover img {
    transform: scale(1.1);
  }
`;

const GlassInputContainer = styled(Box)`
  display: flex;
  align-items: center;
  background: ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)'};
  backdrop-filter: blur(4px);
  border-radius: 8px;
  border: 1px solid ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  overflow: hidden;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => alpha(theme.palette.error.main, 0.7)};
  }

  &.Mui-focused {
    border-color: ${({ theme }) => theme.palette.error.main};
  }
`;

const GlassInfoBox = styled(Box)`
  background: ${({ isDarkMode }) =>
    isDarkMode ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 193, 7, 0.05)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-left: 4px solid ${({ theme }) => theme?.palette?.warning?.main || '#ffc107'};
  padding: 12px 16px;
  border-radius: 4px;
  margin: 16px 0;
  font-size: 0.9rem;
`;

const OrDivider = styled(Box)`
  display: flex;
  align-items: center;
  margin: 24px 0;
  width: 100%;
  
  &::before, &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid ${({ isDarkMode }) =>
      isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  }

  .divider-text {
    margin: 0 16px;
    font-weight: 500;
    color: ${({ isDarkMode }) =>
      isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'};
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 1px;
  }
`;

const gameTypeStyleClass = {
  RPS: 'rps',
  QS: 'quick-shoot',
};

export const getTaxMessage = (mode) => {
  switch (mode) {
    case 'RPS':
      return 'You will receive 30% back from player winnings';
    case 'QS':
      return 'You will receive 12% - 20% back from player winnings';
    case 'Custom':
      return 'You will receive 5% back from player winnings';
    default:
      return 'Not specified';
  }
};

export const RoomTaxInfo = ({ gameMode, isDarkMode }) => {
  return (
    <GlassInfoBox
      isDarkMode={isDarkMode}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Info fontSize="small" color="warning" />
      <Typography variant="body2" component="span" sx={{ fontWeight: 500, color: '#ffd000' }}>
        {getTaxMessage(gameMode)}
      </Typography>
    </GlassInfoBox>
  );
};

const GameSelection = ({
  gameTypeList,
  selectedGameType,
  handleChange,
  isDarkMode,
  theme,
  gameMode,
  setGameModeLocal,
  setSelectedGameType,
  gameCode,
  setPrompt,
  setGameCode,
  proxiedAssets,
  setProxiedAssets,
  prompt,
  initializeGameType,
  onChangeState,
  user,
  rank,
  ai_mode,
  strategies,
}) => {
  return (
    <GlassContainer isDarkMode={isDarkMode} sx={{ mb: 4 }}>
      <RadioGroup value={selectedGameType} onChange={handleChange}>
        {/* Title and Tooltip */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography
            variant="h6"
            component="h3"
            className="game-sub-title"
            sx={{
              fontWeight: 600,
              position: 'relative',
              color: isDarkMode ? '#fff' : '#000',
              '&:after': {
                content: '""',
                position: 'absolute',
                bottom: -6,
                left: 0,
                width: '40px',
                height: '3px',
                background: theme.palette.error.main,
                borderRadius: '2px',
              },
            }}
          >
            Select Game Type
          </Typography>
          <Tooltip title="Select a game-mode to use as collateral against your capital." placement="top">
            <Info
              sx={{
                cursor: 'pointer',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                '&:hover': { color: theme.palette.error.main },
                transition: 'color 0.2s ease',
              }}
            />
          </Tooltip>
        </Box>

        {/* Custom Button and TextField */}
        <Box sx={{ mt: 2, position: 'relative' }}>
          <Radio
            value="Custom"
            style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
          />
          <GlassInputContainer
            isDarkMode={isDarkMode}
            theme={theme}
            onClick={(e) => {
              e.stopPropagation();
              handleChange({ target: { value: 'Custom' } });
            }}
            sx={{
              borderColor:
                selectedGameType === 'Custom'
                  ? theme.palette.error.main
                  : isDarkMode
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              placeholder="Enter a prompt...(e.g. Create a Crash casino game)"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                onChangeState({ prompt: e.target.value });
              }}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <GameSettingsPanel
                      isCustomLabel={true}
                      setGameMode={setGameModeLocal}
                      setGameModeLocal={setGameModeLocal}
                      setSelectedGameType={setSelectedGameType}
                      gameCode={gameCode}
                      setGameCode={setGameCode}
                      proxiedAssets={proxiedAssets}
                      setProxiedAssets={setProxiedAssets}
                      prompt={prompt}
                      initializeGameType={initializeGameType}
                      onChangeState={onChangeState}
                      user={user}
                      gameMode={gameMode}
                      rank={rank}
                      ai_mode={ai_mode}
                      isDarkMode={isDarkMode}
                      strategies={strategies}
                    />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 0,
                  background: 'transparent',
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: 'none' },
                }
              }}
              sx={{
                flex: 1,
                '& .MuiInputBase-input': {
                  padding: '8px 12px',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                },
              }}
            />
          </GlassInputContainer>
        </Box>

        {/* OR Divider */}
        <OrDivider isDarkMode={isDarkMode}>
          <span className="divider-text">or</span>
        </OrDivider>

        {/* RPS and Quick Shoot Cards */}
        <GlassGrid>
          {gameTypeList
            .filter((gameType) => gameType.short_name !== 'Custom')
            .map((gameType, index) => (
              <Box key={index}>
                <Radio
                  value={gameType.short_name}
                  style={{ display: 'none' }}
                />
                <GlassGameCard
                  isDarkMode={isDarkMode}
                  isActive={selectedGameType === gameType.short_name}
                  className={`btn-game-type ${gameTypeStyleClass[gameType.short_name]}`}
                  onClick={() => handleChange({ target: { value: gameType.short_name } })}
                >
                  <img
                    src={`/img/gametype/icons/${gameType.short_name}.svg`}
                    alt={gameType.game_type_name}
                  />
                  <span className="label">{gameType.game_type_name}</span>
                </GlassGameCard>
              </Box>
            ))}
        </GlassGrid>
      </RadioGroup>
      <RoomTaxInfo gameMode={gameMode} isDarkMode={isDarkMode} />
    </GlassContainer>
  );
};

export default GameSelection;