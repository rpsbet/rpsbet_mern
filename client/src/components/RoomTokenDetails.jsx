import React from 'react';
import Avatar from '../components/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { convertToCurrency } from '../util/conversion';
import {
    Box,
  } from '@mui/material';
  
const RoomTokenDetails = ({ roomInfo, solPrice, isDarkMode, handleOpenPlayerModal, progressPercentage }) => {
    return (
        <Box  className="room-details">
            {/* Room Header: Image on the Left, Name/Ticker and Description on the Right */}
            <div className="room-header">
                <img
                    className="room-image"
                    src={roomInfo.image}
                    alt={roomInfo.name}
                />
                <div className="room-info">
                    <h6 className="room-name">
                        {roomInfo.name}<br/><span className="room-ticker">({roomInfo.ticker})</span>
                    </h6>
                    <p className="room-description">{roomInfo.description}</p>
                </div>
            </div>

            {/* Room Links */}
            <div className="room-links" style={{marginBottom: "30px"}}>
                {roomInfo.x_link && (
                    <a
                        href={roomInfo.x_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="room-link-icon"
                    >
                        <FontAwesomeIcon icon={faXTwitter} />
                    </a>
                )}
                {roomInfo.website_link && (
                    <a
                        href={roomInfo.website_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="room-link-icon"
                    >
                        <FontAwesomeIcon icon={faGlobe} />
                    </a>
                )}
                {roomInfo.telegram_link && (
                    <a
                        href={roomInfo.telegram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="room-link-icon"
                    >
                        <FontAwesomeIcon icon={faTelegram} />
                    </a>
                )}
            </div>

            <div className="bonding-curve" style={{ marginBottom: "30px" }}>
                <h4 className='game_header label' style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                    BONDING-CURVE PROGRESS: {progressPercentage}%
                </h4>
                <div
                    className='payout-bar'
                    style={{
                        width: '100%',
                        height: '20px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        className='value'
                        style={{
                            width: `${progressPercentage}%`,
                            height: '100%',
                            backgroundColor: '#4caf50',
                        }}
                    ></div>
                </div>
            </div>
            {roomInfo.hosts && roomInfo.hosts.length > 0 && (
                <div style={{ marginBottom: "30px" }}>
                    <h4 className="game_header label">Holder Distribution</h4>
                    {roomInfo.hosts
                        .sort((a, b) => b.share - a.share) // Sort hosts by share in descending order
                        .slice(0, 10) // Take the top 10 hosts
                        .map((host, index) => (
                            <div
                                key={`host-${index}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between', // Separate avatar and share percentage
                                    width: '100%', // Ensure full width for each row
                                    padding: '10px 0', // Add spacing between rows
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)', // Optional row separator
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleOpenPlayerModal(host.host)}
                            >
                                {/* Avatar Column */}
                                <a
                                    className="player"
                                    onClick={() => handleOpenPlayerModal(host.host)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <Avatar
                                        className="avatar"
                                        src={host.avatar}
                                        rank={host.rank}
                                        username={host.username}
                                        accessory={host.accessory}
                                        alt=""
                                        darkMode={isDarkMode}
                                    />
                                </a>
                                
                                <span className='label'><span className='room-ticker'>{(host.share).toFixed(2)}%</span><br />{convertToCurrency(host.stake, solPrice)}</span>
                            </div>
                        ))}
                </div>
            )}
          
        </Box>
    );
};

export default RoomTokenDetails;