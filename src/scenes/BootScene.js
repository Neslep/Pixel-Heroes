import Phaser from 'phaser';
import { GAME_TITLE } from '../utils/constants.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#05070f');
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Forging Aetheria...', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '24px',
      color: '#facc15'
    }).setOrigin(0.5);

    this.generateTextures();
    this.time.delayedCall(250, () => this.scene.start('HeroSelectScene'));
  }

  generateTextures() {
    this.makeParticleTextures();
    this.makeHeroTextures();
    this.makeEnemyTextures();
    this.makeProjectiles();
    this.makeIcons();
    this.makeWorldTextures();
  }

  makeTexture(key, width, height, draw) {
    if (this.textures.exists(key)) this.textures.remove(key);
    const gfx = this.add.graphics();
    draw(gfx, width, height);
    gfx.generateTexture(key, width, height);
    gfx.destroy();
  }

  makeParticleTextures() {
    this.makeTexture('particle_square', 8, 8, (g) => {
      g.fillStyle(0xffffff, 1).fillRect(2, 2, 4, 4);
    });
    this.makeTexture('spark_star', 16, 16, (g) => {
      g.fillStyle(0xffffff, 1).fillRect(7, 1, 2, 14).fillRect(1, 7, 14, 2);
      g.fillStyle(0xffffff, 0.7).fillRect(5, 5, 6, 6);
    });
  }

  makeHeroTextures() {
    const heroes = [
      ['hero_arin', 0xff5a1f, 0xffd166],
      ['hero_lyra', 0x8fd3ff, 0xd7b8ff],
      ['hero_kael', 0x4be3ff, 0xf7f7ff],
      ['hero_orvan', 0xb8a889, 0xffc857]
    ];

    heroes.forEach(([key, body, accent]) => {
      this.makeTexture(key, 32, 40, (g) => {
        g.fillStyle(0x101827, 0.45).fillEllipse(16, 35, 22, 8);
        g.fillStyle(accent, 1).fillRect(11, 2, 10, 7);
        g.fillStyle(body, 1).fillRect(9, 9, 14, 14);
        g.fillStyle(0xf8d7a1, 1).fillRect(11, 5, 10, 8);
        g.fillStyle(0x1a1010, 1).fillRect(10, 14, 12, 3);
        g.fillStyle(body, 0.9).fillRect(5, 17, 6, 12).fillRect(21, 17, 6, 12);
        g.fillStyle(0x2f3646, 1).fillRect(10, 23, 5, 11).fillRect(17, 23, 5, 11);
        g.fillStyle(accent, 1).fillRect(25, 10, 3, 18);
      });

      this.makeTexture(`portrait_${key.split('_')[1]}`, 96, 96, (g) => {
        g.fillGradientStyle(0x0f172a, 0x0f172a, body, 0x05070f, 1, 1, 0.75, 1);
        g.fillRect(0, 0, 96, 96);
        g.lineStyle(4, accent, 1).strokeRect(6, 6, 84, 84);
        g.fillStyle(0xf8d7a1, 1).fillRect(36, 20, 24, 24);
        g.fillStyle(body, 1).fillRect(28, 44, 40, 32);
        g.fillStyle(accent, 1).fillRect(24, 14, 48, 10).fillRect(18, 72, 60, 5);
        g.fillStyle(0xffffff, 0.55).fillRect(42, 31, 4, 3).fillRect(52, 31, 4, 3);
      });
    });
  }

  makeEnemyTextures() {
    this.makeTexture('enemy_slime', 32, 28, (g) => {
      g.fillStyle(0x0f381d, 0.35).fillEllipse(16, 24, 26, 8);
      g.fillStyle(0x43c96b, 1).fillEllipse(16, 15, 25, 20);
      g.fillStyle(0x8cffaa, 1).fillRect(10, 10, 4, 3).fillRect(20, 10, 4, 3);
      g.fillStyle(0x1d7d3b, 1).fillRect(12, 18, 8, 2);
    });
    this.makeTexture('enemy_goblin', 32, 36, (g) => {
      g.fillStyle(0x203018, 1).fillRect(9, 12, 14, 16);
      g.fillStyle(0x8ace5c, 1).fillRect(8, 5, 16, 12);
      g.fillStyle(0x8ace5c, 1).fillRect(4, 8, 5, 4).fillRect(23, 8, 5, 4);
      g.fillStyle(0x3f2115, 1).fillRect(7, 23, 6, 9).fillRect(19, 23, 6, 9);
      g.fillStyle(0xe2e8f0, 1).fillRect(24, 15, 3, 12);
    });
    this.makeTexture('enemy_bat', 36, 26, (g) => {
      g.fillStyle(0x6d28d9, 1).fillTriangle(16, 12, 2, 3, 4, 22);
      g.fillTriangle(20, 12, 34, 3, 32, 22);
      g.fillStyle(0x9bdcff, 1).fillEllipse(18, 13, 14, 12);
      g.fillStyle(0xffffff, 1).fillRect(14, 11, 3, 2).fillRect(21, 11, 3, 2);
    });
    this.makeTexture('enemy_skeleton', 34, 42, (g) => {
      g.fillStyle(0xd8d4c7, 1).fillRect(10, 4, 14, 12).fillRect(12, 18, 10, 13);
      g.fillStyle(0x64748b, 1).fillRect(7, 16, 20, 6).fillRect(5, 22, 5, 12).fillRect(24, 22, 5, 12);
      g.fillStyle(0x111827, 1).fillRect(13, 9, 3, 3).fillRect(20, 9, 3, 3);
      g.fillStyle(0xd6a847, 1).fillRect(25, 12, 3, 18);
    });
    this.makeTexture('enemy_mage', 34, 42, (g) => {
      g.fillStyle(0x31204d, 1).fillRect(9, 12, 16, 22);
      g.fillStyle(0xc084fc, 1).fillRect(8, 5, 18, 10);
      g.fillStyle(0x0f172a, 1).fillRect(12, 12, 10, 8);
      g.fillStyle(0xa855f7, 1).fillRect(27, 7, 3, 25);
      g.fillStyle(0xffffff, 1).fillRect(28, 4, 5, 5);
    });
    this.makeTexture('boss_guardian', 74, 78, (g) => {
      g.fillStyle(0x0b0712, 0.5).fillEllipse(37, 70, 56, 14);
      g.fillStyle(0x37233f, 1).fillRect(20, 20, 34, 34);
      g.fillStyle(0x8b5cf6, 1).fillRect(24, 8, 26, 16);
      g.fillStyle(0x111827, 1).fillRect(28, 18, 18, 8);
      g.fillStyle(0xff6677, 1).fillRect(29, 20, 5, 4).fillRect(40, 20, 5, 4);
      g.fillStyle(0x6b7280, 1).fillRect(10, 30, 12, 28).fillRect(52, 30, 12, 28);
      g.fillStyle(0xd6a847, 1).fillRect(17, 55, 8, 15).fillRect(49, 55, 8, 15);
      g.lineStyle(3, 0xc084fc, 1).strokeRect(17, 17, 40, 40);
    });
  }

  makeProjectiles() {
    this.makeTexture('proj_moon', 18, 18, (g) => {
      g.fillStyle(0xcfe9ff, 1).fillCircle(9, 9, 7);
      g.fillStyle(0x8fd3ff, 0.75).fillCircle(12, 7, 5);
    });
    this.makeTexture('proj_arrow', 24, 10, (g) => {
      g.fillStyle(0xe2e8f0, 1).fillRect(2, 4, 16, 2);
      g.fillTriangle(18, 1, 23, 5, 18, 9);
      g.fillStyle(0x94a3b8, 1).fillRect(1, 2, 4, 6);
    });
    this.makeTexture('proj_lightning', 28, 12, (g) => {
      g.fillStyle(0x65f2ff, 1).fillTriangle(2, 2, 16, 5, 8, 10);
      g.fillTriangle(13, 1, 27, 5, 16, 11);
      g.fillStyle(0xffffff, 1).fillRect(7, 5, 12, 2);
    });
    this.makeTexture('proj_crystal', 18, 18, (g) => {
      g.fillStyle(0x8fd3ff, 1).fillTriangle(9, 1, 16, 9, 9, 17);
      g.fillTriangle(9, 1, 2, 9, 9, 17);
      g.fillStyle(0xffffff, 0.8).fillRect(8, 4, 3, 8);
    });
  }

  makeIcons() {
    const icons = {
      icon_blade: [0xff6a1a, 'slash'],
      icon_fire_slash: [0xff5a1f, 'slash'],
      icon_spin: [0xff8a1f, 'ring'],
      icon_dash: [0xff3d00, 'arrow'],
      icon_phoenix: [0xffa726, 'burst'],
      icon_moon: [0xa8d8ff, 'moon'],
      icon_moon_bolt: [0xcfe9ff, 'moon'],
      icon_heal: [0x92e6ff, 'cross'],
      icon_barrier: [0x7dd3fc, 'shield'],
      icon_lunar: [0xbad7ff, 'beam'],
      icon_arrow: [0xeef7ff, 'arrow'],
      icon_charged: [0x5ee7ff, 'arrow'],
      icon_trap: [0x38e8ff, 'ring'],
      icon_roll: [0xffffff, 'dash'],
      icon_thunder: [0x65f2ff, 'bolt'],
      icon_hammer: [0xd6a847, 'hammer'],
      icon_bash: [0xd6a847, 'shield'],
      icon_slam: [0xb9955a, 'burst'],
      icon_taunt: [0xffc857, 'ring'],
      icon_titan: [0xffc857, 'hammer']
    };

    Object.entries(icons).forEach(([key, [color, shape]]) => this.makeIcon(key, color, shape));

    const items = {
      item_sword: [0xb8c0cc, 'sword'],
      item_sword_fire: [0xff6b1a, 'sword'],
      item_staff: [0x8fd3ff, 'staff'],
      item_bow: [0x65f2ff, 'bow'],
      item_hammer: [0xd6a847, 'hammer'],
      item_armor: [0x94a3b8, 'armor'],
      item_armor_crystal: [0xc084fc, 'armor'],
      item_ring: [0xfacc15, 'ring'],
      item_charm: [0xf59e0b, 'charm'],
      item_shard: [0x38bdf8, 'crystal'],
      item_potion_red: [0xef4444, 'potion'],
      item_gold: [0xfacc15, 'coin'],
      loot_bag: [0xd6a847, 'bag'],
      orb_fire: [0xff6b1a, 'orb'],
      orb_frost: [0x8fd3ff, 'orb'],
      orb_storm: [0x65f2ff, 'orb'],
      orb_guardian: [0xffc857, 'orb']
    };

    Object.entries(items).forEach(([key, [color, shape]]) => this.makeIcon(key, color, shape));
  }

  makeIcon(key, color, shape) {
    this.makeTexture(key, 34, 34, (g) => {
      g.fillStyle(0x111827, 0.98).fillRect(0, 0, 34, 34);
      g.lineStyle(2, color, 1).strokeRect(2, 2, 30, 30);
      g.fillStyle(color, 1);
      if (shape === 'slash' || shape === 'sword') g.fillTriangle(9, 25, 24, 6, 28, 10).fillRect(7, 24, 10, 4);
      else if (shape === 'ring') g.lineStyle(4, color, 1).strokeCircle(17, 17, 9);
      else if (shape === 'arrow' || shape === 'dash') g.fillTriangle(7, 17, 24, 8, 24, 26).fillRect(6, 14, 16, 6);
      else if (shape === 'burst') g.fillCircle(17, 17, 9).fillTriangle(17, 3, 21, 14, 13, 14);
      else if (shape === 'moon') g.fillCircle(17, 17, 10).fillStyle(0x111827, 1).fillCircle(21, 14, 9);
      else if (shape === 'cross') g.fillRect(14, 7, 6, 20).fillRect(7, 14, 20, 6);
      else if (shape === 'shield') g.fillTriangle(8, 8, 26, 8, 17, 28).fillRect(10, 7, 14, 8);
      else if (shape === 'beam') g.fillRect(14, 5, 6, 24).fillCircle(17, 26, 8);
      else if (shape === 'bolt') g.fillTriangle(18, 4, 9, 19, 17, 18).fillTriangle(16, 16, 25, 15, 12, 30);
      else if (shape === 'hammer') g.fillRect(9, 8, 17, 7).fillRect(15, 13, 5, 15);
      else if (shape === 'staff') g.fillRect(16, 7, 3, 20).fillCircle(17, 8, 6);
      else if (shape === 'bow') g.lineStyle(4, color, 1).beginPath().arc(13, 17, 10, -1.2, 1.2).strokePath().lineStyle(1, 0xffffff, 1).lineBetween(15, 7, 15, 27);
      else if (shape === 'armor') g.fillRect(9, 10, 16, 17).fillRect(6, 13, 5, 6).fillRect(23, 13, 5, 6);
      else if (shape === 'crystal') g.fillTriangle(17, 4, 27, 17, 17, 30).fillTriangle(17, 4, 7, 17, 17, 30);
      else if (shape === 'potion') g.fillRect(13, 8, 8, 5).fillEllipse(17, 21, 15, 18);
      else if (shape === 'coin') g.fillCircle(17, 17, 10).fillStyle(0xfff7ad, 1).fillRect(15, 9, 4, 16);
      else if (shape === 'bag') g.fillRect(10, 13, 15, 14).fillRect(13, 8, 9, 6);
      else if (shape === 'charm') g.fillCircle(17, 18, 9).fillStyle(0xffffff, 0.7).fillRect(16, 9, 2, 18);
      else if (shape === 'orb') g.fillCircle(17, 17, 10).fillStyle(0xffffff, 0.75).fillCircle(13, 13, 3);
    });
  }

  makeWorldTextures() {
    this.makeTexture('tree_oak', 64, 88, (g) => {
      g.fillStyle(0x5a341f, 1).fillRect(28, 45, 10, 36);
      g.fillStyle(0x1f6b3a, 1).fillCircle(22, 36, 20).fillCircle(42, 32, 22).fillCircle(32, 20, 21);
      g.fillStyle(0x65a948, 1).fillCircle(21, 28, 6).fillCircle(48, 25, 5);
    });
    this.makeTexture('rock', 34, 28, (g) => {
      g.fillStyle(0x6b7280, 1).fillEllipse(17, 17, 28, 18);
      g.fillStyle(0x9ca3af, 1).fillRect(10, 9, 9, 4);
    });
    this.makeTexture('crystal_cluster', 36, 48, (g) => {
      g.fillStyle(0x38bdf8, 1).fillTriangle(18, 2, 28, 34, 15, 44);
      g.fillStyle(0x7dd3fc, 1).fillTriangle(9, 12, 17, 38, 5, 43);
      g.fillStyle(0xd7f5ff, 0.8).fillRect(17, 8, 3, 26);
    });
    this.makeTexture('torch', 24, 48, (g) => {
      g.fillStyle(0x6b3f1d, 1).fillRect(10, 16, 4, 28);
      g.fillStyle(0xff6b1a, 1).fillTriangle(12, 1, 19, 16, 6, 16);
      g.fillStyle(0xffd166, 1).fillTriangle(12, 5, 16, 15, 8, 15);
    });
    this.makeTexture('portal', 84, 104, (g) => {
      g.lineStyle(6, 0x38bdf8, 1).strokeEllipse(42, 54, 54, 82);
      g.lineStyle(3, 0xc084fc, 1).strokeEllipse(42, 54, 36, 62);
      g.fillStyle(0x38bdf8, 0.18).fillEllipse(42, 54, 42, 72);
    });
    this.makeTexture('dungeon_gate', 128, 112, (g) => {
      g.fillStyle(0x1f2937, 1).fillRect(8, 20, 112, 84);
      g.fillStyle(0x0f172a, 1).fillRect(34, 42, 60, 62);
      g.lineStyle(4, 0x7c3aed, 1).strokeRect(26, 32, 76, 72);
      g.fillStyle(0xc084fc, 1).fillRect(58, 24, 12, 12);
    });
    this.makeTexture('quest_board', 72, 58, (g) => {
      g.fillStyle(0x6b3f1d, 1).fillRect(8, 9, 56, 34).fillRect(15, 42, 6, 16).fillRect(51, 42, 6, 16);
      g.fillStyle(0xf8d7a1, 1).fillRect(16, 15, 14, 16).fillRect(36, 14, 18, 20);
    });
    this.makeTexture('chest', 42, 34, (g) => {
      g.fillStyle(0x8b5a2b, 1).fillRect(5, 13, 32, 16);
      g.fillStyle(0xd6a847, 1).fillRect(5, 9, 32, 8).fillRect(19, 13, 5, 15);
      g.lineStyle(2, 0x3a2614, 1).strokeRect(5, 9, 32, 20);
    });
    this.makeTexture('npc_villager', 32, 40, (g) => {
      g.fillStyle(0xf8d7a1, 1).fillRect(11, 5, 10, 10);
      g.fillStyle(0x38bdf8, 1).fillRect(8, 15, 16, 16);
      g.fillStyle(0x4b5563, 1).fillRect(10, 31, 5, 7).fillRect(18, 31, 5, 7);
      g.fillStyle(0xfacc15, 1).fillRect(10, 2, 12, 5);
    });
    this.makeTexture('trap_rune', 48, 48, (g) => {
      g.lineStyle(3, 0xffffff, 1).strokeCircle(24, 24, 18);
      g.lineStyle(2, 0xffffff, 0.8).lineBetween(24, 6, 37, 34).lineBetween(37, 34, 11, 34).lineBetween(11, 34, 24, 6);
    });
  }
}
