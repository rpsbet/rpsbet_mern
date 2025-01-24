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
import './index.css';
import './dark.css';

// Define a function to create theme based on mode
const getTheme = (mode) => createTheme({
  palette: {
    mode: mode,
    primary: { main: '#3949ab' },  // Example primary color
    secondary: { main: '#f50057' },  // Example secondary color
    error: { main: '#f44336' },  // Example error color
    background: {
      default: mode === 'dark' ? '#29202f' : '#f4f6f8',  // Conditional background color
    },
  },
});

// Use a state or a global context to toggle between light and dark mode, here for example purposes
const currentMode = 'dark';  // Change to 'light' as needed

const theme = getTheme(currentMode);

ReactDOM.render(
  <React.Fragment>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={10} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} autoHideDuration={3000}>
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