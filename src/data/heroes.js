export const HEROES = {
  arin: {
    id: 'arin',
    name: 'Arin, the Flameblade',
    shortName: 'Arin',
    role: 'Melee Damage Dealer',
    weapon: 'Flaming Sword',
    color: 0xff5a1f,
    accent: 0xffd166,
    portrait: 'portrait_arin',
    sprite: 'hero_arin',
    description: 'A swift sword fighter who turns close-range pressure into roaring bursts of flame.',
    stats: {
      maxHp: 128,
      maxMp: 54,
      attack: 17,
      defense: 8,
      speed: 158,
      range: 84,
      skillPower: 1.1
    },
    statBars: {
      power: 86,
      defense: 45,
      mobility: 78,
      support: 20
    },
    skills: ['arin_fire_slash', 'arin_spinning_blade', 'arin_dash_strike', 'arin_phoenix_burst']
  },
  lyra: {
    id: 'lyra',
    name: 'Lyra, the Moon Priestess',
    shortName: 'Lyra',
    role: 'Healer / Support Mage',
    weapon: 'Moon Staff',
    color: 0x8fd3ff,
    accent: 0xd7b8ff,
    portrait: 'portrait_lyra',
    sprite: 'hero_lyra',
    description: 'A calm celestial caster who survives through moonlit range, healing, and protective magic.',
    stats: {
      maxHp: 96,
      maxMp: 128,
      attack: 15,
      defense: 6,
      speed: 142,
      range: 310,
      skillPower: 1.06
    },
    statBars: {
      power: 62,
      defense: 38,
      mobility: 62,
      support: 94
    },
    skills: ['lyra_moon_bolt', 'lyra_healing_circle', 'lyra_protective_barrier', 'lyra_lunar_judgment']
  },
  kael: {
    id: 'kael',
    name: 'Kael, the Storm Ranger',
    shortName: 'Kael',
    role: 'Ranged DPS',
    weapon: 'Storm Bow',
    color: 0x4be3ff,
    accent: 0xf7f7ff,
    portrait: 'portrait_kael',
    sprite: 'hero_kael',
    description: 'A mobile archer who layers traps, piercing shots, and lightning strikes from a distance.',
    stats: {
      maxHp: 104,
      maxMp: 80,
      attack: 16,
      defense: 6,
      speed: 170,
      range: 370,
      skillPower: 1.08
    },
    statBars: {
      power: 80,
      defense: 32,
      mobility: 94,
      support: 35
    },
    skills: ['kael_charged_shot', 'kael_lightning_trap', 'kael_evasive_roll', 'kael_thunder_rain']
  },
  orvan: {
    id: 'orvan',
    name: 'Orvan, the Iron Guardian',
    shortName: 'Orvan',
    role: 'Tank / Bruiser',
    weapon: 'Shield and Hammer',
    color: 0xb8a889,
    accent: 0xffc857,
    portrait: 'portrait_orvan',
    sprite: 'hero_orvan',
    description: 'A heavy frontline guardian who wins through armor, control, and earth-shaking impacts.',
    stats: {
      maxHp: 176,
      maxMp: 48,
      attack: 14,
      defense: 16,
      speed: 116,
      range: 92,
      skillPower: 1.0
    },
    statBars: {
      power: 64,
      defense: 96,
      mobility: 34,
      support: 52
    },
    skills: ['orvan_shield_bash', 'orvan_ground_slam', 'orvan_taunt_aura', 'orvan_titan_fall']
  }
};

export const HERO_ORDER = ['arin', 'lyra', 'kael', 'orvan'];
