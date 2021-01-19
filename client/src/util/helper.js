// import AFTop from '../game_panel/LottieAnimations/AFTop.json';
import AFBottom from '../game_panel/LottieAnimations/AFBottom.json';
import AFLeftTop from '../game_panel/LottieAnimations/AFLeftTop.json';
import AFLeftBottom from '../game_panel/LottieAnimations/AFLeftBottom.json';
import AFRightTop from '../game_panel/LottieAnimations/AFRightTop.json';
import AFRightBottom from '../game_panel/LottieAnimations/AFRightBottom.json';

// import AUTop from '../game_panel/LottieAnimations/AUTop.json';
import AUBottom from '../game_panel/LottieAnimations/AUBottom.json';
import AULeftTop from '../game_panel/LottieAnimations/AULeftTop.json';
import AULeftBottom from '../game_panel/LottieAnimations/AULeftBottom.json';
import AURightTop from '../game_panel/LottieAnimations/AURightTop.json';
import AURightBottom from '../game_panel/LottieAnimations/AURightBottom.json';

// import BRTop from '../game_panel/LottieAnimations/BRTop.json';
import BRBottom from '../game_panel/LottieAnimations/BRBottom.json';
import BRLeftTop from '../game_panel/LottieAnimations/BRLeftTop.json';
import BRLeftBottom from '../game_panel/LottieAnimations/BRLeftBottom.json';
import BRRightTop from '../game_panel/LottieAnimations/BRRightTop.json';
import BRRightBottom from '../game_panel/LottieAnimations/BRRightBottom.json';

// import EATop from '../game_panel/LottieAnimations/EATop.json';
import EABottom from '../game_panel/LottieAnimations/EABottom.json';
import EALeftTop from '../game_panel/LottieAnimations/EALeftTop.json';
import EALeftBottom from '../game_panel/LottieAnimations/EALeftBottom.json';
import EARightTop from '../game_panel/LottieAnimations/EARightTop.json';
import EARightBottom from '../game_panel/LottieAnimations/EARightBottom.json';

// import SATop from '../game_panel/LottieAnimations/SATop.json';
import SABottom from '../game_panel/LottieAnimations/SABottom.json';
import SALeftTop from '../game_panel/LottieAnimations/SALeftTop.json';
import SALeftBottom from '../game_panel/LottieAnimations/SALeftBottom.json';
import SARightTop from '../game_panel/LottieAnimations/SARightTop.json';
import SARightBottom from '../game_panel/LottieAnimations/SARightBottom.json';

const lottieAnims = [
    {
        "center": SABottom,
         "tl": SALeftTop,
         "tr": SARightTop,
         "bl": SALeftBottom,
         "br": SARightBottom
    },
    {
        "center": EABottom,
         "tl": EALeftTop,
         "tr": EARightTop,
         "bl": EALeftBottom,
         "br": EARightBottom
    },
    {
        "center": BRBottom,
         "tl": BRLeftTop,
         "tr": BRRightTop,
         "bl": BRLeftBottom,
         "br": BRRightBottom
    },
    {
        "center": AUBottom,
         "tl": AULeftTop,
         "tr": AURightTop,
         "bl": AULeftBottom,
         "br": AURightBottom
    },
    {
        "center": AFBottom,
         "tl": AFLeftTop,
         "tr": AFRightTop,
         "bl": AFLeftBottom,
         "br": AFRightBottom
    },
]

export const cleanObj = obj => {
  let newObj = {};
  Object.keys(obj).forEach(prop => {
    if (obj[prop]) {
      newObj[prop] = obj[prop];
    }
  });
  return newObj;
};

export const hpGoToInput = id => {
  document.getElementById(id).focus();
};

export function updateDigitToPoint2(number) {
  if (parseFloat(number) - parseInt(number) > 0) {
      return parseFloat(number).toFixed(2);
  }
  return number;
}

export function getQsLottieAnimation(nation, short_name) {
  return lottieAnims[nation][short_name];
}