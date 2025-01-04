import React, { Component } from 'react';
import Modal from 'react-modal';
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel
} from 'react-accessible-accordion';
import { Typography, Button } from '@material-ui/core';

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
                      <Typography
                        variant="body2"
                        paragraph
                        className="scroll-animation"
                        style={{ animationDelay: '0.2s', lineHeight: '2em', textAlign: 'center' }}
                      >
                        <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>RPS.Game</span>
                        is more than just a platform—it’s a <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>powerful game creation tool!</span>
                        Players can design their own games, and when they reach <strong style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>80 SOL</strong>
                        in contributions, these games can be minted as unique tokens on the blockchain.
                        This allows creators to turn their gaming ideas into real, tradable assets. It’s the
                        <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>purr-fect</span>
                        way to blend creativity and decentralization!
                      </Typography>

                      <Typography
                        variant="body2"
                        paragraph
                        className="scroll-animation"
                        style={{ animationDelay: '0.4s', fontWeight: 'bold', lineHeight: '2em', color: 'rgb(72 255 4)', textAlign: 'center' }}
                      >
                        Important Note: We launch tokens for fun every week on Saturdays to help crowdfund the platform.
                        This is <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>NOT financial advice</span>,
                        and you should never invest more than you are willing to lose. These are high-risk, high-reward opportunities meant for entertainment and innovation!
                      </Typography>

                      <Typography
                        variant="body2"
                        paragraph
                        className="scroll-animation"
                        style={{ lineHeight: '2em', animationDelay: '0.6s', textAlign: 'center' }}
                      >
                        <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>RPS.Game</span>
                        offers financial tools that are typically gate-kept by the Elite, but we’ve opened the door for
                        <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>EVERYONE</span>—whether you're a fat cat or a stray.
                        Using <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>$RPS</span>,
                        we’ve got a solution to inflation by capping the total supply at
                        <strong style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>1 Billion tokens</strong>.
                        Just think of it as a ball of yarn with a limit on how much it can unravel!
                      </Typography>

                      <Typography
                        variant="body2"
                        paragraph
                        className="scroll-animation"
                        style={{ lineHeight: '2em', animationDelay: '0.8s', textAlign: 'center' }}
                      >
                        The cat (token) distribution system? We’re giving <strong style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>5%</strong>
                        to the team (for their paw-some efforts), <strong style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>20%</strong>
                        to the platform, <strong style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>70%</strong>
                        to the eco-system (you cool cats), and the final <strong style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>5%</strong>... well, marketing.
                      </Typography>

                      <Typography
                        variant="body2"
                        paragraph
                        className="scroll-animation"
                        style={{ lineHeight: '2em', animationDelay: '1s', textAlign: 'center' }}
                      >
                        Mark your cat-lendars! The Pump.Fun FAIR LAUNCH of <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>$RPS</span>
                        opens on <strong style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>4TH DEC 20:00 CEST</strong>.
                        So, sharpen your claws and get ready! Remember, it’s <strong style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>GET RICH 💰 OR DIE 🩸</strong>—fur real.
                      </Typography>

                      <div className="tiers">
                        <Typography
                          variant="h5"
                          paragraph
                          style={{ lineHeight: '2em', textAlign: 'center', fontWeight: 'bold', marginTop: '1em', color: 'rgb(72 255 4)', padding: '2.5px', backgroundColor: 'rgba(72 255 4, 0.3)', borderRadius: '0.3em' }}
                        >
                          Our AI (Unlocked at Level 60)
                        </Typography>
                        <Typography
                          variant="body2"
                          paragraph
                          style={{ lineHeight: '2em', textAlign: 'center', lineHeight: '1.6' }}
                        >
                          Our AI is a language model and cannot be used in most games. However, some games cannot be played without it.
                          It offers a unique balance of <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>speed</span>,
                          <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>reasoning</span>, and
                          <span className="highlight" style={{ background: 'linear-gradient(165deg, #ffd000, #ff0000)', padding: '0em 0.4em', margin: '2.5px', borderRadius: '5px' }}>abilities</span> tailored for advanced gameplay.
                        </Typography>
                        <table style={{ margin: '20px auto 0', textAlign: 'center', width: '100%' }}>
                          <tbody>
                            <tr>
                              <td>Speed</td>
                              <td>
                                <div className="bar" style={{ width: '100%' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td>Reasoning</td>
                              <td>
                                <div className="bar" style={{ width: '100%' }}></div>
                              </td>
                            </tr>
                            <tr>
                              <td>Abilities</td>
                              <td>
                                <div className="bar" style={{ width: '50%' }}></div>
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
                          <li><strong>Who can I contact for partnership inquiries?</strong> For partnership inquiries, please email us at inv_inquiries@rps.game.</li>
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
