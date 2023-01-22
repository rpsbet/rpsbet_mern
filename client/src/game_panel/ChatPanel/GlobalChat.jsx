import React, { Component } from 'react';
import { connect } from 'react-redux';
import './Chat.css';


class GlobalChat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chat_list: [],
      fetchedGloabal: false,
      newMessages: 0,
      showTooltip: false,
    };

    this.chatBoxRef = React.createRef();
   
  }


  componentDidMount() {
    if (this.chatBoxRef.current) {
      this.chatBoxRef.current.scrollTop = this.chatBoxRef.current.scrollHeight;
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.messages && prevProps.messages.length < this.props.messages.length) {
      this.setState({
        newMessages: this.props.messages.length - prevProps.messages.length,
        showTooltip: true,
    },()=>console.log(this.state))
    }
  }


  static getDerivedStateFromProps(props, current_state) {
    if (!props.globalChatList) return null;
if (current_state.chat_list.length !== props.globalChatList.length) {

      return {
        ...current_state,
        chat_list: props.globalChatList
        
      };
    }

    return null;
  }

  render() {
        console.log(this.props.messages)

    return (
      <div className="chat-panel global-chat" ref={this.chatBoxRef}>
        {this.state.showTooltip && (
          <div className="msgtooltip">
            You have {this.state.newMessages} new message(s)
          </div>
        )}

        {this.state.chat_list.map(
          (chat, key) => (
            <div className="chat-line" key={key}>
              <div className="chat-content">
                <span className="sender-name">{chat.sender}:</span>
                <span className="chat-text">{chat.message}</span>
              </div>
              <div className="chat-time">{chat.time}</div>
            </div>
          ),
          this
        )}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  userName: state.auth.userName,
  isDarkMode: state.auth.isDarkMode,
  socket: state.auth.socket,
  globalChatList: state.logic.globalChatList,
  // messages: state.yourMessagesState.messages

});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(GlobalChat);
