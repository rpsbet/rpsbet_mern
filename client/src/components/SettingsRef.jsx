import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Button,
  Tooltip,
  CircularProgress,
  TextField,
  useMediaQuery,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { green, yellow } from '@mui/material/colors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import debounce from 'lodash.debounce';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const decodeHtmlEntity = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const SettingsRef = ({
  strategies,
  rank,
  user_id,
  ai_mode,
  setSelectedStrategy,
  settings_panel_opened,
  settingsRef,
  selectedStrategy,
  updateUserStrategy,
  saving = false,
  gamemode = 'Standard',
}) => {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [strengthsOpen, setStrengthsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [debouncedPrompt, setDebouncedPrompt] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const filteredStrategies = strategies.filter(
    (strategy) => strategy.name === (selectedStrategy || ai_mode)
  );
  const sortedStrategies = strategies
    .slice() // clone array so we don't mutate original
    .sort((a, b) => a.levelToUnlock - b.levelToUnlock);

  const calculateBarWidths = (value) => {
    let bars = [];
    let remaining = value;
    while (remaining > 0) {
      if (remaining >= 100) {
        bars.push(100);
        remaining -= 100;
      } else {
        bars.push(remaining);
        remaining = 0;
      }
    }
    return bars;
  };

  const debouncedUpdate = useRef(
    debounce((newPrompt) => setDebouncedPrompt(newPrompt), 500)
  ).current;

  const handlePromptChange = (e) => {
    const newValue = e.target.value;
    setPrompt(newValue);
    debouncedUpdate(newValue);
  };

  useEffect(() => {
    // Update the prompt default text based on gamemode
    const defaultText =
      gamemode === 'Quick Shoot'
        ? 'If the user clicks top corner, go for bottom corner.'
        : 'Play predictable patterns, but if they increase their bet amount, switch to predict their moves.';
    setPrompt(defaultText);
    setDebouncedPrompt(defaultText);
  }, [gamemode]);

  return (
    <Box
      ref={settingsRef}
      className={`transaction-settings ${settings_panel_opened ? 'active' : ''}`}
      sx={{
        maxWidth: '95vw',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? '#2a2a2a' : '#f9f9f9',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark' ? '0 0 8px rgba(0,0,0,0.8)' : '0 0 10px rgba(0,0,0,0.2)',
        overflowY: 'auto',
        transition: 'transform 0.3s ease-in-out',
        padding: 2,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 1,
          fontWeight: 600
        }}
      >
        AI Play Models
        <AutoAwesomeIcon sx={{ ml: 1, fontSize: '1.25rem', color: 'error.main' }} />
      </Typography>

      {filteredStrategies.map((strategy, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            CHOSEN MODEL:
          </Typography>
          <Typography
            sx={{
              mb: 1,
              color: 'text.secondary',
              fontWeight: 500
            }}
          >
            {selectedStrategy || ai_mode}
          </Typography>

          <Box
            sx={{
              height: '1px',
              backgroundColor: (theme) => theme.palette.divider,
              mb: 1
            }}
          />
          {/* Description */}
          {!isMobile && (
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Description:
            </Typography>
          )}
          {isMobile ? (
            <>
              <Button
                variant="text"
                color="error"
                disableElevation
                sx={{
                  textTransform: 'none',
                  fontSize: '0.9rem'
                }}
                onClick={() => setDescriptionOpen(!descriptionOpen)}
                startIcon={
                  <FontAwesomeIcon
                    icon={descriptionOpen ? faChevronUp : faChevronDown}
                  />
                }
              >
                Description
              </Button>
              {descriptionOpen && (
                <Typography
                  sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 1 }}
                >
                  {strategy.description}
                </Typography>
              )}
            </>
          ) : (
            <Typography
              sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 1 }}
            >
              {strategy.description}
            </Typography>
          )}

          <Box
            sx={{
              height: '1px',
              backgroundColor: (theme) => theme.palette.divider,
              mb: 1
            }}
          />
          {/* Strengths */}
          {!isMobile && (
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Strengths:
            </Typography>
          )}
          {isMobile ? (
            <>
              <Button
                variant="text"
                color="error"
                disableElevation
                sx={{
                  textTransform: 'none',
                  fontSize: '0.9rem'
                }}
                onClick={() => setStrengthsOpen(!strengthsOpen)}
                startIcon={
                  <FontAwesomeIcon
                    icon={strengthsOpen ? faChevronUp : faChevronDown}
                  />
                }
              >
                Strengths
              </Button>
              {strengthsOpen && (
                <StrengthsTable
                  strategy={strategy}
                  calculateBarWidths={calculateBarWidths}
                />
              )}
            </>
          ) : (
            <StrengthsTable
              strategy={strategy}
              calculateBarWidths={calculateBarWidths}
            />
          )}

          <Box
            sx={{
              height: '1px',
              backgroundColor: (theme) => theme.palette.divider,
              my: 1
            }}
          />
        </Box>
      ))}

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Model Selection
        </Typography>
        <Box className="slippage-select-panel" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {sortedStrategies.map((strategy, index) => {
            const isUnlocked = rank >= strategy.levelToUnlock;
            const isActive = (selectedStrategy || ai_mode) === strategy.name;

            return (
              <Tooltip
                key={index}
                title={
                  isUnlocked
                    ? 'Unlocked!'
                    : `Unlock at level ${strategy.levelToUnlock}`
                }
                arrow
              >
                <span>
                  <Button
                    variant={isActive ? 'contained' : 'outlined'}
                    color={isActive ? 'error' : 'inherit'}
                    disableElevation
                    onClick={() => {
                      if (typeof updateUserStrategy === 'function' && isUnlocked) {
                        updateUserStrategy(user_id, strategy.name);
                      }
                      if (isUnlocked) {
                        setSelectedStrategy(strategy.name);
                      }
                    }}
                    disabled={!isUnlocked}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      borderRadius: 2,
                      '&.Mui-disabled': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      }
                    }}
                  >
                    {!isUnlocked && (
                      <LockIcon
                        sx={{ color: yellow[700], mr: 0.5, fontSize: '1.1rem' }}
                      />
                    )}
                    {strategy.name}{' '}
                    {rank === strategy.levelToUnlock + 1 && (
                      <Box
                        component="span"
                        sx={{ color: green[500], fontWeight: 'bold', ml: 0.5 }}
                      >
                        [NEW!]
                      </Box>
                    )}
                    <Box component="span" sx={{ fontSize: '1.1em', ml: 0.5 }}>
                      {decodeHtmlEntity(strategy.icon)}
                    </Box>
                  </Button>
                </span>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      {/* Prompt Box at the Bottom */}
      {selectedStrategy === 'GPT3' && (
        <Paper
          variant="outlined"

        >
          <TextField
            multiline
            rows={4}
            color="error"
            variant="filled"
            fullWidth
            label="Custom Prompt"
            value={prompt}
            onChange={handlePromptChange}
          />
          {saving && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <CircularProgress color="error" />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

/** A small helper component to render the Strengths table. */
function StrengthsTable({ strategy, calculateBarWidths }) {
  return (
    <Box component="table" sx={{ width: '100%', mt: 1 }}>
      <Box component="tbody">
        <Box component="tr">
          <Box component="th" scope="row" sx={{ textAlign: 'left' }}>
            Speed
          </Box>
          <Box component="td" sx={{ textAlign: 'left' }}>
            ({strategy.speed}%)
          </Box>
          {calculateBarWidths(strategy.speed).map((width, idx) => (
            <Box
              component="td"
              key={idx}
              sx={{ width: '50px', p: 0 }}
            >
              <Box
                sx={{
                  height: 6,
                  backgroundColor:
                    strategy.speed < 100
                      ? 'error.dark'
                      : strategy.speed <= 100
                        ? 'warning.main'
                        : 'success.light',
                  borderRadius: 1,
                  width: `${width}%`,
                  mr: 1,
                }}
              />
            </Box>
          ))}
        </Box>

        <Box component="tr">
          <Box component="th" scope="row" sx={{ textAlign: 'left' }}>
            Reasoning
          </Box>
          <Box component="td" sx={{ textAlign: 'left' }}>
            ({strategy.reasoning}%)
          </Box>
          {calculateBarWidths(strategy.reasoning).map((width, idx) => (
            <Box
              component="td"
              key={idx}
              sx={{ width: '50px', p: 0 }}
            >
              <Box
                sx={{
                  height: 6,
                  backgroundColor:
                    strategy.reasoning < 100
                      ? 'error.dark'
                      : strategy.reasoning <= 100
                        ? 'warning.main'
                        : 'success.light',
                  borderRadius: 1,
                  width: `${width}%`,
                  mr: 13,
                }}
              />
            </Box>
          ))}
        </Box>

        <Box component="tr">
          <Box component="th" scope="row" sx={{ textAlign: 'left' }}>
            Predictability
          </Box>
          <Box component="td" sx={{ textAlign: 'left' }}>
            ({strategy.predictability}%)
          </Box>
          {calculateBarWidths(strategy.predictability).map((width, idx) => (
            <Box
              component="td"
              key={idx}
              sx={{ width: '50px', p: 0 }}
            >
              <Box
                sx={{
                  height: 6,
                  backgroundColor:
                    strategy.predictability < 100
                      ? 'error.dark'
                      : strategy.predictability <= 100
                        ? 'warning.main'
                        : 'success.light',
                  borderRadius: 1,
                  mr: 1,
                  width: `${width}%`,
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default SettingsRef;