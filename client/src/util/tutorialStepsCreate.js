// tutorialStepsCreate.js
import happyCat from './happyCat.svg';
import slyCat from './slyCat.svg';
import coolCat from './coolCat.svg';


const isMobile = () => window.matchMedia && window.matchMedia("(max-width: 768px)").matches;


export const tutorialStepsCreate = [
  {
    target: '.my-open-games',
    content: (
      <div className="tutorial">
        <p>Want to host instead? Here's where you can manage your own or co-hosted games. Adjust settings, rug or unstake them.</p>
        <img src={slyCat} alt="Caesar the car" />
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '.create-room-btn-panel',
    content: (
      <div className="tutorial">
        <p>To create a new game, click this big red button.</p>
        <img src={happyCat} alt="Caesar the car" />
      </div>
    ),
    placement: 'bottom',
  },


];
