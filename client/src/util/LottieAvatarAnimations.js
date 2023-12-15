import React from 'react';
import Lottie from 'react-lottie';

import dropOff from '../game_panel/LottieAnimations/the-drop-off.json';
import goalBg from '../game_panel/LottieAnimations/quantum-goal.json';
import deepSea from '../game_panel/LottieAnimations/deep-sea.json';
import lilBoat from '../game_panel/LottieAnimations/lil-boat.json';
import grasslands from '../game_panel/LottieAnimations/grasslands.json';
import campfire from '../game_panel/LottieAnimations/campfire.json';
import campfire2 from '../game_panel/LottieAnimations/campfire2.json';
import happyBirthday from '../game_panel/LottieAnimations/happy-birthday.json';
import lateDrive from '../game_panel/LottieAnimations/late-drive.json';
import theNetherlands from '../game_panel/LottieAnimations/the-netherlands.json';
import blackjackSettings from '../game_panel/LottieAnimations/blackjack-settings.json';
import boatBg from '../game_panel/LottieAnimations/gone-fishing.json';
import floaroGardens from '../game_panel/LottieAnimations/floaro-gardens.json';
import shootingStars from '../game_panel/LottieAnimations/shooting-stars.json';
import mountainRail from '../game_panel/LottieAnimations/mountain-rail.json';
import sunrise from '../game_panel/LottieAnimations/sunrise.json';
import rainforest from '../game_panel/LottieAnimations/rainforest.json';
import mountMarmalade from '../game_panel/LottieAnimations/mount-marmalade.json';
import gem from '../game_panel/LottieAnimations/gem.json';
import shooting_stars from '../game_panel/LottieAnimations/shooting_stars.json';
import fish from '../game_panel/LottieAnimations/fish.json';
import ape from '../game_panel/LottieAnimations/ape.json';
import cow from '../game_panel/LottieAnimations/cow.json';
import cat_pop from '../game_panel/LottieAnimations/cat_pop.json';
import cool_banana from '../game_panel/LottieAnimations/cool_banana.json';
import flame from '../game_panel/LottieAnimations/flame.json';
import roo from '../game_panel/LottieAnimations/roo.json';
import vacation from '../game_panel/LottieAnimations/vacation.json';
import orionTrip from '../game_panel/LottieAnimations/orion-trip.json';
import arctic from '../game_panel/LottieAnimations/arctic.json';
import paradise from '../game_panel/LottieAnimations/paradise.json';
import bat from '../game_panel/LottieAnimations/bat.json';
import glee from '../game_panel/LottieAnimations/glee.json';
import bird from '../game_panel/LottieAnimations/bird.json';
import smoke from '../game_panel/LottieAnimations/smoke.json';
import butterfly from '../game_panel/LottieAnimations/butterfly.json';
import gas from '../game_panel/LottieAnimations/gas.json';
import poker from '../game_panel/LottieAnimations/poker.json';
import penguin from '../game_panel/LottieAnimations/penguin.json';
import dragon from '../game_panel/LottieAnimations/dragon.json';
import dolphin from '../game_panel/LottieAnimations/red-dolphins.json';
import octopus from '../game_panel/LottieAnimations/octopus.json';

import ufo from '../game_panel/LottieAnimations/ufo.json';
import shark2 from '../game_panel/LottieAnimations/shark2.json';
import crown from '../game_panel/LottieAnimations/crown.json';
import shark from '../game_panel/LottieAnimations/shark.json';
import cat from '../game_panel/LottieAnimations/cat.json';
import bunny from '../game_panel/LottieAnimations/bunny.json';
import snake from '../game_panel/LottieAnimations/snake.json';
import planet from '../game_panel/LottieAnimations/planet.json';
import halo from '../game_panel/LottieAnimations/halo.json';
import swords from '../game_panel/LottieAnimations/swords.json';
import ak47 from '../game_panel/LottieAnimations/ak47.json';
import cannabis from '../game_panel/LottieAnimations/cannabis.json';
import fox from '../game_panel/LottieAnimations/fox.json';
import cow_head from '../game_panel/LottieAnimations/cow_head.json';
import snowflakes from '../game_panel/LottieAnimations/snowflakes.json';
import xmasTree from '../game_panel/LottieAnimations/xmasTree.json';
import snowman from '../game_panel/LottieAnimations/snowman.json';
import santaHat from '../game_panel/LottieAnimations/santaHat.json';

