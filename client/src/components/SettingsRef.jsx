import React, { useRef } from 'react';
import { Button, Tooltip } from '@material-ui/core';
import LockIcon from '@material-ui/icons/Lock';
import { green, yellow } from '@material-ui/core/colors';


const SettingsRef = ({ strategies, rank, user_id, ai_mode, setSelectedStrategy, settings_panel_opened, settingsRef, selectedStrategy, updateUserStrategy }) => {

  const filteredStrategies = strategies.filter(strategy => strategy.name === (selectedStrategy || ai_mode));
  const sortedStrategies = strategies.sort((a, b) => a.levelToUnlock - b.levelToUnlock);

  const calculateBarWidths = value => {
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

  return (
    <div ref={settingsRef}
      className={`transaction-settings ${settings_panel_opened ? 'active' : ''}`}>
      <h5>Autoplay Settings</h5>

      <div className="tiers">
        {/* Move description outside the table */}
        {filteredStrategies.map((strategy, index) => (
          <div key={index}>
            <div className="strategy-label">CHOSEN STRATEGY: </div>
            <div className="strategy-description">{selectedStrategy || ai_mode}</div>
            <hr />
            <div className="strategy-label">Description:</div>
            <div className="strategy-description">{strategy.description}</div>
            <hr />
            <div className="strategy-label">Strengths:</div>

            {/* Render bars dynamically */}
            <table key={index} style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <th>Speed</th>
                  ({strategy.speed}%) {calculateBarWidths(strategy.speed).map((width, idx) => (
                    <td key={idx}>
                      <div className="bar" style={{ width: `${width}%` }} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>Reasoning</th>
                  ({strategy.reasoning}%)  {calculateBarWidths(strategy.reasoning).map((width, idx) => (
                    <td key={idx}>
                      <div className="bar" style={{ width: `${width}%` }} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>Predictability</th>
                  ({strategy.predictability}%)  {calculateBarWidths(strategy.predictability).map((width, idx) => (
                    <td key={idx}>
                      <div className="bar" style={{ width: `${width}%` }} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <hr />
          </div>
        ))}

        {/* Render buttons based on filtered strategies */}
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
                    {rank <= strategy.levelToUnlock && (
                      <LockIcon style={{ color: yellow[500] }} />
                    )}
                    {strategy.name} {rank === strategy.levelToUnlock + 1 && (
                      <span style={{ color: green[500] }}>&nbsp;<i>NEW!</i></span>
                    )}
                  </Button>
                </span>
              </Tooltip>
            </span>
          ))}

        </div>
      </div>
    </div>
  );
};



export default SettingsRef;
