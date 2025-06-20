import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { Alert } from '@mui/material';
import store from './redux/store';
import App from './App';
import MessageBar from './components/MessageBar';
import './index.css';

// Add global CSS to remove ripple effect
const globalStyles = `
  .MuiTouchRipple-root {
    display: none !important;
  }
`;

// Inject global styles
const styleSheet = document.createElement('style');
styleSheet.innerHTML = globalStyles;
document.head.appendChild(styleSheet);

// Custom Alert component for notistack success variant
const CustomSuccessSnackbar = React.forwardRef((props, ref) => {
  const { message, ...other } = props;
  return (
    <Alert
      ref={ref}
      severity="success"
      variant="filled"
      sx={{
        backgroundColor: '#00ff3a !important',
        color: '#fff !important',
        borderRadius: '8px',
        '& .MuiAlert-icon': { color: '#fff !important' },
        '& .MuiAlert-message': { color: '#fff !important' },
      }}
      {...other}
    >
      {message}
    </Alert>
  );
});

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode: mode,
      primary: { main: '#3949ab' },
      secondary: { main: '#f50057' },
      error: { main: '#FF0000' },
      success: {
        main: '#00ff3a',
        contrastText: '#fff',
      },
      background: {
        default: mode === 'dark' ? '#262626' : '#f4f6f8',
        paper: '#ffffff',
      },
      text: {
        primary: '#ffffff',
        secondary: '#ffffff',
      },
    },

    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            color: '#ffffff11 !important',
            '& *': {
              color: '#fff !important',
            },
            // Exclude SnackbarContent to avoid interference
            '&:not(.MuiSnackbarContent-root)': {
              backgroundColor: '#ffffff11',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiIconButton: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiMenuItem: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiListItemButton: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableRipple: true,
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiSnackbarContent-root': {
              backgroundColor: '#00ff3a !important',
              color: '#fff !important',
              borderRadius: '8px',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            '&.MuiAlert-standardSuccess': {
              backgroundColor: '#00ff3a !important',
              color: '#fff !important',
            },
            '&.MuiAlert-filledSuccess': {
              backgroundColor: '#00ff3a !important',
              color: '#fff !important',
            },
            borderRadius: '8px',
          },
          message: {
            color: 'inherit !important',
          },
          icon: {
            color: 'inherit !important',
          },
        },
      },
    },
  });

const currentMode = 'dark';
const theme = getTheme(currentMode);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <PrivyProvider
    appId="cm9i6xoyw033ll80ntlqnl78e"
    config={{
      loginMethods: ['wallet', 'google', 'email'], // Wallet first for web3 users
      appearance: {
        theme: 'dark',
        showWalletLoginFirst: true, // Show wallet options first on mobile
        walletChainType: 'solana-only',
        // Optimized order: most popular mobile wallets first
        walletList: [
          "phantom",                    // Most popular Solana wallet
          "solflare",                   // Popular mobile wallet
          "backpack",                   // Growing mobile user base  
          "detected_solana_wallets",    // Auto-detect other installed wallets
          "wallet_connect",             // Explicit WalletConnect for long-tail wallets
          "okx_wallet"
        ]
      },
      embeddedWallets: {
        requireUserPasswordOnCreate: false,
        showWalletUIs: true,
        ethereum: { createOnLogin: "off" },
        solana: {
          createOnLogin: "users-without-wallets" // Create smart wallet if no external wallet
        }
      },
      externalWallets: {
        solana: {
          connectors: toSolanaWalletConnectors(),
        }
      },
      // Optional: Customize mobile experience
      mfa: {
        noPromptOnMfaRequired: false
      }
    }}
  >
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={10}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          autoHideDuration={1000}
          style={{ transform: 'translateY(-90px)' }}
          Components={{
            success: CustomSuccessSnackbar, // Map success variant to custom Alert
          }}
        >
          <BrowserRouter>
            <App />
            <MessageBar />
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  </PrivyProvider>
);


