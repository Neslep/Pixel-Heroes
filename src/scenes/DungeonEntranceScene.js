import { BaseGameplayScene } from './BaseGameplayScene.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { GameEvents, EVENTS } from '../utils/events.js';
import { DEPTH, WORLD } from '../utils/constants.js';
import { distance, rand } from '../utils/math.js';

export class DungeonEntranceScene extends BaseGameplayScene {
  constructor() {
    super('DungeonEntranceScene', 'entrance');
  }

  create() {
    if (!this.createBase({ palette: 'entrance', ambientColor: 0xc084fc, spawn: { x: 260, y: WORLD.height / 2 } })) return;
    this.createEntrance();
  }

  createEntrance() {
    for (let i = 0; i < 18; i += 1) {
      this.addDecor('rock', rand(80, WORLD.width - 80), rand(80, WORLD.height - 80), rand(1, 1.7), 0x8b8fa3);
    }
    for (let i = 0; i < 10; i += 1) {
      this.addDecor('torch', 510 + i * 120, 315 + (i % 2) * 225, 1.25);
    }
    for (let i = 0; i < 10; i += 1) {
      this.addDecor('crystal_cluster', 620 + i * 112, 170 + (i % 3) * 255, 1, 0xc084fc);
    }
    this.addDecor('dungeon_gate', WORLD.width - 245, WORLD.height / 2, 1.8, 0xffffff, DEPTH.decorBack);
    this.gate = { x: WORLD.width - 245, y: WORLD.height / 2 };
    this.add.text(this.gate.x, this.gate.y + 140, 'Sealed Boss Dungeon', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#d8b4fe',
      stroke: '#000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(DEPTH.effects);
    this.add.text(260, WORLD.height / 2 + 90, 'Town Trail', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f8f1d2',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(DEPTH.effects);
  }

  update(time, delta) {
    super.update(time, delta);
    if (!this.player || this.transitioning) return;

    if (this.player.x < 120) {
      this.transitioning = true;
      this.cameras.main.fadeOut(360, 5, 7, 15);
      this.time.delayedCall(360, () => this.scene.start('TownScene'));
    }

    if (distance(this.player, this.gate) < 120) {
      if (!this._warningShown) {
        this._warningShown = true;
        EffectsSystem.notification(this, 'Entering the Corrupted Guardian arena', '#ff7373');
      }
      QuestSystem.markDungeonEntered(this.state);
      GameEvents.emit(EVENTS.questChanged);
      this.autoSave();
      this.transitioning = true;
      this.cameras.main.fadeOut(520, 5, 7, 15);
      this.time.delayedCall(520, () => this.scene.start('DungeonScene'));
    }
  }
}
