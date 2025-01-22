// theme.js
import { createTheme } from '@mui/material/styles';

export const getCustomTheme = (isDarkMode) => createTheme({
  palette: {
    mode: isDarkMode ? 'dark' : 'light',
  },
  components: {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: isDarkMode ? 'white' : '#666',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: isDarkMode ? '#2b2b2b' : '#fff',
          '& fieldset': {
            borderColor: isDarkMode ? 'white' : '#666',
          },
          '&:hover fieldset': {
            borderColor: isDarkMode ? 'white' : '#4caf50',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#4caf50',
          },
        },
        input: {
          color: isDarkMode ? 'white' : 'black',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'red',
          color: 'white',
          fontSize: '1em',
          padding: '8px',
        },
      },
    },
  },
});