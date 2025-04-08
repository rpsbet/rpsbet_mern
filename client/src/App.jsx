import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, useLocation } from 'react-router-dom';
import { getUser } from './redux/Auth/user.actions';
import GameMainRoute from './game_panel/app/Game.routes';
import AppMainRoute from './admin_panel/app/App.routes';
import DepositModal from './game_panel/modal/DepositModal';
import Error404Page from './admin_panel/Error404Page';
import setAuthToken from './util/setAuthToken';

const currentMode = 'dark';

const App = React.memo(() => {
  const auth = useSelector(state => state.auth, (prev, next) => prev === next);
  const admin_auth = useSelector(state => state.admin_auth, (prev, next) => prev === next);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    if (localStorage.token) {
      setAuthToken(localStorage.token);
      dispatch(getUser());
    }
  }, [dispatch]);

  // Log location changes in useEffect to avoid logging on every render
  useEffect(() => {
    console.log('Location changed:', location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/investors" element={<AppMainRoute />} />
        <Route
          path="/investors/deposit"
          element={
            <>
              <AppMainRoute />
              <DepositModal />
            </>
          }
        />
        <Route path="/*" element={<GameMainRoute />} /> {/* Explicitly match "/" */}
        <Route path="*" element={<Error404Page />} />
      </Routes>
    </>
  );
});

export default App;