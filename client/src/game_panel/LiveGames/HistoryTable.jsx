import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getHistory } from '../../redux/Logic/logic.actions';
import Moment from 'moment';
import { getSettings } from '../../redux/Setting/setting.action';
import { convertToCurrency } from '../../util/conversion';
import ReactDOM from 'react-dom';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHeartBroken, faStopwatch} from '@fortawesome/free-solid-svg-icons';
import BetArray from '../../components/BetArray';
import CountUp from 'react-countup';
import InlineSVG from 'react-inlinesvg';
import busdSvg from '../JoinGame/busd.svg';
import PlayerModal from '../modal/PlayerModal';
import Lottie from 'react-lottie';
import rain from '../LottieAnimations/rain.json';
import waves from '../LottieAnimations/waves.json';
import hex from '../LottieAnimations/hex.json';

function updateFromNow(history) {
  const result = JSON.parse(JSON.stringify(history));
  for (let i = 0; i < result.length; i++) {
    result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
  }
  return result;
}

class HistoryTable extends Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;

    this.state = {
      history: this.props.history,
      showPlayerModal: false,
      rain: 0
    };
  }

  async componentDidMount() {
    this.updateReminderTime();
    this.attachUserLinkListeners();
    this.attachAccessories();
    this.interval = setInterval(this.updateReminderTime(), 3000);
    const settings = await this.props.getSettings();
    this.setState({ ...settings });

    const { socket } = this.props;
    if (socket) {
      socket.on('UPDATE_RAIN', data => {
        this.setState(prevState => ({
          rain: data.rain,
          prevRain: prevState.rain
        }));
      });
      
    } else {
      console.error('Socket is null or undefined');
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.history?.length === 0 ||
      (props.history &&
        current_state.history[0]['created_at'] !==
          props.history[0]['created_at'])
    ) {
      return {
        ...current_state,
        history: updateFromNow(props.history)
      };
    }
    return null;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.history !== this.props.history) {
      this.attachUserLinkListeners();
      this.attachAccessories();

      this.setState({ history: updateFromNow(this.props.history) });
    }
  }

  attachUserLinkListeners = () => {
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach(link => {
      link.addEventListener('click', event => {
        const userId = event.target.getAttribute('data-userid');
        this.handleOpenPlayerModal(userId);
      });
    });
  };
  attachAccessories = () => {
    const {isLowGraphics} = this.props;
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach(element => {
      const userId = element.getAttribute('data-userid'); // Get userId from the user-link element
      const accessory = element.getAttribute('accessory');
      const lottieAnimation = renderLottieAvatarAnimation(accessory, isLowGraphics);
      const portalContainer = document.createElement('div');
      ReactDOM.render(lottieAnimation, portalContainer);
      element.parentNode.insertBefore(portalContainer, element);
  
      // Attach click event listener to the accessory element
      portalContainer.addEventListener('click', () => {
        this.handleOpenPlayerModal(userId);
      });
        portalContainer.style.cursor = 'pointer';
    });
  };
  

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  updateReminderTime = () => {
    this.setState({ history: updateFromNow(this.state.history) });
  };

  // handleGameTypeButtonClicked = async short_name => {
  //   this.setState({ selectedGameType: short_name });
  //   this.props.getHistory({
  //     game_type: short_name
  //   });
  // };

  // handleBtnLeftClicked = e => {
  //   const scrollAmount = 200; // Change this value to adjust the scroll amount
  //   this.game_type_panel.scrollLeft -= scrollAmount;
  // };

  // handleBtnRightClicked = e => {
  //   const scrollAmount = 200; // Change this value to adjust the scroll amount
  //   this.game_type_panel.scrollLeft += scrollAmount;
  // };

  // generateGameTypePanel = () => {
  //   const gameTypeStyleClass = {
  //     RPS: 'rps',
  //     'S!': 'spleesh',
  //     MB: 'mystery-box',
  //     BG: 'brain-game',
  //     QS: 'quick-shoot',
  //     DG: 'drop-game',
  //     'B!': 'bang',
  //     R: 'roll'
  //   };

  //   const gameTypePanel = (
  //     <Box
  //       display="flex"
  //       justifyContent="space-evenly"
  //       flexWrap="nowrap"
  //       gap="15px"
  //     >
  //       <Box key="open-game-left-button">
  //         <IconButton
  //           className="btn-arrow-left"
  //           onClick={this.handleBtnLeftClicked}
  //         >
  //           <ChevronLeftIcon />
  //         </IconButton>
  //       </Box>
  //       <Button
  //         className={`btn-game-type btn-icon all-games ${
  //           this.state.selectedGameType === 'All' ? 'active' : ''
  //         }`}
  //         key="open-game-all-game-button"
  //         onClick={() => {
  //           this.handleGameTypeButtonClicked('All');
  //         }}
  //       >
  //         All Games
  //       </Button>
  //       {this.props.gameTypeList.map((gameType, index) => (
  //         <Button
  //           className={`btn-game-type btn-icon ${
  //             gameTypeStyleClass[gameType.short_name]
  //           } ${
  //             this.state.selectedGameType === gameType.short_name
  //               ? 'active'
  //               : ''
  //           }`}
  //           key={index}
  //           onClick={() => {
  //             this.handleGameTypeButtonClicked(gameType.short_name);
  //           }}
  //         >
  //           {gameType.game_type_name}
  //         </Button>
  //       ))}
  //       <Box key="open-game-right-button">
  //         <IconButton
  //           className="btn-arrow-right"
  //           onClick={this.handleBtnRightClicked}
  //         >
  //           <ChevronRightIcon />
  //         </IconButton>
  //       </Box>
  //     </Box>
  //   );

  //   return gameTypePanel;
  // };

  handlePageNumberClicked = page => {
    this.props.getHistory({
      page: page,
      game_type: this.state.selectedGameType
    });
  };

  handlePrevPageClicked = () => {
    if (this.props.pageNumber === 1) return;
    this.props.getHistory({
      page: this.props.pageNumber - 1,
      game_type: this.state.selectedGameType
    });
  };

  handleNextPageClicked = () => {
    if (this.props.pageNumber === this.props.totalPage) return;
    this.props.getHistory({
      page: this.props.pageNumber + 1,
      game_type: this.state.selectedGameType
    });
  };

  render() {
    const {isLowGraphics} = this.props;
    // const gameTypePanel = this.generateGameTypePanel();
    const HeartIcon = ({ isOpen }) => {
      const icon = isOpen ? faHeart : faHeartBroken;
    
      return <FontAwesomeIcon icon={icon} />;
    };
    
    return (
      <div className="overflowX">
        <div className="outer-div">
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
          {/* <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: waves
            }}
            style={{
              transform: 'translateY(-66px)',
              width: '361px',
              height: '100%',
              overflow: 'hidden',
              margin: '60px 0px -236px',
              outline: 'none',
              filter: 'hue-rotate(48deg)',
              maxWidth: '100%'
            }}
          /> */}
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
                  textShadow: '0 0 4px #0058b6'
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
            Returned to Bankrolls (RTBs)
          </span>
        </div>
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
          {this.state.history?.length === 0 && (
            <div className="dont-have-game-msg">
              <div>NO HISTORY YET</div>
            </div>
          )}
          {this.state.history?.map(
            (row, key) => (
              <div
                className={`table-row ${key < 10 ? 'slide-in' : ''}`}
                style={{ animationDelay: `${key * 0.1}s` }}
                key={row._id}
              >
                {' '}
                {renderLottieAvatarAnimation(row.gameBackground, isLowGraphics)}
                <div>
                  <div className="table-cell">
                    <div className="room-id">
                      {row.status}&nbsp;{row.status === 'open' ? <HeartIcon isOpen={true} /> : <HeartIcon isOpen={false} />}
                      </div>
                    <div
                      className="desktop-only"
                      dangerouslySetInnerHTML={{ __html: row.history }}
                    ></div>
                  </div>
                  <div className="table-cell">{row.from_now}&nbsp;<FontAwesomeIcon icon={faStopwatch} /></div>
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
          />
        )}
        
      </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  isAuthenticated: state.auth.isAuthenticated,
  history: state.logic.history,
  pageNumber: state.logic.historyPageNumber,
  totalPage: state.logic.historyTotalPage,
  isDarkMode: state.auth.isDarkMode,
  isLowGraphics: state.auth.isLowGraphics
  // gameTypeList: state.logic.gameTypeList
});

const mapDispatchToProps = {
  getHistory,
  getSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(HistoryTable);
