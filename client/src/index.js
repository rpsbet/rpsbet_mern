import React from 'react';
import ReactDOM from 'react-dom';
import './index';
import './index.css';
import './dark.css';
import './global.css';

import * as serviceWorker from './serviceWorker';

import { Provider } from 'react-redux';
import store from './redux/store';

import { BrowserRouter, Router } from 'react-router-dom';

import { MuiThemeProvider, createTheme } from '@material-ui/core/styles';

import { styleColor } from './Styles/styleThem';
import App from './App';
import GlobalStyle from './Styles/global.styles';
import history from './redux/history';
import MessageBar from './components/MessugeBar';
import buttonHoverSound from './main-select.mp3'; // Replace with the actual path
import typingSound from './typing-sound.mp3'; // Replace with the actual path

const theme = createTheme({
  palette: {
    type: 'dark',
    primary: { main: styleColor.primary.main },
    secondary: { main: styleColor.secondary.main },
    error: { main: styleColor.error.main },
  },
});

// Helper function to check if sounds should play
const shouldPlaySound = () => {
  const state = store.getState(); // Get the latest state from the store
  const { isMuted, clickSounds } = state.auth;
  return !isMuted && !clickSounds; // Play sound only if `isMuted` is false and `gameSounds` is true
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
      <MuiThemeProvider theme={theme}>
        <BrowserRouter>
          <Router history={history}>
            <App />
          </Router>
          <MessageBar />
        </BrowserRouter>
      </MuiThemeProvider>
    </Provider>
  </React.Fragment>,
  document.getElementById('root')
);
