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
        backgroundColor: '#333',
        color       : '#fff'
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
            <h2 style={{color: "#fff", paddingBottom: "0"}}>How To Play <span style={{color: "#c33626"}}>RPS</span> <span style={{color: "#ebddca"}}>Bet</span></h2>
            <button style={{color: "#fff", borderColor: "#fff"}} className="btn_modal_close" onClick={this.props.closeModal}>×</button>
            </div>

<div className="modal-body">
<div className="modal-img-header"> <h4><b><span>Quick shoot</span><img width="60px" src={'/img/gametype/QS.png'} alt='' /> Game Mode</b></h4>
</div>

<h5>HOST GAME</h5>
<ol>
                        <li>Set the Game Type (Returns Multiplier e.g. 2x, 3x etc.)</li>
                        <li>Set your Bet Amount</li>
                        <li>Choose Where to Save when a player Shoots</li>
                    </ol>
<h5>JOIN GAME</h5>
<ol>
                        <li>Choose Where to Shoot</li>
                    </ol>
<h5 style={{color: "#02c526"}}>WINNINGS</h5>
<p>e.g.<br />Your Bet Amount = <span style={{color: "#f6b22a"}}>£50</span><br/>Game Type = <u>5 (5x)</u><br />Public Bet Amount = <span style={{color:"#b52c22"}}>£200 [£50 * 0.95]</span><br />Winnings = <span style={{color:"#02c526"}}>£237.50 [£250 * 0.95]</span></p>

<div className="modal-img-header"> <h4><b><span>Brain Game</span><img width="60px" src={'/img/gametype/BG.png'} alt='' /> Game Mode</b></h4>
</div>
<h5>HOST GAME</h5>
<ol>
                        <li>Set a global Bet Amount</li>
                        <li>Set Payout to Automatic to cash out at some point. (optional)</li>
                        <li>Set a score for players to try beat</li>
                    </ol>
<h5>JOIN GAME</h5>
<ol>
                        <li>Try beat the Host's score</li>
                    </ol>
<h5 style={{color: "#02c526"}}>WINNINGS</h5>
<p>e.g.<br />Bet Amount = <span style={{color:"#02c526"}}>£5</span><br />Payout = Automatic(£30)<br />Winnings = <span style={{color:"#02c526"}}>£27 [£30 * 0.9]</span></p>

<div className="modal-img-header"> <h4><b><span>Mystery Box</span><img width="60px" src={'/img/gametype/MB.png'} alt='' /> Game Mode</b></h4>
</div>
<h5>HOST GAME</h5>
<ol>
                        <li>Add boxes by setting the <u>Prize</u> (or Empty) and <u>Price</u> <i>to open. Check the Order of the boxes as the boxes will <u>NOT</u> be randomized.</i></li>
                        <li>Set Payout to Automatic to cash out at some point. (optional)</li>
                    </ol>
<h5>JOIN GAME</h5>
<ol>
                        <li>Open a box and hope to win a Prize</li>
                    </ol>
<h5 style={{color: "#02c526"}}>WINNINGS</h5>
<p>e.g.<br />The following boxes are set (Prize/Price): £25/£4, £0/£6, £0/£10<br />Payout = Automatic(£41) [£25 + £6 + £10]<br />Host Winnings = <span style={{color:"#02c526"}}>£38.95 [£41 * 0.95]</span><br /><i>If the £25 Prize box is opened, the host still receives the £4 (Price).</i></p>

<div className="modal-img-header"> <h4><b><span><i>Spleesh!</i></span><img width="60px" src={'/img/gametype/S!.png'} alt='' /> Game Mode</b></h4>
</div>
<h5>HOST GAME</h5>
<ol>
                        <li>Pick Your Number (Your Bet Amount): 1-10 or 10-100</li>
                        <li>Set Payout to Automatic to cash out at some point. (optional)</li>
                    </ol>
<h5>JOIN GAME</h5>
<ol>
    <li>Guess the Host's Number</li>
</ol>
<h5 style={{color: "#02c526"}}>WINNINGS</h5>
<p>e.g.<br />Host's Number (Bet Amount) = <span style={{color: "red"}}>£7</span><br />Payout = Automatic(£30)<br />Guesses (in order): <u> 1, 2,10,9,5,8- <i>Game ENDs automatically</i><br />Host Winnings = <span style={{color:"#02c526"}}>£37.80 [£42 * 0.9]</span></u></p>


<div className="modal-img-header"> <h4><b><span>Classic RPS</span><img width="60px" src={'/img/gametype/RPS.png'} alt='' /> Game Mode</b></h4>
</div>
<p>Rock BEATS Scissors, Paper BEATS Rock, Scissors BEATS Paper!</p>
<h5 style={{color: "#02c526"}}>WINNINGS</h5>

<p>e.g.<br />Bet Amount = <span style={{color: "#f6b22a"}}>£50</span><br/>Winnings = <span style={{color:"#02c526"}}>£95 [£100 * 0.95]</span></p>
<hr />
<p>We introduce Winnings Tax to cover transactional costs from the payment provider and development costs for the website, we hope to lower these as soon as we can!</p>
<table>
 <tbody><tr>
                        <th>Game Modes</th>
                        <th>Winnings Tax</th>
                        <th>Withdrawal Fees</th>
                      </tr>
                      <tr>
                        <td className="gamemode">Quick Shoot</td>
                        <td>5%
                        </td>
                        <td rowspan="6">
                          <u>NO withdrawal Fees.</u>
                        </td>
                      </tr>
                      <tr>
                        <td className="gamemode">Mystery Box</td>
                        <td>5%
                        </td>
                      </tr>
                      <tr>
                      </tr><tr>
                        <td className="gamemode">Brain Game</td>
                        <td>10%
                        </td>
                      </tr>
                      <tr>
                        <td className="gamemode"><i>Spleesh!</i></td>
                        <td>10%
                        </td>
                      </tr>
                      <tr>
                        <td className="gamemode">RPS</td>
                        <td>5%</td>
                      </tr>
                    </tbody></table>
<p class="scroll-txt">Scroll ⇨</p>
<h5>For All Enquiries</h5>
<p>For any technical/general problems, please contact <u style={{color: "#f5b22d"}}>online@rpsbet.com</u> OR send us a message to our <a href="https://www.facebook.com/rpsbet/">Facebook Page</a>. We love feedback and we thank you for playing!</p>
</div>
            <DepositModal modalIsOpen={this.state.showDepositModal} closeModal={this.handleCloseDepositModal} playerName={this.props.player_name} />
        </Modal>;
    }
}

export default HowToPlayModal;
