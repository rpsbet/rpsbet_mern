import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter, Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import store from './redux/store';
import App from './App';
import history from './redux/history';
import MessageBar from './components/MessageBar';
import Background from './background'; // Import the Background component
import './index.css';
import './dark.css';

// Define a function to create theme based on mode
const getTheme = (mode) =>
  createTheme({
    palette: {
      mode: mode,
      primary: { main: '#3949ab' },
      secondary: { main: '#f50057' },
      error: { main: '#D32F2F' },
      background: {
        default: mode === 'dark' ? '#1E272E' : '#f4f6f8',
      },
    },
    typography: {
      fontFamily: "'Roboto Mono', monospace",
    },
  });

const currentMode = 'dark'; // Change to 'light' as needed
const theme = getTheme(currentMode);

ReactDOM.render(
  <React.Fragment>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={10}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          autoHideDuration={3000}
        >
          <BrowserRouter>
            <Router history={history}>
              <App />
              <MessageBar />
            </Router>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  </React.Fragment>,
  document.getElementById('root')
);