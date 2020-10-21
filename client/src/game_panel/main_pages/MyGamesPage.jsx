import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { getMyGames, getMyHistory } from '../../redux/Logic/logic.actions';
import MyGamesTable from '../MyGames/MyGamesTable';
import MyHistoryTable from '../MyGames/MyHistoryTable';

class MyGamesPage extends Component {
    componentDidMount() {
        this.IsAuthenticatedReroute();
        this.props.getMyGames();
        this.props.getMyHistory();
    }
    
    IsAuthenticatedReroute = () => {
        if (!this.props.auth) {
            history.push('/');
        }
    };

    render() {
        return (
            <>
                <h1 style={{ background: "#f6b22a" }} className="main_title">My Games</h1>
                <MyGamesTable />
                <MyHistoryTable />
            </>
        );
    }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  socket: state.auth.socket,
});

const mapDispatchToProps = {
    getMyGames,
    getMyHistory
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyGamesPage);
