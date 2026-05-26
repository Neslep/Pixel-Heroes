export class AudioSystem {
  static context = null;
  static volume = 0.75;

  static ensureContext() {
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    if (!AudioSystem.context) {
      AudioSystem.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (AudioSystem.context.state === 'suspended') AudioSystem.context.resume();
    return AudioSystem.context;
  }

  static tone(freq, duration = 0.12, type = 'square', volume = 0.08) {
    const ctx = AudioSystem.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.35), ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume * AudioSystem.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  static noise(duration = 0.12, volume = 0.08) {
    const ctx = AudioSystem.ensureContext();
    if (!ctx) return;

    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(volume * AudioSystem.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  static click() {
    AudioSystem.tone(840, 0.04, 'triangle', 0.04);
  }

  static attack() {
    AudioSystem.tone(460, 0.08, 'square', 0.04);
  }

  static skill() {
    AudioSystem.tone(720, 0.18, 'sine', 0.06);
  }

  static hit() {
    AudioSystem.noise(0.12, 0.09);
  }

  static loot() {
    AudioSystem.tone(930, 0.1, 'triangle', 0.05);
    setTimeout(() => AudioSystem.tone(1240, 0.12, 'triangle', 0.04), 80);
  }

  static levelUp() {
    AudioSystem.tone(420, 0.16, 'square', 0.06);
    setTimeout(() => AudioSystem.tone(640, 0.18, 'square', 0.06), 120);
    setTimeout(() => AudioSystem.tone(960, 0.22, 'square', 0.05), 250);
  }

  static boss() {
    AudioSystem.noise(0.35, 0.13);
    AudioSystem.tone(120, 0.35, 'sawtooth', 0.06);
  }

  static victory() {
    AudioSystem.tone(520, 0.2, 'triangle', 0.07);
    setTimeout(() => AudioSystem.tone(780, 0.2, 'triangle', 0.07), 150);
    setTimeout(() => AudioSystem.tone(1040, 0.35, 'triangle', 0.06), 300);
  }
}
