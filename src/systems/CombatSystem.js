import Phaser from 'phaser';
import { EffectsSystem } from './EffectsSystem.js';
import { distance, angleBetween } from '../utils/math.js';

export class CombatSystem {
  static calculateDamage(raw, attack, defense = 0) {
    return Math.max(1, Math.round(raw + attack - defense * 0.45));
  }

  static hitArc(scene, player, angle, range, width, rawDamage, options = {}) {
    const enemies = scene.getLivingEnemies();
    const hits = [];

    EffectsSystem.arc(scene, player.x, player.y, angle, range, width, options.color);
    for (const enemy of enemies) {
      const dist = distance(player, enemy);
      if (dist > range + enemy.hitRadius) continue;

      const toEnemy = angleBetween(player, enemy);
      let delta = Phaser.Math.Angle.Wrap(toEnemy - angle);
      if (Math.abs(delta) <= width / 2) {
        hits.push(enemy);
      }
    }

    hits.forEach((enemy) => CombatSystem.damageEnemy(scene, enemy, rawDamage, {
      ...options,
      source: player,
      sourceX: player.x,
      sourceY: player.y
    }));
    return hits;
  }

  static hitCircle(scene, x, y, radius, rawDamage, options = {}) {
    const hits = [];
    EffectsSystem.filledPulse(scene, x, y, radius, options.color ?? 0xffffff, 260, 0.22);
    EffectsSystem.ring(scene, x, y, radius, options.color ?? 0xffffff, 360, 4);

    for (const enemy of scene.getLivingEnemies()) {
      if (distance({ x, y }, enemy) <= radius + enemy.hitRadius) {
        hits.push(enemy);
      }
    }

    hits.forEach((enemy) => CombatSystem.damageEnemy(scene, enemy, rawDamage, {
      ...options,
      sourceX: x,
      sourceY: y
    }));
    return hits;
  }

  static damageEnemy(scene, enemy, rawDamage, options = {}) {
    if (!enemy?.active || enemy.isDead) return 0;

    const player = options.source ?? scene.player;
    const stats = player?.stats ?? { attack: 1, skillPower: 1 };
    const power = options.power ?? 1;
    const damage = CombatSystem.calculateDamage(rawDamage * power * (stats.skillPower ?? 1), stats.attack, enemy.defense);

    enemy.takeDamage(damage, options);
    CombatSystem.applyOrb(scene, enemy, damage, options);
    return damage;
  }

  static applyOrb(scene, enemy, damage, options) {
    const orbId = options.orbId;
    if (!orbId || !scene.player) return;

    if (orbId === 'fire') {
      enemy.applyStatus('burn', { ticks: 3, damage: Math.max(2, Math.round(damage * 0.18)), interval: 520 });
    }

    if (orbId === 'frost') {
      enemy.applyStatus('slow', { factor: 0.55, duration: 1800 });
    }

    if (orbId === 'storm' && !options.isChain) {
      const nearby = scene.getLivingEnemies()
        .filter((candidate) => candidate !== enemy && distance(enemy, candidate) < 180)
        .slice(0, 2);
      nearby.forEach((candidate, index) => {
        scene.time.delayedCall(70 + index * 70, () => {
          if (!candidate.active) return;
          EffectsSystem.beam(scene, candidate.x, candidate.y, 0x65f2ff);
          CombatSystem.damageEnemy(scene, candidate, Math.max(3, damage * 0.28), {
            ...options,
            isChain: true,
            orbId: null,
            color: 0x65f2ff
          });
        });
      });
    }

    if (orbId === 'guardian') {
      scene.player.addShield(Math.max(6, Math.round(scene.player.maxHp * 0.045)), 1600);
    }
  }

  static damagePlayer(scene, amount, source = null) {
    if (!scene.player?.active) return;
    scene.player.takeDamage(amount, source);
  }
}
