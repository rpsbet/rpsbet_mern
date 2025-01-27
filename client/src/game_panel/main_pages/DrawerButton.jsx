import React from 'react';
import IconButton from '@mui/material/IconButton';
import { Chat, Close } from '@mui/icons-material';

const DrawerButton = ({ open, toggleDrawer }) => (
  <IconButton
    id="drawer-btn"
    style={{ color: 'white' }}
    onClick={toggleDrawer}
    className='desktop-only'
  >
    {open ? <Close /> : <Chat />}
  </IconButton>
);

export default DrawerButton;
