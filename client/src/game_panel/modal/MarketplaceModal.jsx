import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { setChatRoomInfo, getMyChat } from '../../redux/Logic/logic.actions';
import Avatar from '../../components/Avatar';
import Moment from 'moment';
import { Button } from '@material-ui/core';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import { Skeleton } from '@material-ui/lab';

function MyChat(props) {
  // ------------------ LOCAL STATE ------------------
  const [myChat, setMyChat] = useState(props.myChat);  
  const [chatOpenMobile, setChatOpenMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // ------------------ EFFECTS ------------------
  // Equivalent to componentDidMount: fetch chat data once
  useEffect(() => {
    props.getMyChat();
  }, []);

  // Equivalent to getDerivedStateFromProps: whenever props.myChat changes,
  // update local myChat state
  useEffect(() => {
    setMyChat(props.myChat);
  }, [props.myChat]);

  // ------------------ HANDLERS ------------------
  const openChat = (e) => {
    const { avatar, username, rank, id } = e.currentTarget.dataset;
    if (isMobile) {
      props.toggleDrawer();
    }

    props.setChatRoomInfo({
      avatar,
      rank,
      username,
      chatLogs: []
    });
    history.push('/chat/' + id);
  };

  // ------------------ RENDER ------------------
  const { loading, isDarkMode } = props;

  // Sort keys in descending order by updated_at
  // If myChat is an object keyed by ID, for instance:
  const historyKeys = Object.keys(myChat).sort((a, b) => {
    return myChat[a].updated_at < myChat[b].updated_at ? 1 : -1;
  });

  return (
    <div className="chat">
      <div className="table my-chat-table">
        {historyKeys.length === 0 && loading ? (
          <div>
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="table-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #ccc',
                }}
              >
                {/* Skeleton for Avatar */}
                <div style={{ marginRight: '15px' }}>
                  <Skeleton
                    variant="circle"
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%' }}
                  />
                </div>

                {/* Skeleton for Message Content */}
                <div style={{ flex: 1, marginRight: '15px' }}>
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={20}
                    style={{ marginBottom: '8px' }}
                  />
                  <Skeleton
                    variant="text"
                    width="40%"
                    height={15}
                    style={{ marginBottom: '4px' }}
                  />
                </div>

                {/* Skeleton for Unread Badge */}
                <div style={{ marginRight: '15px' }}>
                  <Skeleton
                    variant="circle"
                    width={30}
                    height={20}
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                {/* Skeleton for Button */}
                <div>
                  <Skeleton
                    variant="circle"
                    width={60}
                    height={30}
                    style={{ borderRadius: '5px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          historyKeys.map((rowKey, idx) => (
            <div className="table-row" key={idx}>
              <div>
                <div className="table-cell">
                  <Avatar
                    accessory={myChat[rowKey].accessory}
                    rank={myChat[rowKey].rank}
                    src={myChat[rowKey].avatar}
                    username={myChat[rowKey].username}
                    alt=""
                    className="avatar"
                    darkMode={isDarkMode}
                  />
                </div>
              </div>
              <div className="message-panel title">
                <div className="table-cell">
                  {myChat[rowKey].message}
                </div>
                <div className="table-cell message-date">
                  {Moment(myChat[rowKey].created_at_str).format('DD / MM')}
                </div>
                <div>
                  <div className="table-cell" title="Unread message">
                    {myChat[rowKey].unread_message_count === 0 ? null : (
                      <span className="unread_message_badge">
                        {myChat[rowKey].unread_message_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="table-cell"></div>
                <div className="table-cell">
                  <Button
                    className="btn btn_join"
                    onClick={openChat}
                    data-id={myChat[rowKey]._id}
                    data-avatar={myChat[rowKey].avatar}
                    data-rank={myChat[rowKey].totalWagered}
                    data-username={myChat[rowKey].username}
                  >
                    Open
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  myChat: state.logic.myChat,
  loading: state.logic.isActiveLoadingOverlay,
});

const mapDispatchToProps = {
  setChatRoomInfo,
  getMyChat,
  toggleDrawer,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyChat);