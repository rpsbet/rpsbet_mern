import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { PrivyProvider } from '@privy-io/react-auth';
import { Alert } from '@mui/material';
import store from './redux/store';
import App from './App';
import MessageBar from './components/MessageBar';
import './index.css';

// Add global CSS to remove ripple effect
const globalStyles = `
  .MuiTouchRipple-root {
    display: none !important;
  }
`;

// Inject global styles
const styleSheet = document.createElement('style');
styleSheet.innerHTML = globalStyles;
document.head.appendChild(styleSheet);

// Custom Alert component for notistack success variant
const CustomSuccessSnackbar = React.forwardRef((props, ref) => {
  const { message, ...other } = props;
  return (
    <Alert
      ref={ref}
      severity="success"
      variant="filled"
      sx={{
        backgroundColor: '#00ff3a !important',
        color: '#fff !important',
        borderRadius: '8px',
        '& .MuiAlert-icon': { color: '#fff !important' },
        '& .MuiAlert-message': { color: '#fff !important' },
      }}
      {...other}
    >
      {message}
    </Alert>
  );
});

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode: mode,
      primary: { main: '#3949ab' },
      secondary: { main: '#f50057' },
      error: { main: '#FF0000' },
      success: {
        main: '#00ff3a',
        contrastText: '#fff',
      },
      background: {
        default: mode === 'dark' ? '#151718' : '#f4f6f8',
        paper: '#ffffff',
      },
      text: {
        primary: '#ffffff',
        secondary: '#ffffff',
      },
    },
    typography: {
      fontFamily: "'Staatliches', cursive",
      allVariants: {
        color: '#ffffff',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            color: '#ffffff !important',
            '& *': {
              color: '#ffffff !important',
            },
            // Exclude SnackbarContent to avoid interference
            '&:not(.MuiSnackbarContent-root)': {
              backgroundColor: '#ffffff',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiIconButton: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiMenuItem: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiListItemButton: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiSnackbarContent-root': {
              backgroundColor: '#00ff3a !important',
              color: '#fff !important',
              borderRadius: '8px',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            '&.MuiAlert-standardSuccess': {
              backgroundColor: '#00ff3a !important',
              color: '#fff !important',
            },
            '&.MuiAlert-filledSuccess': {
              backgroundColor: '#00ff3a !important',
              color: '#fff !important',
            },
            borderRadius: '8px',
          },
          message: {
            color: 'inherit !important',
          },
          icon: {
            color: 'inherit !important',
          },
        },
      },
    },
  });

const currentMode = 'dark';
const theme = getTheme(currentMode);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <PrivyProvider
    appId="cm9i6xoyw033ll80ntlqnl78e"
    config={{
      loginMethods: ['wallet', 'google', 'email'],
      appearance: {
        theme: 'dark', 
        showWalletLoginFirst: true
      },
    }}
  >
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={10}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          autoHideDuration={1000}
          style={{ transform: 'translateY(-90px)' }}
          Components={{
            success: CustomSuccessSnackbar, // Map success variant to custom Alert
          }}
        >
          <BrowserRouter>
            <App />
            <MessageBar />
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  </PrivyProvider>
);