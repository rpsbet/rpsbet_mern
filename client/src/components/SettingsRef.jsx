import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setFocused } from '../redux/Auth/user.actions';
import {
  Paper,
  Button,
  Tooltip,
  CircularProgress,
  TextField,
  useMediaQuery,
  Typography,
  Box,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { green, yellow } from '@mui/material/colors';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import debounce from 'lodash.debounce';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import axios from '../util/Api';
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
  prompt,
  onChangeState,
  creator_prompt,
  setSelectedStrategy,
  settings_panel_opened,
  settingsRef,
  selectedStrategy,
  updateUserStrategy,
  updateUserPrompt,
}) => {
  const dispatch = useDispatch();

  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [strengthsOpen, setStrengthsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localPrompt, setLocalPrompt] = useState(prompt || creator_prompt);
  const [tokenStatus, setTokenStatus] = useState(false);
  const debouncedUpdateRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isGPT3Selected =
    selectedStrategy === 'GPT3' || (ai_mode === 'GPT3' && !selectedStrategy);
  const filteredStrategies = strategies.filter(
    (strategy) => strategy.name === (selectedStrategy || ai_mode),
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

  useEffect(() => {
    if (debouncedUpdateRef.current) {
      debouncedUpdateRef.current.cancel();
    }

    debouncedUpdateRef.current = debounce(async (newPrompt) => {
      setSaving(true);
      if (typeof updateUserPrompt === 'function') {
        await updateUserPrompt(user_id, newPrompt);
      } else {
        onChangeState({
          prompt: newPrompt,
        });
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setSaving(false);
        timeoutRef.current = null;
      }, 1000);
    }, 1000);

    return () => {
      if (debouncedUpdateRef.current) {
        debouncedUpdateRef.current.cancel();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user_id, updateUserPrompt]);

  useEffect(() => {
    setLocalPrompt(prompt || creator_prompt);
  }, [prompt, creator_prompt]);

  useEffect(async () => {
    const res = await axios.post('/game/checkTokens');
    setTokenStatus(res.data.status ?? false);
  }, []);

  const handlePromptChange = (e) => {
    const newValue = e.target.value;
    setLocalPrompt(newValue);
    debouncedUpdateRef.current(newValue);
  };

  return (
    <Box
      ref={settingsRef}
      className={`transaction-settings ${settings_panel_opened ? 'active' : ''}`}
      sx={{
        maxWidth: '95vw',
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? '#2a2a2a' : '#f9f9f9',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 0 8px rgba(0,0,0,0.8)'
            : '0 0 10px rgba(0,0,0,0.2)',
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
          fontWeight: 600,
        }}
      >
        AI Play Models
        <AutoAwesomeIcon
          sx={{ ml: 1, fontSize: '1.25rem', color: 'error.main' }}
        />
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
              fontWeight: 500,
            }}
          >
            {selectedStrategy || ai_mode}
          </Typography>

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
                  fontSize: '0.9rem',
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
              mb: 1,
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
                  fontSize: '0.9rem',
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
              my: 1,
            }}
          />
        </Box>
      ))}

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Model Selection
        </Typography>
        <Box
          className="slippage-select-panel"
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
        >
          {sortedStrategies.map((strategy, index) => {
            const isUnlocked = tokenStatus || rank >= strategy.levelToUnlock;
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
                <Box>
                  <Button
                    variant={isActive ? 'contained' : 'outlined'}
                    color={isActive ? 'error' : 'inherit'}
                    disableElevation
                    onClick={() => {
                      if (
                        typeof updateUserStrategy === 'function' &&
                        isUnlocked
                      ) {
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
                      width: '100%',
                      '&.Mui-disabled': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
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
                </Box>
              </Tooltip>
            );
          })}

          {saving && (
            <Box
              sx={{
                position: 'absolute',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                right: '20px',
                fontSize: 'x-small',
                fontStyle: 'italic',
              }}
            >
              SAVING
              <CircularProgress color="error" size={10} sx={{ ml: 1 }} />
            </Box>
          )}
        </Box>
      </Box>

      {/* Prompt Box at the Bottom */}
      {isGPT3Selected && (
        <Paper variant="outlined">
          <TextField
            multiline
            rows={4}
            color="error"
            variant="filled"
            fullWidth
            label="Custom Prompt"
            value={localPrompt}
            onChange={handlePromptChange}
            onFocus={() => dispatch(setFocused(true))}
            onBlur={() => dispatch(setFocused(false))}
          />
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
        {/* SPEED */}
        <Box component="tr">
          <Box component="th" scope="row" sx={{ textAlign: 'left' }}>
            Speed
          </Box>
          <Box component="td" sx={{ textAlign: 'left' }}>
            ({strategy.speed}%)
          </Box>
          {calculateBarWidths(strategy.speed).map((width, idx) => (
            <Box component="td" key={idx} sx={{ width: '50px', p: 0 }}>
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
        {/* REASONING */}
        <Box component="tr">
          <Box component="th" scope="row" sx={{ textAlign: 'left' }}>
            Reasoning
          </Box>
          <Box component="td" sx={{ textAlign: 'left' }}>
            ({strategy.reasoning}%)
          </Box>
          {calculateBarWidths(strategy.reasoning).map((width, idx) => (
            <Box component="td" key={idx} sx={{ width: '50px', p: 0 }}>
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
        {/* PREDICTABILITY */}
        <Box component="tr">
          <Box component="th" scope="row" sx={{ textAlign: 'left' }}>
            Predictability
          </Box>
          <Box component="td" sx={{ textAlign: 'left' }}>
            ({strategy.predictability}%)
          </Box>
          {calculateBarWidths(strategy.predictability).map((width, idx) => (
            <Box component="td" key={idx} sx={{ width: '50px', p: 0 }}>
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
