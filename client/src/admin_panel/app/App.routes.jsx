import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Updated to v6
import { useSelector } from 'react-redux';
import CountdownPage from '../CountdownPage';

const AppMainRoute = () => {
  const auth = useSelector((state) => state.auth);
  return (
    <Routes>
      <Route path="/investors" element={<CountdownPage />} />
    </Routes>
  );
};

export default AppMainRoute;