export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function angleBetween(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function vecFromAngle(angle, length = 1) {
  return {
    x: Math.cos(angle) * length,
    y: Math.sin(angle) * length
  };
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function weightedPick(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return entries[entries.length - 1].value;
}

export function formatNumber(value) {
  return Math.round(value).toLocaleString('en-US');
}
