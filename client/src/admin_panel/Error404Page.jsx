import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Grow from '@mui/material/Grow';
import Slide from '@mui/material/Slide';
import { Link } from 'react-router-dom'; // Added for navigation (if needed)

// Styled Components
const ErrorTextEL = styled.h1`
  font-size: 150px;
  font-weight: 900;
  text-shadow: 0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9,
    0 5px 0 #aaa, 0 6px 1px rgba(0, 0, 0, 0.1), 0 0 5px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.3), 0 3px 5px rgba(0, 0, 0, 0.2),
    0 5px 10px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.2),
    0 20px 20px rgba(0, 0, 0, 0.15);
`;

const MainContainerEl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  height: 80vh;
`;

// Reusable Search Input Component
const CustomizedInputBase = () => {
  return (
    <Paper
      elevation={12}
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: 400,
      }}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Search..."
        aria-label="search"
      />
      <IconButton sx={{ p: '10px' }} aria-label="search">
        <SearchIcon />
      </IconButton>
    </Paper>
  );
};

// Main Error 404 Component
function Error404Page() {
  const [openPage, setOpenPage] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    setOpenPage(true);
  }, []); // Empty dependency array since it only runs on mount

  return (
    <MainContainerEl>
      <Helmet>
        <title>404 - Page Not Found</title>
        <meta name="description" content="Oops, an error has occurred. Page not found!" />
      </Helmet>

      <Grow in={openPage}>
        <ErrorTextEL>404</ErrorTextEL>
      </Grow>
      <Fade in={openPage}>
        <h2>Oops, an error has occurred. Page not found!</h2>
      </Fade>
      <Slide direction="up" in={openPage} mountOnEnter unmountOnExit>
        <form role="search">
          <CustomizedInputBase />
        </form>
      </Slide>
      <Grow in={openPage}>
        <Button
          variant="outlined"
          color="error"
          component={Link} // Use Link from react-router-dom for navigation
          to="/"
        >
          Go To Home Page
        </Button>
      </Grow>
    </MainContainerEl>
  );
}

export default Error404Page;