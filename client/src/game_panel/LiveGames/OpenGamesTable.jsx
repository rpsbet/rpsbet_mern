import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { getRoomList, setCurRoomInfo } from '../../redux/Logic/logic.actions';
import { alertModal } from '../modal/ConfirmAlerts';
import PlayerModal from '../modal/PlayerModal';
import Battle from '../icons/Battle';

import { updateDigitToPoint2 } from '../../util/helper';

import Avatar from '../../components/Avatar';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import Pagination from '../../components/Pagination';
import { convertToCurrency } from '../../util/conversion';


class OpenGamesTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedGameType: 'All',
      showPlayerModal: false,
      selectedCreator: '',
      mouseDown: false

    };
  }

 
  handleOpenPlayerModal = (creator_id) => {
    console.log(creator_id);
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  }

  
  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };


  joinRoom = e => {
    this.setState({ isClicked: true });

    const creator_id = e.target.getAttribute('creator_id');
    const bet_amount = e.target.getAttribute('bet_amount');

    if (!this.props.isAuthenticated) {
      alertModal(this.props.isDarkMode, `LOGIN TO PLAY THIS GAME, MTF!!`);
      return;
    }

    if (e.target.getAttribute('room_status') === 'finished') {
      alertModal(
        this.props.isDarkMode,
        `THIS GAME HAS ENDED ALREADY`
      );
      return;
    }

    const room_id = e.target.getAttribute('_id');
    this.props.setCurRoomInfo({
      _id: room_id,
      game_type: e.target.getAttribute('game_type'),
      bet_amount: bet_amount,
      creator_id: creator_id,
      spleesh_bet_unit: parseInt(e.target.getAttribute('spleesh_bet_unit')),
      box_price: parseFloat(e.target.getAttribute('box_price')),
      game_log_list: [],
      box_list: [],
      brain_game_type: {
        _id: e.target.getAttribute('brain_game_type_id'),
        game_type_name: e.target.getAttribute('brain_game_type_name')
      },
      brain_game_score: e.target.getAttribute('brain_game_score')
    });
    history.push('/join/' + room_id);
  };

  handleGameTypeButtonClicked = async short_name => {
    this.setState({ selectedGameType: short_name });
    this.props.getRoomList({
      game_type: short_name
    });
    return;
  };

  handleBtnLeftClicked = e => {
    this.game_type_panel.scrollLeft = 0;
  };

  handleBtnRightClicked = e => {
    this.game_type_panel.scrollLeft = this.game_type_panel.scrollWidth;
  };


  generateGameTypePanel = () => {
    const gameTypeStyleClass = {
      RPS: 'rps',
      'S!': 'spleesh',
      MB: 'mystery-box',
      BG: 'brain-game',
      QS: 'quick-shoot',
      DG: 'drop-game'
    };
  
    const gameTypePanel = [
      <div
        className="btn-arrow-left"
        key="open-game-left-button"
        onClick={this.handleBtnLeftClicked}
      >
        <ChevronLeftIcon />
      </div>,
      <div
        className="btn-arrow-right"
        key="open-game-right-button"
        onClick={this.handleBtnRightClicked}
      >
        <ChevronRightIcon />
      </div>,
      <div
        className={`btn-game-type btn-icon all-games ${
          this.state.selectedGameType === 'All' ? 'active' : ''
        }`}
        key="open-game-all-game-button"
        game_type_id={null}
        short_name="All"
        onClick={e => {
          this.handleGameTypeButtonClicked('All');
        }}
      >
        {/* <img src={`/img/gametype/icons/All.svg`} alt="" /> */}
        <div>All Games</div>
      </div>
    ];
  
    const gameTypeIcons = Object.keys(gameTypeStyleClass).map(shortName => {
      const img = new Image();
      img.src = `/img/gametype/icons/${shortName}.svg`;
      return img;
    });
  
    this.props.gameTypeList.map((gameType, index) => {
      gameTypePanel.push(
        <div
          className={`btn-game-type btn-icon ${
            gameTypeStyleClass[gameType.short_name]
          } ${
            this.state.selectedGameType === gameType.short_name ? 'active' : ''
          }`}
          game_type_id={gameType._id}
          short_name={gameType.short_name}
          key={index}
          onClick={e => {
            this.handleGameTypeButtonClicked(gameType.short_name);
          }}
        >
          {/* <img src={`/img/gametype/icons/${gameType.short_name}.svg`} alt="" /> */}
          <div>{gameType.game_type_name}</div>
        </div>
      );
      return true;
    });
  
    return gameTypePanel;
  };

  componentDidMount() {
    window.addEventListener('load', () => {
      this.setState({ loaded: true });
    });
  }
  

  
  handlePageNumberClicked = page => {
    this.props.getRoomList({
      page: page,
      game_type: this.state.selectedGameType
    });
  };

  handlePrevPageClicked = () => {
    if (this.props.pageNumber === 1) return;
    this.props.getRoomList({
      page: this.props.pageNumber - 1,
      game_type: this.state.selectedGameType
    });
  };

  handleNextPageClicked = () => {
    if (this.props.pageNumber === this.props.totalPage) return;
    this.props.getRoomList({
      page: this.props.pageNumber + 1,
      game_type: this.state.selectedGameType
    });
  };

  render() {
    const gameTypePanel = this.generateGameTypePanel();
    // console.log('Props being passed to PlayerModal: ', this.state.selectedRow);

    return (
      
      <div className="overflowX">
        <div className="game-type-container">
          <div
            className="game-type-panel"
            ref={elem => {
              this.game_type_panel = elem;
            }}
          >
            {gameTypePanel}
          </div>
        </div>
        <div className="table main-game-table">
          {this.props.roomList.length === 0 && (
            <div className="dont-have-game-msg">
              <div>NO STAKES YET, GO TO 'MY STAKES'</div>
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
   
          {this.props.roomList.map(
            (row, key) => (
              <div className="table-row" key={row._id}>
                <div>
                  <div className="table-cell cell-room-info">
                    <img
                      src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                      alt=""
                      className="game-type-icon"
                    />
                    <div>
                      {/* <div className="cell-game-type">
                        {row.game_type.game_type_name}
                      </div> */}
                      <div className="cell-game-id">{'#' + row.index}</div>
                    </div>
                  </div>
                  <div className="table-cell desktop-only cell-user-name">
                  <a className="player" onClick={() => this.handleOpenPlayerModal(row.creator_id)}>                   

                    <Avatar
                      className="avatar"
                      src={row.creator_avatar}
                      alt=""
                      darkMode={this.props.isDarkMode}
                    />
                    {/* <span>{row.creator}</span> */}
                    </a>
                    <i
                      className={`online-status${
                        this.props.onlineUserList.filter(
                          user => user === row.creator_id
                        ).length > 0
                          ? ' online'
                          : ''
                      }`}
                    ></i>
                    {row.joiners && row.joiners.length > 0 ? (
  <div className="table-cell desktop-only cell-joiners">
    <Battle />
    {row.joiner_avatars.slice(0, 5).map((avatar, index) => (
      <Avatar
        className="avatar"
        key={index}
        src={avatar}
        alt=""
        darkMode={this.props.isDarkMode}
      />
    ))}
  </div>
) : null}
                  </div>
                  <div className="table-cell desktop-only cell-amount-info">
                 
  {row.game_type.game_type_name === 'Spleesh!'
    ? <>
      {/* {convertToCurrency(row.spleesh_bet_unit)} -  */}
      {convertToCurrency(row.spleesh_bet_unit * 10)}
       {/* / 
      '???' */}
    </>
    : <>
      {convertToCurrency(updateDigitToPoint2(row.user_bet))}
       {/* / 
      {convertToCurrency(row.winnings)} */}
    </>
  }
</div>
                  <div className="table-cell cell-action">
                    <button
                      className="btn_join"
                      onMouseDown={(event) => {
                        this.setState({ mouseDown: true });
                        event.currentTarget.classList.add('active');
                      }}
                      onMouseUp={(event) => {
                        this.setState({ mouseDown: false });
                        event.currentTarget.classList.remove('active');
                        this.joinRoom(event);
                      }}
                      onTouchStart={(event) => {
                        this.setState({ mouseDown: true });
                        event.currentTarget.classList.add('active');
                      }}
                      onTouchEnd={(event) => {
                        this.setState({ mouseDown: false });
                        event.currentTarget.classList.remove('active');
                        this.joinRoom(event);
                      }}
                      _id={row._id}
                      creator_id={row.creator_id}
                      room_status={row.status}
                      game_type={row.game_type.game_type_name}
                      bet_amount={row.user_bet}
                      spleesh_bet_unit={row.spleesh_bet_unit}
                      box_price={row.box_price}
                      brain_game_type_id={
                        row.brain_game_type ? row.brain_game_type._id : ''
                      }
                      brain_game_type_name={
                        row.brain_game_type
                          ? row.brain_game_type.game_type_name
                          : ''
                      }
                      brain_game_score={
                        row.brain_game_score ? row.brain_game_score : 0
                      }
                    >
                      {row.is_private && (
                        <img
                          src="/img/icon-lock.png"
                          alt=""
                          className="lock-icon"
                        />
                      )}
                      PLAY
                    </button>
                  </div>
                </div>
                <div className="mobile-only">

                  <div className="table-cell cell-user-name">
                  <a className="player" onClick={() => this.handleOpenPlayerModal(row.creator_id)}>                   
       
                    <Avatar
                      className="avatar"
                      src={row.creator_avatar}
                      alt=""
                      darkMode={this.props.isDarkMode}
                    />
                    {/* <span>{row.creator}</span> */}
                    </a>
                    <i
                      className={`online-status${
                        this.props.onlineUserList.filter(
                          user => user === row.creator_id
                        ).length > 0
                          ? ' online'
                          : ''
                      }`}
                    ></i>
                    {row.joiners && row.joiners.length > 0 ? (
  <div className="table-cell desktop-only cell-joiners">
    <Battle />
    {row.joiner_avatars.slice(0, 5).map((avatar, index) => (
      <Avatar
        className="avatar"
        key={index}
        src={avatar}
        alt=""
        darkMode={this.props.isDarkMode}
      />
    ))}
  </div>
) : null}

                  </div>
                  <div className="table-cell cell-amount-info">
                  {row.game_type.game_type_name === 'Spleesh!'
    ? <>
      {/* {convertToCurrency(row.spleesh_bet_unit)} -  */}
      {convertToCurrency(row.spleesh_bet_unit * 10)}
       {/* / 
      '???' */}
    </>
    : <>
      {convertToCurrency(updateDigitToPoint2(row.user_bet))}
       {/* / 
      {convertToCurrency(row.winnings)} */}
    </>
  }
                  </div>
                </div>
              </div>
            ),
            this
          )}
        </div>
       
        {this.props.roomList.length > 0 && (
          <Pagination
            handlePageNumberClicked={this.handlePageNumberClicked}
            handlePrevPageClicked={this.handlePrevPageClicked}
            handleNextPageClicked={this.handleNextPageClicked}
            pageNumber={this.props.pageNumber}
            totalPage={this.props.totalPage}
            prefix="LiveGames"
          />
        )}
        
      </div>
    );
  }
}

const mapStateToProps = state => ({
  creator: state.logic.curRoomInfo.creator_name,
  joiners: state.logic.curRoomInfo.joiners

});

const mapDispatchToProps = {
  getRoomList,
  setCurRoomInfo,
};

export default connect(mapStateToProps, mapDispatchToProps)(OpenGamesTable);
