import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom'; // Use v6
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import store from './redux/store';
import App from './App';
import MessageBar from './components/MessageBar';
import './index.css';
import './dark.css';

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode: mode,
      primary: { main: '#3949ab' },
      secondary: { main: '#f50057' },
      error: { main: '#D32F2F' },
      background: {
        default: mode === 'dark' ? '#151718' : '#f4f6f8',
      },
    },
    typography: {
      fontFamily: "'Staatliches', cursive",
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
        sx={{
          zIndex: 1500,
          marginTop: { xs: '60px', sm: '0px' }, // 60px offset on mobile, none on larger screens
        }}
      >
        <BrowserRouter>
          <App />
          <MessageBar />
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  </Provider>
);