import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './dark.css';

import { Provider } from 'react-redux';
import store from './redux/store';

import { BrowserRouter, Router } from 'react-router-dom';

// Updated imports for MUI v5
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'; // For CSS baseline

import { styleColor } from './Styles/styleThem';
import App from './App';
import GlobalStyle from './Styles/global.styles';
import history from './redux/history';
import MessageBar from './components/MessageBar'; // Check if spelling is correct
import buttonHoverSound from './main-select.mp3'; // Replace with the actual path
import typingSound from './typing-sound.mp3'; // Replace with the actual path

const theme = createTheme({
  palette: {
    mode: 'dark', // updated for v5 from type: 'dark'
    primary: { main: styleColor.primary.main },
    secondary: { main: styleColor.secondary.main },
    error: { main: styleColor.error.main },
  },
});

const shouldPlaySound = () => {
  const state = store.getState();
  const { isMuted, clickSounds } = state.auth;
  return !isMuted && clickSounds; // Updated condition based on your comment
};

const playSound = () => {
  if (shouldPlaySound()) {
    const audio = new Audio(buttonHoverSound);
    audio.volume = 0.03;
    audio.play();
  }
};

const playSoundTyping = () => {
  if (shouldPlaySound()) {
    const audio = new Audio(typingSound);
    audio.volume = 0.03;
    audio.play();
  }
};

ReactDOM.render(
  <React.Fragment>
    <Provider store={store}>
      <GlobalStyle />
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Ensures consistent baseline styles */}
        <BrowserRouter>
          <Router history={history}>
            <App />
          </Router>
          <MessageBar />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </React.Fragment>,
  document.getElementById('root')
);