const animationMap = {
  'the-drop-off': { animationData: dropOff, className: 'lottie-bg' },
  'quantum-goal': { animationData: goalBg, className: 'lottie-bg goal' },
  'deep-sea': { animationData: deepSea, className: 'lottie-bg deep-sea' },
  'lil-boat': { animationData: lilBoat, className: 'lottie-bg lil-boat' },
  grasslands: { animationData: grasslands, className: 'lottie-bg' },
  campfire: { animationData: campfire, className: 'lottie-bg campfire' },
  campfire2: {
    animationData: campfire2,
    className: 'lottie-bg campfire2'
  },
  'happy-birthday': { animationData: happyBirthday, className: 'lottie-bg' },
  'late-drive': { animationData: lateDrive, className: 'lottie-bg' },
  'the-netherlands': {
    animationData: theNetherlands,
    className: 'lottie-bg deep-sea'
  },
  'blackjack-settings': {
    animationData: blackjackSettings,
    className: 'lottie-bg'
  },
  'gone-fishing': { animationData: boatBg, className: 'lottie-bg' },
  'floaro-gardens': { animationData: floaroGardens, className: 'lottie-bg' },
  'shooting-stars': {
    animationData: shootingStars,
    className: 'lottie-bg shooting_stars'
  },
  'mountain-rail': {
    animationData: mountainRail,
    className: 'lottie-bg rocks'
  },
  sunrise: { animationData: sunrise, className: 'lottie-bg sunrise' },
  rainforest: { animationData: rainforest, className: 'lottie-bg rainforest' },
  'mount-marmalade': {
    animationData: mountMarmalade,
    className: 'lottie-bg rocks'
  },
  gem: { animationData: gem, className: 'lottie-container' },
  fish: { animationData: fish, className: 'lottie-container' },
  shooting_stars: {
    animationData: shooting_stars,
    className: 'lottie-container'
  },
  cat_pop: {
    animationData: cat_pop,
    className: 'lottie-container',
    styles: { marginTop: '-6px' }
  },
  cool_banana: { animationData: cool_banana, className: 'lottie-container' },
  flame: { animationData: flame, className: 'lottie-container' },
  glee: {
    animationData: glee,
    className: 'lottie-container glee',
    styles: { left: '30%', top: '30%' }
  },
  bird: {
    animationData: bird,
    className: 'lottie-container',
    styles: { marginLeft: '-10px' }
  },
  cow: {
    animationData: cow,
    className: 'lottie-container',
    styles: { marginLeft: '-10px' }
  },
  smoke: {
    animationData: smoke,
    className: 'lottie-container',
    styles: { marginTop: '-10px' }
  },
  butterfly: { animationData: butterfly, className: 'lottie-container' },
  bat: { animationData: bat, className: 'lottie-container' },
  gas: { animationData: gas, className: 'lottie-container' },
  poker: { animationData: poker, className: 'lottie-container' },
  dragon: {
    animationData: dragon,
    className: 'lottie-container dragon',
    styles: { width: '80px', top: '0', left: '-10px', transform: 'scaleX(-1)' }
  },
  'red-dolphins': { animationData: dolphin, className: 'lottie-container' },
  octopus: { animationData: octopus, className: 'lottie-container' },
  penguin: {
    animationData: penguin,
    className: 'lottie-container penguin',
    styles: { width: '90px', height: 'auto', left: '40px' }
  },
  ufo: {
    animationData: ufo,
    className: 'lottie-container ufo',
    styles: { marginTop: '-30px' }
  },
  crown: {
    animationData: crown,
    className: 'lottie-container crown',
    styles: { top: '0px' }
  },
  shark: {
    animationData: shark,
    className: 'lottie-container shark',
    styles: { marginTop: '30%' }
  },
  shark2: {
    animationData: shark2,
    className: 'lottie-container shark2',
    styles: { marginTop: '10px' }
  },
  cat: {
    animationData: cat,
    className: 'lottie-container cat',
    styles: { transform: 'scaleX(-1)', left: '-10px', top: '8px' }
  },
  bunny: {
    animationData: bunny,
    className: 'lottie-container',
    styles: { marginLeft: '-8px' }
  },
  roo: {
    animationData: roo,
    className: 'lottie-container',
    styles: { marginLeft: '-8px' }
  },
  snake: {
    animationData: snake,
    className: 'lottie-container',
    styles: { marginLeft: '-8px' }
  },
  planet: { animationData: planet, className: 'lottie-container' },
  halo: {
    animationData: halo,
    className: 'lottie-container halo',
    styles: { width: '50%', marginTop: '-10px' }
  },
  swords: {
    animationData: swords,
    className: 'lottie-container',
    styles: { width: '65px' }
  },
  cannabis: {
    animationData: cannabis,
    className: 'lottie-container',
    styles: { width: '40px', marginLeft: '-8px', marginTop: '5px' }
  },
  ape: {
    animationData: ape,
    className: 'lottie-container',
    styles: { width: '40px', marginLeft: '-8px', marginTop: '5px' }
  },
  ak47: {
    animationData: ak47,
    className: 'lottie-container ak47',
    styles: { width: '70px', left: '30px' }
  },
  fox: {
    animationData: fox,
    className: 'lottie-container',
    styles: { left: '20%' }
  },
  cow_head: { animationData: cow_head, className: 'lottie-container' },
  xmasTree: {
    animationData: xmasTree,
    className: 'lottie-container',
    styles: { right: '-10px', top: '-10px' }
  },
  santaHat: {
    animationData: santaHat,
    className: 'lottie-container',
    styles: { top: '0' }
  },
  snowflakes: { animationData: snowflakes, className: 'lottie-container' },
  snowman: { animationData: snowman, className: 'lottie-container' },
  vacation: { animationData: vacation, className: 'lottie-bg vacation' },
  'orion-trip': { animationData: orionTrip, className: 'lottie-bg orion' },
  arctic: { animationData: arctic, className: 'lottie-bg arctic' },
  paradise: { animationData: paradise, className: 'lottie-container paradise' }
};

export const renderLottieAvatarAnimation = (image, isLowGraphics) => {
  const convertToReactNode = ({ animationData, className, styles }) => {
    const options = {
      animationData,
      loop: !isLowGraphics,
      autoplay: !isLowGraphics,
      segments: [30],
      isStopped: isLowGraphics,
      isPaused: isLowGraphics
    };

    const conditionalStyles = className.includes('lottie-bg') && isLowGraphics ? { filter: 'grayscale(100%)', opacity: 0.5} : {};

    return (
      <div className={className}>
        <Lottie style={{ ...styles, ...conditionalStyles }} options={options} />
      </div>
    );
  };

  const animationInfo = animationMap[image];

  if (animationInfo) {
    return convertToReactNode(animationInfo);
  } else {
    return null;
  }
};
