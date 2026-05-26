import Phaser from 'phaser';
import { ITEMS } from '../data/items.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { RARITY, DEPTH } from '../utils/constants.js';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    this.scene.stop('UIScene');
    this.registry.set('uiBlocking', false);
    this.rewards = this.registry.get('victoryRewards') ?? { exp: 0, gold: 0, items: [] };
    this.cameras.main.setBackgroundColor('#05070f');
    this.createBackground();
    this.createContent();
  }

  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    const gfx = this.add.graphics();
    gfx.fillGradientStyle(0x05070f, 0x0f172a, 0x241532, 0x05070f, 1);
    gfx.fillRect(0, 0, w, h);
    gfx.fillStyle(0xfacc15, 0.12).fillCircle(w / 2, h * 0.3, 240);
    for (let i = 0; i < 70; i += 1) {
      const star = this.add.image(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), 'spark_star')
        .setTint(Phaser.Math.RND.pick([0xfacc15, 0xffffff, 0xc084fc]))
        .setAlpha(Phaser.Math.FloatBetween(0.2, 0.8))
        .setScale(Phaser.Math.FloatBetween(0.4, 1.25));
      this.tweens.add({ targets: star, y: star.y - 90, alpha: 0, duration: Phaser.Math.Between(1600, 4200), repeat: -1 });
    }
  }

  createContent() {
    const cx = this.scale.width / 2;
    this.add.text(cx, 90, 'VICTORY', {
      fontFamily: 'Georgia, serif',
      fontSize: '68px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#1f1300',
      strokeThickness: 9
    }).setOrigin(0.5);

    this.add.text(cx, 150, 'The Corrupted Guardian has fallen.', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '20px',
      color: '#e5e7eb'
    }).setOrigin(0.5);

    const panel = this.add.graphics().setDepth(DEPTH.ui);
    panel.fillStyle(0x111827, 0.92).fillRoundedRect(cx - 360, 195, 720, 330, 8);
    panel.lineStyle(3, 0xd6a847, 0.95).strokeRoundedRect(cx - 360, 195, 720, 330, 8);

    this.add.text(cx - 240, 242, `EXP +${this.rewards.exp}`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5);
    this.add.text(cx + 240, 242, `Gold +${this.rewards.gold}`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#facc15'
    }).setOrigin(0.5);

    const startX = cx - ((this.rewards.items.length - 1) * 150) / 2;
    this.rewards.items.forEach((itemId, index) => {
      this.createLootCard(startX + index * 150, 378, ITEMS[itemId]);
    });

    this.createButton(cx, 590, 250, 52, 'Return to Town', () => {
      const state = this.registry.get('save');
      if (state) {
        state.lastArea = 'town';
        SaveSystem.save(state);
      }
      this.cameras.main.fadeOut(300, 5, 7, 15);
      this.time.delayedCall(300, () => this.scene.start('TownScene'));
    });
  }

  createLootCard(x, y, item) {
    const rarity = RARITY[item.rarity];
    const card = this.add.graphics();
    card.fillStyle(0x0f172a, 0.94).fillRoundedRect(x - 62, y - 78, 124, 156, 7);
    card.lineStyle(3, rarity.color, 1).strokeRoundedRect(x - 62, y - 78, 124, 156, 7);
    this.add.image(x, y - 24, item.icon).setScale(1.8).setTint(rarity.color);
    this.add.text(x, y + 42, item.name, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: rarity.text,
      align: 'center',
      wordWrap: { width: 104 }
    }).setOrigin(0.5);
    this.add.text(x, y + 66, rarity.label, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '11px',
      color: '#cbd5e1'
    }).setOrigin(0.5);
  }

  createButton(x, y, width, height, label, onClick) {
    const container = this.add.container(x, y).setSize(width, height).setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    const bg = this.add.graphics();
    const draw = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover ? 0x263247 : 0x111827, 0.96).fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.lineStyle(2, hover ? 0xfacc15 : 0xd6a847, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    };
    draw(false);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '19px',
      fontStyle: 'bold',
      color: '#fff7d6'
    }).setOrigin(0.5);
    container.add([bg, text]);
    container.on('pointerover', () => draw(true));
    container.on('pointerout', () => draw(false));
    container.on('pointerdown', onClick);
  }
}
