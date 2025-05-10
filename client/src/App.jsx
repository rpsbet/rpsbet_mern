import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Routes, Route, useLocation } from 'react-router-dom';
import { getUser } from './redux/Auth/user.actions';
import GameMainRoute from './game_panel/app/Game.routes';
import Error404Page from './admin_panel/Error404Page';
import setAuthToken from './util/setAuthToken';


const App = React.memo(() => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    if (localStorage.token) {
      setAuthToken(localStorage.token);
      dispatch(getUser());
    }
  }, [dispatch]);

  return (
    <>
      <Routes>
       
        <Route path="/*" element={<GameMainRoute />} /> {/* Explicitly match "/" */}
        <Route path="*" element={<Error404Page />} />
      </Routes>
    </>
  );
});

export default App;