import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getMyHistory } from '../../redux/Logic/logic.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CountUp from 'react-countup';
import { getSettings } from '../../redux/Setting/setting.action';
import InlineSVG from 'react-inlinesvg';
import busdSvg from '../JoinGame/busd.svg';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import {
  Tooltip,
  IconButton
} from '@material-ui/core';
import Moment from 'moment';
import ReactDOM from 'react-dom';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import PlayerModal from '../modal/PlayerModal';
import Lottie from 'react-lottie';
import rain from '../LottieAnimations/rain.json';
import waves from '../LottieAnimations/waves.json';
import hex from '../LottieAnimations/hex.json';
import { faHeart, faHeartBroken, faStopwatch} from '@fortawesome/free-solid-svg-icons';

function updateFromNow(history = []) {
  const result = JSON.parse(JSON.stringify(history));
  for (let i = 0; i < result.length; i++) {
    result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
  }
  return result;
}

class MyHistoryTable extends Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;

    this.state = {
      myHistory: this.props.myHistory,
      selectedGameType: 'All',
      showPlayerModal: false,
      copiedRowId: null
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      (current_state.myHistory && current_state.myHistory.length === 0) ||
      (current_state.myHistory &&
        current_state.myHistory.length !== props.myHistory?.length) ||
      (props.myHistory &&
        current_state.myHistory &&
        current_state.myHistory[0]['created_at'] !==
          props.myHistory[0]['created_at'])
    ) {
      return {
        ...current_state,
        myHistory: updateFromNow(props.myHistory)
      };
    }
    return null;
  }

  updateReminderTime = () => {
    this.setState({ myHistory: updateFromNow(this.state.myHistory) });
  };

  async componentDidMount() {
    this.updateReminderTime();
    this.attachUserLinkListeners();
    this.attachAccessories();

    this.interval = setInterval(this.updateReminderTime(), 3000);
    const settings = await this.props.getSettings();
    this.setState({ ...settings });

    const { socket } = this.props;
    socket.on('UPDATE_RAIN', data => {
      this.setState(prevState => ({
        rain: data.rain,
        prevRain: prevState.rain // Store the previous rain value
      }));
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.history !== this.props.history) {
      // this.attachUserLinkListeners();
      // this.attachAccessories();

      this.setState({ history: updateFromNow(this.props.history) });
    }
  }

  attachAccessories = () => {
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach(element => {
      const accessory = element.getAttribute('accessory');
      const lottieAnimation = renderLottieAvatarAnimation(accessory);
      const portalContainer = document.createElement('div');
      ReactDOM.render(lottieAnimation, portalContainer);
      element.parentNode.insertBefore(portalContainer, element);
    });
  };

  attachUserLinkListeners = () => {
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach(link => {
      link.addEventListener('click', event => {
        const userId = event.target.getAttribute('data-userid');
        this.handleOpenPlayerModal(userId);
      });
    });
  };

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  copyToClipboard = (rowId) => {
    navigator.clipboard.writeText(rowId)
      .then(() => {
        this.setState({ copiedRowId: rowId });
        setTimeout(() => {
          this.setState({ copiedRowId: null });
        }, 1500); // Reset the copied row after 1.5 seconds
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };


  // handleGameTypeButtonClicked = async short_name => {
  //   this.setState({ selectedGameType: short_name });
  //   this.props.getMyHistory({
  //     game_type: short_name
  //   });
  // };

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  //   handleBtnLeftClicked = e => {
  //     const scrollAmount = 200; // Change this value to adjust the scroll amount
  //     this.game_type_panel.scrollLeft -= scrollAmount;
  //   };

  //   handleBtnRightClicked = e => {
  //     const scrollAmount = 200; // Change this value to adjust the scroll amount
  //     this.game_type_panel.scrollLeft += scrollAmount;
  //   };

  //   generateGameTypePanel = () => {
  //     const gameTypeStyleClass = {
  //       RPS: 'rps',
  //       'S!': 'spleesh',
  //       MB: 'mystery-box',
  //       BG: 'brain-game',
  //       QS: 'quick-shoot',
  //       DG: 'drop-game',
  //       'B!': 'bang',
  //       R: 'roll'
  //     };

  //     const gameTypePanel = (
  //       <Box display="flex" justifyContent="space-evenly" flexWrap="nowrap"  gap="15px">
  //         <Box key="open-game-left-button">
  //           <IconButton
  //             className="btn-arrow-left"
  //             onClick={this.handleBtnLeftClicked}
  //           >
  //             <ChevronLeftIcon />
  //           </IconButton>
  //         </Box>
  //         <Button
  //   className={`btn-game-type btn-icon all-games ${
  //     this.state.selectedGameType === 'All' ? 'active' : ''
  //   }`}
  //   key="open-game-all-game-button"
  //   onClick={() => {
  //     this.handleGameTypeButtonClicked('All');
  //   }}
  // >
  //   All Games
  // </Button>
  // {this.props.gameTypeList.map((gameType, index) => (
  //   <Button
  //     className={`btn-game-type btn-icon ${
  //       gameTypeStyleClass[gameType.short_name]
  //     } ${
  //       this.state.selectedGameType === gameType.short_name ? 'active' : ''
  //     }`}
  //     key={index}
  //     onClick={() => {
  //       this.handleGameTypeButtonClicked(gameType.short_name);
  //     }}
  //   >
  //     {gameType.game_type_name}
  //   </Button>
  //         ))}
  //         <Box key="open-game-right-button">
  //           <IconButton
  //             className="btn-arrow-right"
  //             onClick={this.handleBtnRightClicked}
  //           >
  //             <ChevronRightIcon />
  //           </IconButton>
  //         </Box>
  //       </Box>
  //     );

  //     return gameTypePanel;

  //   };

  handlePageNumberClicked = page => {
    this.props.getMyHistory({
      page: page
      // game_type: this.state.selectedGameType
    });
  };

  handlePrevPageClicked = () => {
    if (this.props.pageNumber === 1) return;
    this.props.getMyHistory({
      page: this.props.pageNumber - 1,
      game_type: this.state.selectedGameType
    });
  };

  handleNextPageClicked = () => {
    if (this.props.pageNumber === this.props.totalPage) return;
    this.props.getMyHistory({
      page: this.props.pageNumber + 1,
      game_type: this.state.selectedGameType
    });
  };

  render() {
    const {isLowGraphics} = this.props;
    const HeartIcon = ({ isOpen }) => {
      const icon = isOpen ? faHeart : faHeartBroken;
    
      return <FontAwesomeIcon icon={icon} />;
    };
    
    return (
      <div className="overflowX">
        {/* <div className="outer-div">
          <div className="border-mask" />
          
          <Lottie
            options={{
              loop: isLowGraphics ? false: true,
              autoplay: isLowGraphics ? false: true,
              animationData: hex
            }}
            style={{
              width: '142px',
              height: '100%',
              overflow: 'hidden',
              margin: '-2px 0px -136px',
              outline: 'none',
              filter: 'grayscale(100%)',
              maxWidth: '100%'
            }}
          />
         
          <InlineSVG
            className="rain"
            id="busd"
            src={busdSvg}
          />
          <CountUp
            end={this.state.rain}
            start={this.state.prevRain}
            duration={2}
            separator=","
            decimals={6}
          >
            {({ countUpRef, start }) => (
              <h1
                id="rain"
                ref={countUpRef}
                style={{
                  color: '#fff',
                  fontSize: '1em',
                  position: 'relative',
                  display: 'inline-block',
                  zIndex: '1',
                  textShadow: '0 0 12px #0058b6'
                }}
              />
            )}
          </CountUp>
          <span
            style={{
              color: '#fff',
              position: 'relative',
              zIndex: '1',
              fontSize: '0.6em',
              paddingLeft: '10px',
              textShadow: '0 0 12px #0058b6'
            }}
          >
            / 10.00 (NEXT BIG GIVEAWAY EVENT)
          </span>
        </div> */}
        {/* <div className="game-type-container">
          <div
            className="game-type-panel"
            ref={elem => {
              this.game_type_panel = elem;
            }}
          >
            {gameTypePanel}
          </div>
        </div> */}
        <div className="table main-history-table">
          {this.state.myHistory?.length === 0 && (
            <div className="dont-have-game-msg">
              <div>NO BATTLE HISTORY RIGHT NOW</div>
            </div>
          )}
          {this.state.myHistory?.map(
            (row, key) => (
              <div
                className={`table-row ${key < 10 ? 'slide-in' : ''}`}
                style={{ animationDelay: `${key * 0.1}s` }}
                key={row._id}
              >
                 {' '}
                 {/* {renderLottieAvatarAnimation(row.gameBackground, isLowGraphics)} */}
                <div>
                  <div className="table-cell">
                  {row.status}&nbsp;{row.status === 'open' ? <HeartIcon isOpen={true} /> : <HeartIcon isOpen={false} />}
                    <div
                      className="desktop-only"
                      dangerouslySetInnerHTML={{ __html: row.history }}
                    ></div>
                  </div>
                  <div className="table-cell">{row.from_now}&nbsp;<FontAwesomeIcon icon={faStopwatch} /></div>
                  <div className="table-cell row-copy">

                    <Tooltip title={this.state.copiedRowId === row._id ? "COPIED ID!" : "COPY BET ID"} placement="top">
                      <a style={{padding: "5px", cursor: "pointer"}} onClick={() => this.copyToClipboard(row._id)}>
                        <FileCopyIcon style={{width: "12px"}}  />
                      </a>
                    </Tooltip>

                  </div>
                </div>
                <div>
                  <div
                    className="table-cell mobile-only"
                    dangerouslySetInnerHTML={{ __html: row.history }}
                  ></div>
                </div>
              </div>
            ),
            this
          )}
        </div>
        {this.state.showPlayerModal && (
          <PlayerModal
            modalIsOpen={this.state.showPlayerModal}
            closeModal={this.handleClosePlayerModal}
            selectedCreator={this.state.selectedCreator}
            // player_name={this.state.userName}
            // balance={this.state.balance}
            // avatar={this.props.user.avatar}
          />
        )}
        {/* {this.state.myHistory?.length > 0 && (
          <Pagination
            handlePageNumberClicked={this.handlePageNumberClicked}
            handlePrevPageClicked={this.handlePrevPageClicked}
            handleNextPageClicked={this.handleNextPageClicked}
            pageNumber={this.props.pageNumber}
            totalPage={this.props.totalPage}
            prefix="MyHistory"
          />
        )} */}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  isAuthenticated: state.auth.isAuthenticated,
  isLowGraphics: state.auth.isLowGraphics,

  myHistory: state.logic.myHistory,
  pageNumber: state.logic.myHistoryPageNumber,
  totalPage: state.logic.myHistoryTotalPage
  // gameTypeList: state.logic.gameTypeList
});

const mapDispatchToProps = {
  getMyHistory,
  getSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(MyHistoryTable);
