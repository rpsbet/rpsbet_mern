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
    Card,
    CardHeader,
    CardContent,
    CardMedia,
    Divider,
    Chip,
    Stack,
    LinearProgress,
    IconButton,
    Tooltip
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
        if (health > 70) return '#03ff3b'; // Green for good health
        if (health > 40) return '#ff9800'; // Orange for medium health
        return '#f44336'; // Red for poor health
    };
    
    const healthColor = getHealthColor(parseFloat(healthPercentage));

    return (
        <Card
            elevation={3}
            sx={{
                mb: 2,
                background: 'rgba(0, 0, 0, 0.2)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '16px 16px 0 0',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '@supports not (backdrop-filter: blur(10px))': {
                    background: 'rgba(0, 0, 0, 0.4)',
                },
            }}
        >
            {/* Room Header */}
            <CardHeader
                avatar={
                    <CardMedia
                        component="img"
                        image={roomInfo.image}
                        alt={roomInfo.name}
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '12px',
                            objectFit: 'cover',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                        }}
                    />
                }
                title={
                    <Typography variant="h6" fontWeight="bold">
                        {roomInfo.name} <Chip size="small" color='error' label={roomInfo.ticker} />
                    </Typography>
                }
                subheader={
                    <Typography 
                        variant="body2" 
                        color="rgba(255,255,255,0.7)"
                    >
                        {roomInfo.description}
                    </Typography>
                }
                sx={{ pb: 0 }}
            />

            <CardContent sx={{ pt: 1 }}>
                {/* Social Links */}
                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                    {roomInfo.x_link && (
                        <Tooltip title="Twitter">
                            <IconButton 
                                size="small" 
                                component={Link}
                                href={roomInfo.x_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ 
                                    color: '#fff',
                                    '&:hover': { 
                                        backgroundColor: 'rgba(255,255,255,0.1)' 
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faXTwitter} />
                            </IconButton>
                        </Tooltip>
                    )}
                    
                    {roomInfo.website_link && (
                        <Tooltip title="Website">
                            <IconButton 
                                size="small"
                                component={Link}
                                href={roomInfo.website_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ 
                                    color: '#fff',
                                    '&:hover': { 
                                        backgroundColor: 'rgba(255,255,255,0.1)' 
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faGlobe} />
                            </IconButton>
                        </Tooltip>
                    )}
                    
                    {roomInfo.telegram_link && (
                        <Tooltip title="Telegram">
                            <IconButton 
                                size="small"
                                component={Link}
                                href={roomInfo.telegram_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ 
                                    color: '#fff',
                                    '&:hover': { 
                                        backgroundColor: 'rgba(255,255,255,0.1)' 
                                    }
                                }}
                            >
                                <FontAwesomeIcon icon={faTelegram} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>

                {/* Health Meter */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                            Health
                        </Typography>
                        <Chip 
                            size="small" 
                            label={`${healthPercentage}%`} 
                            sx={{ 
                                backgroundColor: healthColor,
                                color: '#fff',
                                fontWeight: 'bold'
                            }}
                        />
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={parseFloat(healthPercentage)}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: healthColor,
                                borderRadius: 5
                            }
                        }}
                    />
                </Box>

                {/* Holder Distribution */}
                {hosts && hosts.length > 0 && (
                    <>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                            Top Holders
                        </Typography>
                        
                        {hosts
                            .sort((a, b) => b.share - a.share)
                            .slice(0, 10)
                            .map((host, index) => (
                                <React.Fragment key={`host-${index}`}>
                                    {index > 0 && <Divider sx={{ my: 1, opacity: 0.2 }} />}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            py: 1,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                borderRadius: '8px'
                                            }
                                        }}
                                    >
                                        {/* Avatar */}
                                        <Box 
                                            onClick={() => handleOpenPlayerModal(host.host)}
                                            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <Avatar
                                                src={host.avatar}
                                                user_id={host.host}
                                                rank={host.rank}
                                                username={host.username}
                                                accessory={host.accessory}
                                                elite={host.elite}
                                                alt=""
                                                darkMode={true}
                                            />
                                        </Box>

                                        {/* Wallet Address */}
                                        <Tooltip title="View on Solscan">
                                            <Link
                                                href={`https://solscan.io/${host.walletAddress}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                                                    fontSize: '0.75rem',
                                                    textDecoration: 'none',
                                                    '&:hover': {
                                                        textDecoration: 'underline',
                                                        color: isDarkMode ? '#fff' : '#000'
                                                    }
                                                }}
                                            >
                                                {formatAddress(host.walletAddress)}
                                                <LinkIcon sx={{ ml: 0.5, fontSize: '0.875rem' }} />
                                            </Link>
                                        </Tooltip>

                                        {/* Share Information */}
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography 
                                                variant="body2" 
                                                fontWeight="bold"
                                                color="warning"
                                            >
                                                {(host.share).toFixed(2)}%
                                            </Typography>
                                            <Typography 
                                                variant="caption" 
                                                color="rgba(255,255,255,0.6)"
                                            >
                                                {convertToCurrency((host.share / 100 * roomInfo.user_bet), solPrice)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </React.Fragment>
                            ))}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default RoomTokenDetails;