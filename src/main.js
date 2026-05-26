import Phaser from 'phaser';
import './styles.css';
import { BootScene } from './scenes/BootScene.js';
import { HeroSelectScene } from './scenes/HeroSelectScene.js';
import { TownScene } from './scenes/TownScene.js';
import { ForestScene } from './scenes/ForestScene.js';
import { DungeonEntranceScene } from './scenes/DungeonEntranceScene.js';
import { DungeonScene } from './scenes/DungeonScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { UIScene } from './scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#05070f',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
    min: {
      width: 960,
      height: 540
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      fps: 60
    }
  },
  scene: [
    BootScene,
    HeroSelectScene,
    TownScene,
    ForestScene,
    DungeonEntranceScene,
    DungeonScene,
    VictoryScene,
    UIScene
  ]
};

const game = new Phaser.Game(config);

if (import.meta.env.DEV) {
  window.__AETHERIA_GAME__ = game;
}
