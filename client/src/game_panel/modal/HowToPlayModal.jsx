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
            <h2 className="modal-title">Info</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body how-to-play-modal-body">
            <Accordion>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper provably-fair">
                      <h4>About Us</h4>
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
                      <h5 style={{ color: '#02c526' }}>Using AI for Autoplay (vs. an RNG)</h5>

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

              {/*    <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper pot">
                      <h4>Pot (coming soon!)</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper blackjack">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
                      <p>To cashout the multiplier before the 'Roll'</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>Enter in a predetermined Bet Amount. Optionally, alter the predetermined Autocashout Amount as the counter can increment quickly</li>
                        <li>Click 'Bang Out' when you are happy and wait for the next round</li>
                        <li>Once you see the bomb, the round will have started and you have to cashout before the 'BANG!' by re-clicking same button which should now say 'Cashout @ $x.xx'</li>
                        <li>If you successfully manage to cashout in time, your winnings is equal to your Bet Amount multiplied by your final multiplier</li>

                      </ol>
                    </div>
                    
                  </div>
                </AccordionItemPanel> 
              </AccordionItem>
              
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper clips">
                      <h4>Clips (coming soon!)</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper blackjack">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
                      <p>To cashout the multiplier before the 'Roll'</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>Enter in a predetermined Bet Amount. Optionally, alter the predetermined Autocashout Amount as the counter can increment quickly</li>
                        <li>Click 'Bang Out' when you are happy and wait for the next round</li>
                        <li>Once you see the bomb, the round will have started and you have to cashout before the 'BANG!' by re-clicking same button which should now say 'Cashout @ $x.xx'</li>
                        <li>If you successfully manage to cashout in time, your winnings is equal to your Bet Amount multiplied by your final multiplier</li>

                      </ol>
                    </div>
                    
                  </div>
                </AccordionItemPanel> 
              </AccordionItem>
              
               <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper craps">
                      <h4>Craps (coming soon!)</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper blackjack">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
                      <p>To cashout the multiplier before the 'Roll'</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>Enter in a predetermined Bet Amount. Optionally, alter the predetermined Autocashout Amount as the counter can increment quickly</li>
                        <li>Click 'Bang Out' when you are happy and wait for the next round</li>
                        <li>Once you see the bomb, the round will have started and you have to cashout before the 'BANG!' by re-clicking same button which should now say 'Cashout @ $x.xx'</li>
                        <li>If you successfully manage to cashout in time, your winnings is equal to your Bet Amount multiplied by your final multiplier</li>

                      </ol>
                    </div>
                    
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
               */}
              <AccordionItem>
  <AccordionItemHeading>
    <AccordionItemButton>
      <div className="modal-content-wrapper blackjack">
        <h4>Blackjack</h4>
      </div>
    </AccordionItemButton>
  </AccordionItemHeading>
  <AccordionItemPanel>
    <div className="modal-content-wrapper blackjack">
      <div className="modal-content-panel">
        <h5>Objective</h5>
        <p>To achieve a hand total closer to 21 than the dealer's hand without exceeding 21.</p>
      </div>
      <div className="modal-content-panel">
        <h5>Gameplay</h5>
        <ol>
          <li>Place a bet amount at the beginning of each round.</li>
          <li>Receive two cards face up. The dealer also gets two cards, but one face down and one face up.</li>
          <li>Decide whether to "hit" (receive another card) or "stand" (keep the current hand).</li>
          <li>Try to get as close to 21 as possible without going over.</li>
          <li>If your hand total exceeds 21, you bust and lose the round.</li>
          <li>If you choose to stand, the dealer reveals their face-down card.</li>
          <li>The dealer must hit until their hand total is 17 or higher.</li>
          <li>If the dealer busts or your hand total is higher than the dealer's without busting, you win.</li>
          <li>If the dealer's hand total is higher than yours without busting, you lose.</li>
          <li>If both you and the dealer have the same hand total, it's a push (tie), and you keep your bet.</li>
        </ol>
      </div>
    </div>
  </AccordionItemPanel>
