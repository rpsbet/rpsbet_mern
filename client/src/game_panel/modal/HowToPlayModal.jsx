import React, { Component } from 'react';
import Modal from 'react-modal';
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel
} from 'react-accessible-accordion';
import { Button } from '@material-ui/core';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },

  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0,
    border: 'none'
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
          <div className='modal-header'>
            <h2 className="modal-title title">Info</h2>
            <Button className="btn-close title" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body how-to-play-modal-body">
            <Accordion>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper provably-fair">
                      <h4 className='title'>About Us</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Skill-Games Vs. RNGs</h5>
                      <p>
                        RPS.GAME is a skill-based 'casino' meaning the more the learn and stick around, the better chance you have of earning, vs. traditional casinos where the math works in the House's favor over time. House Edge for us is commission-based per bet, and does not affect your odds, whereas in a traditional casino, their business-model is based entirely on you losing. Sound fair to you?
                      </p>
                      <h5 style={{ color: '#02c526' }}>Using AI for AI Play (vs. an RNG)</h5>

                      <div className="tiers">
                        <br />
                        <h5>Markov</h5>
                        <p>Markov the 'mimicker' is a pattern prediction model whilst throwing in a bit of maths to prevent being too predictable. For example, if you feed Markov 'Rock', 'Paper, 'Rock', 'Paper' etc. it will still throw in some 'Scissors' so, yes Markov might be simple but its reliable.</p>
                        <table>
                          <tbody>
                            <tr>
                              <td>Speed</td>
                              <td>
                                <div className="bar" style={{ width: '100%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '100%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '80%' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td>Reasoning</td>
                              <td>
                                <div className="bar" style={{ width: '50%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td>Abilities</td>
                              <td>
                                <div className="bar" style={{ width: '30%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <br />
                        <h5>Carlo (Unlocked at Level 26)</h5>
                        <p>Carlo, named after Monte Carlo's famous casino as well as the Monte Carlo Simulation used for decision making and overall much more advanced than Markov. Carlo can make decisions such as altering your Bet Amount, autonomous game creation / unstaking as well as executing at the perfect times all calibrated from its user's actions.</p>
                        <table>
                          <tbody>
                            <tr>
                              <td>Speed</td>
                              <td>
                                <div className="bar" style={{ width: '10%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td>Reasoning</td>
                              <td>
                                <div className="bar" style={{ width: '100%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '00%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td>Abilities</td>
                              <td>
                                <div className="bar" style={{ width: '100%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '70%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <br />
                        <h5>Q Bot (Unlocked at Level 42)</h5>
                        <p>Q Bot has a personality of its own, in fact it's the only AI that inherits self-learning. That's right, turn it on then just sit back and watch the money come in. Is it smarter than a Human you ask? Maybe... It's only downside is that it's so OP, it might scare other users from playing against it.</p>
                        <table>
                          <tbody>
                            <tr>
                              <td>Speed</td>
                              <td>
                                <div className="bar" style={{ width: '10%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td>Reasoning</td>
                              <td>
                                <div className="bar" style={{ width: '100%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '100%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '70%' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td>Abilities</td>
                              <td>
                                <div className="bar" style={{ width: '80%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <br />
                        <h5>ELMo (Unlocked at Level 60)</h5>
                        <p>ELMo is a language model and cannot be used in most games, on the other side, some games cannot be played without ELMo.</p>
                        <table>
                          <tbody>
                            <tr>
                              <td>Speed</td>
                              <td>
                                <div className="bar" style={{ width: '100%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '10%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td>Reasoning</td>
                              <td>
                                <div className="bar" style={{ width: '100%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '10%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td>Abilities</td>
                              <td>
                                <div className="bar" style={{ width: '50%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '00%' }}></div>
                              </td>
                              <td>
                                <div className="bar" style={{ width: '0%' }}></div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper quick-shoot">
                      <h4 className='title'>Quick Shoot</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper quick-shoot">
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Objective</h5>
                      <p>To score a goal past the keeper.</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>
                          Enter a predetermined Bet Amount.
                        </li>
                        <li>Depending on the game type, you will have 2 - 5 directions to shoot your shot against the AI</li>
                        <li>Depending on the game type, If you can score past the AI keeper, you will win from 1.25x - 2x your original Bet Amount</li>
                      </ol>
                    </div>

                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper rps">
                      <h4 className='title'>RPS</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper rps">
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Objective</h5>
                      <p>To correctly predict the correct 'hand' guesture.</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>
                          Enter a predetermined Bet Amount.
                        </li>
                        <li>
                          Choose "Rock", "Paper" or "Scissors" to play against the AI.
                        </li>
                        <li>
                          The winner is determined by the following rules: rock beats scissors, scissors beats paper, and paper beats rock. The winner receives 2x their Bet Amount. If both players choose the same, the round is a tie and no money or fees are taken.
                        </li>
                      </ol>

                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper house-edge">
                      <h4 className='title'>FEES</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <p>
                        Hosts receive ZERO tax on their winnings AND EARN 0% - 20% from their players' winnings. Depending on their equipped accessory during hosting games.                   {' '}
                      </p>
                      <table id="howto-modal">
                        <tbody>
                          <tr>
                            <th className='title'>HOSTS</th>
                            <th className='title'>JOINERS</th>
                          </tr>
                          <tr>
                            <td style={{ color: "rgb(87, 202, 34)" }}>
                              <u>FREE +(0% - 20%)</u>
                            </td>
                            <td className="gamemode">-(0% - 20%)</td>
                          </tr>
                        </tbody>
                      </table>
                      <br />
                      <table id="howto-modal">
                        <tbody>
                          <tr>
                            <th className='title'>PLATFORM</th>
                            <th className='title'>DP / WD</th>
                          </tr>
                          <tr>
                            <td className="gamemode">-0.5%</td>
                            <td rowSpan="6">
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
                      <h4 className='title'>Get Help?</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <div className="contact-info">
                        <h5>Support</h5>
                        <p>If you need assistance or have any questions, you can reach out to us through the following channels:</p>
                        <div className="contact-buttons">
                          <Button onClick={() => window.open("https://x.com/rpsdotgame", '_blank')}>X</Button>
                          <Button onClick={() => window.open("https://t.me/rpsfinance", '_blank')}>Telegram</Button>
                          {/* <Button onClick={() => window.open("https://discord.gg/anMJntW4AD", '_blank')}>Discord</Button> */}
                          <Button onClick={() => window.open("mailto:inv_inquiries@rps.game")}>Email</Button>
                        </div>
                      </div>
                      <br />
                      <div className="faqs-section">
                        <h5>Frequently Asked Questions</h5>
                        <ul>
                          <li><strong>How do I reset my password?</strong> You can reset your password by clicking the "Forgot Password" link on the login page and following the instructions.</li>
                          <li><strong>Where can I find the latest updates?</strong> For the latest updates, check our Twitter feed or join our Discord channel.</li>
                          <li><strong>What should I do if I encounter a bug?</strong> Please report any bugs via our support channels, including Twitter, Telegram, or Discord.</li>
                          <li><strong>How can I participate in beta testing?</strong> Announcements about beta testing opportunities will be made on our social media channels. Stay tuned!</li>
                          <li><strong>Who can I contact for partnership inquiries?</strong> For partnership inquiries, please email us at lenny@rps.finance.</li>
                        </ul>
                      </div>
                      <br />
                      <div className="tutorials-section">
                        <h5>Tutorials</h5>
                        <p>Looking to get started or need help navigating our platform? Check out our tutorials for step-by-step guides:</p>
                        {/* <Button onClick={() => window.open("https://rps.game/tutorials", '_blank')}>View Tutorials</Button> */}
                        <Button onClick={() => window.open("https://www.youtube.com/watch?v=fJ-Yv3AMdiE", '_blank')}>Video Tutorial</Button>
                      </div>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>

            </Accordion>
          </div>
        </div>
      </Modal>
    );
  }
}

export default HowToPlayModal;
