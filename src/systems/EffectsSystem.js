import Phaser from 'phaser';
import { DEPTH } from '../utils/constants.js';
import { rand } from '../utils/math.js';

export class EffectsSystem {
  static floatingText(scene, x, y, text, color = '#ffffff', size = 18) {
    const label = scene.add.text(x, y, String(text), {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      stroke: '#0a0a0a',
      strokeThickness: 4
    });
    label.setOrigin(0.5).setDepth(DEPTH.effects + 20);
    scene.tweens.add({
      targets: label,
      y: y - 48,
      alpha: 0,
      scale: 1.18,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy()
    });
    return label;
  }

  static flash(scene, target, color = 0xffffff, duration = 90) {
    if (!target?.active) return;
    target.setTintFill(color);
    scene.time.delayedCall(duration, () => {
      if (target.active) target.clearTint();
    });
  }

  static burst(scene, x, y, color = 0xffffff, count = 14, speed = 160, texture = 'particle_square') {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const dist = rand(16, speed);
      const particle = scene.add.image(x, y, texture);
      particle.setTint(color).setDepth(DEPTH.effects).setScale(rand(0.6, 1.6));
      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: rand(350, 700),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  static ring(scene, x, y, radius, color = 0xffffff, duration = 360, lineWidth = 4) {
    const ring = scene.add.graphics().setDepth(DEPTH.effects);
    ring.lineStyle(lineWidth, color, 0.9);
    ring.strokeCircle(0, 0, radius);
    ring.setPosition(x, y);
    ring.setScale(0.2);
    ring.setAlpha(0.95);
    scene.tweens.add({
      targets: ring,
      scale: 1.18,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
    return ring;
  }

  static filledPulse(scene, x, y, radius, color = 0xffffff, duration = 300, alpha = 0.24) {
    const gfx = scene.add.graphics().setDepth(DEPTH.effects - 1);
    gfx.fillStyle(color, alpha);
    gfx.fillCircle(0, 0, radius);
    gfx.lineStyle(2, color, 0.55);
    gfx.strokeCircle(0, 0, radius);
    gfx.setPosition(x, y);
    gfx.setScale(0.45);
    scene.tweens.add({
      targets: gfx,
      scale: 1,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => gfx.destroy()
    });
    return gfx;
  }

  static arc(scene, x, y, angle, range, width, color = 0xffffff) {
    const gfx = scene.add.graphics().setDepth(DEPTH.effects);
    gfx.fillStyle(color, 0.42);
    gfx.slice(0, 0, range, angle - width / 2, angle + width / 2, false);
    gfx.fillPath();
    gfx.lineStyle(3, color, 0.9);
    gfx.beginPath();
    gfx.arc(0, 0, range, angle - width / 2, angle + width / 2);
    gfx.strokePath();
    gfx.setPosition(x, y);
    scene.tweens.add({
      targets: gfx,
      alpha: 0,
      scale: 1.05,
      duration: 170,
      ease: 'Cubic.easeOut',
      onComplete: () => gfx.destroy()
    });
    return gfx;
  }

  static telegraph(scene, x, y, radius, color, delay, onComplete) {
    const gfx = scene.add.graphics().setDepth(DEPTH.ground + 4);
    gfx.fillStyle(color, 0.1);
    gfx.fillCircle(0, 0, radius);
    gfx.lineStyle(3, color, 0.75);
    gfx.strokeCircle(0, 0, radius);
    gfx.setPosition(x, y).setScale(0.2);
    scene.tweens.add({
      targets: gfx,
      scale: 1,
      duration: delay,
      ease: 'Sine.easeOut',
      onComplete: () => {
        gfx.destroy();
        onComplete?.();
      }
    });
    return gfx;
  }

  static beam(scene, x, y, color = 0xffffff) {
    const beam = scene.add.rectangle(x, y - 160, 34, 330, color, 0.78);
    beam.setDepth(DEPTH.effects + 4).setBlendMode(Phaser.BlendModes.ADD);
    const core = scene.add.rectangle(x, y - 160, 10, 330, 0xffffff, 0.95);
    core.setDepth(DEPTH.effects + 5).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: [beam, core],
      alpha: 0,
      scaleX: 1.7,
      duration: 320,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        beam.destroy();
        core.destroy();
      }
    });
  }

  static lootBeam(scene, x, y, color = 0xffffff) {
    const beam = scene.add.rectangle(x, y - 34, 8, 74, color, 0.6);
    beam.setDepth(DEPTH.effects - 2).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: beam,
      alpha: { from: 0.2, to: 0.75 },
      y: y - 40,
      yoyo: true,
      repeat: -1,
      duration: 720,
      ease: 'Sine.easeInOut'
    });
    return beam;
  }

  static screenShake(scene, intensity = 0.006, duration = 180) {
    scene.cameras.main.shake(duration, intensity);
  }

  static notification(scene, text, color = '#facc15') {
    const camera = scene.cameras.main;
    const label = scene.add.text(camera.width / 2, camera.height * 0.26, text, {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '30px',
      fontStyle: 'bold',
      color,
      stroke: '#0a0a0a',
      strokeThickness: 6
    });
    label.setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.overlay);
    scene.tweens.add({
      targets: label,
      y: label.y - 32,
      alpha: 0,
      duration: 1600,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy()
    });
  }
}
