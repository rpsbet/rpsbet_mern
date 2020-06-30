import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { getChatRoomInfo, addChatLog } from '../../redux/Logic/logic.actions';
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RiArrowGoBackLine } from 'react-icons/ri';
const moment = require('moment');

class ChatPage extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            chatLogs: this.props.chatLogs,
            my_info: this.props.my_info,
            text: '',
            socket: this.props.socket
        };

        this.insertEmoji = this.insertEmoji.bind(this);
        this.onChangeText = this.onChangeText.bind(this);
        this.onTextAreaKeyDown = this.onTextAreaKeyDown.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
    }

    insertEmoji(e) {
        this.setState({text: this.state.text + e.target.innerHTML});
        this.textarea.focus();
    }

    onChangeText(e) {
        this.setState({text: e.target.value});
    }

    sendMessage(e) {
        const text = this.state.text.trim();

        console.log(this.state.socket);

        if (text !== '') {
            const chatLog = {
                to: this.props.user_id,
                from: this.state.my_info._id,
                message: text,
                created_at: moment(new Date()).format('LLL'),
            };
            this.props.addChatLog(chatLog);
            this.state.socket.emit('SEND_CHAT', chatLog);
            this.setState({text : ''});
        }
    }

    onTextAreaKeyDown(e) {
        if (e.keyCode === 13) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    static getDerivedStateFromProps(props, current_state) {
        return {
            ...current_state,
            chatLogs: props.chatLogs,
            my_info: props.my_info,
            socket: props.socket
        };
    }

    async componentDidMount() {
        this.IsAuthenticatedReroute();
        this.state.socket.emit('REQUEST_UNREAD_MESSAGE_COUNT', {to: this.state.my_info._id});
        await this.props.getChatRoomInfo(this.props.match.params.id);
    }

    componentDidUpdate() {
        const chat_log_panel = document.getElementById('chat_log_panel');
        chat_log_panel.scrollTop = chat_log_panel.scrollHeight;
    }
    
    IsAuthenticatedReroute = () => {
        if (!this.props.auth) {
            history.push('/');
        }
    };

    render() {
        return (
            <>
                <div className="chat_header row">
                    <a href="/mygames"><span>Go Back</span><RiArrowGoBackLine /></a>
                    <img src={this.props.avatar} alt="" />
                    <span className="chat_header_username">{this.props.username}</span>
                </div>
                <div className="chat_log_panel" id="chat_log_panel">
                    {this.state.chatLogs.map((row, key) => (
                        <div className={row.from === this.state.my_info._id ? 'my_message row': 'other_message row'} key={key}>
                            <div className="message_header">
                                {row.from !== this.state.my_info._id ? <span className="message_username">{this.props.username}</span> : ''}
                                <span className="message_time">{row.created_at}</span>
                                {row.from === this.state.my_info._id ? <span className="message_username">{this.state.my_info.username}</span> : ''}
                            </div>
                            <div className="message_content">
                                {row.message}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="chat_input_panel row">
                    <div className="emoticon_panel">
                        <span role="img" aria-label="" onClick={this.insertEmoji}>🤬</span>
                        <span role="img" aria-label="" onClick={this.insertEmoji}>🖕</span>
                        <span role="img" aria-label="" onClick={this.insertEmoji}>😭</span>
                        <span role="img" aria-label="" onClick={this.insertEmoji}>🤔</span>
                        <span role="img" aria-label="" onClick={this.insertEmoji}>🤑</span>
                        <span role="img" aria-label="" onClick={this.insertEmoji}>🤣</span>
                        <span role="img" aria-label="" onClick={this.insertEmoji}>😎</span>
                        <span role="img" aria-label="" onClick={this.insertEmoji}>😏</span>
                        <span role="img" aria-label="" onClick={this.insertEmoji}>🤝</span>
                    </div>
                    <textarea placeholder="Type Something..." onKeyDown={this.onTextAreaKeyDown} onChange={this.onChangeText} value={this.state.text} ref={(elem) => {this.textarea = elem}}></textarea>
                    <button className="btn_send_message" onClick={this.sendMessage}><FontAwesomeIcon icon={faPaperPlane} /></button>
                </div>
            </>
        );
    }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  my_info: state.auth.user,
  socket: state.auth.socket,
  user_id: state.logic.chatRoomInfo.user_id,
  avatar: state.logic.chatRoomInfo.avatar,
  username: state.logic.chatRoomInfo.username,
  chatLogs: state.logic.chatRoomInfo.chatLogs,
});

const mapDispatchToProps = {
    getChatRoomInfo,
    addChatLog
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChatPage);
