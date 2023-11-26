import React from 'react';
import Lottie from 'react-lottie';
import dropOff from '../game_panel/LottieAnimations/the-drop-off.json';
import goalBg from '../game_panel/LottieAnimations/quantum-goal.json';
import deepSea from '../game_panel/LottieAnimations/deep-sea.json';
import lilBoat from '../game_panel/LottieAnimations/lil-boat.json';

import blackjackSettings from '../game_panel/LottieAnimations/blackjack-settings.json';
import boatBg from '../game_panel/LottieAnimations/gone-fishing.json';
import floaraGardens from '../game_panel/LottieAnimations/floaro-gardens.json';
import shootingStars from '../game_panel/LottieAnimations/shooting-stars.json';
import mountainRail from '../game_panel/LottieAnimations/mountain-rail.json';
import sunrise from '../game_panel/LottieAnimations/sunrise.json';
import rainforest from '../game_panel/LottieAnimations/rainforest.json';
import mountMarmalade from '../game_panel/LottieAnimations/mount-marmalade.json';
import gem from '../game_panel/LottieAnimations/gem.json';
import shooting_stars from '../game_panel/LottieAnimations/shooting_stars.json';
import fish from '../game_panel/LottieAnimations/fish.json';
import ape from '../game_panel/LottieAnimations/ape.json';

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

