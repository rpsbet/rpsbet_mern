import React from 'react';
import Avatar from '../components/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { convertToCurrency } from '../util/conversion';
import {
    Box,
    Typography,
    Link
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';

const RoomTokenDetails = ({ roomInfo, hosts, solPrice, isDarkMode, handleOpenPlayerModal, progressPercentage }) => {

    function formatAddress(address) {
        return address.slice(0, 4) + '...' + address.slice(-4);
    }
    return (
        <Box className="room-details">
            {/* Room Header: Image on the Left, Name/Ticker and Description on the Right */}
            <Box className="room-header">
                <img
                    className="room-image"
                    src={roomInfo.image}
                    alt={roomInfo.name}
                />
                <Box className="room-info">
                    <h6 className="room-name">
                        {roomInfo.name}<br /><span className="room-ticker">({roomInfo.ticker})</span>
                    </h6>
                    <Typography variant="body2" sx={{ fontSize: '0.6rem' }} className="room-description">{roomInfo.description}</Typography>
                </Box>
            </Box>

            {/* Room Links */}
            <Box className="room-links" style={{ marginBottom: "30px" }}>
                {roomInfo.x_link && (
                    <Link
                        href={roomInfo.x_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            color: 'white',
                            display: 'inline-flex',
                            alignItems: 'center',
                            mr: 1, // optional spacing
                        }}
                    >
                        <FontAwesomeIcon icon={faXTwitter} />
                    </Link>
                )}
                {roomInfo.website_link && (
                    <Link
                        href={roomInfo.website_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            color: 'white',
                            display: 'inline-flex',
                            alignItems: 'center',
                            mr: 1,
                        }}
                    >
                        <FontAwesomeIcon icon={faGlobe} />
                    </Link>
                )}
                {roomInfo.telegram_link && (
                    <Link
                        href={roomInfo.telegram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            color: 'white',
                            display: 'inline-flex',
                            alignItems: 'center',
                            mr: 1,
                        }}
                    >
                        <FontAwesomeIcon icon={faTelegram} />
                    </Link>
                )}
            </Box>

            <Box className="bonding-curve" style={{ marginBottom: "30px" }}>
                <h4 className='roll-tag label' style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                    HARD CAP: {progressPercentage}%
                </h4>
                <Box
                    className='payout-bar'
                    style={{
                        width: '100%',
                        height: '20px',
                        backgroundColor: '#e0e0e0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        className='value'
                        style={{
                            width: `${progressPercentage}%`,
                            height: '100%',
                            backgroundColor: '#4caf50',
                        }}
                    ></Box>
                </Box>
            </Box>
            {hosts && hosts.length > 0 && (
                <Box style={{ marginBottom: '30px' }}>
                    <h4 className="roll-tag label">Holder Distribution</h4>
                    {hosts
                        .sort((a, b) => b.share - a.share) // Sort hosts by share in descending order
                        .slice(0, 10) // Take the top 10 hosts
                        .map((host, index) => (
                            <Box
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
                                        user_id={host.host}
                                        rank={host.rank}
                                        username={host.username}
                                        accessory={host.accessory}
                                        alt=""
                                        darkMode={isDarkMode}
                                    />
                                </a>

                                <Link
                                    href={`https://solscan.io/${host.walletAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="body2"
                                    sx={{ display: 'flex', alignItems: 'center', color: '#f9f9f9' }}
                                >
                                    {formatAddress(host.walletAddress)}
                                    <LinkIcon sx={{ ml: 0.5, fontSize: 'inherit' }} />
                                </Link>
                                <Typography variant='body2' sx={{ fontSize: '0.75em' }} className='label'><span className='room-ticker'>{(host.share).toFixed(2)}%</span><br />
                                    {convertToCurrency((host.share / 100 * roomInfo.user_bet), solPrice)}</Typography>
                            </Box>
                        ))}
                </Box>
            )}

        </Box>
    );
};

export default RoomTokenDetails;