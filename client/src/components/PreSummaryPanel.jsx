import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
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
    isQbot,
    solPrice,
    winChance,
    rps_game_type,
    endgame_type,
    qs_game_type,
    pr,
    bet_amount,
  } = props;

  const calculateQuickShootReturn = () => {
    if (qs_game_type && bet_amount) {
      return (
        (bet_amount / (qs_game_type - 1) + parseFloat(bet_amount)) *
        (1 - (cp + 2.5) / 100) -
        bet_amount
      );
    }
    return 0;
  };

  const calculateRPSReturn = () => {
    return bet_amount * 2 * ((100 - (cp + 2.5)) / 100) - bet_amount;
  };

  return (
    <div className="pre-summary-panel title" style={{ overflow: 'hidden' }}>
      <div className="pre-summary-panel__inner">
        {[...Array(1)].map((_, i) => (
          <React.Fragment key={i}>

            <div className="data-item">
              <div><div className="label room-name">Room Name</div></div>
              <div className="value">{roomInfo?.name}</div>
            </div>

            <div className="data-item">
              <div><div className="label room-id">STATUS</div></div>
              <div className="value">{status}</div>
            </div>

            <div className="data-item">
              <div><div className="label your-bet-amount">LIQUIDITY</div></div>
              <Tooltip title={
                isLowBankroll
                  ? `${parseFloat((Number(bankroll) || 0).toFixed(4))} SOL — LOW BANKROLL CAN CAUSE A BET TO FAIL`
                  : `${parseFloat((Number(bankroll) || 0).toFixed(3))} SOL`
              }>
                <div
                  className={`value ${isLowBankroll ? 'red-text' : ''}`}
                  style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}
                >
                  {convertToCurrency(bankroll, solPrice)}
                  {!isLowBankroll ? (
                    <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                  ) : (
                    <WarningIcon style={{ fontSize: 16, marginLeft: 4 }} />
                  )}
                </div>
              </Tooltip>
            </div>

            <div className="data-item">
              <div>
                <div className="label your-max-return">Your Return</div>
              </div>
              <Tooltip
                title={
                  roomInfo.game_type === 'Quick Shoot'
                    ? (
                      <div>
                        <span>EXPLANATION: </span>
                        <p>
                          Quick Shoot logic: (Bet Amount / (qs_game_type - 1) + Bet Amount),
                          minus commission ({cp}%) and platform tax (2.5%).
                        </p>
                        <span>CALCULATION: </span>
                        <div>
                          {convertToCurrency(bet_amount, solPrice)} / ({qs_game_type - 1}) + {convertToCurrency(bet_amount, solPrice)} ={' '}
                          {convertToCurrency(bet_amount / (qs_game_type - 1) + bet_amount, solPrice)}
                        </div>
                        <div>
                          -({cp} + 2.5)% ={' '}
                          {convertToCurrency(
                            calculateQuickShootReturn(), solPrice
                          )}
                        </div>
                      </div>
                    )
                    : (
                      <div>
                        <span>EXPLANATION: </span>
                        <p>
                          2x your Bet Amount, then deduct Host(s)'s(') commission, if any,
                          (which is Returned to Bankroll or RTB) and finally deduct 2.5%
                          platform tax.
                        </p>
                        <span>CALCULATION: </span>
                        <div>{convertToCurrency(bet_amount, solPrice)} x 2 ={' '}
                          {convertToCurrency(bet_amount * 2, solPrice)}
                        </div>
                        <div>
                          -({cp} + 2.5)% ={' '}
                          {convertToCurrency(
                            calculateRPSReturn(), solPrice
                          )}
                        </div>
                      </div>
                    )
                }
              >
                <div
                  className="value"
                  style={{
                    cursor: 'pointer',
                    color:
                      (roomInfo.game_type === 'Quick Shoot'
                        ? calculateQuickShootReturn()
                        : calculateRPSReturn()) > 0
                        ? '#00ff3a'
                        : 'red',
                  }}
                >
                  {convertToCurrency(
                    roomInfo.game_type === 'Quick Shoot'
                      ? calculateQuickShootReturn()
                      : calculateRPSReturn(), solPrice
                  )}
                  <InfoIcon style={{ fontSize: 16, marginLeft: 4 }} />
                </div>
              </Tooltip>
            </div>

            <div className="data-item">
              <div><div className="label chance">Win Chance</div></div>
              <div className="value">{winChance}%</div>
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
                        : convertToCurrency(hostProfit - totalStakes, solPrice)}
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
                      {convertToCurrency(pr, solPrice)}
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
                {isQbot && (<span style={{ fontSize: "xx-small", position: "absolute", top: "65px", border: "1px solid rgb(255, 208, 0)", background: "linear-gradient(45deg, #7a5958, #a27955)", borderRadius: "4px", color: "rgb(255, 208, 0)", padding: "0px 5px", lineHeight: "20px", marginLeft: "7.5px" }} >
                  Q-BOT
                </span>)}
              </div>
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