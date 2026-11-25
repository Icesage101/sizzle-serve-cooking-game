// Sizzle & Serve — boot and the one loop: input is read every frame, the
// kitchen advances in fixed 1/60 s steps, and the renderer paints what is
// there. The game moves between four screens: title, play, paused and
// shift-end. ?shot=start|play|end (with &seed=N) stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, PANTRY_BINS, SHIFT_SECONDS, STATIONS } from './config.js';
import { INGREDIENTS } from './recipes.js';
import { addOrder, createOrderBoard, servePlate, updateOrders } from './orders.js';
import { chopTick, createKitchen, interact, toast, updateKitchen } from './kitchen.js';
import { createPlayer, movePlayer, nearestStation, stationApproach } from './player.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';
import {
  isMuted,
  playBurnt,
  playChop,
  playDing,
  playError,
  playFanfare,
  playPickup,
  playPlace,
  playServe,
  startSizzle,
  stopSizzle,
  toggleMute,
  unlockAudio,
} from './audio.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

let rngState = seed >>> 0;
function rng() {
  rngState = (rngState * 1664525 + 1013904223) >>> 0;
  return rngState / 4294967296;
}

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch { /* private mode */ }
}

function newGame() {
  return {
    phase: 'title',
    time: 0,
    elapsed: 0,
    shiftLeft: SHIFT_SECONDS,
    shiftSeconds: SHIFT_SECONDS,
    stars: 3,
    overReason: null,
    player: createPlayer(),
    kitchen: createKitchen(),
    board: createOrderBoard(),
    particles: [],
    nearStation: null,
    chopping: false,
    toast: null,
    best: readBest(),
  };
}

let game = newGame();

function setToast(text, color = '#fff7e6', life = 1.6) {
  game.toast = { text, color, life };
}

function burst(x, y, color, n = 14) {
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const speed = 60 + rng() * 140;
    game.particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 40,
      life: 0.7 + rng() * 0.4,
      maxLife: 1.1,
      size: 3 + rng() * 4,
      color,
      text: null,
    });
  }
}

function floatText(x, y, text, color) {
  game.particles.push({ x, y, vx: 0, vy: -46, life: 1.2, maxLife: 1.2, size: 0, color, text });
}

function endShift(reason) {
  game.phase = 'over';
  game.overReason = reason;
  stopSizzle();
  if (reason === 'complete') playFanfare();
  else playBurnt();
  if (game.board.coins > game.best) {
    game.best = game.board.coins;
    saveBest(game.best);
  }
  status.textContent = reason === 'complete'
    ? `Shift complete. ${game.board.coins} coins, ${game.board.served} dishes served.`
    : 'Shift over. Three orders lost.';
}

function startShift() {
  game = newGame();
  game.phase = 'play';
  addOrder(game.board, rng);
  addOrder(game.board, rng);
  status.textContent = 'Shift started. Serve the orders before their timers run out.';
}

// --- Interaction ---------------------------------------------------------

function nearestPantryBin() {
  const p = game.player;
  let best = null;
  let bestD = Infinity;
  for (const bin of PANTRY_BINS) {
    const d = Math.hypot(p.x - (bin.x + 36), p.y - (bin.y + 46));
    if (d < bestD) {
      bestD = d;
      best = bin;
    }
  }
  return bestD <= 100 ? best : null;
}

