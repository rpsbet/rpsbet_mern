import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setCurrentQuestionInfo } from '../../redux/Question/question.action';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import AddQuestionModal from '../modal/AddQuestionModal';
import { Button, ButtonBase, Typography, Divider, Grid } from '@material-ui/core';
import { acGetCustomerInfo } from '../../redux/Customer/customer.action';
import Avatar from '../../components/Avatar';
import PlayerModal from '../../game_panel/modal/PlayerModal';
import TextField from '@material-ui/core/TextField';
import Battle from '../icons/Battle';


class BrainGame extends Component {
    constructor(props) {
        super(props);
        this.state = {
            question: '',
            answers: [],
            incorrect_answers: [],
            brain_game_type: 1,
            buttonDisable: true,
            showPlayerModal: false,
            selectedCreator: '',
            searchTerm: '',
            customerInfo: {},
            game_type_list: [],
            showModal: false,
            is_other: (this.props.bet_amount === 1 || this.props.bet_amount === 2.5 || this.props.bet_amount === 5 || this.props.bet_amount === 10 || this.props.bet_amount === 25) ? 'hidden' : ''
        };
    }

    componentDidMount() {
        // Fetch customer info for each game type user ID
        this.props.game_type_list.forEach(game_type => {
            // Fetch customer info for each game type user ID
            this.props.acGetCustomerInfo(game_type.user_id)
                .then(customerInfo => {
                    // Update customerInfo state using the user_id as key
                    this.setState(prevState => ({
                        customerInfo: {
                            ...prevState.customerInfo,
                            [game_type.user_id]: customerInfo
                        }
                    }));
                })
                .catch(error => {
                    console.error("Error fetching customer info:", error);
                });
        });
    }



    handleOpenPlayerModal = creator_id => {
        this.setState({ showPlayerModal: true, selectedCreator: creator_id });
    };

    handleClosePlayerModal = () => {
        this.setState({ showPlayerModal: false });
    };

    toggleModal = () => {
        this.setState({ showModal: !this.state.showModal });
    };


    render() {
        const {
            customerInfo,
            showPlayerModal,
            selectedCreator,
            searchTerm
        } = this.state;

        const filteredGameTypes = this.props.game_type_list.filter(game_type =>
            game_type.game_type_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return (this.props.step === 1 ?
            <DefaultBetAmountPanel bet_amount={this.props.bet_amount} onChangeState={this.props.onChangeState} game_type="Brain Game" />
            :
            <div className="game-info-panel">
                {showPlayerModal && (
                    <PlayerModal
                        selectedCreator={selectedCreator}
                        modalIsOpen={showPlayerModal}
                        closeModal={this.handleClosePlayerModal}
                    />
                )}
                <h3 className="game-sub-title">Game Type</h3>


                <div className="select-buttons-panel brain-game">
                    <div
                        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >

                        <TextField
                            label="Search Game Type"
                            variant="outlined"
                            value={searchTerm}
                            onChange={e => this.setState({ searchTerm: e.target.value })}
                            style={{ marginBottom: 10 }}
                        />
                        <Button className="add-new-game-type" onClick={this.toggleModal}>
                            + Add New
                        </Button>
                    </div>
                    
                    <Grid container spacing={1}>
    {filteredGameTypes.map((game_type, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <ButtonBase
                className={(this.props.brain_game_type === game_type._id ? 'active' : '')}
                onClick={(e) => {
                    this.props.setCurrentQuestionInfo({ brain_game_type: game_type._id });
                }}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#f0f0f0', borderRadius: '8px', position: 'relative' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <a
                            className=""
                            onClick={() => this.handleOpenPlayerModal(game_type.user_id)}
                            style={{display: "block", position: "absolute", left: "5px", top:"5px", width: "25px", height: "25px"}}
                        >
                            <Avatar
                                className="avatar"
                                src={customerInfo[game_type.user_id]?.avatar}
                                rank={customerInfo[game_type.user_id]?.totalWagered}
                                accessory={customerInfo[game_type.user_id]?.accessory}
                                alt=""
                                darkMode={this.props.isDarkMode}
                            />
                        </a>
                    </div>
                    <div>
                        <Typography variant="body1" style={{ marginTop: "0", color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>{game_type.game_type_name}</Typography>
                        <Typography variant="body2" style={{ marginTop: "0",color: '#ddd', fontSize: '10px' }}>Questions: {game_type.count}</Typography>
                    <Typography variant="body2" style={{ marginTop: "0",color: '#bbb', fontSize: '12px', position: "absolute", right: "10px", top: "10px", filter:"brightness(1.5)", transform:"scale(0.8"}}><Battle />{game_type.plays}</Typography>
                    </div>
                </div>
                <Divider style={{ marginTop: '10px' }} />
            </ButtonBase>
        </Grid>
    ))}
</Grid>


                    {this.state.showModal && (

                        <AddQuestionModal
                            modalIsOpen={this.state.showModal}
                            closeModal={this.toggleModal}
                            darkMode={this.props.isDarkMode}
                        />

                    )}
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => ({
    game_type_list: state.questionReducer.game_type_list,
    isDarkMode: state.auth.isDarkMode,
});

const mapDispatchToProps = {
    setCurrentQuestionInfo,
    acGetCustomerInfo
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BrainGame);
