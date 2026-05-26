import { HEROES } from '../data/heroes.js';
import { ITEMS } from '../data/items.js';
import { clamp } from '../utils/math.js';

let uidCounter = 1;

export class InventorySystem {
  static createEntry(itemId) {
    return {
      uid: `${Date.now().toString(36)}_${uidCounter++}`,
      itemId
    };
  }

  static addItem(state, itemId) {
    const entry = InventorySystem.createEntry(itemId);
    state.inventory.push(entry);
    return entry;
  }

  static removeItem(state, uid) {
    const index = state.inventory.findIndex((entry) => entry.uid === uid);
    if (index === -1) return null;
    return state.inventory.splice(index, 1)[0];
  }

  static getEntryItem(entry) {
    return entry ? ITEMS[entry.itemId] : null;
  }

  static equip(state, uid) {
    const entry = InventorySystem.removeItem(state, uid);
    if (!entry) return { ok: false, reason: 'Item is no longer in the inventory.' };

    const item = ITEMS[entry.itemId];
    if (!['weapon', 'armor', 'accessory'].includes(item.type)) {
      state.inventory.push(entry);
      return { ok: false, reason: 'This item cannot be equipped.' };
    }

    const old = state.equipped[item.type];
    if (old) state.inventory.push(old);
    state.equipped[item.type] = entry;
    return { ok: true, item };
  }

  static unequip(state, slot) {
    const old = state.equipped[slot];
    if (!old) return false;
    state.inventory.push(old);
    state.equipped[slot] = null;
    return true;
  }

  static useConsumable(state, uid, player) {
    const entry = state.inventory.find((candidate) => candidate.uid === uid);
    const item = InventorySystem.getEntryItem(entry);
    if (!item || item.type !== 'consumable') return { ok: false, reason: 'That item cannot be used.' };

    if (item.id === 'health_potion') {
      const amount = Math.max(28, Math.round(player.maxHp * 0.28));
      player.heal(amount);
      InventorySystem.removeItem(state, uid);
      return { ok: true, item, amount };
    }

    return { ok: false, reason: 'Nothing happened.' };
  }

  static calculateStats(state) {
    const hero = HEROES[state.heroId];
    const base = { ...hero.stats };

    base.maxHp += (state.level - 1) * 13;
    base.maxMp += (state.level - 1) * 7;
    base.attack += (state.level - 1) * 3;
    base.defense += (state.level - 1) * 2;
    base.speed += Math.min(18, (state.level - 1) * 1.5);

    for (const slot of Object.keys(state.equipped)) {
      const item = InventorySystem.getEntryItem(state.equipped[slot]);
      if (!item?.stats) continue;
      for (const [key, value] of Object.entries(item.stats)) {
        base[key] = (base[key] ?? 0) + value;
      }
    }

    base.skillPower = base.skillPower ?? 1;
    return base;
  }

  static clampVitals(state) {
    const stats = InventorySystem.calculateStats(state);
    state.currentHp = clamp(state.currentHp ?? stats.maxHp, 1, stats.maxHp);
    state.currentMp = clamp(state.currentMp ?? stats.maxMp, 0, stats.maxMp);
  }
}
