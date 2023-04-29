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
<div className='modal-header'>
            <h2 className="modal-title">Help</h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
</div>
          <div className="modal-body edit-modal-body how-to-play-modal-body">
            <Accordion>
            <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper roll">
                      <h4>Roll - GAME (Coming Soon)</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  {/* <div className="modal-content-wrapper bang">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
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
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Profit Guarantee?</h5>
                      <p>If you're looking for a quick flip, hold onto the bomb for as long as you can lift your balls - otherwise, if you're looking for a long-term, attractive money-spinner, this is the game for you. Just remember to set up (Host) with more 1's then high numbers whilst still throwing in a few random numbers into the mix too.
                        </p>
                    </div>
                  </div> */}
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper bang">
                      <h4>Bang! - GAME</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper bang">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
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
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Profit Guarantee?</h5>
                      <p>If you're looking for a quick flip, hold onto the bomb for as long as you can lift your balls - otherwise, if you're looking for a long-term, attractive money-spinner, this is the game for you. Just remember to set up (Host) with more 1's then high numbers whilst still throwing in a few random numbers into the mix too.
                        </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
            <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper drop-game">
                      <h4>Drop Game - GAME</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper drop-game">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
                      <p>To drop a higher value</p>
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
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Profit Guarantee?</h5>
                      <p>Well, let's face it, this game is a guaranteed profit if you're rich. But remember, there's always someone richer than you.
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper quick-shoot">
                      <h4>Quick Shoot - GAME</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper quick-shoot">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
                      <p>To score a goal past the keeper</p>
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
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Profit Guarantee?</h5>
                      <p>If you're not hosting, you're playing at random and it's just 1 shot, then yes you're most likely going to win if you have 5 directions you can shoot in. Specifically your odds are 5/4 whereby if you put $4 on you can get expect $5 back. If you're hosting and setting up the game, then it's opposite but overall, as long as you avoid training your AI with predictable patterns then the Profit Guarantee is similar to that of the Rock Paper Scissors game. A zero-sum game.
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper brain-game">
                      <h4>Brain Game - GAME</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper brain-game">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
                      <p>To score higher in the quiz</p>
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
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Profit Guarantee?</h5>
                      <p>A profit is always guaranteed for as long as you know the answers. So when you're setting up, go ahead click the 'create your own' option. But with every profitable game, is it attractive enough to encourage the gamblers? Well, no - gamblers come to earn not learn. But like I said, as long as you know your stuff, you can guarantee profit for those times when you're desperately low and need to rely purely on what you know. Besides, not every Brain Game has to be so mentally intensive, have fun in the creation process.
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper mystery-box">
                      <h4>Mystery Box - GAME</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper quick-shoot">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
                      <p>To correctly open profitable boxes</p>
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
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Profit Guarantee?</h5>
                      <p>If you're setting up a Mystery Box AI, it can take some skill to master. Without a bit of practice, your AI can be very unattractive to play with and worse it can go south quickly. Think of your boxes like the classic <a href="https://en.wikipedia.org/wiki/Shell_game">Shell Game</a> as long as they think they always stand a chance, they will always play, and as long as you set it up right, you will always stand to make a profit. So here's an example of a well balanced game that has a positive EV (Estimated Value): 5 boxes, each costing $10.50 each to open, with one box containing a $50 prize. In this case, as long as your boxes cost more to open than the odds, you can guarantee an edge (a positive EV) and therefore will win money in the long run, if you can survive the short run.
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
                        <i>Spleesh!</i> - GAME
                      </h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
                      <p>To correctly guess the number within 3-9 guesses</p>
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
                    <div className="modal-content-panel">
                      <h5 style={{ color: '#02c526' }}>Profit Guarantee?</h5>
                      <p>If you're hosting, the short answer is yes - one of the very few games that can always guarantee profit, just set your payout as low as possible, bearing in mind a lower payout makes a less attractive game (35 is minimum for gametype 1-10). But does that make it fair for both parties? Yes, like any standard casino game, the House is always at risk in the short-run, but as more players lose, their safety funds become more stable. If you're not hosting, invite the gang - split the risk!
                      </p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper rps">
                      <h4>RPS - GAME</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper rps">
                    <div className="modal-content-panel">
                      <h5>Objective</h5>
                      <p>To correctly predict the correct 'hand' guesture</p>
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
                      <h5 style={{ color: '#02c526' }}>Profit Guarantee?</h5>

                      <p>Although Rock-Paper-Scissors is often considered a game of chance, with PVP, players can use their skill and knowledge of psychology to try predict outcomes. For example, most will lead with Rock, most will alternate and most will definitely find difficulty in randomizing their choices. Knowing these traits for profit is just mind money. Oh, and if you're setting up a game try keep your EV as close to 0 as possible...wait actually - that means people can count and make better decisions for example if 7 Rocks and 5 Papers have been played in the last 15 turns, then you can bet a lot of money on playing scissors next as it likely be a tie or a W but only IF you can be confident their EV is 0. So hopefully that answers the question ;)
</p>
                    </div>
                  </div>
                </AccordionItemPanel>
              </AccordionItem>
              <AccordionItem>
                <AccordionItemHeading>
                  <AccordionItemButton>
                    <div className="modal-content-wrapper provably-fair">
                      <h4>AI Games of Skill</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <p>
                        When we're talking cash, most of us would prefer betting on randomness (RNGs) to give us a level playing field. But in return, you have to give up some house edge. The downside of this, is that in the long-run you have to lose to pay for the casino's operating costs. But it doesn't have to be like this. If you think of any platform currently in operation, its users always do better in the long-run. Meaning, the more they use the app, the better their experience will be. So why should a casino be any different. RPS.GAME utilizes AI and PVP to make it beneficial for its users in the long-run without sacrificing the 'provably-fairness' experience like you would in traditional casinos. You set the odds, you create your own outcome. Decide what results you want, and let the AI do the work for you.
                      </p>
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
                    <div className="modal-content-wrapper house-edge">
                      <h4>FEES</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <p>
                        Hosting games i.e. operating as 'The House' is 100% free as there are games that are zero-sum and we want to offer something for them risking their capital. 
                        {' '}
                      </p>
                      <table id="howto-modal">
                        <tbody>
                          <tr>
                            <th>HOST FEES</th>
                            <th>JOINING TAX</th>
                            <th>WITHDRAWAL FEES</th>
                          </tr>
                          <tr>
                            <td>
                              <u>FREE</u>
                            </td>
                            <td className="gamemode">0.5%</td>
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
                      <h4>SUPPORT</h4>
                    </div>
                  </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                  <div className="modal-content-wrapper spleesh">
                    <div className="modal-content-panel">
                      <p>You can simply use the chat panel here, or you can reach out to us via one of these:</p>
                      <Button><a href="https://twitter.com/officialrpsgame">Twitter</a></Button>
                      <Button><a href="https://t.me/rps_finance">Telegram</a></Button>
                      <Button><a href="https://discord.gg/anMJntW4AD">Discord</a></Button>
                      <Button><a href="mailto:lenny@rps.finance">Email</a></Button>
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
