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
      primary: {
        main: '#00B0FF',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#00E676',
        contrastText: '#000000',
      },
      background: {
        default: isDarkMode ? '#121212' : '#f5f5f5',
        paper: isDarkMode ? '#1E1E1E' : '#ffffff',
      },
      success: {
        main: '#00ff3a',
        contrastText: isDarkMode ? '#000000' : '#ffffff',
      },
      error: {
        main: '#ff0000',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#FFC107',
        contrastText: '#000000',
      },
      info: {
        main: '#29B6F6',
        contrastText: '#000000',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#212121',
        secondary: isDarkMode ? '#CCCCCC' : '#757575',
      },
      divider: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
            color: isDarkMode ? '#ffffff' : '#212121',
            // WebKit scrollbar styles (Chrome, Safari, Edge)
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#ff0000', // Red scrollbar
              borderRadius: '4px',
              '&:hover': {
                background: '#cc0000', // Darker red on hover
              },
            },
            // Firefox scrollbar styles
            scrollbarColor: '#ff0000 rgba(255, 255, 255, 0.1)', // thumb track
            scrollbarWidth: 'thin',
          },
          // Ensure scrollable elements inherit scrollbar styles
          '*': {
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#ff0000',
              borderRadius: '4px',
              '&:hover': {
                background: '#cc0000',
              },
            },
            scrollbarColor: '#ff0000 rgba(255, 255, 255, 0.1)',
            scrollbarWidth: 'thin',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
            backgroundImage: 'none',
          },
        },
        defaultProps: {
          elevation: 3,
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: isDarkMode ? '#ffffff' : '#212121',
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            color: 'inherit',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isDarkMode ? '#CCCCCC' : '#757575',
            '&.Mui-focused': {
              color: isDarkMode ? '#00B0FF' : '#2196F3',
            },
            '&.Mui-error': {
              color: (theme) => theme.palette.error.main,
            },
          },
        },
      },
      MuiFilledInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
            },
            '&.Mui-focused': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
            },
            '&.Mui-error': {
              borderColor: (theme) => theme.palette.error.main,
            },
          },
          input: {
            color: isDarkMode ? '#ffffff' : '#212121',
          },
        },
      },
      MuiInputAdornment: {
        styleOverrides: {
          root: {
            color: isDarkMode ? '#CCCCCC' : '#757575',
            '&.Mui-error': {
              color: (theme) => theme.palette.error.main,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '& fieldset': {
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
              borderRadius: 8,
            },
            '&:hover fieldset': {
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: isDarkMode ? '#00B0FF' : '#2196F3',
            },
            '&.Mui-error fieldset': {
              borderColor: (theme) => theme.palette.error.main,
            },
          },
          input: {
            color: isDarkMode ? '#ffffff' : '#212121',
          },
        },
      },
      MuiInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&:before': {
              borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
              borderRadius: 8,
            },
            '&:after': {
              borderBottomColor: isDarkMode ? '#00B0FF' : '#2196F3',
              borderRadius: 8,
            },
            '&.Mui-error:after': {
              borderColor: (theme) => theme.palette.error.main,
            },
          },
          input: {
            color: isDarkMode ? '#ffffff' : '#212121',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiFilledInput-root': {
              borderRadius: 8,
              '&.Mui-error': {
                borderColor: (theme) => theme.palette.error.main,
              },
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              '& fieldset': {
                borderRadius: 8,
              },
              '&.Mui-error fieldset': {
                borderColor: (theme) => theme.palette.error.main,
              },
            },
            '& .MuiInput-root': {
              borderRadius: 8,
              '&.Mui-error:after': {
                borderColor: (theme) => theme.palette.error.main,
              },
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            color: isDarkMode ? '#ACACAC' : '#757575',
            '&.Mui-error': {
              color: (theme) => theme.palette.error.main,
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: isDarkMode ? '#ffffff' : '#616161',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(33, 33, 33, 0.9)',
            color: isDarkMode ? '#212121' : '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 500,
            boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.2)',
          },
        },
      },
      // Removed MuiCircularProgress override to respect color prop
    },
  });