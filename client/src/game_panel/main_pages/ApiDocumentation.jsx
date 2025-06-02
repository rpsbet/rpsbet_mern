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
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 1,
        p: 2,
        position: 'relative',
        fontFamily: 'monospace',
        fontSize: '14px',
        overflow: 'auto',
        maxHeight: '400px'
      }}
    >
      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1
        }}
        onClick={() => handleCopy(children)}
        size="small"
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{children}</pre>
    </Box>
  );

  const endpoints = [
    {
      method: 'POST',
      path: '/api/public-api/create-room',
      title: 'Create Game Room',
      description: 'Create a new game room with blockchain deposit handling',
      permissions: ['create_room'],
      parameters: [
        { name: 'bet_amount', type: 'number', required: true, description: 'Bet amount in SOL (minimum 0.001)' },
        { name: 'name', type: 'string', required: true, description: 'Game name (3-20 characters)' },
        { name: 'game_type', type: 'number', required: true, description: 'Game type ID' },
        { name: 'connectedAccount', type: 'string', required: true, description: 'Wallet address' },
        { name: 'image', type: 'string', required: false, description: 'Game image URL' },
        { name: 'ticker', type: 'string', required: false, description: 'Game ticker symbol' },
        { name: 'description', type: 'string', required: false, description: 'Game description' },
        { name: 'is_private', type: 'boolean', required: false, description: 'Private room flag' },
        { name: 'skipDeposit', type: 'boolean', required: false, description: 'Skip deposit for testing' }
      ],
      example: `{
  "bet_amount": 0.1,
  "name": "Epic Battle",
  "game_type": 1,
  "connectedAccount": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "image": "https://example.com/image.jpg",
  "ticker": "EPIC",
  "description": "An epic battle game",
  "is_private": false
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
    "txHash": "transaction_hash_here"
  },
  "api_usage": {
    "key_id": "ak_1234567890abcdef",
    "usage_count": 1248
  }
}`
    },
    {
      method: 'POST',
      path: '/api/public-api/generate-image',
      title: 'Generate AI Image',
      description: 'Generate images using DALL-E 3 for game assets',
      permissions: ['generate_image'],
      parameters: [
        { name: 'prompt', type: 'string', required: true, description: 'Image generation prompt' },
        { name: 'size', type: 'string', required: false, description: '1024x1024, 1024x1792, or 1792x1024' },
        { name: 'quality', type: 'string', required: false, description: 'standard or hd' }
      ],
      example: `{
  "prompt": "A futuristic gaming interface with neon lights",
  "size": "1024x1024",
  "quality": "hd"
}`,
      response: `{
  "success": true,
  "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
  "originalPrompt": "A futuristic gaming interface with neon lights",
  "size": "1024x1024",
  "api_usage": {
    "key_id": "ak_1234567890abcdef",
    "usage_count": 1249
  }
}`
    },
    {
      method: 'POST',
      path: '/api/public-api/generate-react',
      title: 'Generate React Game',
      description: 'Generate complete React game components using Claude AI',
      permissions: ['generate_react'],
      parameters: [
        { name: 'prompt', type: 'string', required: true, description: 'Game description and requirements' },
        { name: 'imageUrls', type: 'array', required: false, description: 'Array of image URLs to include' }
      ],
      example: `{
  "prompt": "Create a dice rolling game with multipliers",
  "imageUrls": ["https://example.com/dice.png"]
}`,
      response: `{
  "success": true,
  "finalApp": "const App = () => { /* React component code */ }; export default App;",
  "proxiedAssets": {
    "images": [{"key": "image0", "proxiedUrl": "https://example.com/dice.png"}],
    "audio": []
  },
  "api_usage": {
    "key_id": "ak_1234567890abcdef",
    "usage_count": 1250
  }
}`
    },
    {
      method: 'POST',
      path: '/api/public-api/extract-room-info',
      title: 'Extract Game Info',
      description: 'Extract game information from React component code',
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
  "description": "A dice-based gaming experience",
  "gameTheme": "dice game",
  "confidence": 0.95,
  "api_usage": {
    "key_id": "ak_1234567890abcdef",
    "usage_count": 1251
  }
}`
    },
    {
      method: 'GET',
      path: '/api/public-api/game-types',
      title: 'Get Game Types',
      description: 'List all available game types',
      permissions: [],
      parameters: [],
      example: 'No request body required',
      response: `{
  "success": true,
  "gameTypes": [
    {
      "game_type_id": 1,
      "game_type_name": "Rock Paper Scissors",
      "short_name": "RPS",
      "description": "Classic rock paper scissors game"
    }
  ]
}`
    }
  ];

  const rateLimits = [
    { limit: '100 requests/hour', description: 'Default rate limit per API key' },
    { limit: '1000 requests/day', description: 'Default daily limit per API key' },
    { limit: 'Customizable', description: 'Elite users can request custom limits' }
  ];

  const errorCodes = [
    { code: 400, name: 'Bad Request', description: 'Invalid request parameters' },
    { code: 401, name: 'Unauthorized', description: 'Invalid or missing API key' },
    { code: 403, name: 'Forbidden', description: 'Insufficient permissions' },
    { code: 429, name: 'Too Many Requests', description: 'Rate limit exceeded' },
    { code: 500, name: 'Internal Server Error', description: 'Server error occurred' }
  ];

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 3 }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(255, 48, 48, 0.1), rgba(30, 30, 30, 0.9))' 
            : 'linear-gradient(135deg, rgba(255, 48, 48, 0.1), rgba(255, 255, 255, 0.9))',
          border: '1px solid rgba(255, 48, 48, 0.2)',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ApiIcon sx={{ fontSize: 40, color: '#ff3030', mr: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: isDarkMode ? '#fff' : '#333' }}>
            Game Creation API
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ color: isDarkMode ? '#ccc' : '#666', mb: 3 }}>
          Build games, generate content, and create experiences with our powerful API
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.1)' : 'rgba(255, 48, 48, 0.05)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <CodeIcon sx={{ fontSize: 30, color: '#ff3030', mb: 1 }} />
                <Typography variant="h6">v1.0.0</Typography>
                <Typography variant="body2" color="text.secondary">Current Version</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.1)' : 'rgba(255, 48, 48, 0.05)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <SecurityIcon sx={{ fontSize: 30, color: '#ff3030', mb: 1 }} />
                <Typography variant="h6">Secure</Typography>
                <Typography variant="body2" color="text.secondary">API Key Authentication</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.1)' : 'rgba(255, 48, 48, 0.05)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <SpeedIcon sx={{ fontSize: 30, color: '#ff3030', mb: 1 }} />
                <Typography variant="h6">Fast</Typography>
                <Typography variant="body2" color="text.secondary">Low Latency Responses</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
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
              '&.Mui-selected': { color: '#ff3030' }
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
      <Paper elevation={1} sx={{ p: 3 }}>
        {/* Getting Started */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="h4" gutterBottom>Getting Started</Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body1">
                <strong>Prerequisites:</strong> You need an Elite membership to generate API keys.
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom>Quick Start</Typography>
            <Typography variant="body1" paragraph>
              1. Navigate to Account Settings → Developer tab
            </Typography>
            <Typography variant="body1" paragraph>
              2. Click "Generate New Key" and select permissions
            </Typography>
            <Typography variant="body1" paragraph>
              3. Copy your API key (shown only once!)
            </Typography>
            <Typography variant="body1" paragraph>
              4. Include the key in your requests using the X-API-Key header
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Base URL</Typography>
            <CodeBlock>https://yourapp.com/api/public-api</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Your First Request</Typography>
            <CodeBlock>{`curl -X GET "https://yourapp.com/api/public-api/game-types" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json"`}</CodeBlock>
          </Box>
        )}

        {/* Authentication */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h4" gutterBottom>Authentication</Typography>
            
            <Typography variant="h6" gutterBottom>API Key Format</Typography>
            <Typography variant="body1" paragraph>
              API keys follow the format: <code>keyId.secret</code>
            </Typography>
            <CodeBlock>ak_1234567890abcdef.a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Headers</Typography>
            <Typography variant="body1" paragraph>
              Include your API key in the request header:
            </Typography>
            <CodeBlock>{`X-API-Key: your_full_api_key_here

// Alternative (Bearer token):
Authorization: Bearer your_full_api_key_here`}</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Permissions</Typography>
            <Grid container spacing={2}>
              {[
                { perm: 'create_room', desc: 'Create new game rooms with deposits' },
                { perm: 'generate_image', desc: 'Generate AI images using DALL-E' },
                { perm: 'generate_react', desc: 'Generate React game components' },
                { perm: 'extract_room_info', desc: 'Extract info from game code' }
              ].map((item) => (
                <Grid item xs={12} sm={6} key={item.perm}>
                  <Card variant="outlined">
                    <CardContent>
                      <Chip label={item.perm} color="primary" sx={{ mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {item.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Endpoints */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h4" gutterBottom>API Endpoints</Typography>
            
            {endpoints.map((endpoint, index) => (
              <Accordion key={index} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Chip 
                      label={endpoint.method}
                      color={endpoint.method === 'GET' ? 'success' : 'primary'}
                      size="small"
                    />
                    <Typography variant="h6">{endpoint.path}</Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    {endpoint.permissions.map((perm) => (
                      <Chip key={perm} label={perm} size="small" variant="outlined" />
                    ))}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" paragraph>
                    {endpoint.description}
                  </Typography>

                  {endpoint.parameters.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom>Parameters</Typography>
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Parameter</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell>Required</TableCell>
                              <TableCell>Description</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {endpoint.parameters.map((param) => (
                              <TableRow key={param.name}>
                                <TableCell><code>{param.name}</code></TableCell>
                                <TableCell>{param.type}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={param.required ? 'Required' : 'Optional'}
                                    color={param.required ? 'error' : 'default'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>{param.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}

                  <Typography variant="h6" gutterBottom>Request Example</Typography>
                  <CodeBlock>{endpoint.example}</CodeBlock>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Response Example</Typography>
                  <CodeBlock>{endpoint.response}</CodeBlock>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Rate Limits */}
        {activeTab === 3 && (
          <Box>
            <Typography variant="h4" gutterBottom>Rate Limits</Typography>
            
            <Alert severity="warning" sx={{ mb: 3 }}>
              Rate limits are enforced per API key. Exceeding limits will result in 429 errors.
            </Alert>

            <Grid container spacing={3}>
              {rateLimits.map((limit, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" color="primary" gutterBottom>
                        {limit.limit}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {limit.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Headers in Response</Typography>
            <Typography variant="body1" paragraph>
              Rate limit information is included in response headers:
            </Typography>
            <CodeBlock>{`X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Limit: 100`}</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Handling Rate Limits</Typography>
            <CodeBlock>{`// JavaScript example
try {
  const response = await fetch('/api/public-api/create-room', {
    method: 'POST',
    headers: {
      'X-API-Key': 'your_key_here',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (response.status === 429) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    console.log('Rate limited. Resets at:', new Date(resetTime * 1000));
    // Wait and retry...
  }
} catch (error) {
  console.error('API Error:', error);
}`}</CodeBlock>
          </Box>
        )}

        {/* Error Codes */}
        {activeTab === 4 && (
          <Box>
            <Typography variant="h4" gutterBottom>Error Codes</Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Resolution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errorCodes.map((error) => (
                    <TableRow key={error.code}>
                      <TableCell>
                        <Chip 
                          label={error.code}
                          color={error.code >= 500 ? 'error' : error.code >= 400 ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell><strong>{error.name}</strong></TableCell>
                      <TableCell>{error.description}</TableCell>
                      <TableCell>
                        {error.code === 401 && 'Check your API key'}
                        {error.code === 403 && 'Verify permissions'}
                        {error.code === 429 && 'Wait for rate limit reset'}
                        {error.code === 400 && 'Check request parameters'}
                        {error.code === 500 && 'Contact support'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Error Response Format</Typography>
            <CodeBlock>{`{
  "success": false,
  "error": "Invalid API key format",
  "message": "Please provide an API key in X-API-Key header",
  "code": 401
}`}</CodeBlock>
          </Box>
        )}

        {/* Examples */}
        {activeTab === 5 && (
          <Box>
            <Typography variant="h4" gutterBottom>Code Examples</Typography>
            
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">JavaScript/Node.js</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CodeBlock>{`const axios = require('axios');

class GameAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://yourapp.com/api/public-api';
  }

  async createRoom(roomData) {
    try {
      const response = await axios.post(\`\${this.baseURL}/create-room\`, roomData, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(\`API Error: \${error.response?.data?.error || error.message}\`);
    }
  }

  async generateImage(prompt, options = {}) {
    const data = {
      prompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard'
    };

    const response = await axios.post(\`\${this.baseURL}/generate-image\`, data, {
      headers: { 'X-API-Key': this.apiKey }
    });
    
    return response.data.imageUrl;
  }
}

// Usage
const api = new GameAPI('your_api_key_here');

api.createRoom({
  bet_amount: 0.1,
  name: 'Epic Battle',
  game_type: 1,
  connectedAccount: 'wallet_address'
}).then(result => {
  console.log('Room created:', result.room);
}).catch(error => {
  console.error('Error:', error.message);
});`}</CodeBlock>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Python</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CodeBlock>{`import requests
import json

class GameAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = 'https://yourapp.com/api/public-api'
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def create_room(self, room_data):
        response = requests.post(
            f'{self.base_url}/create-room',
            headers=self.headers,
            json=room_data
        )
        
        if response.status_code == 429:
            raise Exception('Rate limit exceeded')
        
        response.raise_for_status()
        return response.json()
    
    def generate_image(self, prompt, size='1024x1024'):
        data = {
            'prompt': prompt,
            'size': size
        }
        
        response = requests.post(
            f'{self.base_url}/generate-image',
            headers=self.headers,
            json=data
        )
        
        result = response.json()
        if result['success']:
            return result['imageUrl']
        else:
            raise Exception(result['error'])

# Usage
api = GameAPI('your_api_key_here')

try:
    room = api.create_room({
        'bet_amount': 0.1,
        'name': 'Python Game',
        'game_type': 1,
        'connectedAccount': 'wallet_address'
    })
    print(f"Room created: {room['room']['id']}")
except Exception as e:
    print(f"Error: {e}")`}</CodeBlock>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">cURL Examples</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CodeBlock>{`# Create a game room
curl -X POST "https://yourapp.com/api/public-api/create-room" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bet_amount": 0.1,
    "name": "cURL Game",
    "game_type": 1,
    "connectedAccount": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
  }'

# Generate an image
curl -X POST "https://yourapp.com/api/public-api/generate-image" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A futuristic game interface",
    "size": "1024x1024"
  }'

# Get game types
curl -X GET "https://yourapp.com/api/public-api/game-types" \\
  -H "X-API-Key: your_api_key_here"`}</CodeBlock>
              </AccordionDetails>
            </Accordion>
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
            boxShadow: 3,
          }}
        >
          ✅ {copySuccess}
        </Box>
      )}
    </Box>
  );
};

export default ApiDocumentation;