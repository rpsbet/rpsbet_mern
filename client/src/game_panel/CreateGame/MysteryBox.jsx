import React, { Component } from 'react';
import { convertToCurrency } from '../../util/conversion';
import { alertModal } from '../modal/ConfirmAlerts';
import { Button, TextField  } from '@material-ui/core';

class MysteryBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      new_box_price: '',
      new_box_prize: '',
      winChance: 100,
            endgame_amount: 25,

    };
    this.calcWinChance = this.calcWinChance.bind(this);


  }
  
 
  calcWinChance = (boxes, revenueLimit) => {
    let emptyBoxesWithCost4 = 0;
    let prizeBoxCount = 0;
    let costOfPrizes = 0;
  
    // Count the number of empty boxes and prize boxes, and total the cost of prizes
    boxes.forEach(box => {
      if (box.box_prize) {
        prizeBoxCount++;
        costOfPrizes += box.box_price;
      } else {
        emptyBoxesWithCost4++;
      }
    });
  
    // Calculate the maximum number of guesses the guesser can make
    let maxGuesses = Math.floor((revenueLimit - costOfPrizes) / boxes[0].box_price);
  
    // Calculate the probability of the creator winning when the guesser chooses a box with cost 4
    let probabilityOfCreatorWinningWithCost4 = 0;
    for (let i = 0; i < prizeBoxCount && i < maxGuesses; i++) {
      let probability = 1;
      for (let j = 0; j < i; j++) {
        probability *= emptyBoxesWithCost4 / (boxes.length - j);
      }
      probability *= prizeBoxCount / (boxes.length - i);
      probabilityOfCreatorWinningWithCost4 += probability;
    }
  
    // Calculate the overall probability of the creator winning
    let probabilityOfCreatorWinning = ((probabilityOfCreatorWinningWithCost4 * (emptyBoxesWithCost4 / boxes.length)) * 100).toFixed(2);
  
    return probabilityOfCreatorWinning +  '%';
  };

  onChangeNewBoxPrize = e => {
    this.setState({ new_box_prize: e.target.value });
  };

  onChangeNewBoxPrice = e => {
    this.setState({ new_box_price: e.target.value });
  };

  calcMaxReturn = box_list => {
    let max_return = 0;
    let max_prize = 0;
    let lowest_box_price = -1;
    let highest_box_price = 0;

    box_list.map(row => {
      if (lowest_box_price === -1 || lowest_box_price > row.box_price) {
        lowest_box_price = row.box_price;
      }

      if (highest_box_price < row.box_price) {
        highest_box_price = row.box_price;
      }

      if (row.box_prize >= row.box_price) {
        max_return += row.box_prize;
      } else {
        max_return += row.box_price;
      }

      if (max_prize < row.box_prize) {
        max_prize = row.box_prize;
      }

      return true;
    }, this);

    return { max_return, max_prize, lowest_box_price, highest_box_price };
  };

  onAddBox = e => {
    e.preventDefault();

    let new_box_price = parseFloat(this.state.new_box_price);
    let new_box_prize = parseFloat(this.state.new_box_prize);

    if (new_box_price <= 0) {
      alertModal(
        this.props.isDarkMode,
        `NOTHING IN LIFE IS FREE!`
      );
      return;
    }

    if (new_box_prize < 0) {
      alertModal(
        this.props.isDarkMode,
        `WHAT KIND OF F*CKING PRIZE IS THAT?!`
      );
      return;
    }

    new_box_price = isNaN(new_box_price) ? 0 : new_box_price;
    new_box_prize = isNaN(new_box_prize) ? 0 : new_box_prize;

    const box_list = this.props.box_list.concat({
      box_price: new_box_price,
      box_prize: new_box_prize
    });
    const bet_amount = box_list.reduce(
      (totalAmount, box) => totalAmount + box.box_prize,
      0
    );
    const max_return = this.calcMaxReturn(box_list);

    this.setState({
      new_box_price: '',
      new_box_prize: ''
    });

    this.props.onChangeState({
      box_list: box_list,
      winChance: this.calcWinChance(box_list, this.props.endgame_amount),
      bet_amount: bet_amount,
      max_return: max_return['max_return'],
      max_prize: max_return['max_prize'],
      endgame_amount: max_return['max_return'],
      lowest_box_price: max_return['lowest_box_price'],
      public_bet_amount:
        max_return['lowest_box_price'] === max_return['highest_box_price']
          ? convertToCurrency(max_return['lowest_box_price'])
          : <>{convertToCurrency(
              max_return['lowest_box_price']
            )} - {convertToCurrency(max_return['highest_box_price'])}</>
    });
  };

  onAddTenBoxes = e => {
    e.preventDefault();

    let new_box_price = parseFloat(this.state.new_box_price);
    let new_box_prize = parseFloat(this.state.new_box_prize);

    if (new_box_price < 0) {
      alertModal(
        this.props.isDarkMode,
        `You can't make a box with negative price!`
      );
      return;
    }

    if (new_box_prize < 0) {
      alertModal(
        this.props.isDarkMode,
        `You can't make a box with negative prize!`
      );
      return;
    }

    new_box_price = isNaN(new_box_price) ? 0 : new_box_price;
    new_box_prize = isNaN(new_box_prize) ? 0 : new_box_prize;

    let box_list = this.props.box_list;
    for (let i = 0; i < 10; i++) {
      box_list = box_list.concat({
        box_price: new_box_price,
        box_prize: new_box_prize
      });
    }

    const bet_amount = box_list.reduce(
      (totalAmount, box) => totalAmount + box.box_prize,
      0
    );
    const max_return = this.calcMaxReturn(box_list);

    this.setState({
      new_box_price: '',
      new_box_prize: ''
    });

    this.props.onChangeState({
      box_list: box_list,
      winChance: this.calcWinChance(box_list, this.props.endgame_amount),

      bet_amount: bet_amount,
      max_return: max_return['max_return'],
      max_prize: max_return['max_prize'],
      endgame_amount: max_return['max_return'],
      lowest_box_price: max_return['lowest_box_price'],
      public_bet_amount:
        max_return['lowest_box_price'] === max_return['highest_box_price']
          ? convertToCurrency(max_return['lowest_box_price'])
          : <> {convertToCurrency(
              max_return['lowest_box_price']
            )} - {convertToCurrency(max_return['highest_box_price'])}</>
    });
  };

  onRemoveBox = e => {
    e.preventDefault();
    let box_list = this.props.box_list;
    box_list.splice(e.target.getAttribute('index'), 1);
    const bet_amount = box_list.reduce(
      (totalAmount, box) => totalAmount + box.box_prize,
      0
    );
    const max_return = this.calcMaxReturn(box_list);

    this.props.onChangeState({
      box_list: box_list,
      bet_amount: bet_amount,
      winChance: this.calcWinChance(box_list, this.props.endgame_amount),

      max_return: max_return['max_return'],
      max_prize: max_return['max_prize'],
      endgame_amount: max_return['max_return'],
      lowest_box_price: max_return['lowest_box_price'],
      public_bet_amount:
        max_return['lowest_box_price'] === max_return['highest_box_price']
          ? convertToCurrency(max_return['lowest_box_price'])
          : <>{convertToCurrency(
              max_return['lowest_box_price']
            )} - {convertToCurrency(max_return['highest_box_price'])}</>
    });
  };

  onEmptyBoxes = e => {
    e.preventDefault();
    this.props.onChangeState({
      box_list: [],
      bet_amount: 0,
      max_return: 0,
      max_prize: 0,
      endgame_amount: 0
    });
  };

  // componentDidUpdate(prevProps) {
  //   if (prevProps.endgame_amount !== this.props.endgame_amount) {
  //     const winChance = this.calcWinChance(this.props.box_list, this.props.endgame_amount);
  //     this.setState(winChance);
  //   }

  // }
  render() {
    return (
      <div className="game-info-panel">
        <h3 className="game-sub-title">Create a box</h3>
        <div className="boxes-panel">
          {this.props.box_list.map(
            (row, key) => (
              <div className="box" key={key}>
                <i title="Delete Box?" onClick={this.onRemoveBox} index={key}>
                  -
                </i>
                <span>
                  {convertToCurrency(row.box_prize)} /{' '}
                  {convertToCurrency(row.box_price)}
                </span>
              </div>
            ),
            this
          )}
        </div>
        <div className="create-box-panel">
          <div className="amounts-panel">
            <div>
              <div className="edit-amount-panel">
                        
              
                <TextField
                  type="text"
                  inputProps={{
                    pattern: "[0-9]*",
                    maxLength: 9,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  name="new_box_prize"
                  id="new_box_prize"
                  value={this.state.new_box_prize}
                  onChange={this.onChangeNewBoxPrize}
                  placeholder="PRIZE"
                  InputProps={{
                    endAdornment: "BUSD",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="edit-amount-panel">
              <TextField
                  type="text"
                  inputProps={{
                    pattern: "[0-9]*",
                    maxLength: 9,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  name="new_box_price"
                  id="new_box_price"
                  value={this.state.new_box_price}
                  onChange={this.onChangeNewBoxPrice}
                  placeholder="PRICE"
                  InputProps={{
                    endAdornment: "BUSD",
                  }}
                />
              </div>
            </div>
          </div>
          <div class="box-btn-row">
          <Button className="other" onClick={this.onAddBox}>
            Add box
          </Button>
          <Button id="add-ten" onClick={this.onAddTenBoxes}>
            Add 10 boxes
          </Button>
          </div>
          <a
            href="/#"
            className="btn-empty-boxes"
            onClick={this.onEmptyBoxes}
            title="Empty all boxes?"
          >
            Reset
          </a>
        </div>
        <p className="tip">
          Boxes will be displayed to the public in the order you have added
          them.
        </p>
      </div>
    );
  }
}

export default MysteryBox;
