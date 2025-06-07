import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Grid,
  useTheme,
  LinearProgress,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { convertToCurrency } from '../../../../util/conversion';
import { formatDistanceToNow } from 'date-fns';

const StatisticsForm = (props) => {
  const {
    creditScore: initialCreditScore = 0,
    gamePlayed,
    totalWagered,
    totalTraded,
    dateJoined,
    last_seen,
    gameProfit,
    tradingProfit,
    message,
    title,
    barStyle,
    color,
    solPrice,
    rank
  } = props;

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // State
  const [creditScore, setCreditScore] = useState(initialCreditScore);
  const [hexagon, setHexagon] = useState(null);

  // Effects
  useEffect(() => {
    if (typeof initialCreditScore === 'number') {
      updateHexagon(initialCreditScore);
    }
  }, [initialCreditScore]);

  useEffect(() => {
    if (typeof props.creditScore === 'number') {
      updateHexagon(props.creditScore);
    }
  }, [props.creditScore]);

  // Helper Functions
  const calculateDashOffset = (score) => {
    if (typeof score !== 'number') return NaN;
    const scalingFactor = 390 / (2000 - 900);
    const invertedScore = 2000 - score;
    return invertedScore * scalingFactor;
  };

  const getHexagonColor = (score) => {
    if (score < 1000) return '#ff0000';
    if (score === 1000) return '#fbbf24';
    return '#10b981';
  };

  const renderProgressHexagon = (score) => {
    if (typeof score !== 'number') return null;
    const dashOffset = calculateDashOffset(score);
    const hexColor = getHexagonColor(score);
    
    return (
      <Box
        sx={{
          width: 80,
          height: 80,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <svg width="80" height="80" viewBox="0 0 120 120">
          <polygon
            points="60,15 105,40 105,80 60,105 15,80 15,40"
            fill="none"
            stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="2"
          />
          <polygon
            points="60,15 105,40 105,80 60,105 15,80 15,40"
            fill="none"
            stroke={hexColor}
            strokeWidth="3"
            strokeDasharray="390"
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 1s ease',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center'
            }}
          />
        </svg>
      </Box>
    );
  };

  const updateHexagon = (score) => {
    setCreditScore(score);
    setHexagon(renderProgressHexagon(score));
  };

  // Rank calculation with modern progress bar
  const getRank = (amount) => {
    const raw = Math.log2(amount + 1) / 1.2;
    const rankFloor = Math.floor(raw) + 1;
    const nextRank = rankFloor + 1;

    const thresholdForThisRank = rankFloor > 1 ? Math.pow(2, 1.2 * (rankFloor - 1)) - 1 : 0;
    const thresholdForNextRank = Math.pow(2, 1.2 * rankFloor) - 1;

    let fraction = (amount - thresholdForThisRank) / (thresholdForNextRank - thresholdForThisRank);
    fraction = Math.max(0, Math.min(1, fraction));
    const percent = (fraction * 100).toFixed(1);

    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff0000' }}>
            Rank {rankFloor}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
            Rank {nextRank}
          </Typography>
        </Box>
        <Box sx={{ position: 'relative' }}>
          <LinearProgress
            variant="determinate"
            value={parseFloat(percent)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #ff0000 0%, #f59e0b 100%)',
                borderRadius: 4,
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            {percent}%
          </Box>
        </Box>
      </Box>
    );
  };

  // Computed Values
  const date_joined = new Date(dateJoined);
  const lastSeen = new Date(last_seen);
  const lastSeenAgo = formatDistanceToNow(lastSeen, { addSuffix: true });
  const roundedCreditScore = Math.ceil(creditScore);

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2.5}>
        {/* Breakdown Section */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.15) 0%, rgba(50, 50, 50, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(248, 250, 252, 0.7) 0%, rgba(255, 255, 255, 0.8) 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}`,
              borderRadius: 2,
              height: 'fit-content'
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 3,
                    height: 18,
                    backgroundColor: '#ff0000',
                    borderRadius: 1.5,
                    mr: 1.5
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: isDarkMode ? '#fff' : '#111827',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.9rem'
                  }}
                >
                  Breakdown
                </Typography>
              </Box>

              <Table size="small">
                <TableBody>
                  <TableRow sx={{ '& td': { border: 'none', py: 1 } }}>
                    <TableCell sx={{ pl: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Last Seen
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#ff0000', 
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}
                      >
                        {lastSeenAgo}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  <TableRow sx={{ '& td': { border: 'none', py: 1.5 } }}>
                    <TableCell sx={{ pl: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Rank Progress
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 0, width: '60%' }}>
                      {getRank(rank)}
                    </TableCell>
                  </TableRow>

                  <TableRow sx={{ '& td': { border: 'none', py: 1.5 } }}>
                    <TableCell sx={{ pl: 0, verticalAlign: 'top', pt: 2 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Spending Status
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 0 }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: isDarkMode 
                            ? 'rgba(0, 0, 0, 0.2)' 
                            : 'rgba(248, 250, 252, 0.5)',
                          border: `1px solid ${color}20`,
                          textAlign: 'center'
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            color: color,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            mb: 1
                          }}
                        >
                          {title}
                        </Typography>
                        
                        <Box sx={{ mb: 1.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={parseInt(barStyle.width)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: barStyle.backgroundColor,
                                borderRadius: 3,
                              }
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: '0.75rem',
                              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                              fontWeight: 500
                            }}
                          >
                            {message}
                          </Typography>
                          <Tooltip
                            title="Calculated using your average wager and All-Time-High"
                            placement="top"
                          >
                            <InfoIcon 
                              sx={{ 
                                fontSize: 12, 
                                color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                                cursor: 'pointer' 
                              }} 
                            />
                          </Tooltip>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Section */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(45, 45, 45, 0.15) 0%, rgba(50, 50, 50, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(248, 250, 252, 0.7) 0%, rgba(255, 255, 255, 0.8) 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'}`,
              borderRadius: 2,
              height: 'fit-content'
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 3,
                    height: 18,
                    backgroundColor: '#ff0000',
                    borderRadius: 1.5,
                    mr: 1.5
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: isDarkMode ? '#fff' : '#111827',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: '0.9rem'
                  }}
                >
                  Performance
                </Typography>
              </Box>

              <Table size="small">
                <TableBody>
                  {[
                    { label: 'Games Played', value: gamePlayed },
                    { label: 'Total Wagered', value: convertToCurrency(totalWagered, solPrice) },
                    { label: 'Total Traded', value: convertToCurrency(totalTraded, solPrice) },
                    { label: 'Game Profit', value: convertToCurrency(gameProfit, solPrice) },
                    { label: 'Trading Profit', value: convertToCurrency(tradingProfit, solPrice) }
                  ].map((row, index) => (
                    <TableRow key={index} sx={{ '& td': { border: 'none', py: 1 } }}>
                      <TableCell sx={{ pl: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                            fontSize: '0.85rem'
                          }}
                        >
                          {row.label}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 0 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#ff0000', 
                            fontWeight: 700,
                            fontSize: '0.9rem'
                          }}
                        >
                          {row.value}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatisticsForm;