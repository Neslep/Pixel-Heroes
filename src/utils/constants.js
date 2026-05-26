export const GAME_TITLE = 'Aetheria: Pixel Heroes';

export const STORAGE_KEY = 'aetheria_pixel_heroes_save_v1';

export const WORLD = {
  width: 1920,
  height: 1080,
  tile: 32
};

export const DEPTH = {
  background: 0,
  ground: 10,
  decorBack: 20,
  actors: 50,
  decorFront: 70,
  effects: 90,
  ui: 200,
  overlay: 300
};

export const UI = {
  panel: 0x111827,
  panelAlt: 0x1e293b,
  trim: 0xd6a847,
  trimDark: 0x7a5422,
  text: '#f8f1d2',
  muted: '#9ca3af',
  danger: 0xdc2626,
  hp: 0xef4444,
  mp: 0x38bdf8,
  exp: 0xfacc15,
  shield: 0x7dd3fc
};

export const RARITY = {
  common: { label: 'Common', color: 0xb8c0cc, text: '#d1d5db' },
  rare: { label: 'Rare', color: 0x38bdf8, text: '#7dd3fc' },
  epic: { label: 'Epic', color: 0xc084fc, text: '#d8b4fe' },
  legendary: { label: 'Legendary', color: 0xf59e0b, text: '#fbbf24' }
};

export const AREAS = {
  town: { key: 'town', name: 'Emberfall Haven', subtitle: 'Safe Hub' },
  forest: { key: 'forest', name: 'Verdant Aetherwood', subtitle: 'Corrupted Wilds' },
  entrance: { key: 'entrance', name: 'Runegate Approach', subtitle: 'Dungeon Entrance' },
  dungeon: { key: 'dungeon', name: 'Sanctum of the Broken Star', subtitle: 'Boss Arena' }
};
