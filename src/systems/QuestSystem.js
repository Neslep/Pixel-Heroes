import { MAIN_QUEST } from '../data/quests.js';

export class QuestSystem {
  static addKill(state) {
    const before = state.quest.kills;
    state.quest.kills = Math.min(MAIN_QUEST.objectives[0].target, state.quest.kills + 1);
    QuestSystem.refreshUnlocks(state);
    return state.quest.kills !== before;
  }

  static addShard(state) {
    const before = state.quest.shards;
    state.quest.shards = Math.min(MAIN_QUEST.objectives[1].target, state.quest.shards + 1);
    QuestSystem.refreshUnlocks(state);
    return state.quest.shards !== before;
  }

  static markDungeonEntered(state) {
    if (state.quest.enterDungeon) return false;
    state.quest.enterDungeon = true;
    state.unlockedAreas.dungeon = true;
    return true;
  }

  static markBossDefeated(state) {
    if (state.quest.bossDefeated) return false;
    state.quest.bossDefeated = true;
    return true;
  }

  static refreshUnlocks(state) {
    if (state.quest.kills >= 10 && state.quest.shards >= 3) {
      state.unlockedAreas.dungeonEntrance = true;
    }
  }

  static isDungeonEntranceUnlocked(state) {
    QuestSystem.refreshUnlocks(state);
    return Boolean(state.unlockedAreas.dungeonEntrance);
  }

  static getObjectiveRows(state) {
    const values = {
      kills: state.quest.kills,
      shards: state.quest.shards,
      enterDungeon: state.quest.enterDungeon ? 1 : 0,
      bossDefeated: state.quest.bossDefeated ? 1 : 0
    };

    let activeFound = false;
    return MAIN_QUEST.objectives.map((objective) => {
      const value = Math.min(values[objective.id], objective.target);
      const complete = value >= objective.target;
      const active = !complete && !activeFound;
      if (active) activeFound = true;
      return {
        ...objective,
        value,
        complete,
        active
      };
    });
  }
}
