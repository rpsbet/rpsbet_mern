import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { acQueryMyItem } from '../../redux/Item/item.action';
import { setFocused } from '../../redux/Auth/user.actions';
import {
  Button,
  TextField,
  Tooltip,
  InputAdornment,
} from '@material-ui/core';
import { Info } from '@material-ui/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenSquare } from '@fortawesome/free-solid-svg-icons';

const AdvancedSettings = (props) => {


  const handleInputChange = (field, value) => {
    props.onChangeState({ [field]: value });
  };

  return (
    <div id="advanced_panel">
      {/* Step 1: Privacy */}
      <div className="game-privacy-panel game-info-panel glass-container ">
      <h3 className="game-sub-title roll-tag">Advanced Settings&nbsp;<Tooltip
        style={{ position: "absolute", right: "20px" }}
        title={'Optional - Skip if needed.'}
        placement="top"
      >
        <Info style={{ cursor: "pointer", float: "right" }} />
      </Tooltip></h3>
        <div style={{ padding: "15px 15px 15px 15px", gridTemplateColumns: "1fr", display:"grid", gap: "20px", width: "80%" }}>
          {/* Privacy Section */}
          <div className="grid-item label roll-tag">
            <span >Privacy</span>
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
                className={!props.is_private ? 'active' : ''}
                onClick={() => handleInputChange('is_private', false)}
              >
                <img src="/img/icons/public.svg" alt="Public Game" width="20px" />
                Public
              </Button>
              <Button
                className={props.is_private ? 'active' : ''}
                onClick={() => handleInputChange('is_private', true)}
              >
                <img src="/img/icons/private.svg" alt="Private Game" width="20px" />
                Private
              </Button>
            </div>
              {props.is_private && (
                <TextField
                  id="room_password"
                  variant="filled"
                  value={props.room_password}
                  onChange={(e) => handleInputChange('room_password', e.target.value)}
                />
              )}
          </div>

          {/* Payout Section */}
          <div className="grid-item label roll-tag" style={{marginTop: "20px"}}>
            <span>Payout</span>
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
                className={!props.endgame_type ? 'active' : ''}
                onClick={() => handleInputChange('endgame_type', false)}
              >
                <img src="/img/icons/manual.svg" alt="Manual Game" width="20px" />
                Manual
              </Button>
              <Button
                className={props.endgame_type ? 'active' : ''}
                onClick={() => handleInputChange('endgame_type', true)}
              >
                <img src="/img/icons/automatic.svg" alt="Automatic Game" width="20px" />
                Automatic
              </Button>
            </div>
              {props.endgame_type && (
                <TextField
                  id="endgame_amount"
                  variant="filled"
                  value={props.endgame_amount}
                  placeholder="PAYOUT"
                  onChange={(e) => handleInputChange('endgame_amount', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">RPS</InputAdornment>,
                  }}
                />
              )}
          </div>

          {/* Tags Section */}
          <div className="grid-item label roll-tag" style={{marginTop: "20px"}}>
            <span>Tags</span>
            <Tooltip
              style={{ marginLeft: '8px' }}
              title="Add tags to your game."
              placement="top"
            >
              <Info style={{ cursor: 'pointer' }} />
            </Tooltip>
          </div>
          <div className="grid-item content" style={{justifyItems: "center",}}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <TextField
                label="Add Tags"
                value={props.description}
                placeholder="e.g. crypto, money, web3, moonshot"
                onChange={props.handleDescriptionChange}
                onFocus={() => props.setFocused(true)}
                onBlur={() => props.setFocused(false)}
                // fullWidth
                // multiline
                // minRows={2}
                variant="filled"
              />
              <FontAwesomeIcon icon={faPenSquare} style={{ marginLeft: '10px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  data: state.itemReducer.myItemArray,
});

const mapDispatchToProps = {
  acQueryMyItem,
  setFocused,
};

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSettings);