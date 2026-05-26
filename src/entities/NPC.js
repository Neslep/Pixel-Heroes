import Phaser from 'phaser';
import { DEPTH } from '../utils/constants.js';
import { distance } from '../utils/math.js';

export class NPC extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, config) {
    super(scene, x, y, config.texture ?? 'npc_villager');
    this.scene = scene;
    this.config = config;
    this.message = config.message;
    this.baseY = y;

    scene.add.existing(this);
    this.setDepth(DEPTH.actors);
    this.setScale(config.scale ?? 1.45);
    this.setTint(config.tint ?? 0xffffff);

    this.label = scene.add.text(x, y - 42, config.name, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f8f1d2',
      stroke: '#0a0a0a',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(DEPTH.actors + 4);
  }

  update() {
    if (!this.scene.player) return;
    this.y = this.baseY + Math.sin(this.scene.time.now * 0.003 + this.x) * 2;
    this.label.setPosition(this.x, this.y - 42);
    if (distance(this, this.scene.player) < 76 && !this._near) {
      this._near = true;
      this.scene.log(this.message);
    }
    if (distance(this, this.scene.player) >= 88) this._near = false;
  }

  destroy(fromScene) {
    this.label?.destroy();
    super.destroy(fromScene);
  }
}
