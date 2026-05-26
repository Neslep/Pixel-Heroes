import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { LootDrop } from '../entities/LootDrop.js';
import { NPC } from '../entities/NPC.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { LootSystem } from '../systems/LootSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { AREAS, DEPTH, WORLD } from '../utils/constants.js';
import { EVENTS, GameEvents } from '../utils/events.js';
import { rand, randInt } from '../utils/math.js';

export class BaseGameplayScene extends Phaser.Scene {
  constructor(key, areaKey) {
    super(key);
    this.areaKey = areaKey;
  }

  createBase(options = {}) {
    this.state = this.registry.get('save');
    if (!this.state) {
      this.scene.start('HeroSelectScene');
      return false;
    }

    InventorySystem.clampVitals(this.state);
    this.state.lastArea = this.areaKey;
    this.registry.set('currentArea', this.areaKey);
    GameEvents.emit(EVENTS.areaChanged, AREAS[this.areaKey]);

    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.fadeIn(350, 5, 7, 15);

    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
    this.lootDrops = this.physics.add.group();
    this.npcs = this.add.group();

    this.createGround(options.palette ?? 'forest');
    this.createAmbient(options.ambientColor ?? 0x7dd3fc);

    const spawn = options.spawn ?? { x: WORLD.width / 2, y: WORLD.height / 2 };
    this.player = new Player(this, spawn.x, spawn.y, this.state);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown() && !this.registry.get('uiBlocking')) this.player.tryBasic();
    });

    this.input.keyboard.on('keydown-I', () => GameEvents.emit(EVENTS.openPanel, 'inventory'));
    this.input.keyboard.on('keydown-C', () => GameEvents.emit(EVENTS.openPanel, 'character'));
    this.input.keyboard.on('keydown-M', () => GameEvents.emit(EVENTS.openPanel, 'map'));
    this.input.keyboard.on('keydown-Q', () => GameEvents.emit(EVENTS.openPanel, 'quest'));
    this.input.keyboard.on('keydown-ESC', () => GameEvents.emit(EVENTS.openPanel, 'settings'));

    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');
    else GameEvents.emit(EVENTS.hudChanged);

    this.log(`Entered ${AREAS[this.areaKey].name}.`);
    this.autoSave();
    return true;
  }

  createGround(palette) {
    const colorMap = {
      town: [0x3b352b, 0x4b3f2c, 0x6b512d, 0x263025],
      forest: [0x203d24, 0x2d5a32, 0x376836, 0x18321e],
      entrance: [0x1f2431, 0x2d3144, 0x37304a, 0x151923],
      dungeon: [0x141621, 0x1f2332, 0x27213a, 0x0b0d14]
    }[palette] ?? [0x203d24, 0x2d5a32, 0x376836, 0x18321e];

    this.cameras.main.setBackgroundColor(colorMap[0]);
    const gfx = this.add.graphics().setDepth(DEPTH.background);
    gfx.fillStyle(colorMap[0], 1).fillRect(0, 0, WORLD.width, WORLD.height);

    for (let x = 0; x < WORLD.width; x += 32) {
      for (let y = 0; y < WORLD.height; y += 32) {
        const color = colorMap[(x / 32 + y / 32 + randInt(0, 2)) % colorMap.length];
        gfx.fillStyle(color, 0.28).fillRect(x, y, 32, 32);
      }
    }

    for (let i = 0; i < 190; i += 1) {
      const x = rand(30, WORLD.width - 30);
      const y = rand(30, WORLD.height - 30);
      gfx.fillStyle(colorMap[randInt(1, colorMap.length - 1)], 0.42);
      gfx.fillRect(x, y, randInt(3, 14), randInt(2, 8));
    }

    if (palette === 'town') this.createStonePath();
    if (palette === 'dungeon') this.createArenaFloor();
  }

  createStonePath() {
    const gfx = this.add.graphics().setDepth(DEPTH.ground);
    gfx.fillStyle(0x6b5a3f, 0.56);
    for (let x = 120; x < WORLD.width - 120; x += 42) {
      gfx.fillRoundedRect(x, WORLD.height / 2 - 32 + Math.sin(x * 0.02) * 12, 34, 26, 3);
    }
    for (let y = 170; y < WORLD.height - 120; y += 42) {
      gfx.fillRoundedRect(WORLD.width / 2 - 18 + Math.sin(y * 0.02) * 7, y, 36, 28, 3);
    }
  }

  createArenaFloor() {
    const gfx = this.add.graphics().setDepth(DEPTH.ground);
    gfx.lineStyle(4, 0x4338ca, 0.35).strokeCircle(WORLD.width / 2, WORLD.height / 2, 335);
    gfx.lineStyle(2, 0x6d28d9, 0.28).strokeCircle(WORLD.width / 2, WORLD.height / 2, 228);
    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18;
      gfx.lineStyle(2, 0x7c3aed, 0.18).lineBetween(
        WORLD.width / 2,
        WORLD.height / 2,
        WORLD.width / 2 + Math.cos(angle) * 350,
        WORLD.height / 2 + Math.sin(angle) * 350
      );
    }
  }

  createAmbient(color) {
    for (let i = 0; i < 32; i += 1) {
      const mote = this.add.image(rand(0, WORLD.width), rand(0, WORLD.height), 'spark_star')
        .setTint(color)
        .setAlpha(rand(0.12, 0.42))
        .setScale(rand(0.35, 0.9))
        .setDepth(DEPTH.effects - 10)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: mote,
        y: mote.y - rand(24, 80),
        alpha: rand(0.08, 0.48),
        duration: rand(2400, 5800),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  addDecor(texture, x, y, scale = 1, tint = 0xffffff, depth = DEPTH.decorBack) {
    const decor = this.add.image(x, y, texture).setScale(scale).setTint(tint).setDepth(depth);
    return decor;
  }

  addNPC(x, y, config) {
    const npc = new NPC(this, x, y, config);
    this.npcs.add(npc);
    return npc;
  }

  getLivingEnemies() {
    return this.enemies?.getChildren().filter((enemy) => enemy.active && !enemy.isDead) ?? [];
  }

  onEnemyKilled(enemy) {
    const leveled = SaveSystem.addExp(this.state, enemy.config.exp ?? 10);
    if (leveled) {
      this.player.refreshStats(true);
      EffectsSystem.notification(this, `LEVEL ${this.state.level}`, '#facc15');
      AudioSystem.levelUp();
    }

    const gold = LootSystem.rollEnemyGold(enemy.config);
    this.spawnGold(enemy.x + rand(-16, 16), enemy.y + rand(-16, 16), gold);
    LootSystem.rollEnemyItems(this.state).forEach((itemId, index) => {
      this.spawnLoot(enemy.x + rand(-28, 28), enemy.y + rand(-28, 28) - index * 5, itemId);
    });

    if (QuestSystem.addKill(this.state)) {
      EffectsSystem.notification(this, `Monster defeated ${this.state.quest.kills}/10`, '#f8f1d2');
      GameEvents.emit(EVENTS.questChanged);
    }

    this.autoSave();
    GameEvents.emit(EVENTS.hudChanged);
  }

  spawnGold(x, y, amount) {
    const drop = new LootDrop(this, x, y, null, amount);
    this.lootDrops.add(drop);
  }

  spawnLoot(x, y, itemId) {
    const drop = new LootDrop(this, x, y, itemId);
    this.lootDrops.add(drop);
  }

  pickupLoot(drop) {
    if (!drop.active) return;
    if (drop.gold > 0) {
      this.state.gold += drop.gold;
      EffectsSystem.floatingText(this, drop.x, drop.y - 12, `+${drop.gold}g`, '#facc15', 16);
      this.log(`Picked up ${drop.gold} gold.`);
    } else if (drop.itemId) {
      InventorySystem.addItem(this.state, drop.itemId);
      if (drop.itemId === 'crystal_shard' && QuestSystem.addShard(this.state)) {
        EffectsSystem.notification(this, `Crystal shard ${this.state.quest.shards}/3`, '#7dd3fc');
        GameEvents.emit(EVENTS.questChanged);
      }
      EffectsSystem.floatingText(this, drop.x, drop.y - 12, drop.item.name, '#f8f1d2', 14);
      this.log(`Loot acquired: ${drop.item.name}.`);
    }
    AudioSystem.loot();
    EffectsSystem.burst(this, drop.x, drop.y, drop.rarityColor, 14, 95);
    drop.destroy();
    this.autoSave();
    GameEvents.emit(EVENTS.hudChanged);
  }

  log(message) {
    GameEvents.emit(EVENTS.log, message);
  }

  autoSave() {
    SaveSystem.save(this.state);
  }

  returnToTownAfterDefeat() {
    this.state.currentHp = Math.max(1, Math.round(InventorySystem.calculateStats(this.state).maxHp * 0.55));
    this.state.currentMp = Math.round(InventorySystem.calculateStats(this.state).maxMp * 0.5);
    SaveSystem.save(this.state);
    this.scene.start('TownScene');
  }

  update(time, delta) {
    this.player?.update(time, delta);
    this.enemies?.getChildren().forEach((enemy) => enemy.update?.(time, delta));
    this.projectiles?.getChildren().forEach((projectile) => projectile.update?.(time, delta));
    this.enemyProjectiles?.getChildren().forEach((projectile) => projectile.update?.(time, delta));
    this.lootDrops?.getChildren().forEach((drop) => drop.update?.(time, delta));
    this.npcs?.getChildren().forEach((npc) => npc.update?.(time, delta));
  }
}
