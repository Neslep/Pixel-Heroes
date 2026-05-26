import { STORAGE_KEY } from '../utils/constants.js';
import { HEROES } from '../data/heroes.js';
import { STARTER_ITEMS } from '../data/items.js';
import { InventorySystem } from './InventorySystem.js';

export class SaveSystem {
  static createDefault(heroId) {
    const hero = HEROES[heroId];
    const state = {
      version: 1,
      heroId,
      heroName: hero.name,
      level: 1,
      exp: 0,
      gold: 35,
      currentHp: hero.stats.maxHp,
      currentMp: hero.stats.maxMp,
      inventory: [],
      equipped: {
        weapon: null,
        armor: null,
        accessory: null
      },
      orb: {
        id: 'fire',
        skillSlot: 1
      },
      quest: {
        kills: 0,
        shards: 0,
        enterDungeon: false,
        bossDefeated: false
      },
      unlockedAreas: {
        town: true,
        forest: true,
        dungeonEntrance: false,
        dungeon: false
      },
      defeatedBosses: [],
      settings: {
        musicVolume: 0.35,
        soundVolume: 0.8,
        graphicsQuality: 'high'
      },
      lastArea: 'town'
    };

    STARTER_ITEMS.forEach((itemId) => InventorySystem.addItem(state, itemId));
    return state;
  }

  static clone(state) {
    return JSON.parse(JSON.stringify(state));
  }

  static hasSave() {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  }

  static save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const state = JSON.parse(raw);
      if (!state.version || !state.heroId) return null;
      return state;
    } catch {
      return null;
    }
  }

  static reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  static getExpToNext(level) {
    return 100 + (level - 1) * 65;
  }

  static addExp(state, amount) {
    state.exp += amount;
    let leveled = false;

    while (state.exp >= SaveSystem.getExpToNext(state.level)) {
      state.exp -= SaveSystem.getExpToNext(state.level);
      state.level += 1;
      leveled = true;
    }

    return leveled;
  }
}
