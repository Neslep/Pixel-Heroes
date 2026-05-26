import Phaser from 'phaser';
import { HEROES } from '../data/heroes.js';
import { SKILLS, BASIC_SKILL_BY_HERO } from '../data/skills.js';
import { ITEMS } from '../data/items.js';
import { ORBS, ORB_ORDER } from '../data/orbs.js';
import { MAIN_QUEST } from '../data/quests.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { GameEvents, EVENTS } from '../utils/events.js';
import { AREAS, DEPTH, RARITY, UI } from '../utils/constants.js';
import { clamp, formatNumber } from '../utils/math.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.logs = [];
    this.activePanel = null;
    this.cooldowns = null;
    this.bossPayload = null;
    this.registry.set('uiBlocking', false);

    this.createHud();
    this.registerEvents();
    this.refreshAll();
  }

  registerEvents() {
    this.eventHandlers = [
      [EVENTS.hudChanged, () => this.refreshAll()],
      [EVENTS.questChanged, () => this.updateQuest()],
      [EVENTS.areaChanged, () => this.updateArea()],
      [EVENTS.bossChanged, (payload) => this.updateBoss(payload)],
      [EVENTS.bossHidden, () => this.hideBoss()],
      [EVENTS.cooldownsChanged, (payload) => this.updateCooldowns(payload)],
      [EVENTS.log, (message) => this.addLog(message)],
      [EVENTS.openPanel, (panel) => this.togglePanel(panel)]
    ];
    this.eventHandlers.forEach(([event, handler]) => GameEvents.on(event, handler));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.eventHandlers.forEach(([event, handler]) => GameEvents.off(event, handler));
      this.registry.set('uiBlocking', false);
    });
  }

  get state() {
    return this.registry.get('save');
  }

  get player() {
    const scenes = this.scene.manager.getScenes(true);
    const gameplayScene = scenes.find((scene) => (
      scene !== this &&
      Object.prototype.hasOwnProperty.call(scene, 'player') &&
      scene.player
    ));
    return gameplayScene?.player ?? null;
  }

  createHud() {
    this.createPlayerHud();
    this.createAreaHud();
    this.createQuestTracker();
    this.createHotbar();
    this.createMenuButtons();
    this.createLogPanel();
    this.createBossHud();
  }

  createPanelBg(x, y, width, height, options = {}) {
    const g = this.add.graphics().setScrollFactor(0).setDepth(options.depth ?? DEPTH.ui);
    g.fillStyle(options.fill ?? UI.panel, options.alpha ?? 0.88).fillRoundedRect(x, y, width, height, options.radius ?? 7);
    g.lineStyle(options.lineWidth ?? 2, options.trim ?? UI.trim, options.lineAlpha ?? 0.85).strokeRoundedRect(x, y, width, height, options.radius ?? 7);
    return g;
  }

  createPlayerHud() {
    this.playerHud = this.add.container(18, 18).setScrollFactor(0).setDepth(DEPTH.ui);
    this.playerHudBg = this.add.graphics();
    this.playerHudBg.fillStyle(UI.panel, 0.88).fillRoundedRect(0, 0, 318, 98, 8);
    this.playerHudBg.lineStyle(2, UI.trim, 0.85).strokeRoundedRect(0, 0, 318, 98, 8);
    this.playerPortrait = this.add.image(47, 49, 'portrait_arin').setDisplaySize(74, 74);
    this.playerName = this.add.text(92, 14, 'Hero', this.textStyle(18, '#fff7d6', true));
    this.playerLevel = this.add.text(278, 19, 'Lv 1', this.textStyle(13, '#facc15', true)).setOrigin(1, 0);
    this.hpBar = this.add.graphics();
    this.mpBar = this.add.graphics();
    this.expBar = this.add.graphics();
    this.hpText = this.add.text(204, 49, '', this.textStyle(11, '#ffffff', true)).setOrigin(0.5);
    this.playerHud.add([this.playerHudBg, this.playerPortrait, this.playerName, this.playerLevel, this.hpBar, this.mpBar, this.expBar, this.hpText]);
  }

  createAreaHud() {
    const x = this.scale.width - 292;
    this.areaContainer = this.add.container(x, 18).setScrollFactor(0).setDepth(DEPTH.ui);
    const bg = this.add.graphics();
    bg.fillStyle(UI.panel, 0.86).fillRoundedRect(0, 0, 274, 118, 8);
    bg.lineStyle(2, UI.trim, 0.85).strokeRoundedRect(0, 0, 274, 118, 8);
    this.areaName = this.add.text(18, 12, 'Area', this.textStyle(18, '#facc15', true));
    this.areaSub = this.add.text(18, 38, 'Subtitle', this.textStyle(12, '#cbd5e1'));
    this.minimap = this.add.graphics();
    this.areaContainer.add([bg, this.areaName, this.areaSub, this.minimap]);
    this.drawMinimap();
  }

  drawMinimap() {
    this.minimap.clear();
    this.minimap.fillStyle(0x05070f, 0.85).fillRoundedRect(176, 18, 78, 78, 6);
    this.minimap.lineStyle(2, 0x475569, 1).strokeRoundedRect(176, 18, 78, 78, 6);
    this.minimap.fillStyle(0x38bdf8, 0.45).fillCircle(215, 57, 25);
    this.minimap.fillStyle(0xfacc15, 1).fillCircle(215, 57, 4);
    this.minimap.fillStyle(0xef4444, 0.85).fillCircle(234, 45, 3).fillCircle(199, 72, 3);
  }

  createQuestTracker() {
    this.questContainer = this.add.container(this.scale.width - 292, 154).setScrollFactor(0).setDepth(DEPTH.ui);
    this.questBg = this.add.graphics();
    this.questTitle = this.add.text(16, 14, MAIN_QUEST.title, this.textStyle(16, '#facc15', true));
    this.questRows = [];
    this.questContainer.add([this.questBg, this.questTitle]);
    this.updateQuest();
  }

  createHotbar() {
    this.hotbar = this.add.container(this.scale.width / 2 - 192, this.scale.height - 88).setScrollFactor(0).setDepth(DEPTH.ui);
    this.hotbarBg = this.add.graphics();
    this.hotbarBg.fillStyle(UI.panel, 0.9).fillRoundedRect(-16, -12, 384, 74, 8);
    this.hotbarBg.lineStyle(2, UI.trim, 0.9).strokeRoundedRect(-16, -12, 384, 74, 8);
    this.hotbar.add(this.hotbarBg);
    this.hotbarSlots = [];

    const labels = ['LMB', '1', '2', '3', '4', 'SPC'];
    for (let i = 0; i < labels.length; i += 1) {
      const x = i * 62;
      const slot = this.add.container(x, 0);
      const bg = this.add.graphics();
      const icon = this.add.image(0, 0, 'icon_blade').setScale(1.25);
      const border = this.add.graphics();
      const label = this.add.text(24, 31, labels[i], this.textStyle(10, '#f8f1d2', true)).setOrigin(1, 0.5);
      const cd = this.add.graphics();
      const cdText = this.add.text(0, 0, '', this.textStyle(13, '#ffffff', true)).setOrigin(0.5);
      slot.add([bg, icon, border, cd, cdText, label]);
      slot.meta = { bg, icon, border, cd, cdText, label, total: 1, remaining: 0 };
      this.hotbar.add(slot);
      this.hotbarSlots.push(slot);
    }
  }

  createMenuButtons() {
    const labels = [
      ['I', 'inventory'],
      ['C', 'character'],
      ['M', 'map'],
      ['Q', 'quest'],
      ['Esc', 'settings']
    ];
    this.menuButtons = this.add.container(this.scale.width - 304, this.scale.height - 72).setScrollFactor(0).setDepth(DEPTH.ui);
    labels.forEach(([label, panel], index) => {
      const button = this.smallButton(index * 56, 0, 46, 46, label, () => this.togglePanel(panel));
      this.menuButtons.add(button);
    });
  }

  createLogPanel() {
    this.logContainer = this.add.container(18, this.scale.height - 166).setScrollFactor(0).setDepth(DEPTH.ui);
    const bg = this.add.graphics();
    bg.fillStyle(UI.panel, 0.68).fillRoundedRect(0, 0, 330, 122, 8);
    bg.lineStyle(1, 0x475569, 0.9).strokeRoundedRect(0, 0, 330, 122, 8);
    this.logText = this.add.text(14, 12, '', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12px',
      color: '#cbd5e1',
      wordWrap: { width: 300 },
      lineSpacing: 3
    });
    this.logContainer.add([bg, this.logText]);
  }

  createBossHud() {
    this.bossContainer = this.add.container(this.scale.width / 2 - 300, 22).setScrollFactor(0).setDepth(DEPTH.ui + 3).setVisible(false);
    const bg = this.add.graphics();
    bg.fillStyle(0x0b0712, 0.85).fillRoundedRect(0, 0, 600, 56, 8);
    bg.lineStyle(2, 0xff6677, 0.9).strokeRoundedRect(0, 0, 600, 56, 8);
    this.bossName = this.add.text(300, 8, 'Corrupted Guardian', this.textStyle(17, '#ff7373', true)).setOrigin(0.5, 0);
    this.bossBar = this.add.graphics();
    this.bossPhase = this.add.text(300, 37, '', this.textStyle(12, '#facc15', true)).setOrigin(0.5, 0);
    this.bossContainer.add([bg, this.bossName, this.bossBar, this.bossPhase]);
  }

  refreshAll() {
    this.updatePlayerHud();
    this.updateArea();
    this.updateQuest();
    this.updateHotbarIcons();
    if (this.activePanel) this.openPanel(this.activePanel.type, true);
  }

  updatePlayerHud() {
    const state = this.state;
    if (!state) return;
    const hero = HEROES[state.heroId];
    const player = this.player;
    const stats = InventorySystem.calculateStats(state);
    const hp = player?.hp ?? state.currentHp ?? stats.maxHp;
    const mp = player?.mp ?? state.currentMp ?? stats.maxMp;

    this.playerPortrait.setTexture(hero.portrait);
    this.playerName.setText(hero.shortName);
    this.playerLevel.setText(`Lv ${state.level}`);

    this.hpBar.clear();
    this.drawBar(this.hpBar, 92, 43, 196, 15, hp / stats.maxHp, UI.hp);
    this.drawBar(this.hpBar, 92, 61, 196, 10, mp / stats.maxMp, UI.mp);
    this.expBar.clear();
    this.drawBar(this.expBar, 92, 77, 196, 7, state.exp / SaveSystem.getExpToNext(state.level), UI.exp);
    this.hpText.setText(`${Math.ceil(hp)} / ${stats.maxHp}`);
  }

  updateArea() {
    const area = AREAS[this.registry.get('currentArea') ?? 'town'];
    if (!area) return;
    this.areaName.setText(area.name);
    this.areaSub.setText(area.subtitle);
  }

  updateQuest() {
    const state = this.state;
    if (!state || !this.questContainer) return;

    this.questRows.forEach((row) => row.destroy());
    this.questRows = [];
    this.questBg.clear();
    this.questBg.fillStyle(UI.panel, 0.84).fillRoundedRect(0, 0, 274, 178, 8);
    this.questBg.lineStyle(2, UI.trim, 0.82).strokeRoundedRect(0, 0, 274, 178, 8);

    QuestSystem.getObjectiveRows(state).forEach((objective, index) => {
      const y = 48 + index * 29;
      const color = objective.complete ? '#86efac' : objective.active ? '#fff7d6' : '#94a3b8';
      const mark = objective.complete ? '✓' : objective.active ? '•' : '-';
      const row = this.add.text(18, y, `${mark} ${objective.label} ${objective.value}/${objective.target}`, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '12px',
        color,
        wordWrap: { width: 236 }
      });
      this.questContainer.add(row);
      this.questRows.push(row);
    });
  }

  updateHotbarIcons() {
    const state = this.state;
    if (!state) return;
    const hero = HEROES[state.heroId];
    const icons = [
      SKILLS[BASIC_SKILL_BY_HERO[state.heroId]].icon,
      ...hero.skills.map((skillId) => SKILLS[skillId].icon),
      'icon_roll'
    ];

    this.hotbarSlots.forEach((slot, index) => {
      slot.meta.icon.setTexture(icons[index]);
      this.drawSlot(slot, index >= 1 && index <= 4 && state.orb.skillSlot === index ? ORBS[state.orb.id]?.color : UI.trim);
    });
  }

  updateCooldowns(payload) {
    this.cooldowns = payload;
    if (!payload) return;
    const data = [payload.basic, ...payload.skills, payload.dodge];
    this.hotbarSlots.forEach((slot, index) => {
      const cd = data[index] ?? { remaining: 0, total: 1 };
      slot.meta.remaining = cd.remaining;
      slot.meta.total = cd.total;
      this.drawSlot(slot, slot.meta.borderColor ?? UI.trim);
    });
  }

  drawSlot(slot, borderColor = UI.trim) {
    const { bg, border, cd, cdText, remaining, total } = slot.meta;
    slot.meta.borderColor = borderColor;
    bg.clear();
    bg.fillStyle(0x0f172a, 0.94).fillRoundedRect(-25, -25, 50, 50, 5);
    border.clear();
    border.lineStyle(2, borderColor, remaining > 0 ? 0.45 : 1).strokeRoundedRect(-25, -25, 50, 50, 5);
    cd.clear();
    cdText.setText('');
    if (remaining > 0) {
      const pct = clamp(remaining / total, 0, 1);
      cd.fillStyle(0x000000, 0.7).fillRect(-25, -25, 50, 50 * pct);
      cdText.setText(remaining >= 1 ? remaining.toFixed(0) : remaining.toFixed(1));
    } else {
      border.lineStyle(1, 0xffffff, 0.28).strokeRoundedRect(-20, -20, 40, 40, 4);
    }
  }

  updateBoss(payload) {
    this.bossPayload = payload;
    this.bossContainer.setVisible(true);
    this.bossName.setText(payload.name);
    this.bossPhase.setText(payload.rage ? 'RAGE MODE' : `Phase ${payload.phase}`);
    this.bossBar.clear();
    this.drawBar(this.bossBar, 24, 31, 552, 13, payload.hp / payload.maxHp, payload.rage ? 0xff3344 : 0xdc2626);
  }

  hideBoss() {
    this.bossContainer.setVisible(false);
  }

  drawBar(g, x, y, width, height, pct, color) {
    g.fillStyle(0x05070f, 0.88).fillRoundedRect(x, y, width, height, 3);
    g.fillStyle(color, 0.95).fillRoundedRect(x, y, width * clamp(pct, 0, 1), height, 3);
    g.lineStyle(1, 0xffffff, 0.22).strokeRoundedRect(x, y, width, height, 3);
  }

  addLog(message) {
    this.logs.unshift(message);
    this.logs = this.logs.slice(0, 6);
    this.logText.setText(this.logs.join('\n'));
  }

  togglePanel(type) {
    if (this.activePanel?.type === type) {
      this.closePanel();
    } else {
      this.openPanel(type);
    }
  }

  closePanel() {
    this.activePanel?.container.destroy();
    this.activePanel = null;
    this.registry.set('uiBlocking', false);
  }

  openPanel(type, refreshing = false) {
    if (this.activePanel) this.activePanel.container.destroy();
    this.registry.set('uiBlocking', true);

    const builders = {
      inventory: () => this.buildInventoryPanel(),
      character: () => this.buildCharacterPanel(),
      quest: () => this.buildQuestPanel(),
      map: () => this.buildMapPanel(),
      settings: () => this.buildSettingsPanel()
    };
    const container = builders[type]?.();
    if (!container) return;
    this.activePanel = { type, container };
    if (!refreshing) {
      container.setAlpha(0).setScale(0.96);
      this.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 120, ease: 'Sine.easeOut' });
    }
  }

  buildPanelShell(width, height, title) {
    const x = this.scale.width / 2;
    const y = this.scale.height / 2;
    const c = this.add.container(x, y).setScrollFactor(0).setDepth(DEPTH.overlay);
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.96).fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    bg.lineStyle(3, UI.trim, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    const titleText = this.add.text(-width / 2 + 22, -height / 2 + 16, title, this.textStyle(20, '#facc15', true));
    const close = this.smallButton(width / 2 - 44, -height / 2 + 18, 32, 30, 'X', () => this.closePanel());
    c.add([bg, titleText, close]);
    return c;
  }

  buildInventoryPanel() {
    const state = this.state;
    const c = this.buildPanelShell(760, 498, 'Inventory & Equipment');
    const gold = this.add.text(-346, -196, `Gold: ${formatNumber(state.gold)}`, this.textStyle(15, '#facc15', true));
    c.add(gold);

    const tooltip = this.add.text(94, 104, 'Hover an item to inspect it. Click to equip or use.', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      color: '#cbd5e1',
      wordWrap: { width: 300 },
      lineSpacing: 4
    });
    c.add(tooltip);

    const gridX = -336;
    const gridY = -148;
    const slotSize = 46;
    for (let i = 0; i < 30; i += 1) {
      const x = gridX + (i % 6) * (slotSize + 8);
      const y = gridY + Math.floor(i / 6) * (slotSize + 8);
      const entry = state.inventory[i];
      const slot = this.itemSlot(x, y, slotSize, entry, tooltip, () => {
        if (!entry) return;
        const item = ITEMS[entry.itemId];
        let result;
        if (item.type === 'consumable') result = InventorySystem.useConsumable(state, entry.uid, this.player);
        else result = InventorySystem.equip(state, entry.uid);
        if (result?.ok) {
          this.player?.refreshStats(false);
          SaveSystem.save(state);
          GameEvents.emit(EVENTS.hudChanged);
          this.addLog(item.type === 'consumable' ? `Used ${item.name}.` : `Equipped ${item.name}.`);
          this.openPanel('inventory', true);
        }
      });
      c.add(slot);
    }

    const equipTitle = this.add.text(94, -176, 'Equipment', this.textStyle(17, '#fff7d6', true));
    c.add(equipTitle);
    ['weapon', 'armor', 'accessory'].forEach((slotName, index) => {
      const y = -126 + index * 70;
      c.add(this.add.text(94, y + 9, slotName.toUpperCase(), this.textStyle(12, '#94a3b8', true)));
      const entry = state.equipped[slotName];
      const slot = this.itemSlot(214, y, 52, entry, tooltip, () => {
        if (InventorySystem.unequip(state, slotName)) {
          this.player?.refreshStats(false);
          SaveSystem.save(state);
          GameEvents.emit(EVENTS.hudChanged);
          this.openPanel('inventory', true);
        }
      });
      c.add(slot);
    });

    return c;
  }

  itemSlot(x, y, size, entry, tooltip, onClick) {
    const item = InventorySystem.getEntryItem(entry);
    const container = this.add.container(x, y).setSize(size, size).setInteractive(
      new Phaser.Geom.Rectangle(-size / 2, -size / 2, size, size),
      Phaser.Geom.Rectangle.Contains
    );
    const bg = this.add.graphics();
    const rarity = item ? RARITY[item.rarity] : null;
    bg.fillStyle(0x111827, 0.95).fillRoundedRect(-size / 2, -size / 2, size, size, 5);
    bg.lineStyle(2, rarity?.color ?? 0x475569, item ? 1 : 0.65).strokeRoundedRect(-size / 2, -size / 2, size, size, 5);
    container.add(bg);
    if (item) container.add(this.add.image(0, 0, item.icon).setScale(size / 34 * 0.82).setTint(rarity.color));

    container.on('pointerover', () => {
      if (!item) return;
      const stats = Object.entries(item.stats ?? {}).map(([key, value]) => `${key}: +${value}`).join('\n');
      tooltip.setText(`${item.name}\n${rarity.label} ${item.type}\n${stats || item.description}`);
    });
    container.on('pointerdown', () => {
      AudioSystem.click();
      onClick?.();
    });
    return container;
  }

  buildCharacterPanel() {
    const state = this.state;
    const stats = InventorySystem.calculateStats(state);
    const c = this.buildPanelShell(690, 470, 'Character & Skill Orbs');
    const hero = HEROES[state.heroId];
    c.add(this.add.image(-250, -92, hero.portrait).setScale(1.5));
    c.add(this.add.text(-300, 10, hero.name, this.textStyle(20, '#fff7d6', true)));
    c.add(this.add.text(-300, 38, hero.role, this.textStyle(14, '#facc15')));

    const rows = [
      ['Attack', stats.attack],
      ['Defense', stats.defense],
      ['Max HP', stats.maxHp],
      ['Max MP', stats.maxMp],
      ['Move Speed', Math.round(stats.speed)],
      ['Skill Power', `${Math.round((stats.skillPower ?? 1) * 100)}%`]
    ];
    rows.forEach(([label, value], index) => {
      c.add(this.add.text(-300, 82 + index * 26, label, this.textStyle(13, '#94a3b8')));
      c.add(this.add.text(-108, 82 + index * 26, String(value), this.textStyle(13, '#fff7d6', true)));
    });

    c.add(this.add.text(30, -156, 'Equipped Orb', this.textStyle(16, '#facc15', true)));
    c.add(this.add.text(30, -128, ORBS[state.orb.id]?.summary ?? 'Choose an orb.', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12px',
      color: '#cbd5e1',
      wordWrap: { width: 290 }
    }));

    ORB_ORDER.forEach((orbId, index) => {
      const orb = ORBS[orbId];
      const button = this.iconButton(54 + index * 58, -62, orb.icon, orb.color, () => {
        state.orb.id = orbId;
        SaveSystem.save(state);
        GameEvents.emit(EVENTS.hudChanged);
        this.openPanel('character', true);
      }, state.orb.id === orbId);
      c.add(button);
    });

    c.add(this.add.text(30, 18, 'Apply orb to skill slot', this.textStyle(15, '#fff7d6', true)));
    [1, 2, 3, 4].forEach((slot) => {
      const skill = SKILLS[hero.skills[slot - 1]];
      const b = this.smallButton(30 + (slot - 1) * 72, 58, 56, 42, String(slot), () => {
        state.orb.skillSlot = slot;
        SaveSystem.save(state);
        GameEvents.emit(EVENTS.hudChanged);
        this.openPanel('character', true);
      }, state.orb.skillSlot === slot);
      c.add(b);
      c.add(this.add.image(30 + (slot - 1) * 72, 110, skill.icon).setScale(0.9));
    });

    return c;
  }

  buildQuestPanel() {
    const c = this.buildPanelShell(590, 390, 'Quest Log');
    c.add(this.add.text(-252, -132, MAIN_QUEST.title, this.textStyle(22, '#fff7d6', true)));
    QuestSystem.getObjectiveRows(this.state).forEach((objective, index) => {
      const y = -78 + index * 55;
      const color = objective.complete ? '#86efac' : objective.active ? '#facc15' : '#94a3b8';
      c.add(this.add.text(-252, y, `${objective.complete ? '✓' : '•'} ${objective.label}`, this.textStyle(16, color, objective.active)));
      c.add(this.add.text(188, y, `${objective.value}/${objective.target}`, this.textStyle(16, color, true)).setOrigin(1, 0));
    });
    return c;
  }

  buildMapPanel() {
    const c = this.buildPanelShell(600, 420, 'Map');
    const g = this.add.graphics();
    g.fillStyle(0x111827, 1).fillRoundedRect(-240, -130, 480, 250, 8);
    g.lineStyle(2, 0x475569, 1).strokeRoundedRect(-240, -130, 480, 250, 8);
    g.fillStyle(0x3b352b, 1).fillRoundedRect(-205, -18, 110, 76, 6);
    g.fillStyle(0x2d5a32, 1).fillRoundedRect(-70, -90, 180, 145, 6);
    g.fillStyle(0x1f2431, 1).fillRoundedRect(135, -48, 78, 92, 6);
    g.fillStyle(0x6d28d9, 1).fillCircle(190, 82, 34);
    c.add(g);
    c.add(this.add.text(-178, 14, 'Town', this.textStyle(13, '#fff7d6', true)));
    c.add(this.add.text(-20, -36, 'Forest', this.textStyle(13, '#fff7d6', true)));
    c.add(this.add.text(142, -6, 'Gate', this.textStyle(13, '#fff7d6', true)));
    c.add(this.add.text(154, 78, 'Sanctum', this.textStyle(13, '#fff7d6', true)));
    return c;
  }

  buildSettingsPanel() {
    const c = this.buildPanelShell(520, 430, 'Settings');
    c.add(this.add.text(-220, -132, 'Music Volume', this.textStyle(14, '#94a3b8')));
    c.add(this.add.text(80, -132, 'Placeholder 35%', this.textStyle(14, '#fff7d6', true)));
    c.add(this.add.text(-220, -98, 'Sound Volume', this.textStyle(14, '#94a3b8')));
    c.add(this.add.text(80, -98, 'Placeholder 80%', this.textStyle(14, '#fff7d6', true)));
    c.add(this.add.text(-220, -64, 'Graphics', this.textStyle(14, '#94a3b8')));
    c.add(this.add.text(80, -64, 'High Pixel Glow', this.textStyle(14, '#fff7d6', true)));

    const controls = 'WASD move | Mouse aim | LMB attack | 1-4 skills | Space dodge | I inventory | C character | M map | Q quest | Esc settings';
    c.add(this.add.text(-220, -16, controls, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '13px',
      color: '#cbd5e1',
      wordWrap: { width: 430 },
      lineSpacing: 5
    }));

    c.add(this.smallButton(-158, 112, 150, 44, 'Save Game', () => {
      SaveSystem.save(this.state);
      this.addLog('Manual save complete.');
      this.closePanel();
    }));
    c.add(this.smallButton(14, 112, 150, 44, 'Load Game', () => {
      const state = SaveSystem.load();
      if (state) {
        this.registry.set('save', state);
        this.addLog('Save loaded.');
        this.closePanel();
        const active = this.scene.manager.getScenes(true).find((scene) => scene.scene.key !== 'UIScene');
        active?.scene.restart();
      }
    }));
    c.add(this.smallButton(186, 112, 150, 44, 'Title', () => {
      SaveSystem.save(this.state);
      this.closePanel();
      const active = this.scene.manager.getScenes(true).find((scene) => scene.scene.key !== 'UIScene');
      active?.scene.start('HeroSelectScene');
    }));
    c.add(this.smallButton(14, 170, 150, 38, 'Reset Save', () => {
      SaveSystem.reset();
      this.addLog('Local save reset.');
      this.closePanel();
      const active = this.scene.manager.getScenes(true).find((scene) => scene.scene.key !== 'UIScene');
      active?.scene.start('HeroSelectScene');
    }));
    return c;
  }

  smallButton(x, y, width, height, label, onClick, selected = false) {
    const c = this.add.container(x, y).setSize(width, height).setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    const bg = this.add.graphics();
    const draw = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover || selected ? 0x263247 : 0x111827, 0.96).fillRoundedRect(-width / 2, -height / 2, width, height, 5);
      bg.lineStyle(2, hover || selected ? 0xfacc15 : 0xd6a847, 0.9).strokeRoundedRect(-width / 2, -height / 2, width, height, 5);
    };
    draw(false);
    const t = this.add.text(0, 0, label, this.textStyle(width < 60 ? 14 : 15, '#fff7d6', true)).setOrigin(0.5);
    c.add([bg, t]);
    c.on('pointerover', () => draw(true));
    c.on('pointerout', () => draw(false));
    c.on('pointerdown', () => {
      AudioSystem.click();
      onClick?.();
    });
    return c;
  }

  iconButton(x, y, texture, color, onClick, selected = false) {
    const c = this.add.container(x, y).setSize(48, 48).setInteractive(
      new Phaser.Geom.Rectangle(-24, -24, 48, 48),
      Phaser.Geom.Rectangle.Contains
    );
    const bg = this.add.graphics();
    const draw = (hover = false) => {
      bg.clear();
      bg.fillStyle(0x111827, 0.95).fillRoundedRect(-24, -24, 48, 48, 5);
      bg.lineStyle(2, hover || selected ? color : 0x475569, 1).strokeRoundedRect(-24, -24, 48, 48, 5);
    };
    draw(false);
    c.add([bg, this.add.image(0, 0, texture).setTint(color).setScale(1.05)]);
    c.on('pointerover', () => draw(true));
    c.on('pointerout', () => draw(false));
    c.on('pointerdown', () => {
      AudioSystem.click();
      onClick?.();
    });
    return c;
  }

  textStyle(size, color, bold = false) {
    return {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: `${size}px`,
      fontStyle: bold ? 'bold' : 'normal',
      color
    };
  }
}
