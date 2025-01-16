import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getMyHistory } from '../../redux/Logic/logic.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getSettings } from '../../redux/Setting/setting.action';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import {
  Tooltip,
} from '@material-ui/core';
import Moment from 'moment';
// import ReactDOM from 'react-dom';
import { renderLottieAvatarAnimation } from '../../util/LottieAvatarAnimations';
import PlayerModal from '../modal/PlayerModal';
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
    this.isUnmounted = false;
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
    if (!this.isUnmounted) {
      this.setState({ myHistory: updateFromNow(this.state.myHistory) });
    }
  };

  async componentDidMount() {
    const { getMyHistory, isAuthenticated } = this.props;
    const promises = [];
    if (isAuthenticated) {
      promises.push(getMyHistory());
    }

    await Promise.all(promises);

    if (!this.isUnmounted) {
      this.updateReminderTime();
      this.attachUserLinkListeners();
      // this.attachAccessories();
    }

    this.interval = setInterval(this.updateReminderTime, 3000);
    const settings = await this.props.getSettings();
    if (!this.isUnmounted) {
      this.setState({ ...settings });
    }

  }

  // componentDidUpdate(prevProps) {
  //   if (prevProps.history !== this.props.history) {
  //     this.attachUserLinkListeners();
  //     this.attachAccessories();
  //     this.setState({ history: updateFromNow(this.props.history) });
  //   }
  // }

  // attachAccessories = () => {
  //   const userLinks = document.querySelectorAll('.user-link');
  //   userLinks.forEach(element => {
  //     const accessory = element.getAttribute('accessory');
  //     const lottieAnimation = renderLottieAvatarAnimation(accessory);
  //     const portalContainer = document.createElement('div');
  //     ReactDOM.render(lottieAnimation, portalContainer);
  //     element.parentNode.insertBefore(portalContainer, element);
  //   });
  // };

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
    this.isUnmounted = true;
    clearInterval(this.interval);
  }

  copyToClipboard = (rowId) => {
    navigator.clipboard.writeText(rowId)
      .then(() => {
        this.setState({ copiedRowId: rowId });
        setTimeout(() => {
          this.setState({ copiedRowId: null });
        }, 1500);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };
 
  render() {
    const {isLowGraphics} = this.props;
    const HeartIcon = ({ isOpen }) => {
      const icon = isOpen ? faHeart : faHeartBroken;
    
      return <FontAwesomeIcon icon={icon} />;
    };
    
    return (
      <div className="overflowX">
        <div className="table main-history-table">
          {this.state.myHistory?.length === 0 && (
            <div className="dont-have-game-msg">
              <div>NO GAME HISTORY RIGHT NOW</div>
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
          />
        )}
      
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
});

const mapDispatchToProps = {
  getMyHistory,
  getSettings,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyHistoryTable);
