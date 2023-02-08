import React, { Component } from 'react';
import { connect } from 'react-redux';
import './Chat.css';
import PlayerModal from '../modal/PlayerModal';
import {
  acGetCustomerInfo
} from '../../redux/Customer/customer.action';

class GlobalChat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chat_list: [],
      fetchedGloabal: false,
      newMessages: 0,
      showTooltip: false,
      showPlayerModal: false,
      selectedCreator: ''
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
    if (this.chatBoxRef.current) {
      this.chatBoxRef.current.scrollTop = this.chatBoxRef.current.scrollHeight;
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

  handleOpenPlayerModal = async (sender) => {
  
    const user = await this.props.acGetCustomerInfo(sender);
    if (user) {
      this.setState({
        // username: sender,
        showPlayerModal: true
      });
    }
  };
  
  

  
  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };


  render() {
        console.log(this.props.messages)

    return (
      <div className="chat-panel global-chat" ref={this.chatBoxRef}>
        {this.state.showTooltip && (
          <div className="msgtooltip">
            You have {this.state.newMessages} new message(s)
          </div>
        )}
       {this.state.showPlayerModal &&
            <PlayerModal
              selectedCreator={this.state.selectedCreator}
              modalIsOpen={this.state.showPlayerModal}
              closeModal={this.handleClosePlayerModal}
              // {...this.state.selectedRow}
            />
          }
        {this.state.chat_list.map(
          (chat, key) => (
            <div className="chat-line" key={key}>
              <div className="chat-content">
              <a className="player" onClick={() => this.handleOpenPlayerModal(chat.sender)}>                   

                  {/* <Avatar
                    className="avatar"
                    src={chat.creator_avatar}
                    alt=""
                    darkMode={this.props.isDarkMode}
                  /> */}
                <span className="sender-name">{chat.sender}</span></a>
                <span className="chat-text">
                {
        chat.message.split(/(\S+\.[^\s]+)/).map((part, i) =>
          /\S+\.[^\s]+/.test(part) && !/\.{2,}/.test(part)
            ? <a href={part} target="_blank" rel="noopener noreferrer">{part}</a>
            : part
        )
      }
    </span>
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

const mapDispatchToProps = {
  acGetCustomerInfo
};

export default connect(mapStateToProps, mapDispatchToProps)(GlobalChat);
