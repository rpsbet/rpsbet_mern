import React from 'react';
import ReactDOM from 'react-dom';
import './index';
import './index.css';
import './dark.css';
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
import AnimatedCursor from './components/AnimatedCursor';
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
const playSound = () => {
  const audio = new Audio(buttonHoverSound);
  audio.volume = 0.15;
  audio.play();
};
const playSoundTyping = () => {
  const audio = new Audio(typingSound);
  audio.volume = 0.2;
  audio.play();
};

document.addEventListener('mouseover', (event) => {
  const target = event.target;
  const isButtonOrLink = target.tagName === 'BUTTON' || target.tagName === 'A' || (target.getAttribute('role') === 'button');
  
  if (isButtonOrLink) {
    playSound();
  }
});

document.addEventListener('focus', (event) => {
  const target = event.target;
  const isButtonOrLink = target.tagName === 'BUTTON' || target.tagName === 'A' || (target.getAttribute('role') === 'button');
  
  if (isButtonOrLink) {
    playSound();
  }
});

document.addEventListener('input', (event) => {
  const target = event.target;

  // Check if the target is an input or textarea
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    playSoundTyping();
  }
});

ReactDOM.render(
  <React.Fragment>
    <Provider store={store}>
      {window.innerWidth > 767 && <AnimatedCursor />}
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
