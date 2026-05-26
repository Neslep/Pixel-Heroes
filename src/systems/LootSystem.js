import { ENEMY_LOOT_TABLE, BOSS_REWARD_TABLE } from '../data/items.js';
import { randInt, weightedPick, pick } from '../utils/math.js';

export class LootSystem {
  static rollEnemyGold(enemyConfig) {
    return randInt(enemyConfig.gold[0], enemyConfig.gold[1]);
  }

  static rollEnemyItems(state) {
    const drops = [];

    if (state.quest.shards < 3 && Math.random() < 0.35) {
      drops.push('crystal_shard');
    }

    if (Math.random() < 0.32) {
      drops.push(weightedPick(ENEMY_LOOT_TABLE));
    }

    return drops;
  }

  static rollBossRewards() {
    const first = pick(BOSS_REWARD_TABLE);
    const second = Math.random() < 0.6 ? pick(BOSS_REWARD_TABLE.filter((item) => item !== first)) : 'vigor_ring';
    return [first, second, 'health_potion'];
  }
}
