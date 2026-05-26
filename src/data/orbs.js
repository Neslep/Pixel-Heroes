export const ORBS = {
  fire: {
    id: 'fire',
    name: 'Fire Orb',
    color: 0xff6b1a,
    icon: 'orb_fire',
    summary: 'Adds burn damage to the selected skill.'
  },
  frost: {
    id: 'frost',
    name: 'Frost Orb',
    color: 0x8fd3ff,
    icon: 'orb_frost',
    summary: 'Adds a short slow effect to the selected skill.'
  },
  storm: {
    id: 'storm',
    name: 'Storm Orb',
    color: 0x65f2ff,
    icon: 'orb_storm',
    summary: 'Chains lightning to nearby enemies from the selected skill.'
  },
  guardian: {
    id: 'guardian',
    name: 'Guardian Orb',
    color: 0xffc857,
    icon: 'orb_guardian',
    summary: 'Grants a small shield when the selected skill hits.'
  }
};

export const ORB_ORDER = ['fire', 'frost', 'storm', 'guardian'];
