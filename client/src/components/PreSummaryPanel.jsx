import React from 'react';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import Avatar from './Avatar';
import { convertToCurrency } from '../util/conversion';
import Moment from 'moment';
import {
  Tooltip,
} from '@material-ui/core';

const PreSummaryPanel = (props) => {
  const {
    status,
    bankroll,
    isLowBankroll,
    cp,
    isHighCommission,
    barStyle,
    roomInfo,
    isDarkMode,
    hostProfit,
    totalStakes,
    isLowProfit,
    handleOpenPlayerModal,
    creator_id,
    creator_avatar,
    username,
    rank,
    accessory,
    rps_game_type,
    endgame_type,
    pr, // interest received
    bet_amount,
    // ... add any other props you need from the parent
  } = props;

  return (
    <div className="pre-summary-panel title" style={{ overflow: 'hidden' }}>
      <div className="pre-summary-panel__inner">
        {[...Array(1)].map((_, i) => (
          <React.Fragment key={i}>

            <div className="data-item">
              <div><div className="label room-id">STATUS</div></div>
              <div className="value">{status}</div>
            </div>

            <div className="data-item">
              <div><div className="label your-bet-amount">LIQUIDITY</div></div>
              <Tooltip title={isLowBankroll ? "LOW BANKROLL CAN CAUSE A BET TO FAIL" : "A.K.A Liquidity / Pool / Pot"}>
                <div
                  className={`value ${isLowBankroll ? 'red-text' : ''}`}
                  style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}
                >
                  {convertToCurrency(bankroll)}
                  {!isLowBankroll ? (
                    <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                  ) : (
                    <WarningIcon style={{ fontSize: 16, marginLeft: 4 }} />
                  )}
                </div>
              </Tooltip>
            </div>

            <div className="data-item">
              <div><div className="label your-max-return">Your Return</div></div>
              <Tooltip
                title={
                  <div>
                    <span>EXPLANATION: </span>
                    <p>
                      2x your Bet Amount, then deduct Host(s)'s(') commission, if any,
                      (which is Returned to Bankroll or RTB) and finally deduct 2.5%
                      platform tax.
                    </p>
                    <span>CALCULATION: </span>
                    <div>{convertToCurrency(bet_amount)} x 2 ={' '}
                      {convertToCurrency(bet_amount * 2)}
                    </div>
                    <div>
                      -({cp} + 2.5)% ={' '}
                      {convertToCurrency(
                        bet_amount * 2 * ((100 - (cp + 2.5)) / 100)
                      )}
                    </div>
                  </div>
                }
              >
                <div
                  className="value"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color:
                      (bet_amount * 2 * ((100 - (cp + 2.5)) / 100)) - bet_amount > 0
                        ? '#00ff3a'
                        : 'red',
                  }}
                >
                  {convertToCurrency(
                    bet_amount * 2 * ((100 - (cp + 2.5)) / 100) -
                      bet_amount
                  )}
                  <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                </div>
              </Tooltip>
            </div>

            <div className="data-item">
              <div><div className="label chance">Win Chance</div></div>
              <div className="value">33%</div>
            </div>

            <div className="data-item">
              <div><div className="label net-profit">Room Profit</div></div>
              <div className="value bankroll">
                <Tooltip title="Current bankroll + Payouts - Initial bankroll">
                  <div
                    className="value"
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <span className={`value ${isLowProfit ? 'green-text' : 'red-text'}`}>
                      {isNaN(hostProfit - totalStakes)
                        ? 'N/A'
                        : convertToCurrency(hostProfit - totalStakes)}
                    </span>
                    {isLowProfit ? (
                      <InfoIcon style={{ color: '#00ff3a', fontSize: 16, marginLeft: 4 }} />
                    ) : (
                      <WarningIcon style={{ color: 'red', fontSize: 16, marginLeft: 4 }} />
                    )}
                  </div>
                </Tooltip>
              </div>
            </div>

            {rps_game_type === 0 && (
              <div className="data-item">
                <div><div className="label commission">Tax</div></div>
                <Tooltip title="Host's Accessory's Commission Power (CP) - Player's Accessory's Battle Power (BP) (MINIMUM 2.5% TOWARDS PLATFORM)">
                  <div
                    style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}
                  >
                    <div
                      className={`value ${isHighCommission ? 'red-text' : ''}`}
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                      }}
                    >
                      <div className="value">{cp < 1 ? 1 : cp}% </div>
                      {!isHighCommission ? (
                        <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                      ) : (
                        <WarningIcon style={{ fontSize: 16, marginLeft: 4 }} />
                      )}
                    </div>
                  </div>
                </Tooltip>
              </div>
            )}

            {endgame_type && (
              <div className="data-item">
                <div><div className="label created">Auto-Payout</div></div>
                <Tooltip title="Automatic dividends paid out to Hosts & CoHosts upon meeting the set payout threshold">
                  <div style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div className="payout-bar">
                      <div className="value" style={barStyle}></div>
                    </div>
                    <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                  </div>
                </Tooltip>
              </div>
            )}

            <div className="data-item">
              <div><div className="label public-interest">Interest Received</div></div>
              <div className="value">
                <Tooltip title="Paid every 33 minutes, at a rate of 0.00001% of the bankroll. Room must be public.">
                  <div style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <span style={{ color: "#00fff5" }}>
                      {convertToCurrency(pr)}
                    </span>
                    <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                  </div>
                </Tooltip>
              </div>
            </div>

            <div className="data-item">
              <div><div className="label host-display-name">Creator</div></div>
              <div className="value host">
                <a
                  className="player"
                  onClick={() => handleOpenPlayerModal(creator_id)}
                >
                  <Avatar
                    className="avatar"
                    src={creator_avatar}
                    username={username}
                    rank={rank}
                    accessory={accessory}
                    alt=""
                    darkMode={isDarkMode}
                  />
                </a>
              </div>
            </div>

            <div className="data-item">
              <div><div className="label room-name">Room ID</div></div>
              <div className="value">{roomInfo?.room_name}</div>
            </div>

            <div className="data-item">
              <div><div className="label public-max-return">Created</div></div>
              <div className="value">
                {Moment(roomInfo?.created_at).fromNow()}
              </div>
            </div>

          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PreSummaryPanel;