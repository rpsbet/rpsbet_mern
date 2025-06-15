import React from 'react';
import Avatar from '../components/Avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { convertToCurrency } from '../util/conversion';
import {
    Box,
    Typography,
    Link,
    Divider,
    Chip,
    Stack,
    LinearProgress,
    IconButton,
    Tooltip,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';

/**
 * RoomTokenDetails Component
 * 
 * Displays detailed information about a token room including health metrics,
 * holder distribution, and relevant links in dark mode.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.roomInfo - Information about the room
 * @param {Array} props.hosts - List of token holders
 * @param {number} props.solPrice - Current SOL price
 * @param {Function} props.handleOpenPlayerModal - Function to open player modal
 * @param {number} props.progressPercentage - Health percentage of the token
 */
const RoomTokenDetails = ({ 
    roomInfo, 
    hosts, 
    solPrice, 
    handleOpenPlayerModal, 
    progressPercentage,
    isDarkMode = true // Default to dark mode
}) => {
    // Format wallet address to display in shortened form
    const formatAddress = (address) => {
        return address.slice(0, 4) + '...' + address.slice(-4);
    };

    // Calculate health percentage (inverted from progress)
    const healthPercentage = (100 - progressPercentage).toFixed(0);
    
    // Determine health status color based on percentage
    const getHealthColor = (health) => {
        if (health > 70) return '#4caf50'; // Green for good health
        if (health > 40) return '#ff9800'; // Orange for medium health
        return '#f44336'; // Red for poor health
    };
    
    const healthColor = getHealthColor(parseFloat(healthPercentage));

    // Get health status text
    const getHealthStatus = (health) => {
        if (health > 70) return 'Good';
        if (health > 40) return 'OK';
        return 'Low';
    };

    const healthStatus = getHealthStatus(parseFloat(healthPercentage));

    return (
        <Box
            sx={{
                mb: 2,
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
            }}
        >
            {/* Room Header */}
            <Box sx={{ padding: '16px' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                    <Box
                        sx={{
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            flexShrink: 0,
                        }}
                    >
                        <img
                            src={roomInfo.image}
                            alt={roomInfo.name}
                            style={{
                                width: 48,
                                height: 48,
                                objectFit: 'cover',
                            }}
                        />
                    </Box>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    color: '#fff',
                                }}
                            >
                                {roomInfo.name}
                            </Typography>
                            <Chip 
                                size="small" 
                                label={roomInfo.ticker} 
                                sx={{
                                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                                    color: '#ff0000',
                                    fontWeight: 600,
                                    fontSize: '0.65rem',
                                    height: '20px',
                                    border: '1px solid rgba(255, 0, 0, 0.3)',
                                    '& .MuiChip-label': {
                                        padding: '0 6px',
                                    },
                                }}
                            />
                        </Box>
                        <Typography 
                            variant="body2" 
                            sx={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.8rem',
                                lineHeight: 1.4,
                            }}
                        >
                            {roomInfo.description}
                        </Typography>
                    </Box>
                </Box>

                {/* Social Links */}
                <Box sx={{ mb: 3 }}>
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            fontWeight: 600,
                            mb: 1,
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'block',
                        }}
                    >
                        Links
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        {roomInfo.x_link && (
                            <Tooltip title="Twitter/X" arrow>
                                <IconButton 
                                    component={Link}
                                    href={roomInfo.x_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{ 
                                        color: '#fff',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        width: 32,
                                        height: 32,
                                        transition: 'all 0.2s ease',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(29, 161, 242, 0.2)',
                                            borderColor: '#1da1f2',
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={faXTwitter} style={{ fontSize: '12px' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        
                        {roomInfo.website_link && (
                            <Tooltip title="Website" arrow>
                                <IconButton 
                                    component={Link}
                                    href={roomInfo.website_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{ 
                                        color: '#fff',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        width: 32,
                                        height: 32,
                                        transition: 'all 0.2s ease',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                            borderColor: '#4caf50',
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '12px' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        
                        {roomInfo.telegram_link && (
                            <Tooltip title="Telegram" arrow>
                                <IconButton 
                                    component={Link}
                                    href={roomInfo.telegram_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                    sx={{ 
                                        color: '#fff',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        width: 32,
                                        height: 32,
                                        transition: 'all 0.2s ease',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                            borderColor: '#2196f3',
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTelegram} style={{ fontSize: '12px' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Box>

                {/* Health Meter */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                color: 'rgba(255,255,255,0.6)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Health
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                                variant="caption"
                                sx={{ 
                                    fontWeight: 600,
                                    color: healthColor,
                                    fontSize: '0.7rem',
                                }}
                            >
                                {healthStatus}
                            </Typography>
                            <Typography 
                                variant="body2"
                                sx={{ 
                                    fontWeight: 700,
                                    color: healthColor,
                                    fontSize: '0.8rem',
                                }}
                            >
                                {healthPercentage}%
                            </Typography>
                        </Box>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={parseFloat(healthPercentage)}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: healthColor,
                                borderRadius: 3,
                            }
                        }}
                    />
                </Box>

                {/* Holder Distribution */}
                {hosts && hosts.length > 0 && (
                    <Box>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                fontWeight: 600,
                                mb: 1,
                                fontSize: '0.7rem',
                                color: 'rgba(255,255,255,0.6)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'block',
                            }}
                        >
                            Top Holders ({hosts.length})
                        </Typography>
                        
                        <Box
                            sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                overflow: 'hidden',
                            }}
                        >
                            {hosts
                                .sort((a, b) => b.share - a.share)
                                .slice(0, 10)
                                .map((host, index) => (
                                    <Box key={`host-${index}`}>
                                        {index > 0 && (
                                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                                        )}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 1.5,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255,255,255,0.02)',
                                                }
                                            }}
                                        >
                                            {/* Rank */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box
                                                    sx={{
                                                        width: 24,
                                                        height: 24,
                                                        borderRadius: '4px',
                                                        backgroundColor: index < 3 
                                                            ? index === 0 ? '#ffd700' 
                                                            : index === 1 ? '#c0c0c0' 
                                                            : '#cd7f32'
                                                            : 'rgba(255,255,255,0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 600,
                                                        fontSize: '0.7rem',
                                                        color: index < 3 ? '#000' : '#fff',
                                                    }}
                                                >
                                                    {index + 1}
                                                </Box>
                                                
                                                {/* Wallet Address */}
                                                <Tooltip title="View on Solscan" arrow>
                                                    <Link
                                                        href={`https://solscan.io/${host.walletAddress}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        sx={{ 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            color: 'rgba(255,255,255,0.7)',
                                                            fontSize: '0.7rem',
                                                            textDecoration: 'none',
                                                            fontFamily: 'monospace',
                                                            fontWeight: 500,
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                                color: '#fff',
                                                            }
                                                        }}
                                                    >
                                                        {formatAddress(host.walletAddress)}
                                                        <LinkIcon sx={{ fontSize: '10px' }} />
                                                    </Link>
                                                </Tooltip>
                                            </Box>

                                            {/* Share Information */}
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: '#ffa726',
                                                        fontSize: '0.75rem',
                                                        mb: 0.25,
                                                    }}
                                                >
                                                    {(host.share).toFixed(2)}%
                                                </Typography>
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.5)',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {convertToCurrency((host.share / 100 * roomInfo.user_bet), solPrice)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default RoomTokenDetails;