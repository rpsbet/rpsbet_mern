import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import { Chat, Close } from '@mui/icons-material';

const DrawerButton = ({ open, toggleDrawer }) => (
  <IconButton
    id="drawer-btn"
    style={{ color: 'white' }}
    onClick={toggleDrawer}
  >
    {open ? <Close /> : <Chat />}
  </IconButton>
);

export default DrawerButton;
