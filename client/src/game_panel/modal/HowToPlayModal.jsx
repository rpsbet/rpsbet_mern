import React, { Component } from 'react';
import Modal from 'react-modal';
import DepositModal from './DepositModal';

Modal.setAppElement('#root')

const customStyles = {
    overlay: {
        zIndex: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.75)'
    },
    content: {
        minWidth    : '500px',
        maxWidth    : '80%',
        top         : '50%',
        left        : '50%',
        right       : 'auto',
        bottom      : 'auto',
        marginRight : '-50%',
        transform   : 'translate(-50%, -50%)',
        backgroundColor: '#f8f9fa'
    }
}

class HowToPlayModal extends Component {
    constructor(props) {
        super(props);
    
        this.state = {
            showDepositModal: false
        }
    
        this.handleOpenDepositModal = this.handleOpenDepositModal.bind(this);
        this.handleCloseDepositModal = this.handleCloseDepositModal.bind(this);
    }

    handleOpenDepositModal () {
        this.setState({ showDepositModal: true });
    }
      
    handleCloseDepositModal () {
        this.setState({ showDepositModal: false });
    }

    componentDidMount() {
    }

    render() {
        return <Modal
            isOpen={this.props.modalIsOpen}
            // onAfterOpen={afterOpenModal}
            onRequestClose={this.props.closeModal}
            style={customStyles}
            // style={customStyles}
            contentLabel="How To Play Modal"
        >
        
        <div className="modal-header">
            <h2 style={{borderBottom: "1px solid gray"}}>How To Play <span style={{color: "#c33626"}}>RPS</span> <span style={{color: "#ebddca"}}>Bet</span></h2>
            <button className="btn_modal_close" onClick={this.props.closeModal}>×</button>
            </div>

<div className="modal-body">
<h4><b><span>Mystery Box</span> Game Mode</b></h4>
<h5>HOST GAME</h5>
<ol>
                        <li>Create a mix of Prize boxes and EMPTY boxes. These will be positioned randomly for your opponent(s).</li>
                        <li>Set the cost to open one of your boxes. Everytime an opponent opens a box, the money is added to the <u>PR</u>.</li>
                        <li>The aim is to hope everyone opens your EMPTY boxes to build your game <u>PR</u> and then END it before somebody opens a Prize box <i>(you can now END games automatically in advanced game settings).</i></li>
                    </ol>
<h5>JOIN GAME</h5>
<ol>
                        <li>Open a box and hope to win a Prize, all losses will be added to the <u>PR</u>.</li>
                    </ol>
<h5 style={{color: "#02c526"}}>WINNINGS</h5>
<p>e.g. Host creates a game with these boxes: £25, £0, £0, £0 and charges £7.50 to open a box (box price), the game is also set to END <u>automatically</u> at <span style={{color: "red"}}>£47.50</span>.<br/> If 3 of the EMPTY boxes are opened, the game ends and the Host receives <span style={{color:"#02c526"}}>[£47.50 * 0.95]</span>. If 2 EMPTY boxes are opened and the 3rd box that's opened is the Prize box (£25), they'll receive <span style={{color:"#02c526"}}>[£25 * 0.95]</span> after paying £7.50 to play and the Host will receive <span style={{color:"#02c526"}}>[£22.50 * 0.95]</span> upon ENDing the game (since there's no longer a £25 box but there's money in the <u>PR</u> since 3 boxes have been opened).</p>

<h4><b><span>Brain Game</span> Game Mode</b></h4>
<h5>HOST GAME</h5>
<ol>
                        <li>Set a Score for opponent(s) to try and beat by clicking START and answer as many questions as you can in a minute.</li>
                        <li>When a player loses, their bet will be added to your game <u>PR</u>.</li>
                        <li>The aim is to END your game before somebody beats your Score <i>(you can now END games automatically in advanced game settings).</i></li>
                    </ol>
<h5>JOIN GAME</h5>
<ol>
                        <li>Try beat the Host's score before they end their game, all losses will be added to the <u>PR</u>.</li>
                    </ol>
<h5 style={{color: "#02c526"}}>WINNINGS</h5>
<p>e.g. Host creates a game for £25, this will be the cost to JOIN the game too.<br /> If 4 players lose (score lower than the Host), the <u>PR</u> becomes £100. If the Host ENDs their game now, they'll receive <span style={{color:"#02c526"}}>[£125 * 0.95]</span> in winnings (including their original bet amount). However if another player JOINs and beats the Host, they'll receive  <span style={{color:"#02c526"}}>[£150 * 0.95]</span> in winnings (including their bet amount to JOIN that game).</p>


<h4><b><span><i>Spleesh!</i></span> Game Mode</b></h4>
<h5>HOST GAME</h5>
<ol>
                        <li>Pick Your Number: 1-10 or 10-100. This will be the amount you'll bet with.</li>
                        <li>Players must guess your bet, incorrect guesses will be added to the <u>PR</u>.</li>
                        <li><i>Don't</i> END your game until your <u>PR</u> is higher than your initial bet (Your Number), otherwise you'll make a loss! <i>You can now END games automatically in advanced game settings.</i></li>
                    </ol>
<h5>JOIN GAME</h5>
<ol>
    <li>Guess the Host's Number correctly to Win the <u>PR</u>.</li>
</ol>
<h5 style={{color: "#02c526"}}>WINNINGS</h5>
<p>e.g. Host creates a game and picks £7, the game is also set to END <u>automatically</u> at <span style={{color: "red"}}>£30</span>.<br /> If players JOIN and make the following guesses in total: £1, £2, £3, £4, £5, £9, £10 the game ENDs and the Host receives <span style={{color:"#02c526"}}>[£34]</span>. If instead of £10, a player guesses the correct number (£7), then they'd receive <span style={{color:"#02c526"}}>[£38 * 0.9]</span> this includes both the Host's bet amount and their own.</p>


<h4><b><span>Classic RPS</span> Game Mode</b></h4>
<p>Rock BEATS Scissors, Paper BEATS Rock, Scissors BEATS Paper - it's as simple as that.</p>
<h5 style={{color: "#02c526"}}>WINNINGS</h5>

<p>e.g. Host creates a game and with a bet amount of £25. If a player JOINs and loses, the Host receives <span style={{color:"#02c526"}}>[£50 * 0.95]</span>.</p>
<br />
<p>Check your <a data-toggle="modal" data-dismiss="modal" data-target="#editModal" href="" style={{color: "#B5862D"}}><b>Balance</b></a> at the end of each game.<br /> We introduce Fees to cover transactional costs from the payment provider and development costs for the website:</p>
<table>
 <tbody><tr>
                        <th>Game Modes</th>
                        <th>Winnings Fees</th>
                        <th>Withdrawal Fees</th>
                      </tr>
                      <tr>
                        <td className="gamemode">Mystery Box</td>
                        <td>
                          <ul>
                          <li>5% when <span style={{color: "#C83228"}}>Host</span> ENDs game.</li>
                          <li>5% when <span style={{color: "#C83228"}}>Player</span> JOINs game and wins a <span style={{color: "#02c526"}}>Prize.</span></li>
                        </ul>
                        </td>
                        <td rowspan="5">
                          <u>NO withdrawal Fees.</u>
                        </td>
                      </tr>
                      <tr>
                      </tr><tr>
                        <td className="gamemode">Brain Game</td>
                        <td><ul>
                          <li>10% from <span style={{color:"#02c526"}}>Winnings.</span></li>
                        </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className="gamemode"><i>Spleesh!</i></td>
                        <td><ul>
                          <li><u>NO Fees</u> when <span style={{color: "#C83228"}}>Host</span> ENDs game</li>
                          <li>10% when <span style={{color: "#C83228"}}>Player</span> JOINs game and guesses <span style={{color: "#02c526"}}>Number.</span></li>
                        </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className="gamemode">RPS</td>
                        <td>5% from <span style={{color: "#02c526"}}>Winnings.</span></td>
                      </tr>
                    </tbody></table>

<h5>For All Enquiries</h5>
<p>For any technical/general problems, please contact <u style={{color: "#f5b22d"}}>online@rpsbet.com</u>. We thank you for playing!</p>
</div>
            <DepositModal modalIsOpen={this.state.showDepositModal} closeModal={this.handleCloseDepositModal} playerName={this.props.player_name} />
        </Modal>;
    }
}

export default HowToPlayModal;
