import React, { Component } from 'react';
import Modal from 'react-modal';
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel
} from 'react-accessible-accordion';
import { convertToCurrency } from '../../util/conversion';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(47, 49, 54, 0.8)',
    backdropFilter: 'blur(4px)'
  },
  
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0,
    border: 0
  }
};

class HowToPlayModal extends Component {
  render() {
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="How To Play Modal"
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body edit-modal-body how-to-play-modal-body">
            <h2 className="modal-title">Help</h2>

            <button className="btn-close" onClick={this.props.closeModal}>
              ×
            </button>
            {/* <div className="release-updates">
  <h2 className="section-title">Latest Features</h2>
  <ul className="feature-list">
    <li>
      <h3 className="feature-title">Drop Game</h3>
      <p className="feature-description">Compete for the highest value and win big with our new drop game feature.</p>
    </li> 
    <li>
      <h3 className="feature-title">AI Play</h3>
      <p className="feature-description">Enjoy non-stop gaming with our AI Play feature. Joiners can now play autonomously and the games run indefinitely.</p>
    </li>
    <li>
      <h3 className="feature-title">Payouts</h3>
      <p className="feature-description">Hosts can now receive regular payouts for their games with our new payout system.</p>
    </li>
    <li>
      <h3 className="feature-title">Bankrolls</h3>
      <p className="feature-description">Manage your winnings with ease using our new 'Pot / Pool' system for bankrolls.</p>
    </li>
    <li>
      <h3 className="feature-title">Brain Game</h3>
      <p className="feature-description">Challenge your mind and create your own quizzes with our new Brain Game feature.</p>
    </li>
    <li>
      <h3 className="feature-title">Player Profiles</h3>
      <p className="feature-description">Show off your gaming skills with our new player profiles, which display your stats for all to see.</p>
    </li>
    <li>
      <h3 className="feature-title">Light Mode</h3>
      <p className="feature-description">Experience gaming in a whole new light with our new Light Mode feature.</p>
    </li>
  </ul>
</div> */}
            <Accordion>
            <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper drop-game">
                      <h4>Drop Game - Coming Soon!</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  {/* <div className="modal-content-wrapper quick-shoot">
                    <div className="modal-content-panel">
                      <h5>CREATE</h5>
                      <ol>
                        <li>
                          Set the Game Type (Returns Multiplier e.g. 2x, 3x
                          etc.)
                        </li>
                        <li>Set Your Bet Amount</li>
                        <li>Choose Where to Save</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5>PLAY</h5>
                      <ol>
                        <li>Choose Where to Shoot</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>WINNINGS</h5>
                      <p>e.g.</p>
                      <p>
                        Your Bet Amount ={' '}
                        <span style={{ color: '#b52c22' }}>
                          {convertToCurrency(5)}
                        </span>
                      </p>
                      <p>
                        Game Type ={' '}
                        <span style={{ color: '#f6b22a' }}>
                          <u>5 (5x)</u>
                        </span>
                      </p>
                      <p>
                        Public Bet Amount ={' '}
                        <span style={{ color: '#b52c22' }}>
                          {`${convertToCurrency(20)} [${convertToCurrency(
                            5
                          )} * 4]`}
                        </span>
                      </p>
                      <p>
                        Winnings ={' '}
                        <span style={{ color: '#02c526' }}>
                          {convertToCurrency(25)}
                        </span>
                      </p>
                    </div>
                  </div> */}
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper quick-shoot">
                      <h4>Quick Shoot - Tutorial</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper quick-shoot">
                    <div className="modal-content-panel">
                      <h5>CREATE</h5>
                      <ol>
                        <li>
                          Set the Game Type (Returns Multiplier e.g. 2x, 3x
                          etc.)
                        </li>
                        <li>Set Your Bet Amount</li>
                        <li>Choose Where to Save</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5>PLAY</h5>
                      <ol>
                        <li>Choose Where to Shoot</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>WINNINGS</h5>
                      <p>e.g.</p>
                      <p>
                        Your Bet Amount ={' '}
                        <span style={{ color: '#b52c22' }}>
                          {convertToCurrency(5)}
                        </span>
                      </p>
                      <p>
                        Game Type ={' '}
                        <span style={{ color: '#f6b22a' }}>
                          <u>5 (5x)</u>
                        </span>
                      </p>
                      <p>
                        Public Bet Amount ={' '}
                        <span style={{ color: '#b52c22' }}>
                          {convertToCurrency(20)} [{convertToCurrency(
                            5
                          )} * 4]
                        </span>
                      </p>
                      <p>
                        Winnings ={' '}
                        <span style={{ color: '#02c526' }}>
                          {convertToCurrency(25)}
                        </span>
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper brain-game">
                      <h4>Brain Game - Tutorial</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper brain-game">
                    <div className="modal-content-panel">
                      <h5>CREATE</h5>
                      <ol>
                        <li>Set a global Bet Amount</li>
                        <li>Set Payout for an Automatic cash out (optional)</li>
                        <li>Set a score for players to try beat</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5>PLAY</h5>
                      <ol>
                        <li>Try to Win</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>WINNINGS</h5>
                      <p>e.g.</p>
                      <p>
                        Bet Amount ={' '}
                        <span style={{ color: '#b52c22' }}>
                          {convertToCurrency(5)}
                        </span>
                      </p>
                      <p>
                        Payout ={' '}
                        <span style={{ color: '#f6b22a' }}>
                          Automatic({convertToCurrency(30)})
                        </span>
                      </p>
                      <p>
                        Winnings ={' '}
                        <span style={{ color: '#02c526' }}>
                          {convertToCurrency(30)}
                        </span>
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper mystery-box">
                      <h4>Mystery Box - Tutorial</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper quick-shoot">
                    <div className="modal-content-panel">
                      <h5>CREATE</h5>
                      <ol>
                        <li>
                          Add boxes by setting the <u>Prize</u> (or Empty) and{' '}
                          <u>Price</u>{' '}
                          <i>
                            to open. Check the Order of the boxes as the boxes
                            will <u>NOT</u> be randomized.
                          </i>
                        </li>
                        <li>Set Payout for an Automatic cash out (optional)</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5>PLAY</h5>
                      <ol>
                        <li>Open a box and hope to win a Prize</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>WINNINGS</h5>
                      <p>e.g.</p>
                      <p>
                        The following boxes are set (Prize/Price):{' '}
                        <span style={{ color: '#b52c22' }}>
                          {convertToCurrency(25)}/{convertToCurrency(
                            4
                          )}, {convertToCurrency(0)}/{convertToCurrency(
                            6
                          )}, {convertToCurrency(0)}/{convertToCurrency(
                            10
                          )}
                        </span>
                      </p>
                      <p>
                        Payout ={' '}
                        <span style={{ color: '#f6b22a' }}>
                          Automatic({convertToCurrency(
                            41
                          )}) [{convertToCurrency(
                            25
                          )} + {convertToCurrency(
                            6
                          )} + {convertToCurrency(10)}]
                        </span>
                      </p>
                      <p>
                        Host Winnings ={' '}
                        <span style={{ color: '#02c526' }}>
                          {convertToCurrency(41)}
                        </span>
                      </p>
                      <p>
                        <i>
                          If the {convertToCurrency(
                            25
                          )} Prize box is opened, the host still
                          receives the {convertToCurrency(4)} (Price).
                        </i>
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper spleesh">
                      <h4>
                        <i>Spleesh!</i> - Tutorial
                      </h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <h5>CREATE</h5>
                      <ol>
                        <li>
                          Pick Your Number (Your Bet Amount): {convertToCurrency(1)}-{convertToCurrency(10)} or
                          {convertToCurrency(10)}-{convertToCurrency(100)}
                        </li>
                        <li>Set Payout for an Automatic cash out (optional)</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5>PLAY</h5>
                      <ol>
                        <li>Guess the Host's Number</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>WINNINGS</h5>
                      <p>e.g.</p>
                      <p>
                        Host's Number (Bet Amount) ={' '}
                        <span style={{ color: '#b52c22' }}>
                          {convertToCurrency(70)}
                        </span>
                      </p>
                      <p>
                        Payout ={' '}
                        <span style={{ color: '#f6b22a' }}>
                          Automatic({convertToCurrency(30)})
                        </span>
                      </p>
                      <p>
                        Guesses (in order): {convertToCurrency(
                          10
                        )}, {convertToCurrency(20)}, {convertToCurrency(
                          100
                        )}, {convertToCurrency(90)},
                        {convertToCurrency(50)}, {convertToCurrency(
                          80
                        )}- <i>*Game ENDs automatically*</i>
                      </p>
                      <p>
                        Host Winnings ={' '}
                        <span style={{ color: '#02c526' }}>
                          {convertToCurrency(42)}
                        </span>
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper rps">
                      <h4>RPS - Tutorial</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper rps">
                    <div className="modal-content-panel">
                      <h5>CREATE</h5>
                      <ol>
                        <li>
                          Set the Game Type (Freeplay to allow players to bet
                          freely; Fixed to have set bets).
                        </li>
                        <li>
                          (skip this step if Game Type is Fixed) Set the
                          Bankroll.
                        </li>
                        <li>Set the runs.</li>
                      </ol>
                    </div>
                    <div className="modal-content-panel">
                      <h5>PLAY</h5>
                      <ol>
                        <li>
                          Rock BEATS Scissors, Paper BEATS Rock and Scissors
                          BEATS Paper!
                        </li>
                      </ol>
                      <h5 style={{ color: '#02c526' }}>WINNINGS</h5>

                      <p>e.g.</p>
                      <p>Game Type = Freeplay</p>
                      <p>
                        Bet Amount ={' '}
                        <span style={{ color: '#b52c22' }}>
                          {convertToCurrency(50)}
                        </span>
                      </p>
                      <p>
                        Winnings ={' '}
                        <span style={{ color: '#02c526' }}>
                          {convertToCurrency(100)}
                        </span>
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper provably-fair">
                      <h4>Games of Skill - Provably Fair</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <p>
                        All our games are 100% Player vs. Player(s) and there
                        are zero random factors affecting the outcome of games,
                        players have complete control. Skilled players can
                        improve over time. If you want to read more, you can go
                        through{' '}
                        <a href="https://bitcointalk.org/index.php?topic=5194336.0">
                          this forum here
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper house-edge">
                      <h4>Fees - House Edge</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <p>
                        See table below for fees
                        {' '}
                      </p>
                      <table id="howto-modal">
                        <tbody>
                          <tr>
                            <th>DEPOSIT FEES</th>
                            <th>WINNINGS TAX</th>
                            <th>WITHDRAWAL FEES</th>
                          </tr>
                          <tr>
                            <td>
                              <u>$0.07 - $0.30 BNB-CHAIN GAS</u>
                            </td>
                            <td className="gamemode">2%</td>
                            <td rowSpan="6">
                              <u>FREE (WE'LL PAY THIS)</u>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper support">
                      <h4>FAQ - IS THIS SITE A SCAM?</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <p>
                        No.{' '} 
                        As there is no randomness, we don't need <a href='https://en.wiktionary.org/wiki/RNG'><u style={{ color: '#f5b22d' }}>RNG's or oracles</u></a>.
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
            </Accordion>
            

            <div id="game_footer_howto">
              <a href="https://twitter.com/rpsbet">TWITTER</a>
              &nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp;
              <a href="https://discord.gg/anMJntW4AD">DISCORD</a>
              &nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp;
              <a href="https://t.me/rpsfinance">TELEGRAM</a>
              &nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp;
              <a href="https://www.youtube.com/channel/UCJRXf1HVpAdBy3Uf6eNGHkA">
                YOUTUBE
              </a>
              &nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp;
              {/* <a href="https://www.instagram.com/rpsbet.io/">INSTAGRAM</a>
              &nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp; */}
              {/* <a href="https://www.tiktok.com/@rpsbet?lang=en">TIKTOK</a> */}
              {/* &nbsp;&nbsp;&nbsp;&#10007;&nbsp;&nbsp;&nbsp;
              <a href="https://rpsbet.itch.io/">ITCH</a> */}
              <br />
            </div>
            <div className="game_footer text-center">
              <span>ALL RIGHTS </span>
              <a
                href="https://rps.finance/"
              >
                RPS.FINANCE
              </a>{' '}© 2023{' '}
              <a
                href="#privacy"
                id="privacy"
                onClick={this.props.openPrivacyModal}
              >
                PRIVACY
              </a>{' '}
              |{' '}
              <a href="#terms" id="terms" onClick={this.props.openTermsModal}>
                TERMS
              </a>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default HowToPlayModal;
