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
  Alert,
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
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as ContentCopyIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Api as ApiIcon,
  Speed as SpeedIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

const ApiDocumentation = () => {
  const isDarkMode = useSelector(state => state.auth.isDarkMode);
  const [activeTab, setActiveTab] = useState(0);
  const [copySuccess, setCopySuccess] = useState('');
  const [showScrapable, setShowScrapable] = useState(false);

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

  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://catsino.fun' 
    : `http://${window.location.hostname}:5001`;

  const generateScrapableDoc = () => {
    return `# Game Creation API Documentation

## Overview
**Base URL:** ${baseUrl}/api/public-api
**Version:** 1.0.0 (Streamlined)
**Authentication:** API Key required in X-API-Key header

The Game Creation API provides a unified endpoint for creating complete game experiences with AI-generated React components, optional image generation, and mandatory blockchain deposits.

## Key Changes in Streamlined API
- **Unified Endpoint**: Single /create-room endpoint handles all game creation
- **Mandatory React Generation**: All games must include AI-generated React code
- **Fixed Game Type**: Always uses game type 9 (not configurable)
- **Mandatory Deposits**: No testing mode - all deposits processed via blockchain
- **Required Private Key**: Automated deposit signing is mandatory
- **Auto Image Generation**: Images generated from reactPrompt if not provided

## Authentication
Include your API key in requests:
\`\`\`
X-API-Key: your_api_key_here
Content-Type: application/json
\`\`\`

**Required Permission:** create_room

## Endpoint: POST /create-room
Create a new game room with mandatory React generation and blockchain deposit.

### Required Parameters
- **bet_amount** (number): Bet amount in SOL (minimum 0.001)
- **name** (string): Game name (3-20 characters)
- **connectedAccount** (string): Solana wallet address
- **privateKey** (string): Base58 private key for automated deposit
- **reactPrompt** (string): Prompt for React game code generation

### Optional Parameters
- **imageUrls** (array): Image URLs for React component
- **ticker** (string): Game ticker symbol (auto-generated if not provided)
- **description** (string): Game description (auto-extracted if not provided)
- **generateImage** (boolean): Generate image from prompt if no imageUrls (default: true)
- **imageSize** (string): Image size - 1024x1024, 1024x1792, or 1792x1024
- **imageQuality** (string): Image quality - standard or hd

### Example Request
\`\`\`json
{
  "bet_amount": 0.1,
  "name": "Dice Master",
  "connectedAccount": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "privateKey": "your_base58_private_key_here",
  "reactPrompt": "Create an animated dice rolling game with 3D effects and multipliers",
  "generateImage": true,
  "imageQuality": "hd"
}
\`\`\`

### Response Structure
\`\`\`json
{
  "success": true,
  "room": {
    "id": "room_id",
    "room_number": 1234,
    "name": "Dice Master",
    "ticker": "DICE",
    "bet_amount": 0.095,
    "status": "open",
    "gameCode": "generated_react_code",
    "image": "generated_image_url"
  },
  "deposit": {
    "success": true,
    "txHash": "blockchain_transaction_hash",
    "amount": 0.1,
    "explorerUrl": "solana_explorer_link"
  },
  "reactGeneration": {
    "success": true,
    "proxiedAssets": { "images": [], "audio": [] }
  },
  "imageGeneration": {
    "success": true,
    "url": "generated_image_url",
    "prompt": "image_generation_prompt"
  }
}
\`\`\`

## Rate Limits
- 100 requests per hour (default)
- 1000 requests per day (default)
- Customizable for Elite users

## Error Codes
- **400**: Invalid parameters or insufficient wallet balance
- **401**: Invalid API key
- **403**: Not Elite member or insufficient permissions
- **429**: Rate limit exceeded
- **500**: React generation failure or blockchain error

## JavaScript Example
\`\`\`javascript
const response = await fetch('${baseUrl}/api/public-api/create-room', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bet_amount: 0.1,
    name: "My Game",
    connectedAccount: "wallet_address",
    privateKey: "base58_private_key",
    reactPrompt: "Create a game with animations"
  })
});

const result = await response.json();
console.log('Room created:', result.room.id);
\`\`\`

## Security Notes
- API keys must be kept secure and used only from server environments
- Private keys are required for automated blockchain deposits
- All transactions are verified on Solana blockchain
- Elite membership required for API access

`;
  };

  if (showScrapable) {
    return (
      <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 3 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 4,
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgba(255, 48, 48, 0.15), rgba(23, 23, 23, 0.95))' 
              : 'linear-gradient(135deg, rgba(255, 48, 48, 0.1), rgba(255, 255, 255, 0.95))',
            border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.2)'}`,
            borderRadius: 2,
            color: isDarkMode ? '#ffffff' : '#000000'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ArticleIcon sx={{ fontSize: 40, color: '#ff3030', mr: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: isDarkMode ? '#fff' : '#333' }}>
                API Documentation (AI-friendly)
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setShowScrapable(false)}
              sx={{ 
                borderColor: '#ff3030', 
                color: '#ff3030',
                '&:hover': { borderColor: '#ff3030', backgroundColor: 'rgba(255, 48, 48, 0.1)' }
              }}
            >
              Back to Tabs
            </Button>
          </Box>
          <Typography variant="h6" sx={{ color: isDarkMode ? '#e0e0e0' : '#666', mb: 2 }}>
            AI-friendly format with all documentation in a single view
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleCopy(generateScrapableDoc())}
            sx={{ 
              bgcolor: '#ff3030',
              '&:hover': { bgcolor: '#e02828' }
            }}
            startIcon={<ContentCopyIcon />}
          >
            Copy All Documentation
          </Button>
        </Paper>

        <Paper 
          elevation={1} 
          sx={{ 
            p: 3,
            bgcolor: isDarkMode ? '#1a1a1a' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
            color: isDarkMode ? '#ffffff' : '#000000'
          }}
        >
          <CodeBlock>
            {generateScrapableDoc()}
          </CodeBlock>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 3 }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(255, 48, 48, 0.15), rgba(23, 23, 23, 0.95))' 
            : 'linear-gradient(135deg, rgba(255, 48, 48, 0.1), rgba(255, 255, 255, 0.95))',
          border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.2)'}`,
          borderRadius: 2,
          color: isDarkMode ? '#ffffff' : '#000000'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ApiIcon sx={{ fontSize: 40, color: '#ff3030', mr: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: isDarkMode ? '#fff' : '#333' }}>
              Game Creation API
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => setShowScrapable(true)}
            sx={{ 
              borderColor: '#ff3030', 
              color: '#ff3030',
              '&:hover': { borderColor: '#ff3030', backgroundColor: 'rgba(255, 48, 48, 0.1)' }
            }}
            startIcon={<ArticleIcon />}
          >
            AI-Friendly Format
          </Button>
        </Box>
        <Typography variant="h6" sx={{ color: isDarkMode ? '#e0e0e0' : '#666', mb: 3 }}>
          Streamlined API for creating complete game experiences with AI-generated content and mandatory blockchain deposits
        </Typography>
        
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
            <strong>API Streamlined:</strong> We've unified endpoints! Private keys are mandatory for automated blockchain transactions.
          </Typography>
        </Alert>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.15)' : 'rgba(255, 48, 48, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.1)'}`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <CodeIcon sx={{ fontSize: 30, color: '#ff3030', mb: 1 }} />
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>v1.0.0</Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>Streamlined</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.15)' : 'rgba(255, 48, 48, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.1)'}`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <SecurityIcon sx={{ fontSize: 30, color: '#ff3030', mb: 1 }} />
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>Secure</Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>Blockchain Verified</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.15)' : 'rgba(255, 48, 48, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.1)'}`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <SpeedIcon sx={{ fontSize: 30, color: '#ff3030', mb: 1 }} />
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>AI-Powered</Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>Auto Generation</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ 
              bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.15)' : 'rgba(255, 48, 48, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.1)'}`
            }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <ApiIcon sx={{ fontSize: 30, color: '#ff3030', mb: 1 }} />
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>Unified</Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>Single Endpoint</Typography>
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
          <Tab label="Create Room Endpoint" />
          <Tab label="Examples" />
          <Tab label="Error Handling" />
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
                <strong>Prerequisites:</strong> Elite membership required. Visit Account Settings → Developer tab to create API keys.
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Quick Start</Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                <strong>1.</strong> Get Elite membership
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                <strong>2.</strong> Navigate to Account Settings → Developer tab
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                <strong>3.</strong> Generate API key with create_room permission
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                <strong>4.</strong> Prepare your Solana wallet private key (Base58 format)
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                <strong>5.</strong> Make your first API call
              </Typography>
            </Box>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Base URL</Typography>
            <CodeBlock>{baseUrl}/api/public-api</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Required Fields Overview</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{
                  bgcolor: isDarkMode ? 'rgba(255, 48, 48, 0.1)' : 'rgba(255, 48, 48, 0.05)',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 48, 48, 0.3)' : 'rgba(255, 48, 48, 0.2)'}`,
                  height: '100%'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ff3030', mb: 2 }}>
                      Required Fields
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      • <strong>bet_amount</strong>: SOL amount (min 0.001)<br/>
                      • <strong>name</strong>: Game name (3-20 chars)<br/>
                      • <strong>connectedAccount</strong>: Wallet address<br/>
                      • <strong>privateKey</strong>: Base58 private key<br/>
                      • <strong>reactPrompt</strong>: AI generation prompt
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
                      Auto-Generated
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      • <strong>gameCode</strong>: React component<br/>
                      • <strong>image</strong>: AI artwork (if no imageUrls)<br/>
                      • <strong>ticker</strong>: From game name<br/>
                      • <strong>description</strong>: From generated code<br/>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Authentication */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Authentication</Typography>
            
            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>API Key Headers</Typography>
            <CodeBlock>{`X-API-Key: your_api_key_here
Content-Type: application/json`}</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Required Permission</Typography>
            <Card sx={{
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
              border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`,
              mb: 3
            }}>
              <CardContent>
                <Chip 
                  label="create_room" 
                  color="primary" 
                  sx={{ 
                    mb: 1,
                    bgcolor: '#ff3030',
                    color: '#fff'
                  }} 
                />
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  <strong>create_room:</strong> Create game rooms with mandatory SOL deposits, blockchain transactions, AI-generated React code, and optional image generation. This is the only permission needed for the streamlined API.
                </Typography>
              </CardContent>
            </Card>

            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                bgcolor: isDarkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)',
                color: isDarkMode ? '#f48fb1' : '#d32f2f',
                border: `1px solid ${isDarkMode ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.2)'}`
              }}
            >
              <Typography variant="body1">
                <strong>Security Warning:</strong> Private keys are required for automated deposits. Never expose private keys in client-side code. Use only in secure server environments.
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Private Key Format</Typography>
            <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
              Must be Base58 format as used by Solana wallets:
            </Typography>
            <CodeBlock>{`// Example format (do not use this key!)
"5J7XnCx1H2VnwkQaGgpCj8RVR4QpN9yJHyKwMvBjUpf6pLQ8X7q8M5KgCvF2NnD3HbWwJkL4Mp7X"`}</CodeBlock>
          </Box>
        )}

        {/* Create Room Endpoint */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Create Room Endpoint</Typography>
            
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                bgcolor: isDarkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
                color: isDarkMode ? '#81c784' : '#2e7d32',
                border: `1px solid ${isDarkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)'}`
              }}
            >
              <Typography variant="body1">
                <strong>Unified Endpoint:</strong> POST /create-room handles React generation, image creation, and blockchain deposits in a single request.
              </Typography>
            </Alert>

            <Accordion 
              defaultExpanded={true}
              sx={{ 
                mb: 2,
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
                border: `1px solid ${isDarkMode ? '#444' : '#e0e0e0'}`
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: isDarkMode ? '#fff' : '#333' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip label="POST" color="primary" sx={{ bgcolor: '#ff3030', color: '#fff' }} />
                  <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>/api/public-api/create-room</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" paragraph sx={{ color: isDarkMode ? '#e0e0e0' : '#555' }}>
                  Create a new game room with mandatory React code generation, optional AI image generation, and mandatory blockchain deposits.
                </Typography>

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
                      {[
                        { name: 'bet_amount', type: 'number', required: true, description: 'Bet amount in SOL (minimum 0.001)' },
                        { name: 'name', type: 'string', required: true, description: 'Game name (3-20 characters)' },
                        { name: 'connectedAccount', type: 'string', required: true, description: 'Solana wallet address' },
                        { name: 'privateKey', type: 'string', required: true, description: 'Base58 private key for automated deposit' },
                        { name: 'reactPrompt', type: 'string', required: true, description: 'Prompt for React game code generation' },
                        { name: 'imageUrls', type: 'array', required: false, description: 'Image URLs for React component' },
                        { name: 'ticker', type: 'string', required: false, description: 'Game ticker (auto-generated if not provided)' },
                        { name: 'description', type: 'string', required: false, description: 'Game description (auto-extracted if not provided)' },
                        { name: 'generateImage', type: 'boolean', required: false, description: 'Generate image from reactPrompt if no imageUrls (default: true)' },
                        { name: 'imageSize', type: 'string', required: false, description: '1024x1024, 1024x1792, or 1792x1024 (default: 1024x1024)' },
                        { name: 'imageQuality', type: 'string', required: false, description: 'standard or hd (default: standard)' },
                        { name: 'is_private', type: 'boolean', required: false, description: 'Private room flag (default: false)' }
                      ].map((param) => (
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
                              sx={{ fontSize: '11px', height: '20px' }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>{param.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Request Example</Typography>
                <CodeBlock>{`{
  "bet_amount": 0.1,
  "name": "Dice Master",
  "connectedAccount": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "privateKey": "your_base58_private_key_here",
  "reactPrompt": "Create an animated dice rolling game with 3D effects and multipliers",
  "generateImage": true,
  "imageQuality": "hd"
}`}</CodeBlock>

                <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Response Example</Typography>
                <CodeBlock>{`{
  "success": true,
  "room": {
    "id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "room_number": 1234,
    "name": "Dice Master",
    "ticker": "DICE",
    "bet_amount": 0.095,
    "status": "open",
    "game_type": "Custom Game",
    "gameCode": "const App = () => { /* Generated React code */ }; export default App;",
    "image": "https://generated-image-url"
  },
  "deposit": {
    "success": true,
    "txHash": "5j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o",
    "amount": 0.1,
    "explorerUrl": "https://explorer.solana.com/tx/..."
  },
  "reactGeneration": {
    "success": true,
    "proxiedAssets": {
      "images": [{"key": "image0", "proxiedUrl": "https://generated-image-url"}],
      "audio": []
    }
  },
  "imageGeneration": {
    "success": true,
    "url": "https://generated-image-url",
    "prompt": "Create an animated dice rolling game...",
    "size": "1024x1024",
    "quality": "hd"
  },
  "extractedInfo": {
    "name": "Dice Master",
    "ticker": "DICE",
    "description": "Roll the dice to achieve winning multipliers",
    "confidence": 0.95
  }
}`}</CodeBlock>
              </AccordionDetails>
            </Accordion>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Workflow Steps</Typography>
            <Grid container spacing={2}>
              {[
                { step: "1", title: "Validate", desc: "Check required fields and wallet balance", color: "#ff3030" },
                { step: "2", title: "Deposit", desc: "Process blockchain transaction", color: "#ff6600" },
                { step: "3", title: "Generate React", desc: "Create AI game component", color: "#ff9900" },
                { step: "4", title: "Generate Image", desc: "Create artwork if needed", color: "#ffcc00" },
                { step: "5", title: "Save Room", desc: "Store and return response", color: "#99ff00" }
              ].map((item) => (
                <Grid item xs={12} sm={6} md={2.4} key={item.step}>
                  <Card sx={{
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
                    border: `2px solid ${item.color}`,
                    height: '100%',
                    textAlign: 'center'
                  }}>
                    <CardContent>
                      <Typography variant="h4" sx={{ color: item.color, fontWeight: 600 }} gutterBottom>
                        {item.step}
                      </Typography>
                      <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                        {item.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Examples */}
        {activeTab === 3 && (
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

class StreamlinedCatsinoAPI {
  constructor(apiKey, baseUrl = '${baseUrl}') {
    this.apiKey = apiKey;
    this.baseURL = \`\${baseUrl}/api/public-api\`;
    this.headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  async createGameRoom(roomData) {
    try {
      const response = await axios.post(\`\${this.baseURL}/create-room\`, roomData, {
        headers: this.headers
      });
      
      if (response.data.success) {
        console.log('✅ Game room created successfully!');
        console.log('Room ID:', response.data.room.id);
        console.log('Blockchain TX:', response.data.deposit.txHash);
        return response.data;
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limited. Please wait before retrying.');
      }
      throw new Error(\`API Error: \${error.response?.data?.error || error.message}\`);
    }
  }
}

// Usage example
const api = new StreamlinedCatsinoAPI('your_api_key_here');

async function createGame() {
  try {
    const result = await api.createGameRoom({
      bet_amount: 0.1,
      name: 'Dice Master',
      connectedAccount: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      privateKey: 'your_base58_private_key_here',
      reactPrompt: 'Create an animated dice rolling game with 3D effects and multipliers',
      generateImage: true,
      imageQuality: 'hd'
    });

    console.log('Game created:', result.room.name);
    console.log('Transaction:', result.deposit.explorerUrl);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createGame();`}</CodeBlock>
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

class StreamlinedCatsinoAPI:
    def __init__(self, api_key, base_url='${baseUrl}'):
        self.api_key = api_key
        self.base_url = f'{base_url}/api/public-api'
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def create_game_room(self, room_data):
        response = requests.post(
            f'{self.base_url}/create-room',
            headers=self.headers,
            json=room_data
        )
        
        if response.status_code == 429:
            raise Exception('Rate limited. Please wait before retrying.')
        
        response.raise_for_status()
        data = response.json()
        
        if not data.get('success'):
            raise Exception(f"API Error: {data.get('error', 'Unknown error')}")
        
        print(f"✅ Room created: {data['room']['name']}")
        print(f"💰 Transaction: {data['deposit']['txHash']}")
        
        return data

# Usage example
api = StreamlinedCatsinoAPI('your_api_key_here')

try:
    result = api.create_game_room({
        'bet_amount': 0.1,
        'name': 'Lucky Slots',
        'connectedAccount': '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        'privateKey': 'your_base58_private_key_here',
        'reactPrompt': 'Create a 3-reel slot machine with fruit symbols and winning animations',
        'generateImage': True,
        'imageQuality': 'hd'
    })
    
    print(f"Game ID: {result['room']['id']}")
    print(f"Explorer: {result['deposit']['explorerUrl']}")
    
except Exception as e:
    print(f"❌ Error: {e}")`}</CodeBlock>
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
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>cURL</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <CodeBlock>{`# Basic room creation
curl -X POST "${baseUrl}/api/public-api/create-room" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bet_amount": 0.1,
    "name": "Dice Game",
    "connectedAccount": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "privateKey": "your_base58_private_key_here",
    "reactPrompt": "Create a dice rolling game with animations"
  }'

# Advanced room with all options
curl -X POST "${baseUrl}/api/public-api/create-room" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bet_amount": 0.15,
    "name": "Ultimate Slots",
    "connectedAccount": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "privateKey": "your_base58_private_key_here",
    "reactPrompt": "Create a premium slot machine with jackpots and bonus rounds",
    "ticker": "SLOTS",
    "description": "Premium slot experience",
    "generateImage": true,
    "imageSize": "1024x1024",
    "imageQuality": "hd",
    "is_private": false
  }'

# Get API info
curl -X GET "${baseUrl}/api/public-api/info" \\
  -H "X-API-Key: your_api_key_here" \\
  -H "Content-Type: application/json"`}</CodeBlock>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Error Handling */}
        {activeTab === 4 && (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Error Handling</Typography>
            
            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Common Error Codes</Typography>
            <TableContainer 
              component={Paper} 
              variant="outlined"
              sx={{
                mb: 3,
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
                  {[
                    { code: 400, name: 'Bad Request', description: 'Missing required fields or invalid data', resolution: 'Check all required parameters and formats' },
                    { code: 401, name: 'Unauthorized', description: 'Invalid or missing API key', resolution: 'Verify API key in X-API-Key header' },
                    { code: 403, name: 'Forbidden', description: 'Not Elite member or insufficient permissions', resolution: 'Get Elite membership and create_room permission' },
                    { code: 429, name: 'Too Many Requests', description: 'Rate limit exceeded', resolution: 'Wait for rate limit reset or request higher limits' },
                    { code: 500, name: 'Internal Server Error', description: 'React generation or blockchain error', resolution: 'Check prompt quality and wallet balance' }
                  ].map((error) => (
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
                      <TableCell sx={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>{error.resolution}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>Error Response Format</Typography>
            <CodeBlock>{`{
  "success": false,
  "error": "Missing required field: privateKey",
  "message": "Private key is required for automated deposits",
  "code": 400,
  "details": {
    "field": "privateKey",
    "required": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`}</CodeBlock>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Error Handling Best Practices</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{
                  bgcolor: isDarkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)'}`,
                  height: '100%'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#ff9800' : '#f57c00', mb: 2 }}>
                      Validation Errors
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      • Validate all required fields before API call<br/>
                      • Check wallet balance before creating room<br/>
                      • Verify private key format (Base58)<br/>
                      • Ensure name is 3-20 characters<br/>
                      • Validate bet amount (min 0.001 SOL)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{
                  bgcolor: isDarkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)',
                  border: `1px solid ${isDarkMode ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.2)'}`,
                  height: '100%'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: isDarkMode ? '#f44336' : '#d32f2f', mb: 2 }}>
                      Don't Retry These
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                      • Blockchain transaction failures<br/>
                      • Insufficient wallet balance<br/>
                      • Invalid private key errors<br/>
                      • Authentication failures<br/>
                      • Permission denied errors
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333', mt: 3 }}>Retry Logic Example</Typography>
            <CodeBlock>{`async function createRoomWithRetry(roomData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('${baseUrl}/api/public-api/create-room', {
        method: 'POST',
        headers: {
          'X-API-Key': 'your_api_key_here',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData)
      });
      
      if (response.status === 429) {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        const waitTime = (resetTime * 1000) - Date.now();
        
        if (attempt < maxRetries) {
          console.log(\`Rate limited. Waiting \${waitTime}ms...\`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      const result = await response.json();
      
      if (!result.success) {
        // Don't retry blockchain or auth errors
        if (result.error.includes('deposit failed') || 
            result.error.includes('private key') ||
            result.error.includes('unauthorized')) {
          throw new Error(result.error);
        }
        
        // Retry other errors
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }
      
      return result;
      
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}`}</CodeBlock>
          </Box>
        )}
      </Paper>

      {/* Quick Reference Card */}
      <Paper
        elevation={3}
        sx={{
          mt: 4,
          p: 3,
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(23, 23, 23, 0.95))' 
            : 'linear-gradient(135deg, rgba(0, 255, 0, 0.05), rgba(255, 255, 255, 0.95))',
          border: `1px solid ${isDarkMode ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 255, 0, 0.2)'}`,
          borderRadius: 2,
          color: isDarkMode ? '#ffffff' : '#000000'
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: isDarkMode ? '#4caf50' : '#2e7d32', fontWeight: 600 }}>
          🚀 Quick Reference
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>
              Minimal Request
            </Typography>
            <CodeBlock>{`{
  "bet_amount": 0.1,
  "name": "Game Name",
  "connectedAccount": "wallet_address",
  "privateKey": "base58_private_key",
  "reactPrompt": "AI generation prompt"
}`}</CodeBlock>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>
              Key Changes
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666', mb: 1 }}>
                ✅ Single endpoint for everything
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666', mb: 1 }}>
                ✅ Mandatory React generation
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666', mb: 1 }}>
                ✅ Required private keys
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666', mb: 1 }}>
                ✅ Auto image generation
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666', mb: 1 }}>
                ✅ Fixed game type (9)
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: isDarkMode ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 255, 0, 0.2)' }} />

        <Grid container spacing={2}>
          {[
            { title: "1 Endpoint", desc: "Unified creation", color: "#4caf50" },
            { title: "5 Required", desc: "Core parameters", color: "#4caf50" },
            { title: "100% Secure", desc: "Blockchain verified", color: "#4caf50" },
            { title: "AI Powered", desc: "Auto generation", color: "#4caf50" }
          ].map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                bgcolor: isDarkMode ? 'rgba(0, 255, 0, 0.1)' : 'rgba(0, 255, 0, 0.05)',
                border: `1px solid ${isDarkMode ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 255, 0, 0.2)'}`,
                textAlign: 'center'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: item.color, fontWeight: 600 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                    {item.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Support & Resources */}
      <Paper
        elevation={1}
        sx={{
          mt: 3,
          p: 3,
          bgcolor: isDarkMode ? '#1a1a1a' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
          borderRadius: 2
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: isDarkMode ? '#fff' : '#333' }}>
          📚 Resources & Support
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{
              bgcolor: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)'}`,
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#2196f3' : '#1976d2', mb: 2 }}>
                  🔧 Developer Tools
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  • Account Settings → Developer Tab<br/>
                  • API Key Generation<br/>
                  • Usage Analytics<br/>
                  • Rate Limit Monitoring<br/>
                  • Transaction History
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{
              bgcolor: isDarkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)'}`,
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#ff9800' : '#f57c00', mb: 2 }}>
                  ⚠️ Important Notes
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  • Elite membership required<br/>
                  • Private keys mandatory<br/>
                  • All deposits are live (no testing)<br/>
                  • Game type fixed to 9<br/>
                  • React generation required
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{
              bgcolor: isDarkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)'}`,
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#4caf50' : '#2e7d32', mb: 2 }}>
                  💬 Get Help
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                  • Community Discord<br/>
                  • Developer Forums<br/>
                  • Email Support<br/>
                  • API Status Page<br/>
                  • Code Examples Repository
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center', color: isDarkMode ? '#666' : '#999' }}>
        <Typography variant="body2">
          Game Creation API v1.0.0 - Streamlined for Production Use
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Built with ❤️ for developers creating amazing gaming experiences
        </Typography>
      </Box>

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