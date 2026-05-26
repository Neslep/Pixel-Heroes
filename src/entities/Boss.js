import Phaser from 'phaser';
import { Enemy } from './Enemy.js';
import { Enemy as Minion } from './Enemy.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { GameEvents, EVENTS } from '../utils/events.js';
import { distance, vecFromAngle } from '../utils/math.js';

export class Boss extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'skeleton_knight', {
      name: 'Corrupted Guardian',
      texture: 'boss_guardian',
      hp: 920,
      attack: 24,
      defense: 7,
      speed: 68,
      radius: 40,
      scale: 2.45,
      attackRange: 108,
      attackCooldown: 1700,
      behavior: 'boss',
      tint: 0xffffff
    });

    this.phase = 1;
    this.rage = false;
    this.nextSpecialAt = 0;
    this.setDepth(this.depth + 2);
    this.body.setCircle(30, 18, 22);
    GameEvents.emit(EVENTS.bossChanged, this.getBossPayload());
  }

  update(time, delta) {
    if (this.isDead || !this.scene.player?.active) return;
    this.updateHpBar();
    this.updatePhase();

    const player = this.scene.player;
    const dist = distance(this, player);
    const angle = Math.atan2(player.y - this.y, player.x - this.x);

    if (dist > this.config.attackRange) {
      const velocity = vecFromAngle(angle, this.speed * (this.rage ? 1.28 : 1));
      this.setVelocity(velocity.x, velocity.y);
    } else {
      this.setVelocity(0, 0);
    }

    if (time >= this.nextAttackAt && dist <= this.config.attackRange + 16) {
      this.bossSlam(time, angle);
    }

    if (time >= this.nextSpecialAt) {
      if (this.phase === 1) this.frontalShockwave(time, angle);
      else if (Math.random() < 0.48) this.summonMinions(time);
      else this.corruptionPools(time);
    }

    this.setFlipX(player.x < this.x);
    GameEvents.emit(EVENTS.bossChanged, this.getBossPayload());
  }

  updatePhase() {
    const pct = this.hp / this.maxHp;
    if (pct <= 0.68 && this.phase === 1) {
      this.phase = 2;
      this.scene.log('Boss phase changed: corruption is spreading.');
      EffectsSystem.notification(this.scene, 'Phase 2: Corruption Spreads', '#c084fc');
      EffectsSystem.screenShake(this.scene, 0.008, 350);
    }

    if (pct <= 0.4 && !this.rage) {
      this.rage = true;
      this.speed *= 1.18;
      this.config.attackCooldown = 1120;
      this.setTint(0xff6677);
      this.scene.log('Rage mode! The Guardian breaks its seal.');
      EffectsSystem.notification(this.scene, 'RAGE MODE', '#ff7373');
      EffectsSystem.screenShake(this.scene, 0.015, 520);
    }
  }

  bossSlam(time, angle) {
    this.nextAttackAt = time + this.config.attackCooldown;
    EffectsSystem.telegraph(this.scene, this.x + Math.cos(angle) * 54, this.y + Math.sin(angle) * 54, 92, 0xff5040, 420, () => {
      if (!this.active || this.isDead) return;
      EffectsSystem.screenShake(this.scene, this.rage ? 0.011 : 0.007, 220);
      EffectsSystem.filledPulse(this.scene, this.x + Math.cos(angle) * 54, this.y + Math.sin(angle) * 54, 92, 0xff5040, 260, 0.32);
      if (distance(this, this.scene.player) <= 138) CombatSystem.damagePlayer(this.scene, this.attack + (this.rage ? 10 : 0), this);
    });
  }

  frontalShockwave(time, angle) {
    this.nextSpecialAt = time + (this.rage ? 2600 : 3700);
    for (let i = 1; i <= 4; i += 1) {
      this.scene.time.delayedCall(i * 140, () => {
        if (!this.active || this.isDead) return;
        const x = this.x + Math.cos(angle) * i * 76;
        const y = this.y + Math.sin(angle) * i * 76;
        EffectsSystem.filledPulse(this.scene, x, y, 52 + i * 5, 0xb44cff, 220, 0.22);
        if (distance({ x, y }, this.scene.player) <= 58 + i * 5) {
          CombatSystem.damagePlayer(this.scene, this.attack + 4, this);
        }
      });
    }
  }

  summonMinions(time) {
    this.nextSpecialAt = time + (this.rage ? 3600 : 5200);
    this.scene.log('The Guardian summons corrupted minions.');
    for (let i = 0; i < (this.rage ? 3 : 2); i += 1) {
      const angle = (Math.PI * 2 * i) / 3 + Math.random();
      const x = this.x + Math.cos(angle) * 150;
      const y = this.y + Math.sin(angle) * 150;
      EffectsSystem.telegraph(this.scene, x, y, 42, 0xc084fc, 520, () => {
        if (!this.active) return;
        const minion = new Minion(this.scene, x, y, i % 2 === 0 ? 'forest_slime' : 'goblin_rogue', {
          hp: this.rage ? 54 : 42,
          exp: 8,
          gold: [1, 4]
        });
        this.scene.enemies.add(minion);
      });
    }
  }

  corruptionPools(time) {
    this.nextSpecialAt = time + (this.rage ? 2800 : 4300);
    const player = this.scene.player;
    for (let i = 0; i < (this.rage ? 4 : 3); i += 1) {
      const x = player.x + Phaser.Math.Between(-180, 180);
      const y = player.y + Phaser.Math.Between(-140, 140);
      EffectsSystem.telegraph(this.scene, x, y, 74, 0x9d35ff, 720, () => {
        const pool = this.scene.add.circle(x, y, 78, 0x6d28d9, 0.18).setDepth(this.depth - 4);
        pool.setStrokeStyle(2, 0xc084fc, 0.45);
        const tick = this.scene.time.addEvent({
          delay: 520,
          repeat: 5,
          callback: () => {
            if (distance(pool, this.scene.player) <= 80) CombatSystem.damagePlayer(this.scene, this.attack * 0.55, this);
          }
        });
        this.scene.time.delayedCall(3300, () => {
          tick.remove(false);
          pool.destroy();
        });
      });
    }
  }

  getBossPayload() {
    return {
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      phase: this.phase,
      rage: this.rage
    };
  }

  takeDamage(amount, options = {}) {
    super.takeDamage(amount, options);
    GameEvents.emit(EVENTS.bossChanged, this.getBossPayload());
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    GameEvents.emit(EVENTS.bossHidden);
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.hpBar?.clear();
    EffectsSystem.burst(this.scene, this.x, this.y, 0xc084fc, 42, 280);
    EffectsSystem.screenShake(this.scene, 0.014, 520);
    this.scene.onBossDefeated?.();
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.25,
      angle: Phaser.Math.Between(-35, 35),
      duration: 760,
      ease: 'Cubic.easeIn',
      onComplete: () => this.destroy()
    });
  }
}
