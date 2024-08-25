// tutorialStepsGame.js
import happyCat from './happyCat.svg';
import slyCat from './slyCat.svg';
import coolCat from './coolCat.svg';

const isMobile = () => window.matchMedia && window.matchMedia("(max-width: 768px)").matches;


export const tutorialStepsGame = [
    {
      target: isMobile() ? '.pre-summary-panel' : '.commission',
      content: (
        <div className="tutorial">
          <p>Check the room's commission rate (determined by accessories from the marketplace). This is how much the Host receives back from your winnings (RTB).</p>
          <img src={slyCat} alt="Caesar the car" />
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.game-info-panel',
      content: (
        <div className="tutorial">
          <p>First we need data. Play manually by adjusting bet sizes and clicking the available on-screen buttons.</p>
          <img src={happyCat} alt="Caesar the car" />
        </div>
      ),
      placement: isMobile() ? 'bottom' : 'right',
    },
    {
      target: '#btn-rps-settings',
      content: (
        <div className="tutorial">
          <p>When you're confident on the room's pattern, you can click the gear icon and choose an appropriate strategy against it.</p>
          <img src={happyCat} alt="Caesar the car" />
        </div>
      ),
      placement: isMobile() ? 'top' : 'left',
    },
    {
      target: '#aiplay-switch',
      content: (
        <div className="tutorial">
          <p>Let it run for a moment, then judge if it's profitable. If not, change strategy and repeat.</p>
          <img src={coolCat} alt="Caesar the car" />
        </div>
      ),
      placement: isMobile() ? 'top' :  'left',
    },
    {
      target: '#detach-attach-switch',
      content: (
        <div className="tutorial">
          <p>If the strategy seems to be working, toggle ATTACH so you can leave the room with the AI running.</p>
          <img src={coolCat} alt="Caesar the car" />
        </div>
      ),
      placement:   isMobile() ? 'top' : 'left',
    },
    
  ];
  