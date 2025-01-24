import React, { useState, useEffect, useRef } from 'react';
import { Paper, Button, Tooltip, CircularProgress, TextField } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { green, yellow } from '@mui/material/colors';
import useMediaQuery from '@mui/material/useMediaQuery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import debounce from 'lodash.debounce';

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
  const sortedStrategies = strategies.sort(
    (a, b) => a.levelToUnlock - b.levelToUnlock
  );

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
        : 'Play predictable patterns, but if they increase their bet amount, switch to predict their moves';
    setPrompt(defaultText);
    setDebouncedPrompt(defaultText);
  }, [gamemode]);

  return (
    <div
      ref={settingsRef}
      className={`transaction-settings ${settings_panel_opened ? 'active' : ''}`}
    >
      <h5>AI Play Settings</h5>

      <div className="tiers">
        {filteredStrategies.map((strategy, index) => (
          <div key={index}>
            <div className="strategy-label">CHOSEN STRATEGY: </div>
            <div className="strategy-description">{selectedStrategy || ai_mode}</div>
            <hr />
            <div className="desktop-only strategy-label">Description:</div>
            {isMobile ? (
              <>
                <a className="btn-join" style={{ pointer: 'cursor' }} onClick={() => setDescriptionOpen(!descriptionOpen)}>
                  <FontAwesomeIcon icon={descriptionOpen ? faChevronUp : faChevronDown} />&nbsp;
                  {descriptionOpen ? ' Description' : ' Description'}
                </a>
                {descriptionOpen && (
                  <div className="strategy-description">{strategy.description}</div>
                )}
              </>
            ) : (
              <div className="strategy-description">{strategy.description}</div>
            )}
            <hr />
            <div className="desktop-only strategy-label">Strengths:</div>
            {isMobile ? (
              <>
                <a className="btn-join" style={{ pointer: 'cursor' }} onClick={() => setStrengthsOpen(!strengthsOpen)}>
                  <FontAwesomeIcon icon={strengthsOpen ? faChevronUp : faChevronDown} />&nbsp;
                  {strengthsOpen ? ' Strengths' : ' Strengths'}
                </a>
                {strengthsOpen && (
                  <table key={index} style={{ width: '100%' }}>
                    <tbody>
                      <tr>
                        <th>Speed</th>
                        <td>({strategy.speed}%)</td>
                        {calculateBarWidths(strategy.speed).map((width, idx) => (
                          <td key={idx}>
                            <div className="bar" style={{ width: `${width}%` }} />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th>Reasoning</th>
                        <td>({strategy.reasoning}%)</td>
                        {calculateBarWidths(strategy.reasoning).map((width, idx) => (
                          <td key={idx}>
                            <div className="bar" style={{ width: `${width}%` }} />
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th>Predictability</th>
                        <td>({strategy.predictability}%)</td>
                        {calculateBarWidths(strategy.predictability).map((width, idx) => (
                          <td key={idx}>
                            <div className="bar" style={{ width: `${width}%` }} />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                )}
              </>
            ) : (
              <table key={index} style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <th>Speed</th>
                    <td>({strategy.speed}%)</td>
                    {calculateBarWidths(strategy.speed).map((width, idx) => (
                      <td key={idx}>
                        <div className="bar" style={{ width: `${width}%` }} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Reasoning</th>
                    <td>({strategy.reasoning}%)</td>
                    {calculateBarWidths(strategy.reasoning).map((width, idx) => (
                      <td key={idx}>
                        <div className="bar" style={{ width: `${width}%` }} />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th>Predictability</th>
                    <td>({strategy.predictability}%)</td>
                    {calculateBarWidths(strategy.predictability).map((width, idx) => (
                      <td key={idx}>
                        <div className="bar" style={{ width: `${width}%` }} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
            <hr />
          </div>
        ))}

        <div className="slippage-select-panel">
          {sortedStrategies.map((strategy, index) => (
            <span key={index}>
              <Tooltip
                title={rank > strategy.levelToUnlock ? 'Unlocked!' : `Unlock at level ${strategy.levelToUnlock}`}
              >
                <span>
                  <Button
                    id="ap-btn"
                    variant="contained"
                    className={`btn-back ${(selectedStrategy || ai_mode) === strategy.name ? 'active' : ''}${rank < strategy.levelToUnlock ? ' disabled' : ''}`}
                    onClick={() => {
                      if (typeof updateUserStrategy === 'function') {
                        updateUserStrategy(user_id, strategy.name);
                      }
                      setSelectedStrategy(strategy.name);
                    }}
                    disabled={rank < strategy.levelToUnlock}
                  >
                    {rank < strategy.levelToUnlock && (
                      <LockIcon style={{ color: yellow[500] }} />
                    )}
                    {strategy.name}{' '}
                    {rank === strategy.levelToUnlock + 1 && (
                      <span style={{ color: green[500] }}>
                        &nbsp;<i>NEW!</i>
                      </span>
                    )}
                    <span style={{ fontSize: '1.1em', marginLeft: '5px' }}>
                      {decodeHtmlEntity(strategy.icon)}
                    </span>
                  </Button>
                </span>
              </Tooltip>
            </span>
          ))}
        </div>
      </div>

      {/* Prompt Box at the Bottom */}
      {selectedStrategy === 'GPT3' && (
        <Paper style={{ marginTop: '20px' }}>
          <TextField
            multiline
            rows={4}
            color='secondary'
            variant="filled"
            fullWidth
            label="Custom Prompt"
            value={prompt}
            onChange={handlePromptChange}
          />
          {saving && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              <CircularProgress />
            </div>
          )}
        </Paper>
      )}
    </div>
  );
};

export default SettingsRef;