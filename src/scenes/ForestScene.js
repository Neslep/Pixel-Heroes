import { BaseGameplayScene } from './BaseGameplayScene.js';
import { Enemy } from '../entities/Enemy.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { FOREST_SPAWN_TABLE } from '../data/enemies.js';
import { DEPTH, WORLD } from '../utils/constants.js';
import { distance, rand, randInt, weightedPick } from '../utils/math.js';

export class ForestScene extends BaseGameplayScene {
  constructor() {
    super('ForestScene', 'forest');
  }

  create() {
    if (!this.createBase({ palette: 'forest', ambientColor: 0x8cffaa, spawn: { x: 180, y: WORLD.height / 2 } })) return;
    this.createForest();
    this.spawnInitialEnemies();
  }

  createForest() {
    for (let i = 0; i < 54; i += 1) {
      const edge = i % 2 === 0;
      const x = edge ? rand(40, WORLD.width - 40) : rand(260, WORLD.width - 70);
      const y = edge ? (i % 4 < 2 ? rand(55, 190) : rand(WORLD.height - 180, WORLD.height - 45)) : rand(140, WORLD.height - 120);
      this.addDecor('tree_oak', x, y, rand(0.75, 1.2), 0xffffff, y > WORLD.height / 2 ? DEPTH.decorFront : DEPTH.decorBack);
    }

    for (let i = 0; i < 34; i += 1) {
      this.addDecor('rock', rand(180, WORLD.width - 160), rand(160, WORLD.height - 120), rand(0.8, 1.3));
    }

    for (let i = 0; i < 9; i += 1) {
      this.addDecor('crystal_cluster', rand(500, WORLD.width - 260), rand(150, WORLD.height - 150), rand(0.7, 1.15), 0x8fd3ff);
    }

    this.addDecor('dungeon_gate', WORLD.width - 130, WORLD.height / 2, 1.05, QuestSystem.isDungeonEntranceUnlocked(this.state) ? 0xffffff : 0x64748b);
    this.exitGate = { x: WORLD.width - 130, y: WORLD.height / 2 };
    this.add.text(this.exitGate.x, this.exitGate.y + 86, 'Runegate Trail', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#d8b4fe',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(DEPTH.effects);
  }

  spawnInitialEnemies() {
    for (let i = 0; i < 15; i += 1) this.spawnForestEnemy();
  }

  spawnForestEnemy() {
    const enemyId = weightedPick(FOREST_SPAWN_TABLE);
    const x = rand(450, WORLD.width - 240);
    const y = rand(160, WORLD.height - 160);
    const enemy = new Enemy(this, x, y, enemyId);
    this.enemies.add(enemy);
    return enemy;
  }

  update(time, delta) {
    super.update(time, delta);
    if (!this.player || this.transitioning) return;

    if (this.getLivingEnemies().length < 10 && (!this._lastSpawn || time - this._lastSpawn > 1400)) {
      this._lastSpawn = time;
      this.spawnForestEnemy();
    }

    if (distance(this.player, this.exitGate) < 96) {
      if (QuestSystem.isDungeonEntranceUnlocked(this.state)) {
        this.transitioning = true;
        this.cameras.main.fadeOut(380, 5, 7, 15);
        this.time.delayedCall(380, () => this.scene.start('DungeonEntranceScene'));
      } else if (!this._exitWarned || time - this._exitWarned > 2200) {
        this._exitWarned = time;
        EffectsSystem.notification(this, `Quest: ${this.state.quest.kills}/10 kills, ${this.state.quest.shards}/3 shards`, '#f8f1d2');
      }
    }
  }
}
