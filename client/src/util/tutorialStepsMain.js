// tutorialStepsMain.js
import happyCat from './happyCat.svg';
import slyCat from './slyCat.svg';
import coolCat from './coolCat.svg';

const isMobile = () => window.matchMedia && window.matchMedia("(max-width: 768px)").matches;

export const tutorialStepsMain = [
    {
      target: isMobile() ? '.main-page-nav-button-group' : '.main-game-page-tabs',
      content: (
        <div className="tutorial">
          <p>The mains tabs let you switch to Live Games or Your Portfolio ('Manage').</p>
          <img src={happyCat} alt="Caesar the car" />
        </div>
      ),
      placement: isMobile() ? 'top' : 'bottom',
    },
    {
      target: '#balance',
      content: (
        <div className="tutorial">
          <p>Click your wallet to view assets, make deposits or withdrawals. Safely store excess funds in your vault here too.</p>
          <img src={slyCat} alt="Caesar the car"/>
        </div>
      ),
      placement: 'left',
    },
    {
      target: isMobile() ? '.mobile-tab-marketplace' : '#btn_bank',
      content: (
        <div className="tutorial">
          <p>Visit the bank when in need for a loan, or to offer loans to others as another source of income.</p>
          <img src={coolCat} alt="Caesar the car" />
        </div>
      ),
      placement: isMobile() ? 'top' : 'bottom',
    },
    {
      target:  isMobile() ? '.mobile-tab-marketplace' : '#btn_marketplace',
      content: (
        <div className="tutorial">
          <p>The marketplace lets you trade items. You can even list items for others to rent, again as a source of income.</p>
          <img src={slyCat} alt="Caesar the car" />
        </div>
      ),
      placement: isMobile() ? 'top' : 'bottom',
    },
    {
      target: '.refresh-main',
      content: (
        <div className="tutorial">
          <p>Click here to always retrieve the latest games.</p>
          <img src={coolCat} alt="Caesar the car" />
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.cell-action',
      content: (
        <div className="tutorial">
          <p>Click the 'green plus' to co-host (own a % of a room's stake). Or click the red button to join the game.</p>
          <img src={coolCat} alt="Caesar the car" />
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.gamified-container',
      content: (
        <div className="tutorial">
          <p>Come back here later. Q-Bot runs autonomously on AI Play data, <i>whether you're logged in or not</i>. Feed it profitable data.</p>
          <img src={happyCat} alt="Caesar the car" />
        </div>
      ),
      placement: isMobile() ? 'top' : 'left',
    },
  ];
  