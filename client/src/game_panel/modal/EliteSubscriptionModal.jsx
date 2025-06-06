import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { usePrivy } from '@privy-io/react-auth';
import { purchaseEliteSubscription, cancelEliteSubscription } from '../../redux/Auth/user.actions';
import { sendSolDeposit, createAccountFromPrivyUser } from '../../util/solana';
import {
  Box, Typography, Button, Modal, Card, CardContent, CardActions, Grid,
  List, ListItem, ListItemIcon, ListItemText, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, AlertTitle, Chip, Stack, Avatar,
  CardMedia, Divider
} from '@mui/material';
import {
  Close as CloseIcon, Warning as WarningIcon, Star as StarIcon, Code as CodeIcon,
  Support as SupportIcon, Percent as PercentIcon, AccountBalanceWallet as WalletIcon,
  AutoAwesome as SparkleIcon, Bolt as BoltIcon, Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon, Cancel as CancelIcon
} from '@mui/icons-material';
import Lottie from 'react-lottie';
import verified from '../LottieAnimations/verified.json';

const themeColors = {
  backgroundPrimary: '#2a2a2a',
  backgroundSecondary: '#3a3a3a',
  backgroundTertiary: '#424850',
  textPrimary: '#F0F2F5',
  textSecondary: '#BCC0C4',
  textDisabled: '#656A70',
  accentRedPrimary: '#D32F2F',
  accentRedSecondary: '#C62828',
  accentRedLight: 'rgba(211, 47, 47, 0.08)',
  accentRedBorder: 'rgba(211, 47, 47, 0.35)',
  borderColor: 'rgba(255, 255, 255, 0.12)',
  modalBackdrop: 'rgba(10, 12, 15, 0.85)',
  headerBackground: '#1a1a1a',
  buttonDisabledBg: '#40454A',
  chipPopularBg: '#D32F2F',

  redPlan: {
    main: '#D32F2F',
    lightHover: '#E53935',
    contrastText: '#ffffff',
    headerGradient: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)',
    featureBg: 'rgba(211, 47, 47, 0.1)',
  },
  blackPlan: {
    main: '#C62828',
    lightHover: '#D32F2F',
    contrastText: '#ffffff',
    cardBg: '#2e2e2e',
    headerBg: '#1b1b1b',
    headerText: '#D32F2F',
    featureBg: 'rgba(198, 40, 40, 0.09)',
  },
};

