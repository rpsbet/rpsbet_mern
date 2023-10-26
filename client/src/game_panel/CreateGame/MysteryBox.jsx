import React, { Component } from 'react';
import { convertToCurrency } from '../../util/conversion';
import { alertModal } from '../modal/ConfirmAlerts';

import { Table, TableBody, TableCell, TableRow, Button, TextField } from '@material-ui/core';
import { connect } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';


class MysteryBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      new_box_price: '',
      new_box_prize: '',
      winChance: 100,
      endgame_amount: 25
    };
  }

  onDragEnd = (result) => {
    if (!result.destination) {
      return; // Dropped outside the list
    }

    const { source, destination } = result;
    const reorderedBoxList = [...this.props.box_list];
    const [movedItem] = reorderedBoxList.splice(source.index, 1);
    reorderedBoxList.splice(destination.index, 0, movedItem);

    // Update the state with the reordered list
    this.updateBoxList(reorderedBoxList);
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

  addBoxes = (e, numBoxes) => {
    e.preventDefault();

    let new_box_price = parseFloat(this.state.new_box_price);
    let new_box_prize = parseFloat(this.state.new_box_prize);

    if (
      new_box_price <= 0 ||
      new_box_price === undefined ||
      new_box_price === '' ||
      isNaN(new_box_price)
    ) {
      alertModal(
        this.props.isDarkMode,
        `BOX PRICE MUST BE MORE THAN ZERO: NO FREE SAMPLES!`
      );
      return;
    }

    if (new_box_prize < 0 || isNaN(new_box_price)) {
      alertModal(this.props.isDarkMode, `WHAT KIND OF F*CKING PRIZE IS THAT?!`);
      return;
    }

    new_box_price = isNaN(new_box_price) ? 0 : new_box_price;
    new_box_prize = isNaN(new_box_prize) ? 0 : new_box_prize;

    let box_list = this.props.box_list;

    const delay = 1000 / numBoxes;
    let timeDelay = 0;

    for (let i = 0; i < numBoxes; i++) {
      setTimeout(() => {
        box_list = box_list.concat({
          box_price: new_box_price,
          box_prize: new_box_prize
        });

        const bet_amount = box_list.reduce(
          (totalAmount, box) => totalAmount + box.box_prize,
          0
        );
        const max_return = this.calcMaxReturn(box_list);

        this.props.onChangeState({
          box_list: box_list,
          winChance: this.props.calcMysteryBoxEV(
            box_list,
            max_return['max_return'],
            max_return['max_return']
          ),
          bet_amount: bet_amount,
          max_return: max_return['max_return'],
          max_prize: max_return['max_prize'],
          endgame_amount: max_return['max_return'],
          lowest_box_price: max_return['lowest_box_price'],
          public_bet_amount:
            max_return['lowest_box_price'] ===
            max_return['highest_box_price'] ? (
              convertToCurrency(max_return['lowest_box_price'])
            ) : (
              <>
                {convertToCurrency(max_return['lowest_box_price'])} -{' '}
                {convertToCurrency(max_return['highest_box_price'])}
              </>
            )
        });
      }, timeDelay);

      timeDelay += delay;
    }

    this.setState({
      new_box_price: '',
      new_box_prize: ''
    });
  };

  onAddBox = e => {
    this.addBoxes(e, 1);
    this.props.playSound('addBox');
  };

  onAddTenBoxes = e => {
    this.addBoxes(e, 10);
    this.props.playSound('addTen');
  };

  updateBoxList = newBoxList => {
    if (newBoxList.length === 0) {
      this.props.onChangeState({
        box_list: []
      });
      return;
    }

    const bet_amount = newBoxList.reduce(
      (totalAmount, box) => totalAmount + box.box_prize,
      0
    );
    const max_return = this.calcMaxReturn(newBoxList);

    this.props.onChangeState({
      box_list: newBoxList,
      bet_amount: bet_amount,
      winChance: this.props.calcMysteryBoxEV(
        newBoxList,
        max_return['max_return'],
        max_return['max_return']
      ),
      max_return: max_return['max_return'],
      max_prize: max_return['max_prize'],
      endgame_amount: max_return['max_return'],
      lowest_box_price: max_return['lowest_box_price'],
      public_bet_amount:
        max_return['lowest_box_price'] === max_return['highest_box_price'] ? (
          convertToCurrency(max_return['lowest_box_price'])
        ) : (
          <>
            {convertToCurrency(max_return['lowest_box_price'])} -{' '}
            {convertToCurrency(max_return['highest_box_price'])}
          </>
        )
    });
  };

  onRemoveBox = (index) => {
    this.props.playSound('tap');
    // Create a new array without the item to be removed
    const updatedBoxList = this.props.box_list.filter((box, i) => i !== index);
    this.updateBoxList(updatedBoxList);
  };
  
  onEmptyBoxes = e => {
    e.preventDefault();
    this.updateBoxList([]);
  };


  
  // componentDidUpdate(prevProps) {
  //   if (prevProps.endgame_amount !== this.props.endgame_amount) {
  //     const winChance = this.calcWinChance(this.props.box_list, this.props.endgame_amount);
  //     this.setState(winChance);
  //   }

  // }
  render() {
    const boxList = this.props.box_list;
    const uniquePrizes = [...new Set(boxList.map((row) => row.box_prize))];
  
    const calculateProbability = (prize) => {
      const count = boxList.filter((row) => row.box_prize === prize).length;
      const totalBoxes = boxList.length;
      return count / totalBoxes * 100;
    };
  
    // Sort unique prizes largest first
    uniquePrizes.sort((a, b) => b - a);
  
    // Check if there are no prizes
    const noPrizes = uniquePrizes.length === 0;
  
    // Map through the unique prizes and display the key
    const prizeKey = (
      
      <div className="prize-key">
                <h3 className="game-sub-title">Prizes</h3>

                <Table>
        
        <TableBody>
          {uniquePrizes.map((prize, index) => (
            <TableRow key={index}>
              <TableCell>
                <span className={`box ${prize > 0 ? 'lose-bg' : 'win-bg'}`}></span>
                {prize === 0.0 ? 'EMPTY' : convertToCurrency(prize)}
              </TableCell>
              <TableCell>{calculateProbability(prize).toFixed(2)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    );
  
    return (
      <div className="game-info-panel">
        {boxList.length === 0 ? <h3 className="game-sub-title">Add Some Boxes</h3> : prizeKey}

        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="boxList">
            {(provided) => (
              <div
                className="boxes-panel"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {boxList.map((row, key) => (
                  <Draggable key={key} draggableId={`box-${key}`} index={key}>
                    {(provided) => (
                      <div
                        className={`box ${row.box_prize > 0 ? 'lose-bg' : 'win-bg'}`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <i title="Delete Box?" onClick={() => this.onRemoveBox(key)}>
                          -
                        </i>
                        <span>
                          {row.box_prize === 0.0 ? 'EMPTY' : convertToCurrency(row.box_prize)}{' '}
                          / {convertToCurrency(row.box_price)}
                        </span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <hr />
        <div className="create-box-panel">
          <div className="amounts-panel">
            <div>
              <div className="edit-amount-panel">
                <TextField
                  variant="outlined"
                  type="text"
                  inputProps={{
                    pattern: '^\\d*\\.?\\d*$',
                    maxLength: 9
                  }}
                  style={{ marginRight: '15px' }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  name="new_box_prize"
                  id="new_box_prize"
                  value={this.state.new_box_prize}
                  onChange={this.onChangeNewBoxPrize}
                  placeholder="PRIZE"
                  InputProps={{
                    endAdornment: 'ETH'
                  }}
                />
              </div>
            </div>
            <div>
              <div className="edit-amount-panel">
                <TextField
                  type="text"
                  variant="outlined"
                  inputProps={{
                    pattern: '^\\d*\\.?\\d*$',
                    maxLength: 9
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  name="new_box_price"
                  id="new_box_price"
                  value={this.state.new_box_price}
                  onChange={this.onChangeNewBoxPrice}
                  placeholder="PRICE"
                  InputProps={{
                    endAdornment: 'ETH'
                  }}
                />
              </div>
            </div>
          </div>
          <div className="box-btn-row">
            <Button className="other" onClick={this.onAddBox}>
              Add box
            </Button>
            <Button id="add-ten" onClick={this.onAddTenBoxes}>
              Add 10 boxes
            </Button>
          </div>

          <Button
            id="reset"
            href="/#"
            onClick={this.onEmptyBoxes}
            title="Empty all boxes?"
          >
            Reset
          </Button>
        </div>
        <p className="tip">
          Boxes will be displayed to the public in the order you have added
          them.
        </p>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode
});

export default connect(mapStateToProps)(MysteryBox);
