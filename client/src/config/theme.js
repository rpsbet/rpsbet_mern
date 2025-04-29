import { createTheme } from '@mui/material/styles';

// Add global CSS to enforce border radius for buttons and inputs
const globalStyles = `
  .MuiButton-root {
    border-radius: 8px !important;
  }
  .MuiFilledInput-root,
  .MuiOutlinedInput-root,
  .MuiInput-root,
  .MuiTextField-root fieldset {
    border-radius: 8px !important;
  }
`;

// Inject global styles into the document
const styleSheet = document.createElement('style');
styleSheet.innerHTML = globalStyles;
document.head.appendChild(styleSheet);

export const getCustomTheme = (isDarkMode = true) =>
  createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: {
        paper: '#080808',
      },
      success: {
        main: '#00ff3a', // Override success color
        contrastText: '#fff', // Optional: Set contrast text color for readability
      },
    },
    shape: {
      borderRadius: 8, // Global border radius for components (fallback)
    },
    components: {
      // Style for buttons
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px !important', // Force border radius for buttons
            textTransform: 'none', // Optional: Prevent uppercase text
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
          root: {
            borderRadius: '8px !important', // Force border radius for filled inputs
            backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
            '&:hover': {
              backgroundColor: isDarkMode ? '#2a2a2a' : '#e0e0e0',
            },
            '&.Mui-focused': {
              backgroundColor: isDarkMode ? '#2a2a2a' : '#e0e0e0',
            },
          },
          input: {
            color: 'white',
          },
        },
      },
      // Style for InputAdornment (for "SOL")
      MuiInputAdornment: {
        styleOverrides: {
          root: {
            color: 'white',
          },
        },
      },
      // Style for outlined inputs
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '8px !important', // Force border radius for outlined inputs
            '& fieldset': {
              borderColor: isDarkMode ? 'white' : '#666',
              borderRadius: '8px !important', // Ensure fieldset respects border radius
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
      // Style for standard inputs (MuiInput)
      MuiInput: {
        styleOverrides: {
          root: {
            borderRadius: '8px !important', // Force border radius for standard inputs
            '&:before': {
              borderRadius: '8px !important', // For underline in standard variant
            },
            '&:after': {
              borderRadius: '8px !important', // For focused underline
            },
          },
          input: {
            color: 'white',
          },
        },
      },
      // Style for TextField (to cover all variants)
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiFilledInput-root': {
              borderRadius: '8px !important',
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px !important',
              '& fieldset': {
                borderRadius: '8px !important',
              },
            },
            '& .MuiInput-root': {
              borderRadius: '8px !important',
            },
          },
        },
      },
      // Style for Drawer to make MuiDrawer-paper background transparent
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: 'transparent', // Set Drawer paper background to transparent
          },
        },
      },
    },
  });