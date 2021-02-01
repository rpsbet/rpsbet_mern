import React, { Component } from 'react';
import Modal from 'react-modal';
import PrivacyModal from './PrivacyModal';
import TermsModal from './TermsModal';

Modal.setAppElement('#root')

const customStyles = {
	overlay: {
		zIndex: 3,
		backgroundColor: 'rgba(47, 49, 54, 0.8)'
	},
	content: {
		top         : '50%',
		left        : '50%',
		right       : 'auto',
		bottom      : 'auto',
		transform   : 'translate(-50%, -50%)',
		background: 'transparent',
		padding: 0,
		border: 0
	}
}

class HowToPlayModal extends Component {
	render() {
		return <Modal
			isOpen={this.props.modalIsOpen}
			onRequestClose={this.props.closeModal}
			style={customStyles}
			contentLabel="How To Play Modal"
		>
			<div className={this.props.isDarkMode ? 'dark_mode' : ''}>
				<div className="modal-body edit-modal-body how-to-play-modal-body">
					<h2 className="modal-title">How To Play <span style={{color: "#d81719"}}>RPS</span> <span style={{color: "#ebddca"}}>Bet</span></h2>
					<button className="btn-close" onClick={this.props.closeModal}>×</button>
				
					<div className="modal-content-wrapper quick-shoot">
						<h4>Quick Shoot - Game Mode</h4>
						<div className="modal-content-panel">
							<h5>HOST GAME</h5>
							<ol>
								<li>Set the Game Type (Returns Multiplier e.g. 2x, 3x etc.)</li>
								<li>Set your Bet Amount</li>
								<li>Choose Where to Save</li>
							</ol>
						</div>
						<div className="modal-content-panel">
							<h5>JOIN GAME</h5>
							<ol>
								<li>Choose Where to Shoot</li>
							</ol>
						</div>
						<div className="modal-content-panel">
							<h5 style={{color: "#02c526"}}>WINNINGS</h5>
							<p>e.g.</p>
							<p>Your Bet Amount = <span style={{color: "#b52c22"}}>£50</span></p>
							<p>Game Type = <span style={{color: "#f6b22a"}}><u>5 (5x)</u></span></p>
							<p>Public Bet Amount = <span style={{color:"#b52c22"}}>£200 [£50 * 0.95]</span></p>
							<p>Winnings = <span style={{color:"#02c526"}}>£237.50 [£250 * 0.95]</span></p>
						</div>
					</div>

					<div className="modal-content-wrapper brain-game">
						<h4>Brain Game - Game Mode</h4>
						<div className="modal-content-panel">
							<h5>HOST GAME</h5>
							<ol>
								<li>Set a global Bet Amount</li>
								<li>Set Payout for an Automatic cash out (optional)</li>
								<li>Set a score for players to try beat</li>
							</ol>
						</div>
						<div className="modal-content-panel">
							<h5>JOIN GAME</h5>
							<ol>
								<li>Try to Win</li>
							</ol>
						</div>
						<div className="modal-content-panel">
							<h5 style={{color: "#02c526"}}>WINNINGS</h5>
							<p>e.g.</p>
							<p>Bet Amount = <span style={{color:"#b52c22"}}>£5</span></p>
							<p>Payout = <span style={{color: "#f6b22a"}}>Automatic(£30)</span></p>
							<p>Winnings = <span style={{color:"#02c526"}}>£27 [£30 * 0.9]</span></p>
						</div>
					</div>

					<div className="modal-content-wrapper mystery-box">
						<h4>Mystery Box - Game Mode</h4>
						<div className="modal-content-panel">
							<h5>HOST GAME</h5>
							<ol>
								<li>Add boxes by setting the <u>Prize</u> (or Empty) and <u>Price</u> <i>to open. Check the Order of the boxes as the boxes will <u>NOT</u> be randomized.</i></li>
								<li>Set Payout for an Automatic cash out (optional)</li>
							</ol>
						</div>
						<div className="modal-content-panel">
							<h5>JOIN GAME</h5>
							<ol>
								<li>Open a box and hope to win a Prize</li>
							</ol>
						</div>
						<div className="modal-content-panel">
							<h5 style={{color: "#02c526"}}>WINNINGS</h5>
							<p>e.g.</p>
							<p>The following boxes are set (Prize/Price): <span style={{color:"#b52c22"}}>£25/£4, £0/£6, £0/£10</span></p>
							<p>Payout = <span style={{color: "#f6b22a"}}>Automatic(£41) [£25 + £6 + £10]</span></p>
							<p>Host Winnings = <span style={{color:"#02c526"}}>£38.95 [£41 * 0.95]</span></p>
							<p><i>If the £25 Prize box is opened, the host still receives the £4 (Price).</i></p>
						</div>
					</div>

					<div className="modal-content-wrapper spleesh">
						<h4><i>Spleesh!</i> - Game Mode</h4>
						<div className="modal-content-panel">
							<h5>HOST GAME</h5>
							<ol>
								<li>Pick Your Number (Your Bet Amount): 1-10 or 10-100</li>
								<li>Set Payout for an Automatic cash out (optional)</li>
							</ol>
						</div>
						<div className="modal-content-panel">
							<h5>JOIN GAME</h5>
							<ol>
								<li>Guess the Host's Number</li>
							</ol>
						</div>
						<div className="modal-content-panel">
							<h5 style={{color: "#02c526"}}>WINNINGS</h5>
							<p>e.g.</p>
							<p>Host's Number (Bet Amount) = <span style={{color: "#b52c22"}}>£7</span></p>
							<p>Payout = <span style={{color: "#f6b22a"}}>Automatic(£30)</span></p>
							<p>Guesses (in order):  1, 2,10,9,5,8- <i>*Game ENDs automatically*</i></p>
							<p>Host Winnings = <span style={{color:"#02c526"}}>£37.80 [£42 * 0.9]</span></p>
						</div>
					</div>

					<div className="modal-content-wrapper classic-rps">
						<h4>Classic RPS - Game Mode</h4>
						<div className="modal-content-panel">
							<p>Rock BEATS Scissors, Paper BEATS Rock, Scissors BEATS Paper!</p>
							<h5 style={{color: "#02c526"}}>WINNINGS</h5>

							<p>e.g.</p>
							<p>Bet Amount = <span style={{color: "#b52c22"}}>£50</span></p>
							<p>Winnings = <span style={{color:"#02c526"}}>£95 [£100 * 0.95]</span></p>
						</div>
					</div>

					<hr />
					<h5>Winnings Tax</h5>
					<p>We introduced <u>Winnings Tax</u> to cover transactional costs from the payment provider and development costs for the website, we hope to lower these as soon as we can!!!</p>
					<table id="howto-modal">
						<tbody>
							<tr><th>Game Modes</th><th>Winnings Tax</th><th>Withdrawal Fees</th></tr>
							<tr><td className="gamemode">Quick Shoot</td><td>5%</td><td rowSpan="6"><u>NO withdrawal Fees.</u></td></tr>
							<tr><td className="gamemode">Mystery Box</td><td>5%</td></tr>
							<tr><td className="gamemode">Brain Game</td><td>10%</td></tr>
							<tr><td className="gamemode"><i>Spleesh!</i></td><td>10%</td></tr>
							<tr><td className="gamemode">RPS</td><td>5%</td></tr>
						</tbody>
					</table>
					<hr />
					<h5>For All Enquiries</h5>
					<p>For any technical/general problems, please contact <u style={{color: "#f5b22d"}}>online@rpsbet.com</u>. We love feedback and we thank you!</p><br /><span style={{color: "#b52c22"}}>&#9679;</span><span style={{color: "#b52c22"}}>&#9679;</span><span style={{color: "#b52c22"}}>&#9679;</span>&#9679;&#9679;&#9679;<span style={{color: "#b52c22"}}>&#9679;</span><span style={{color: "#b52c22"}}>&#9679;</span><span style={{color: "#b52c22"}}>&#9679;</span>
					<p>To learn more about RPSBet and its values, follow our official accounts below and keep up with updates:</p>
					<div style={{textAlign:"center"}}>
					<a href="https://www.instagram.com/rps.bet/">INSTAGRAM</a>&nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp;<a href="https://twitter.com/rpsbet">TWITTER</a>&nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp;<a href="https://www.youtube.com/channel/UCX_VqwBdQsgXyffI1_JmgWg">YOUTUBE</a>&nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp;<a href="https://www.reddit.com/user/RPSBet">REDDIT</a>&nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp;<a href="https://www.facebook.com/rpsbet">FACEBOOK</a>&nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp;<a href="https://rpsbet.itch.io/">ITCH</a>
					<br />
					</div>
					<div className="game_footer text-center">
					<span>All Rights Reserved, </span>RPSBet © 2021 <a href="#privacy" id="privacy" onClick={this.props.openPrivacyModal}>Privacy</a> | <a href="#terms" id="terms" onClick={this.props.openTermsModal}>Terms</a>
				</div>
				</div>
			</div>

		</Modal>;
	}
}

export default HowToPlayModal;
