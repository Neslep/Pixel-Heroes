import Phaser from 'phaser';

export const GameEvents = new Phaser.Events.EventEmitter();

export const EVENTS = {
  stateChanged: 'state-changed',
  hudChanged: 'hud-changed',
  questChanged: 'quest-changed',
  log: 'log',
  notify: 'notify',
  areaChanged: 'area-changed',
  bossChanged: 'boss-changed',
  bossHidden: 'boss-hidden',
  cooldownsChanged: 'cooldowns-changed',
  openPanel: 'open-panel'
};
