import React, { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useSelector, useDispatch } from 'react-redux';
import { closeMsgBar } from '../redux/Notification/notification.actions';

function CustomizedSnackbar() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();

  const openSk = useSelector((state) => state.snackbar.openSk);
  const message = useSelector((state) => state.snackbar.message);
  const status = useSelector((state) => state.snackbar.status);

  useEffect(() => {
    if (openSk && message) {
      const validVariants = ['default', 'error', 'success', 'warning', 'info'];
      const finalVariant = validVariants.includes(status) ? status : 'default';
      enqueueSnackbar(message, {
        variant: finalVariant,
        onClose: () => dispatch(closeMsgBar()),
        autoHideDuration: 5000,
      });
    }
  }, [openSk, message, status, enqueueSnackbar, dispatch]);

  return null;
}

export default CustomizedSnackbar;