export const renderLottieAvatarAnimation = image => {
  const convertToReactNode = (animationData, className) => (
    <div className={className}>
      <Lottie options={{ animationData }} />
    </div>
  );

  switch (image) {
    case 'the-drop-off':
      return convertToReactNode(dropOff, 'lottie-bg');

    case 'quantum-goal':
      return convertToReactNode(goalBg, 'lottie-bg goal');

    case 'blackjack-settings':
      return (
        <div className="lottie-bg">
          <Lottie options={{ animationData: blackjackSettings }} />
        </div>
      );
    case 'gone-fishing':
      return (
        <div className="lottie-bg">
          <Lottie options={{ animationData: boatBg }} />
        </div>
      );
    case 'deep-sea':
      return (
        <div className="lottie-bg deep-sea">
          <Lottie options={{ animationData: deepSea }} />
        </div>
      );
      case 'lil-boat':
      return (
        <div className="lottie-bg lil-boat">
          <Lottie options={{ animationData: lilBoat }} />
        </div>
      );
      case 'arctic':
        return (
          <div className="lottie-bg arctic">
            <Lottie options={{ animationData: arctic }} />
          </div>
        );
        case 'sunrise':
        return (
          <div className="lottie-bg sunrise">
            <Lottie options={{ animationData: sunrise }} />
          </div>
        );
        
        case 'rainforest':
          return (
            <div className="lottie-bg rainforest">
              <Lottie options={{ animationData: rainforest }} />
            </div>
          );
          
        case 'vacation':
      return (
        <div className="lottie-bg vacation">
          <Lottie options={{ animationData: vacation }} />
        </div>
      );
      case 'orion-trip':
        return (
          <div className="lottie-bg orion">
            <Lottie options={{ animationData: orionTrip }} />
          </div>
        );
    case 'floara-gardens':
      return (
        <div className="lottie-bg">
          <Lottie options={{ animationData: floaraGardens }} />
        </div>
      );
    case 'shooting-stars':
      return (
        <div className="lottie-bg shooting_stars">
          <Lottie options={{ animationData: shootingStars }} />
        </div>
      );
    case 'mountain-rail':
      return (
        <div className="lottie-bg rocks">
          <Lottie options={{ animationData: mountainRail }} />
        </div>
      );
    case 'mount-marmalade':
      return (
        <div className="lottie-bg rocks">
          <Lottie options={{ animationData: mountMarmalade }} />
        </div>
      );
    case 'gem':
      return (
        <div className="lottie-container">
          <Lottie options={{ animationData: gem }} />
        </div>
      );
    case 'fish':
      return (
        <div className="lottie-container">
          <Lottie
            style={
              {
                // top: '-8px'
                // transform: 'translate: (50%, 50%)'
              }
            }
            options={{ animationData: fish }}
          />
        </div>
      );
    case 'shooting_stars':
      return (
        <div className="lottie-container">
          <Lottie options={{ animationData: shooting_stars }} />
        </div>
      );
    case 'cat_pop':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              marginTop: '-6px'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: cat_pop }}
          />
        </div>
      );
    case 'cool_banana':
      return (
        <div className="lottie-container">
          <Lottie
            style={
              {
                // left: '-10px'
                // transform: 'translate: (50%, 50%)'
              }
            }
            options={{ animationData: cool_banana }}
          />
        </div>
      );
    case 'flame':
      return (
        <div className="lottie-container">
          <Lottie
            style={
              {
                // left: '-10px'
                // transform: 'translate: (50%, 50%)'
              }
            }
            options={{ animationData: flame }}
          />
        </div>
      );
    case 'glee':
      return (
        <div className="lottie-container glee">
          <Lottie
            style={
              {
                left: '30%',
                top: '30%'
                // transform: 'translate: (50%, 50%)'
              }
            }
            options={{ animationData: glee }}
          />
        </div>
      );
    case 'bird':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              marginLeft: '-10px'
              // top: '-10px'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: bird }}
          />
        </div>
      );
    case 'smoke':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              marginTop: '-10px'
              // position: 'absolute'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: smoke }}
          />
        </div>
      );
    case 'butterfly':
      return (
        <div className="lottie-container">
          <Lottie options={{ animationData: butterfly }} />
        </div>
      );
    case 'bat':
      return (
        <div className="lottie-container">
          <Lottie options={{ animationData: bat }} />
        </div>
      );
    case 'gas':
      return (
        <div className="lottie-container">
          <Lottie
            // style={{
            //   width: '300%',
            //   height: '300%',
            //   top: '-30px',
            //   left: '-30px',
            //   zIndex: '1'
            // }}
            options={{ animationData: gas }}
          />
        </div>
      );
    case 'poker':
      return (
        <div className="lottie-container">
          <Lottie
            style={
              {
                // top: '-10px'
              }
            }
            options={{ animationData: poker }}
          />
        </div>
      );
    case 'dragon':
      return (
        <div className="lottie-container dragon">
          <Lottie
            style={{
              width: '80px',
              top: '0',
              left: '-10px',
              transform: 'scaleX(-1)'
            }}
            options={{ animationData: dragon }}
          />
        </div>
      );
    case 'red-dolphins':
      return (
        <div className="lottie-container">
          <Lottie
            style={
              {
                // top: '-10px'
              }
            }
            options={{ animationData: dolphin }}
          />
        </div>
      );
    case 'octopus':
      return (
        <div className="lottie-container">
          <Lottie
            style={
              {
                // top: '-10px'
              }
            }
            options={{ animationData: octopus }}
          />
        </div>
      );
    case 'penguin':
      return (
        <div className="lottie-container penguin">
          <Lottie
            style={{
              width: '90px',
              height: 'auto',
              left: '40px'
            }}
            options={{ animationData: penguin }}
          />
        </div>
      );
    case 'ufo':
      return (
        <div className="lottie-container ufo">
          <Lottie
            style={{
              marginTop: '-30px'
            }}
            options={{ animationData: ufo }}
          />
        </div>
      );
    case 'crown':
      return (
        <div className="lottie-container crown">
          <Lottie
            style={{
              top: '0px'
            }}
            options={{ animationData: crown }}
          />
        </div>
      );
    case 'shark':
      return (
        <div className="lottie-container shark">
          <Lottie
            style={{
              marginTop: '30%'
            }}
            options={{ animationData: shark }}
          />
        </div>
      );
    case 'shark2':
    case 'shark2':
      return (
        <div className="lottie-container shark2">
          <Lottie
            style={{
              marginTop: '10px'
            }}
            options={{ animationData: shark2 }}
          />
        </div>
      );
    case 'cat':
      return (
        <div className="lottie-container cat">
          <Lottie
            style={{
              transform: 'scaleX(-1)',
              left: '-10px',
              top: '8px'
            }}
            options={{ animationData: cat }}
          />
        </div>
      );
    case 'bunny':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              marginLeft: '-8px'
            }}
            options={{ animationData: bunny }}
          />
        </div>
      );
    case 'roo':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              marginLeft: '-8px'
            }}
            options={{ animationData: roo }}
          />
        </div>
      );
    case 'snake':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              marginLeft: '-8px'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: snake }}
          />
        </div>
      );
    case 'planet':
      return (
        <div className="lottie-container">
          <Lottie
            style={
              {
                // left: '-10px'
                // transform: 'translate: (50%, 50%)'
              }
            }
            options={{ animationData: planet }}
          />
        </div>
      );
    case 'halo':
      return (
        <div className="lottie-container halo">
          <Lottie
            style={{
              width: '50%',
              marginTop: '-10px'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: halo }}
          />
        </div>
      );
    case 'swords':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              width: '65px'
              // left: '-10px'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: swords }}
          />
        </div>
      );
    case 'cannabis':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              width: '40px',
              marginLeft: '-8px',
              marginTop: '5px'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: cannabis }}
          />
        </div>
      );
      case 'ape':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              width: '40px',
              marginLeft: '-8px',
              marginTop: '5px'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: ape }}
          />
        </div>
      );
    case 'ak47':
      return (
        <div className="lottie-container ak47">
          <Lottie
            style={{
              width: '70px',
              left: '30px'
              // top: '-10px'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: ak47 }}
          />
        </div>
      );
    case 'fox':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              left: '20%'
              // top: '-10px'
            }}
            options={{ animationData: fox }}
          />
        </div>
      );
    case 'cow_head':
      return (
        <div className="lottie-container">
          <Lottie
            style={
              {
                // right: '-10px',
                // top: '-10px'
                // transform: 'translate: (50%, 50%)'
              }
            }
            options={{ animationData: cow_head }}
          />
        </div>
      );

    case 'xmasTree':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              right: '-10px',
              top: '-10px'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: xmasTree }}
          />
        </div>
      );
    case 'santaHat':
      return (
        <div className="lottie-container">
          <Lottie
            style={{
              // left: '-10px',
              top: '0'
              // transform: 'translate: (50%, 50%)'
            }}
            options={{ animationData: santaHat }}
          />
        </div>
      );
    case 'snowflakes':
      return (
        <div className="lottie-container">
          <Lottie
            style={
              {
                // top: '-10px',
                // position: 'absolute'
                // transform: 'translate: (50%, 50%)'
              }
            }
            options={{ animationData: snowflakes }}
          />
        </div>
      );
    case 'snowman':
      return (
        <div className="lottie-container">
          <Lottie options={{ animationData: snowman }} />
        </div>
      );
    default:
      return null; // No matching animation
  }
};
