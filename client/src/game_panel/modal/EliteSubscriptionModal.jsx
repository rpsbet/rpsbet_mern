// ActiveTabText.jsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { purchaseEliteSubscription, cancelEliteSubscription } from '../../redux/Auth/user.actions';
import {
  Box,
  Typography,
  Button,
  Modal,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon

} from '@mui/icons-material';
import Lottie from 'react-lottie';
import verified from '../LottieAnimations/verified.json';

function EliteSubscriptionModal({ open, onClose, isLowGraphics, user }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState({ red: false, black: false, cancel: false });
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const getButtonText = (type) => {
    if (!user?.elite) return 'Subscribe Now';
    if (type === user.elite) return 'Current Plan';
    if (type === 'red' && user.elite === 'black') return 'Downgrade';
    if (type === 'black' && user.elite === 'red') return 'Upgrade';
    return 'Subscribe Now';
  };
  const hasSufficientBalance = (type) => {
    const subscriptionAmounts = { red: 0.1, black: 1.0 };
    return user?.balance >= subscriptionAmounts[type];
  };

  const handlePurchaseSubscription = async (type) => {
    if (!hasSufficientBalance(type)) return;
    setLoading((prev) => ({ ...prev, [type]: true }));
    await dispatch(purchaseEliteSubscription(type));
    setLoading((prev) => ({ ...prev, [type]: false }));
    onClose();
  };
  
  const openCancelConfirmation = () => {
    setCancelConfirmOpen(true);
  };

  const closeCancelConfirmation = () => {
    setCancelConfirmOpen(false);
  };

  const handleCancelSubscription = async () => {
    setLoading((prev) => ({ ...prev, cancel: true }));
    await dispatch(cancelEliteSubscription());
    setLoading((prev) => ({ ...prev, cancel: false }));
    setCancelConfirmOpen(false);
    onClose();
  };
  
  // ------------------ RENDER ------------------
  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="elite-subscription-modal"
        aria-describedby="elite-subscription-packages"
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: '#0a0a0a', // Dark background color
            color: '#fff',
            boxShadow: 24,
            borderRadius: 1,
            p: 3,
            maxWidth: '90vw',
            minWidth: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              image="/img/pro-banner.svg"
              alt="Elite Membership Banner"
              sx={{ height: 180 }}
            />
            <Button
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                minWidth: 'auto',
                p: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                borderRadius: '50%',
              }}
            >
              <CloseIcon />
            </Button>
          </Box>

          <Typography
            variant="h4"
            align="center"
            sx={{
              mt: 2,
              mb: 1,
              fontWeight: 'bold',
              background: `
        linear-gradient(45deg, #ff0000 0%, #ff6b6b 50%, #ff0000 100%),
        linear-gradient(45deg, #d81719 0%, #ff9999 50%, #d81719 100%),
        linear-gradient(45deg, #ffffff 0%, #ffffff 50%, #ffffff 100%)
      `,
              backgroundSize: '100% 33.33%, 100% 33.33%, 100% 33.33%',
              backgroundPosition: '0 0, 0 33.33%, 0 66.66%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent', // Make text transparent to show gradient
              textShadow: `
        0 0 5px rgba(255, 0, 0, 0.5),
        0 0 10px rgba(255, 0, 0, 0.3),
        0 0 15px rgba(255, 0, 0, 0.2)
      `, // Add layered glow effect
              position: 'relative',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.3,
                zIndex: -1,
                pointerEvents: 'none',
              },
            }}
          >
            Upgrade to Elite
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 3, px: 3, }}>
            Unlock gate-kept financial tools and take your profits to the next level
          </Typography>

          <Grid container spacing={3} sx={{ px: 3, pb: 3 }}>
            {/* Red Elite Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                boxShadow: '0 6px 20px rgba(216, 23, 25, 0.15)',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(216, 23, 25, 0.25)',
                  transform: 'translateY(-4px)',
                },
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                border: '1px solid rgba(216, 23, 25, 0.3)',
              }}>
                <Box
                  sx={{
                    bgcolor: '#d81719',
                    color: 'white',
                    py: 2,
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px',
                    textAlign: 'center'
                  }}
                >

                  <Typography variant="h5" fontWeight="bold">
                    <Box
                      sx={{
                        width: '50px',
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '0 auto',
                        filter: 'hue-rotate(132deg)',
                      }}
                    >
                      <Lottie
                        options={{
                          loop: !isLowGraphics,
                          autoplay: !isLowGraphics,
                          animationData: verified,
                        }}
                      />
                    </Box>
                    Red Elite
                  </Typography>
                </Box>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      0.1 <Typography component="span" sx={{ fontSize: '1rem', ml: 0.5 }}>SOL</Typography>
                    </Typography>
                    <Typography sx={{ alignSelf: 'flex-end', ml: 1, color: 'text.secondary' }}>/month</Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List sx={{ py: 0 }}>
                    <ListItem sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <CheckCircleIcon sx={{ color: '#d81719' }} />
                      </ListItemIcon>
                      <ListItemText primary="2 Game Houses a Time" />
                    </ListItem>
                    <ListItem sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <CheckCircleIcon sx={{ color: '#d81719' }} />
                      </ListItemIcon>
                      <ListItemText primary="1 SOL in Loan creation" />
                    </ListItem>
                    <ListItem sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <CheckCircleIcon sx={{ color: '#d81719' }} />
                      </ListItemIcon>
                      <ListItemText primary="24/7 Support" />
                    </ListItem>
                  </List>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  
                  <Button
                    variant="contained"
                    onClick={() => handlePurchaseSubscription('red')}
                    disabled={loading.red || !hasSufficientBalance('red') || user?.elite === 'red'}
                    sx={{
                      bgcolor: '#d81719',
                      px: 4,
                      py: 1,
                      '&:hover': { bgcolor: '#b01416' },
                      '&.Mui-disabled': {
                        bgcolor: '#d81719',
                        color: '#ffffff', // Ensure text color is white
                        opacity: 0.6, // Overall button opacity
                        '& .MuiButton-label': {
                          opacity: 1, // Increase text opacity (optional, if needed)
                        },
                      },
                    }}

                  >
                    {loading.red ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : !hasSufficientBalance('red') ? (
                      'Not Enough Balance'
                    ) : (
                      getButtonText('red')
                    )}
                  </Button>
                </CardActions>
                {user?.elite === 'red' && (
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Button
                        variant="text"
                        onClick={openCancelConfirmation}
                        startIcon={<CancelIcon />}
                        sx={{
                          borderColor: '#d81719',
                          color: '#d81719',
                          '&:hover': {
                            borderColor: '#b01416',
                            color: '#b01416',
                            bgcolor: 'rgba(216, 23, 25, 0.04)',
                          },
                        }}
                      >
                        Cancel Subscription
                      </Button>
                    </Box>
                  )}
              </Card>
            </Grid>

            {/* Black Elite Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '12px',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.25)',
                  transform: 'translateY(-4px)',
                },
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                border: '1px solid rgba(0, 0, 0, 0.3)',
              }}>
                <Box
                  sx={{
                    bgcolor: '#000000',
                    color: 'white',
                    py: 2,
                    borderTopLeftRadius: '12px',
                    borderTopRightRadius: '12px',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h5" fontWeight="bold">
                    <Box
                      sx={{
                        width: '50px',
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '0 auto',
                        filter: 'grayscale(1)',
                      }}
                    >
                      <Lottie
                        options={{
                          loop: !isLowGraphics,
                          autoplay: !isLowGraphics,
                          animationData: verified,
                        }}
                      />
                    </Box>
                    Black Elite</Typography>
                </Box>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      1.0 <Typography component="span" sx={{ fontSize: '1rem', ml: 0.5 }}>SOL</Typography>
                    </Typography>
                    <Typography sx={{ alignSelf: 'flex-end', ml: 1, color: 'text.secondary' }}>/month</Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <List sx={{ py: 0 }}>
                    <ListItem sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <CheckCircleIcon sx={{ color: '#000000' }} />
                      </ListItemIcon>
                      <ListItemText primary="20 Game Houses a Time" primaryTypographyProps={{ fontWeight: 'medium' }} />
                    </ListItem>
                    <ListItem sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <CheckCircleIcon sx={{ color: '#000000' }} />
                      </ListItemIcon>
                      <ListItemText primary="10 SOL in Loan creation" primaryTypographyProps={{ fontWeight: 'medium' }} />
                    </ListItem>
                    <ListItem sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <CheckCircleIcon sx={{ color: '#000000' }} />
                      </ListItemIcon>
                      <ListItemText primary="Reduced fees by 50%" primaryTypographyProps={{ fontWeight: 'medium' }} />
                    </ListItem>
                    <ListItem sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: '36px' }}>
                        <CheckCircleIcon sx={{ color: '#000000' }} />
                      </ListItemIcon>
                      <ListItemText primary="24/7 Priority Support" primaryTypographyProps={{ fontWeight: 'medium' }} />
                    </ListItem>
                  </List>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                  {user?.elite === 'black' && (
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Button
                        variant="text"
                        onClick={openCancelConfirmation}
                        startIcon={<CancelIcon />}
                        
                        sx={{
                          borderColor: '#d81719',
                          color: '#d81719',
                          '&:hover': {
                            borderColor: '#b01416',
                            color: '#b01416',
                            bgcolor: 'rgba(216, 23, 25, 0.04)',
                          },
                        }}
                      >
                        Cancel Subscription
                      </Button>
                    </Box>
                  )}
                  <Button
                    variant="contained"
                    onClick={() => handlePurchaseSubscription('black')}
                    disabled={loading.black || !hasSufficientBalance('black') || user?.elite === 'black'}
                    sx={{
                      bgcolor: '#000000',
                      px: 4,
                      py: 1,
                      '&:hover': { bgcolor: '#333333' },
                      '&.Mui-disabled': {
                        bgcolor: '#000000',
                        color: '#ffffff', // Ensure text color is white
                        opacity: 0.6, // Overall button opacity
                        '& .MuiButton-label': {
                          opacity: 1, // Increase text opacity (optional, if needed)
                        },
                      },
                    }}

                  >
                    {loading.black ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : !hasSufficientBalance('black') ? (
                      'Not Enough Balance'
                    ) : (
                      getButtonText('black')
                    )}
                  </Button>
                </CardActions>
              </Card>

            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelConfirmOpen}
        onClose={closeCancelConfirmation}
        PaperProps={{
          sx: {
            bgcolor: '#0a0a0a',
            color: '#fff',
            maxWidth: '500px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(216, 23, 25, 0.25)',
            border: '1px solid rgba(216, 23, 25, 0.3)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          pt: 3,
          flexDirection: 'column'
        }}>
          <WarningIcon 
            sx={{ 
              fontSize: '54px', 
              color: '#d81719',
              mb: 2
            }} 
          />
          <Typography variant="h5" fontWeight="bold">
            Cancel Elite Subscription?
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Alert 
            severity="warning" 
            variant="outlined"
            icon={false}
            sx={{ 
              mb: 3, 
              bgcolor: 'rgba(216, 23, 25, 0.05)', 
              borderColor: 'rgba(216, 23, 25, 0.3)',
              color: '#fff'
            }}
          >
            <AlertTitle sx={{ color: '#d81719', fontWeight: 'bold' }}>
              Important: Service Limitations
            </AlertTitle>
            <Typography variant="body2" component="div" sx={{ color: '#fff' }}>
              After cancellation, the following services will be paused immediately:
              <List dense disablePadding sx={{ mt: 1 }}>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '32px' }}>
                    <CancelIcon fontSize="small" sx={{ color: '#d81719' }} />
                  </ListItemIcon>
                  <ListItemText primary="All active game houses" />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '32px' }}>
                    <CancelIcon fontSize="small" sx={{ color: '#d81719' }} />
                  </ListItemIcon>
                  <ListItemText primary="Any loan creation services" />
                </ListItem>
                <ListItem sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: '32px' }}>
                    <CancelIcon fontSize="small" sx={{ color: '#d81719' }} />
                  </ListItemIcon>
                  <ListItemText primary="Access to Elite benefits and features" />
                </ListItem>
              </List>
            </Typography>
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            These services will remain paused until you renew your Elite subscription.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Your subscription will be cancelled immediately and you will lose access to Elite features.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button 
            onClick={closeCancelConfirmation}
            variant="outlined"
            sx={{ 
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': {
                borderColor: '#fff',
                bgcolor: 'rgba(255,255,255,0.05)',
              }
            }}
          >
            Keep Subscription
          </Button>
          <Button 
            onClick={handleCancelSubscription} 
            disabled={loading.cancel}
            variant="contained"
            sx={{
              bgcolor: '#d81719',
              '&:hover': { bgcolor: '#b01416' },
            }}
          >
            {loading.cancel ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Confirm Cancellation'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default EliteSubscriptionModal;