function doInteract() {
  const station = nearestStation(game.player);
  if (!station) return;
  if (station.id === 'pantry') {
    if (game.player.carry) {
      setToast('Hands full — serve or trash something first', '#ff9d8a');
      playError();
      return;
    }
    const bin = nearestPantryBin();
    if (!bin) {
      setToast('Step closer to a pantry bin', '#ffd76a');
      return;
    }
    const ing = INGREDIENTS[bin.id];
    game.player.carry = { kind: 'ingredient', id: bin.id, finished: ing.prep === 'none' ? `${bin.id}:ready` : null };
    playPickup();
    return;
  }
  if (station.id === 'window') {
    const carry = game.player.carry;
    if (!carry || carry.kind !== 'plate') {
      setToast('Bring a finished plate to the window', '#ffd76a');
      playError();
      return;
    }
    if (carry.items.length === 0) {
      setToast('An empty plate earns nothing', '#ff9d8a');
      playError();
      return;
    }
    const result = servePlate(game.board, carry.items, game.elapsed);
    if (!result) {
      setToast('No order wants that dish — check the tickets', '#ff9d8a');
      playError();
      return;
    }
    game.player.carry = null;
    playServe();
    const w = STATIONS.window;
    burst(w.x + w.w / 2, w.y + 70, '#f5b942', 18);
    floatText(w.x + w.w / 2, w.y + 40, `+${result.pay} coins`, '#ffd76a');
    toast(game.kitchen, `+${result.pay}`, w.x + w.w / 2, w.y + 30, '#ffd76a');
    setToast(`${result.recipe.name} served! +${result.pay} coins${result.combo > 1 ? ` · combo x${result.combo}` : ''}`, '#7be382');
    return;
  }
  const result = interact(game.kitchen, station.id, game.player.carry);
  if (result.takeCarry) game.player.carry = null;
  if (result.give) {
    if (game.player.carry) {
      // Hands were full; the station keeps its item. (Stove/board take
      // only ever fires with empty hands through the guard below.)
      return;
    }
    game.player.carry = result.give;
  }
  switch (result.action) {
    case 'place-board':
      playPlace();
      setToast('Hold E to chop', '#ffd76a');
      break;
    case 'take-chopped':
      playPickup();
      break;
    case 'place-stove':
      playPlace();
      startSizzle();
      break;
    case 'take-cooked':
      playPickup();
      playDing();
      break;
    case 'take-burnt':
      playBurnt();
      setToast('Burnt! Toss it in the trash', '#ff9d8a');
      break;
    case 'trash':
      playPlace();
      setToast('Tossed', '#b09a72');
      break;
    case 'take-plate':
      playPickup();
      break;
    case 'take-fresh-plate':
      playPickup();
      setToast('Clean plate — add ingredients at this counter', '#ffd76a');
      break;
    case 'put-plate':
      playPlace();
      break;
    case 'add-to-plate':
      playPlace();
      break;
    case 'hands-full':
      setToast('Hands full — put something down first', '#ff9d8a');
      playError();
      break;
    case 'no-chop':
      setToast('Only tomato and lettuce go on the board', '#ff9d8a');
      playError();
      break;
    case 'no-cook':
      setToast('Only patties and pasta go on the stove', '#ff9d8a');
      playError();
      break;
    case 'stove-full':
      setToast('Both burners are busy', '#ff9d8a');
      playError();
      break;
    case 'no-plate':
      setToast('No plate on the counter — take a clean one first', '#ffd76a');
      playError();
      break;
    case 'plate-full':
      setToast('That plate is full', '#ff9d8a');
      playError();
      break;
    case 'already-on':
      setToast('That is already on the plate', '#ff9d8a');
      playError();
      break;
    case 'counter-full':
      setToast('No free plate spot', '#ff9d8a');
      playError();
      break;
    case 'chopping':
      setToast('Hold E to chop', '#ffd76a');
      break;
    default:
      break;
  }
}

// --- Input ---------------------------------------------------------------

const keys = new Set();
const input = { left: false, right: false, up: false, down: false, interact: false };

