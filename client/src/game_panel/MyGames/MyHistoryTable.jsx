import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { setChatRoomInfo } from '../../redux/Logic/logic.actions';

class MyHistoryTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            myHistory: this.props.myHistory
        };

        this.openChat = this.openChat.bind(this);
    }

    openChat = (e) => {
        this.props.setChatRoomInfo({
            avatar: e.target.getAttribute('avatar'),
            username: e.target.getAttribute('username'),
            chatLogs: []
        });
        history.push('/chat/' + e.target.getAttribute('_id'));
    }

    static getDerivedStateFromProps(props, current_state) {
        return {
            ...current_state,
            myHistory: props.myHistory
        };
    }

    render() {
        const history_keys = Object.keys(this.state.myHistory).sort((a, b) => { 
            return this.state.myHistory[a].updated_at < this.state.myHistory[b].updated_at ? 1 : -1;
        });

        console.log(this.state.myHistory);

        return (
            <>
                <label className="tbl_title">MY HISTORY</label>
                <div className="history">
                    <table className="table table-striped with-ellipsis table-hover text-center normal_table" cellpadding="2" cellspacing="0">
                        <thead>
                            <tr>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                            this.state.myHistory.length === 0 ? 
                                <tr><td colSpan="5"></td></tr> 
                                : 
                                history_keys.map((row, key) => (
                                    <tr key={key}>
                                        <td><img src={this.state.myHistory[row].avatar} alt="" style={{width: '50px', height: '50px', borderRadius: '50%'}} /></td>
                                        <td  id="prevMsg" style={{textAlign: 'left'}}>{this.state.myHistory[row].username}<br/>{this.state.myHistory[row].message}</td>
                                        <td>{this.state.myHistory[row].unread_message_count === 0 ? <></> : <span className="unread_message_badge">{this.state.myHistory[row].unread_message_count}</span>}</td>
                                        <td>{this.state.myHistory[row].created_at_str}</td>
                                        <td>
                                            <button 
                                                className="btn btn_join" 
                                                onClick={this.openChat}
                                                _id={this.state.myHistory[row]._id} 
                                                avatar={this.state.myHistory[row].avatar} 
                                                username={this.state.myHistory[row].username} 
                                            >
                                                Open
                                            </button>
                                        </td>
                                    </tr>
                                ), this)
                        }
                        </tbody>
                    </table>
                </div>
            </>
        );
    }
}

const mapStateToProps = state => ({
    myHistory: state.logic.myHistory
});

const mapDispatchToProps = {
    setChatRoomInfo
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyHistoryTable);
