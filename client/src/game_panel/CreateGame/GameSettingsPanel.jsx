import React from 'react';
import { Tooltip, Typography, Button } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faDice } from '@fortawesome/free-solid-svg-icons';

const GameSettingsPanel = ({ selectedStrategy, setSelectedStrategy, isDarkMode }) => {
  const strategies = [
    {
      value: 'Markov',
      name: 'AI',
      description: 'Pattern-based reasoning for skill-based gameplay, attractive to players.',
      icon: faBrain,
    },
    {
      value: 'Random',
      name: 'RNG',
      description: 'Random number generator for safer hosting but less popular gameplay.',
      icon: faDice,
    },
  ];

  return (
    <div style={{ marginTop: '20px', marginBottom: '30px' }}>
      <h3 className="game-sub-title roll-tag">
        Choose Strategy&nbsp;
        <Tooltip
          style={{ position: 'absolute', right: '20px' }}
          title="Select the strategy your game will use. AI offers patterns and reasoning, while RNG is randomized."
          placement="top"
        >
          <Info style={{ cursor: 'pointer', float: 'right' }} />
        </Tooltip>
      </h3>

      <div className="qs-game-type-panel" style={{ textAlign: 'center', marginTop: '20px',display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row', }}>
        {strategies.map((strat) => (
          <Button
            key={strat.value}
            className={`strategy-btn ${selectedStrategy === strat.value ? 'active' : ''}`}
            onClick={() => setSelectedStrategy(strat.value)}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '30px',
              transition: 'all 0.3s ease',
              textTransform: 'none',
              fontSize: '0.875em',
            }}
          >
            <FontAwesomeIcon icon={strat.icon} size="1x" style={{  color: isDarkMode ? '#f9f9f9' : '#333' }} />
            <span style={{  color:  isDarkMode ? '#f9f9f9' : '#333', marginLeft: '10px' }}>
              {strat.name}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default GameSettingsPanel;