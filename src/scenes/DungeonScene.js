import { BaseGameplayScene } from './BaseGameplayScene.js';
import { Boss } from '../entities/Boss.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { LootSystem } from '../systems/LootSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { GameEvents, EVENTS } from '../utils/events.js';
import { DEPTH, WORLD } from '../utils/constants.js';

export class DungeonScene extends BaseGameplayScene {
  constructor() {
    super('DungeonScene', 'dungeon');
  }

  create() {
    if (!this.createBase({ palette: 'dungeon', ambientColor: 0xc084fc, spawn: { x: WORLD.width / 2, y: WORLD.height - 170 } })) return;
    this.createArena();
    this.time.delayedCall(650, () => this.spawnBoss());
  }

  createArena() {
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      this.addDecor('torch', WORLD.width / 2 + Math.cos(angle) * 400, WORLD.height / 2 + Math.sin(angle) * 250, 1.5, 0xffffff, DEPTH.decorBack);
      this.addDecor('rock', WORLD.width / 2 + Math.cos(angle + 0.2) * 465, WORLD.height / 2 + Math.sin(angle + 0.2) * 315, 1.25, 0x8b8fa3);
    }
    this.addDecor('crystal_cluster', WORLD.width / 2 - 330, WORLD.height / 2 + 160, 1.2, 0x9d35ff);
    this.addDecor('crystal_cluster', WORLD.width / 2 + 340, WORLD.height / 2 - 150, 1.2, 0x9d35ff);
  }

  spawnBoss() {
    this.boss = new Boss(this, WORLD.width / 2, WORLD.height / 2 - 60);
    this.enemies.add(this.boss);
    EffectsSystem.notification(this, 'Corrupted Guardian', '#ff7373');
    EffectsSystem.screenShake(this, 0.008, 420);
    AudioSystem.boss();
  }

  onBossDefeated() {
    if (this.victoryStarted) return;
    this.victoryStarted = true;
    QuestSystem.markBossDefeated(this.state);

    const rewards = {
      exp: 520,
      gold: 280,
      items: LootSystem.rollBossRewards()
    };

    const leveled = SaveSystem.addExp(this.state, rewards.exp);
    this.state.gold += rewards.gold;
    rewards.items.forEach((itemId) => InventorySystem.addItem(this.state, itemId));
    if (leveled) this.player.refreshStats(true);
    SaveSystem.save(this.state);

    this.registry.set('victoryRewards', rewards);
    GameEvents.emit(EVENTS.questChanged);
    GameEvents.emit(EVENTS.hudChanged);
    AudioSystem.victory();
    this.cameras.main.fadeOut(850, 5, 7, 15);
    this.time.delayedCall(850, () => this.scene.start('VictoryScene'));
  }
}
