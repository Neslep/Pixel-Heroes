import Phaser from 'phaser';
import { ITEMS } from '../data/items.js';
import { RARITY, DEPTH } from '../utils/constants.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { distance } from '../utils/math.js';

export class LootDrop extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, itemId, gold = 0) {
    const item = itemId ? ITEMS[itemId] : null;
    super(scene, x, y, item?.icon ?? 'item_gold');

    this.scene = scene;
    this.itemId = itemId;
    this.gold = gold;
    this.item = item;
    this.pickupRadius = 42;
    this.rarityColor = RARITY[item?.rarity ?? 'common'].color;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.effects - 1);
    this.setScale(1.25);
    this.body.setCircle(12, 4, 4);
    this.setTint(this.rarityColor);
    this.beam = EffectsSystem.lootBeam(scene, x, y, this.rarityColor);
    scene.tweens.add({ targets: this, y: y - 7, yoyo: true, repeat: -1, duration: 780, ease: 'Sine.easeInOut' });
  }

  update() {
    if (!this.active || !this.scene.player?.active) return;
    this.beam?.setPosition(this.x, this.y - 34);

    if (distance(this, this.scene.player) <= this.pickupRadius) {
      this.scene.pickupLoot(this);
    }
  }

  destroy(fromScene) {
    this.beam?.destroy();
    super.destroy(fromScene);
  }
}
