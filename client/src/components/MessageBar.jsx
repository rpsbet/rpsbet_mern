import React from 'react';
import { Alert, AlertTitle } from '@mui/material';
import { useSnackbar } from 'notistack';
import { connect } from 'react-redux';
import { closeMsgBar } from '../redux/Notification/notification.actions';

function CustomizedSnackbar({ openSk, closeMsgBar, message, status }) {
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (openSk && message) {
      // Fallback if 'status' is not recognized
      const validVariants = ['default','error','success','warning','info'];
      const finalVariant = validVariants.includes(status) ? status : 'default';

      enqueueSnackbar(
        message,
        {
          variant: finalVariant,
          onClose: closeMsgBar,
          autoHideDuration: 3000,
        }
      );
    }
  }, [openSk, message, status, enqueueSnackbar, closeMsgBar]);

  return null;
}

const mapStateToProps = (state) => ({
  openSk: state.snackbar.openSk,
  message: state.snackbar.message,
  status: state.snackbar.status,
});

const mapDispatchToProps = {
  closeMsgBar,
};

export default connect(mapStateToProps, mapDispatchToProps)(CustomizedSnackbar);