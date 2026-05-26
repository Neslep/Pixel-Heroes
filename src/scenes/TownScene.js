import { BaseGameplayScene } from './BaseGameplayScene.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { WORLD, DEPTH } from '../utils/constants.js';
import { distance } from '../utils/math.js';

export class TownScene extends BaseGameplayScene {
  constructor() {
    super('TownScene', 'town');
  }

  create() {
    if (!this.createBase({ palette: 'town', ambientColor: 0xffd166, spawn: { x: 360, y: WORLD.height / 2 } })) return;
    this.createTown();
  }

  createTown() {
    for (let i = 0; i < 18; i += 1) {
      this.addDecor('tree_oak', 120 + i * 100, 120 + (i % 3) * 36, 0.9, 0xffffff, DEPTH.decorBack);
      this.addDecor('tree_oak', 90 + i * 104, WORLD.height - 110 - (i % 2) * 20, 0.92, 0xffffff, DEPTH.decorFront);
    }

    for (let i = 0; i < 14; i += 1) {
      this.addDecor('torch', 250 + i * 110, 402 + Math.sin(i) * 36, 1.15, 0xffffff, DEPTH.decorBack);
    }

    this.addDecor('quest_board', 650, 460, 1.35);
    this.addDecor('chest', 530, 612, 1.2);
    this.addDecor('crystal_cluster', 995, 620, 1.1, 0x8fd3ff);
    this.addDecor('portal', 1635, 540, 1.25, 0x8fd3ff);
    this.forestPortal = { x: 1635, y: 540, label: 'Forest Gate' };

    this.addDecor('dungeon_gate', 980, 210, 1.25, QuestSystem.isDungeonEntranceUnlocked(this.state) ? 0xffffff : 0x64748b);
    this.dungeonGate = { x: 980, y: 225 };

    this.addNPC(470, 475, {
      name: 'Mira',
      tint: 0xffd166,
      message: 'Mira: The forest gate is open. Bring back three aether shards.'
    });
    this.addNPC(760, 600, {
      name: 'Old Warder',
      tint: 0x8fd3ff,
      message: 'Old Warder: Your browser remembers progress with a local save crystal.'
    });
    this.addNPC(1155, 525, {
      name: 'Smith Rolan',
      tint: 0xb8a889,
      message: 'Smith Rolan: Found gear can be equipped from the inventory panel.'
    });

    this.add.text(this.forestPortal.x, this.forestPortal.y + 82, 'Forest Gate', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#d7f5ff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(DEPTH.effects);
  }

  update(time, delta) {
    super.update(time, delta);
    if (!this.player || this.transitioning) return;

    if (distance(this.player, this.forestPortal) < 82) {
      this.transitioning = true;
      this.cameras.main.fadeOut(380, 5, 7, 15);
      this.time.delayedCall(380, () => this.scene.start('ForestScene'));
    }

    if (distance(this.player, this.dungeonGate) < 92) {
      if (QuestSystem.isDungeonEntranceUnlocked(this.state)) {
        this.transitioning = true;
        this.cameras.main.fadeOut(380, 5, 7, 15);
        this.time.delayedCall(380, () => this.scene.start('DungeonEntranceScene'));
      } else if (!this._gateWarned || time - this._gateWarned > 2200) {
        this._gateWarned = time;
        EffectsSystem.notification(this, 'The runegate needs 10 kills and 3 shards', '#94a3b8');
        this.log('The dungeon seal is still locked.');
      }
    }
  }
}
