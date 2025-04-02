import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Tooltip,
  IconButton,
  Typography,
  Skeleton
} from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHeartBroken, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import Moment from 'moment';

import { getMyHistory } from '../../redux/Logic/logic.actions';
import { getSettings } from '../../redux/Setting/setting.action';
import PlayerModal from '../modal/PlayerModal';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import { convertToCurrency } from '../../util/conversion';

/** 
 * Convert the date into a "time ago" format.
 */
function customFromNow(date) {
  return Moment(date).fromNow();
}

/**
 * Renders a heart or broken heart icon based on `isOpen`.
 */
function HeartIcon({ isOpen }) {
  return <FontAwesomeIcon icon={isOpen ? faHeart : faHeartBroken} />;
}

/**
 * Build a final message for one log item using numeric fields.
 * Adjust this to match the fields your backend provides 
 * (e.g. `action`, `bet_amount`, `winnings`, etc.).
 */
function buildMyHistoryMessage(log, solPrice) {
  if (!log) return '';

  // Grab numeric fields (if you have them):
  const betAmt = log.bet_amount ?? 0;
  const winnings = log.winnings ?? 0;

  // Convert to currency if needed:
  const betAmtStr = convertToCurrency(betAmt, solPrice);
  const winningsStr = convertToCurrency(winnings, solPrice);

  // Build a status/room name or any other fields you have:
  // Example usage if you have `log.action`:
  switch (log.action) {
    case 'won':
      return `User ${log.joined_user?._id || 'Unknown'} won ${winningsStr} from ${betAmtStr}`;
    case 'lost':
      return `User ${log.joined_user?._id || 'Unknown'} lost ${betAmtStr}`;
    default:
      // Fallback if no recognized action
      return `Action: ${log.action || 'None'}, bet: ${betAmtStr}`;
  }
}

function MyHistoryTable() { // Remove props destructuring since we’ll use hooks
  const dispatch = useDispatch();

  // Map state from Redux using useSelector
  const {
    myHistory: propsMyHistory = [],
    isAuthenticated,
    isLowGraphics,
    socket,
    solPrice
  } = useSelector((state) => ({
    socket: state.auth.socket,
    isAuthenticated: state.auth.isAuthenticated,
    isLowGraphics: state.auth.isLowGraphics,
    myHistory: state.logic.myHistory,
    solPrice: state.logic.solPrice,
  }));

  // Local state
  const [rawMyHistory, setRawMyHistory] = useState(propsMyHistory);
  const [displayMyHistory, setDisplayMyHistory] = useState([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [copiedRowId, setCopiedRowId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isUnmountedRef = useRef(false);
  const intervalRef = useRef(null);

  /**
   * On mount, fetch user history if authenticated. Also fetch settings.
   */
  useEffect(() => {
    isUnmountedRef.current = false;

    async function init() {
      if (isAuthenticated) {
        setIsLoading(true);
        await dispatch(getMyHistory());
      }
      if (!isUnmountedRef.current) {
        const settings = await dispatch(getSettings());
        // Handle settings if needed...
        setIsLoading(false);
      }
    }
    init();

    // Re-run "time ago" updates every few seconds
    intervalRef.current = setInterval(() => {
      if (!isUnmountedRef.current) {
        setDisplayMyHistory((prev) =>
          prev.map((log) => ({
            ...log,
            from_now: customFromNow(log.created_at),
          }))
        );
      }
    }, 3000);

    return () => {
      isUnmountedRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, dispatch]); // Dependencies updated to use dispatch

  /**
   * Whenever `propsMyHistory` from Redux changes,
   * update our "raw" local state.
   */
  useEffect(() => {
    setRawMyHistory(propsMyHistory);
  }, [propsMyHistory]);

  /**
   * Build the final display logs from "rawMyHistory" + "solPrice"
   */
  useEffect(() => {
    if (!rawMyHistory || rawMyHistory.length === 0) {
      setDisplayMyHistory([]);
      return;
    }

    const updated = rawMyHistory.map((log) => {
      return {
        ...log,
        finalMsg: buildMyHistoryMessage(log, solPrice),
        from_now: customFromNow(log.created_at),
      };
    });

    setDisplayMyHistory(updated);
  }, [rawMyHistory, solPrice]);

  /**
   * Listen for real-time updates from `socket` if available
   */
  useEffect(() => {
    if (socket) {
      socket.on('NEW_LOG', handleNewLog);
    }
    return () => {
      if (socket) {
        socket.off('NEW_LOG', handleNewLog);
      }
    };
  }, [socket]);

  function handleNewLog(data) {
    const newLogArray = data?.newLog;
    if (!newLogArray || !Array.isArray(newLogArray)) return;

    // Prepend the new logs
    setRawMyHistory((prev) => [...newLogArray, ...prev]);
  }

  // Utils / Handlers
  const handleOpenPlayerModal = useCallback((creatorId) => {
    setSelectedCreator(creatorId);
    setShowPlayerModal(true);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  const copyToClipboard = useCallback((rowId) => {
    navigator.clipboard.writeText(rowId)
      .then(() => {
        setCopiedRowId(rowId);
        setTimeout(() => {
          setCopiedRowId(null);
        }, 1500);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  }, []);

  // Event listener attachments for user links or Lottie accessories
  useEffect(() => {
    attachUserLinkListeners();
    // Optionally attach Lottie accessories if needed
  }, [displayMyHistory]);

  const attachUserLinkListeners = useCallback(() => {
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const userId = event.target.getAttribute('data-userid');
        handleOpenPlayerModal(userId);
      });
    });
  }, [handleOpenPlayerModal]);

  // Render
  return (
    <Box className="overflowX">
      {isLoading ? (
        <Box>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={50} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : (
        <Box className="table main-history-table">
          {displayMyHistory.length === 0 ? (
            <Box className="dont-have-game-msg" sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body1">NO GAME HISTORY RIGHT NOW</Typography>
            </Box>
          ) : (
            displayMyHistory.map((row, key) => (
              <Box
                key={row._id || key}
                className={`table-row ${key < 10 ? 'slide-in' : ''}`}
                sx={{
                  animationDelay: `${key * 0.1}s`,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 1,
                  mb: 1
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box className="table-cell" sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {row.finalMsg}
                    </Typography>
                    {row.status && (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        <span>{row.status}</span>
                        {row.status === 'open' ? (
                          <HeartIcon isOpen />
                        ) : (
                          <HeartIcon isOpen={false} />
                        )}
                      </Box>
                    )}
                  </Box>
                  <Box className="table-cell" sx={{ whiteSpace: 'nowrap' }}>
                    {row.from_now}  
                    <FontAwesomeIcon icon={faStopwatch} />
                  </Box>
                  <Box className="table-cell row-copy">
                    <Tooltip
                      title={copiedRowId === row._id ? 'COPIED ID!' : 'COPY BET ID'}
                      placement="top"
                    >
                      <IconButton
                        size="small"
                        sx={{ p: 0.5 }}
                        onClick={() => copyToClipboard(row._id)}
                      >
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>
      )}

      {showPlayerModal && (
        <PlayerModal
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
          selectedCreator={selectedCreator}
        />
      )}
    </Box>
  );
}

export default MyHistoryTable;