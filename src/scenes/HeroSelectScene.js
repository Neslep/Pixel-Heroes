import Phaser from 'phaser';
import { HEROES, HERO_ORDER } from '../data/heroes.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { GAME_TITLE, DEPTH } from '../utils/constants.js';

export class HeroSelectScene extends Phaser.Scene {
  constructor() {
    super('HeroSelectScene');
  }

  create() {
    this.scene.stop('UIScene');
    this.registry.set('uiBlocking', false);
    this.selectedHeroId = HERO_ORDER[0];
    this.cameras.main.setBackgroundColor('#080b16');
    this.createBackground();
    this.createTitle();
    this.createHeroCards();
    this.createButtons();
  }

  createBackground() {
    const w = this.scale.width;
    const h = this.scale.height;
    const bg = this.add.graphics().setDepth(0);
    bg.fillGradientStyle(0x05070f, 0x101827, 0x241532, 0x0b1220, 1);
    bg.fillRect(0, 0, w, h);
    bg.fillStyle(0x38bdf8, 0.1).fillCircle(w * 0.18, h * 0.16, 180);
    bg.fillStyle(0xffa726, 0.12).fillCircle(w * 0.86, h * 0.82, 210);

    for (let i = 0; i < 46; i += 1) {
      const mote = this.add.image(Phaser.Math.Between(0, w), Phaser.Math.Between(0, h), 'spark_star')
        .setTint(Phaser.Math.RND.pick([0xd6a847, 0x38bdf8, 0xc084fc]))
        .setAlpha(Phaser.Math.FloatBetween(0.18, 0.56))
        .setScale(Phaser.Math.FloatBetween(0.4, 1.1))
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(26, 95),
        alpha: Phaser.Math.FloatBetween(0.08, 0.45),
        duration: Phaser.Math.Between(2200, 6200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createTitle() {
    this.add.text(this.scale.width / 2, 52, 'AETHERIA', {
      fontFamily: 'Georgia, serif',
      fontSize: '54px',
      fontStyle: 'bold',
      color: '#ffd166',
      stroke: '#1f1300',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, 98, 'PIXEL HEROES', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '18px',
      letterSpacing: 2,
      color: '#e5e7eb'
    }).setOrigin(0.5);

    this.add.text(this.scale.width / 2, 130, 'Choose a champion for the first cleansing of Aetheria', {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '15px',
      color: '#9ca3af'
    }).setOrigin(0.5);
  }

  createHeroCards() {
    this.cards = [];
    const cardWidth = 254;
    const cardHeight = 430;
    const gap = 22;
    const total = HERO_ORDER.length * cardWidth + (HERO_ORDER.length - 1) * gap;
    const startX = this.scale.width / 2 - total / 2 + cardWidth / 2;
    const y = this.scale.height / 2 + 42;

    HERO_ORDER.forEach((heroId, index) => {
      const hero = HEROES[heroId];
      const x = startX + index * (cardWidth + gap);
      const container = this.add.container(x, y).setSize(cardWidth, cardHeight).setInteractive(
        new Phaser.Geom.Rectangle(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight),
        Phaser.Geom.Rectangle.Contains
      );

      const bg = this.add.graphics();
      this.drawCard(bg, hero, cardWidth, cardHeight, heroId === this.selectedHeroId, false);
      const portrait = this.add.image(0, -125, hero.portrait).setScale(1.55);
      const name = this.add.text(0, -18, hero.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#fff7d6',
        align: 'center',
        wordWrap: { width: 212 }
      }).setOrigin(0.5);
      const role = this.add.text(0, 28, `${hero.role}\n${hero.weapon}`, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '13px',
        color: '#facc15',
        align: 'center',
        lineSpacing: 4
      }).setOrigin(0.5);
      const desc = this.add.text(0, 82, hero.description, {
        fontFamily: 'Trebuchet MS, sans-serif',
        fontSize: '13px',
        color: '#cbd5e1',
        align: 'center',
        wordWrap: { width: 206 },
        lineSpacing: 3
      }).setOrigin(0.5);

      const statLabels = Object.entries(hero.statBars);
      const statGraphics = this.add.graphics();
      this.drawStats(statGraphics, statLabels, -96, 136, hero.color);
      const statText = this.add.container(0, 0);
      statLabels.forEach(([key], statIndex) => {
        statText.add(this.add.text(-96, 132 + statIndex * 15, key.toUpperCase(), {
          fontFamily: 'Trebuchet MS, sans-serif',
          fontSize: '9px',
          color: '#94a3b8'
        }));
      });

      const skills = this.add.container(-84, 190);
      hero.skills.forEach((skillId, skillIndex) => {
        const slot = this.add.image(skillIndex * 42, 0, this.getSkillIcon(skillId)).setScale(0.9);
        skills.add(slot);
      });

      container.add([bg, portrait, name, role, desc, statGraphics, statText, skills]);
      container.on('pointerover', () => {
        this.drawCard(bg, hero, cardWidth, cardHeight, heroId === this.selectedHeroId, true);
        this.tweens.add({ targets: container, y: y - 8, duration: 130, ease: 'Sine.easeOut' });
      });
      container.on('pointerout', () => {
        this.drawCard(bg, hero, cardWidth, cardHeight, heroId === this.selectedHeroId, false);
        this.tweens.add({ targets: container, y, duration: 130, ease: 'Sine.easeOut' });
      });
      container.on('pointerdown', () => {
        this.selectedHeroId = heroId;
        AudioSystem.click();
        this.refreshCards();
      });
      this.cards.push({ heroId, hero, bg, container, cardWidth, cardHeight });
    });
  }

  getSkillIcon(skillId) {
    const map = {
      arin_fire_slash: 'icon_fire_slash',
      arin_spinning_blade: 'icon_spin',
      arin_dash_strike: 'icon_dash',
      arin_phoenix_burst: 'icon_phoenix',
      lyra_moon_bolt: 'icon_moon_bolt',
      lyra_healing_circle: 'icon_heal',
      lyra_protective_barrier: 'icon_barrier',
      lyra_lunar_judgment: 'icon_lunar',
      kael_charged_shot: 'icon_charged',
      kael_lightning_trap: 'icon_trap',
      kael_evasive_roll: 'icon_roll',
      kael_thunder_rain: 'icon_thunder',
      orvan_shield_bash: 'icon_bash',
      orvan_ground_slam: 'icon_slam',
      orvan_taunt_aura: 'icon_taunt',
      orvan_titan_fall: 'icon_titan'
    };
    return map[skillId] ?? 'icon_blade';
  }

  drawCard(g, hero, width, height, selected, hover) {
    g.clear();
    const alpha = hover || selected ? 0.94 : 0.82;
    g.fillStyle(0x0f172a, alpha).fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    g.fillStyle(hero.color, selected ? 0.18 : 0.08).fillRoundedRect(-width / 2 + 7, -height / 2 + 7, width - 14, height - 14, 6);
    g.lineStyle(selected ? 4 : 2, selected ? hero.accent : 0xd6a847, selected ? 1 : 0.64);
    g.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    if (selected) {
      g.lineStyle(2, hero.color, 0.8).strokeRoundedRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, 5);
    }
  }

