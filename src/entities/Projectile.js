import Phaser from 'phaser';
import { CombatSystem } from '../systems/CombatSystem.js';
import { EffectsSystem } from '../systems/EffectsSystem.js';
import { DEPTH } from '../utils/constants.js';
import { distance } from '../utils/math.js';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, options = {}) {
    super(scene, x, y, texture);

    this.scene = scene;
    this.owner = options.owner;
    this.hostile = Boolean(options.hostile);
    this.damage = options.damage ?? 1;
    this.range = options.range ?? 500;
    this.pierce = options.pierce ?? 0;
    this.color = options.color ?? 0xffffff;
    this.orbId = options.orbId ?? null;
    this.startX = x;
    this.startY = y;
    this.hitIds = new Set();

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.effects);
    this.setRotation(options.angle ?? 0);
    this.setTint(this.color);
    this.body.setCircle(8, 4, 4);
    this.body.setVelocity(options.vx ?? 0, options.vy ?? 0);
    this.setBlendMode(Phaser.BlendModes.ADD);
  }

  update() {
    if (!this.active) return;

    if (distance({ x: this.startX, y: this.startY }, this) > this.range) {
      this.expire();
      return;
    }

    if (this.hostile) {
      if (this.scene.player?.active && !this.scene.player.dead && distance(this, this.scene.player) < 28) {
        CombatSystem.damagePlayer(this.scene, this.damage, this.owner ?? this);
        this.expire();
      }
      return;
    }

    const enemies = this.scene.getLivingEnemies();
    for (const enemy of enemies) {
      if (this.hitIds.has(enemy)) continue;
      if (distance(this, enemy) <= enemy.hitRadius + 12) {
        this.hitIds.add(enemy);
        CombatSystem.damageEnemy(this.scene, enemy, this.damage, {
          source: this.owner,
          sourceX: this.x,
          sourceY: this.y,
          color: this.color,
          orbId: this.orbId
        });
        if (this.pierce > 0) {
          this.pierce -= 1;
          EffectsSystem.burst(this.scene, this.x, this.y, this.color, 5, 60);
        } else {
          this.expire();
          break;
        }
      }
    }
  }

  expire() {
    if (!this.active) return;
    EffectsSystem.burst(this.scene, this.x, this.y, this.color, 6, 52);
    this.destroy();
  }
}
