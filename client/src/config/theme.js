import { createTheme } from '@mui/material/styles';

export const getCustomTheme = (isDarkMode) =>
  createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: {
        paper: '#2F4050',
      },
    },
    typography: {
      fontFamily: "'Roboto Mono', monospace",
    },
    components: {
      // Apply global styles with CssBaseline
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: "'Roboto Mono', monospace",
          },
        },
      },
      // Style for input labels
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: 'white',
          },
        },
      },
      // Style for filled variant (for input text)
      MuiFilledInput: {
        styleOverrides: {
          input: {
            color: 'white', // Input text color
          },
        },
      },
      // Style for InputAdornment (for "SOL")
      MuiInputAdornment: {
        styleOverrides: {
          root: {
            color: 'white', // Ensures "SOL" is white
          },
        },
      },
      // Optional: Keep MuiOutlinedInput if used elsewhere
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
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
            color: 'white',
          },
        },
      },
    },
  });