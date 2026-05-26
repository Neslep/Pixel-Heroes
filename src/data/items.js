export const ITEMS = {
  iron_sword: {
    id: 'iron_sword',
    name: 'Ironpath Sword',
    type: 'weapon',
    rarity: 'common',
    icon: 'item_sword',
    stats: { attack: 5 },
    value: 22,
    description: 'A reliable blade carried by roadwardens of Aetheria.'
  },
  ember_blade: {
    id: 'ember_blade',
    name: 'Emberglass Blade',
    type: 'weapon',
    rarity: 'rare',
    icon: 'item_sword_fire',
    stats: { attack: 10, skillPower: 0.06 },
    value: 70,
    description: 'A sword with warm crystal veins that flare on impact.'
  },
  moon_staff: {
    id: 'moon_staff',
    name: 'Moonwell Staff',
    type: 'weapon',
    rarity: 'rare',
    icon: 'item_staff',
    stats: { attack: 8, maxMp: 18 },
    value: 72,
    description: 'A ceremonial staff humming with soft blue light.'
  },
  storm_bow: {
    id: 'storm_bow',
    name: 'Stormthread Bow',
    type: 'weapon',
    rarity: 'epic',
    icon: 'item_bow',
    stats: { attack: 14, speed: 8 },
    value: 140,
    description: 'A bow strung with a filament of bottled thunder.'
  },
  guardian_hammer: {
    id: 'guardian_hammer',
    name: 'Oathstone Hammer',
    type: 'weapon',
    rarity: 'epic',
    icon: 'item_hammer',
    stats: { attack: 13, defense: 4 },
    value: 150,
    description: 'A heavy hammer etched with old sentinel marks.'
  },
  leather_armor: {
    id: 'leather_armor',
    name: 'Warden Leather',
    type: 'armor',
    rarity: 'common',
    icon: 'item_armor',
    stats: { defense: 4, maxHp: 10 },
    value: 24,
    description: 'Flexible armor for moving through tangled wilds.'
  },
  crystal_mail: {
    id: 'crystal_mail',
    name: 'Aethercrystal Mail',
    type: 'armor',
    rarity: 'epic',
    icon: 'item_armor_crystal',
    stats: { defense: 10, maxHp: 32, maxMp: 10 },
    value: 165,
    description: 'A luminous mailcoat grown around polished blue shards.'
  },
  vigor_ring: {
    id: 'vigor_ring',
    name: 'Ring of Vigor',
    type: 'accessory',
    rarity: 'rare',
    icon: 'item_ring',
    stats: { maxHp: 26 },
    value: 55,
    description: 'A plain gold ring that steadies the pulse.'
  },
  sunlit_charm: {
    id: 'sunlit_charm',
    name: 'Sunlit Charm',
    type: 'accessory',
    rarity: 'legendary',
    icon: 'item_charm',
    stats: { attack: 9, defense: 6, maxHp: 34, skillPower: 0.1 },
    value: 320,
    description: 'A small relic that glows when corruption is near.'
  },
  crystal_shard: {
    id: 'crystal_shard',
    name: 'Crystal Shard',
    type: 'quest',
    rarity: 'rare',
    icon: 'item_shard',
    stats: {},
    value: 0,
    description: 'A fractured aether crystal needed to open the runegate.'
  },
  health_potion: {
    id: 'health_potion',
    name: 'Health Potion',
    type: 'consumable',
    rarity: 'common',
    icon: 'item_potion_red',
    stats: {},
    value: 16,
    description: 'Restores a burst of health when used.'
  }
};

export const STARTER_ITEMS = ['health_potion', 'leather_armor'];

export const ENEMY_LOOT_TABLE = [
  { value: 'health_potion', weight: 38 },
  { value: 'iron_sword', weight: 12 },
  { value: 'leather_armor', weight: 14 },
  { value: 'vigor_ring', weight: 9 },
  { value: 'ember_blade', weight: 4 },
  { value: 'moon_staff', weight: 4 },
  { value: 'storm_bow', weight: 3 },
  { value: 'guardian_hammer', weight: 3 }
];

export const BOSS_REWARD_TABLE = ['crystal_mail', 'storm_bow', 'guardian_hammer', 'sunlit_charm'];
