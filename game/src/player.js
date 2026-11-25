// Sizzle & Serve — the chef: walking, bumping into counters, carrying one
// thing at a time, and reaching the nearest station.
import { CHEF_SPEED, REACH, STATIONS, VIEW_H, VIEW_W } from './config.js';

const FLOOR_TOP = 176;
const FLOOR_BOTTOM = VIEW_H - 12;
const FLOOR_LEFT = 12;
const FLOOR_RIGHT = VIEW_W - 12;
const CHEF_R = 22;

export function createPlayer() {
  return {
    x: 640,
    y: 470,
    dirX: 0,
    dirY: 1,
    moving: false,
    // Where a click told the chef to walk, or null.
    target: null,
    // One carried thing: null, { kind: 'ingredient', id, finished?, burnt? }
    // or { kind: 'plate', items: [finishedId, ...] }.
    carry: null,
    // Station the chef is walking to for a click-interact, or null.
    pendingStation: null,
  };
}

function blockedAt(x, y) {
  if (x < FLOOR_LEFT + CHEF_R || x > FLOOR_RIGHT - CHEF_R) return true;
  if (y < FLOOR_TOP + CHEF_R || y > FLOOR_BOTTOM - CHEF_R) return true;
  for (const s of Object.values(STATIONS)) {
    if (x > s.x - CHEF_R && x < s.x + s.w + CHEF_R &&
        y > s.y - CHEF_R && y < s.y + s.h + CHEF_R) return true;
  }
  return false;
}

export function movePlayer(player, input, dt) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (dx !== 0 || dy !== 0) {
    player.target = null;
    player.pendingStation = null;
  } else if (player.target) {
    const tx = player.target.x - player.x;
    const ty = player.target.y - player.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 6) {
      player.target = null;
    } else {
      dx = tx / dist;
      dy = ty / dist;
    }
  }
  if (dx === 0 && dy === 0) {
    player.moving = false;
    return;
  }
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  player.dirX = dx;
  player.dirY = dy;
  player.moving = true;
  const step = CHEF_SPEED * dt;
  const nx = player.x + dx * step;
  const ny = player.y + dy * step;
  if (!blockedAt(nx, player.y)) player.x = nx;
  if (!blockedAt(player.x, ny)) player.y = ny;
}

function stationDistance(player, station) {
  const cx = Math.max(station.x, Math.min(player.x, station.x + station.w));
  const cy = Math.max(station.y, Math.min(player.y, station.y + station.h));
  return Math.hypot(player.x - cx, player.y - cy);
}

// The nearest station the chef can reach, or null.
export function nearestStation(player) {
  let best = null;
  let bestD = Infinity;
  for (const s of Object.values(STATIONS)) {
    const d = stationDistance(player, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return bestD <= REACH ? best : null;
}

// The closest point on a station's edge to walk to for a click-interact.
export function stationApproach(station) {
  return {
    x: station.x + station.w / 2,
    y: station.y + station.h + CHEF_R + 4,
  };
}
