import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
  TextField,
  Alert,
  Divider,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

const ApiDocumentation = () => {
  const isDarkMode = useSelector(state => state.auth.isDarkMode);
  const [activeTab, setActiveTab] = useState(0);
  const [copySuccess, setCopySuccess] = useState('');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const CodeBlock = ({ children, language = 'javascript' }) => (
    <Box
      sx={{
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f8f9fa',
        color: isDarkMode ? '#e6e6e6' : '#2d3748',
        border: `1px solid ${isDarkMode ? '#444' : '#e2e8f0'}`,
        borderRadius: 2,
        p: 2,
        position: 'relative',
        fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
        fontSize: '13px',
        overflow: 'auto',
        maxHeight: '500px',
        lineHeight: 1.5,
        '& .keyword': { color: isDarkMode ? '#ff79c6' : '#d73a49' },
        '& .string': { color: isDarkMode ? '#50fa7b' : '#032f62' },
        '& .comment': { color: isDarkMode ? '#6272a4' : '#6a737d' },
      }}
    >
      <IconButton
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 1,
          color: isDarkMode ? '#e6e6e6' : '#2d3748',
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          '&:hover': {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
          }
        }}
        onClick={() => handleCopy(children)}
        size="small"
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
      <pre 
        style={{ 
          margin: 0, 
          whiteSpace: 'pre-wrap',
          color: 'inherit',
          fontFamily: 'inherit'
        }}
      >
        {children}
      </pre>
    </Box>
  );

  const endpoints = [
    {
      method: 'POST',
      path: '/api/public-api/create-room',
      title: 'Create Game Room',
      description: 'Create a new game room with blockchain deposit handling. This endpoint creates a complete game room with SOL deposit processing.',
      permissions: ['create_room'],
      parameters: [
        { name: 'bet_amount', type: 'number', required: true, description: 'Bet amount in SOL (minimum 0.001)' },
        { name: 'name', type: 'string', required: true, description: 'Game name (3-20 characters)' },
        // { name: 'game_type', type: 'number', required: true, description: 'Game type ID (get from /game-types)' },
        { name: 'connectedAccount', type: 'string', required: true, description: 'Solana wallet address' },
        { name: 'image', type: 'string', required: false, description: 'Game image URL' },
        { name: 'ticker', type: 'string', required: false, description: 'Game ticker symbol (auto-generated if not provided)' },
        { name: 'description', type: 'string', required: false, description: 'Game description' },
        { name: 'is_private', type: 'boolean', required: false, description: 'Private room flag (default: false)' },
        { name: 'privateKey', type: 'string', required: false, description: 'Base58 private key for automated deposit' },
        { name: 'skipDeposit', type: 'boolean', required: false, description: 'Skip deposit for testing (default: false)' }
      ],
      example: `{
  "bet_amount": 0.1,
  "name": "Epic Battle",
  "game_type": 1,
  "connectedAccount": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "image": "https://example.com/image.jpg",
  "ticker": "EPIC",
  "description": "An epic battle game with multipliers",
  "is_private": false,
  "privateKey": "base58_encoded_private_key_here"
}`,
      response: `{
  "success": true,
  "room": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "room_number": 1234,
    "name": "Epic Battle",
    "ticker": "EPIC",
    "bet_amount": 0.095,
    "status": "open",
    "game_type": "Rock Paper Scissors",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "deposit": {
    "success": true,
    "txHash": "5j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o",
    "amount": 0.1,
    "explorerUrl": "https://explorer.solana.com/tx/..."
  },
  "api_usage": {
    "key_id": "ak_1234567890abcdef",
    "usage_count": 1249
  }
}`
    },
    {
      method: 'POST',
      path: '/api/public-api/generate-image',
      title: 'Generate AI Image',
      description: 'Generate high-quality images using DALL-E 3 for game assets, logos, and promotional materials.',
      permissions: ['generate_image'],
      parameters: [
        { name: 'prompt', type: 'string', required: true, description: 'Detailed image generation prompt' },
        { name: 'size', type: 'string', required: false, description: '1024x1024, 1024x1792, or 1792x1024 (default: 1024x1024)' },
        { name: 'quality', type: 'string', required: false, description: 'standard or hd (default: standard)' }
      ],
      example: `{
  "prompt": "A futuristic gaming interface with neon lights and holographic elements, cyberpunk style",
  "size": "1024x1024",
  "quality": "hd"
}`,
      response: `{
  "success": true,
  "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/private/...",
  "originalPrompt": "A futuristic gaming interface with neon lights...",
  "size": "1024x1024",
  "api_usage": {
    "key_id": "ak_1234567890abcdef",
    "usage_count": 1250
  }
}`
    },
    {
      method: 'POST',
      path: '/api/public-api/generate-react',
      title: 'Generate React Game',
      description: 'Generate complete React game components using Claude AI. Creates fully functional games with proper UI components.',
      permissions: ['generate_react'],
      parameters: [
        { name: 'prompt', type: 'string', required: true, description: 'Detailed game description and requirements' },
        { name: 'imageUrls', type: 'array', required: false, description: 'Array of image URLs to include in the game' }
      ],
      example: `{
  "prompt": "Create a dice rolling game with animated dice, multiplier effects, and glassmorphic design",
  "imageUrls": ["https://example.com/dice.png", "https://example.com/background.jpg"]
}`,
      response: `{
  "success": true,
  "finalApp": "const App = () => { /* Complete React component code */ }; export default App;",
  "proxiedAssets": {
    "images": [
      {"key": "image0", "proxiedUrl": "https://example.com/dice.png"},
      {"key": "image1", "proxiedUrl": "https://example.com/background.jpg"}
    ],
    "audio": []
  },
  "api_usage": {
    "key_id": "ak_1234567890abcdef",
    "usage_count": 1251
  }
}`
    },
    {
      method: 'POST',
      path: '/api/public-api/extract-room-info',
      title: 'Extract Game Info',
      description: 'Extract game metadata from React component code. Analyzes code to determine game name, ticker, and description.',
      permissions: ['extract_room_info'],
      parameters: [
        { name: 'gameCode', type: 'string', required: true, description: 'React component code to analyze' }
      ],
      example: `{
  "gameCode": "const App = () => { return <Typography id=\\"game-title\\">Dice Master</Typography>; };"
}`,
      response: `{
  "success": true,
  "name": "Dice Master",
  "ticker": "DICE",
  "description": "A dice-based gaming experience with multipliers",
  "gameTheme": "dice game",
  "confidence": 0.95,
  "api_usage": {
    "key_id": "ak_1234567890abcdef",
    "usage_count": 1252
  }
}`
    },
//     {
//       method: 'GET',
//       path: '/api/public-api/game-types',
//       title: 'Get Game Types',
//       description: 'List all available game types with their IDs and descriptions.',
//       permissions: [],
//       parameters: [],
//       example: 'No request body required for GET requests',
//       response: `{
//   "success": true,
//   "gameTypes": [
//     {
//       "game_type_id": 1,
//       "game_type_name": "Rock Paper Scissors",
//       "short_name": "RPS",
//       "description": "Classic rock paper scissors game"
//     },
//     {
//       "game_type_id": 2,
//       "game_type_name": "Dice Battle",
//       "short_name": "DICE",
//       "description": "Dice rolling competition game"
//     }
//   ]
// }`
//     },
    {
      method: 'GET',
      path: '/api/public-api/info',
      title: 'API Information',
      description: 'Get basic information about the API, including version and available endpoints.',
      permissions: [],
      parameters: [],
      example: 'No request body required for GET requests',
      response: `{
  "success": true,
  "api": {
    "name": "Game Creation API",
    "version": "1.0.0",
    "endpoints": {
      "POST /create-room": "Create a new game room with blockchain deposit",
      "POST /generate-image": "Generate AI images for games",
      "POST /generate-react": "Generate React game components",
      "POST /extract-room-info": "Extract information from game code",
    },
    "authentication": "API Key required in X-API-Key header",
    "rateLimit": {
      "default": "100 requests/hour, 1000 requests/day",
      "customizable": true
    }
  }
}`
    }
  ];

  const rateLimits = [
    { limit: '100 requests/hour', description: 'Default hourly rate limit per API key' },
    { limit: '1000 requests/day', description: 'Default daily limit per API key' },
    { limit: 'Customizable', description: 'Elite users can request higher limits' }
  ];

  const errorCodes = [
    { code: 400, name: 'Bad Request', description: 'Invalid request parameters or missing required fields' },
    { code: 401, name: 'Unauthorized', description: 'Invalid or missing API key in X-API-Key header' },
    { code: 403, name: 'Forbidden', description: 'Insufficient permissions or not Elite member' },
    { code: 429, name: 'Too Many Requests', description: 'Rate limit exceeded - wait for reset' },
    { code: 500, name: 'Internal Server Error', description: 'Server error occurred - contact support' }
  ];

  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://catsino.fun' 
    : `http://${window.location.hostname}:5001`;

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 3 }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(255, 48, 48, 0.15), rgba(20, 20, 25, 0.95))' 
            : 'linear-gradient(135deg, rgba(255, 48, 48, 0.1), rgba(255, 255, 255, 0.95))',
          border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.2)'}`,
          borderRadius: 2,
          color: isDarkMode ? '#ffffff' : '#000000'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ApiIcon sx={{ fontSize: 40, color: '#ff3030', mr: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: isDarkMode ? '#fff' : '#333' }}>
            Game Creation API
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ color: isDarkMode ? '#e0e0e0' : '#666', mb: 3 }}>
          Build games, generate content, and create experiences with our powerful API
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.15)' : 'rgba(255, 48, 48, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.1)'}`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <CodeIcon sx={{ fontSize: 30, color: '#ff3030', mb: 1 }} />
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>v1.0.0</Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>Current Version</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.15)' : 'rgba(255, 48, 48, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.1)'}`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <SecurityIcon sx={{ fontSize: 30, color: '#ff3030', mb: 1 }} />
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>Secure</Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>API Key Authentication</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.15)' : 'rgba(255, 48, 48, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.1)'}`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <SpeedIcon sx={{ fontSize: 30, color: '#ff3030', mb: 1 }} />
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>Fast</Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>Low Latency Responses</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper 
        elevation={1} 
        sx={{ 
          mb: 3,
          bgcolor: isDarkMode ? '#1a1a1a' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          textColor="inherit"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: isDarkMode ? '#ccc' : '#666',
              fontWeight: 500,
              '&.Mui-selected': { color: '#ff3030', fontWeight: 600 }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#ff3030' }
          }}
        >
          <Tab label="Getting Started" />
          <Tab label="Authentication" />
          <Tab label="Endpoints" />
          <Tab label="Rate Limits" />
          <Tab label="Error Codes" />
          <Tab label="Examples" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3,
          bgcolor: isDarkMode ? '#1a1a1a' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
          color: isDarkMode ? '#ffffff' : '#000000'
        }}
      >
        {/* Getting Started */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Getting Started</Typography>
            
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3,
                bgcolor: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
                color: isDarkMode ? '#90caf9' : '#1976d2',
                border: `1px solid ${isDarkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)'}`
              }}
            >
              <Typography variant="body1">
                <strong>Prerequisites:</strong> You need an Elite membership to generate API keys. Visit Account Settings → Developer tab to create your first API key.
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Quick Start Guide</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                <strong>1.</strong> Navigate to Account Settings → Developer tab
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                <strong>2.</strong> Click "Generate New Key" and select required permissions
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                <strong>3.</strong> Copy your API key (shown only once - store it securely!)
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                <strong>4.</strong> Include the key in your requests using the X-API-Key header
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Base URL</Typography>
            <CodeBlock>{baseUrl}/api/public-api</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Your First Request</Typography>
            <CodeBlock>{`curl -X GET "${baseUrl}/api/public-api/info" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json"`}</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>API Key Format</Typography>
            <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
              API keys follow the format: <code style={{ color: isDarkMode ? '#ff79c6' : '#d73a49' }}>keyId.secret</code>
            </Typography>
            <CodeBlock>ak_1234567890abcdef.a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6</CodeBlock>
          </Box>
        )}

        {/* Authentication */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Authentication</Typography>
            
            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>API Key Headers</Typography>
            <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
              Include your API key in the request header using one of these methods:
            </Typography>
            <CodeBlock>{`// Primary method (recommended)
X-API-Key: your_full_api_key_here

// Alternative method (Bearer token)
Authorization: Bearer your_full_api_key_here`}</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Required Headers</Typography>
            <CodeBlock>{`Content-Type: application/json
X-API-Key: ak_1234567890abcdef.your_secret_key_here`}</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Permissions</Typography>
            <Grid container spacing={2}>
              {[
                { perm: 'create_room', desc: 'Create new game rooms with SOL deposits and blockchain transactions' },
                { perm: 'generate_image', desc: 'Generate AI images using DALL-E 3 for game assets and promotional content' },
                { perm: 'generate_react', desc: 'Generate complete React game components using Claude AI with advanced game logic' },
                { perm: 'extract_room_info', desc: 'Extract metadata and game information from React component code' }
              ].map((item) => (
                <Grid item xs={12} sm={6} key={item.perm}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
                      border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`
                    }}
                  >
                    <CardContent>
                      <Chip 
                        label={item.perm} 
                        color="primary" 
                        sx={{ 
                          mb: 1,
                          bgcolor: '#ff3030',
                          color: '#fff'
                        }} 
                      />
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                        {item.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Alert 
              severity="warning" 
              sx={{ 
                mt: 3,
                bgcolor: isDarkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
                color: isDarkMode ? '#ffb74d' : '#f57c00',
                border: `1px solid ${isDarkMode ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)'}`
              }}
            >
              <Typography variant="body1">
                <strong>Security Note:</strong> Never expose your API keys in client-side code. Always use them from secure server environments.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Endpoints */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>API Endpoints</Typography>
            
            {endpoints.map((endpoint, index) => (
              <Accordion 
                key={index} 
                sx={{ 
                  mb: 2,
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
                  border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
                  '&.Mui-expanded': {
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f5f5f5'
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: isDarkMode ? '#fff' : '#333' }} />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Chip 
                      label={endpoint.method}
                      color={endpoint.method === 'GET' ? 'success' : 'primary'}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        ...(endpoint.method === 'POST' && { bgcolor: '#ff3030', color: '#fff' })
                      }}
                    />
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>{endpoint.path}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    {endpoint.permissions.map((perm) => (
                      <Chip 
                        key={perm} 
                        label={perm} 
                        size="small" 
                        variant="outlined" 
                        sx={{
                          borderColor: isDarkMode ? '#666' : '#ccc',
                          color: isDarkMode ? '#ccc' : '#666'
                        }}
                      />
                    ))}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                    {endpoint.description}
                  </Typography>

                  {endpoint.parameters.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Parameters</Typography>
                      <TableContainer 
                        component={Paper} 
                        variant="outlined" 
                        sx={{ 
                          mb: 3,
                          bgcolor: isDarkMode ? '#0a0a0a' : '#fff',
                          border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }}>
                              <TableCell sx={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 600 }}>Parameter</TableCell>
                              <TableCell sx={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 600 }}>Type</TableCell>
                              <TableCell sx={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 600 }}>Required</TableCell>
                              <TableCell sx={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 600 }}>Description</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {endpoint.parameters.map((param) => (
                              <TableRow key={param.name} sx={{ '&:nth-of-type(odd)': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' } }}>
                                <TableCell sx={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>
                                  <code style={{ 
                                    color: isDarkMode ? '#ff79c6' : '#d73a49',
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                    padding: '2px 4px',
                                    borderRadius: '3px'
                                  }}>
                                    {param.name}
                                  </code>
                                </TableCell>
                                <TableCell sx={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>{param.type}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={param.required ? 'Required' : 'Optional'}
                                    color={param.required ? 'error' : 'default'}
                                    size="small"
                                    sx={{
                                      fontSize: '11px',
                                      height: '20px'
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>{param.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}

                  <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Request Example</Typography>
                  <CodeBlock>{endpoint.example}</CodeBlock>

                  <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Response Example</Typography>
                  <CodeBlock>{endpoint.response}</CodeBlock>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Rate Limits */}
        {activeTab === 3 && (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Rate Limits</Typography>
            
            <Alert 
              severity="warning" 
              sx={{ 
                mb: 3,
                bgcolor: isDarkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
                color: isDarkMode ? '#ffb74d' : '#f57c00',
                border: `1px solid ${isDarkMode ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)'}`
              }}
            >
              Rate limits are enforced per API key. Exceeding limits will result in 429 Too Many Requests errors.
            </Alert>

            <Grid container spacing={3}>
              {rateLimits.map((limit, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Card sx={{
                    bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.1)' : 'rgba(255, 48, 48, 0.05)',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.2)'}`,
                    height: '100%'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ color: '#ff3030', fontWeight: 600 }} gutterBottom>
                        {limit.limit}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                        {limit.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 4 }}>Response Headers</Typography>
            <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
              Rate limit information is included in response headers:
            </Typography>
            <CodeBlock>{`X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Limit: 100`}</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Handling Rate Limits</Typography>
            <CodeBlock>{`// JavaScript example
async function makeAPIRequest(endpoint, data) {
  try {
    const response = await fetch('${baseUrl}/api/public-api' + endpoint, {
      method: 'POST',
      headers: {
        'X-API-Key': 'your_api_key_here',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (response.status === 429) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const waitTime = (resetTime * 1000) - Date.now();
      console.log(\`Rate limited. Waiting \${waitTime}ms before retry...\`);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return makeAPIRequest(endpoint, data);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}`}</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Custom Rate Limits</Typography>
            <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
              Elite members can request custom rate limits for high-volume applications. Contact support with your use case and expected request volume.
            </Typography>
          </Box>
        )}

        {/* Error Codes */}
        {activeTab === 4 && (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Error Codes</Typography>
            
            <TableContainer 
              component={Paper} 
              variant="outlined"
              sx={{
                bgcolor: isDarkMode ? '#0a0a0a' : '#fff',
                border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: isDarkMode ? '#1a1a1a' : '#f5f5f5' }}>
                    <TableCell sx={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 600 }}>Code</TableCell>
                    <TableCell sx={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ color: isDarkMode ? '#fff' : '#333', fontWeight: 600 }}>Resolution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errorCodes.map((error) => (
                    <TableRow 
                      key={error.code}
                      sx={{ 
                        '&:nth-of-type(odd)': { 
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' 
                        } 
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={error.code}
                          color={error.code >= 500 ? 'error' : error.code >= 400 ? 'warning' : 'success'}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>
                        <strong>{error.name}</strong>
                      </TableCell>
                      <TableCell sx={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>{error.description}</TableCell>
                      <TableCell sx={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>
                        {error.code === 401 && 'Check your API key format and validity'}
                        {error.code === 403 && 'Verify your permissions and Elite membership status'}
                        {error.code === 429 && 'Wait for rate limit reset or upgrade limits'}
                        {error.code === 400 && 'Validate all required parameters and data types'}
                        {error.code === 500 && 'Retry request or contact support if persistent'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 4 }}>Error Response Format</Typography>
            <CodeBlock>{`{
  "success": false,
  "error": "Invalid API key format",
  "message": "Please provide a valid API key in X-API-Key header",
  "code": 401,
  "timestamp": "2024-01-15T10:30:00Z"
}`}</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Common Error Scenarios</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
                  border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333', mb: 2 }}>
                      Authentication Errors
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      • Missing X-API-Key header<br/>
                      • Invalid key format<br/>
                      • Expired or revoked key<br/>
                      • Non-Elite user attempting access
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{
                  bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
                  border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333', mb: 2 }}>
                      Request Errors
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      • Missing required parameters<br/>
                      • Invalid data types<br/>
                      • Insufficient balance for deposits<br/>
                      • Invalid wallet addresses
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Examples */}
        {activeTab === 5 && (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Code Examples</Typography>
            
            <Accordion 
              sx={{ 
                mb: 2,
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
                border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: isDarkMode ? '#fff' : '#333' }} />}>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>JavaScript/Node.js</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CodeBlock>{`const axios = require('axios');

class CatsinoGameAPI {
  constructor(apiKey, baseUrl = '${baseUrl}') {
    this.apiKey = apiKey;
    this.baseURL = \`\${baseUrl}/api/public-api\`;
    this.headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  // Create a new game room with SOL deposit
  async createRoom(roomData) {
    try {
      const response = await axios.post(\`\${this.baseURL}/create-room\`, roomData, {
        headers: this.headers
      });
      
      if (response.data.success) {
        console.log('Room created:', response.data.room);
        console.log('Deposit transaction:', response.data.deposit);
        return response.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      if (error.response?.status === 429) {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        throw new Error(\`Rate limited. Resets at: \${new Date(resetTime * 1000)}\`);
      }
      throw new Error(\`API Error: \${error.response?.data?.error || error.message}\`);
    }
  }

  // Generate AI image for game assets
  async generateImage(prompt, options = {}) {
    const data = {
      prompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard'
    };

    try {
      const response = await axios.post(\`\${this.baseURL}/generate-image\`, data, {
        headers: this.headers
      });
      
      return response.data.imageUrl;
    } catch (error) {
      if (error.response?.data?.error?.includes('content_policy_violation')) {
        throw new Error('Image prompt violates content policy');
      }
      throw new Error(\`Image generation failed: \${error.response?.data?.error || error.message}\`);
    }
  }

  // Generate React game component
  async generateReactGame(prompt, imageUrls = []) {
    const data = { prompt, imageUrls };

    try {
      const response = await axios.post(\`\${this.baseURL}/generate-react\`, data, {
        headers: this.headers
      });
      
      return {
        gameCode: response.data.finalApp,
        assets: response.data.proxiedAssets
      };
    } catch (error) {
      throw new Error(\`React generation failed: \${error.response?.data?.error || error.message}\`);
    }
  }

  // Extract game information from code
  async extractGameInfo(gameCode) {
    try {
      const response = await axios.post(\`\${this.baseURL}/extract-room-info\`, {
        gameCode
      }, { headers: this.headers });
      
      return response.data;
    } catch (error) {
      throw new Error(\`Extraction failed: \${error.response?.data?.error || error.message}\`);
    }
  }

  // Get available game types
  async getGameTypes() {
    try {
      const response = await axios.get(\`\${this.baseURL}/game-types\`, {
        headers: this.headers
      });
      
      return response.data.gameTypes;
    } catch (error) {
      throw new Error(\`Failed to get game types: \${error.response?.data?.error || error.message}\`);
    }
  }
}

// Usage example
const api = new CatsinoGameAPI('your_api_key_here');

async function createGameExample() {
  try {
    // First, get available game types
    const gameTypes = await api.getGameTypes();
    console.log('Available game types:', gameTypes);

    // Create a new room
    const roomResult = await api.createRoom({
      bet_amount: 0.1,
      name: 'Epic Battle',
      game_type: 1,
      connectedAccount: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      description: 'An epic multiplayer battle game',
      is_private: false,
      privateKey: 'your_base58_private_key_for_automated_deposit'
    });

    console.log('Room created successfully:', roomResult.room);
    console.log('Blockchain transaction:', roomResult.deposit.txHash);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createGameExample();`}</CodeBlock>
              </AccordionDetails>
            </Accordion>

            <Accordion 
              sx={{ 
                mb: 2,
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
                border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: isDarkMode ? '#fff' : '#333' }} />}>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>Python</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CodeBlock>{`import requests
import json
import time
from typing import Dict, List, Optional

class CatsinoGameAPI:
    def __init__(self, api_key: str, base_url: str = '${baseUrl}'):
        self.api_key = api_key
        self.base_url = f'{base_url}/api/public-api'
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def _handle_response(self, response: requests.Response) -> Dict:
        """Handle API response with error checking"""
        if response.status_code == 429:
            reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
            wait_time = reset_time - int(time.time())
            raise Exception(f'Rate limit exceeded. Wait {wait_time} seconds.')
        
        response.raise_for_status()
        return response.json()
    
    def create_room(self, room_data: Dict) -> Dict:
        """Create a new game room with SOL deposit"""
        response = requests.post(
            f'{self.base_url}/create-room',
            headers=self.headers,
            json=room_data
        )
        
        result = self._handle_response(response)
        
        if result['success']:
            print(f"Room created: {result['room']['name']}")
            print(f"Transaction hash: {result['deposit']['txHash']}")
            return result
        else:
            raise Exception(result['error'])
    
    def generate_image(self, prompt: str, size: str = '1024x1024', quality: str = 'standard') -> str:
        """Generate AI image using DALL-E 3"""
        data = {
            'prompt': prompt,
            'size': size,
            'quality': quality
        }
        
        response = requests.post(
            f'{self.base_url}/generate-image',
            headers=self.headers,
            json=data
        )
        
        result = self._handle_response(response)
        
        if result['success']:
            return result['imageUrl']
        else:
            raise Exception(result['error'])
    
    def generate_react_game(self, prompt: str, image_urls: Optional[List[str]] = None) -> Dict:
        """Generate React game component"""
        data = {
            'prompt': prompt,
            'imageUrls': image_urls or []
        }
        
        response = requests.post(
            f'{self.base_url}/generate-react',
            headers=self.headers,
            json=data
        )
        
        result = self._handle_response(response)
        
        if result['success']:
            return {
                'game_code': result['finalApp'],
                'assets': result['proxiedAssets']
            }
        else:
            raise Exception(result['error'])
    
    def extract_game_info(self, game_code: str) -> Dict:
        """Extract game metadata from React code"""
        data = {'gameCode': game_code}
        
        response = requests.post(
            f'{self.base_url}/extract-room-info',
            headers=self.headers,
            json=data
        )
        
        result = self._handle_response(response)
        
        if result['success']:
            return {
                'name': result['name'],
                'ticker': result['ticker'],
                'description': result['description'],
                'theme': result['gameTheme'],
                'confidence': result['confidence']
            }
        else:
            raise Exception(result['error'])
    
    def get_game_types(self) -> List[Dict]:
        """Get available game types"""
        response = requests.get(
            f'{self.base_url}/game-types',
            headers=self.headers
        )
        
        result = self._handle_response(response)
        return result['gameTypes']

# Usage example
def main():
    api = CatsinoGameAPI('your_api_key_here')
    
    try:
        # Get game types
        game_types = api.get_game_types()
        print("Available game types:")
        for gt in game_types:
            print(f"  {gt['game_type_id']}: {gt['game_type_name']}")
        
        # Generate a game image
        image_url = api.generate_image(
            "A futuristic dice with neon glow effects",
            size="1024x1024",
            quality="hd"
        )
        print(f"Generated image: {image_url}")
        
        # Create a room
        room_result = api.create_room({
            'bet_amount': 0.05,
            'name': 'Python Game',
            'game_type': 1,
            'connectedAccount': '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
            'image': image_url,
            'description': 'A game created with Python API',
            'is_private': False
        })
        
        print(f"Room created successfully: {room_result['room']['room_number']}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()`}</CodeBlock>
              </AccordionDetails>
            </Accordion>

            <Accordion
              sx={{ 
                mb: 2,
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
                border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: isDarkMode ? '#fff' : '#333' }} />}>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>cURL Examples</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CodeBlock>{`# Get API information
curl -X GET "${baseUrl}/api/public-api/info" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json"

# Get available game types
curl -X GET "${baseUrl}/api/public-api/game-types" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json"

# Create a game room with automated deposit
curl -X POST "${baseUrl}/api/public-api/create-room" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bet_amount": 0.1,
    "name": "cURL Game",
    "game_type": 1,
    "connectedAccount": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "description": "Game created via cURL",
    "privateKey": "your_base58_private_key_here",
    "is_private": false
  }'

# Generate an AI image
curl -X POST "${baseUrl}/api/public-api/generate-image" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A futuristic game interface with holographic elements",
    "size": "1024x1024",
    "quality": "hd"
  }'

# Generate a React game component
curl -X POST "${baseUrl}/api/public-api/generate-react" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Create a slot machine game with 3 reels and win animations",
    "imageUrls": ["https://example.com/cherry.png", "https://example.com/bell.png"]
  }'

# Extract game information from code
curl -X POST "${baseUrl}/api/public-api/extract-room-info" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gameCode": "const App = () => { return <Typography id=\"game-title\">Mega Slots</Typography>; };"
  }'

# Handle rate limiting with retry
curl -X POST "${baseUrl}/api/public-api/create-room" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -w "HTTP Status: %{http_code}\\nRate Limit Remaining: %{header_json}[X-RateLimit-Remaining]\\n" \\
  -d '{
    "bet_amount": 0.05,
    "name": "Test Room",
    "game_type": 1,
    "connectedAccount": "wallet_address_here"
  }'`}</CodeBlock>
              </AccordionDetails>
            </Accordion>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Integration Tips</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{
                  bgcolor: isDarkMode ? 'rgba(0, 255, 0, 0.1)' : 'rgba(0, 255, 0, 0.05)',
                  border: `1px solid ${isDarkMode ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 255, 0, 0.2)'}`,
                  height: '100%'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#4caf50' : '#2e7d32', mb: 2 }}>
                      Best Practices
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      • Store API keys securely (environment variables)<br/>
                      • Implement proper error handling and retries<br/>
                      • Monitor rate limits in response headers<br/>
                      • Use webhooks for real-time game events<br/>
                      • Validate all user inputs before API calls
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{
                  bgcolor: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
                  border: `1px solid ${isDarkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)'}`,
                  height: '100%'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#2196f3' : '#1976d2', mb: 2 }}>
                      Security Notes
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      • Never expose API keys in frontend code<br/>
                      • Use HTTPS for all API requests<br/>
                      • Implement IP whitelisting when possible<br/>
                      • Rotate API keys regularly<br/>
                      • Monitor usage patterns for anomalies
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Copy Success Notification */}
      {copySuccess && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            backgroundColor: '#10b981',
            color: 'white',
            p: 2,
            borderRadius: 2,
            zIndex: 2000,
            boxShadow: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <ContentCopyIcon fontSize="small" />
          {copySuccess}
        </Box>
      )}
    </Box>
  );
};

export default ApiDocumentation;