import Phaser from 'phaser';
import { ENEMIES } from '../data/enemies.js';
import { Projectile } from './Projectile.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { DEPTH } from '../utils/constants.js';
import { angleBetween, clamp, distance, vecFromAngle } from '../utils/math.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, enemyId, overrides = {}) {
    const config = { ...ENEMIES[enemyId], ...overrides };
    super(scene, x, y, config.texture);

    this.scene = scene;
    this.enemyId = enemyId;
    this.config = config;
    this.name = config.name;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.attack = config.attack;
    this.defense = config.defense;
    this.baseSpeed = config.speed;
    this.hitRadius = config.radius ?? 18;
    this.nextAttackAt = 0;
    this.isDead = false;
    this.statuses = {};
    this.tauntedUntil = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.actors);
    this.setScale(config.scale ?? 1.45);
    this.body.setCircle(this.hitRadius, 8, 8);
    this.body.setDrag(500, 500);
    this.body.setMaxVelocity(360, 360);
    this.setTint(config.tint);

    this.hpBar = scene.add.graphics().setDepth(DEPTH.actors + 8);
    this.hoverOffset = Math.random() * Math.PI * 2;
    this.updateHpBar();
  }

  update(time, delta) {
    if (this.isDead || !this.scene.player?.active || this.scene.player.dead) return;
    this.updateHpBar();

    if (this.config.behavior === 'ranged' || this.config.behavior === 'caster') {
      this.updateRanged(time);
    } else {
      this.updateMelee(time);
    }

    if (this.config.behavior === 'jumper') {
      this.y += Math.sin(time * 0.006 + this.hoverOffset) * 0.15;
    }
    if (this.config.behavior === 'ranged') {
      this.y += Math.sin(time * 0.005 + this.hoverOffset) * 0.22;
    }
  }

  get speed() {
    const slow = this.statuses.slow && this.scene.time.now < this.statuses.slow.until ? this.statuses.slow.factor : 1;
    return this.baseSpeed * slow;
  }

  updateMelee(time) {
    const player = this.scene.player;
    const dist = distance(this, player);
    const angle = angleBetween(this, player);

    if (dist > this.config.attackRange) {
      const velocity = vecFromAngle(angle, this.speed);
      this.setVelocity(velocity.x, velocity.y);
    } else {
      this.setVelocity(0, 0);
      if (time >= this.nextAttackAt) this.meleeAttack(time, angle);
    }

    this.setFlipX(player.x < this.x);
  }

  updateRanged(time) {
    const player = this.scene.player;
    const dist = distance(this, player);
    const angle = angleBetween(this, player);

    if (dist < (this.config.keepRange ?? 220)) {
      const velocity = vecFromAngle(angle + Math.PI, this.speed * 0.75);
      this.setVelocity(velocity.x, velocity.y);
    } else if (dist > this.config.attackRange * 0.92) {
      const velocity = vecFromAngle(angle, this.speed * 0.75);
      this.setVelocity(velocity.x, velocity.y);
    } else {
      this.setVelocity(0, 0);
    }

    if (dist <= this.config.attackRange && time >= this.nextAttackAt) {
      if (this.config.behavior === 'caster') this.castAoe(time);
      else this.shootProjectile(time, angle);
    }

    this.setFlipX(player.x < this.x);
  }

  meleeAttack(time, angle) {
    this.nextAttackAt = time + this.config.attackCooldown;
    EffectsSystem.arc(this.scene, this.x, this.y, angle, this.config.attackRange + 18, 0.9, 0xff7373);
    this.scene.time.delayedCall(120, () => {
      if (!this.active || this.isDead) return;
      if (distance(this, this.scene.player) <= this.config.attackRange + 22) {
        CombatSystem.damagePlayer(this.scene, this.attack, this);
      }
    });
  }

  shootProjectile(time, angle) {
    this.nextAttackAt = time + this.config.attackCooldown;
    const velocity = vecFromAngle(angle, 360);
    const projectile = new Projectile(this.scene, this.x, this.y, this.config.projectile ?? 'proj_crystal', {
      owner: this,
      hostile: true,
      angle,
      vx: velocity.x,
      vy: velocity.y,
      damage: this.attack,
      range: 520,
      color: 0x8fd3ff
    });
    this.scene.enemyProjectiles.add(projectile);
  }

  castAoe(time) {
    this.nextAttackAt = time + this.config.attackCooldown;
    const target = {
      x: this.scene.player.x + Phaser.Math.Between(-70, 70),
      y: this.scene.player.y + Phaser.Math.Between(-70, 70)
    };
    EffectsSystem.telegraph(this.scene, target.x, target.y, 82, 0xb44cff, 680, () => {
      EffectsSystem.burst(this.scene, target.x, target.y, 0xb44cff, 20, 150);
      EffectsSystem.filledPulse(this.scene, target.x, target.y, 82, 0xb44cff, 260, 0.28);
      if (distance(target, this.scene.player) <= 88) {
        CombatSystem.damagePlayer(this.scene, this.attack + 4, this);
      }
    });
  }

  takeDamage(amount, options = {}) {
    if (this.isDead) return;
    this.hp = clamp(this.hp - amount, 0, this.maxHp);
    EffectsSystem.flash(this.scene, this, options.color ?? 0xffffff, 75);
    EffectsSystem.floatingText(this.scene, this.x, this.y - 30, amount, '#fff1a6', 17);
    EffectsSystem.burst(this.scene, this.x, this.y, options.color ?? 0xffffff, 6, 70);
    AudioSystem.hit();

    if (options.knockback || options.sourceX !== undefined) {
      const angle = Math.atan2(this.y - (options.sourceY ?? this.y), this.x - (options.sourceX ?? this.x));
      const force = options.knockback ?? 140;
      this.body.velocity.x += Math.cos(angle) * force;
      this.body.velocity.y += Math.sin(angle) * force;
    }

    if (options.stun) {
      this.nextAttackAt = Math.max(this.nextAttackAt, this.scene.time.now + options.stun);
    }

    this.updateHpBar();
    if (this.hp <= 0) this.die();
  }

  applyStatus(type, data) {
    if (type === 'slow') {
      this.statuses.slow = {
        factor: data.factor,
        until: this.scene.time.now + data.duration
      };
      EffectsSystem.ring(this.scene, this.x, this.y, 28, 0x8fd3ff, 420, 2);
    }

    if (type === 'burn') {
      for (let i = 1; i <= data.ticks; i += 1) {
        this.scene.time.delayedCall(i * data.interval, () => {
          if (!this.active || this.isDead) return;
          this.takeDamage(data.damage, { color: 0xff6b1a });
        });
      }
    }
  }

  updateHpBar() {
    if (!this.hpBar) return;
    const width = 42;
    const pct = clamp(this.hp / this.maxHp, 0, 1);
    this.hpBar.clear();
    if (pct >= 1 || this.isDead) return;
    this.hpBar.fillStyle(0x05070f, 0.82).fillRect(this.x - width / 2, this.y - 36, width, 5);
    this.hpBar.fillStyle(0xef4444, 0.96).fillRect(this.x - width / 2, this.y - 36, width * pct, 5);
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.hpBar?.clear();
    EffectsSystem.burst(this.scene, this.x, this.y, this.config.tint, 18, 150);
    this.scene.onEnemyKilled?.(this);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.4,
      angle: Phaser.Math.Between(-60, 60),
      duration: 330,
      ease: 'Cubic.easeIn',
      onComplete: () => this.destroy()
    });
  }

  destroy(fromScene) {
    this.hpBar?.destroy();
    super.destroy(fromScene);
  }
}
