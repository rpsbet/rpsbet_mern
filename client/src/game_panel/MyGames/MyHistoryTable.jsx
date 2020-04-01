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
        if (current_state.myHistory.length !== props.myHistory.length) {
            return {
                ...current_state,
                myHistory: props.myHistory
            };
        }
        return null;
    }

    render() {
        return (
            <>
                <label className="tbl_title">MY HISTORY</label>
                <div className="col-md-12">
                    <table className="table table-striped table-hover text-center normal_table">
                        <thead>
                            <tr>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                            this.state.myHistory.length === 0 ? 
                                <tr><td colSpan="4"></td></tr> 
                                : 
                                this.state.myHistory.map((row, key) => (
                                    <tr key={key}>
                                        <td><img src={row.from.avatar} alt="" style={{width: '50px', height: '50px', borderRadius: '50%'}} /></td>
                                        <td style={{textAlign: 'left'}}>{row.from.username}<br/>{row.message}</td>
                                        <td>{row.created_at}</td>
                                        <td>
                                            <button 
                                                className="btn btn_join" 
                                                onClick={this.openChat}
                                                _id={row.from._id} 
                                                avatar={row.from.avatar} 
                                                username={row.from.username} 
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
