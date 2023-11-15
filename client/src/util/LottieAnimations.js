import React from 'react';
import Lottie from 'react-lottie';
import dropOff from '../game_panel/LottieAnimations/the-drop-off.json';
import goalBg from '../game_panel/LottieAnimations/quantum-goal.json';
import blackjackSettings from '../game_panel/LottieAnimations/blackjack-settings.json';
import boatBg from '../game_panel/LottieAnimations/gone-fishing.json';
import floaraGardens from '../game_panel/LottieAnimations/floaro-gardens.json';
import mountainsBg from '../game_panel/LottieAnimations/mountains-bg.json';
import mountainRail from '../game_panel/LottieAnimations/mountain-rail.json';
import mountMarmalade from '../game_panel/LottieAnimations/mount-marmalade.json';

import snowflakes from '../game_panel/LottieAnimations/snowflakes.json';
import xmasTree from '../game_panel/LottieAnimations/xmasTree.json';
import snowman from '../game_panel/LottieAnimations/snowman.json';
import santaHat from '../game_panel/LottieAnimations/santaHat.json';
import gem from '../game_panel/LottieAnimations/gem.json';
import shooting_stars from '../game_panel/LottieAnimations/shooting_stars.json';
import fish from '../game_panel/LottieAnimations/fish.json';
import cat_pop from '../game_panel/LottieAnimations/cat_pop.json';
import cool_banana from '../game_panel/LottieAnimations/cool_banana.json';
import flame from '../game_panel/LottieAnimations/flame.json';
import glee from '../game_panel/LottieAnimations/glee.json';
import bird from '../game_panel/LottieAnimations/bird.json';
import smoke from '../game_panel/LottieAnimations/smoke.json';
import butterfly from '../game_panel/LottieAnimations/butterfly.json';
import gas from '../game_panel/LottieAnimations/gas.json';
import poker from '../game_panel/LottieAnimations/poker.json';
import penguin from '../game_panel/LottieAnimations/penguin.json';
import dragon from '../game_panel/LottieAnimations/dragon.json';
import dolphin from '../game_panel/LottieAnimations/red-dolphins.json';
import ufo from '../game_panel/LottieAnimations/ufo.json';
import shark2 from '../game_panel/LottieAnimations/shark2.json';
import crown from '../game_panel/LottieAnimations/crown.json';
import shark from '../game_panel/LottieAnimations/shark.json';
import cat from '../game_panel/LottieAnimations/cat.json';
import bunny from '../game_panel/LottieAnimations/bunny.json';
import snake from '../game_panel/LottieAnimations/snake.json';
import planet from '../game_panel/LottieAnimations/planet.json';
import halo from '../game_panel/LottieAnimations/halo.json';
import cannabis from '../game_panel/LottieAnimations/cannabis.json';
import swords from '../game_panel/LottieAnimations/swords.json';
import ak47 from '../game_panel/LottieAnimations/ak47.json';
import fox from '../game_panel/LottieAnimations/fox.json';
import cow_head from '../game_panel/LottieAnimations/cow_head.json';

export const renderLottieAnimation = image => {
  switch (image) {
    case 'the-drop-off':
      return (
        <div className="lottie-bg-container">
          <Lottie
              options={{ animationData: dropOff }} />
        </div>
      );
    case 'quantum-goal':
      return (
        <div className="lottie-bg-container goal">
          <Lottie options={{ animationData: goalBg }} />
        </div>
      );
    case 'blackjack-settings':
      return (
        <div className="lottie-bg-container">
          <Lottie options={{ animationData: blackjackSettings }} />
        </div>
      );
    case 'gone-fishing':
      return (
        <div className="lottie-bg-container">
          <Lottie options={{ animationData: boatBg }} />
        </div>
      );
    case 'floaro-gardens':
      return (
        <div className="lottie-bg-container">
          <Lottie options={{ animationData: floaraGardens }} />
        </div>
      );
    case 'mountains-bg':
      return (
        <div className="lottie-bg-container">
          <Lottie options={{ animationData: mountainsBg }} />
        </div>
      );
    case 'mountain-rail':
      return (
        <div className="lottie-bg-container rocks">
          <Lottie options={{ animationData: mountainRail }} />
        </div>
      );
      case 'mount-marmalade':
        return (
          <div className="lottie-bg-container rocks">
            <Lottie options={{ animationData: mountMarmalade }} />
          </div>
        );
    case 'gem':
      return (
        <div className="lottie">
          <Lottie
          style={{
                marginTop: '-10px',
                // transform: 'translate: (50%, 50%)'
              }}
              options={{ animationData: gem }} />
        </div>
      );
    case 'fish':
      return (
        <div className="lottie">
          <Lottie options={{ animationData: fish }} />
        </div>
      );
    case 'shooting_stars':
      return (
        <div className="lottie">
          <Lottie options={{ animationData: shooting_stars }} />
        </div>
      );
    case 'cat_pop':
      return (
        <div className="lottie">
          <Lottie options={{ animationData: cat_pop }} />
        </div>
      );
    case 'cool_banana':
      return (
        <div className="lottie">
          <Lottie options={{ animationData: cool_banana }} />
        </div>
      );
    case 'flame':
      return (
        <div className="lottie">
          <Lottie options={{ animationData: flame }} />
        </div>
      );
    case 'glee':
      return (
        <div className="lottie">
          <Lottie options={{ animationData: glee }} />
        </div>
      );
    case 'bird':
      return (
        <div className="lottie">
          <Lottie options={{ animationData: bird }} />
        </div>
      );
    case 'smoke':
      return (
        <div className="lottie">
          <Lottie options={{ animationData: smoke }} />
        </div>
      );
    case 'butterfly':
      return (
        <div className="lottie">
          <Lottie options={{ animationData: butterfly }} />
        </div>
      );
    case 'gas':
      return (
        <div className="lottie">
          <Lottie options={{ animationData: gas }} />
        </div>
      );
      case 'poker':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: poker }}
          />
        </div>
      );
      case 'dragon':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: dragon }}
          />
        </div>
      );
      case 'red-dolphins':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: dolphin }}
          />
        </div>
      );
      case 'penguin':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: penguin }}
          />
        </div>
      );
      case 'ufo':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: ufo }}
          />
        </div>
      );
      case 'crown':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: crown }}
          />
        </div>
      );
      case 'shark':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: shark }}
          />
        </div>
      );
      case 'shark2':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: shark2 }}
          />
        </div>
      );
      case 'cat':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: cat }}
          />
        </div>
      );
      case 'bunny':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: bunny }}
          />
        </div>
      );
      case 'snake':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: snake }}
          />
        </div>
      );
      case 'planet':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: planet }}
          />
        </div>
      );
      case 'halo':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: halo }}
          />
        </div>
      );
      case 'swords':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: swords }}
          />
        </div>
      );
      case 'cannabis':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: cannabis }}
          />
        </div>
      );
      case 'ak47':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: ak47 }}
          />
        </div>
      );
      case 'fox':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: fox }}
          />
        </div>
      );
      case 'cow_head':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: cow_head }}
          />
        </div>
      );
      case 'santaHat':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: santaHat }}
          />
        </div>
      );
      case 'snowflakes':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: snowflakes }}
          />
        </div>
      );
      case 'xmasTree':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: xmasTree }}
          />
        </div>
      );
      case 'snowman':
      return (
        <div className="lottie">
          <Lottie
            style={{
              top: '-10px',
            }}
            options={{ animationData: snowman }}
          />
        </div>
      );
    default:
      return null; // No matching animation
  }
};
