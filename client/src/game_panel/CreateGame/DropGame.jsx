import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  alertModal
} from '../modal/ConfirmAlerts';

class RPS extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_rps: '',
      bet_amount: 5.00,
      winChance: 33,
    autoplay: false

    };
    this.onChangeBetAmount = this.onChangeBetAmount.bind(this);

  }

  onAutoPlay = () => {
    
    if(this.props.rps_list.length > 2){
      const prevStates = this.props.rps_list;
      const nextRPS = predictNext(prevStates, this.props.rps_list);
      this.onAddRun(nextRPS);

    }else {
      alertModal(this.props.isDarkMode, 'MINIMUM 3 RUNS, TO MAKE A PREDICTION!!!');
      return;
    }
   
  };


  onChangeWinChance = (winChance) => {
    this.setState({ winChance });
  };

 
  

  onRemoveItem = index => {
    const newArray = this.props.rps_list.filter((elem, i) => i != index);
    // const bet_amount = calcBetAmount(newArray);
    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      rps_list: newArray,
      // bet_amount: bet_amount,
      // max_return: bet_amount * 2 /* 0.95 */,
      winChance: winChance
    });

  };


  onAddRun = (selected_rps) => {
    this.setState({ selected_rps: selected_rps });
    const newArray = JSON.parse(JSON.stringify(this.props.rps_list));
    newArray.push({
      rps: selected_rps
      // bet_amount: selected_bet_amount,
      // pr: selected_bet_amount * 2
    });
    // const bet_amount = calcBetAmount(newArray);
    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      rps_list: newArray,
      winChance: winChance
    });
    this.onChangeWinChance(winChance);
    this.setState({ winChance });
    // this.updateTransitionMatrix();


  };

  componentDidUpdate(prevProps) {
    if (prevProps.rps_list !== this.props.rps_list) {
         const lastRow = document.querySelector("#runs tr:last-child");
         lastRow.scrollIntoView({block: "end", behavior: "smooth", top: -200});
    }
  }


  handleAutoplayChange = () => {
    this.setState(prevState => ({
      autoplay: !prevState.autoplay
    }));
  };
  onChangeBetAmount = new_state => {
    this.setState({ bet_amount: new_state.selected_bet_amount });
  };
  render() {
    

    return (
      
      <div className="game-info-panel">
        <h3 className="game-sub-title">COMING SOON</h3>
      
      </div>
    );
  }
}

const mapStateToProps = state => ({
  
  auth: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode,

});

export default connect(mapStateToProps)(RPS);