</AccordionItem>

              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper roll">
                      <h4>Roll</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper bang">
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Objective</h5>
                      <p>To match the pictures (unless 'Rock', 'Paper', 'Scissors').</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>Enter in a predetermined Bet Amount</li>
                        <li>Click one of the pictures when you are happy and wait for the next roll</li>
                        <li>Once you see the rolling images, the game will have started and you have to wait till it stops and hope for a match. Or if you chose 'Rock', 'Paper' or 'Scissors' then you can 4x on an opposing face (see 'RPS')</li>

                      </ol>
                    </div>

                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper bang">
                      <h4>Bang!</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper bang">
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Objective</h5>
                      <p>To cashout the multiplier before the 'Bang!'</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>Enter in a predetermined Bet Amount. Optionally, alter the predetermined Autocashout Amount as the counter can increment quickly</li>
                        <li>Click 'Bang Out' when you are happy and wait for the next round</li>
                        <li>Once you see the bomb, the round will have started and you have to cashout before the 'BANG!' by re-clicking same button which should now say 'Cashout @ $x.xx'</li>
                        <li>If you successfully manage to cashout in time, your winnings is equal to your Bet Amount multiplied by your final multiplier</li>

                      </ol>
                    </div>

                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper drop-game">
                      <h4>Drop Game</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper drop-game">
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Objective</h5>
                      <p>To drop (bet) a higher value than your opponent.</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>
                          Enter a Bet Amount to drop against the AI
                        </li>
                        <li>
                          If your Bet Amount is higher than the AI's, you win both Bet Amount's, but if it's lower, the AI takes both Amounts.
                        </li>
                      </ol>
                    </div>

                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper quick-shoot">
                      <h4>Quick Shoot</h4>
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
                    <div className="modal-content-wrapper brain-game">
                      <h4>Brain Game</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper brain-game">
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Objective</h5>
                      <p>To score higher in the quiz.</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>
                          Before starting the quiz, beware of the 60 second time limit to answer as many questions as possible, as well as the category of questions that will be asked.
                        </li>
                        <li>
                          During the quiz, choose the correct answer out of the 4 answers. A correct answers adds 1 point whilst an incorrect answer deducts 1 point.
                        </li>
                        <li>
                          If you score higher than the AI, you will win 2x your Bet Amount
                        </li>
                      </ol>
                    </div>

                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper mystery-box">
                      <h4>Mystery Box</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper quick-shoot">
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Objective</h5>
                      <p>To correctly open profitable boxes.</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>
                          Each box has a Price to pay to open the box but can either be Empty or contain a Prize (Prices may not determine the Prize amount!)
                        </li>
                        <li>
                          The host can set the game up to account for multiple guesses or a single guess before the algorithm re-shuffles the boxes.
                        </li>
                      </ol>
                    </div>

                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper spleesh">
                      <h4>
                        <i>Spleesh!</i>
                      </h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Objective</h5>
                      <p>To correctly guess the number within 3-9 guesses.</p>
                    </div>
                    <div className="modal-content-panel">
                      <h5>Gameplay</h5>
                      <ol>
                        <li>
                          Pick a number from the panel, your choice of number determines your Bet Amount
                        </li>
                        <li>
                          If you guess incorrectly, your Bet Amount is added to a pot which can be won when you guess correctly and includes the number to be guessed.
                        </li>
                        <li>
                          You lose when the pot reaches a limit set by the Host at which point is won by the Host and a new number is selected, effectively starting a new round.
                        </li>
                      </ol>
                    </div>

                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper rps">
                      <h4>RPS</h4>
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
                      <h4>FEES</h4>
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
                            <th>HOSTS</th>
                            <th>JOINERS</th>
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
                            <th>PLATFORM</th>
                            <th>DP / WD</th>
                          </tr>
                          <tr>
                            <td className="gamemode">-0.5%</td>
                            <td rowSpan="6">
                              <u><a href="https://etherscan.io/gastracker">SEE GAS TRACKER</a></u>
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
                      <h4>SUPPORT</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <p>You can simply use the Live Chat panel (find button in the bottom right), or you can reach out to us via one of these:</p>
                      <Button><a href="https://twitter.com/officialrpsgame">Twitter</a></Button>
                      <Button><a href="https://t.me/rps_finance">Telegram</a></Button>
                      <Button><a href="https://discord.gg/anMJntW4AD">Discord</a></Button>
                      {/* <Button><a href="mailto:lenny@rps.finance">Email</a></Button> */}
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
