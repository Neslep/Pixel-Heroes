import Phaser from 'phaser';
import { HEROES } from '../data/heroes.js';
import { SKILLS, BASIC_SKILL_BY_HERO } from '../data/skills.js';
import { ORBS } from '../data/orbs.js';
import { CombatSystem } from './CombatSystem.js';
import { EffectsSystem } from './EffectsSystem.js';
import { AudioSystem } from './AudioSystem.js';
import { Projectile } from '../entities/Projectile.js';
import { angleBetween, distance, vecFromAngle } from '../utils/math.js';

export class SkillSystem {
  static getBasicSkill(heroId) {
    return SKILLS[BASIC_SKILL_BY_HERO[heroId]];
  }

  static getSkill(heroId, slot) {
    const hero = sceneSafeHero(heroId);
    return SKILLS[hero.skills[slot - 1]];
  }

  static getOrbForSlot(state, slot) {
    if (!state?.orb || state.orb.skillSlot !== slot) return null;
    return ORBS[state.orb.id] ? state.orb.id : null;
  }

  static getPointerTarget(scene, player, maxDistance = 420) {
    const pointer = scene.input.activePointer;
    const target = { x: pointer.worldX, y: pointer.worldY };
    const dist = distance(player, target);
    if (dist <= maxDistance) return target;
    const angle = angleBetween(player, target);
    const vec = vecFromAngle(angle, maxDistance);
    return { x: player.x + vec.x, y: player.y + vec.y };
  }

  static castBasic(scene, player) {
    const skill = SkillSystem.getBasicSkill(player.heroId);
    SkillSystem.perform(scene, player, skill, 'basic');
  }

  static castSlot(scene, player, slot) {
    const hero = sceneSafeHero(player.heroId);
    const skill = SKILLS[hero.skills[slot - 1]];
    SkillSystem.perform(scene, player, skill, slot);
  }

  static perform(scene, player, skill, slot) {
    if (!skill) return;

    const state = scene.registry.get('save');
    const angle = player.getAimAngle();
    const rawDamage = (player.stats.attack ?? 1) * (skill.damage ?? 1);
    const orbId = SkillSystem.getOrbForSlot(state, slot);
    const common = {
      source: player,
      color: skill.color,
      orbId,
      skillId: skill.id,
      knockback: skill.knockback,
      stun: skill.stun
    };

    AudioSystem.skill();

    if (skill.kind === 'melee' || skill.kind === 'arc') {
      CombatSystem.hitArc(scene, player, angle, skill.range, skill.width, rawDamage, common);
      EffectsSystem.burst(scene, player.x + Math.cos(angle) * 54, player.y + Math.sin(angle) * 54, skill.color, 8, 82);
      return;
    }

    if (skill.kind === 'projectile') {
      const velocity = vecFromAngle(angle, skill.speed);
      const projectile = new Projectile(scene, player.x + Math.cos(angle) * 30, player.y + Math.sin(angle) * 30, skill.texture, {
        owner: player,
        angle,
        vx: velocity.x,
        vy: velocity.y,
        damage: rawDamage,
        range: skill.range,
        pierce: skill.pierce ?? 0,
        color: skill.color,
        orbId
      });
      scene.projectiles.add(projectile);
      EffectsSystem.burst(scene, projectile.x, projectile.y, skill.color, 4, 42);
      return;
    }

    if (skill.kind === 'self_aoe') {
      CombatSystem.hitCircle(scene, player.x, player.y, skill.radius, rawDamage, common);
      EffectsSystem.burst(scene, player.x, player.y, skill.color, 24, 210);
      EffectsSystem.screenShake(scene, 0.004, 150);
      return;
    }

    if (skill.kind === 'ultimate_aoe') {
      EffectsSystem.screenShake(scene, 0.011, 320);
      scene.time.delayedCall(160, () => {
        CombatSystem.hitCircle(scene, player.x, player.y, skill.radius, rawDamage, common);
        EffectsSystem.burst(scene, player.x, player.y, skill.color, 42, 320);
      });
      return;
    }

    if (skill.kind === 'dash_attack') {
      player.startDash(angle, skill.distance, 190, 360);
      for (let i = 1; i <= 4; i += 1) {
        scene.time.delayedCall(i * 55, () => {
          if (!player.active) return;
          CombatSystem.hitCircle(scene, player.x, player.y, skill.radius, rawDamage * 0.42, common);
          EffectsSystem.burst(scene, player.x, player.y, skill.color, 5, 80);
        });
      }
      return;
    }

    if (skill.kind === 'heal_zone') {
      const zone = scene.add.circle(player.x, player.y, skill.radius, skill.color, 0.16);
      zone.setStrokeStyle(3, skill.color, 0.8).setDepth(player.depth - 2);
      scene.tweens.add({
        targets: zone,
        alpha: 0.35,
        scale: 1.06,
        yoyo: true,
        repeat: Math.floor(skill.duration / 650),
        duration: 650
      });

      const tick = scene.time.addEvent({
        delay: 650,
        repeat: Math.floor(skill.duration / 650),
        callback: () => {
          if (!player.active) return;
          if (distance(player, zone) <= skill.radius) {
            player.heal(Math.round(player.maxHp * skill.heal));
            EffectsSystem.floatingText(scene, player.x, player.y - 34, `+${Math.round(player.maxHp * skill.heal)}`, '#7dd3fc', 16);
          }
        }
      });
      scene.time.delayedCall(skill.duration, () => {
        tick.remove(false);
        zone.destroy();
      });
      EffectsSystem.ring(scene, player.x, player.y, skill.radius, skill.color, 520);
      return;
    }

    if (skill.kind === 'shield') {
      player.addShield(Math.round(player.maxHp * skill.shield), skill.duration);
      EffectsSystem.ring(scene, player.x, player.y, 76, skill.color, 620, 5);
      return;
    }

    if (skill.kind === 'target_aoe') {
      const target = SkillSystem.getPointerTarget(scene, player, 480);
      EffectsSystem.telegraph(scene, target.x, target.y, skill.radius, skill.color, skill.delay, () => {
        EffectsSystem.beam(scene, target.x, target.y, skill.color);
        CombatSystem.hitCircle(scene, target.x, target.y, skill.radius, rawDamage, common);
        EffectsSystem.screenShake(scene, 0.006, 200);
      });
      return;
    }

    if (skill.kind === 'trap') {
      const target = SkillSystem.getPointerTarget(scene, player, 340);
      const trap = scene.add.image(target.x, target.y, 'trap_rune').setTint(skill.color).setDepth(player.depth - 2);
      trap.setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: trap, rotation: Math.PI * 2, duration: 1500, repeat: -1 });

