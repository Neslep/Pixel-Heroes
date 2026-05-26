import Phaser from 'phaser';
import { HEROES } from '../data/heroes.js';
import { BASIC_SKILL_BY_HERO, SKILLS } from '../data/skills.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { GameEvents, EVENTS } from '../utils/events.js';
import { DEPTH } from '../utils/constants.js';
import { clamp, vecFromAngle } from '../utils/math.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, state) {
    const hero = HEROES[state.heroId];
    super(scene, x, y, hero.sprite);

    this.scene = scene;
    this.state = state;
    this.heroId = state.heroId;
    this.hero = hero;
    this.cooldowns = {};
    this.invulnerableUntil = 0;
    this.dashUntil = 0;
    this.dashVector = { x: 0, y: 0 };
    this.hitRadius = 18;
    this.shield = 0;
    this.shieldSprite = null;
    this.dead = false;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.actors + 5);
    this.setCollideWorldBounds(true);
    this.setScale(1.6);
    this.body.setCircle(12, 4, 8);
    this.body.setDrag(900, 900);
    this.body.setMaxVelocity(520, 520);

    this.keys = scene.input.keyboard.addKeys({
      up: 'W',
      left: 'A',
      down: 'S',
      right: 'D',
      one: 'ONE',
      two: 'TWO',
      three: 'THREE',
      four: 'FOUR',
      space: 'SPACE'
    });

    this.refreshStats(true);
    this.createNameplate();
    GameEvents.emit(EVENTS.hudChanged);
  }

  createNameplate() {
    this.nameplate = this.scene.add.text(this.x, this.y - 46, this.hero.shortName, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#fff7d6',
      stroke: '#0a0a0a',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(DEPTH.actors + 8);
  }

  refreshStats(fullRestore = false) {
    this.stats = InventorySystem.calculateStats(this.state);
    this.maxHp = this.stats.maxHp;
    this.maxMp = this.stats.maxMp;

    if (fullRestore) {
      this.hp = this.maxHp;
      this.mp = this.maxMp;
    } else {
      this.hp = clamp(this.hp ?? this.state.currentHp ?? this.maxHp, 1, this.maxHp);
      this.mp = clamp(this.mp ?? this.state.currentMp ?? this.maxMp, 0, this.maxMp);
    }

    this.state.currentHp = this.hp;
    this.state.currentMp = this.mp;
    GameEvents.emit(EVENTS.hudChanged);
  }

  getAimAngle() {
    const pointer = this.scene.input.activePointer;
    return Math.atan2(pointer.worldY - this.y, pointer.worldX - this.x);
  }

  update(time, delta) {
    if (this.dead) return;

    if (this.nameplate) this.nameplate.setPosition(this.x, this.y - 46);
    if (this.shieldSprite) this.shieldSprite.setPosition(this.x, this.y);

    this.regen(delta);
    this.handleMovement(time);
    this.handleHotkeys();
    this.updateFacing();
    this.publishCooldowns(time);
  }

  regen(delta) {
    const mpRegen = (7 + this.state.level * 0.8) * (delta / 1000);
    if (this.mp < this.maxMp) {
      this.mp = clamp(this.mp + mpRegen, 0, this.maxMp);
      this.state.currentMp = this.mp;
    }
  }

  handleMovement(time) {
    if (time < this.dashUntil) {
      this.setVelocity(this.dashVector.x, this.dashVector.y);
      return;
    }

    const x = Number(this.keys.right.isDown) - Number(this.keys.left.isDown);
    const y = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);
    const direction = new Phaser.Math.Vector2(x, y);

    if (direction.lengthSq() > 0) {
      direction.normalize().scale(this.stats.speed);
      this.setVelocity(direction.x, direction.y);
    } else {
      this.setVelocity(0, 0);
    }
  }

  handleHotkeys() {
    if (this.scene.registry.get('uiBlocking')) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.trySkill(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.trySkill(2);
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.trySkill(3);
    if (Phaser.Input.Keyboard.JustDown(this.keys.four)) this.trySkill(4);
    if (Phaser.Input.Keyboard.JustDown(this.keys.space)) this.tryDodge();
  }

  updateFacing() {
    const angle = this.getAimAngle();
    this.setFlipX(Math.cos(angle) < 0);
  }

  getCooldownRemaining(id) {
    const end = this.cooldowns[id] ?? 0;
    return Math.max(0, end - this.scene.time.now);
  }

  isReady(id) {
    return this.getCooldownRemaining(id) <= 0;
  }

  setCooldown(id, seconds) {
    this.cooldowns[id] = this.scene.time.now + seconds * 1000;
  }

  canCast(skill) {
    if (!skill || this.dead) return false;
    if (!this.isReady(skill.id)) return false;
    return this.mp >= (skill.mpCost ?? 0);
  }

  spend(skill) {
    this.mp = clamp(this.mp - (skill.mpCost ?? 0), 0, this.maxMp);
    this.state.currentMp = this.mp;
    this.setCooldown(skill.id, skill.cooldown);
    GameEvents.emit(EVENTS.hudChanged);
  }

  tryBasic() {
    const skill = SKILLS[BASIC_SKILL_BY_HERO[this.heroId]];
    if (!this.canCast(skill)) return false;
    this.spend(skill);
    SkillSystem.castBasic(this.scene, this);
    AudioSystem.attack();
    return true;
  }

  trySkill(slot) {
    const skillId = this.hero.skills[slot - 1];
    const skill = SKILLS[skillId];
    if (!this.canCast(skill)) {
      AudioSystem.tone(140, 0.08, 'sawtooth', 0.04);
      return false;
    }
    this.spend(skill);
    SkillSystem.castSlot(this.scene, this, slot);
    return true;
  }

  tryDodge() {
    if (!this.isReady('dodge') || this.dead) return false;
    this.setCooldown('dodge', 3.4);
    this.startDash(this.getAimAngle(), 185, 160, 310);
    EffectsSystem.burst(this.scene, this.x, this.y, 0xffffff, 8, 96);
    GameEvents.emit(EVENTS.cooldownsChanged, this.getCooldownSnapshot());
    return true;
  }

  startDash(angle, distance, duration = 160, speedOverride = null) {
    const speed = speedOverride ?? distance / (duration / 1000);
    const vector = vecFromAngle(angle, speed);
    this.dashVector = vector;
    this.dashUntil = this.scene.time.now + duration;
    this.invulnerableUntil = Math.max(this.invulnerableUntil, this.scene.time.now + duration + 80);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.55,
      yoyo: true,
      repeat: 1,
      duration: Math.max(50, duration / 2)
    });
  }

  addShield(amount, duration = 1800) {
    this.shield = Math.max(this.shield, amount);
    if (!this.shieldSprite) {
      this.shieldSprite = this.scene.add.circle(this.x, this.y, 34, 0x7dd3fc, 0.14)
        .setStrokeStyle(3, 0x7dd3fc, 0.65)
        .setDepth(this.depth - 1);
      this.scene.tweens.add({ targets: this.shieldSprite, scale: 1.08, yoyo: true, repeat: -1, duration: 620 });
    }

    this.scene.time.delayedCall(duration, () => {
      this.shield = 0;
      if (this.shieldSprite) {
        this.shieldSprite.destroy();
        this.shieldSprite = null;
      }
      GameEvents.emit(EVENTS.hudChanged);
    });
    GameEvents.emit(EVENTS.hudChanged);
  }

  takeDamage(amount, source = null) {
    if (this.dead || this.scene.time.now < this.invulnerableUntil) return;

    const reduced = Math.max(1, Math.round(amount - this.stats.defense * 0.55));
    let incoming = reduced;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, incoming);
      this.shield -= absorbed;
      incoming -= absorbed;
      EffectsSystem.floatingText(this.scene, this.x, this.y - 34, `-${absorbed}`, '#7dd3fc', 15);
      if (this.shield <= 0 && this.shieldSprite) {
        this.shieldSprite.destroy();
        this.shieldSprite = null;
      }
    }

    if (incoming <= 0) {
      GameEvents.emit(EVENTS.hudChanged);
      return;
    }

    this.hp = clamp(this.hp - incoming, 0, this.maxHp);
    this.state.currentHp = this.hp;
    EffectsSystem.flash(this.scene, this, 0xff2f2f, 90);
    EffectsSystem.floatingText(this.scene, this.x, this.y - 32, incoming, '#ff7373', 18);
    EffectsSystem.burst(this.scene, this.x, this.y, 0xff2f2f, 8, 80);
    AudioSystem.hit();

    if (source) {
      const angle = Math.atan2(this.y - source.y, this.x - source.x);
      this.body.velocity.x += Math.cos(angle) * 90;
      this.body.velocity.y += Math.sin(angle) * 90;
    }

    if (this.hp <= 0) this.die();
    GameEvents.emit(EVENTS.hudChanged);
  }

  heal(amount) {
    if (this.dead) return;
    this.hp = clamp(this.hp + amount, 0, this.maxHp);
    this.state.currentHp = this.hp;
    EffectsSystem.burst(this.scene, this.x, this.y, 0x7dd3fc, 8, 80);
    GameEvents.emit(EVENTS.hudChanged);
  }

  die() {
    this.dead = true;
    this.setVelocity(0, 0);
    EffectsSystem.notification(this.scene, 'You were pulled back to town', '#ff7373');
    this.scene.time.delayedCall(1100, () => {
      this.scene.returnToTownAfterDefeat?.();
    });
  }

  publishCooldowns(time) {
    if (!this._lastCooldownPublish || time - this._lastCooldownPublish > 100) {
      this._lastCooldownPublish = time;
      GameEvents.emit(EVENTS.cooldownsChanged, this.getCooldownSnapshot());
    }
  }

  getCooldownSnapshot() {
    const snapshot = {
      dodge: {
        remaining: this.getCooldownRemaining('dodge') / 1000,
        total: 3.4
      },
      basic: {
        remaining: this.getCooldownRemaining(BASIC_SKILL_BY_HERO[this.heroId]) / 1000,
        total: SKILLS[BASIC_SKILL_BY_HERO[this.heroId]].cooldown
      },
      skills: []
    };

    this.hero.skills.forEach((skillId, index) => {
      snapshot.skills[index] = {
        id: skillId,
        remaining: this.getCooldownRemaining(skillId) / 1000,
        total: SKILLS[skillId].cooldown
      };
    });

    return snapshot;
  }

  destroy(fromScene) {
    this.nameplate?.destroy();
    this.shieldSprite?.destroy();
    super.destroy(fromScene);
  }
}
