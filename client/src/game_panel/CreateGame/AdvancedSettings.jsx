import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { acQueryMyItem } from '../../redux/Item/item.action';
import { setFocused } from '../../redux/Auth/user.actions';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Button,
  TextField,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenSquare } from '@fortawesome/free-solid-svg-icons';
import { getCustomTheme } from '../../config/theme';

function AdvancedSettings(props) {
  const dispatch = useDispatch();

  // Map state from Redux using useSelector
  const data = useSelector((state) => state.itemReducer.myItemArray);

  const theme = getCustomTheme(props.isDarkMode);

  const [showOptions, setShowOptions] = useState(false);

  const handleInputChange = (field, value) => {
    props.onChangeState({ [field]: value });
  };

  return (
    <ThemeProvider theme={theme}>
      <div id="advanced_panel">
        <div className="game-privacy-panel game-info-panel">
          <h3 className="game-sub-title roll-tag">
            Advanced Settings
            <Tooltip
              style={{ position: 'absolute', right: '20px' }}
              title={'Optional - Skip if needed.'}
              placement="top"
            >
              <Info style={{ cursor: 'pointer', float: 'right' }} />
            </Tooltip>
          </h3>

          <div
            style={{
              padding: '15px',
              gridTemplateColumns: '1fr',
              display: 'grid',
              gap: '20px',
              width: '80%',
            }}
          >
            {/* Privacy Section */}
            <div
              className="grid-item label roll-tag"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
            >
              <span>Privacy</span> 
              <Tooltip
                style={{ marginLeft: '8px' }}
                title="Set private to require players enter a password to play"
                placement="top"
              >
                <Info style={{ cursor: 'pointer' }} />
              </Tooltip>
            </div>

            <div className="grid-item content">
              <div className="radio-button-group">
                <Button
                  color="error"
                  className={!props.is_private ? 'active' : ''}
                  onClick={() => handleInputChange('is_private', false)}
                >
                  <img src="/img/icons/public.svg" alt="Public Game" width="20px" />
                  Public
                </Button>

                <Button
                  color="error"
                  className={props.is_private ? 'active' : ''}
                  onClick={() => handleInputChange('is_private', true)}
                >
                  <img src="/img/icons/private.svg" alt="Private Game" width="20px" />
                  Private
                </Button>
              </div>

              {props.is_private && (
                <TextField
                  color="error"
                  id="room_password"
                  variant="filled"
                  value={props.room_password}
                  onChange={(e) => handleInputChange('room_password', e.target.value)}
                />
              )}
            </div>

            {/* Commented-Out Payout Section */}
            {/* <div
              className="grid-item label roll-tag"
              style={{ display: 'flex', alignItems: 'center', justifyContent: "center", width: '100%', marginTop: "20px" }}
            >
              <span style={{ textAlign: "center" }}>Payout</span> 
              <Tooltip
                style={{ marginLeft: '8px' }}
                title="Choose Automatic to be paid into your balance each time the set threshold has been reached"
                placement="top"
              >
                <Info style={{ cursor: 'pointer' }} />
              </Tooltip>
            </div>

            <div className="grid-item content">
              <div className="radio-button-group">
                <Button
                  color='error'
                  className={!props.endgame_type ? 'active' : ''}
                  onClick={() => handleInputChange('endgame_type', false)}
                >
                  <img src="/img/icons/manual.svg" alt="Manual Game" width="20px" />
                  Manual
                </Button>

                <Button
                  color='error'
                  className={props.endgame_type ? 'active' : ''}
                  onClick={() => handleInputChange('endgame_type', true)}
                >
                  <img src="/img/icons/automatic.svg" alt="Automatic Game" width="20px" />
                  Automatic
                </Button>
              </div>

              {props.endgame_type && (
                <TextField
                  color='error'
                  id="endgame_amount"
                  variant="filled"
                  value={props.endgame_amount}
                  placeholder="PAYOUT"
                  onChange={(e) => handleInputChange('endgame_amount', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">SOL</InputAdornment>,
                  }}
                />
              )}
            </div> */}

            <div
              className="grid-item label roll-tag"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: '20px' }}
            >
              <span>Other Information</span> 
              <Tooltip
                style={{ marginLeft: '8px' }}
                title="Add a description to your room."
                placement="top"
              >
                <Info style={{ cursor: 'pointer' }} />
              </Tooltip>
            </div>

            <div
              className="grid-item content"
              style={{ justifyItems: 'center' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <TextField
                  color="error"
                  label="Add Description"
                  value={props.description}
                  placeholder="e.g. This gonna go crazy"
                  onChange={props.handleDescriptionChange}
                  onFocus={() => dispatch(setFocused(true))}
                  onBlur={() => dispatch(setFocused(false))}
                  fullWidth
                  variant="filled"
                />
                <FontAwesomeIcon icon={faPenSquare} style={{ marginLeft: '10px' }} />
              </div>
            </div>

            <div style={{ textAlign: 'left', margin: '10px 0' }}>
              <a
                href="#"
                style={{
                  fontSize: '12px',
                  padding: '0 10px',
                  color: props.isDarkMode ? 'white' : '#666',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  setShowOptions(!showOptions);
                }}
              >
                {showOptions ? <>Hide options ↑</> : <>Show more options ↓</>}
              </a>
            </div>

            {showOptions && (
              <div>
                <TextField
                  color="error"
                  label="X Link"
                  variant="filled"
                  fullWidth
                  margin="normal"
                  value={props.x_link}
                  onChange={(e) => handleInputChange('x_link', e.target.value)}
                  placeholder="optional"
                  onFocus={() => dispatch(setFocused(true))}
                  onBlur={() => dispatch(setFocused(false))}
                />
                <TextField
                  color="error"
                  label="Website Link"
                  variant="filled"
                  fullWidth
                  margin="normal"
                  value={props.website_link}
                  onChange={(e) => handleInputChange('website_link', e.target.value)}
                  placeholder="optional"
                  onFocus={() => dispatch(setFocused(true))}
                  onBlur={() => dispatch(setFocused(false))}
                />
                <TextField
                  color="error"
                  label="Telegram Link"
                  variant="filled"
                  fullWidth
                  margin="normal"
                  value={props.telegram_link}
                  onChange={(e) => handleInputChange('telegram_link', e.target.value)}
                  placeholder="optional"
                  onFocus={() => dispatch(setFocused(true))}
                  onBlur={() => dispatch(setFocused(false))}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default AdvancedSettings;