function syncInput() {
  input.left = keys.has('ArrowLeft') || keys.has('KeyA');
  input.right = keys.has('ArrowRight') || keys.has('KeyD');
  input.up = keys.has('ArrowUp') || keys.has('KeyW');
  input.down = keys.has('ArrowDown') || keys.has('KeyS');
  input.interact = keys.has('KeyE') || keys.has('Space');
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.repeat) return;
  unlockAudio();
  keys.add(e.code);
  syncInput();
  if (e.code === 'KeyM') {
    toggleMute();
    setToast(isMuted() ? 'Sound off (M to unmute)' : 'Sound on', '#ffd76a');
  }
  if (e.code === 'KeyP') {
    if (game.phase === 'play') {
      game.phase = 'paused';
      stopSizzle();
    } else if (game.phase === 'paused') {
      game.phase = 'play';
    }
  }
  if (e.code === 'Enter' || e.code === 'NumpadEnter') {
    if (game.phase === 'title' || game.phase === 'over') startShift();
    else if (game.phase === 'paused') game.phase = 'play';
  }
  if ((e.code === 'KeyE' || e.code === 'Space') && game.phase === 'play') {
    doInteract();
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
  syncInput();
});

canvas.addEventListener('pointerdown', (e) => {
  unlockAudio();
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 1280;
  const y = ((e.clientY - rect.top) / rect.height) * 800;
  if (game.phase === 'title' || game.phase === 'over') {
    startShift();
    return;
  }
  if (game.phase === 'paused') {
    game.phase = 'play';
    return;
  }
  if (game.phase !== 'play') return;
  // Clicking a station walks the chef there and uses it on arrival.
  for (const s of Object.values(STATIONS)) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) {
      const spot = stationApproach(s);
      game.player.target = spot;
      game.player.pendingStation = s.id;
      return;
    }
  }
  game.player.target = { x, y };
  game.player.pendingStation = null;
});

// --- The loop ------------------------------------------------------------

function step(dt) {
  game.time += dt;
  if (game.phase !== 'play') return;
  game.elapsed += dt;
  game.shiftLeft = Math.max(0, SHIFT_SECONDS - game.elapsed);

  movePlayer(game.player, input, dt);
  game.nearStation = nearestStation(game.player);

  // Click-to-interact: arrived at the station, use it once.
  if (game.player.pendingStation && !game.player.target && !game.player.moving) {
    const station = STATIONS[game.player.pendingStation];
    game.player.pendingStation = null;
    if (station && nearestStation(game.player) === station) doInteract();
  }

  // Hold E at the board to chop.
  const near = game.nearStation;
  game.chopping = Boolean(input.interact && near && near.id === 'board' && game.kitchen.board && !game.kitchen.board.done);
  if (game.chopping) {
    if (chopTick(game.kitchen, dt)) {
      playChop();
      playDing();
      setToast('Chopped! Press E to take it', '#7be382');
    } else if (Math.random() < dt * 6) {
      playChop();
    }
  }

  updateKitchen(game.kitchen, dt);
  const anyCooking = game.kitchen.burners.some((b) => b && b.state === 'cooking');
  if (anyCooking) startSizzle();
  else stopSizzle();

  const expired = updateOrders(game.board, dt, game.elapsed, SHIFT_SECONDS, rng);
  for (const order of expired) {
    game.stars -= 1;
    playBurnt();
    setToast(`Order expired: ${order.recipeId.replace(/-/g, ' ')} — lost a star`, '#ff9d8a');
    if (game.stars <= 0) {
      endShift('failed');
      return;
    }
  }

  if (game.toast) {
    game.toast.life -= dt;
    if (game.toast.life <= 0) game.toast = null;
  }
  for (const pt of game.particles) {
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 60 * dt;
  }
  game.particles = game.particles.filter((pt) => pt.life > 0);

  if (game.shiftLeft <= 0) {
    endShift('complete');
  }
}

let last = performance.now();
let acc = 0;

function frame(now) {
  const dt = Math.min(MAX_FRAME, (now - last) / 1000);
  last = now;
  acc += dt;
  while (acc >= STEP) {
    step(STEP);
    acc -= STEP;
  }
  renderer.draw(game);
  requestAnimationFrame(frame);
}

if (shot) {
  stageShot(game, shot);
  renderer.draw(game);
  renderer.draw(game);
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}

window.__sizzle = {
  get game() { return game; },
  newGame,
  startShift,
};