      const trigger = scene.time.addEvent({
        delay: 120,
        repeat: Math.floor(skill.duration / 120),
        callback: () => {
          if (!trap.active) return;
          const targetEnemy = scene.getLivingEnemies().find((enemy) => distance(enemy, trap) <= skill.radius * 0.8);
          if (!targetEnemy) return;
          CombatSystem.hitCircle(scene, trap.x, trap.y, skill.radius, rawDamage, common);
          EffectsSystem.burst(scene, trap.x, trap.y, skill.color, 22, 220);
          trap.destroy();
          trigger.remove(false);
        }
      });

      scene.time.delayedCall(skill.duration, () => {
        trigger.remove(false);
        if (trap.active) trap.destroy();
      });
      return;
    }

    if (skill.kind === 'mobility') {
      player.startDash(angle, skill.distance, 170, 420);
      EffectsSystem.burst(scene, player.x, player.y, skill.color, 10, 120);
      return;
    }

    if (skill.kind === 'multi_strike') {
      const target = SkillSystem.getPointerTarget(scene, player, 520);
      for (let i = 0; i < skill.strikes; i += 1) {
        const offset = vecFromAngle(Math.random() * Math.PI * 2, Math.random() * 145);
        const x = target.x + offset.x;
        const y = target.y + offset.y;
        scene.time.delayedCall(i * 135, () => {
          EffectsSystem.telegraph(scene, x, y, skill.radius, skill.color, 180, () => {
            EffectsSystem.beam(scene, x, y, skill.color);
            CombatSystem.hitCircle(scene, x, y, skill.radius, rawDamage, common);
            EffectsSystem.screenShake(scene, 0.003, 90);
          });
        });
      }
      return;
    }

    if (skill.kind === 'taunt') {
      player.addShield(Math.round(player.maxHp * 0.18), skill.duration);
      CombatSystem.hitCircle(scene, player.x, player.y, skill.radius, rawDamage, common);
      scene.getLivingEnemies().forEach((enemy) => {
        if (distance(enemy, player) < skill.radius + 80) enemy.tauntedUntil = scene.time.now + skill.duration;
      });
      return;
    }
  }
}

function sceneSafeHero(heroId) {
  return HEROES[heroId];
}
