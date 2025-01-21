import React from 'react';
import { Alert, AlertTitle } from '@mui/material';
import { useSnackbar } from 'notistack';
import { connect } from 'react-redux';
import { closeMsgBar } from '../redux/Notification/notification.actions';

function CustomizedSnackbar({ openSk, closeMsgBar, message, status }) {
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (openSk) {
      enqueueSnackbar(
        <Alert variant='text' severity={status} sx={{ width: '100%' }}>
          {status === 'error' && <AlertTitle>Error</AlertTitle>}
          {message}
        </Alert>,
        {
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