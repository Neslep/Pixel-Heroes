# Aetheria: Pixel Heroes

Offline single-player browser prototype for a pixel fantasy action RPG vertical slice.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

Production build:

```bash
npm run build
```

## Controls

- `WASD`: move in 8 directions
- Mouse: aim
- Left click: basic attack
- `1`, `2`, `3`, `4`: hero skills
- `Space`: dodge dash
- `I`: inventory and equipment
- `C`: character and orb panel
- `M`: map
- `Q`: quest log
- `Esc`: settings

## Current Vertical Slice

- Hero selection with four original heroes
- Town hub with NPC message log, quest board, shop/save placeholders, and portals
- Forest combat zone with enemies, loot, gold, EXP, level ups, quest progress, and crystal shards
- Dungeon entrance transition area
- Solo boss fight against the Corrupted Guardian with phases, summons, AoE telegraphs, rage mode, and boss HP bar
- Victory reward screen with EXP, gold, and rarity-colored loot cards
- Inventory, equipment bonuses, quest tracker, skill hotbar cooldowns, minimap placeholder, combat log, settings panel
- Local save/load/reset using `localStorage`

## Project Structure

- `src/scenes`: Phaser scenes and UI flow
- `src/entities`: Player, enemies, boss, projectiles, loot drops, NPCs
- `src/systems`: combat, skills, inventory, quest, loot, save, audio, effects
- `src/data`: heroes, skills, enemies, items, quests, orbs
- `src/utils`: constants, event bus, math helpers

## Expanding Later

Add new content through `src/data` first, then wire it into scenes or systems. New maps can extend `BaseGameplayScene`; new skills should be added in `data/skills.js` and implemented in `SkillSystem`; new enemy behaviors belong in `Enemy.js` or a derived class.
