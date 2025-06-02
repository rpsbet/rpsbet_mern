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
    Tooltip,
    Grid
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
        if (health > 70) return 'Excellent';
        if (health > 40) return 'Moderate';
        return 'Critical';
    };

    const healthStatus = getHealthStatus(parseFloat(healthPercentage));

    return (
        <Card
            elevation={0}
            sx={{
                mb: 3,
                background: 'rgba(0, 0, 0, 0.15)',
                color: '#fff',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px 24px 0 0',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                '@supports not (backdrop-filter: blur(20px))': {
                    background: 'rgba(0, 0, 0, 0.35)',
                },
            }}
        >
            {/* Room Header */}
            <CardHeader
                avatar={
                    <Box
                        sx={{
                            position: 'relative',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                            border: '2px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        <CardMedia
                            component="img"
                            image={roomInfo.image}
                            alt={roomInfo.name}
                            sx={{
                                width: 72,
                                height: 72,
                                objectFit: 'cover',
                                transition: 'transform 0.3s ease',
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                },
                            }}
                        />
                    </Box>
                }
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography 
                            variant="h5" 
                            sx={{ 
                                fontWeight: 800,
                                fontSize: '1.4rem',
                                letterSpacing: '0.3px',
                            }}
                        >
                            {roomInfo.name}
                        </Typography>
                        <Chip 
                            size="small" 
                            label={roomInfo.ticker} 
                            sx={{
                                backgroundColor: '#f44336',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                letterSpacing: '0.5px',
                                border: '1px solid rgba(244, 67, 54, 0.3)',
                                boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                            }}
                        />
                    </Box>
                }
                subheader={
                    <Typography 
                        variant="body1" 
                        sx={{
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '0.95rem',
                            lineHeight: 1.5,
                            mt: 0.5,
                        }}
                    >
                        {roomInfo.description}
                    </Typography>
                }
                sx={{ 
                    pb: 2,
                    pt: 3,
                    px: 3,
                }}
            />

            <CardContent sx={{ pt: 0, px: 3, pb: 3 }}>
                {/* Social Links */}
                <Box sx={{ mb: 4 }}>
                    <Typography 
                        variant="subtitle2" 
                        sx={{ 
                            fontWeight: 700,
                            mb: 2,
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        Links
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        {roomInfo.x_link && (
                            <Tooltip title="Twitter/X" arrow>
                                <IconButton 
                                    component={Link}
                                    href={roomInfo.x_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ 
                                        color: '#fff',
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        width: 44,
                                        height: 44,
                                        transition: 'all 0.3s ease',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(29, 161, 242, 0.2)',
                                            borderColor: '#1da1f2',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 20px rgba(29, 161, 242, 0.3)',
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={faXTwitter} style={{ fontSize: '18px' }} />
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
                                    sx={{ 
                                        color: '#fff',
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        width: 44,
                                        height: 44,
                                        transition: 'all 0.3s ease',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                            borderColor: '#4caf50',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 20px rgba(76, 175, 80, 0.3)',
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={faGlobe} style={{ fontSize: '18px' }} />
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
                                    sx={{ 
                                        color: '#fff',
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        width: 44,
                                        height: 44,
                                        transition: 'all 0.3s ease',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                            borderColor: '#2196f3',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)',
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={faTelegram} style={{ fontSize: '18px' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Box>

                {/* Health Meter */}
                <Box 
                    sx={{ 
                        mb: 4,
                        p: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                                fontWeight: 700,
                                fontSize: '1rem',
                                letterSpacing: '0.3px',
                            }}
                        >
                            Health
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                                size="small" 
                                label={healthStatus}
                                sx={{ 
                                    backgroundColor: `${healthColor}20`,
                                    color: healthColor,
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    border: `1px solid ${healthColor}40`,
                                }}
                            />
                            <Typography 
                                variant="h6"
                                sx={{ 
                                    fontWeight: 800,
                                    color: healthColor,
                                    fontSize: '1.1rem',
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
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: healthColor,
                                borderRadius: 6,
                                boxShadow: `0 0 12px ${healthColor}40`,
                            }
                        }}
                    />
                </Box>

                {/* Holder Distribution */}
                {hosts && hosts.length > 0 && (
                    <Box>
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                                fontWeight: 700,
                                mb: 3,
                                fontSize: '1rem',
                                letterSpacing: '0.3px',
                            }}
                        >
                            Top Holders ({hosts.length})
                        </Typography>
                        
                        <Box
                            sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                overflow: 'hidden',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            {hosts
                                .sort((a, b) => b.share - a.share)
                                .slice(0, 10)
                                .map((host, index) => (
                                    <Box key={`host-${index}`}>
                                        {index > 0 && (
                                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
                                        )}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 2.5,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                }
                                            }}
                                        >
                                            {/* Rank and Avatar */}
                                            <Box sx={{ display: 'flex', alignItems: 'center',  }}>
                                                <Box
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        gap: 2,
                                                        borderRadius: '8px',
                                                        backgroundColor: index < 3 
                                                            ? index === 0 ? '#ffd700' 
                                                            : index === 1 ? '#c0c0c0' 
                                                            : '#cd7f32'
                                                            : 'rgba(255,255,255,0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem',
                                                        color: index < 3 ? '#000' : '#fff',
                                                    }}
                                                >
                                                    #{index + 1}
                                                </Box>
                                                
                                                {/* <Box 
                                                    onClick={() => handleOpenPlayerModal(host.host)}
                                                    sx={{ 
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.2s ease',
                                                        '&:hover': {
                                                            transform: 'scale(1.05)',
                                                        }
                                                    }}
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
                                                        sx={{
                                                            width: 44,
                                                            height: 44,
                                                            border: '2px solid rgba(255,255,255,0.1)',
                                                        }}
                                                    />
                                                </Box> */}
                                            </Box>

                                            {/* Wallet Address */}
                                            <Box sx={{ flex: 1, }}>
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
                                                            fontSize: '0.8rem',
                                                            textDecoration: 'none',
                                                            fontFamily: 'monospace',
                                                            fontWeight: 600,
                                                            padding: '4px 8px',
                                                            borderRadius: '8px',
                                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                                color: '#fff',
                                                                transform: 'scale(1.02)',
                                                            }
                                                        }}
                                                    >
                                                        {formatAddress(host.walletAddress)}
                                                        <LinkIcon sx={{ fontSize: '14px' }} />
                                                    </Link>
                                                </Tooltip>
                                            </Box>

                                            {/* Share Information */}
                                            <Box sx={{ textAlign: 'right', }}>
                                                <Typography 
                                                    variant="body1" 
                                                    sx={{
                                                        fontWeight: 800,
                                                        color: '#ffa726',
                                                        fontSize: '1rem',
                                                        mb: 0.25,
                                                    }}
                                                >
                                                    {(host.share).toFixed(2)}%
                                                </Typography>
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{
                                                        color: 'rgba(255,255,255,0.6)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
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
            </CardContent>
        </Card>
    );
};

export default RoomTokenDetails;