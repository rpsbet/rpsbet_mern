import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import store from './redux/store';
import App from './App';
import MessageBar from './components/MessageBar';
import './index.css';
import './dark.css';

// Add global CSS to enforce white text color for Paper components and remove ripple effect
const globalStyles = `
  .MuiTouchRipple-root {
    display: none !important;
  }

`;

// Inject global styles into the document
const styleSheet = document.createElement('style');
styleSheet.innerHTML = globalStyles;
document.head.appendChild(styleSheet);

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode: mode,
      primary: { main: '#3949ab' },
      secondary: { main: '#f50057' },
      error: { main: '#D32F2F' },
      background: {
        default: mode === 'dark' ? '#151718' : '#f4f6f8',
        paper: '#ffffff', // Ensure Paper background is white
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
            color: '#ffffff !important', // Force white text for Paper
            '& *': {
              color: '#ffffff !important', // Force white text for all descendants
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
    },
  });

const currentMode = 'dark';
const theme = getTheme(currentMode);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={10}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        autoHideDuration={3000}
        style={{ transform: 'translateY(-90px)' }}
      >
        <BrowserRouter>
          <App />
          <MessageBar />
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  </Provider>
);