function EliteSubscriptionModal({
  open,
  onClose,
  isLowGraphics,
  user,
  walletBalance
}) {
  const dispatch = useDispatch();
  const { user: privyUser } = usePrivy();
  
  // Get account from Redux state as fallback
  const reduxAccount = useSelector(state => state.logic?.account);
  
  const numericWalletBalance = parseFloat(walletBalance);
  const [loading, setLoading] = useState({ red: false, black: false, cancel: false });
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // Subscription amounts matching original logic
  const subscriptionAmounts = useMemo(() => ({ red: 0.1, black: 0.4 }), []);

  // Check sufficient balance using walletBalance prop
  const sufficientBalance = useMemo(() => {
    return {
      red: numericWalletBalance >= subscriptionAmounts.red,
      black: numericWalletBalance >= subscriptionAmounts.black,
    };
  }, [numericWalletBalance, subscriptionAmounts]);

  const getButtonText = useCallback((type) => {
    if (!user?.elite) return type === 'red' ? 'Subscribe Now' : 'Subscribe Now';
    if (type === user.elite) return 'Current Plan';
    if (type === 'red' && user.elite === 'black') return 'Downgrade';
    if (type === 'black' && user.elite === 'red') return 'Upgrade';
    return 'Subscribe Now';
  }, [user]);

  const handlePurchaseSubscription = async (type) => {
    if (!sufficientBalance[type]) {
      console.error('Insufficient balance for subscription');
      return;
    }
    
    // Enhanced account creation with multiple fallbacks
    let account = null;
    
    // Method 1: Try creating from Privy user
    if (privyUser?.wallet?.address) {
      try {
        account = createAccountFromPrivyUser(privyUser);
        console.log('Account created from Privy user:', account);
      } catch (error) {
        console.error('Failed to create account from Privy user:', error);
      }
    }
    
    // Method 2: Try using Redux account
    if (!account && reduxAccount?.publicKey) {
      account = reduxAccount;
      console.log('Using Redux account:', account);
    }
    
    // Method 3: Try getting from connected wallet directly
    if (!account && window.solana?.publicKey) {
      try {
        account = {
          publicKey: window.solana.publicKey
        };
        console.log('Account created from window.solana:', account);
      } catch (error) {
        console.error('Failed to create account from window.solana:', error);
      }
    }
    
    // Method 4: Try connecting wallet if not connected
    if (!account && window.solana) {
      try {
        if (!window.solana.isConnected) {
          console.log('Wallet not connected, attempting to connect...');
          await window.solana.connect();
        }
        
        if (window.solana.publicKey) {
          account = {
            publicKey: window.solana.publicKey
          };
          console.log('Account created after wallet connection:', account);
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }

    // Final validation
    if (!account?.publicKey) {
      console.error('Failed to create account - no valid source found', {
        privyUser: !!privyUser?.wallet?.address,
        reduxAccount: !!reduxAccount?.publicKey,
        windowSolana: !!window.solana?.publicKey,
        walletConnected: window.solana?.isConnected
      });
      
      // Show user-friendly error
      dispatch({
        type: 'MSG_ERROR',
        payload: 'Wallet not connected. Please connect your Solana wallet and try again.'
      });
      return;
    }

    console.log('Final account object:', {
      publicKey: account.publicKey.toString(),
      source: privyUser?.wallet?.address ? 'privy' : 
              reduxAccount?.publicKey ? 'redux' : 'wallet'
    });

    setLoading((prev) => ({ ...prev, [type]: true }));
    
    try {
      // Use sendSolDeposit for blockchain transaction with elite subscription info
      const solResult = await sendSolDeposit(
        dispatch,
        subscriptionAmounts[type],
        null, // room_id
        `Elite ${type.charAt(0).toUpperCase() + type.slice(1)} Subscription`, // room_name  
        'elite_subscription', // type
        account,
        numericWalletBalance,
        () => {
          // onSuccess - transaction completed successfully
          console.log('SOL transaction successful');
        },
        (error) => {
          // onError - transaction failed
          console.log('SOL transaction failed:', error);
        },
        () => {
          // onPopupOpen
          console.log('Wallet popup opened');
        },
        () => {
          // onPopupClose
          console.log('Wallet popup closed');
        },
        // Additional subscription info
        {
          subscriptionType: type,
          subscriptionTier: type === 'red' ? 'Red Elite' : 'Black Elite',
          features: type === 'red' 
            ? ['150 Game Credits per month', '24/7 Support']
            : ['800 Game Credits per month', 'Developer Access', '50% Fee Reduction', 'Priority Support'],
          monthlyPrice: subscriptionAmounts[type]
        }
      );

      if (solResult.success) {
        // Extract transaction signature from the result
        const signature = solResult.result?.txtHash || 
                         solResult.result?.signature || 
                         solResult.result?.transactionSignature;
        
        if (signature) {
          // If SOL transaction succeeds, verify with backend
          const backendResult = await dispatch(purchaseEliteSubscription(type, signature));
          if (backendResult) {
            onClose();
          }
        } else {
          console.error('No transaction signature found in result:', solResult);
          dispatch({
            type: 'MSG_ERROR',
            payload: 'Transaction completed but signature not found. Please contact support.'
          });
        }
      }
    } catch (error) {
      console.error('Error during subscription purchase:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const openCancelConfirmation = () => setCancelConfirmOpen(true);
  const closeCancelConfirmation = () => setCancelConfirmOpen(false);

  const handleCancelSubscription = async () => {
    setLoading((prev) => ({ ...prev, cancel: true }));
    await dispatch(cancelEliteSubscription());
    setLoading((prev) => ({ ...prev, cancel: false }));
    setCancelConfirmOpen(false);
    onClose();
  };

  const getSubscriptionPrice = useCallback((type) => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: '1.75rem' }}>
          {type === 'red' ? '0.1' : '0.4'} <Typography component="span" sx={{ fontSize: '0.8rem', ml: 0.5 }}>SOL</Typography>
        </Typography>
        <Typography sx={{ alignSelf: 'flex-end', ml: 1, color: 'text.secondary', fontSize: '0.65rem' }}>/month</Typography>
      </Box>
    );
  }, []);

  const cardBaseSx = {
    height: '100%', position: 'relative', borderRadius: 1.5, display: 'flex',
    flexDirection: 'column', color: themeColors.textPrimary, border: `1px solid ${themeColors.borderColor}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  };

  const cardHeaderBaseSx = { color: themeColors.textPrimary, p: 1.5, textAlign: 'center' };
  
  const planButtonBaseSx = (mainColor, hoverColor, textColor = themeColors.textPrimary) => ({
    py: 1, fontSize: '0.8rem', fontWeight: 'bold', borderRadius: 1,
    bgcolor: mainColor, color: textColor,
    '&:hover': { bgcolor: hoverColor, boxShadow: `0 0 8px ${hoverColor}AA` },
    '&.Mui-disabled': {
      background: themeColors.buttonDisabledBg,
      color: themeColors.textDisabled,
      boxShadow: 'none'
    },
  });

  return (
    <>
      <Modal open={open} onClose={onClose} sx={{ zIndex: 1300 }} BackdropProps={{ style: { backgroundColor: themeColors.modalBackdrop } }}>
        <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '90vw', sm: '600px', md: '680px' }, maxHeight: '90vh', overflowY: 'auto',
            borderRadius: 2.5, bgcolor: themeColors.backgroundPrimary, outline: 'none',
            border: `1px solid ${themeColors.borderColor}`, boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
        }}>
          {/* Header with banner */}
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              image="/img/pro-banner.svg"
              alt="Elite Membership Banner"
              sx={{ height: 120 }}
            />
            <Button onClick={onClose} sx={{
                position: 'absolute', top: 8, right: 8, minWidth: 'auto', p: 0.75,
                bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, borderRadius: '50%',
            }}> <CloseIcon fontSize="small" /> </Button>
          </Box>

          {/* Title Section */}
          <Box sx={{ background: themeColors.headerBackground, color: themeColors.textPrimary, p: {xs: 1.5, md: 2} }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75} sx={{ mb: 1 }}>
              <SparkleIcon sx={{ fontSize: '24px', color: themeColors.accentRedPrimary }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: themeColors.textPrimary, fontSize: '1.1rem' }}>
                Upgrade to Elite
              </Typography>
            </Stack>
            <Typography variant="body2" align="center" sx={{ opacity: 0.7, fontWeight: 300, fontSize: '0.85rem', mb: 1.5 }}>
              Unlock gate-kept financial tools and take your profits to the next level
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: themeColors.backgroundSecondary, borderRadius: 1.5, p: 1, border: `1px solid ${themeColors.borderColor}` }}>
              <Avatar sx={{ bgcolor: themeColors.accentRedPrimary, color: themeColors.textPrimary, mr: 1, width: 30, height: 30 }}>
                <WalletIcon sx={{fontSize: '1rem'}}/>
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem', color: themeColors.textSecondary }}>Wallet Balance</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem', color: themeColors.textPrimary }}>{numericWalletBalance.toFixed(3)} SOL</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: {xs: 1.5, md: 2} }}>
            <Grid container spacing={2}>
              {/* Red Elite Card */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...cardBaseSx, bgcolor: themeColors.backgroundSecondary, borderColor: user?.elite === 'red' ? themeColors.redPlan.main : themeColors.borderColor }}>
                  {user?.elite === 'red' && <Chip label="CURRENT" size="small" sx={{ position: 'absolute', top: 8, right: 8, bgcolor: themeColors.redPlan.main, color: themeColors.redPlan.contrastText, fontWeight: 'bold', fontSize: '0.65rem', zIndex: 1, height: '18px' }} />}
                  <Box sx={{ ...cardHeaderBaseSx, background: themeColors.redPlan.headerGradient }}>
                    <Box sx={{ width: '50px', alignItems: 'center', display: 'flex', justifyContent: 'center', margin: '0 auto 8px', filter: 'hue-rotate(132deg)' }}>
                      <Lottie
                        options={{
                          loop: !isLowGraphics,
                          autoplay: !isLowGraphics,
                          animationData: verified,
                        }}
                        width={40}
                        height={40}
                      />
                    </Box>
                    <Typography variant="h6" sx={{fontSize: '1rem', fontWeight: 'bold'}}>Red Elite</Typography>
                  </Box>
                  <CardContent sx={{ p: 1.5, flexGrow: 1 }}>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      {getSubscriptionPrice('red')}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <List sx={{ py: 0 }}>
                      <ListItem sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: '36px' }}>
                          <CheckCircleIcon sx={{ color: themeColors.redPlan.main }} />
                        </ListItemIcon>
                        <ListItemText primary="150 Game Creation Credits per month" />
                      </ListItem>
                      <ListItem sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: '36px' }}>
                          <CheckCircleIcon sx={{ color: themeColors.redPlan.main }} />
                        </ListItemIcon>
                        <ListItemText primary="24/7 Support" />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions sx={{ p: 1.5, pt: 0, mt: 'auto' }}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => handlePurchaseSubscription('red')} 
                      disabled={loading.red || !sufficientBalance.red || user?.elite === 'red'}
                      sx={planButtonBaseSx(themeColors.redPlan.main, themeColors.redPlan.lightHover, themeColors.redPlan.contrastText)}
                    >
                      {loading.red ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : !sufficientBalance.red ? (
                        'Not Enough Balance'
                      ) : (
                        getButtonText('red')
                      )}
                    </Button>
                  </CardActions>
                  {user?.elite === 'red' && (
                    <Box sx={{ px: 1.5, pb: 1 }}>
                      <Button 
                        fullWidth 
                        variant="text" 
                        size="small" 
                        onClick={openCancelConfirmation} 
                        startIcon={<CancelIcon />}
                        sx={{ color: themeColors.redPlan.lightHover, fontWeight: '500', fontSize: '0.75rem', '&:hover': { bgcolor: themeColors.redPlan.featureBg } }}
                      >
                        Cancel Subscription
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Black Elite Card */}
              <Grid item xs={12} md={6}>
                <Card sx={{ ...cardBaseSx, bgcolor: themeColors.blackPlan.cardBg, borderColor: user?.elite === 'black' ? themeColors.blackPlan.main : themeColors.borderColor }}>
                  {(!user?.elite || user?.elite === 'red') && <Chip icon={<StarIcon sx={{fontSize: '0.8rem !important'}}/>} label="POPULAR" size="small" sx={{ position: 'absolute', top: 8, left: 8, bgcolor: themeColors.chipPopularBg, color: themeColors.textPrimary, fontWeight: 'bold', fontSize: '0.65rem', zIndex: 1, '& .MuiChip-icon': { color: themeColors.textPrimary, ml: '3px', height: '18px' } }} />}
                  {user?.elite === 'black' && <Chip label="CURRENT" size="small" sx={{ position: 'absolute', top: 8, right: 8, bgcolor: themeColors.blackPlan.main, color: themeColors.blackPlan.contrastText, fontWeight: 'bold', fontSize: '0.65rem', zIndex: 1, height: '18px' }} />}
                  <Box sx={{ ...cardHeaderBaseSx, background: themeColors.blackPlan.headerBg }}>
                    <Box sx={{ width: '50px', alignItems: 'center', display: 'flex', justifyContent: 'center', margin: '0 auto 8px', filter: 'grayscale(1)' }}>
                      <Lottie
                        options={{
                          loop: !isLowGraphics,
                          autoplay: !isLowGraphics,
                          animationData: verified,
                        }}
                        width={40}
                        height={40}
                      />
                    </Box>
                    <Typography variant="h6" sx={{fontSize: '1rem', fontWeight: 'bold', color: themeColors.blackPlan.headerText }}>Black Elite</Typography>
                  </Box>
                  <CardContent sx={{ p: 1.5, flexGrow: 1 }}>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      {getSubscriptionPrice('black')}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <List sx={{ py: 0 }}>
                      <ListItem sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: '36px' }}>
                          <CheckCircleIcon sx={{ color: themeColors.blackPlan.main }} />
                        </ListItemIcon>
                        <ListItemText primary="800 Game Creation Credits per month" primaryTypographyProps={{ fontWeight: 'medium' }} />
                      </ListItem>
                      <ListItem sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: '36px' }}>
                          <CheckCircleIcon sx={{ color: themeColors.blackPlan.main }} />
                        </ListItemIcon>
                        <ListItemText primary="Reduced fees by 50%" primaryTypographyProps={{ fontWeight: 'medium' }} />
                      </ListItem>
                      <ListItem sx={{ py: 1 }}>
                        <ListItemIcon sx={{ minWidth: '36px' }}>
                          <CheckCircleIcon sx={{ color: themeColors.blackPlan.main }} />
                        </ListItemIcon>
                        <ListItemText primary="24/7 Priority Support" primaryTypographyProps={{ fontWeight: 'medium' }} />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions sx={{ p: 1.5, pt: 0, mt: 'auto' }}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      onClick={() => handlePurchaseSubscription('black')} 
                      disabled={loading.black || !sufficientBalance.black || user?.elite === 'black'}
                      sx={planButtonBaseSx(themeColors.blackPlan.main, themeColors.blackPlan.lightHover, themeColors.blackPlan.contrastText)}
                    >
                      {loading.black ? (
                        <CircularProgress size={18} color="inherit"/>
                      ) : !sufficientBalance.black ? (
                        'Not Enough Balance'
                      ) : (
                        getButtonText('black')
                      )}
                    </Button>
                  </CardActions>
                  {user?.elite === 'black' && (
                    <Box sx={{ px: 1.5, pb: 1 }}>
                      <Button 
                        fullWidth 
                        variant="text" 
                        size="small" 
                        onClick={openCancelConfirmation} 
                        startIcon={<CancelIcon />}
                        sx={{ color: themeColors.blackPlan.lightHover, fontWeight: '500', fontSize: '0.75rem', '&:hover': { bgcolor: themeColors.blackPlan.featureBg } }}
                      >
                        Cancel Subscription
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Footer info */}
            <Box sx={{ mt: 2, p: 1.5, background: themeColors.backgroundSecondary, borderRadius: 1.5, border: `1px solid ${themeColors.borderColor}` }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                <Avatar sx={{ bgcolor: themeColors.accentRedPrimary, width: 30, height: 30, color: themeColors.textPrimary }}>
                  <WalletIcon sx={{ fontSize: '1rem' }} />
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight="500" sx={{ color: themeColors.textPrimary, fontSize: '0.9rem' }}>Secure Blockchain Payment</Typography>
                  <Typography variant="body2" sx={{ color: themeColors.textSecondary, fontSize: '0.75rem' }}>Powered by Solana</Typography>
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: themeColors.textSecondary, lineHeight: 1.4, fontSize: '0.75rem', display:'block' }}>
                Pay directly from your Solana wallet. Monthly subscription billing.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelConfirmOpen} onClose={closeCancelConfirmation} maxWidth="xs" fullWidth PaperProps={{ sx: { background: themeColors.backgroundSecondary, color: themeColors.textPrimary, borderRadius: 2, border: `1px solid ${themeColors.accentRedBorder}` } }}>
        <DialogTitle sx={{ textAlign: 'center', p: 2, pb: 0.5 }}>
          <Avatar sx={{ bgcolor: themeColors.accentRedLight, color: themeColors.accentRedPrimary, width: 44, height: 44, mx: 'auto', mb: 1 }}>
            <WarningIcon sx={{ fontSize: '22px' }} />
          </Avatar>
          <Typography variant="h6" fontWeight="bold" sx={{fontSize: '1.05rem'}}>Cancel Elite Subscription?</Typography>
          <Typography variant="body2" sx={{ color: themeColors.textSecondary, fontSize: '0.8rem' }}>This action is irreversible.</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: {xs:1.5, md:2}, pb: 1.5 }}>
          <Alert 
            severity="warning" 
            icon={<WarningIcon sx={{ color: themeColors.accentRedPrimary, fontSize: '1.2rem' }}/>} 
            sx={{ 
              mb: 1.5, 
              bgcolor: themeColors.accentRedLight, 
              border: `1px solid ${themeColors.accentRedBorder}66`, 
              borderRadius: 1, 
              color: themeColors.textPrimary, 
              p:1.5, 
              '& .MuiAlert-icon': {alignSelf: 'center', mr: 1} 
            }}
          >
            <AlertTitle sx={{ fontSize: '0.85rem', mb: 0.5, fontWeight: 'bold' }}>
              Important: Service Limitations
            </AlertTitle>
            <Typography variant="body2" component="div" sx={{ color: themeColors.textPrimary }}>
              After cancellation, the following services will be paused immediately:
              <List dense disablePadding sx={{ mt: 1 }}>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '32px' }}>
                    <CancelIcon fontSize="small" sx={{ color: themeColors.accentRedPrimary }} />
                  </ListItemIcon>
                  <ListItemText primary="All active game houses" />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '32px' }}>
                    <CancelIcon fontSize="small" sx={{ color: themeColors.accentRedPrimary }} />
                  </ListItemIcon>
                  <ListItemText primary="Access to Elite benefits and features" />
                </ListItem>
              </List>
            </Typography>
          </Alert>
          <Typography variant="body1" sx={{ mb: 2, fontSize: '0.85rem' }}>
            These services will remain paused until you renew your Elite subscription.
          </Typography>
          <Typography variant="caption" sx={{ color: themeColors.textSecondary, lineHeight: 1.4, textAlign: 'center', display: 'block', fontStyle: 'italic', fontSize: '0.7rem' }}>
            Your subscription will be cancelled immediately and you will lose access to Elite features.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 1.5, gap: 1, justifyContent: 'center' }}>
          <Button 
            onClick={closeCancelConfirmation} 
            variant="outlined" 
            size="small" 
            sx={{ 
              color: themeColors.textSecondary, 
              borderColor: themeColors.borderColor, 
              fontSize: '0.75rem', 
              '&:hover': { borderColor: themeColors.textPrimary, bgcolor: 'rgba(255,255,255,0.05)' } 
            }}
          >
            Keep Subscription
          </Button>
          <Button 
            onClick={handleCancelSubscription} 
            disabled={loading.cancel} 
            variant="contained" 
            size="small"
            sx={{ 
              bgcolor: themeColors.accentRedPrimary, 
              color: themeColors.textPrimary, 
              fontSize: '0.75rem', 
              '&:hover': { bgcolor: themeColors.accentRedSecondary } 
            }}
          >
            {loading.cancel ? <CircularProgress size={16} color="inherit" /> : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default React.memo(EliteSubscriptionModal);