  drawStats(g, entries, x, y, color) {
    g.clear();
    entries.forEach(([key, value], index) => {
      const rowY = y + index * 15;
      g.fillStyle(0x0b1020, 0.8).fillRect(x + 74, rowY, 90, 7);
      g.fillStyle(color, 0.92).fillRect(x + 74, rowY, (90 * value) / 100, 7);
    });
  }

  refreshCards() {
    this.cards.forEach(({ heroId, hero, bg, cardWidth, cardHeight }) => {
      this.drawCard(bg, hero, cardWidth, cardHeight, heroId === this.selectedHeroId, false);
    });
  }

  createButtons() {
    this.createButton(this.scale.width / 2 - 122, this.scale.height - 58, 220, 48, 'Enter Aetheria', () => {
      const state = SaveSystem.createDefault(this.selectedHeroId);
      this.registry.set('save', state);
      SaveSystem.save(state);
      AudioSystem.click();
      this.cameras.main.fadeOut(300, 5, 7, 15);
      this.time.delayedCall(300, () => this.scene.start('TownScene'));
    });

    const loadButton = this.createButton(this.scale.width / 2 + 122, this.scale.height - 58, 220, 48, 'Load Save', () => {
      const state = SaveSystem.load();
      AudioSystem.click();
      if (!state) {
        this.flashMessage('No local save found.');
        return;
      }
      this.registry.set('save', state);
      this.cameras.main.fadeOut(300, 5, 7, 15);
      this.time.delayedCall(300, () => this.scene.start('TownScene'));
    });
    if (!SaveSystem.hasSave()) loadButton.setAlpha(0.55);

    this.add.text(this.scale.width / 2, this.scale.height - 18, `${GAME_TITLE} is offline and stores progress in this browser.`, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12px',
      color: '#94a3b8'
    }).setOrigin(0.5);
  }

  createButton(x, y, width, height, label, onClick) {
    const container = this.add.container(x, y).setSize(width, height).setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    ).setDepth(DEPTH.ui);
    const bg = this.add.graphics();
    const draw = (hover = false) => {
      bg.clear();
      bg.fillStyle(hover ? 0x263247 : 0x111827, 0.96).fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.lineStyle(2, hover ? 0xfacc15 : 0xd6a847, 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    };
    draw(false);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#fff7d6'
    }).setOrigin(0.5);
    container.add([bg, text]);
    container.on('pointerover', () => draw(true));
    container.on('pointerout', () => draw(false));
    container.on('pointerdown', onClick);
    return container;
  }

  flashMessage(text) {
    const label = this.add.text(this.scale.width / 2, this.scale.height - 112, text, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '16px',
      color: '#ff7373',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(DEPTH.overlay);
    this.tweens.add({ targets: label, alpha: 0, y: label.y - 24, duration: 1400, onComplete: () => label.destroy() });
  }
}
